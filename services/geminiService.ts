
import { GoogleGenAI } from "@google/genai";
import { AppConfig, ModelType } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
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
        
        throw new Error("No text returned from enhancer.");
    } catch (error) {
        console.error("Prompt Enhancement Failed:", error);
        throw error; 
    }
};

export const detectStyleFromPrompt = async (prompt: string, availableStyles: string[]): Promise<string> => {
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
    
    // For Imagen, we can use the aspect ratio config directly. 
    // For Gemini Flash/Pro, we might need to append it to the prompt if strict sizing isn't supported via config API yet (though ImageConfig supports it).
    
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
            
            // Build content parts
            const parts: any[] = [{ text: finalPrompt }];
            
            // Note: Negative prompt is not strictly supported in generateContent for Gemini yet in the same way as SD, 
            // but we can append it to the text prompt for better adherence.
            if (negativePrompt) {
                parts[0].text += `\n\n(Negative prompt / Avoid: ${negativePrompt})`;
            }

            const response = await ai.models.generateContent({
                model: model,
                contents: {
                    parts: parts
                },
                config: {
                    imageConfig: {
                         aspectRatio: aspectRatio,
                         imageSize: isPro ? imageSize : undefined // Only Pro supports size selection
                    }
                }
            });

            // Parse response for image
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
            
            throw new Error("Gemini generation failed: No image data found in response.");
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
            const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const videoBlob = await videoResponse.blob();
            return URL.createObjectURL(videoBlob);
        }

        throw new Error("Video generation completed but no URI returned.");

    } catch (error) {
        console.error("Video Generation Error:", error);
        throw error;
    }
};
