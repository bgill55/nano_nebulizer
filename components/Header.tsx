
import React from 'react';
import { Settings, Image, Grid } from 'lucide-react';
import { AppTheme } from '../types';

interface HeaderProps {
  onOpenGallery?: () => void;
  onOpenSettings?: () => void;
  theme?: AppTheme;
}

const Header: React.FC<HeaderProps> = ({ onOpenGallery, onOpenSettings, theme = 'Nebula Dark' }) => {
  const isLight = theme === 'Starlight Light';

  return (
    <header className={`w-full p-4 flex flex-col md:flex-row items-center justify-between border-b backdrop-blur-sm z-50 sticky top-0 transition-colors duration-500
        ${isLight ? 'bg-white/80 border-slate-200 shadow-sm' : 'border-white/5 bg-transparent'}
    `}>
      <div className="flex gap-4 mb-4 md:mb-0">
        <button className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400/80 to-purple-500/80 text-white font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
          <Image size={18} />
          <span className="text-sm">AI Art Generator</span>
        </button>
        <button 
          onClick={onOpenGallery}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg border font-medium transition-all
            ${isLight 
                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'}
          `}
        >
          <Grid size={18} />
          <span className="text-sm">Gallery</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
            ${isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-gradient-to-r from-purple-900/50 to-slate-800/50 border-white/10 hover:border-purple-400/50 text-gray-200'}
        `}>
            <Settings size={18} />
            <span className="text-sm">Settings</span>
        </button>
      </div>
    </header>
  );
};

export default Header;