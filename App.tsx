
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Background from './components/Background';
import PromptInput from './components/PromptInput';
import ControlPanel from './components/ControlPanel';
import PreviewPane from './components/PreviewPane';
import GeneratedImageModal from './components/GeneratedImageModal';
import GalleryModal from './components/GalleryModal';
import TemplateModal from './components/TemplateModal';
import SettingsModal from './components/SettingsModal';
import OnboardingModal from './components/OnboardingModal';
import { AppConfig, ModelType, GeneratedImage } from './types';
import { generateImage, upscaleImage, enhancePrompt, generateVideo, shareMedia, describeImage, extractStyle } from './services/geminiService';
import { getGallery, saveToGallery, removeFromGallery, savePromptToHistory, generateUUID, getStoredApiKey, saveApiKey, removeStoredApiKey, hasSeenOnboarding, markOnboardingSeen, isAccessGranted, grantAccess, revokeAccess, isLimitReached, incrementUsage } from './services/storageService';
import { playPowerUp, playSuccess, playError, playClick } from './services/audioService';
import { RefreshCcw, AlertCircle, Key, Zap, CheckCircle2, Info, LogOut, ShieldCheck, Lock } from 'lucide-react';

const DEFAULT_NEGATIVE_PROMPT = "blurry, low quality, bad anatomy, ugly, pixelated, watermark, text, signature, worst quality, deformed, disfigured, cropped, mutation, bad proportions, extra limbs, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck";

const SYSTEM_ACCESS_CODE = "nebula-2025"; 

const DEFAULT_CONFIG: AppConfig = {
  mode: 'image',
  prompt: '',
  negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  model: ModelType.GEMINI_FLASH_IMAGE,
  aspectRatio: '1:1',
  style: 'Anime',
  quality: 90, 
  steps: 50,
  guidanceScale: 7.5,
  seed: -1, 
  enableNSFW: false,
  theme: 'Nebula Dark',
  imageSize: '1K',
  inputImage: null,
  batchSize: 1,
  enableAutoSpeak: false
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[] | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'warning' | 'error'} | null>(null);
  const [showFreeTierSuggestion, setShowFreeTierSuggestion] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>([]);
  const [livePreviewEnabled, setLivePreviewEnabled] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLight = config.theme === 'Starlight Light';

  useEffect(() => {
    const init = async () => {
      if (process.env.API_KEY && process.env.API_KEY !== '') {
          if (isAccessGranted()) {
              setHasKey(true);
              setIsLocked(false);
          } else {
              setHasKey(true);
              setIsLocked(true);
          }
      } 
      else if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
        setIsLocked(false);
      } 
      else {
        const stored = getStoredApiKey();
        setHasKey(!!stored);
        setIsLocked(false);
      }
      
      const imgs = await getGallery();
      setGalleryImages(imgs);

      if (!hasSeenOnboarding() && !isLocked) {
          setTimeout(() => {
              setIsOnboardingOpen(true);
          }, 1000); 
      }
    };
    init();
  }, []);

  const handleCloseOnboarding = () => {
      setIsOnboardingOpen(false);
      markOnboardingSeen();
      playSuccess();
  };

  const handleOpenHelp = () => {
      playClick();
      setIsOnboardingOpen(true);
  };

  useEffect(() => {
    if (notification) {
        const timer = setTimeout(() => {
            setNotification(null);
        }, 5000);
        return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      setNotification({ message, type });
  };

  useEffect(() => {
    if (!livePreviewEnabled || !hasKey || isLocked || config.mode === 'video') {
        if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
        return;
    }
    if (config.prompt.length < 3 && !config.inputImage) return;
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
        handlePreviewGeneration();
    }, 1500);
    return () => {
        if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [config, livePreviewEnabled, hasKey, isLocked]);

  const handlePreviewGeneration = async () => {
    if (isPreviewLoading) return;
    if (isLimitReached()) return;
    setIsPreviewLoading(true);
    try {
        let enhancedPrompt = config.prompt;
        if (config.style !== 'None') {
            enhancedPrompt = `${config.style} style: ${config.prompt}`;
        }
        const previewConfig = {
            ...config,
            model: ModelType.GEMINI_FLASH_IMAGE, 
            prompt: enhancedPrompt
        };
        const imageUrl = await generateImage(previewConfig);
        setPreviewImage(imageUrl);
    } catch (err) {
        console.warn("Preview generation failed:", err);
    } finally {
        setIsPreviewLoading(false);
    }
  };

  const handleApiKeySelect = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
        setNotification(null);
        setShowFreeTierSuggestion(false);
      } catch (e) {
        console.error("Key selection failed", e);
      }
    } else {
        removeStoredApiKey();
        revokeAccess();
        setHasKey(false);
        setIsLocked(false);
    }
  };

  const handleManualKeySubmit = () => {
      if (manualKey.trim().length > 10) {
          saveApiKey(manualKey.trim());
          setHasKey(true);
          setIsLocked(false);
          playSuccess();
      } else {
          showNotification("Invalid API Key format", 'error');
          playError();
      }
  };

  const handleAccessCodeSubmit = () => {
      if (accessCodeInput === SYSTEM_ACCESS_CODE) {
          grantAccess();
          setIsLocked(false);
          setHasKey(true);
          playSuccess();
          showNotification("Security Clearance Granted. Welcome, Administrator.", 'success');
      } else {
          playError();
          showNotification("Access Denied. Invalid Clearance Code.", 'error');
      }
  };

  const handleSwitchToBYOK = () => {
      setIsLocked(false);
      setHasKey(false);
  };

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        updateConfig('inputImage', base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleEnhancePrompt = async () => {
    if (!config.prompt.trim()) {
        showNotification("Please enter a basic prompt to enhance.", 'warning');
        return;
    }
    setIsEnhancing(true);
    setNotification(null);
    try {
        const enhanced = await enhancePrompt(config.prompt, config.style);
        updateConfig('prompt', enhanced);
        showNotification("Prompt enhanced using Gemini 3.0 Pro reasoning.", 'success');
    } catch (err: any) {
        console.error(err);
        showNotification("Failed to enhance prompt.", 'error');
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleDescribeImage = async () => {
      if (!config.inputImage) return;
      if (isLimitReached()) {
        showNotification("Daily Limit Reached.", 'error');
        return;
      }
      setIsDescribing(true);
      setNotification(null);
      playClick();
      try {
          const description = await describeImage(config.inputImage);
          updateConfig('prompt', description);
          incrementUsage();
          showNotification("Image analyzed! Prompt generated.", 'success');
          playSuccess();
      } catch (err: any) {
          console.error(err);
          showNotification("Failed to analyze image.", 'error');
          playError();
      } finally {
          setIsDescribing(false);
      }
  };

  const handleStealStyle = async () => {
    if (!config.inputImage) return;
    if (isLimitReached()) {
      showNotification("Daily Limit Reached.", 'error');
      return;
    }
    setIsDescribing(true); 
    setNotification(null);
    playClick();
    try {
        const styleKeywords = await extractStyle(config.inputImage);
        if (styleKeywords) {
            const currentPrompt = config.prompt.trim();
            const separator = currentPrompt ? ', ' : '';
            updateConfig('prompt', `${currentPrompt}${separator}${styleKeywords}`);
            incrementUsage(); 
            showNotification("Artistic style extracted and applied.", 'success');
            playSuccess();
        } else {
            showNotification("Could not identify specific style traits.", 'warning');
        }
    } catch (err: any) {
        console.error(err);
        showNotification("Style extraction failed.", 'error');
        playError();
    } finally {
        setIsDescribing(false);
    }
  };

  const switchToFreeTier = () => {
      updateConfig('model', ModelType.GEMINI_FLASH_IMAGE);
      setNotification(null);
      setShowFreeTierSuggestion(false);
      showNotification("Switched to Gemini Flash", 'info');
  };

  const handleGenerate = async () => {
    if (isLimitReached()) {
        playError();
        showNotification("Daily Usage Limit Reached. Check Settings > Safety Governor to increase limit.", 'error');
        setIsSettingsOpen(true);
        return;
    }

    if (!config.prompt.trim() && !config.inputImage) {
      showNotification("Please describe the output you want to generate or upload a reference.", 'warning');
      setShowFreeTierSuggestion(false);
      playError();
      return;
    }

    setIsGenerating(true);
    playPowerUp();
    setNotification(null);
    setShowFreeTierSuggestion(false);
    setGeneratedImages(null);

    if (config.prompt.trim()) {
        savePromptToHistory(config.prompt);
    }

    try {
        if (config.mode === 'video') {
             let videoPrompt = config.prompt;
             if (config.style !== 'None' && config.prompt.trim()) {
                 videoPrompt = `${config.style} style: ${config.prompt}`;
             }
             const videoUrl = await generateVideo({ ...config, prompt: videoPrompt });
             const newVideo: GeneratedImage = {
                id: generateUUID(),
                url: videoUrl,
                type: 'video',
                prompt: config.prompt,
                timestamp: Date.now(),
                aspectRatio: config.aspectRatio,
                model: config.model,
                negativePrompt: config.negativePrompt,
                style: config.style
             };
             const updatedGallery = await saveToGallery(newVideo);
             setGalleryImages(updatedGallery);
             setGeneratedImages([newVideo]);
             incrementUsage(); 
             playSuccess();
        } else {
             let enhancedPrompt = config.prompt;
             if (config.style !== 'None' && config.prompt.trim()) {
               enhancedPrompt = `${config.style} style: ${config.prompt}`;
             }
       
             const baseSeed = config.seed === -1 ? Math.floor(Math.random() * 2000000000) : config.seed;
             
             // Use allSettled so one network failure doesn't kill the whole batch
             const batchResults = await Promise.allSettled(Array.from({ length: config.batchSize }).map(async (_, index) => {
                 const effectiveSeed = baseSeed + index;
                 const url = await generateImage({ ...config, prompt: enhancedPrompt, seed: effectiveSeed });
                 return {
                     id: generateUUID(),
                     url,
                     type: 'image',
                     prompt: config.prompt,
                     timestamp: Date.now(),
                     style: config.style,
                     aspectRatio: config.aspectRatio,
                     model: config.model,
                     seed: effectiveSeed,
                     negativePrompt: config.negativePrompt
                 } as GeneratedImage;
             }));
       
             const successfulImages = batchResults
                .filter(res => res.status === 'fulfilled')
                .map(res => (res as PromiseFulfilledResult<GeneratedImage>).value);
             
             const failedCount = batchResults.filter(res => res.status === 'rejected').length;

             if (successfulImages.length > 0) {
                 let currentGallery = galleryImages;
                 for (const img of successfulImages) {
                     currentGallery = await saveToGallery(img);
                 }
                 setGalleryImages(currentGallery);
                 setGeneratedImages(successfulImages);
                 incrementUsage(); 
                 playSuccess();
                 if (failedCount > 0) {
                    showNotification(`${failedCount} item(s) in batch failed due to network errors.`, 'warning');
                 }
             } else {
                 // All items failed, throw the first error found
                 const firstError = (batchResults.find(res => res.status === 'rejected') as PromiseRejectedResult)?.reason;
                 throw firstError || new Error("All generation attempts failed.");
             }
        }
    } catch (err: any) {
      console.error(err);
      playError();
      const msg = err.message || "Failed to generate.";
      if (msg.includes('403') || msg.toLowerCase().includes('permission')) {
          if (config.model !== ModelType.GEMINI_FLASH_IMAGE) {
             showNotification("Permission denied. This model may require a paid billing account.", 'error');
             setShowFreeTierSuggestion(true);
          } else {
             showNotification("Permission denied. Please check your API Key settings.", 'error');
          }
      } else {
          showNotification(msg, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVariations = async (sourceImage: GeneratedImage) => {
    if (!sourceImage.seed || sourceImage.type !== 'image') return;
    if (isLimitReached()) {
        showNotification("Daily Limit Reached.", 'error');
        return;
    }
    setIsGenerating(true);
    playPowerUp();
    setGeneratedImages(null);
    setNotification(null);
    try {
        const promptToUse = sourceImage.prompt || config.prompt;
        const styleToUse = sourceImage.style || config.style;
        const modelToUse = sourceImage.model || config.model;
        const ratioToUse = sourceImage.aspectRatio || config.aspectRatio;
        const negToUse = sourceImage.negativePrompt || config.negativePrompt;
        let enhancedPrompt = promptToUse;
        if (styleToUse && styleToUse !== 'None' && promptToUse.trim()) {
            enhancedPrompt = `${styleToUse} style: ${promptToUse}`;
        }
        const baseSeed = sourceImage.seed + 1000; 
        const variationBatchSize = 4;
        const batchResults = await Promise.allSettled(Array.from({ length: variationBatchSize }).map(async (_, index) => {
            const effectiveSeed = baseSeed + index;
            const url = await generateImage({ ...config, prompt: enhancedPrompt, model: modelToUse, aspectRatio: ratioToUse, style: styleToUse, negativePrompt: negToUse, seed: effectiveSeed });
            return {
                id: generateUUID(),
                url,
                type: 'image',
                prompt: promptToUse,
                timestamp: Date.now(),
                style: styleToUse,
                aspectRatio: ratioToUse,
                model: modelToUse,
                seed: effectiveSeed,
                negativePrompt: negToUse
            } as GeneratedImage;
        }));
        const successful = batchResults.filter(res => res.status === 'fulfilled').map(res => (res as PromiseFulfilledResult<GeneratedImage>).value);
        if (successful.length > 0) {
            let currentGallery = galleryImages;
            for (const img of successful) currentGallery = await saveToGallery(img);
            setGalleryImages(currentGallery);
            setGeneratedImages(successful);
            incrementUsage();
            playSuccess();
        } else {
            throw (batchResults[0] as PromiseRejectedResult).reason;
        }
    } catch (err: any) {
        console.error(err);
        showNotification("Failed to generate variations.", 'error');
        playError();
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSaveToGallery = async (image: GeneratedImage) => {
    const updatedGallery = await saveToGallery(image);
    setGalleryImages(updatedGallery);
    showNotification("Saved to Gallery", 'success');
  };

  const handleUpscale = async (targetImage: GeneratedImage) => {
    if (!targetImage.url || targetImage.type !== 'image') return;
    if (isLimitReached()) {
        showNotification("Daily Limit Reached.", 'error');
        return;
    }
    setIsUpscaling(true);
    setNotification(null);
    try {
      const upscaledUrl = await upscaleImage(targetImage.url, config.aspectRatio);
      const newImage = { 
          ...targetImage, 
          url: upscaledUrl, 
          id: generateUUID(),
          prompt: targetImage.prompt + " (Upscaled)"
      };
      setGeneratedImages(prev => {
          if (!prev) return [newImage];
          const index = prev.findIndex(img => img.id === targetImage.id);
          if (index !== -1) {
              const newList = [...prev];
              newList.splice(index + 1, 0, newImage);
              return newList;
          }
          return [...prev, newImage];
      });
      const updated = await saveToGallery(newImage);
      setGalleryImages(updated);
      incrementUsage();
      playSuccess();
      showNotification("Image upscaled to 4K. Added to batch.", 'success');
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || "Failed to upscale image.", 'error');
      playError();
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleEdit = (image: GeneratedImage) => {
      updateConfig('inputImage', image.url);
      setGeneratedImages(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showNotification("Image loaded as reference.", 'info');
  };

  const handleShare = async (image: GeneratedImage) => {
      try {
          await shareMedia(image.url, "Generated Art", image.prompt);
      } catch (e) {}
  };

  const handleDeleteImage = async (id: string) => {
    const updated = await removeFromGallery(id);
    setGalleryImages(updated);
  };

  const handleSelectImage = (image: GeneratedImage) => {
    setConfig(prev => ({
        ...prev,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
        style: image.style || prev.style,
        aspectRatio: image.aspectRatio || prev.aspectRatio,
        model: image.model || prev.model,
        seed: image.seed !== undefined ? image.seed : prev.seed,
        mode: image.type === 'video' ? 'video' : 'image'
    }));
    setIsGalleryOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification("Settings restored from history.", 'info');
  };

  const handleTemplateApply = (text: string) => {
      setConfig(prev => ({ ...prev, prompt: text }));
  };

  if (hasKey === null) return <div className="min-h-screen bg-[#050510]" />;

  if (isLocked) {
      return (
        <div className="min-h-screen text-white relative flex flex-col items-center justify-center overflow-hidden">
            <Background theme={config.theme} />
            <div className="z-10 p-1 bg-gradient-to-br from-red-500/30 via-purple-500/30 to-transparent rounded-3xl backdrop-blur-sm max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-500">
               <div className="bg-[#0b0e1e]/90 rounded-[22px] p-8 text-center space-y-8 relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_0%,rgba(255,0,0,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan" />
                  <div className="relative">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-4 animate-pulse">
                        <Lock className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold font-rajdhani bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-white to-purple-400 relative">
                      Security Clearance
                    </h1>
                  </div>
                  <div className="space-y-4">
                      <p className="text-gray-300 font-light text-sm">
                        This system is running in managed mode. Please enter the access code to use the hosted API key.
                      </p>
                      <div className="space-y-3">
                             <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input 
                                    type="password"
                                    placeholder="Enter Access Code..."
                                    value={accessCodeInput}
                                    onChange={(e) => setAccessCodeInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAccessCodeSubmit()}
                                    className="w-full bg-[#131629] border border-red-500/20 rounded-xl py-3 pl-10 pr-4 text-white focus:border-red-500 focus:outline-none transition-colors text-center font-mono tracking-widest"
                                />
                             </div>
                             <button 
                                onClick={handleAccessCodeSubmit}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-purple-700 font-bold text-white shadow-lg shadow-red-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                            >
                                <Zap size={18} />
                                Verify Identity
                            </button>
                            <div className="pt-4 border-t border-white/5 mt-4">
                                <button onClick={handleSwitchToBYOK} className="text-xs text-gray-500 hover:text-white transition-colors underline decoration-dotted">I want to use my own Personal API Key</button>
                            </div>
                      </div>
                  </div>
               </div>
            </div>
            {notification && (
                <div className="fixed top-10 right-1/2 translate-x-1/2 z-[60] px-6 py-3 rounded-full bg-red-500/90 text-white shadow-xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-top-4 fade-in">
                    <AlertCircle size={18} /> {notification.message}
                </div>
            )}
        </div>
      );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen text-white relative flex flex-col items-center justify-center overflow-hidden">
        <Background theme={config.theme} />
        <div className="z-10 p-1 bg-gradient-to-br from-cyan-500/30 via-purple-500/30 to-transparent rounded-3xl backdrop-blur-sm max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-500">
           <div className="bg-[#0b0e1e]/90 rounded-[22px] p-8 text-center space-y-8">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <h1 className="text-4xl font-bold font-rajdhani bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-purple-400 relative">
                  Nebula AI
                </h1>
              </div>
              <div className="space-y-4">
                  <p className="text-gray-300 font-light text-lg">
                    {window.aistudio ? "Connect your Google Cloud project to start generating art." : "Enter your Google Gemini API Key to initialize the core."}
                  </p>
                  {window.aistudio ? (
                    <button 
                        onClick={handleApiKeySelect}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold text-white shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                        <Key size={18} className="group-hover:rotate-12 transition-transform"/>
                        Connect API Key
                    </button>
                  ) : (
                    <div className="space-y-3">
                         <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="password"
                                placeholder="Paste API Key here..."
                                value={manualKey}
                                onChange={(e) => setManualKey(e.target.value)}
                                className="w-full bg-[#131629] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                            />
                         </div>
                         <button onClick={handleManualKeySubmit} disabled={!manualKey.trim()} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-bold text-white shadow-lg shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"><Zap size={18} /> Initialize System</button>
                         <p className="text-[10px] text-gray-500">Key is stored locally in your browser.</p>
                    </div>
                  )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative transition-colors duration-500 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      <Background theme={config.theme} isGenerating={isGenerating} />
      <Header onOpenSettings={() => setIsSettingsOpen(true)} onOpenGallery={() => setIsGalleryOpen(true)} onOpenHelp={handleOpenHelp} theme={config.theme} />
      <main className="container mx-auto px-4 pt-10 pb-20 relative z-10">
        <div className="text-center mb-10 relative">
          <h1 className={`text-5xl md:text-6xl font-bold bg-clip-text text-transparent glow-text mb-4 tracking-tight ${isLight ? 'bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-500' : 'bg-gradient-to-r from-cyan-300 via-white to-purple-400'}`}>
            {config.mode === 'video' ? 'AI Video Generator' : 'AI Art Generator'}
          </h1>
          <p className={`text-lg md:text-xl font-light max-w-2xl mx-auto ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
            {config.mode === 'video' ? 'Create stunning video clips with Veo' : 'Create stunning visuals with Gemini'}
          </p>
        </div>
        {notification && (
            <div className={`fixed top-24 right-4 z-[60] max-w-sm w-full border-l-4 p-4 rounded-r shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300 flex items-start gap-3 backdrop-blur-md ${notification.type === 'error' ? 'bg-[#1e293b]/90 border-red-500 text-white' : notification.type === 'success' ? 'bg-[#1e293b]/90 border-green-500 text-white' : notification.type === 'warning' ? 'bg-[#1e293b]/90 border-yellow-500 text-white' : 'bg-[#1e293b]/90 border-cyan-500 text-white'}`}>
                {notification.type === 'error' && <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />}
                {notification.type === 'success' && <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />}
                {notification.type === 'warning' && <Zap className="text-yellow-500 shrink-0 mt-0.5" size={20} />}
                {notification.type === 'info' && <Info className="text-cyan-500 shrink-0 mt-0.5" size={20} />}
                <div className="flex-1">
                   <p className="font-medium text-sm">{notification.message}</p>
                   {showFreeTierSuggestion && (
                     <button onClick={switchToFreeTier} className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-xs font-bold uppercase tracking-wider transition-all"><Zap size={12} className="fill-current" /> Switch to Free Model</button>
                   )}
                </div>
                <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
        )}
        <div className="flex flex-col lg:flex-row gap-6 max-w-[1400px] mx-auto items-start">
            <div className="flex-1 min-w-0 flex flex-col gap-6 w-full">
                <div className={`w-full rounded-3xl p-[1px] shadow-[0_0_50px_rgba(8,145,178,0.1)] backdrop-blur-sm ${isLight ? 'bg-gradient-to-br from-cyan-200 via-purple-200 to-transparent' : 'bg-gradient-to-br from-cyan-500/30 via-purple-500/10 to-transparent'}`}>
                <div className={`rounded-3xl p-6 md:p-8 backdrop-blur-xl transition-colors ${isLight ? 'bg-white/80' : 'bg-[#0b0e1e]/90'}`}>
                    <div className="grid grid-cols-1 gap-6">
                        <PromptInput placeholder={config.mode === 'video' ? "Describe the video scene..." : "Describe the image..."} value={config.prompt} onChange={(val) => updateConfig('prompt', val)} onClear={() => { updateConfig('prompt', ''); updateConfig('inputImage', null); }} onGenerate={handleGenerate} isMain={true} isLoading={isGenerating} theme={config.theme} mode={config.mode} onOpenTemplates={() => setIsTemplatesOpen(true)} inputImage={config.inputImage} onImageUpload={handleImageUpload} onClearImage={() => updateConfig('inputImage', null)} onEnhance={handleEnhancePrompt} isEnhancing={isEnhancing} currentStyle={config.style} onStyleChange={(style) => updateConfig('style', style)} negativeValue={config.negativePrompt} onNegativeChange={(val) => updateConfig('negativePrompt', val)} onDescribe={handleDescribeImage} isDescribing={isDescribing} onStealStyle={handleStealStyle} />
                    </div>
                </div>
                </div>
                <ControlPanel config={config} updateConfig={updateConfig} onNotify={showNotification} />
            </div>
            <div className="lg:w-[320px] xl:w-[380px] shrink-0 lg:sticky lg:top-24">
                <PreviewPane image={previewImage} isLoading={isPreviewLoading} isEnabled={livePreviewEnabled} onToggle={setLivePreviewEnabled} onRefresh={handlePreviewGeneration} hasKey={!!hasKey} theme={config.theme} />
            </div>
        </div>
      </main>
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2">
         {(!window.aistudio && (getStoredApiKey() || isAccessGranted())) && (
            <button onClick={handleApiKeySelect} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg hover:scale-105 duration-300 group relative border ${isLight ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-red-900/50 border-red-500/30 text-red-400 hover:bg-red-900/80'}`} title="Disconnect / Lock"><LogOut size={20} /></button>
         )}
        <button onClick={() => { setConfig(DEFAULT_CONFIG); setGeneratedImages(null); setPreviewImage(null); showNotification("All settings reset to default", 'info'); playClick(); }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg hover:rotate-180 duration-500 group relative border ${isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-black/50 border-white/10 text-white hover:bg-white/10'}`} title="Reset All"><RefreshCcw size={20} /></button>
      </div>
      {generatedImages && generatedImages.length > 0 && (
        <GeneratedImageModal images={generatedImages} onClose={() => setGeneratedImages(null)} prompt={config.prompt} onUpscale={handleUpscale} isUpscaling={isUpscaling} onSave={handleSaveToGallery} onVariations={handleVariations} onEdit={handleEdit} onShare={handleShare} initiallySaved={true} enableAutoSpeak={config.enableAutoSpeak} />
      )}
      <GalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} images={galleryImages} onDelete={handleDeleteImage} onSelect={handleSelectImage} />
       <TemplateModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} onApply={handleTemplateApply} theme={config.theme} />
       <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={config.theme} onUpdateTheme={(theme) => updateConfig('theme', theme)} onManageApiKey={handleApiKeySelect} />
       <OnboardingModal isOpen={isOnboardingOpen} onClose={handleCloseOnboarding} theme={config.theme} />
    </div>
  );
};

export default App;
