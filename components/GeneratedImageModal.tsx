
import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Sparkles, Loader2, Bookmark, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Layers, Video, Edit2, BrainCircuit, Terminal } from 'lucide-react';
import { GeneratedImage } from '../types';
import HolographicCard from './HolographicCard';
import { generateBackstory } from '../services/geminiService';
import { playClick, playSuccess } from '../services/audioService';

interface GeneratedImageModalProps {
  images: GeneratedImage[];
  onClose: () => void;
  prompt: string;
  onUpscale: (image: GeneratedImage) => void;
  isUpscaling: boolean;
  onSave: (image: GeneratedImage) => void;
  onVariations?: (image: GeneratedImage) => void;
  onEdit?: (image: GeneratedImage) => void;
  onShare?: (image: GeneratedImage) => void;
}

const GeneratedImageModal: React.FC<GeneratedImageModalProps> = ({ 
  images, 
  onClose, 
  prompt,
  onUpscale,
  isUpscaling,
  onSave,
  onVariations,
  onEdit,
  onShare
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSavedMap, setIsSavedMap] = useState<Record<string, boolean>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down' | null>>({});
  
  // Backstory State
  const [backstories, setBackstories] = useState<Record<string, string>>({});
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [revealStory, setRevealStory] = useState(false);

  // Glitch Reveal State
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Reset reveal animation when image changes
    setIsRevealed(false);
    const timer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isUpscaling) return;
        
        if (e.key === 'ArrowRight') {
            setSelectedIndex(prev => (prev + 1) % images.length);
        } else if (e.key === 'ArrowLeft') {
            setSelectedIndex(prev => (prev - 1 + images.length) % images.length);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, isUpscaling, onClose]);

  if (!images || images.length === 0) return null;
  const currentImage = images[selectedIndex];
  const isVideo = currentImage.type === 'video';

  const handleSaveCurrent = () => {
    playClick();
    onSave(currentImage);
    setIsSavedMap(prev => ({ ...prev, [currentImage.id]: true }));
  };

  const handleUpscaleCurrent = () => {
      playClick();
      onUpscale(currentImage);
  };

  const handleVariations = () => {
      playClick();
      if (onVariations) onVariations(currentImage);
  };

  const handleEdit = () => {
      playClick();
      if (onEdit) {
          onEdit(currentImage);
          onClose();
      }
  };

  const handleShare = () => {
      playClick();
      if (onShare) onShare(currentImage);
  };

  const handleFeedback = (type: 'up' | 'down') => {
      playClick();
      if (feedbackMap[currentImage.id] === type) {
          setFeedbackMap(prev => ({ ...prev, [currentImage.id]: null }));
          return;
      }
      setFeedbackMap(prev => ({ ...prev, [currentImage.id]: type }));
  };

  const handleGenerateBackstory = async () => {
      if (backstories[currentImage.id]) {
          setRevealStory(!revealStory);
          return;
      }
      
      playClick();
      setIsGeneratingStory(true);
      setRevealStory(true);
      
      try {
          const story = await generateBackstory(currentImage.url, currentImage.prompt);
          setBackstories(prev => ({ ...prev, [currentImage.id]: story }));
          playSuccess();
      } catch (e) {
          console.error(e);
      } finally {
          setIsGeneratingStory(false);
      }
  };

  const nextImage = () => { playClick(700); setSelectedIndex(prev => (prev + 1) % images.length); };
  const prevImage = () => { playClick(700); setSelectedIndex(prev => (prev - 1 + images.length) % images.length); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={!isUpscaling ? onClose : undefined}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#131629] shrink-0">
          <h3 className="text-lg font-medium text-white flex items-center gap-2 font-rajdhani tracking-wide">
            <span className={`w-2 h-2 rounded-full ${isUpscaling ? 'bg-yellow-400' : 'bg-cyan-400'} ${isUpscaling ? 'animate-pulse' : 'shadow-[0_0_10px_#22d3ee]'}`}/>
            {isUpscaling ? 'ENHANCING RESOLUTION...' : isVideo ? 'VIDEO GENERATED' : images.length > 1 ? `BATCH (${selectedIndex + 1}/${images.length})` : 'GENERATION COMPLETE'}
          </h3>
          <button 
            onClick={onClose}
            disabled={isUpscaling}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Thumbnails */}
            {images.length > 1 && (
                <div className="w-full md:w-32 bg-[#050510] border-r border-white/5 p-4 flex flex-row md:flex-col gap-3 overflow-auto shrink-0 order-2 md:order-1 custom-scrollbar">
                    {images.map((img, idx) => (
                        <button
                            key={img.id}
                            onClick={() => setSelectedIndex(idx)}
                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group shrink-0 w-20 md:w-full
                                ${selectedIndex === idx 
                                    ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02] z-10' 
                                    : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30 hover:scale-[1.02]'}
                            `}
                        >
                            {img.type === 'video' ? (
                                <div className="w-full h-full bg-black flex items-center justify-center text-white/50">
                                    <Video size={24} />
                                </div>
                            ) : (
                                <img src={img.url} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                            )}
                            {selectedIndex === idx && (
                                <div className="absolute inset-0 bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/30" />
                            )}
                            <div className={`absolute bottom-1 right-1 text-[10px] font-mono px-1.5 rounded-sm backdrop-blur-sm
                                ${selectedIndex === idx ? 'bg-cyan-500 text-white' : 'bg-black/60 text-gray-300'}
                            `}>
                                {idx + 1}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Viewport */}
            <div className="flex-1 relative bg-black/50 flex flex-col items-center justify-center p-4 order-1 md:order-2 overflow-hidden group/main">
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                        style={{ 
                            backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}>
                </div>
                
                {images.length > 1 && !isUpscaling && (
                    <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover/main:opacity-100 backdrop-blur-sm"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/70 hover:scale-110 transition-all opacity-0 group-hover/main:opacity-100 backdrop-blur-sm"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                <div className={`relative transition-all duration-700 ${isRevealed ? 'opacity-100 translate-y-0 filter-none' : 'opacity-0 translate-y-4 blur-xl'}`}>
                    {/* Glitch Overlay for Reveal Effect */}
                    {!isRevealed && (
                        <div className="absolute inset-0 bg-cyan-500 mix-blend-color-dodge opacity-50 animate-pulse z-30" />
                    )}

                    {isVideo ? (
                        <video 
                            src={currentImage.url} 
                            controls 
                            autoPlay 
                            loop
                            className="max-h-[60vh] md:max-h-[70vh] max-w-full rounded-lg shadow-2xl border border-white/10"
                        />
                    ) : (
                        <HolographicCard>
                            <img 
                                src={currentImage.url} 
                                alt={prompt}
                                className={`max-h-[60vh] md:max-h-[70vh] max-w-full w-auto h-auto object-contain rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/5 relative z-10 transition-all duration-500 
                                    ${isUpscaling ? 'blur-sm scale-[0.98]' : 'blur-0 scale-100'}
                                `}
                            />
                        </HolographicCard>
                    )}
                </div>

                {isUpscaling && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                        <div className="bg-black/60 backdrop-blur-sm p-4 rounded-xl flex items-center gap-3 border border-white/10 shadow-xl">
                            <Loader2 className="animate-spin text-cyan-400" size={24} />
                            <span className="text-cyan-100 font-medium font-mono">ENHANCING_RESOLUTION_4K...</span>
                        </div>
                    </div>
                )}
                
                {/* Backstory / Neural Link Overlay */}
                {revealStory && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[600px] z-40 animate-in slide-in-from-bottom-4 fade-in duration-300">
                        <div className="bg-[#0b0e1e]/95 border border-cyan-500/30 rounded-xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden group/lore">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
                            <button 
                                onClick={() => setRevealStory(false)}
                                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                            
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-1 border border-cyan-500/20">
                                    <BrainCircuit size={18} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-500 mb-2 flex items-center gap-2">
                                        Neural Link Analysis {isGeneratingStory && <span className="animate-pulse">_Processing</span>}
                                    </h4>
                                    <div className="text-sm text-gray-300 font-mono leading-relaxed min-h-[60px] max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                        {isGeneratingStory ? (
                                            <span className="flex items-center gap-2 text-cyan-400/70">
                                                <Loader2 size={14} className="animate-spin" /> Decoding visual data stream...
                                            </span>
                                        ) : (
                                            <p className="typing-effect relative">
                                                {backstories[currentImage.id]}
                                                <span className="inline-block w-2 h-4 bg-cyan-500/50 ml-1 animate-pulse align-middle" />
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#131629] border-t border-white/5 space-y-4 shrink-0 z-20">
            <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm line-clamp-1 italic max-w-2xl">
                    <span className="text-cyan-600 font-mono mr-2">PROMPT_LOG:</span>
                    "{prompt}"
                </p>
            </div>
            
            <div className="flex flex-wrap gap-3 justify-end items-center">
                
                {/* Neural Link Button */}
                {!isVideo && (
                    <button 
                        onClick={handleGenerateBackstory}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border mr-auto
                             ${revealStory 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' 
                                : 'bg-transparent text-gray-400 border-white/5 hover:border-cyan-500/30 hover:text-cyan-300'}
                        `}
                    >
                        <Terminal size={14} /> 
                        {backstories[currentImage.id] ? 'View Log' : 'Neural Link'}
                    </button>
                )}

                <div className="flex items-center gap-1 mr-2 border-r border-white/10 pr-3">
                    <button 
                        onClick={() => handleFeedback('up')}
                        disabled={isUpscaling}
                        className={`p-2 rounded-lg transition-all ${feedbackMap[currentImage.id] === 'up' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ThumbsUp size={16} className={feedbackMap[currentImage.id] === 'up' ? 'fill-current' : ''} />
                    </button>
                    <button 
                        onClick={() => handleFeedback('down')}
                        disabled={isUpscaling}
                        className={`p-2 rounded-lg transition-all ${feedbackMap[currentImage.id] === 'down' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ThumbsDown size={16} className={feedbackMap[currentImage.id] === 'down' ? 'fill-current' : ''} />
                    </button>
                </div>

                {!isVideo && onEdit && (
                     <button 
                        onClick={handleEdit}
                        disabled={isUpscaling}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 hover:border-purple-500/30 rounded-lg text-sm font-medium transition-all text-purple-200 disabled:opacity-50"
                    >
                        <Edit2 size={16} />
                        Edit
                    </button>
                )}

                {!isVideo && onVariations && (
                    <button 
                        onClick={handleVariations}
                        disabled={isUpscaling}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 hover:border-cyan-500/30 rounded-lg text-sm font-medium transition-all text-cyan-200 disabled:opacity-50"
                    >
                        <Layers size={16} />
                        Variations
                    </button>
                )}

                {!isVideo && (
                <button 
                    onClick={handleUpscaleCurrent}
                    disabled={isUpscaling}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-200 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
                    Upscale 4K
                </button>
                )}

                <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>

                <button 
                    onClick={handleSaveCurrent}
                    disabled={isUpscaling || isSavedMap[currentImage.id]}
                    className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-white/5 ${isUpscaling ? 'pointer-events-none opacity-50' : ''} ${isSavedMap[currentImage.id] ? 'text-green-400 border-green-500/30' : ''}`}
                >
                    <Bookmark size={16} fill={isSavedMap[currentImage.id] ? "currentColor" : "none"} />
                    {isSavedMap[currentImage.id] ? 'Saved' : 'Save'}
                </button>

                <a 
                  href={currentImage.url} 
                  download={`generated-art-${Date.now()}.${isVideo ? 'mp4' : 'png'}`}
                  className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-white/5 ${isUpscaling ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <Download size={16} />
                    Download
                </a>
                
                {onShare && (
                <button 
                    onClick={handleShare}
                    className={`flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-white/5 ${isUpscaling ? 'pointer-events-none opacity-50' : ''}`}
                >
                    <Share2 size={16} />
                    Share
                </button>
                )}

                <button 
                    onClick={onClose}
                    disabled={isUpscaling}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 rounded-lg text-sm font-bold text-white shadow-lg shadow-purple-900/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                    Generate Another
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedImageModal;
