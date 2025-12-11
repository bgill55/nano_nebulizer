
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Sparkles, Video, Terminal, Palette, BrainCircuit, Rocket } from 'lucide-react';
import { AppTheme } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: AppTheme;
}

const STEPS = [
    {
        title: "Welcome to Nebula",
        icon: Rocket,
        description: "You have just accessed the most advanced AI interface on the web. This system is powered by Google's Gemini 3.0 Pro and Veo architectures. Let's get you briefed on the capabilities.",
        color: "from-cyan-500 to-blue-500"
    },
    {
        title: "The Engines",
        icon: Video,
        description: "Switch between Image and Video modes in the top control bar. Use 'Gemini Flash' for speed, or switch to 'Gemini Pro' for 4K resolution and complex reasoning.",
        color: "from-purple-500 to-pink-500"
    },
    {
        title: "Quantum Mode",
        icon: Zap,
        description: "Located in Advanced Settings. When engaged, this forces the system to use maximum fidelity: 150 steps, strict guidance, and 4K resolution. It's slow, but the results are breathtaking.",
        color: "from-yellow-400 to-orange-500"
    },
    {
        title: "The Stylenator",
        icon: Palette,
        description: "Don't know what art style you want? Click the 'Style' button on the prompt bar. Use 'Smart Match' to let the AI deduce the best style from your words, or 'Surprise' for a random aesthetic.",
        color: "from-green-400 to-emerald-600"
    },
    {
        title: "Neural Link",
        icon: Terminal,
        description: "After generating an image, open it and click 'Neural Link'. The AI will analyze the visual data and write a sci-fi backstory or lore entry for your creation. It can even read it aloud.",
        color: "from-red-400 to-rose-600"
    },
    {
        title: "Magic Enhance",
        icon: Sparkles,
        description: "Writer's block? Type a simple word like 'Cat' and click the Magic Wand icon. Gemini 3.0 Pro will rewrite it into a highly detailed, professional prompt instantly.",
        color: "from-cyan-400 to-indigo-500"
    }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, theme = 'Nebula Dark' }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const isLight = theme === 'Starlight Light';

    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(curr => curr + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const step = STEPS[currentStep];
    const Icon = step.icon;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
            />

            <div className={`relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row min-h-[400px] border
                 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-cyan-500/30'}
            `}>
                {/* Visual Side (Left/Top) */}
                <div className={`w-full md:w-2/5 relative p-8 flex flex-col items-center justify-center overflow-hidden
                    bg-gradient-to-br ${step.color}
                `}>
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 opacity-30" 
                        style={{ 
                            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                            backgroundSize: '30px 30px'
                        }}>
                    </div>
                    
                    <div className="relative z-10 p-6 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-xl mb-4 animate-[bounce_3s_infinite]">
                        <Icon size={48} className="text-white drop-shadow-lg" />
                    </div>
                    <div className="relative z-10 text-white font-bold text-4xl opacity-20 absolute -bottom-4 -right-4">
                        0{currentStep + 1}
                    </div>
                </div>

                {/* Content Side (Right/Bottom) */}
                <div className={`w-full md:w-3/5 p-8 flex flex-col relative
                     ${isLight ? 'bg-white' : 'bg-[#0b0e1e]'}
                `}>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded border
                                ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white/5 text-cyan-400 border-cyan-500/20'}
                            `}>
                                Mission Briefing
                            </span>
                            <button onClick={onClose} className={`hover:text-cyan-400 transition-colors ${isLight ? 'text-gray-400' : 'text-gray-500'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <h2 className={`text-2xl font-bold mb-4 font-rajdhani ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            {step.title}
                        </h2>
                        <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                            {step.description}
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                        {/* Dots */}
                        <div className="flex gap-2">
                            {STEPS.map((_, idx) => (
                                <div 
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 
                                        ${idx === currentStep 
                                            ? (isLight ? 'w-6 bg-cyan-500' : 'w-6 bg-cyan-400') 
                                            : (isLight ? 'bg-slate-200' : 'bg-white/10')}
                                    `}
                                />
                            ))}
                        </div>

                        <div className="flex gap-3">
                             {currentStep > 0 && (
                                <button 
                                    onClick={handlePrev}
                                    className={`p-3 rounded-xl transition-colors
                                        ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-gray-400'}
                                    `}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                             )}
                             <button 
                                onClick={handleNext}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95
                                    bg-gradient-to-r ${step.color}
                                `}
                             >
                                {currentStep === STEPS.length - 1 ? 'Launch System' : 'Next'} 
                                <ChevronRight size={18} />
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
