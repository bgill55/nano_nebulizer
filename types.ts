
export enum ModelType {
    GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image',
    IMAGEN_4 = 'imagen-4.0-generate-001',
    GEMINI_PRO_IMAGE = 'gemini-3-pro-image-preview', 
    GEMINI_2_0_FLASH_EXP = 'gemini-2.0-flash-exp',
    VEO_FAST = 'veo-3.1-fast-generate-preview',
}

export type AppTheme = 'Nebula Dark' | 'Starlight Light';
export type GenerationMode = 'image' | 'video';

export interface AppConfig {
    mode: GenerationMode;
    prompt: string;
    negativePrompt: string;
    model: ModelType;
    aspectRatio: string;
    style: string;
    quality: number; // 0-100
    steps: number; // 10-150
    guidanceScale: number; // 1-20
    seed: number; // Random seed
    enableNSFW: boolean;
    theme: AppTheme;
    imageSize: '1K' | '2K' | '4K';
    inputImage?: string | null; // Base64 data URL
    batchSize: number; // 1-4
}

export interface GeneratedImage {
    id: string;
    url: string; // Image Data URL or Video Blob URL
    type: 'image' | 'video';
    prompt: string;
    timestamp: number;
    style?: string;
    aspectRatio?: string;
    model?: ModelType;
    seed?: number;
    negativePrompt?: string;
}

export interface PromptTemplate {
    id: string;
    name: string;
    content: string; // e.g. "A futuristic [subject] in a [environment]"
    timestamp: number;
}

declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio?: AIStudio;
    }
}
