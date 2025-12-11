import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
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
        // rapid check if it looks like JSON to avoid parsing everything
        if (!input.trim().startsWith('{')) return input;

        const parsed = JSON.parse(input);
        
        // If it's a simple object, convert keys and values to a description
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            const descriptionParts = Object.entries(parsed).map(([key, value]) => {
                // Ignore empty values
                if (!value) return null;
                // If the key is generic like "prompt" or "text", just use the value
                if (['prompt', 'text', 'description', 'image'].includes(key.toLowerCase())) {
                    return `${value}`;
                }
                // Otherwise format as "Key: Value"
                return `${key}: ${value}`;
            }).filter(Boolean);
            
            return descriptionParts.join(', ');
        }
        return input;
    } catch (e) {
        // Not valid JSON, return original input
        return input;
    }
};

export const enhancePrompt = async (input: string, style: string = 'None'): Promise<string> => {
    const ai = getClient();
    
    // UPGRADE: Using Gemini 3.0 Pro for superior prompt understanding and creative expansion
    const model = 'gemini-3-pro-preview';

    const systemContext = `You are a legendary AI Art Director and Prompt Engineer. 
    Your goal is to transform simple user ideas into "Hall of Fame" worthy image generation prompts.`;
    
    const styleInstruction = style && style !== 'None' 
        ? `Integrate the "${style}" art style naturally into the description (e.g., "A breathtaking ${style} illustration of...").` 
        : "Choose the most visually striking aesthetic that fits the subject.";

    const promptText = `
    ${systemContext}

    TASK:
    Rewrite the following Input Concept into a highly detailed, vivid, and cohesive image prompt.
    
    INPUT CONCEPT: "${input}"
    TARGET STYLE: "${style}"

    CRITICAL RULES:
    1. ${styleInstruction}
    2. VISUALS: Describe lighting (volumetric, cinematic, neon), texture (rough, polished, matte), and camera details (8k, depth of field, wide angle).
    3. CONTENT: Expand on the subject's pose, expression, and environment.
    4. OUTPUT FORMAT: A single, flowing paragraph. Do NOT use bullet points. Do NOT use prefixes like "Prompt:" or "Anime style:".
    5. LENGTH: approximately 50-75 words.
    
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
        return input;
    } catch (error) {
        console.error("Prompt Enhancement Failed:", error);
        // Graceful fallback
        return input; 
    }
};

export const detectStyleFromPrompt = async (prompt: string, availableStyles: string[]): Promise<string> => {
    // 1. REFLEX LAYER (Local Optimization)
    // If the user explicitly names a style, snap to it immediately.
    // This saves an API call and makes the UI feel instant.
    const lowerPrompt = prompt.toLowerCase();
    
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
    
    Description: "${prompt}"
    
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

    const instructions = `
    Analyze this image. 
    Write a short, immersive, sci-fi or fantasy "Lore Entry" (approx 50 words) describing the subject as if it were a real entity or location in a fictional universe.
    
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

    // Construct the final prompt
    let finalPrompt = prompt;
    
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
    } catch (error) {
        console.error("Image Generation Error:", error);
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
                prompt: prompt || "Animate this image", // Prompt is optional but recommended
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
                prompt: prompt,
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
            
            // Fetch the actual video bytes using the API key
            // Note: getClient has logic to throw if key is missing, so we access process.env.API_KEY OR local storage logic
            // Since we are in the service, we can't easily reach getClient().apiKey if we didn't expose it.
            // Better to re-fetch the key from storage or env:
            const apiKey = process.env.API_KEY || getStoredApiKey();

            if (!apiKey) throw new Error("API Key missing during video fetch");

            // Smart separator detection for append
            const separator = videoUri.includes('?') ? '&' : '?';
            const fetchUrl = `${videoUri}${separator}key=${apiKey}`;

            try {
                // Try to fetch as blob (Ideal)
                const videoResponse = await fetch(fetchUrl);
                
                // CRITICAL FIX: Check if the response is valid (200 OK)
                if (!videoResponse.ok) {
                   throw new Error(`Fetch failed: ${videoResponse.status}`);
                }
    
                const videoBlob = await videoResponse.blob();
                // FORCE MP4 MIME TYPE: Browser sometimes fails to detect type from raw bytes
                const mp4Blob = new Blob([videoBlob], { type: 'video/mp4' });
                return URL.createObjectURL(mp4Blob);
                
            } catch (e) {
                // FALLBACK: Return the direct authenticated URL
                // This handles CORS issues where fetch() fails but <video src="..."> might succeed
                console.warn("Direct video blob fetch failed (likely CORS). Falling back to remote URL.", e);
                return fetchUrl;
            }
        }

        throw new Error("Video generation completed but no URI returned.");

    } catch (error) {
        console.error("Video Generation Error:", error);
        throw error;
    }
};