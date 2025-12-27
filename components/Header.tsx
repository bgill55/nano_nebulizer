
import React from 'react';
import { Settings, Grid, HelpCircle, ShieldCheck } from 'lucide-react';
import { AppTheme } from '../types';
import Logo from './Logo';

interface HeaderProps {
  commanderName: string;
  onOpenGallery?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  theme?: AppTheme;
}

const Header: React.FC<HeaderProps> = ({ commanderName, onOpenGallery, onOpenSettings, onOpenHelp, theme = 'Nebula Dark' }) => {
  const isLight = theme === 'Starlight Light';

  return (
    <header className={`w-full p-3 md:p-4 flex items-center justify-between border-b backdrop-blur-sm z-50 sticky top-0 transition-colors duration-500
        ${isLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'border-white/5 bg-transparent'}
    `}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
            <Logo size={24} className="md:w-7 md:h-7" />
            <span className={`font-rajdhani font-bold tracking-tighter text-lg md:text-xl ${isLight ? 'text-slate-800' : 'text-white'}`}>
                NEBULA<span className="text-cyan-400">AI</span>
            </span>
        </div>
        
        <button 
          onClick={onOpenGallery}
          className={`flex items-center gap-2 px-2 md:px-5 py-2 rounded-lg border font-medium transition-all
            ${isLight 
                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'}
          `}
          title="Gallery"
        >
          <Grid size={18} className="md:w-5 md:h-5" />
          <span className="text-xs md:text-sm hidden sm:inline">Gallery</span>
        </button>
      </div>

      {/* COMMANDER IDENTITY BADGE - NOW DYNAMIC */}
      <div className="flex items-center gap-2 md:gap-4 px-2 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.1)] group transition-all hover:border-cyan-500/40 mx-2 flex-1 md:flex-none justify-center md:justify-start">
          <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-cyan-400 rounded-full blur opacity-10 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-6 h-6 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center text-cyan-400 shadow-lg border border-cyan-500/30">
                  <ShieldCheck size={14} className="md:w-[22px] md:h-[22px] group-hover:scale-110 transition-transform" />
              </div>
          </div>
          <div className="flex flex-col min-w-0">
              <span className="text-[7px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.3em] text-cyan-500 mb-0 md:mb-0.5 truncate">Commander</span>
              <span className={`text-[10px] md:text-sm font-bold font-rajdhani tracking-normal md:tracking-[0.1em] truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {commanderName}
              </span>
          </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button 
            onClick={onOpenHelp}
            className={`p-2 md:p-2.5 rounded-lg border transition-all
            ${isLight
                ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-cyan-600'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-cyan-400'}
        `}
            title="Mission Briefing / Help"
        >
            <HelpCircle size={18} className="md:w-5 md:h-5" />
        </button>

        <button 
            onClick={onOpenSettings}
            className={`flex items-center gap-2 p-2 md:px-4 md:py-2 rounded-lg border transition-all
            ${isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-gradient-to-r from-purple-900/50 to-slate-800/50 border-white/10 hover:border-purple-400/50 text-gray-200'}
        `}
            title="Settings"
        >
            <Settings size={18} className="md:w-5 md:h-5" />
            <span className="text-sm hidden md:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
