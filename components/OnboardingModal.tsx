
import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, Sparkles, Video, Terminal, Palette, BrainCircuit, Rocket, ShieldCheck, Pipette } from 'lucide-react';
import { AppTheme } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: AppTheme;
  commanderName: string;
}

const getSteps = (commanderName: string) => [
    {
        title: "Commander's Inauguration",
        icon: ShieldCheck,
        description: `Welcome to the bridge, ${commanderName}. You are now in control of the Nebula AI Neural-Nova interface—the most advanced generative command center in the quadrant.`,
        color: "from-cyan-600 to-blue-700"
    },
    {
        title: "Multi-Engine Command",
        icon: Video,
        description: "Toggle between Image and Video modes in the primary reactor. Use Gemini 2.5 Flash for rapid tactical previews, or engage Gemini 3.0 Pro for 4K high-fidelity output and complex reasoning.",
        color: "from-purple-600 to-indigo-700"
    },
    {
        title: "Style Stealing & Matching",
        icon: Pipette,
        description: "Upload a reference image and use the 'Steal Style' tool to extract artistic DNA. Alternatively, let 'Smart Match' deduce the perfect aesthetic from your text alone.",
        color: "from-pink-500 to-rose-600"
    },
    {
        title: "The Neural Link",
        icon: Terminal,
        description: "Every creation has a story. Use the Neural Link to analyze visual data and generate immersive lore. With Voice Mode 2.0, the system can even narrate these logs back to you.",
        color: "from-emerald-500 to-teal-700"
    },
    {
        title: "Magic Prompt Alchemy",
        icon: Sparkles,
        description: "Input a simple concept and click the Magic Wand. Gemini 3.0 Pro will expand your thought into a master-level prompt, providing three distinct variations for you to choose from.",
        color: "from-amber-500 to-orange-600"
    },
    {
        title: "Quantum Fidelity",
        icon: Zap,
        description: "In the Advanced Tab, you can engage Quantum Mode. This forces the engine to run maximum inference steps and 4K resolution, reserved for your most critical art pieces.",
        color: "from-blue-500 to-cyan-400"
    }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, theme = 'Nebula Dark', commanderName }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const isLight = theme === 'Starlight Light';

    if (!isOpen) return null;

    const steps = getSteps(commanderName);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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

    const step = steps[currentStep];
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
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border
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
                            {steps.map((_, idx) => (
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
                                {currentStep === steps.length - 1 ? 'Launch System' : 'Next'} 
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
