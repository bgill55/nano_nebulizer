
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Modality } from "@google/genai";
import { AppConfig, ModelType } from "../types";
import { getStoredApiKey, getStoredHfToken } from "./storageService";

const getClient = () => {
    let apiKey = process.env.API_KEY;
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
    let isJson = input.trim().startsWith('{');
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

    const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: prompt }),
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`HF Generation Error: ${err.error || response.statusText}`);
    }

    const result = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(result);
    });
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
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], `art.png`, { type: blob.type });
        if (navigator.share) {
            await navigator.share({ title, text, files: [file] });
        } else {
            alert("Native sharing not supported.");
        }
    } catch (error) {}
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
            throw new Error("Imagen failed.");
        } else {
            const response = await ai.models.generateContent({
                model: model,
                contents: { parts: [{ text: `Generate image: ${finalPrompt} (Style: ${style})` }] },
                config: { imageConfig: { aspectRatio, imageSize: model === ModelType.GEMINI_PRO_IMAGE ? imageSize : undefined } }
            });
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("Generation failed.");
        }
    } catch (error: any) {
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
                parts: [{ text: "Upscale to 4K" }, { inlineData: { mimeType, data: base64Data } }]
            },
            config: { imageConfig: { aspectRatio, imageSize: '4K' } }
        });
        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            return `data:${mimeType};base64,${response.candidates[0].content.parts[0].inlineData.data}`;
        }
        throw new Error("Upscale failed.");
    } catch (error) {
        throw error;
    }
};

export const generateVideo = async (config: AppConfig): Promise<string> => {
    const ai = getClient();
    const operation = await ai.models.generateVideos({
        model: ModelType.VEO_FAST,
        prompt: parseJsonPrompt(config.prompt),
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: config.aspectRatio as '16:9' | '9:16' }
    });
    while (!operation.done) {
        await new Promise(r => setTimeout(r, 5000));
        await ai.operations.getVideosOperation({ operation });
    }
    return operation.response?.generatedVideos?.[0]?.video?.uri || "";
};
