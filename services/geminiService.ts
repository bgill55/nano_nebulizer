
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { AppConfig, ModelType } from "../types";
import { getStoredApiKey } from "./storageService";

const getClient = () => {
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

const parseJsonPrompt = (input: string): string => {
    try {
        const trimmed = input.trim();
        if (!trimmed.startsWith('{')) return input;
        const parsed = JSON.parse(trimmed);
        
        const flattenObject = (obj: any): string[] => {
            let parts: string[] = [];
            for (const key in obj) {
                const value = obj[key];
                if (['confidence_score', 'metadata', 'technical_specs', 'id'].includes(key.toLowerCase())) continue;
                if (typeof value === 'string') {
                    parts.push(['prompt', 'text'].includes(key.toLowerCase()) ? value : `${key}: ${value}`);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    parts.push(`${key}: ${value}`);
                } else if (Array.isArray(value)) {
                    parts.push(`${key}: ${value.join(', ')}`);
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

export const generateImage = async (config: AppConfig): Promise<string> => {
    const { prompt, model, aspectRatio, style, imageSize } = config;
    let finalPrompt = parseJsonPrompt(prompt);

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
            throw new Error("No image data returned from Gemini.");
        }
    } catch (error: any) {
        throw error;
    }
};

export const describeImage = async (imageBase64: string): Promise<string> => {
    const ai = getClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [{ text: "Describe this image for an AI prompt." }, { inlineData: { mimeType, data: base64Data } }]
        }
    });
    return response.text?.trim() || "Description failed.";
};

export const extractStyle = async (imageBase64: string): Promise<string> => {
    const ai = getClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [{ text: "Extract artistic style keywords only." }, { inlineData: { mimeType, data: base64Data } }]
        }
    });
    return response.text?.trim() || "";
};

export const enhancePrompt = async (input: string, style: string = 'None'): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: `Expand this into a master-level image prompt. Concept: ${input}. Style: ${style}` }] }
    });
    return response.text?.trim() || input;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const playAudioData = async (base64PCM: string) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const binary = atob(base64PCM);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const inputData = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) float32Data[i] = inputData[i] / 32768.0;
    const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
    return { stop: () => source.stop(), duration: buffer.duration };
};

export const detectStyleFromPrompt = async (prompt: string, styles: string[]): Promise<string> => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [{ text: `Pick one style from [${styles.join(', ')}] that fits: "${prompt}". Return just the word.` }] }
    });
    return response.text?.trim() || "None";
};

export const generateBackstory = async (imageBase64: string, prompt: string): Promise<string> => {
    const ai = getClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
            parts: [{ text: `Write a short immersive lore entry for this: ${prompt}` }, { inlineData: { mimeType, data: base64Data } }]
        }
    });
    return response.text || "Lore unavailable.";
};

export const shareMedia = async (url: string, title: string, text: string): Promise<void> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], "art.png", { type: blob.type });
    if (navigator.share) await navigator.share({ title, text, files: [file] });
};

export const generateVideo = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    let operation = await ai.models.generateVideos({
        model: ModelType.VEO_FAST,
        prompt: config.prompt,
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: config.aspectRatio as any }
    });
    while (!operation.done) {
        await new Promise(r => setTimeout(r, 7000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    const key = process.env.API_KEY || getStoredApiKey();
    return `${videoUri}${videoUri?.includes('?') ? '&' : '?'}key=${key}`;
};

export const upscaleImage = async (imageBase64: string, aspectRatio: string): Promise<string> => {
    const ai = getClient();
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
    const response = await ai.models.generateContent({
        model: ModelType.GEMINI_PRO_IMAGE,
        contents: {
            parts: [{ text: "Upscale and refine this to 4K." }, { inlineData: { mimeType, data: base64Data } }]
        },
        config: { imageConfig: { aspectRatio, imageSize: '4K' } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part || !part.inlineData) throw new Error("Upscale failed.");
    return `data:${mimeType};base64,${part.inlineData.data}`;
};
