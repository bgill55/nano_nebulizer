
import React, { useRef, useState, useEffect } from 'react';
import { AppTheme, GenerationMode } from '../types';
import { Layout, Paperclip, X, Image as ImageIcon, Sparkles, Wand2, History, Trash2, Clock, Dices, Film, Mic, MicOff } from 'lucide-react';
import { getPromptHistory, clearPromptHistory } from '../services/storageService';
import { playClick, playHover, playSuccess } from '../services/audioService';

interface PromptInputProps {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onGenerate?: () => void;
  isMain?: boolean;
  isLoading?: boolean;
  theme?: AppTheme;
  mode?: GenerationMode;
  onOpenTemplates?: () => void;
  inputImage?: string | null;
  onImageUpload?: (file: File) => void;
  onClearImage?: () => void;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}

const LOADING_PHASES = [
  { p: 0, text: "Initializing..." },
  { p: 15, text: "Parsing Prompt..." },
  { p: 30, text: "Synthesizing Concepts..." },
  { p: 50, text: "Generating Base Layer..." },
  { p: 70, text: "Refining Details..." },
  { p: 85, text: "Applying Style..." },
  { p: 95, text: "Final Polish..." },
];

const SURPRISE_PROMPTS = [
    // Sci-Fi & Cyberpunk
    "A futuristic city built inside a giant glass dome on Mars, bioluminescent plants, neon lights, 8k resolution, cinematic lighting.",
    "Cyberpunk street food vendor in Tokyo, rain, reflections on wet pavement, steam rising from food, neon signs.",
    "A futuristic high-speed train traveling through a glass tube underwater, coral reefs outside, bright daylight.",
    "Cyberpunk samurai standing in neon rain, reflection on katana blade, holographic advertisements in background, moody lighting.",
    "Portrait of an astronaut reflecting a galaxy in their helmet visor, detailed reflection, hyperrealistic.",
    "A mechanical heart made of gears and pistons pumping glowing blue fluid, intricate detail, 8k render.",
    "A futuristic racing drone speeding through a neon-lit canyon, motion blur, speed lines.",
    "A robot repair shop with scattered parts, oil stains, and a friendly droid fixing its own arm, cinematic lighting.",
    "A massive Dyson sphere structure under construction around a dying star, epic scale, lens flare.",
    "A hacker's workspace with multiple monitors displaying cascading green code, dark room, ambient purple glow.",

    // Fantasy & Magical
    "A majestic dragon made of crystal and starlight soaring through a nebula, cosmic background, ethereal glow.",
    "A cozy library inside a hollowed-out giant tree, warm lighting, fireflies, magical atmosphere.",
    "An ancient temple overgrown with giant glowing mushrooms in a subterranean cavern, mystical atmosphere, cinematic lighting.",
    "A crystal fox running through a snow-covered forest, aurora borealis in the sky, magical sparkles.",
    "An underwater ballroom with merfolk dancing, chandelier made of glowing jellyfish, elegant and grand.",
    "A giant turtle carrying an island on its back swimming through a sea of stars, cosmic fantasy.",
    "A wizard's alchemy table cluttered with glowing potions, ancient scrolls, and a sleeping cat, candlelit.",
    "A floating island with waterfalls cascading into the clouds, vibrant green grass, fantasy castle.",
    "A phoenix rising from ashes, feathers made of actual fire and embers, dynamic pose.",
    "A secret garden hidden inside a pocket watch, macro photography, tiny flowers and vines.",

    // Surreal & Abstract
    "A surreal landscape with floating islands and waterfalls cascading into the sky, dreamlike, pastel colors.",
    "A miniature world inside a lightbulb, mossy forests, tiny waterfalls, soft warm glow, macro detail.",
    "A surreal painting of melting clocks draped over dead trees in a desert landscape, Dali style, dreamlike.",
    "Double exposure portrait of a woman's silhouette combined with a forest landscape, misty trees, birds flying.",
    "A glass chess set where the pieces are filled with different colored smoke, checkmate position, macro shot.",
    "A cloud shaped like a sleeping polar bear floating over an iceberg, soft lighting.",
    "A stairway leading up into a moon made of cheese, whimsical art style.",
    "An astronaut fishing for stars from the edge of a crescent moon.",
    "A bouquet of flowers where the petals are made of colorful paint splashes, liquid simulation.",
    "A city made entirely of musical instruments, saxophone skyscrapers, drum buildings.",

    // Photorealistic & Nature
    "A cute robot gardener watering plants in a greenhouse, sunlight streaming through glass, vibrant colors, detailed textures.",
    "Post-apocalyptic overgrown city, nature reclaiming skyscrapers, vines, flowers, deer grazing on asphalt, peaceful atmosphere.",
    "A close-up portrait of a translucent bioluminescent jellyfish floating in a deep space nebula, starlight refraction, macro photography.",
    "A delicious gourmet burger with melting cheese, crisp lettuce, and steam rising, studio food photography.",
    "A tranquil zen garden with raked sand, bonsai trees, and a small pagoda, cherry blossoms falling.",
    "Macro shot of a dew drop on a spider web reflecting a field of sunflowers, high depth of field.",
    "A majestic lion made of storm clouds and lightning, dark moody sky, electric blue eyes.",
    "A knolling photography flat lay of vintage camera gear, highly detailed, clean background.",
    "A red panda wearing aviator goggles flying a vintage biplane, whimsical, highly detailed.",
    "A hyper-realistic close-up of a human eye, the iris containing a map of the world.",

    // Art Styles & Specific Techniques
    "Steampunk airship fleet flying over Victorian London at sunset, detailed mechanical parts, clouds, golden hour.",
    "Steampunk owl with brass gears and clockwork eyes, perched on a pile of old leather books, dust motes dancing in light beams.",
    "Origami paper art landscape of mountains and rivers, textured paper look, soft shadows.",
    "Retro 80s synthwave landscape, grid mountains, purple sun, palm trees, digital glitch aesthetic.",
    "A detailed isometric view of a wizard's tower cutaway, showing library, alchemy lab, and observatory, cozy lighting.",
    "An oil painting of a rainy cafe window in Paris, impressionist style, blurry lights.",
    "A charcoal sketch of a wolf howling at the moon, high contrast, rough texture.",
    "A low poly 3D render of a camping site at night, fire, tent, stars, minimal design.",
    "A stained glass window depicting a cosmic battle between sun and moon.",
    "A porcelain doll with kintsugi gold cracks, hauntingly beautiful, dramatic lighting."
];

const PromptInput: React.FC<PromptInputProps> = ({ 
  placeholder, 
  value, 
  onChange, 
  onClear, 
  onGenerate, 
  isMain = false,
  isLoading = false,
  theme = 'Nebula Dark',
  mode = 'image',
  onOpenTemplates,
  inputImage,
  onImageUpload,
  onClearImage,
  onEnhance,
  isEnhancing = false
}) => {
  const isLight = theme === 'Starlight Light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Progress Simulation State
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);

  // Randomizer State
  const [isRolling, setIsRolling] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // Stop after one sentence for better UX
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                // Append to existing text with a space if needed
                const newValue = value ? `${value} ${transcript}` : transcript;
                onChange(newValue);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }
  }, [value, onChange]);

  const toggleListening = () => {
    playClick(1000);
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    } else {
        try {
            recognitionRef.current?.start();
            setIsListening(true);
        } catch (e) {
            console.error("Failed to start speech recognition", e);
        }
    }
  };

  // Handle Progress Simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isLoading) {
      setProgress(0);
      setLoadingText(mode === 'video' ? "Rendering Frames..." : "Initializing...");
      
      const startTime = Date.now();
      const duration = mode === 'video' ? 15000 : 8000; // Slower for video

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Asymptotic curve: fast start, slows down, never hits 100% until done
        // Formula: 1 - e^(-t / duration)
        let nextProgress = (1 - Math.exp(-elapsed / (duration / 2))) * 100;
        
        // Cap at 98% until actually finished
        if (nextProgress > 98) nextProgress = 98;
        
        setProgress(nextProgress);

        // Update Text Phase
        if (mode === 'image') {
            const phase = LOADING_PHASES.slice().reverse().find(phase => nextProgress >= phase.p);
            if (phase) setLoadingText(phase.text);
        } else {
            if (nextProgress < 30) setLoadingText("Initializing Veo...");
            else if (nextProgress < 60) setLoadingText("Generating Frames...");
            else if (nextProgress < 80) setLoadingText("Encoding Video...");
            else setLoadingText("Finalizing...");
        }

      }, 100);
    } else {
      // When loading finishes, jump to 100% briefly then reset
      if (progress > 0) {
        setProgress(100);
        setLoadingText("Complete!");
        setTimeout(() => {
          setProgress(0);
        }, 500);
      }
    }

    return () => clearInterval(interval);
  }, [isLoading, mode]);

  // Click outside listener for history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    if (showHistory) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory]);

  const toggleHistory = () => {
    playClick(600);
    if (!showHistory) {
      setHistoryItems(getPromptHistory());
    }
    setShowHistory(!showHistory);
  };

  const handleSelectHistory = (prompt: string) => {
    playClick(800);
    onChange(prompt);
    setShowHistory(false);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    playClick(500);
    clearPromptHistory();
    setHistoryItems([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      playClick(1200);
      onImageUpload(e.target.files[0]);
    }
    // Reset value so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSurpriseMe = () => {
      if (isRolling) return;
      setIsRolling(true);
      playClick(1500);

      let rolls = 0;
      const maxRolls = 12;
      const baseInterval = 50;

      // Slot machine effect: shuffle through options rapidly then slow down
      const shuffle = () => {
        if (rolls >= maxRolls) {
            // Final pick
            const randomPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
            onChange(randomPrompt);
            setIsRolling(false);
            playSuccess(); 
            return;
        }

        const tempPrompt = SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
        onChange(tempPrompt);
        playHover(); // Tick sound
        
        rolls++;
        // Slow down linearly
        setTimeout(shuffle, baseInterval + (rolls * 15));
      };

      shuffle();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          if (onGenerate && !isLoading) {
              onGenerate();
          }
      }
  };

  return (
    <div className={`relative w-full rounded-2xl transition-all duration-300 p-1 group border z-20
        ${isLight 
            ? 'bg-white/90 border-slate-200 shadow-sm focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
            : 'bg-[#0f1225]/80 border-white/5 focus-within:border-purple-500/30'}
        ${isMain && !isLight ? 'focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]' : ''}
    `}>
      
      {/* Glow effect container */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex h-full">
        <div className="flex-1 relative flex flex-col">
           <textarea
            className={`w-full bg-transparent p-6 text-sm md:text-base outline-none resize-none font-light tracking-wide min-h-[120px] transition-colors
              ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-gray-100 placeholder-gray-500'}
              ${inputImage ? 'pb-24' : ''} 
              ${isRolling ? 'blur-[1px] opacity-80' : 'blur-0 opacity-100'}
            `}
            placeholder={isListening ? "Listening..." : placeholder}
            value={value}
            onChange={(e) => !isRolling && onChange(e.target.value)}
            onKeyDown={isMain ? handleKeyDown : undefined}
            spellCheck={false}
            disabled={isRolling}
          />
          
          {/* Helper Text for Shortcut */}
          {isMain && (
             <div className={`absolute bottom-3 right-4 text-[10px] pointer-events-none opacity-50 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                Ctrl + Enter to Generate
             </div>
          )}

          {/* Voice Listening Indicator */}
          {isListening && (
              <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-red-500' : 'text-red-400'}`}>Rec</span>
              </div>
          )}

          {/* Image Preview Area */}
          {inputImage && (
            <div className="absolute bottom-4 left-6 z-10 animate-in fade-in slide-in-from-bottom-2">
              <div className={`relative group/image inline-block rounded-lg overflow-hidden border
                   ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-black/20'}
              `}>
                <img 
                  src={inputImage} 
                  alt="Reference" 
                  className="h-16 w-auto object-cover opacity-80 group-hover/image:opacity-100 transition-opacity" 
                />
                <button 
                  onClick={() => {
                      playClick(400);
                      onClearImage && onClearImage();
                  }}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              <div className={`text-[10px] mt-1 font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  {mode === 'video' ? 'Start Frame' : 'Image Reference'}
              </div>
            </div>
          )}
        </div>
        
        <div className={`flex flex-col gap-2 p-3 justify-center border-l rounded-r-xl relative
            ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-black/20'}
        `}>
           {isMain && onImageUpload && (
            <>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="flex gap-2">
                 {/* Upload Button */}
                 <button 
                    onClick={() => {
                        playClick(600);
                        fileInputRef.current?.click();
                    }}
                    className={`flex-1 min-h-[40px] px-2 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 mb-1 border
                        ${isLight 
                            ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                        ${inputImage ? (isLight ? 'border-cyan-400 text-cyan-600 bg-cyan-50' : 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10') : ''}
                    `}
                    title={mode === 'video' ? "Upload Start Frame (Image-to-Video)" : "Upload Reference Image"}
                 >
                    {inputImage ? <ImageIcon size={14} /> : <Paperclip size={14} />} 
                 </button>

                 {/* Voice Input Button */}
                 {recognitionRef.current && (
                    <button 
                        onClick={toggleListening}
                        className={`flex-1 min-h-[40px] px-2 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 mb-1 border
                            ${isListening 
                                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
                                : (isLight ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10')}
                        `}
                        title="Voice Input"
                    >
                        {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                 )}
                 
                 {/* Surprise Me Button */}
                 <button 
                    onClick={handleSurpriseMe}
                    disabled={isRolling}
                    className={`flex-1 min-h-[40px] px-2 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 mb-1 border group/dice
                        ${isLight 
                            ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                        ${isRolling ? 'text-cyan-400 border-cyan-500/30' : ''}
                    `}
                    title="Surprise Me (Random Prompt)"
                 >
                    <Dices size={14} className={`transition-transform duration-500 ${isRolling ? 'animate-spin' : 'group-hover/dice:rotate-180'}`} />
                 </button>
              </div>
            </>
          )}

          {isMain && onEnhance && (
             <button 
              onClick={() => {
                  playClick(1000);
                  onEnhance();
              }}
              disabled={isEnhancing}
              className={`w-full min-h-[40px] px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mb-1 border relative overflow-hidden group/enhance
                 ${isLight 
                    ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' 
                    : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'}
              `}
              title="Enhance Prompt with AI"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-150%] group-hover/enhance:animate-[shimmer_1.5s_infinite] ${isEnhancing ? 'animate-[shimmer_1s_infinite]' : ''}`} />
              <Sparkles size={14} className={isEnhancing ? "animate-spin" : ""} /> 
              <span className="hidden sm:inline">{isEnhancing ? 'Enhancing...' : 'Magic'}</span>
            </button>
          )}

          {isMain && (
            <div className="relative w-full" ref={historyRef}>
                <button 
                    onClick={toggleHistory}
                    className={`w-full min-h-[40px] px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mb-1 border
                        ${isLight 
                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                        ${showHistory ? (isLight ? 'bg-slate-100' : 'bg-white/10') : ''}
                    `}
                    title="Prompt History"
                >
                    <History size={14} /> <span className="hidden sm:inline">History</span>
                </button>

                {/* History Dropdown */}
                {showHistory && (
                    <div className={`absolute top-full right-0 mt-2 w-64 md:w-80 rounded-xl shadow-2xl border backdrop-blur-md z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right
                        ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1225] border-white/10'}
                    `}>
                        <div className={`p-3 border-b flex items-center justify-between
                            ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#131629] border-white/5'}
                        `}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Recent Prompts</span>
                            {historyItems.length > 0 && (
                                <button 
                                    onClick={handleClearHistory}
                                    className={`text-[10px] flex items-center gap-1 hover:underline ${isLight ? 'text-red-500' : 'text-red-400'}`}
                                >
                                    <Trash2 size={10} /> Clear
                                </button>
                            )}
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {historyItems.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 text-xs">
                                    No history yet.
                                </div>
                            ) : (
                                <div className="py-1">
                                    {historyItems.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectHistory(item)}
                                            className={`w-full text-left px-4 py-3 text-xs leading-relaxed transition-colors border-b last:border-0 border-transparent
                                                ${isLight 
                                                    ? 'text-slate-600 hover:bg-slate-50 border-slate-50' 
                                                    : 'text-gray-300 hover:bg-white/5 border-white/5'}
                                            `}
                                        >
                                            <div className="flex items-start gap-2">
                                                <Clock size={12} className={`mt-0.5 shrink-0 ${isLight ? 'text-slate-400' : 'text-gray-600'}`} />
                                                <span className="line-clamp-2">{item}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
          )}

          {isMain && onOpenTemplates && (
            <button 
              onClick={() => {
                  playClick(700);
                  onOpenTemplates();
              }}
              className={`w-full min-h-[40px] px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 mb-1 border
                 ${isLight 
                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
              `}
              title="Templates"
            >
              <Layout size={14} /> <span className="hidden sm:inline">Templates</span>
            </button>
          )}

          {isMain && onGenerate && (
            <button 
              onClick={onGenerate}
              disabled={isLoading}
              className={`w-full h-[80px] px-6 py-2 rounded-lg relative overflow-hidden transition-all shadow-lg shadow-purple-900/40 flex flex-col items-center justify-center mb-1
                ${isLoading 
                    ? (isLight ? 'bg-slate-200 cursor-not-allowed' : 'bg-[#1a1f3d] cursor-not-allowed')
                    : 'bg-gradient-to-br from-fuchsia-500 to-purple-600 hover:scale-105 hover:shadow-purple-500/30'
                }
              `}
            >
              {isLoading ? (
                <>
                    {/* Progress Bar Background */}
                    <div className="absolute bottom-0 left-0 h-1.5 bg-black/20 w-full" />
                    <div 
                        className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                    
                    {/* Floating Particles/Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-[shimmer_2s_infinite]" />

                    <div className="flex flex-col items-center gap-1 z-10">
                        <div className="flex items-center gap-2">
                            {mode === 'video' ? <Film size={16} className={`animate-pulse ${isLight ? 'text-purple-600' : 'text-cyan-400'}`} /> : <Sparkles size={16} className={`animate-spin ${isLight ? 'text-purple-600' : 'text-cyan-400'}`} />}
                            <span className={`text-xs font-bold uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-cyan-100'}`}>
                                {Math.round(progress)}%
                            </span>
                        </div>
                        <span className={`text-[10px] font-mono opacity-80 ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                            {loadingText}
                        </span>
                    </div>
                </>
              ) : (
                <>
                    <span className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                        {mode === 'video' ? <Film size={16} /> : <Wand2 size={16} />} Generate
                    </span>
                </>
              )}
            </button>
          )}

          <button 
            onClick={() => {
                playClick(400);
                onClear();
            }}
            className={`w-full min-h-[40px] px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wider opacity-90 hover:opacity-100 transition-all shadow-lg flex items-center justify-center
              ${isMain 
                ? 'bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-cyan-500/20' 
                : 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-cyan-900/20'
              }
            `}
          >
            Clear
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
