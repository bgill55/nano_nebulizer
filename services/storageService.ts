
import { GeneratedImage, PromptTemplate } from "../types";
import { openDB } from 'idb';

const GALLERY_DB_NAME = 'nebula_gallery_db';
const GALLERY_STORE_NAME = 'images';
const TEMPLATE_STORAGE_KEY = 'nebula_templates';
const PROMPT_HISTORY_KEY = 'nebula_prompt_history';
const API_KEY_STORAGE_KEY = 'nebula_api_key';
const ONBOARDING_KEY = 'nebula_mission_briefing_seen';
const MAX_GALLERY_ITEMS = 50; // Increased from 20 to 50
const MAX_HISTORY_ITEMS = 20;

// --- Utility ---

export const generateUUID = (): string => {
    // Native support check
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for non-secure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// --- Onboarding Logic ---

export const hasSeenOnboarding = (): boolean => {
    try {
        return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

export const markOnboardingSeen = () => {
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch (e) {
        console.error("Failed to save onboarding status", e);
    }
};

// --- API Key Management (BYOK) ---

export const getStoredApiKey = (): string | null => {
    try {
        return localStorage.getItem(API_KEY_STORAGE_KEY);
    } catch (e) {
        return null;
    }
};

export const saveApiKey = (key: string) => {
    try {
        localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } catch (e) {
        console.error("Failed to save API key", e);
    }
};

export const removeStoredApiKey = () => {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {
        console.error("Failed to remove API key", e);
    }
};

// --- Gallery Logic (IndexedDB) ---

const initDB = async () => {
    return openDB(GALLERY_DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) {
                const store = db.createObjectStore(GALLERY_STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        },
    });
};

export const getGallery = async (): Promise<GeneratedImage[]> => {
    try {
        const db = await initDB();
        const allItems = await db.getAllFromIndex(GALLERY_STORE_NAME, 'timestamp');
        // Return reversed (newest first)
        return allItems.reverse();
    } catch (e) {
        console.error("Failed to load gallery from IndexedDB", e);
        return [];
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const saveToGallery = async (image: GeneratedImage): Promise<GeneratedImage[]> => {
    try {
        const db = await initDB();
        
        // Ensure data is persistent (convert blob URLs to Base64 if needed)
        // Video blobs from Veo are usually blob: URLs which are temporary.
        // We must fetch and convert them to store permanently.
        let storageImage = { ...image };
        
        if (storageImage.url.startsWith('blob:')) {
            try {
                const response = await fetch(storageImage.url);
                const blob = await response.blob();
                const base64 = await blobToBase64(blob);
                storageImage.url = base64;
            } catch (err) {
                console.warn("Failed to convert blob to base64 for storage", err);
                // Continue trying to save original url, though it might expire
            }
        } else if (storageImage.type === 'video' && storageImage.url.startsWith('http')) {
            // Attempt to fetch remote video to cache it
            // If CORS fails, we simply keep the remote URL and don't crash
            try {
                const response = await fetch(storageImage.url);
                if (response.ok) {
                     const blob = await response.blob();
                     const base64 = await blobToBase64(blob);
                     storageImage.url = base64;
                }
            } catch (err) {
                console.warn("Could not cache video to IDB (likely CORS). Saved as remote link.", err);
                // We do NOT throw here. We save the remote URL so the user can at least view it for now.
            }
        }

        const tx = db.transaction(GALLERY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE_NAME);
        
        await store.put(storageImage);
        
        // Quota Management: Check count
        const count = await store.count();
        if (count > MAX_GALLERY_ITEMS) {
            // Delete oldest
            // IndexedDB 'getAllKeys' returns sorted by key (id) usually, but we need sorted by timestamp.
            // Using a cursor or index is better.
            const index = store.index('timestamp');
            const keys = await index.getAllKeys(); // sorted by timestamp ascending (oldest first)
            
            const itemsToDelete = count - MAX_GALLERY_ITEMS;
            for (let i = 0; i < itemsToDelete; i++) {
                if (keys[i]) {
                    await store.delete(keys[i]);
                }
            }
        }
        
        await tx.done;
        return getGallery();
    } catch (e) {
        console.error("Failed to save to gallery", e);
        return getGallery();
    }
};

export const removeFromGallery = async (id: string): Promise<GeneratedImage[]> => {
    try {
        const db = await initDB();
        await db.delete(GALLERY_STORE_NAME, id);
        return getGallery();
    } catch (e) {
        console.error("Failed to remove from gallery", e);
        return getGallery();
    }
};

// --- Template Logic (LocalStorage) ---

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

// --- Prompt History Logic (LocalStorage) ---

export const getPromptHistory = (): string[] => {
    try {
        const stored = localStorage.getItem(PROMPT_HISTORY_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const savePromptToHistory = (prompt: string): string[] => {
    if (!prompt || !prompt.trim()) return getPromptHistory();
    try {
        const current = getPromptHistory();
        const filtered = current.filter(p => p !== prompt && p.trim() !== '');
        const updated = [prompt, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
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
