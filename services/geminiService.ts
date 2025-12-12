
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { AppConfig, ModelType } from "../types";
import { getStoredApiKey } from "./storageService";

const getClient = () => {
    // 1. Try Environment Variable (Build time)
    let apiKey = process.env.API_KEY;
    
    // 2. Try Local Storage (Runtime / BYOK)
    if (!apiKey) {
        const storedKey = getStoredApiKey();
        if (storedKey) apiKey = storedKey;
    }

    if (!apiKey) {
        throw new Error("API Key not found. Please connect your Google Cloud API key in settings.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to flatten JSON prompts into descriptive text
const parseJsonPrompt = (input: string): string => {
    try {
        const trimmed = input.trim();
        // rapid check if it looks like JSON to avoid parsing everything
        if (!trimmed.startsWith('{')) return input;

        const parsed = JSON.parse(trimmed);
        
        // RECURSIVE FLATTENER: Handles nested objects and arrays
        const flattenObject = (obj: any, prefix = ''): string[] => {
            let parts: string[] = [];
            
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    const cleanKey = key.replace(/_/g, ' '); // Turn "composition_rules" into "composition rules"

                    // Skip metadata/technical fields that don't help the visual generation much
                    if (['confidence_score', 'metadata', 'technical_specs', 'id'].includes(key.toLowerCase())) {
                        continue;
                    }

                    if (typeof value === 'string') {
                        // If the key is generic, just use value. If specific, use Key: Value
                        if (['prompt', 'text', 'description', 'content', 'value'].includes(key.toLowerCase())) {
                            parts.push(value);
                        } else {
                            parts.push(`${cleanKey}: ${value}`);
                        }
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        parts.push(`${cleanKey}: ${value}`);
                    } else if (Array.isArray(value)) {
                        // Join arrays naturally
                        const arrayContent = value.map(v => {
                            if (typeof v === 'object') return flattenObject(v).join(', ');
                            return v;
                        }).join(', ');
                        if (arrayContent) parts.push(`${cleanKey}: ${arrayContent}`);
                    } else if (typeof value === 'object' && value !== null) {
                        // Recursively flatten nested objects
                        const nested = flattenObject(value);
                        if (nested.length > 0) {
                            parts.push(...nested);
                        }
                    }
                }
            }
            return parts;
        };

        const descriptiveParts = flattenObject(parsed);
        
        // If parsing resulted in valid parts, join them. Otherwise return original.
        if (descriptiveParts.length > 0) {
            console.log("JSON Prompt Detected. Flattened to:", descriptiveParts.join(', '));
            return descriptiveParts.join(', ');
        }
        
        return input;
    } catch (e) {
        // Not valid JSON or parsing failed, return original input
        return input;
    }
};

export const enhancePrompt = async (input: string, style: string = 'None'): Promise<string> => {
    const ai = getClient();
    
    // UPGRADE: Using Gemini 3.0 Pro for superior prompt understanding and creative expansion
    const model = 'gemini-3-pro-preview';

    // Parse JSON if present before sending to enhancer
    // If it's JSON, we want the LLM to explicitly translate it, not just enhance it.
    let isJson = input.trim().startsWith('{');
    const cleanedInput = parseJsonPrompt(input);

    const systemContext = `You are a legendary AI Art Director and Prompt Engineer. 
    Your goal is to transform user ideas (which may be raw text or structured data) into "Hall of Fame" worthy image generation prompts.`;
    
    const styleInstruction = style && style !== 'None' 
        ? `Integrate the "${style}" art style naturally into the description (e.g., "A breathtaking ${style} illustration of...").` 
        : "Choose the most visually striking aesthetic that fits the subject.";

    const taskInstruction = isJson 
        ? `TASK: The user has provided a JSON object containing detailed image specifications. Translate this structured data into a cohesive, flowing visual description.`
        : `TASK: Rewrite the following Input Concept into a highly detailed, vivid, and cohesive image prompt.`;

    const promptText = `
    ${systemContext}

    ${taskInstruction}
    
    INPUT DATA: "${cleanedInput}"
    TARGET STYLE: "${style}"

    CRITICAL RULES:
    1. ${styleInstruction}
    2. VISUALS: Describe lighting (volumetric, cinematic, neon), texture (rough, polished, matte), and camera details (8k, depth of field, wide angle).
    3. CONTENT: Expand on the subject's pose, expression, and environment based on the input data.
    4. OUTPUT FORMAT: A single, flowing paragraph. Do NOT use bullet points. Do NOT use prefixes like "Prompt:" or "Anime style:".
    5. LENGTH: approximately 50-100 words.
    
    Generate the prompt now:
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: promptText }]
            },
            config: {
                temperature: 0.8, // High creativity
                maxOutputTokens: 1000, // Plenty of space
                // Relax safety settings to prevent false positives when describing artistic concepts
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                ]
            }
        });
        
        const text = response.text;
        
        if (text) {
             let clean = text.trim();
             // Remove quotes if the model wrapped it
             if (clean.startsWith('"') && clean.endsWith('"')) {
                 clean = clean.slice(1, -1);
             }
             // Remove common prefixes that models sometimes add despite instructions
             clean = clean.replace(/^(Here is the prompt|Prompt|Output|Enhanced|Sure|Okay|The image shows):?\s*/i, '');
             
             // Remove style prefixes like "Anime Style: ..." to keep it natural
             if (style && style !== 'None') {
                 const stylePrefixRegex = new RegExp(`^${style}\\s*(style|art)?[:.]\\s*`, 'i');
                 clean = clean.replace(stylePrefixRegex, '');
             }

             return clean.trim();
        }
        
        // Fallback
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts?.[0]?.text) {
             return response.candidates[0].content.parts[0].text.trim();
        }
        
        // If empty, just return the input rather than throwing an error
        console.warn("Enhancer returned empty text, using original.");
        return cleanedInput;
    } catch (error) {
        console.error("Prompt Enhancement Failed:", error);
        // Graceful fallback
        return cleanedInput; 
    }
};

export const describeImage = async (imageBase64: string): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3-pro-preview'; // Gemini 3 Pro has excellent vision capabilities

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    const prompt = `
    You are an expert Prompt Engineer for AI Art Generators.
    Analyze the uploaded image and reverse-engineer a high-quality text prompt that would generate an image looking exactly like this one.
    
    Include specific details about:
    1. Subject matter and action
    2. Art Style (e.g. Cyberpunk, Oil Painting, Anime, Photography)
    3. Lighting and Color Palette
    4. Composition and Camera angle
    5. Technical keywords (e.g. 4k, octane render, depth of field)

    Output ONLY the raw prompt text. Do not add conversational filler.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
            }
        });
        
        return response.text?.trim() || "Failed to analyze image.";
    } catch (error) {
        console.error("Describe Image Error:", error);
        throw error;
    }
};

export const extractStyle = async (imageBase64: string): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3-pro-preview';

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    const prompt = `
    Analyze the uploaded image. Extract ONLY the artistic style descriptors, visual technique, medium, and lighting keywords.
    Do NOT describe the subject content (e.g. ignore "a woman", "a car", "a building").
    
    Focus on:
    - Art Medium (e.g. "Oil painting", "3D Render", "Polaroid photo")
    - Aesthetic (e.g. "Cyberpunk", "Vaporwave", "Minimalist")
    - Lighting/Color (e.g. "Neon lighting", "Pastel palette", "High contrast")
    - Technique (e.g. "Impasto", "Cel shaded", "Bokeh")
    
    Format: Comma-separated list of keywords.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
            }
        });
        return response.text?.trim() || "";
    } catch (error) {
        console.error("Style Extraction Error:", error);
        return "";
    }
};

// --- AUDIO / TTS ---

// Helper for PCM decoding
const decodeBase64 = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const rawDataToAudioBuffer = async (pcmData: Uint8Array, sampleRate = 24000): Promise<AudioBuffer> => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    
    // Convert 16-bit PCM to Float32
    const inputData = new Int16Array(pcmData.buffer);
    const float32Data = new Float32Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
        float32Data[i] = inputData[i] / 32768.0;
    }

    const buffer = audioCtx.createBuffer(1, float32Data.length, sampleRate);
    buffer.getChannelData(0).set(float32Data);
    return buffer;
};

export const generateSpeech = async (text: string): Promise<string> => {
    // Returns a Base64 string of the PCM data from Gemini TTS
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        return base64Audio;
    } catch (error) {
        console.error("TTS Generation Error:", error);
        throw error;
    }
};

export const playAudioData = async (base64PCM: string) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        const pcmBytes = decodeBase64(base64PCM);
        const buffer = await rawDataToAudioBuffer(pcmBytes, 24000);
        
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        
        return {
            stop: () => source.stop(),
            duration: buffer.duration
        };
    } catch (e) {
        console.error("Audio Playback Error:", e);
        throw e;
    }
};

export const detectStyleFromPrompt = async (prompt: string, availableStyles: string[]): Promise<string> => {
    // 1. REFLEX LAYER (Local Optimization)
    // If the user explicitly names a style, snap to it immediately.
    // This saves an API call and makes the UI feel instant.
    const lowerPrompt = parseJsonPrompt(prompt).toLowerCase();
    
    // Check for exact style names or strong keywords
    // We sort by length descending to match "Dark Fantasy" before just "Fantasy"
    const sortedStyles = [...availableStyles].sort((a, b) => b.length - a.length);

    for (const style of sortedStyles) {
        // specific mapping for common variations
        const keywords = [style.toLowerCase()];
        if (style === 'Photorealistic') keywords.push('photoreal', 'realistic', 'photo', '4k');
        if (style === 'Isometric 3D') keywords.push('isometric');
        if (style === 'Origami Paper Art') keywords.push('origami', 'paper');
        if (style === '3D Render') keywords.push('3d', 'blender', 'unreal');
        
        if (keywords.some(k => lowerPrompt.includes(k))) {
            return style;
        }
    }

    const ai = getClient();
    const model = 'gemini-3-pro-preview';

    if (!prompt || prompt.trim().length < 5) return 'None';

    const stylesList = availableStyles.join(', ');
    const instruction = `
    Analyze the following image description and select the BEST matching art style from the provided list.
    
    Description: "${lowerPrompt}"
    
    Available Styles: [${stylesList}, None]
    
    Rules:
    - Return ONLY the exact name of the style from the list.
    - If the prompt strongly suggests a specific style (e.g. "neon lights" -> Cyberpunk, "paper fold" -> Origami), pick it.
    - If no specific style fits well, return "None".
    - Do not add explanations.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: instruction }] }
        });

        const text = response.text?.trim();
        if (text && (availableStyles.includes(text) || text === 'None')) {
            return text;
        }
        return 'None';
    } catch (e) {
        console.error("Style Detection Failed:", e);
        return 'None';
    }
};

export const generateBackstory = async (imageBase64: string, prompt: string): Promise<string> => {
    const ai = getClient();
    // UPGRADE: Using Gemini 3.0 Pro for richer storytelling and lore generation
    const model = 'gemini-3-pro-preview'; 

    // Strip header if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    // Parse the prompt if it's JSON to give the backstory generator context
    const contextPrompt = parseJsonPrompt(prompt);

    const instructions = `
    Analyze this image. 
    Write a short, immersive, sci-fi or fantasy "Lore Entry" (approx 50 words) describing the subject as if it were a real entity or location in a fictional universe.
    
    Context: ${contextPrompt}

    Style: Mysterious, cinematic, and "data-log" style.
    Start with a designation or location name (e.g. "Subject: X-99" or "Location: Sector 4").
    Do not mention that it is an AI image. Treat it as real.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: instructions },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }
        });

        return response.text || "Data corrupted. Unable to retrieve archives.";
    } catch (error) {
        console.error("Backstory Generation Error:", error);
        return "Connection to Neural Archive failed.";
    }
};

export const logFeedback = (feedbackType: 'up' | 'down', prompt: string, model: string) => {
    // This is where you would hook into a real logging service (Google Analytics, Firebase, or custom backend)
    console.group("User Feedback");
    console.log("Type:", feedbackType);
    console.log("Model:", model);
    console.log("Prompt:", prompt);
    console.log("Timestamp:", new Date().toISOString());
    console.groupEnd();
};

export const shareMedia = async (url: string, title: string, text: string): Promise<void> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const mimeType = blob.type;
        const extension = mimeType.split('/')[1] || 'png';
        const file = new File([blob], `generated-art.${extension}`, { type: mimeType });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title,
                text,
                files: [file]
            });
        } else {
            // Fallback: Copy image/video to clipboard if supported, or just alert
            if (mimeType.startsWith('image') && typeof ClipboardItem !== 'undefined') {
                try {
                     await navigator.clipboard.write([
                        new ClipboardItem({
                            [mimeType]: blob
                        })
                    ]);
                    alert("Image copied to clipboard!");
                } catch (e) {
                    throw new Error("Sharing not supported on this device/browser.");
                }
            } else {
                throw new Error("Native sharing not supported. Please download the file.");
            }
        }
    } catch (error) {
        console.error("Share failed:", error);
        throw error;
    }
};

export const generateImage = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    const { prompt, model, aspectRatio, style, negativePrompt, seed, imageSize } = config;

    // 1. SMART PROMPT HANDLING
    // If the input is JSON, we MUST convert it to a natural language description using the LLM first.
    // Image models (especially Gemini 3 Image) struggle with raw structured data dumps.
    // Text models (Gemini 3 Pro) excel at interpreting this data.
    let finalPrompt = prompt;
    
    if (prompt.trim().startsWith('{')) {
        console.log("JSON Input detected. Using Gemini Text Model to translate to Image Prompt...");
        try {
            // We use the same enhancePrompt function but it's now context-aware for JSON
            finalPrompt = await enhancePrompt(prompt, style);
            console.log("JSON Translated to:", finalPrompt);
        } catch (e) {
            console.warn("JSON Translation failed, falling back to flattener.", e);
            finalPrompt = parseJsonPrompt(prompt);
        }
    } else {
        // Normal text prompt, just clean it if needed
        finalPrompt = parseJsonPrompt(prompt);
    }
    
    try {
        if (model === ModelType.IMAGEN_4) {
            // IMAGEN 4 LOGIC
            const response = await ai.models.generateImages({
                model: model,
                prompt: finalPrompt,
                config: {
                    numberOfImages: 1,
                    aspectRatio: aspectRatio as any, // Cast to expected type if needed
                    outputMimeType: 'image/jpeg',
                    // safetySettings: ...
                }
            });
            
            if (response.generatedImages && response.generatedImages.length > 0) {
                 const base64 = response.generatedImages[0].image.imageBytes;
                 return `data:image/jpeg;base64,${base64}`;
            }
            throw new Error("Imagen generation failed: No images returned.");

        } else {
            // GEMINI (NANO BANANA) LOGIC
            const isPro = model === ModelType.GEMINI_PRO_IMAGE;
            
            // Explicitly command the model to generate an image to avoid chatty refusals
            const imagePrompt = `Generate a high-quality image of: ${finalPrompt}`;
            const parts: any[] = [{ text: imagePrompt }];
            
            if (negativePrompt) {
                parts[0].text += `\n\n(Negative prompt / Avoid: ${negativePrompt})`;
            }

            console.log(`[Gemini] Generating image with model: ${model}, ratio: ${aspectRatio}, size: ${isPro ? imageSize : 'Default'}`);

            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: parts
                },
                config: {
                    imageConfig: {
                         aspectRatio: aspectRatio,
                         imageSize: isPro ? imageSize : undefined // Only Pro supports size selection
                    },
                    // Relax safety settings slightly to prevent "Text Refusal" instead of image generation
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    ]
                }
            });

            console.log("[Gemini] Response:", response);

            // Parse response for image
            if (response.candidates && response.candidates.length > 0) {
                 const candidate = response.candidates[0];
                 
                 // 1. Check for Safety Stop
                 if (candidate.finishReason === 'SAFETY') {
                     throw new Error("Generation blocked by safety filters. Please modify your prompt to be less explicit or violent.");
                 }
                 
                 // 2. Check content parts
                 const content = candidate.content;
                 if (content?.parts) {
                     for (const part of content.parts) {
                         if (part.inlineData && part.inlineData.data) {
                             return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                         }
                     }
                     
                     // 3. Check for text refusal or "Chatty Failure" (e.g. "Here is your image..." but no image data)
                     const textPart = content.parts.find(p => p.text);
                     if (textPart && textPart.text) {
                         const text = textPart.text;
                         const lowerText = text.toLowerCase();

                         // Detect conversational success messages that mask a failure
                         // Matches: "Here is", "Here's", "I have generated", "Absolutely", "Sure"
                         const successPhrases = [
                            /here('s| is)/i,
                            /generated (an|the) image/i,
                            /image (of|showing)/i,
                            /sure/i,
                            /absolutely/i,
                            /okay/i
                         ];

                         if (successPhrases.some(regex => text.match(regex))) {
                             throw new Error("Gemini Glitch: The model confirmed generation but failed to return image data. Please try again.");
                         }

                         // Clean up the error message length for display
                         const cleanError = text.length > 150 ? text.substring(0, 150) + "..." : text;
                         throw new Error(`Model Refusal: ${cleanError}`);
                     }
                 }
            }
            
            throw new Error("Gemini generation failed: No valid image data found in response.");
        }
    } catch (error: any) {
        console.error("Image Generation Error:", error);
        
        // Handle Service Worker / Network Timeouts explicitly
        if (error.name === 'AbortError' || error.message.includes('aborted') || error.message.includes('ServiceWorker')) {
             throw new Error("Connection Timeout: The high-fidelity model took too long. Please try the 'Gemini Flash' model or simplify your prompt.");
        }
        
        throw error;
    }
};

export const upscaleImage = async (imageBase64: string, aspectRatio: string): Promise<string> => {
    // This is a mock implementation because true upscaling isn't a direct API call in this SDK yet
    // However, we can use the "Edit" pattern: Send the image back to Gemini Pro with a prompt to "Refine and upscale"
    
    const ai = getClient();
    const model = ModelType.GEMINI_PRO_IMAGE; // Use the powerful model

    // Strip header if present for sending to API
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

    const prompt = "Enhance this image to 4K resolution. Increase detail, sharpen textures, improve lighting, and fix artifacts. Keep the original composition exactly the same.";

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: '4K'
                }
            }
        });

        if (response.candidates && response.candidates.length > 0) {
            const content = response.candidates[0].content;
            if (content.parts) {
                for (const part of content.parts) {
                    if (part.inlineData) {
                        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    }
                }
            }
        }
        throw new Error("Upscaling failed.");
    } catch (error) {
        console.error("Upscale Error:", error);
        throw error;
    }
};

export const generateVideo = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    let { prompt, aspectRatio, inputImage, seed } = config;

    // Use Veo model
    const model = ModelType.VEO_FAST;
    
    // Parse JSON for Video Prompts
    const finalPrompt = parseJsonPrompt(prompt);

    // Validate Aspect Ratio for Veo (must be 16:9 or 9:16)
    if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        aspectRatio = '16:9'; // Fallback
    }

    try {
        let operation;

        if (inputImage) {
            // Image-to-Video
            const base64Data = inputImage.replace(/^data:image\/\w+;base64,/, "");
            const mimeType = inputImage.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';

            operation = await ai.models.generateVideos({
                model: model,
                prompt: finalPrompt || "Animate this image", // Prompt is optional but recommended
                image: {
                    imageBytes: base64Data,
                    mimeType: mimeType
                },
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as '16:9' | '9:16',
                    // seed: seed !== -1 ? seed : undefined, // Veo SDK might not support seed yet directly in this typed helper, omit if causing issues
                }
            });
        } else {
            // Text-to-Video
            operation = await ai.models.generateVideos({
                model: model,
                prompt: finalPrompt,
                config: {
                    numberOfVideos: 1,
                    resolution: '720p',
                    aspectRatio: aspectRatio as '16:9' | '9:16',
                }
            });
        }

        // Poll for completion
        // Note: In a real app, you might want to handle this asynchronously via a job queue or UI notification
        // so the user isn't stuck waiting with an open connection, but for this demo we await.
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            const videoUri = operation.response.generatedVideos[0].video.uri;
            
            // Re-fetch key logic to ensure we get the correct one even if process.env.API_KEY is empty/invalid
            let apiKey = process.env.API_KEY;
            
            // If process.env.API_KEY is empty string (common in vite env replacement), fallback to storage
            if (!apiKey || apiKey.trim() === '') {
                apiKey = getStoredApiKey() || '';
            }

            if (!apiKey) throw new Error("API Key missing during video fetch");
            
            // Trim just in case
            apiKey = apiKey.trim();

            try {
                // Method 1: Try with header (Cleanest, standard for Google GenAI SDK)
                // This usually bypasses CORS issues if the key is allowed for this referer
                const videoResponse = await fetch(videoUri, {
                    headers: {
                        'x-goog-api-key': apiKey
                    }
                });
                
                if (videoResponse.ok) {
                     const videoBlob = await videoResponse.blob();
                     return URL.createObjectURL(new Blob([videoBlob], { type: 'video/mp4' }));
                }

                // Method 2: Fallback to Query Param (if header fails)
                const separator = videoUri.includes('?') ? '&' : '?';
                const fetchUrl = `${videoUri}${separator}key=${apiKey}`;
                
                const fallbackResponse = await fetch(fetchUrl);
                if (!fallbackResponse.ok) {
                    const errorText = await fallbackResponse.text().catch(() => 'Unknown error');
                    console.error("Video Fetch Failed. Status:", fallbackResponse.status, "Body:", errorText);
                    throw new Error(`Fetch failed: ${fallbackResponse.status}`);
                }
    
                const videoBlob = await fallbackResponse.blob();
                const mp4Blob = new Blob([videoBlob], { type: 'video/mp4' });
                return URL.createObjectURL(mp4Blob);
                
            } catch (e) {
                // FALLBACK: Return the direct authenticated URL
                // This handles CORS issues where fetch() fails but <video src="..."> might succeed
                console.warn("Direct video blob fetch failed. Falling back to remote URL.", e);
                const separator = videoUri.includes('?') ? '&' : '?';
                return `${videoUri}${separator}key=${apiKey}`;
            }
        }

        throw new Error("Video generation completed but no URI returned.");

    } catch (error) {
        console.error("Video Generation Error:", error);
        throw error;
    }
};
