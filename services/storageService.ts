
import { GeneratedImage, PromptTemplate } from "../types";
import { openDB } from 'idb';

const GALLERY_DB_NAME = 'nebula_gallery_db';
const GALLERY_STORE_NAME = 'images';
const TEMPLATE_STORAGE_KEY = 'nebula_templates';
const PROMPT_HISTORY_KEY = 'nebula_prompt_history';
const API_KEY_STORAGE_KEY = 'nebula_api_key';
const ONBOARDING_KEY = 'nebula_mission_briefing_seen';
const ACCESS_GRANTED_KEY = 'nebula_system_access_granted';
const USAGE_STATS_KEY = 'nebula_usage_stats';

const MAX_GALLERY_ITEMS = 50; 
const MAX_HISTORY_ITEMS = 20;
const DEFAULT_DAILY_LIMIT = 50;

interface UsageStats {
    date: string;
    count: number;
    limit: number;
}

export const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const getUsageStats = (): UsageStats => {
    const today = new Date().toDateString();
    try {
        const stored = localStorage.getItem(USAGE_STATS_KEY);
        if (stored) {
            const stats: UsageStats = JSON.parse(stored);
            if (stats.date !== today) {
                const newStats = { date: today, count: 0, limit: stats.limit || DEFAULT_DAILY_LIMIT };
                localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(newStats));
                return newStats;
            }
            return stats;
        }
    } catch (e) {}
    
    const initial: UsageStats = { date: today, count: 0, limit: DEFAULT_DAILY_LIMIT };
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(initial));
    return initial;
};

export const incrementUsage = () => {
    const stats = getUsageStats();
    stats.count += 1;
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
};

export const setDailyLimit = (limit: number) => {
    const stats = getUsageStats();
    stats.limit = limit;
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));
};

export const isLimitReached = (): boolean => {
    const stats = getUsageStats();
    return stats.count >= stats.limit;
};

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
    } catch (e) {}
};

export const isAccessGranted = (): boolean => {
    try {
        return localStorage.getItem(ACCESS_GRANTED_KEY) === 'true';
    } catch (e) {
        return false;
    }
};

export const grantAccess = () => {
    try {
        localStorage.setItem(ACCESS_GRANTED_KEY, 'true');
    } catch (e) {}
};

export const revokeAccess = () => {
    try {
        localStorage.removeItem(ACCESS_GRANTED_KEY);
    } catch (e) {}
};

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
    } catch (e) {}
};

export const removeStoredApiKey = () => {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (e) {}
};

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
        return allItems.reverse();
    } catch (e) {
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
        let storageImage = { ...image };
        
        if (storageImage.url.startsWith('blob:') || storageImage.url.startsWith('http')) {
            try {
                let fetchUrl = storageImage.url;
                if (fetchUrl.includes('generativelanguage.googleapis.com')) {
                    const key = process.env.API_KEY || getStoredApiKey();
                    if (key && !fetchUrl.includes('key=')) {
                        const separator = fetchUrl.includes('?') ? '&' : '?';
                        fetchUrl = `${fetchUrl}${separator}key=${key}`;
                    }
                }
                const response = await fetch(fetchUrl, { credentials: 'omit' });
                if (response.ok) {
                    const blob = await response.blob();
                    const base64 = await blobToBase64(blob);
                    storageImage.url = base64;
                }
            } catch (err: any) {
                console.warn("Media localization skipped.", err.message);
            }
        }

        const tx = db.transaction(GALLERY_STORE_NAME, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE_NAME);
        await store.put(storageImage);
        
        const count = await store.count();
        if (count > MAX_GALLERY_ITEMS) {
            const index = store.index('timestamp');
            const keys = await index.getAllKeys();
            const itemsToDelete = count - MAX_GALLERY_ITEMS;
            for (let i = 0; i < itemsToDelete; i++) {
                if (keys[i]) await store.delete(keys[i]);
            }
        }
        await tx.done;
        return getGallery();
    } catch (e) {
        return getGallery();
    }
};

export const removeFromGallery = async (id: string): Promise<GeneratedImage[]> => {
    try {
        const db = await initDB();
        await db.delete(GALLERY_STORE_NAME, id);
        return getGallery();
    } catch (e) {
        return getGallery();
    }
};

const DEFAULT_TEMPLATES: PromptTemplate[] = [
    { id: 'default-1', name: 'Cinematic Portrait', content: 'A cinematic portrait of [character], detailed facial features, dramatic lighting, [color] color palette, 8k resolution, photorealistic', timestamp: Date.now() },
    { id: 'default-2', name: 'Isometric 3D', content: 'Low poly isometric view of a [object/location], soft lighting, pastel colors, 3d render, blender, minimal design', timestamp: Date.now() },
    { id: 'default-3', name: 'Cyberpunk City', content: 'Futuristic cyberpunk city street at night, neon lights, rain reflections, [activity] in the foreground, towering skyscrapers, dystopian atmosphere', timestamp: Date.now() },
    { id: 'default-4', name: 'Fantasy Landscape', content: 'Epic fantasy landscape featuring a [landmark], magical atmosphere, floating islands, vibrant [color] sky, intricate details, matte painting', timestamp: Date.now() }
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
        return getTemplates();
    }
};

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
    } catch (e) {}
};
