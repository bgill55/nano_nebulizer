
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { AppConfig, ModelType } from "../types";
import { getStoredApiKey, getStoredHfToken } from "./storageService";

const getClient = () => {
    // Priority: 1. Environment Variable, 2. Local Storage
    let apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === '') {
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
        if (!trimmed.startsWith('{')) return input;
        const parsed = JSON.parse(trimmed);
        
        const flattenObject = (obj: any, prefix = ''): string[] => {
            let parts: string[] = [];
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const value = obj[key];
                    const cleanKey = key.replace(/_/g, ' ');
                    if (['confidence_score', 'metadata', 'technical_specs', 'id'].includes(key.toLowerCase())) continue;

                    if (typeof value === 'string') {
                        if (['prompt', 'text', 'description', 'content', 'value'].includes(key.toLowerCase())) {
                            parts.push(value);
                        } else {
                            parts.push(`${cleanKey}: ${value}`);
                        }
                    } else if (typeof value === 'number' || typeof value === 'boolean') {
                        parts.push(`${cleanKey}: ${value}`);
                    } else if (Array.isArray(value)) {
                        const arrayContent = value.map(v => {
                            if (typeof v === 'object') return flattenObject(v).join(', ');
                            return v;
                        }).join(', ');
                        if (arrayContent) parts.push(`${cleanKey}: ${arrayContent}`);
                    } else if (typeof value === 'object' && value !== null) {
                        const nested = flattenObject(value);
                        if (nested.length > 0) parts.push(...nested);
                    }
                }
            }
            return parts;
        };

        const descriptiveParts = flattenObject(parsed);
        return descriptiveParts.length > 0 ? descriptiveParts.join(', ') : input;
    } catch (e) {
        return input;
    }
};

export const enhancePrompt = async (input: string, style: string = 'None'): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3-pro-preview';
    const cleanedInput = parseJsonPrompt(input);

    const promptText = `
    You are a legendary AI Art Director. Transform the input Concept into a "Hall of Fame" image prompt.
    INPUTコンセプト: "${cleanedInput}"
    TARGET STYLE: "${style}"
    RULES: A single flowing paragraph. Describe lighting, texture, and camera details. Approx 50-100 words.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: promptText }] },
            config: { temperature: 0.8 }
        });
        return response.text?.trim() || cleanedInput;
    } catch (error) {
        return cleanedInput; 
    }
};

export const describeImage = async (imageBase64: string): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3-pro-preview';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const prompt = `Analyze the image and reverse-engineer a high-quality prompt. Output ONLY the raw prompt text.`;

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
        throw error;
    }
};

export const extractStyle = async (imageBase64: string): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3-pro-preview';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const prompt = `Extract ONLY artistic style descriptors, visual technique, medium, and lighting keywords. No subject description. Format: Comma-separated list.`;

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
        return "";
    }
};

// --- HUGGING FACE INTEGRATION ---

export const generateImageFromHf = async (prompt: string, model: string): Promise<string> => {
    const token = getStoredHfToken();
    if (!token) {
        throw new Error("Hugging Face Token not found. Please add your token in Settings to use free models.");
    }

    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${model}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: prompt,
                    options: { wait_for_model: true } // Crucial for HF cold starts
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            let errorMessage = response.statusText;
            try {
                const errJson = JSON.parse(errText);
                errorMessage = errJson.error || errorMessage;
            } catch(e) {}
            throw new Error(`HF Error: ${errorMessage}`);
        }

        const result = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read image blob"));
            reader.readAsDataURL(result);
        });
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error("Network error: Could not reach Hugging Face. Check your internet or ad-blocker.");
        }
        throw error;
    }
};

// --- AUDIO / TTS ---

const decodeBase64 = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
};

const rawDataToAudioBuffer = async (pcmData: Uint8Array, sampleRate = 24000): Promise<AudioBuffer> => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
    const inputData = new Int16Array(pcmData.buffer);
    const float32Data = new Float32Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) float32Data[i] = inputData[i] / 32768.0;
    const buffer = audioCtx.createBuffer(1, float32Data.length, sampleRate);
    buffer.getChannelData(0).set(float32Data);
    return buffer;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data returned");
        return base64Audio;
    } catch (error) {
        throw error;
    }
};

export const playAudioData = async (base64PCM: string) => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        const pcmBytes = decodeBase64(base64PCM);
        const buffer = await rawDataToAudioBuffer(pcmBytes, 24000);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        return { stop: () => source.stop(), duration: buffer.duration };
    } catch (e) {
        throw e;
    }
};

export const detectStyleFromPrompt = async (prompt: string, availableStyles: string[]): Promise<string> => {
    const lowerPrompt = parseJsonPrompt(prompt).toLowerCase();
    const sortedStyles = [...availableStyles].sort((a, b) => b.length - a.length);
    for (const style of sortedStyles) {
        const keywords = [style.toLowerCase()];
        if (style === 'Photorealistic') keywords.push('photoreal', 'realistic', 'photo', '4k');
        if (keywords.some(k => lowerPrompt.includes(k))) return style;
    }

    const ai = getClient();
    const model = 'gemini-3-pro-preview';
    if (!prompt || prompt.trim().length < 5) return 'None';
    const instruction = `Pick the BEST art style from [${availableStyles.join(', ')}] for: "${lowerPrompt}". Return ONLY the style name.`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: instruction }] }
        });
        const text = response.text?.trim();
        return (text && availableStyles.includes(text)) ? text : 'None';
    } catch (e) {
        return 'None';
    }
};

export const generateBackstory = async (imageBase64: string, prompt: string): Promise<string> => {
    const ai = getClient();
    const model = 'gemini-3-pro-preview'; 
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const instructions = `Write a 50-word immersive Lore Entry for this subject. Context: ${parseJsonPrompt(prompt)}`;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [{ text: instructions }, { inlineData: { mimeType: mimeType, data: base64Data } }]
            }
        });
        return response.text || "Connection failed.";
    } catch (error) {
        return "Lore retrieval failed.";
    }
};

export const shareMedia = async (url: string, title: string, text: string): Promise<void> => {
    try {
        let fetchUrl = url;
        // If it's a Google URI, append key for authorized fetch
        if (url.includes('generativelanguage.googleapis.com')) {
             const key = process.env.API_KEY || getStoredApiKey();
             if (key && !url.includes('key=')) {
                const separator = url.includes('?') ? '&' : '?';
                fetchUrl = `${url}${separator}key=${key}`;
             }
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const blob = await response.blob();
        const file = new File([blob], `nebula-art-${Date.now()}.png`, { type: blob.type });
        
        if (navigator.share) {
            await navigator.share({ title, text, files: [file] });
        } else {
            // Fallback: Copy to clipboard if possible
            if (typeof ClipboardItem !== 'undefined' && blob.type.startsWith('image')) {
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                alert("Art copied to clipboard!");
            } else {
                alert("Native sharing not supported on this browser.");
            }
        }
    } catch (error: any) {
        console.error("Share error:", error);
        // Don't let a share failure crash the app state, just notify
        if (error.name === 'TypeError') alert("Security block: This browser prevents sharing directly from the cloud. Please download the file instead.");
    }
};

export const generateImage = async (config: AppConfig): Promise<string> => {
    const { prompt, model, aspectRatio, style, negativePrompt, seed, imageSize } = config;
    let finalPrompt = parseJsonPrompt(prompt);

    // ROUTE TO HUGGING FACE IF SELECTED
    if (model === ModelType.HUGGING_FACE_FLUX) {
        const hfPrompt = `${style !== 'None' ? style + ' style: ' : ''}${finalPrompt}`;
        return await generateImageFromHf(hfPrompt, model);
    }

    // STANDARD GEMINI / IMAGEN FLOW
    const ai = getClient();
    try {
        if (model === ModelType.IMAGEN_4) {
            const response = await ai.models.generateImages({
                model: model,
                prompt: finalPrompt,
                config: { numberOfImages: 1, aspectRatio: aspectRatio as any, outputMimeType: 'image/jpeg' }
            });
            if (response.generatedImages?.[0]) return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
            throw new Error("Imagen generation failed.");
        } else {
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: `Generate image: ${finalPrompt} (Style: ${style})` }] },
                config: { 
                    imageConfig: { 
                        aspectRatio, 
                        imageSize: model === ModelType.GEMINI_PRO_IMAGE ? imageSize : undefined 
                    },
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    ]
                }
            });
            
            const parts = response.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
            
            // Check for text refusal
            const textPart = parts.find(p => p.text);
            if (textPart?.text) throw new Error(`Model Refusal: ${textPart.text}`);
            
            throw new Error("Generation failed: No visual data returned.");
        }
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error("Network error: Could not reach Google AI. Check your connection or API status.");
        }
        throw error;
    }
};

export const upscaleImage = async (imageBase64: string, aspectRatio: string): Promise<string> => {
    const ai = getClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    try {
        const response = await ai.models.generateContent({
            model: ModelType.GEMINI_PRO_IMAGE,
            contents: {
                parts: [{ text: "Refine and upscale this image to 4K resolution. Increase texture detail while keeping composition identical." }, { inlineData: { mimeType, data: base64Data } }]
            },
            config: { imageConfig: { aspectRatio, imageSize: '4K' } }
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) return `data:${mimeType};base64,${part.inlineData.data}`;
        }
        throw new Error("Upscale failed.");
    } catch (error) {
        throw error;
    }
};

export const generateVideo = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    try {
        let operation = await ai.models.generateVideos({
            model: ModelType.VEO_FAST,
            prompt: parseJsonPrompt(config.prompt),
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: config.aspectRatio as '16:9' | '9:16' }
        });
        
        while (!operation.done) {
            await new Promise(r => setTimeout(r, 7000)); // slightly longer poll to be safe
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation completed but no URI returned.");

        const key = process.env.API_KEY || getStoredApiKey();
        const separator = videoUri.includes('?') ? '&' : '?';
        return key ? `${videoUri}${separator}key=${key}` : videoUri;
    } catch (error: any) {
        if (error.name === 'TypeError') throw new Error("Network error during video polling.");
        throw error;
    }
};
