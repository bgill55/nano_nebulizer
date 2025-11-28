
import React from 'react';
import { X, Moon, Sun, Key, CheckCircle, Monitor } from 'lucide-react';
import { AppTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onUpdateTheme: (theme: AppTheme) => void;
  onManageApiKey: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  theme, 
  onUpdateTheme,
  onManageApiKey
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'Starlight Light';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative z-10 w-full max-w-md rounded-2xl border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 transition-colors
         ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}
      `}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b 
             ${isLight ? 'border-slate-100 bg-slate-50 rounded-t-2xl' : 'border-white/5 bg-[#131629] rounded-t-2xl'}
        `}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/5 text-gray-400'}`}>
                <Monitor size={20} />
             </div>
             <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    Settings
                </h3>
             </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/10 text-gray-400'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
            
            {/* Theme Section */}
            <div className="space-y-3">
                <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Interface Theme
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                    onClick={() => onUpdateTheme('Nebula Dark')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all relative overflow-hidden group
                        ${theme === 'Nebula Dark'
                            ? 'bg-[#131629] border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/20'
                            : (isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300' : 'bg-[#131629] border-white/5 opacity-50 hover:opacity-100')}
                    `}
                    >
                        <div className={`p-3 rounded-full ${theme === 'Nebula Dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`}>
                            <Moon size={24} />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Nebula Dark</span>
                        {theme === 'Nebula Dark' && <div className="absolute top-2 right-2 text-cyan-500"><CheckCircle size={14} /></div>}
                    </button>

                    <button
                    onClick={() => onUpdateTheme('Starlight Light')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all relative overflow-hidden group
                        ${theme === 'Starlight Light'
                            ? 'bg-white border-purple-500/50 shadow-lg ring-1 ring-purple-500/20'
                            : (isLight ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100')}
                    `}
                    >
                        <div className={`p-3 rounded-full ${theme === 'Starlight Light' ? 'bg-purple-100 text-purple-500' : 'bg-white/5 text-gray-400'}`}>
                            <Sun size={24} />
                        </div>
                        <span className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Starlight Light</span>
                        {theme === 'Starlight Light' && <div className="absolute top-2 right-2 text-purple-500"><CheckCircle size={14} /></div>}
                    </button>
                </div>
            </div>

            {/* API Key Section */}
            <div className="space-y-3">
                <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    Account & API
                </label>
                <div className={`p-4 rounded-xl border flex items-center justify-between
                    ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629] border-white/5'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isLight ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            <Key size={18} />
                        </div>
                        <div>
                            <div className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-200'}`}>Google Cloud API</div>
                            <div className="text-xs text-emerald-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onManageApiKey}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
                            ${isLight 
                                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' 
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}
                        `}
                    >
                        Change Key
                    </button>
                </div>
                <p className={`text-[10px] px-1 ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                    Your API Key is stored locally in your browser session for security.
                </p>
            </div>

            {/* Version / Info */}
            <div className={`text-center pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>
                    Nebula AI v1.2.0 • Powered by Google Gemini
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
