
import React, { useRef, useState, useEffect } from 'react';
import { AppTheme, GenerationMode } from '../types';
import { Layout, Paperclip, X, Image as ImageIcon, Sparkles, Wand2, History, Trash2, Dices, Film, Mic, MicOff, Palette, BrainCircuit, ShieldBan, Plus, ChevronUp, ChevronDown, FileJson, Video, Move, ZoomIn, Camera, ScanEye, Loader2, Pipette, Lightbulb } from 'lucide-react';
import { getPromptHistory, clearPromptHistory } from '../services/storageService';
import { playClick, playHover, playSuccess } from '../services/audioService';
import { detectStyleFromPrompt } from '../services/geminiService';

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
  currentStyle?: string;
  onStyleChange?: (style: string) => void;
  // Integrated Negative Prompt Props
  negativeValue?: string;
  onNegativeChange?: (value: string) => void;
  // Image to Prompt
  onDescribe?: () => void;
  isDescribing?: boolean;
  // Style Transfer
  onStealStyle?: () => void;
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

const VIDEO_PROMPTS = [
    "Cinematic drone shot flying over a futuristic cyberpunk city at night, neon lights reflecting on wet pavement, 4k resolution.",
    "Aerial view of a jagged coastline with crashing waves, slow motion, moody overcast sky.",
    "A camera flying through a dense jungle, revealing a hidden ancient stone temple, sunlight streaming through leaves.",
    "FPV drone shot racing through a narrow canyon, speed lines, motion blur, high adrenaline.",
    "Wide shot of a spaceship landing on a dusty red planet, thrusters kicking up dust clouds, cinematic lighting.",
    "A majestic lion running across the African savanna during golden hour, dust kicking up, slow motion.",
    "Time-lapse of a flower blooming, vibrant colors, soft lighting, macro perspective, 4k.",
    "Underwater footage of a coral reef with colorful fish swimming, sun rays penetrating the water.",
    "A cute red panda eating bamboo in a lush green bamboo forest, sunlight filtering through leaves, wildlife documentary style.",
    "A wolf howling at a giant full moon, silhouette against the night sky, wind blowing through fur.",
    "A cyberpunk samurai drawing their katana in the rain, neon reflections on the blade, slow motion.",
    "A futuristic car driving fast through a tunnel of light, motion blur, synthwave aesthetic.",
    "A robot hand assembling a mechanical watch, sparks flying, high detail macro, precise movements.",
    "A chef chopping vegetables rapidly in a professional kitchen, steam rising from pots, dynamic camera angle.",
    "An astronaut floating in zero gravity inside a spaceship corridor, spinning slowly, intricate sci-fi details.",
    "A liquid gold simulation pouring over a black sphere, splashing and flowing, abstract 3d render style.",
    "A storm brewing over the ocean, dark clouds swirling, lightning strikes, cinematic visual effects.",
    "A retro 80s vaporwave grid landscape moving forward endlessly, purple sun setting, synthwave vibe.",
    "Close-up of a human eye blinking, with a galaxy reflection in the iris, macro shot.",
    "Explosion of colorful powder paint in slow motion against a black background, 4k resolution."
];

const SURPRISE_PROMPTS = [
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
    "A surreal landscape with floating islands and waterfalls cascading into the sky, dreamlike, pastel colors.",
    "A miniature world inside a lightbulb, mossy forests, tiny waterfalls, soft warm glow, macro detail.",
    "A surreal painting of melting clocks draped over dead trees in a desert landscape, Dali style, dreamlike.",
    "Double exposure portrait of a woman's silhouette combined with a forest landscape, mistry trees, birds flying.",
    "A glass chess set where the pieces are filled with different colored smoke, checkmate position, macro shot.",
    "A cloud shaped like a sleeping polar bear floating over an iceberg, soft lighting.",
    "A stairway leading up into a moon made of cheese, whimsical art style.",
    "An astronaut fishing for stars from the edge of a crescent moon.",
    "A bouquet of flowers where the petals are made of colorful paint splashes, liquid simulation.",
    "A city made entirely of musical instruments, saxophone skyscrapers, drum buildings.",
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

const AVAILABLE_STYLES = [
    { label: 'Anime', value: 'Anime', color: 'from-pink-500 to-rose-500' },
    { label: 'Cinematic', value: 'Cinematic', color: 'from-amber-500 to-orange-600' },
    { label: 'Cyberpunk', value: 'Cyberpunk', color: 'from-cyan-500 to-blue-600' },
    { label: 'Photoreal', value: 'Photorealistic', color: 'from-emerald-500 to-teal-600' },
    { label: 'Oil Paint', value: 'Oil Painting', color: 'from-yellow-600 to-red-600' },
    { label: '3D Render', value: '3D Render', color: 'from-indigo-500 to-purple-600' },
    { label: 'Pixel Art', value: 'Pixel Art', color: 'from-purple-600 to-indigo-600' },
    { label: 'Fantasy', value: 'Dark Fantasy', color: 'from-slate-700 to-black' },
    { label: 'Watercolor', value: 'Watercolor', color: 'from-cyan-400 to-blue-400' },
    { label: 'Vaporwave', value: 'Vaporwave', color: 'from-pink-400 to-cyan-400' },
    { label: 'Origami', value: 'Origami Paper Art', color: 'from-orange-400 to-yellow-500' },
    { label: 'Isometric', value: 'Isometric 3D', color: 'from-blue-500 to-cyan-500' },
];

const NEGATIVE_PRESETS = [
    { label: "Standard Quality", value: "blurry, low quality, pixelated, watermark, signature, text, jpeg artifacts, distortion, noise" },
    { label: "Bad Anatomy", value: "bad anatomy, deformed, disfigured, extra limbs, missing limbs, bad hands, mutation, gross proportions, malformed, long neck" },
    { label: "Not Photoreal", value: "cartoon, anime, sketch, drawing, painting, illustration, 3d render, cgi" },
    { label: "Not 3D/CG", value: "photo, realistic, grain, photography, render, unreal engine" },
    { label: "NSFW Filter", value: "nsfw, nude, naked, uncensored, violence, blood, gore, explicit" }
];

const VIDEO_CAMERA_CONTROLS = [
    { label: "Pan Left", value: "Camera pans left", icon: Move },
    { label: "Pan Right", value: "Camera pans right", icon: Move },
    { label: "Zoom In", value: "Slow zoom in", icon: ZoomIn },
    { label: "Zoom Out", value: "Slow zoom out", icon: ZoomIn },
    { label: "Drone", value: "Aerial drone shot", icon: Camera },
    { label: "Orbit", value: "Camera orbits the subject", icon: Move },
    { label: "FPV", value: "Fast FPV drone flythrough", icon: Video },
    { label: "Tracking", value: "Camera tracks the subject", icon: Video },
];

const PromptInput: React.FC<PromptInputProps> = ({ 
  label,
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
  isEnhancing = false,
  currentStyle = 'None',
  onStyleChange,
  negativeValue,
  onNegativeChange,
  onDescribe,
  isDescribing = false,
  onStealStyle
}) => {
  const isLight = theme === 'Starlight Light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Progress Simulation State
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing...");
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);

  // Style Menu State
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const [isStyleRolling, setIsStyleRolling] = useState(false);
  const [isMatching, setIsMatching] = useState(false); 

  // Negative Menu State
  const [showNegativeMenu, setShowNegativeMenu] = useState(false);
  const [showNegativeInput, setShowNegativeInput] = useState(false);
  const negativeMenuRef = useRef<HTMLDivElement>(null);
  const [isAdded, setIsAdded] = useState(false);

  // Inspiration State
  const [showInspirationMenu, setShowInspirationMenu] = useState(false);
  const inspirationRef = useRef<HTMLDivElement>(null);

  // Randomizer State
  const [isRolling, setIsRolling] = useState(false);

  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isJson = value.trim().startsWith('{');

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
        let nextProgress = (1 - Math.exp(-elapsed / (duration / 2))) * 100;
        if (nextProgress > 98) nextProgress = 98;
        
        setProgress(nextProgress);

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

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setShowStyleMenu(false);
      }
      if (negativeMenuRef.current && !negativeMenuRef.current.contains(event.target as Node)) {
        setShowNegativeMenu(false);
      }
      if (inspirationRef.current && !inspirationRef.current.contains(event.target as Node)) {
        setShowInspirationMenu(false);
      }
    };

    if (showHistory || showStyleMenu || showNegativeMenu || showInspirationMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory, showStyleMenu, showNegativeMenu, showInspirationMenu]);

  const toggleHistory = () => {
    playClick(600);
    if (!showHistory) {
      setHistoryItems(getPromptHistory());
    }
    setShowHistory(!showHistory);
    setShowStyleMenu(false);
    setShowNegativeMenu(false);
    setShowInspirationMenu(false);
  };

  const toggleStyleMenu = () => {
      playClick(700);
      setShowStyleMenu(!showStyleMenu);
      setShowHistory(false);
      setShowNegativeMenu(false);
      setShowInspirationMenu(false);
  };

  const toggleInspirationMenu = () => {
    playClick(750);
    setShowInspirationMenu(!showInspirationMenu);
    setShowHistory(false);
    setShowStyleMenu(false);
    setShowNegativeMenu(false);
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

  const handleAddNegativePreset = (presetValue: string) => {
      if (!onNegativeChange) return;
      
      const current = negativeValue || '';
      let newValue = presetValue;

      // Don't duplicate if already exists roughly
      if (current.includes(presetValue.substring(0, 10))) {
          setShowNegativeMenu(false);
          return;
      }

      if (current) {
          const separator = current.endsWith(',') ? ' ' : ', ';
          newValue = current + separator + presetValue;
      }

      onNegativeChange(newValue);
      playClick(800);
      setShowNegativeMenu(false);
      setShowNegativeInput(true); // Auto-open if a preset is added

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 500);
  };

  const handleAddCameraControl = (controlValue: string) => {
      playClick(900);
      const current = value || '';
      if (current.includes(controlValue)) return; // Avoid dupe
      
      const separator = current.trim().length > 0 ? (current.endsWith('.') || current.endsWith(',') ? ' ' : ', ') : '';
      onChange(`${current}${separator}${controlValue}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onImageUpload) {
      playClick(1200);
      onImageUpload(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSurpriseMe = () => {
      if (isRolling) return;
      setIsRolling(true);
      playClick(1500);

      const promptPool = mode === 'video' ? VIDEO_PROMPTS : SURPRISE_PROMPTS;
      let rolls = 0;
      const maxRolls = 12;
      const baseInterval = 50;

      // Slot machine effect: shuffle through options rapidly then slow down
      const shuffle = () => {
        if (rolls >= maxRolls) {
            // Final pick
            const randomPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];
            onChange(randomPrompt);
            setIsRolling(false);
            playSuccess(); 
            return;
        }

        const tempPrompt = promptPool[Math.floor(Math.random() * promptPool.length)];
        onChange(tempPrompt);
        playHover(); // Tick sound
        
        rolls++;
        // Slow down linearly
        setTimeout(shuffle, baseInterval + (rolls * 15));
      };

      shuffle();
  };

  const handleRandomStyle = () => {
      if (!onStyleChange) return;
      const randomStyle = AVAILABLE_STYLES[Math.floor(Math.random() * AVAILABLE_STYLES.length)];
      onStyleChange(randomStyle.value);
      playSuccess();
  };

  const handleSmartMatch = async () => {
    if (isMatching || !onStyleChange) return;
    setIsMatching(true);
    playClick(1500);

    try {
        const styleValues = AVAILABLE_STYLES.map(s => s.value);
        const match = await detectStyleFromPrompt(value, styleValues);
        
        if (match && match !== 'None') {
            onStyleChange(match);
            playSuccess();
        } else {
            onStyleChange('None');
        }
    } catch (e) {
        console.error("Smart Match failed", e);
    } finally {
        setIsMatching(false);
        setShowStyleMenu(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          if (onGenerate && !isLoading) {
              onGenerate();
          }
      }
  };

  const activeStyleObj = AVAILABLE_STYLES.find(s => s.value === currentStyle);
  const isMenuOpen = showHistory || showStyleMenu || showNegativeMenu || showInspirationMenu;

  const currentPool = mode === 'video' ? VIDEO_PROMPTS : SURPRISE_PROMPTS;

  return (
    <div className={`relative w-full rounded-2xl transition-all duration-300 p-1 group border flex flex-col
        ${isMenuOpen ? 'z-40' : 'z-20'}
        ${isLight 
            ? 'bg-white/90 border-slate-200 shadow-sm focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
            : 'bg-[#0f1225]/80 border-white/5 focus-within:border-purple-500/30'}
        ${isMain && !isLight ? 'focus-within:border-cyan-500/50 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.15)]' : ''}
        ${isAdded ? 'ring-2 ring-emerald-500/50' : ''}
    `}>
      
      {/* Main Text Area Wrapper */}
      <div className="flex-1 relative flex flex-col w-full">
            
           {/* Label Component */}
           {label && (
             <div className={`absolute top-2 left-6 z-10 text-[10px] font-bold uppercase tracking-widest pointer-events-none select-none ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
               {label}
             </div>
           )}
            
           {/* Badges Container - changed to flex row to avoid vertical overlap with text */}
           <div className="absolute top-3 right-4 z-10 flex items-center gap-2 pointer-events-none">
               {/* JSON Mode Indicator */}
               {isJson && (
                   <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all
                        ${isLight ? 'bg-cyan-50 text-cyan-600 border-cyan-200' : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30'}
                   `}>
                       <FileJson size={12} /> JSON Mode
                   </div>
               )}
               
               {/* Current Style Badge */}
               {currentStyle !== 'None' && activeStyleObj && (
                 <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all
                        ${isLight 
                            ? 'bg-slate-100 border-slate-200 text-slate-600' 
                            : 'bg-black/40 border-white/10 text-gray-300'}
                    `}
                 >
                    <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${activeStyleObj.color} ${isStyleRolling ? 'animate-spin' : ''}`} />
                    {activeStyleObj.label}
                 </div>
               )}
           </div>

           <textarea
            ref={textareaRef}
            className={`w-full bg-transparent p-6 text-sm md:text-base outline-none resize-none font-light tracking-wide min-h-[120px] transition-colors
              ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-gray-100 placeholder-gray-500'}
              ${inputImage ? 'pb-24' : 'pb-4'} 
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
             <div className={`absolute bottom-2 right-4 text-[9px] pointer-events-none opacity-40 font-mono ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                CTRL + ENTER
             </div>
          )}

          {/* Voice Listening Indicator */}
          {isListening && (
              <div className="absolute top-4 right-16 flex items-center gap-2 pointer-events-none">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-red-500' : 'text-red-400'}`}>Rec</span>
              </div>
          )}

          {/* Video Camera Controls Chips (Only in Video Mode) */}
          {mode === 'video' && !isJson && (
             <div className="absolute bottom-16 left-0 w-full px-6 flex gap-2 overflow-x-auto no-scrollbar mask-linear-fade">
                  <div className={`shrink-0 text-[10px] font-bold uppercase tracking-widest py-1.5 flex items-center ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                      Director:
                  </div>
                  {VIDEO_CAMERA_CONTROLS.map((control) => {
                      const Icon = control.icon;
                      const isActive = value.includes(control.value);
                      return (
                          <button
                            key={control.label}
                            onClick={() => handleAddCameraControl(control.value)}
                            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all
                                ${isActive
                                    ? (isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30')
                                    : (isLight ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white')}
                            `}
                          >
                              <Icon size={10} /> {control.label}
                          </button>
                      );
                  })}
             </div>
          )}

          {/* Image Preview Area */}
          {inputImage && (
            <div className="absolute bottom-16 left-6 z-10 animate-in fade-in slide-in-from-bottom-2 flex items-end gap-2">
              <div className={`relative group/image inline-block rounded-lg overflow-hidden border shadow-lg
                   ${isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-black/40'}
              `}>
                <img 
                  src={inputImage} 
                  alt="Reference" 
                  className="h-12 w-auto object-cover opacity-90 group-hover/image:opacity-100 transition-opacity" 
                />
                <button 
                  onClick={() => {
                      playClick(400);
                      onClearImage && onClearImage();
                  }}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
              </div>

              {/* Describe/Scan Button */}
              {onDescribe && (
                <button
                    onClick={onDescribe}
                    disabled={isDescribing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shadow-lg
                        ${isLight 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100' 
                            : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:border-indigo-500/50'}
                    `}
                    title="Describe Image (Reverse Prompt)"
                >
                    {isDescribing ? <Loader2 className="animate-spin" size={14} /> : <ScanEye size={14} />}
                    <span className="hidden sm:inline">{isDescribing ? 'Scanning...' : 'Describe'}</span>
                </button>
              )}

              {/* Steal Style Button */}
              {onStealStyle && (
                  <button
                    onClick={onStealStyle}
                    disabled={isDescribing}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shadow-lg
                        ${isLight 
                            ? 'bg-pink-50 border-pink-200 text-pink-600 hover:bg-pink-100' 
                            : 'bg-pink-500/20 border-pink-500/30 text-pink-300 hover:bg-pink-500/30 hover:border-pink-500/50'}
                    `}
                    title="Extract Art Style (Steal Style)"
                  >
                      <Pipette size={14} />
                      <span className="hidden sm:inline">Steal Style</span>
                  </button>
              )}
            </div>
          )}
      </div>

      {/* Integrated Negative Prompt */}
      {isMain && onNegativeChange && (
          <div className={`border-t transition-all overflow-hidden
                ${isLight ? 'border-slate-100' : 'border-white/5'}
                ${showNegativeInput ? 'h-24 opacity-100' : 'h-0 opacity-0'}
          `}>
              <div className="flex items-center h-full">
                  <div className={`w-10 h-full flex items-center justify-center border-r ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-black/20'}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest -rotate-90 whitespace-nowrap opacity-50 select-none ${isLight ? 'text-red-400' : 'text-red-500'}`}>
                          Negative
                      </span>
                  </div>
                  <textarea
                    className={`flex-1 h-full bg-transparent p-3 text-xs outline-none resize-none font-light tracking-wide
                        ${isLight ? 'text-slate-600 placeholder-slate-400' : 'text-gray-300 placeholder-gray-600'}
                    `}
                    placeholder="Describe what you want to avoid (e.g. blurry, bad anatomy)..."
                    value={negativeValue}
                    onChange={(e) => onNegativeChange(e.target.value)}
                  />
                  <div className="flex flex-col h-full border-l border-white/5">
                    <button 
                        onClick={() => setShowNegativeInput(false)}
                        className="flex-1 px-3 text-gray-500 hover:text-red-400 transition-colors hover:bg-white/5"
                        title="Close Negative Prompt"
                    >
                        <X size={14} />
                    </button>
                  </div>
              </div>
          </div>
      )}
      
      {/* Bottom Toolbar */}
      <div className={`flex flex-wrap items-center justify-between p-3 gap-3 border-t rounded-b-xl
            ${isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-black/20'}
      `}>
           
           {/* Left Section: Inputs & Modifiers */}
           <div className="flex items-center gap-2 flex-wrap">
                
                {/* Input Group */}
                {isMain && onImageUpload && (
                    <div className={`flex items-center p-1 rounded-lg border gap-1
                        ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/5'}
                    `}>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <button 
                            onClick={() => {
                                playClick(600);
                                fileInputRef.current?.click();
                            }}
                            className={`p-2 rounded-md transition-all hover:scale-110
                                ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}
                                ${inputImage ? 'text-cyan-500' : ''}
                            `}
                            title={mode === 'video' ? "Upload Start Frame" : "Upload Reference Image"}
                        >
                            {inputImage ? <ImageIcon size={16} /> : <Paperclip size={16} />}
                        </button>

                        {recognitionRef.current && (
                            <button 
                                onClick={toggleListening}
                                className={`p-2 rounded-md transition-all hover:scale-110
                                    ${isListening 
                                        ? 'text-red-500 animate-pulse' 
                                        : (isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white')}
                                `}
                                title="Voice Input"
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        )}

                        <button 
                            onClick={handleSurpriseMe}
                            disabled={isRolling}
                            className={`p-2 rounded-md transition-all hover:scale-110 group/dice
                                ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}
                                ${isRolling ? 'text-cyan-500' : ''}
                            `}
                            title="Surprise Me"
                        >
                            <Dices size={16} className={`transition-transform duration-500 ${isRolling ? 'animate-spin' : 'group-hover/dice:rotate-180'}`} />
                        </button>

                        <div className="relative" ref={inspirationRef}>
                            <button 
                                onClick={toggleInspirationMenu}
                                className={`p-2 rounded-md transition-all hover:scale-110
                                    ${showInspirationMenu 
                                        ? (isLight ? 'bg-cyan-50 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400')
                                        : (isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white')}
                                `}
                                title="Prompt Inspirations"
                            >
                                <Lightbulb size={16} />
                            </button>

                            {showInspirationMenu && (
                                <div className={`absolute bottom-full left-0 mb-2 w-72 rounded-xl shadow-2xl border backdrop-blur-md z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left
                                    ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1225] border-white/10'}
                                `}>
                                    <div className={`p-3 border-b flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#131629] border-white/5'}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                            {mode === 'video' ? 'Video Inspirations' : 'Image Inspirations'}
                                        </span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                                        {currentPool.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    playClick(800);
                                                    onChange(prompt);
                                                    setShowInspirationMenu(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-[11px] leading-relaxed transition-all mb-0.5
                                                    ${isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                                                `}
                                            >
                                                <span className="line-clamp-2 italic">"{prompt}"</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Enhance Button */}
                {isMain && onEnhance && (
                    <button 
                        onClick={() => {
                            playClick(1000);
                            onEnhance();
                        }}
                        disabled={isEnhancing}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border group/enhance
                            ${isLight 
                            ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' 
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20'}
                        `}
                        title="Enhance Prompt"
                    >
                        <Sparkles size={14} className={isEnhancing ? "animate-spin" : ""} /> 
                        <span className="hidden md:inline">{isEnhancing ? 'Working...' : 'Magic'}</span>
                    </button>
                )}

                {/* Style Dropdown */}
                {onStyleChange && mode === 'image' && (
                    <div className="relative" ref={styleMenuRef}>
                        <button 
                            onClick={toggleStyleMenu}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                                ${isLight 
                                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                                ${showStyleMenu ? (isLight ? 'bg-slate-100' : 'bg-white/10') : ''}
                                ${currentStyle !== 'None' ? 'border-cyan-500/50 text-cyan-400' : ''}
                            `}
                            title="Style Selector"
                        >
                            <Palette size={14} className={isStyleRolling ? 'animate-spin' : ''} /> 
                            <span className="hidden md:inline">Style</span>
                        </button>

                        {/* Style Menu Popover (Upwards) */}
                        {showStyleMenu && (
                            <div className={`absolute bottom-full left-0 mb-2 w-64 rounded-xl shadow-2xl border backdrop-blur-md z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left
                                ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1225] border-white/10'}
                            `}>
                                <div className="p-3">
                                    <div className="flex gap-2 mb-3">
                                        <button onClick={handleRandomStyle} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:shadow-cyan-500/25 flex items-center justify-center gap-1 transition-transform hover:scale-[1.02]">
                                            <Sparkles size={12} /> Random
                                        </button>
                                        <button onClick={handleSmartMatch} className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-1 transition-transform hover:scale-[1.02]">
                                            <BrainCircuit size={12} /> Auto
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                        {AVAILABLE_STYLES.map((style) => (
                                            <button
                                                key={style.value}
                                                onClick={() => {
                                                    playClick(800);
                                                    onStyleChange(style.value);
                                                    setShowStyleMenu(false);
                                                }}
                                                className={`text-left px-2 py-1.5 rounded text-[10px] font-medium transition-all border flex items-center gap-2
                                                    ${currentStyle === style.value
                                                        ? (isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300')
                                                        : (isLight ? 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10')}
                                                `}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${style.color}`} />
                                                {style.label}
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => {
                                                onStyleChange('None');
                                                setShowStyleMenu(false);
                                            }}
                                            className={`text-left px-2 py-1.5 rounded text-[10px] font-medium border border-transparent hover:border-white/10 transition-colors ${isLight ? 'text-slate-500' : 'text-gray-500'}`}
                                        >
                                            None / Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Negative Presets & Toggle */}
                {isMain && onNegativeChange && (
                    <div className="relative" ref={negativeMenuRef}>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setShowNegativeInput(!showNegativeInput)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border
                                    ${isLight 
                                        ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                                    ${showNegativeInput ? (isLight ? 'bg-red-50 text-red-500 border-red-200' : 'bg-red-900/20 text-red-400 border-red-500/20') : ''}
                                `}
                                title="Toggle Negative Prompt"
                            >
                                <ShieldBan size={14} /> 
                                <span className="hidden md:inline">Negative</span>
                                {showNegativeInput ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <button
                                onClick={() => setShowNegativeMenu(!showNegativeMenu)}
                                className={`px-2 py-2 rounded-lg transition-all border
                                    ${isLight 
                                        ? 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100' 
                                        : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'}
                                `}
                                title="Negative Presets"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {showNegativeMenu && (
                            <div className={`absolute bottom-full left-0 mb-2 w-56 rounded-xl shadow-2xl border backdrop-blur-md z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-left
                                ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1225] border-white/10'}
                            `}>
                                <div className={`p-2 border-b flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#131629] border-white/5'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Quick Block</span>
                                </div>
                                <div className="p-1 space-y-0.5">
                                    {NEGATIVE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => handleAddNegativePreset(preset.value)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-medium transition-all flex items-center gap-2 group
                                                ${isLight ? 'hover:bg-slate-50 text-slate-600' : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'}
                                            `}
                                        >
                                            <ShieldBan size={10} className="opacity-50 group-hover:opacity-100 text-red-400" />
                                            <div className="flex flex-col">
                                                <span>{preset.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
           </div>

           {/* Right Section: Actions */}
           <div className="flex items-center gap-3">
                {isMain && (
                    <div className="flex items-center gap-1 relative" ref={historyRef}>
                        <button 
                            onClick={toggleHistory}
                            className={`p-2 rounded-lg transition-all border
                                ${isLight 
                                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                                ${showHistory ? (isLight ? 'bg-slate-100' : 'bg-white/10') : ''}
                            `}
                            title="History"
                        >
                            <History size={16} />
                        </button>
                        
                        {/* History Dropdown */}
                        {showHistory && (
                            <div className={`absolute bottom-full right-0 mb-2 w-72 rounded-xl shadow-2xl border backdrop-blur-md z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-bottom-right
                                ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f1225] border-white/10'}
                            `}>
                                <div className={`p-3 border-b flex items-center justify-between ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#131629] border-white/5'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">History</span>
                                    {historyItems.length > 0 && <button onClick={handleClearHistory} className="text-[10px] text-red-400 hover:underline">Clear</button>}
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {historyItems.length === 0 ? <div className="p-4 text-center text-xs text-gray-500">Empty</div> : (
                                        <div className="py-1">
                                            {historyItems.map((item, idx) => (
                                                <button key={idx} onClick={() => handleSelectHistory(item)} className={`w-full text-left px-4 py-2 text-xs border-b last:border-0 border-white/5 ${isLight ? 'text-slate-600 hover:bg-slate-50' : 'text-gray-300 hover:bg-white/5'}`}>
                                                    <span className="line-clamp-2">{item}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {onOpenTemplates && (
                            <button 
                                onClick={() => { playClick(700); onOpenTemplates(); }}
                                className={`p-2 rounded-lg transition-all border
                                    ${isLight 
                                    ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100' 
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}
                                `}
                                title="Templates"
                            >
                                <Layout size={16} />
                            </button>
                        )}
                    </div>
                )}

                <div className={`h-6 w-px mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>

                <button 
                    onClick={() => { playClick(400); onClear(); }}
                    className={`p-2 rounded-lg transition-all hover:scale-110 text-gray-400 hover:text-red-400`}
                    title="Clear Prompt"
                >
                    <Trash2 size={16} />
                </button>

                {isMain && onGenerate && (
                    <button 
                        onClick={onGenerate}
                        disabled={isLoading}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2
                            ${isLoading 
                                ? 'bg-gray-700 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 shadow-purple-900/30'}
                        `}
                    >
                        {isLoading ? (
                            <>
                                {mode === 'video' ? <Film size={16} className="animate-pulse" /> : <Sparkles size={16} className="animate-spin" />}
                                <span className="hidden sm:inline">{Math.round(progress)}%</span>
                            </>
                        ) : (
                            <>
                                {mode === 'video' ? <Film size={16} /> : <Wand2 size={16} />}
                                <span className="hidden sm:inline">Generate</span>
                            </>
                        )}
                    </button>
                )}
           </div>
      </div>
    </div>
  );
};

export default PromptInput;
