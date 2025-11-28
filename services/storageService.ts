
import { GeneratedImage, PromptTemplate } from "../types";

const GALLERY_STORAGE_KEY = 'nebula_gallery';
const TEMPLATE_STORAGE_KEY = 'nebula_templates';
const PROMPT_HISTORY_KEY = 'nebula_prompt_history';
const MAX_ITEMS = 10; // Limit to prevent LocalStorage quota exceeded (Base64 is heavy)
const MAX_HISTORY_ITEMS = 20;

// --- Gallery Logic ---

export const getGallery = (): GeneratedImage[] => {
    try {
        const stored = localStorage.getItem(GALLERY_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load gallery", e);
        return [];
    }
};

export const saveToGallery = (image: GeneratedImage): GeneratedImage[] => {
    try {
        const current = getGallery();
        
        // Add new image to the beginning
        const updated = [image, ...current];
        
        // Trim to max items
        if (updated.length > MAX_ITEMS) {
            updated.length = MAX_ITEMS;
        }

        try {
            localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            // Quota exceeded? Try removing more items
            console.warn("Storage quota exceeded, removing oldest items...");
            while (updated.length > 0) {
                updated.pop(); // Remove oldest
                try {
                    localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
                    break; // Success
                } catch (retryErr) {
                    continue; // Still full, pop another
                }
            }
        }
        
        return updated;
    } catch (e) {
        console.error("Failed to save to gallery", e);
        return getGallery();
    }
};

export const removeFromGallery = (id: string): GeneratedImage[] => {
    try {
        const current = getGallery();
        const updated = current.filter(img => img.id !== id);
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to remove from gallery", e);
        return getGallery();
    }
};

// --- Template Logic ---

const DEFAULT_TEMPLATES: PromptTemplate[] = [
    {
        id: 'default-1',
        name: 'Cinematic Portrait',
        content: 'A cinematic portrait of [character], detailed facial features, dramatic lighting, [color] color palette, 8k resolution, photorealistic',
        timestamp: Date.now()
    },
    {
        id: 'default-2',
        name: 'Isometric 3D',
        content: 'Low poly isometric view of a [object/location], soft lighting, pastel colors, 3d render, blender, minimal design',
        timestamp: Date.now()
    },
    {
        id: 'default-3',
        name: 'Cyberpunk City',
        content: 'Futuristic cyberpunk city street at night, neon lights, rain reflections, [activity] in the foreground, towering skyscrapers, dystopian atmosphere',
        timestamp: Date.now()
    },
    {
        id: 'default-4',
        name: 'Fantasy Landscape',
        content: 'Epic fantasy landscape featuring a [landmark], magical atmosphere, floating islands, vibrant [color] sky, intricate details, matte painting',
        timestamp: Date.now()
    }
];

export const getTemplates = (): PromptTemplate[] => {
    try {
        const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
        if (!stored) {
            // Initialize with defaults if empty
            localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATES));
            return DEFAULT_TEMPLATES;
        }
        return JSON.parse(stored);
    } catch (e) {
        console.error("Failed to load templates", e);
        return DEFAULT_TEMPLATES;
    }
};

export const saveTemplate = (template: PromptTemplate): PromptTemplate[] => {
    try {
        const current = getTemplates();
        const updated = [template, ...current];
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to save template", e);
        return getTemplates();
    }
};

export const deleteTemplate = (id: string): PromptTemplate[] => {
    try {
        const current = getTemplates();
        const updated = current.filter(t => t.id !== id);
        localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to delete template", e);
        return getTemplates();
    }
};

// --- Prompt History Logic ---

export const getPromptHistory = (): string[] => {
    try {
        const stored = localStorage.getItem(PROMPT_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load prompt history", e);
        return [];
    }
};

export const savePromptToHistory = (prompt: string): string[] => {
    if (!prompt || !prompt.trim()) return getPromptHistory();
    try {
        const current = getPromptHistory();
        // Remove duplicates and filter out empty strings
        const filtered = current.filter(p => p !== prompt && p.trim() !== '');
        // Add to front and limit size
        const updated = [prompt, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        
        localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to save prompt history", e);
        return getPromptHistory();
    }
};

export const clearPromptHistory = () => {
    try {
        localStorage.removeItem(PROMPT_HISTORY_KEY);
    } catch (e) {
        console.error("Failed to clear prompt history", e);
    }
};
