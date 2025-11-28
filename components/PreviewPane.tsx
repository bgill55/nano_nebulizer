import React from 'react';
import { Eye, EyeOff, RefreshCw, Zap, Image as ImageIcon } from 'lucide-react';
import { AppTheme } from '../types';

interface PreviewPaneProps {
  image: string | null;
  isLoading: boolean;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  onRefresh: () => void;
  hasKey: boolean;
  theme?: AppTheme;
}

const PreviewPane: React.FC<PreviewPaneProps> = ({ 
  image, 
  isLoading, 
  isEnabled, 
  onToggle, 
  onRefresh,
  hasKey,
  theme = 'Nebula Dark'
}) => {
  const isLight = theme === 'Starlight Light';

  return (
    <div className={`
      relative rounded-3xl p-1 transition-all duration-300
      ${isEnabled ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30' : (isLight ? 'bg-slate-200' : 'bg-white/5')}
    `}>
      <div className={`rounded-[22px] overflow-hidden border h-full flex flex-col transition-colors
        ${isLight ? 'bg-white border-slate-200' : 'bg-[#0b0e1e] border-white/5'}
      `}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between
             ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629]/50 border-white/5'}
        `}>
          <div className="flex items-center gap-2">
            <Zap size={16} className={isEnabled ? "text-yellow-400" : (isLight ? "text-slate-400" : "text-gray-500")} />
            <span className={`text-sm font-bold tracking-wide ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>LIVE PREVIEW</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isEnabled && (
              <button 
                onClick={onRefresh}
                disabled={isLoading}
                className={`p-1.5 rounded-lg transition-colors disabled:opacity-50
                    ${isLight ? 'hover:bg-slate-200 text-slate-400 hover:text-slate-700' : 'hover:bg-white/10 text-gray-400 hover:text-white'}
                `}
                title="Force Refresh"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            )}
            <button
              onClick={() => onToggle(!isEnabled)}
              disabled={!hasKey}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none
                ${isEnabled ? 'bg-cyan-500' : (isLight ? 'bg-slate-300' : 'bg-gray-700')}
                ${!hasKey ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                  ${isEnabled ? 'translate-x-4.5' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative aspect-square w-full bg-black/5 flex items-center justify-center overflow-hidden group">
           
           {/* Background Grid */}
           <div className={`absolute inset-0 pointer-events-none ${isLight ? 'opacity-5' : 'opacity-10'}`}
                style={{ 
                    backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}>
           </div>

           {!isEnabled ? (
             <div className="text-center p-6 text-gray-500 flex flex-col items-center gap-3">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center
                    ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-gray-500'}
               `}>
                 <EyeOff size={20} />
               </div>
               <p className="text-xs max-w-[180px]">Enable Live Preview to generate drafts automatically as you edit.</p>
             </div>
           ) : (
             <>
                {image ? (
                  <img 
                    src={image} 
                    alt="Live Preview" 
                    className={`w-full h-full object-cover transition-all duration-700 ${isLoading ? 'blur-sm scale-105 opacity-80' : 'blur-0 scale-100 opacity-100'}`}
                  />
                ) : (
                  <div className="text-center p-6 text-gray-500 flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center
                         ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-white/5 text-gray-500'}
                    `}>
                      <ImageIcon size={20} />
                    </div>
                    <p className="text-xs">Type a prompt to start...</p>
                  </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                     <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
                  </div>
                )}
             </>
           )}
        </div>

        {/* Footer info */}
        {isEnabled && (
          <div className={`p-3 border-t
            ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629]/50 border-white/5'}
          `}>
             <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span>MODEL: FLASH (FAST)</span>
                <span>{isLoading ? 'GENERATING...' : 'PREVIEW READY'}</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPane;