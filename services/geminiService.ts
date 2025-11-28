
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

export const enhancePrompt = async (input: string): Promise<string> => {
    const ai = getClient();
    
    // Use Gemini 2.0 Flash Exp for broad availability/free tier support for text tasks
    const model = 'gemini-2.0-flash-exp';

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ 
                    text: `Rewrite this image generation prompt to be more descriptive, artistic, and detailed. 
                    Include keywords for lighting, style, composition, and texture. 
                    Keep it under 75 words. 
                    Output ONLY the raw prompt text.
                    
                    User Prompt: "${input}"` 
                }]
            },
            config: {
                systemInstruction: "You are an expert AI prompt engineer. Rewrite simple user prompts into detailed, high-quality image generation prompts. Output only the prompt text.",
                temperature: 0.7,
                maxOutputTokens: 200,
                // safetySettings removed to use defaults
            }
        });
        
        const text = response.text;
        
        if (text) {
             let clean = text.trim();
             // Remove quotes if the model wrapped it
             if (clean.startsWith('"') && clean.endsWith('"')) {
                 clean = clean.slice(1, -1);
             }
             // Remove 'Here is...' prefixes if any
             clean = clean.replace(/^Here is (the|a) rewritten prompt:?/i, '');
             return clean.trim();
        }
        
        // Fallback if .text is empty but candidates exist
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content?.parts?.[0]?.text) {
             return response.candidates[0].content.parts[0].text.trim();
        }
        
        throw new Error("No text returned from enhancer.");
    } catch (error) {
        console.error("Prompt Enhancement Failed:", error);
        throw error; 
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

export const generateVideo = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    let { prompt, aspectRatio, inputImage, seed } = config;

    // Use Veo model
    const model = ModelType.VEO_FAST;

    // Validate Aspect Ratio for Veo (must be 16:9 or 9:16)
    if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        console.warn(`Invalid aspect ratio '${aspectRatio}' for Veo model. Defaulting to '16:9'.`);
        aspectRatio = '16:9';
    }

    try {
        let request: any = {
            model: model,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p', // Veo Fast supports 720p
                aspectRatio: aspectRatio,
            }
        };

        // If input image exists, use it (Image-to-Video)
        if (inputImage) {
            const matches = inputImage.match(/^data:(.+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                request.image = {
                    mimeType: matches[1],
                    imageBytes: matches[2]
                };
            }
        }
        
        // Seed is handled internally by Veo or random if not exposed, 
        // currently Veo SDK doesn't strictly document 'seed' in config, but we pass valid params.

        console.log("Starting Video Generation...");
        let operation = await ai.models.generateVideos(request);

        // Polling loop
        console.log("Polling for video completion...");
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
            operation = await ai.operations.getVideosOperation({ operation: operation });
            console.log("Video Status:", operation.metadata?.state || 'Processing');
        }

        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) {
            throw new Error("No video URI returned.");
        }

        // Fetch the video content using the API Key to get a playable Blob URL
        const apiKey = process.env.API_KEY;
        const videoResponse = await fetch(`${videoUri}&key=${apiKey}`);
        
        if (!videoResponse.ok) {
            throw new Error("Failed to download generated video.");
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error: any) {
        console.error("Veo API Error:", error);
        throw error;
    }
};

export const generateImage = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    const { model, prompt, negativePrompt, aspectRatio, imageSize, enableNSFW, inputImage, seed } = config;

    let processedPrompt = prompt;
    // Skip JSON flattening for Gemini 2.5 as it handles structured prompts well
    if (model !== ModelType.GEMINI_FLASH_IMAGE) {
         processedPrompt = parseJsonPrompt(prompt);
    }

    let finalPrompt = '';
    
    // Handle cases where prompt might be empty but image is provided
    if (processedPrompt && processedPrompt.trim()) {
        finalPrompt = `Create an image of ${processedPrompt}`;
    } else if (inputImage) {
        finalPrompt = "Generate a high quality creative variation of this image.";
    } else {
        throw new Error("Please describe the image you want to generate.");
    }

    if (negativePrompt) {
        finalPrompt += `\n\nExclude the following elements: ${negativePrompt}`;
    }

    try {
        if (model === ModelType.IMAGEN_4) {
            // Imagen generation (v4)
            if (inputImage) {
               console.warn("Input image provided but Imagen models currently use text-to-image generation in this app configuration.");
            }

            const response = await ai.models.generateImages({
                model: model,
                prompt: finalPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                    // Safety settings removed to use system defaults
                },
            });
            
            if (response.generatedImages && response.generatedImages.length > 0) {
                 const base64 = response.generatedImages[0].image.imageBytes;
                 return `data:image/jpeg;base64,${base64}`;
            }
            throw new Error(`No image generated from ${model}.`);

        } else {
            // Gemini Flash Image, Pro Image, or Flash Exp
            
            const parts: any[] = [];
            
            if (inputImage) {
                const matches = inputImage.match(/^data:(.+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    parts.push({
                        inlineData: {
                            mimeType: matches[1],
                            data: matches[2]
                        }
                    });
                }
            }

            if (finalPrompt) {
                parts.push({ text: finalPrompt });
            }

            if (parts.length === 0) {
                 throw new Error("Please provide a prompt or an image.");
            }

            const generateContentParams: any = {
                model: model,
                contents: {
                    parts: parts,
                },
                config: {
                    systemInstruction: "You are an image generation tool. Do not generate conversational text. Do not say 'Here is an image'. Just generate the image.",
                    imageConfig: {
                         aspectRatio: aspectRatio,
                    },
                    seed: seed !== -1 ? seed : undefined,
                    // Safety settings removed to use system defaults
                }
            };

            if (model === ModelType.GEMINI_PRO_IMAGE && imageSize) {
                generateContentParams.config.imageConfig.imageSize = imageSize;
            }

            const response = await ai.models.generateContent(generateContentParams);

            if (!response.candidates || response.candidates.length === 0) {
                if (response.promptFeedback && response.promptFeedback.blockReason) {
                    throw new Error(`Generation blocked by safety filters (${response.promptFeedback.blockReason}). Try adjusting your prompt.`);
                }
                throw new Error("No candidates returned from model. The prompt might be too vague, or triggered a safety filter.");
            }

            const candidate = response.candidates[0];

            if (candidate.finishReason && candidate.finishReason !== 'STOP') {
                throw new Error(`Generation stopped. Reason: ${candidate.finishReason}`);
            }

            const resParts = candidate.content?.parts;
            if (resParts) {
                let refusalText = '';
                for (const part of resParts) {
                    if (part.inlineData && part.inlineData.data) {
                        const mimeType = part.inlineData.mimeType || 'image/png';
                        return `data:${mimeType};base64,${part.inlineData.data}`;
                    }
                    if (part.text) {
                        refusalText += part.text;
                    }
                }

                if (refusalText) {
                    const cleanRefusal = refusalText.length > 200 ? refusalText.substring(0, 200) + '...' : refusalText;
                    throw new Error(`Model responded with text instead of image: "${cleanRefusal}"`);
                }
            }
            
            throw new Error("No image data found in response.");
        }
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};

export const upscaleImage = async (imageDataUrl: string, aspectRatio: string): Promise<string> => {
    const ai = getClient();
    const model = ModelType.GEMINI_PRO_IMAGE;

    const matches = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error("Invalid image data provided for upscaling.");
    }
    const mimeType = matches[1];
    const data = matches[2];

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType, data } },
                    { text: "High resolution, 4K detailed version of this image." }
                ]
            },
            config: {
                systemInstruction: "You are an image upscaler. Output a high resolution image only.",
                imageConfig: {
                    imageSize: '4K',
                    aspectRatio: aspectRatio
                },
                // Safety settings removed to use system defaults
            }
        });

        if (!response.candidates || response.candidates.length === 0) {
             if (response.promptFeedback && response.promptFeedback.blockReason) {
                throw new Error(`Upscaling blocked by safety filters (${response.promptFeedback.blockReason}).`);
            }
            throw new Error("Upscaling failed: No candidates returned from model.");
        }

        const candidate = response.candidates[0];

        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
             throw new Error(`Upscaling stopped. Reason: ${candidate.finishReason}`);
        }

        const parts = candidate.content?.parts;
        if (parts) {
            let refusalText = '';
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    const resMimeType = part.inlineData.mimeType || 'image/png';
                    return `data:${resMimeType};base64,${part.inlineData.data}`;
                }
                if (part.text) {
                    refusalText += part.text;
                }
            }
            if (refusalText) {
                const cleanRefusal = refusalText.length > 200 ? refusalText.substring(0, 200) + '...' : refusalText;
                throw new Error(`Model responded with text instead of image: "${cleanRefusal}"`);
            }
        }
        
        throw new Error("Upscaling failed: No image data returned.");
    } catch (error) {
        console.error("Upscale API Error:", error);
        throw error;
    }
};
