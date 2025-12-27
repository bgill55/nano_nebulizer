
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
  negativeValue?: string;
  onNegativeChange?: (value: string) => void;
  onDescribe?: () => void;
  isDescribing?: boolean;
  onStealStyle?: () => void;
}

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
  
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const historyRef = useRef<HTMLDivElement>(null);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const [showNegativeInput, setShowNegativeInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isJson = value.trim().startsWith('{');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                onChange(value ? `${value} ${transcript}` : transcript);
                setIsListening(false);
            };
            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }
  }, [value, onChange]);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else {
        try { recognitionRef.current?.start(); setIsListening(true); } catch (e) {}
    }
  };

  const handleAddCameraControl = (controlValue: string) => {
      playClick(900);
      const current = value || '';
      if (current.includes(controlValue)) return;
      const separator = current.trim().length > 0 ? (current.endsWith('.') || current.endsWith(',') ? ' ' : ', ') : '';
      onChange(`${current}${separator}${controlValue}`);
  };

  return (
    <div className={`relative w-full rounded-2xl transition-all duration-300 p-1 group border flex flex-col
        ${isLight ? 'bg-white/90 border-slate-200' : 'bg-[#0f1225]/80 border-white/5 focus-within:border-purple-500/30'}
    `}>
      <div className="flex-1 relative flex flex-col w-full min-h-[160px]">
           {label && (
             <div className={`absolute top-2 left-6 z-10 text-[10px] font-bold uppercase tracking-widest pointer-events-none select-none ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
               {label}
             </div>
           )}
            
           <textarea
            ref={textareaRef}
            className={`w-full bg-transparent p-6 pt-8 text-sm md:text-base outline-none resize-none font-light tracking-wide flex-1 transition-colors
              ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-gray-100 placeholder-gray-500'}
            `}
            placeholder={isListening ? "Listening..." : placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) && onGenerate?.()}
            spellCheck={false}
          />

          {/* New Control Bay: Anchored below text, no overlap possible */}
          <div className={`mt-auto px-6 pb-4 flex flex-col gap-3 transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              
              {/* Director Chips Bar */}
              {mode === 'video' && !isJson && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-y border-white/5">
                    <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>Director</span>
                    {VIDEO_CAMERA_CONTROLS.map((control) => {
                        const Icon = control.icon;
                        const isActive = value.includes(control.value);
                        return (
                            <button
                                key={control.label}
                                onClick={() => handleAddCameraControl(control.value)}
                                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border
                                    ${isActive
                                        ? (isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30')
                                        : (isLight ? 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100' : 'bg-black/20 border-white/5 text-gray-500 hover:text-white')}
                                `}
                            >
                                <Icon size={10} /> {control.label}
                            </button>
                        );
                    })}
                </div>
              )}

              {/* Image & Asset Bar */}
              {inputImage && (
                <div className="flex items-center gap-3 animate-in slide-in-from-left-2">
                    <div className="relative group/img h-12 w-12 rounded-lg overflow-hidden border border-white/10 shadow-lg shrink-0">
                        <img src={inputImage} className="w-full h-full object-cover" />
                        <button onClick={onClearImage} className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                            <X size={16} className="text-white" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {onDescribe && (
                            <button onClick={onDescribe} disabled={isDescribing} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'}`}>
                                {isDescribing ? <Loader2 size={12} className="animate-spin" /> : 'Scan Asset'}
                            </button>
                        )}
                        {onStealStyle && (
                            <button onClick={onStealStyle} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isLight ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-pink-500/10 text-pink-400 border-pink-500/30 hover:bg-pink-500/20'}`}>
                                Steal Style
                            </button>
                        )}
                    </div>
                </div>
              )}
          </div>
      </div>

      {/* Negative Prompt Row */}
      {showNegativeInput && (
          <div className={`p-4 border-t ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-black/20'}`}>
              <textarea 
                value={negativeValue} 
                onChange={(e) => onNegativeChange?.(e.target.value)}
                placeholder="Avoid list (e.g. text, blurry, bad anatomy)..."
                className="w-full bg-transparent text-xs outline-none h-12 font-mono"
              />
          </div>
      )}
      
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-3 border-t rounded-b-xl ${isLight ? 'bg-slate-50/50' : 'bg-black/40'}`}>
           <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors" title="Attach Frame">
                    <Paperclip size={18} />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onImageUpload?.(e.target.files[0])} />
                </button>
                <button onClick={toggleListening} className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}><Mic size={18} /></button>
                <button onClick={onEnhance} disabled={isEnhancing} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isLight ? 'bg-purple-50 text-purple-600' : 'bg-purple-500/10 text-purple-300 border-purple-500/20'}`}>
                    <Sparkles size={12} /> Magic
                </button>
                <button onClick={() => setShowNegativeInput(!showNegativeInput)} className={`p-2 transition-colors ${showNegativeInput ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}><ShieldBan size={18} /></button>
           </div>
           <div className="flex items-center gap-3">
                <button onClick={onClear} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                <button 
                    onClick={onGenerate} 
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-700 text-white font-black uppercase tracking-widest text-xs shadow-xl disabled:opacity-50 transition-transform active:scale-95"
                >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'video' ? <Film size={16} /> : <Wand2 size={16} />)}
                    {isLoading ? 'Processing' : 'Launch'}
                </button>
           </div>
      </div>
    </div>
  );
};

export default PromptInput;
