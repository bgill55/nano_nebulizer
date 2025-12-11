
import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, ModelType, AppTheme, GenerationMode } from '../types';
import { Sparkles, Zap, Aperture, Palette, Box, Camera, Sliders, Cpu, LayoutTemplate, Settings2, Moon, Sun, ShieldAlert, Dice5, RefreshCw, Layers, Video, Image as ImageIcon, Gamepad2, Ghost, Droplets, Sunset, Send, Hexagon, Film } from 'lucide-react';
import { playClick, playPowerUp } from '../services/audioService';

interface ControlPanelProps {
  config: AppConfig;
  updateConfig: (key: keyof AppConfig, value: any) => void;
  onNotify?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const PRESETS = [
  {
    id: 'anime',
    label: 'Vivid Anime',
    icon: Sparkles,
    gradient: 'from-pink-500 to-rose-600',
    config: {
      style: 'Anime',
      quality: 90,
      steps: 50,
      guidanceScale: 9
    }
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    icon: Aperture,
    gradient: 'from-amber-600 to-orange-800',
    config: {
      style: 'Cinematic',
      quality: 100,
      steps: 60,
      guidanceScale: 6
    }
  },
  {
    id: 'cyberpunk',
    label: 'Neon Punk',
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-700',
    config: {
      style: 'Cyberpunk',
      quality: 95,
      steps: 55,
      guidanceScale: 11
    }
  },
  {
    id: 'photoreal',
    label: 'Photoreal',
    icon: Camera,
    gradient: 'from-emerald-600 to-teal-800',
    config: {
      style: 'Photorealistic',
      quality: 100,
      steps: 80,
      guidanceScale: 5
    }
  },
  {
    id: 'oil',
    label: 'Oil Painting',
    icon: Palette,
    gradient: 'from-yellow-600 to-red-700',
    config: {
      style: 'Oil Painting',
      quality: 85,
      steps: 45,
      guidanceScale: 7.5
    }
  },
  {
    id: '3d',
    label: '3D Render',
    icon: Box,
    gradient: 'from-indigo-500 to-purple-700',
    config: {
      style: '3D Render',
      quality: 90,
      steps: 50,
      guidanceScale: 8
    }
  },
  // --- NEW STYLES ---
  {
    id: 'pixel',
    label: 'Pixel Art',
    icon: Gamepad2,
    gradient: 'from-purple-600 to-indigo-600',
    config: {
      style: 'Pixel Art',
      quality: 90,
      steps: 40,
      guidanceScale: 8
    }
  },
  {
    id: 'fantasy',
    label: 'Dark Fantasy',
    icon: Ghost,
    gradient: 'from-slate-700 to-black',
    config: {
      style: 'Dark Fantasy',
      quality: 100,
      steps: 60,
      guidanceScale: 9
    }
  },
  {
    id: 'watercolor',
    label: 'Watercolor',
    icon: Droplets,
    gradient: 'from-cyan-400 to-blue-400',
    config: {
      style: 'Watercolor',
      quality: 90,
      steps: 45,
      guidanceScale: 7
    }
  },
  {
    id: 'vaporwave',
    label: 'Vaporwave',
    icon: Sunset,
    gradient: 'from-pink-400 to-cyan-400',
    config: {
      style: 'Vaporwave',
      quality: 95,
      steps: 50,
      guidanceScale: 10
    }
  },
  {
    id: 'origami',
    label: 'Origami',
    icon: Send, // Paper plane
    gradient: 'from-orange-400 to-yellow-500',
    config: {
      style: 'Origami Paper Art',
      quality: 90,
      steps: 40,
      guidanceScale: 12
    }
  },
  {
    id: 'isometric',
    label: 'Isometric',
    icon: Hexagon,
    gradient: 'from-blue-500 to-cyan-500',
    config: {
      style: 'Isometric 3D',
      quality: 95,
      steps: 50,
      guidanceScale: 8.5
    }
  }
];

const VIDEO_PRESETS = [
  {
    id: 'cinematic_video',
    label: 'Cinematic',
    icon: Aperture,
    gradient: 'from-amber-600 to-orange-800',
    config: { style: 'Cinematic' }
  },
  {
    id: 'drone',
    label: 'Drone Shot',
    icon: Send, // Using Send as a "Flight" icon proxy
    gradient: 'from-cyan-500 to-blue-600',
    config: { style: 'Drone Footage' }
  },
  {
    id: 'vintage',
    label: 'Vintage VHS',
    icon: Film,
    gradient: 'from-pink-500 to-rose-600',
    config: { style: 'Vintage VHS' }
  },
  {
    id: 'animation',
    label: '3D Animation',
    icon: Box,
    gradient: 'from-purple-500 to-indigo-600',
    config: { style: '3D Animation' }
  },
  {
    id: 'cyberpunk_video',
    label: 'Cyberpunk',
    icon: Zap,
    gradient: 'from-cyan-400 to-purple-500',
    config: { style: 'Cyberpunk' }
  },
  {
    id: 'nature',
    label: 'Documentary',
    icon: Sunset,
    gradient: 'from-emerald-500 to-teal-600',
    config: { style: 'Nature Documentary' }
  }
];

const MagneticWrapper: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const rect = ref.current?.getBoundingClientRect();
        if (rect) {
            const x = clientX - (rect.left + rect.width / 2);
            const y = clientY - (rect.top + rect.height / 2);
            ref.current!.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        }
    };

    const handleMouseLeave = () => {
        if (ref.current) {
            ref.current.style.transform = 'translate(0px, 0px)';
        }
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
        >
            {children}
        </div>
    );
};

const Tooltip = ({ content, children }: { content: string; children?: React.ReactNode }) => {
  return (
    <div className="relative group w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-[250px] px-3 py-2 bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-xl text-xs leading-relaxed text-gray-200 shadow-xl opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[100] text-center">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95"></div>
      </div>
    </div>
  );
};

const SliderControl = ({ 
    label, 
    icon: Icon, 
    value, 
    onChange, 
    min, 
    max, 
    step = 1, 
    displayValue, 
    description, 
    labels,
    isLight
}: {
    label: string;
    icon: any;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step?: number;
    displayValue?: string | number;
    description?: string;
    labels?: { left: string; right: string };
    isLight: boolean;
}) => {
    const [isActive, setIsActive] = useState(false);
    const isMounted = useRef(false);

    useEffect(() => {
        if (isMounted.current) {
            setIsActive(true);
            const timer = setTimeout(() => setIsActive(false), 500); 
            return () => clearTimeout(timer);
        } else {
            isMounted.current = true;
        }
    }, [value]);

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group
            ${isLight 
                ? (isActive ? 'bg-slate-50 border-cyan-500/50 shadow-lg scale-[1.01]' : 'bg-white border-slate-200 hover:border-slate-300 scale-100')
                : (isActive ? 'bg-[#1a1f3d] border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.2)] scale-[1.01]' : 'bg-[#131629] border-white/5 hover:border-white/10 scale-100')
            }`}
        >
             <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent pointer-events-none transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

            <div className="flex justify-between items-center mb-4 relative z-10">
                <span className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300 
                    ${isLight ? 'text-slate-700' : 'text-gray-200'}
                    ${isActive ? 'text-cyan-600' : ''}`}>
                    <Icon size={14} className={`transition-all duration-300 ${isActive ? 'text-cyan-500 scale-110' : (isLight ? 'text-purple-500' : 'text-pink-400')}`} /> 
                    {label}
                </span>
                <span className={`text-xs font-mono px-2 py-1 rounded-md transition-all duration-300 border 
                    ${isLight 
                        ? (isActive ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-600 border-transparent')
                        : (isActive ? 'text-cyan-200 bg-cyan-900/40 border-cyan-500/30' : 'bg-black/30 text-cyan-300 border-transparent')
                    }`}>
                    {displayValue || value}
                </span>
            </div>
            
            <input 
                type="range" 
                min={min} 
                max={max} 
                step={step}
                value={value} 
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400 relative z-10 focus:outline-none focus:ring-0"
            />
            
            {labels && (
                <div className="flex justify-between text-[10px] text-gray-500 mt-2 font-mono uppercase relative z-10">
                    <span>{labels.left}</span>
                    <span>{labels.right}</span>
                </div>
            )}
            
            {description && (
                <p className="text-xs text-gray-500 mt-3 leading-relaxed relative z-10">
                    {description}
                </p>
            )}
        </div>
    );
};

const AspectRatioBox = ({ ratio, isActive, isLight }: { ratio: string, isActive: boolean, isLight: boolean }) => {
    const [w, h] = ratio.split(':').map(Number);
    const scale = 20 / Math.max(w, h);
    const width = w * scale;
    const height = h * scale;

    return (
        <div className={`w-8 h-8 flex items-center justify-center rounded border transition-colors
            ${isActive 
                ? (isLight ? 'bg-cyan-100 border-cyan-400' : 'bg-cyan-500/20 border-cyan-400/50') 
                : (isLight ? 'bg-slate-100 border-slate-300' : 'bg-white/5 border-white/10')}
        `}>
            <div 
                className={`border-2 rounded-sm transition-all ${isActive ? (isLight ? 'border-cyan-600 bg-cyan-200' : 'border-cyan-400 bg-cyan-400/20') : (isLight ? 'border-slate-400' : 'border-gray-500')}`}
                style={{ width: `${width}px`, height: `${height}px` }}
            />
        </div>
    );
};

const ControlPanel: React.FC<ControlPanelProps> = ({ config, updateConfig, onNotify }) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'model' | 'advanced'>('model');
  const isLight = config.theme === 'Starlight Light';

  const applyPreset = (presetConfig: Partial<AppConfig>) => {
    playClick(1200);
    Object.entries(presetConfig).forEach(([key, value]) => {
      updateConfig(key as keyof AppConfig, value);
    });
  };

  const handleModeChange = (mode: GenerationMode) => {
      playClick(900);
      updateConfig('mode', mode);
      if (mode === 'video') {
          updateConfig('model', ModelType.VEO_FAST);
          updateConfig('style', 'None'); 
          if (config.aspectRatio !== '16:9' && config.aspectRatio !== '9:16') {
              updateConfig('aspectRatio', '16:9');
          }
      } else {
          updateConfig('model', ModelType.GEMINI_FLASH_IMAGE);
      }
  };

  const activateQuantumMode = () => {
    playPowerUp();
    // 1. Force the high-end model
    updateConfig('model', ModelType.GEMINI_PRO_IMAGE);
    // 2. Maximize render settings
    updateConfig('quality', 100);
    updateConfig('steps', 150); // Max inference steps
    updateConfig('guidanceScale', 15); // Strict adherence
    // 3. Set resolution to 4K
    updateConfig('imageSize', '4K');
    
    // Notify User
    if (onNotify) {
        onNotify("QUANTUM MODE ENGAGED: Max fidelity applied. Generation will take longer (~20s).", 'warning');
    }
  };

  const availableRatios = config.mode === 'video' 
    ? ['16:9', '9:16'] 
    : ['1:1', '16:9', '9:16', '4:3', '3:4'];

  const presetsToDisplay = config.mode === 'video' ? VIDEO_PRESETS : PRESETS;

  return (
    <div className="w-full max-w-5xl mx-auto mt-6 px-2 flex flex-col gap-6">
      
      {/* Mode Selector */}
      <div className={`p-1.5 rounded-2xl border flex gap-1 shadow-sm backdrop-blur-md mb-2
         ${isLight ? 'bg-white/80 border-slate-200' : 'bg-[#0f1225]/80 border-white/5'}
      `}>
          <button
            onClick={() => handleModeChange('image')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 
                ${config.mode === 'image'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg' 
                    : (isLight ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:bg-white/5')}
            `}
            title="Image Generator"
          >
             <ImageIcon size={18} /> 
             <span className="hidden sm:inline">Image Generator</span>
             <span className="sm:hidden">Image</span>
          </button>
          <button
            onClick={() => handleModeChange('video')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden
                ${config.mode === 'video'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' 
                    : (isLight ? 'text-slate-500 hover:bg-slate-50' : 'text-gray-400 hover:bg-white/5')}
            `}
            title="Text-to-Video"
          >
             {config.mode === 'video' && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
             <Video size={18} /> 
             <span className="hidden sm:inline">Text-to-Video (Veo)</span>
             <span className="sm:hidden">Video</span>
          </button>
      </div>

      {/* Tab Navigation */}
      <div className={`flex p-1 rounded-xl border gap-1 shadow-lg backdrop-blur-md transition-colors
         ${isLight ? 'bg-white/80 border-slate-200' : 'bg-[#0f1225]/80 border-white/5'}
      `}>
        <button
            onClick={() => { playClick(800); setActiveTab('styles'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                ${activeTab === 'styles' 
                    ? (isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-[0_0_20px_rgba(6,182,212,0.1)]') 
                    : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')}
            `}
            title="Styles"
        >
            <Palette size={16} />
            <span className="hidden sm:inline">Styles</span>
        </button>
        <button
            onClick={() => { playClick(800); setActiveTab('model'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                ${activeTab === 'model' 
                    ? (isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]') 
                    : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')}
            `}
            title="Model"
        >
            <Cpu size={16} />
            <span className="hidden sm:inline">Model & Format</span>
            <span className="sm:hidden">Model</span>
        </button>
        <button
            onClick={() => { playClick(800); setActiveTab('advanced'); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all duration-300 
                ${activeTab === 'advanced' 
                    ? (isLight ? 'bg-slate-100 text-slate-900 shadow-sm' : 'bg-white/10 text-white shadow-[0_0_20px_rgba(236,72,153,0.1)]') 
                    : (isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-50' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5')}
            `}
            title="Advanced"
        >
            <Sliders size={16} />
            <span className="hidden sm:inline">Advanced Settings</span>
            <span className="sm:hidden">Advanced</span>
        </button>
      </div>

      {/* Content Area */}
      <div className={`rounded-3xl p-6 border backdrop-blur-xl shadow-lg min-h-[400px] transition-colors duration-500
         ${isLight 
            ? 'bg-white/80 border-slate-200 shadow-[0_0_50px_rgba(148,163,184,0.1)]' 
            : 'bg-[#0b0e1e]/90 border-white/5 shadow-[0_0_50px_rgba(8,145,178,0.05)]'}
      `}>
        
        {/* Styles Tab */}
        {activeTab === 'styles' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <label className={`text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-pink-400'}`}>
                        <Sparkles size={14} /> Quick Style Presets {config.mode === 'video' ? '(Video)' : '(Image)'}
                    </label>
                    {/* Adjusted Grid to handle 12 items smoothly */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {presetsToDisplay.map((preset) => {
                            const Icon = preset.icon;
                            const isActive = config.style === preset.config.style;
                            return (
                                <MagneticWrapper key={preset.id}>
                                    <button
                                        onClick={() => applyPreset(preset.config)}
                                        className={`
                                        relative group overflow-hidden rounded-xl p-3 h-24 w-full flex flex-col items-center justify-center gap-2 transition-all duration-300 border
                                        hover:scale-105 hover:shadow-lg
                                        ${isActive 
                                            ? (isLight ? 'border-purple-400 shadow-lg scale-[1.02]' : 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02]')
                                            : (isLight ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50' : 'border-white/5 hover:border-white/20 hover:bg-white/5')}
                                        `}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient} ${isLight ? 'opacity-10' : 'opacity-20'} group-hover:opacity-30 transition-opacity`} />
                                        {isActive && <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient} opacity-20 animate-pulse`} />}
                                        <div className={`p-2 rounded-full ${isActive ? (isLight ? 'bg-purple-500 text-white' : 'bg-white/10 text-white') : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-gray-300')} transition-colors relative z-10`}>
                                            <Icon size={20} />
                                        </div>
                                        <span className={`text-xs font-medium ${isActive ? (isLight ? 'text-slate-900' : 'text-white') : (isLight ? 'text-slate-500' : 'text-gray-400')} relative z-10`}>
                                            {preset.label}
                                        </span>
                                    </button>
                                </MagneticWrapper>
                            );
                        })}
                    </div>
                </div>

                 <div className="max-w-md">
                    <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ml-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Manual Style Selection</label>
                    <Tooltip content="Choose a base aesthetic style to guide the generation process.">
                        <div className="relative">
                            <select 
                                value={config.style}
                                onChange={(e) => updateConfig('style', e.target.value)}
                                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer transition-colors
                                    ${isLight 
                                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                                        : 'bg-[#131629] border-white/10 text-gray-300 hover:bg-[#1a1e35]'}
                                `}
                            >
                                {config.mode === 'video' ? (
                                    <>
                                        <option value="Cinematic">Cinematic</option>
                                        <option value="Drone Footage">Drone Shot</option>
                                        <option value="Vintage VHS">Vintage VHS</option>
                                        <option value="3D Animation">3D Animation</option>
                                        <option value="Cyberpunk">Cyberpunk</option>
                                        <option value="Nature Documentary">Documentary</option>
                                        <option value="None">No Style</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Anime">Anime</option>
                                        <option value="Photorealistic">Photorealistic</option>
                                        <option value="Cyberpunk">Cyberpunk</option>
                                        <option value="Oil Painting">Oil Painting</option>
                                        <option value="Cinematic">Cinematic</option>
                                        <option value="3D Render">3D Render</option>
                                        <option value="Pixel Art">Pixel Art</option>
                                        <option value="Dark Fantasy">Dark Fantasy</option>
                                        <option value="Watercolor">Watercolor</option>
                                        <option value="Vaporwave">Vaporwave</option>
                                        <option value="Origami Paper Art">Origami</option>
                                        <option value="Isometric 3D">Isometric</option>
                                        <option value="None">No Style</option>
                                    </>
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </Tooltip>
                </div>
            </div>
        )}

        {/* Model Tab */}
        {activeTab === 'model' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-purple-600' : 'text-pink-400'}`}>AI Model</label>
                        <Tooltip content="Select the AI model architecture.">
                            <div className="relative">
                                <select 
                                    value={config.model}
                                    onChange={(e) => updateConfig('model', e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer transition-colors
                                        ${isLight 
                                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                                            : 'bg-[#131629] border-white/10 text-gray-300 hover:bg-[#1a1e35]'}
                                    `}
                                >
                                    {config.mode === 'image' ? (
                                        <>
                                            <option value={ModelType.GEMINI_PRO_IMAGE}>Gemini 3.0 Pro (Image)</option>
                                            <option value={ModelType.GEMINI_FLASH_IMAGE}>Gemini 2.5 Flash Image (Fast)</option>
                                            <option value={ModelType.IMAGEN_4}>Imagen 4 (High Quality)</option>
                                        </>
                                    ) : (
                                        <option value={ModelType.VEO_FAST}>Veo (Fast Video Generation)</option>
                                    )}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </Tooltip>
                         <p className="text-xs text-gray-500 ml-1">
                            {config.mode === 'video' ? "Veo 3.1 generates high-quality 720p video clips." : "Select architecture based on speed vs quality needs."}
                        </p>
                    </div>

                    {/* Batch Size Selection */}
                    {config.mode === 'image' && (
                        <div className="space-y-2">
                            <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-purple-600' : 'text-pink-400'}`}>Batch Size</label>
                            <Tooltip content="Number of images to generate at once.">
                                <div className={`p-1 rounded-xl border flex
                                    ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629] border-white/10'}
                                `}>
                                    {[1, 2, 3, 4].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => updateConfig('batchSize', num)}
                                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2
                                                ${config.batchSize === num 
                                                    ? (isLight ? 'bg-white text-cyan-600 shadow-sm border border-slate-200' : 'bg-white/10 text-white shadow-lg') 
                                                    : (isLight ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}
                                            `}
                                        >
                                            <Layers size={14} className={config.batchSize === num ? (isLight ? 'text-cyan-500' : 'text-cyan-400') : ''} />
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </Tooltip>
                        </div>
                    )}

                    {/* Resolution */}
                     {config.mode === 'image' && (
                         <div className={`space-y-2 transition-all duration-300 ${config.model === ModelType.GEMINI_PRO_IMAGE ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                            <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-purple-600' : 'text-pink-400'}`}>Resolution {config.model !== ModelType.GEMINI_PRO_IMAGE && '(Model Dependent)'}</label>
                            <Tooltip content="Set the output resolution. 4K offers maximum detail but takes longer. Only available for Gemini 3.0 Pro.">
                                <div className="relative">
                                    <select 
                                        value={config.imageSize || '1K'}
                                        onChange={(e) => updateConfig('imageSize', e.target.value)}
                                        disabled={config.model !== ModelType.GEMINI_PRO_IMAGE}
                                        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer transition-colors disabled:cursor-not-allowed
                                            ${isLight 
                                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' 
                                                : 'bg-[#131629] border-white/10 text-gray-300 hover:bg-[#1a1e35]'}
                                        `}
                                    >
                                        <option value="1K">1K (1024x1024)</option>
                                        <option value="2K">2K (2048x2048)</option>
                                        <option value="4K">4K (4096x4096)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </Tooltip>
                        </div>
                     )}
                </div>

                <div className="space-y-6">
                     {/* Aspect Ratio */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-purple-600' : 'text-pink-400'}`}>Aspect Ratio</label>
                        <Tooltip content={config.mode === 'video' ? "Choose the video dimensions (Landscape or Portrait)." : "Choose the dimensions of your output."}>
                            <div className="grid grid-cols-3 gap-3">
                                    {availableRatios.map((ratio) => (
                                        <button
                                            key={ratio}
                                            onClick={() => updateConfig('aspectRatio', ratio)}
                                            className={`flex items-center justify-center p-3 rounded-xl border transition-all duration-300
                                                ${config.aspectRatio === ratio
                                                    ? (isLight ? 'bg-white border-cyan-400 shadow-md ring-1 ring-cyan-100' : 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]')
                                                    : (isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-[#131629] border-white/5 hover:border-white/20')}
                                            `}
                                        >
                                            <AspectRatioBox ratio={ratio} isActive={config.aspectRatio === ratio} isLight={isLight} />
                                            <span className={`ml-2 text-xs font-mono font-medium ${config.aspectRatio === ratio ? (isLight ? 'text-cyan-700' : 'text-cyan-300') : (isLight ? 'text-slate-500' : 'text-gray-500')}`}>
                                                {ratio}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                        </Tooltip>
                    </div>
                </div>
             </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && config.mode === 'image' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderControl
                        label="Quality / Fidelity"
                        icon={Sparkles}
                        value={config.quality}
                        onChange={(val) => updateConfig('quality', val)}
                        min={0}
                        max={100}
                        displayValue={`${config.quality}%`}
                        description="Controls the artistic fidelity and render quality. Higher values take longer."
                        isLight={isLight}
                    />

                     <SliderControl
                        label="Inference Steps"
                        icon={Layers}
                        value={config.steps}
                        onChange={(val) => updateConfig('steps', val)}
                        min={10}
                        max={150}
                        description="More steps = more detail, but slower generation."
                        isLight={isLight}
                    />

                    <SliderControl
                        label="Guidance Scale"
                        icon={Zap}
                        value={config.guidanceScale}
                        onChange={(val) => updateConfig('guidanceScale', val)}
                        min={1}
                        max={20}
                        step={0.5}
                        displayValue={config.guidanceScale}
                        description="How strictly the AI follows your prompt. Higher = stricter."
                        isLight={isLight}
                    />

                     <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between
                        ${isLight ? 'bg-white border-slate-200' : 'bg-[#131629] border-white/5'}
                     `}>
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-sm font-medium flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>
                                <ShieldAlert size={14} className={isLight ? 'text-red-500' : 'text-red-400'} /> NSFW Filter
                            </span>
                            <button
                                onClick={() => updateConfig('enableNSFW', !config.enableNSFW)}
                                className={`w-12 h-6 rounded-full transition-colors relative
                                    ${config.enableNSFW ? 'bg-red-500' : (isLight ? 'bg-slate-200' : 'bg-gray-700')}
                                `}
                            >
                                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enableNSFW ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Allow potentially mature content. Use with caution.
                        </p>
                     </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <div className="flex justify-between items-end">
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={activateQuantumMode}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-bold uppercase tracking-wider hover:scale-105 transition-transform shadow-lg shadow-purple-900/30 flex items-center gap-2"
                            >
                                <Zap size={14} /> Quantum Mode
                            </button>
                         </div>
                         <div className="text-right">
                            <label className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Seed</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={config.seed === -1 ? '' : config.seed}
                                    placeholder="Random"
                                    onChange={(e) => updateConfig('seed', parseInt(e.target.value) || -1)}
                                    className={`w-24 text-right bg-transparent border-b text-sm focus:outline-none font-mono
                                        ${isLight 
                                            ? 'border-slate-300 text-slate-800 focus:border-cyan-500' 
                                            : 'border-white/20 text-gray-300 focus:border-cyan-500'}
                                    `}
                                />
                                <button 
                                    onClick={() => updateConfig('seed', -1)}
                                    className={`p-1.5 rounded-lg transition-colors ${config.seed === -1 ? (isLight ? 'text-cyan-600 bg-cyan-50' : 'text-cyan-400 bg-cyan-500/20') : 'text-gray-500 hover:text-gray-300'}`}
                                    title="Randomize Seed"
                                >
                                    <Dice5 size={16} />
                                </button>
                            </div>
                         </div>
                    </div>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default ControlPanel;
