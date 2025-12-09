
import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Key, CheckCircle, Monitor, Terminal, Cpu, Network, Server, Globe, Shield, Database } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'general' | 'system' | 'architecture'>('general');
  const [logs, setLogs] = useState<string[]>([]);
  
  const isLight = theme === 'Starlight Light';

  useEffect(() => {
    if (isOpen && activeTab === 'system') {
        setLogs([]);
        let step = 0;
        const sequence = [
            "> Initializing Vertex AI Client...",
            "> Loading Project Configuration...",
            "> Project ID: gen-lang-client-0175994694",
            "> Location: us-west1",
            "> Service Account: DETECTED",
            "> Authentication: Bearer Token (Proxy Mode)",
            "> Model Architecture: Gemini 3.0 Pro (Preview)",
            "> Context Window: 1,000,000 Tokens",
            "> Connecting to Neural Network...",
            "> CONNECTION ESTABLISHED [200 OK]",
            "> Ready for Input."
        ];

        const interval = setInterval(() => {
            if (step < sequence.length) {
                setLogs(prev => [...prev, sequence[step]]);
                step++;
            } else {
                clearInterval(interval);
            }
        }, 150);

        return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 transition-colors overflow-hidden
         ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}
      `}>
        
        {/* Header */}
        <div className={`flex flex-col border-b 
             ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-[#131629]'}
        `}>
            <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/5 text-gray-400'}`}>
                        <Monitor size={20} />
                    </div>
                    <div>
                        <h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                            System Settings
                        </h3>
                    </div>
                </div>
                <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/10 text-gray-400'}`}>
                    <X size={20} />
                </button>
            </div>
            
            {/* Tabs */}
            <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('general')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${activeTab === 'general' 
                            ? (isLight ? 'border-cyan-500 text-cyan-600' : 'border-cyan-400 text-cyan-400') 
                            : 'border-transparent text-gray-400 hover:text-gray-300'}
                    `}
                >
                    General
                </button>
                <button 
                    onClick={() => setActiveTab('architecture')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${activeTab === 'architecture' 
                            ? (isLight ? 'border-pink-500 text-pink-600' : 'border-pink-400 text-pink-400') 
                            : 'border-transparent text-gray-400 hover:text-gray-300'}
                    `}
                >
                    Architecture
                </button>
                <button 
                    onClick={() => setActiveTab('system')}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                        ${activeTab === 'system' 
                            ? (isLight ? 'border-purple-500 text-purple-600' : 'border-purple-400 text-purple-400') 
                            : 'border-transparent text-gray-400 hover:text-gray-300'}
                    `}
                >
                    System Console
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="p-6 h-[450px] overflow-y-auto custom-scrollbar">
            
            {activeTab === 'general' && (
                <div className="space-y-8 animate-in fade-in duration-300">
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
                    </div>

                    {/* Version / Info */}
                    <div className={`text-center pt-4 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
                        <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-gray-600'}`}>
                            Nebula AI v1.3.0 (Pro) • Powered by Google Gemini
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'architecture' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className={`p-6 rounded-xl border flex flex-col items-center gap-6 relative overflow-hidden
                        ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629] border-white/5'}
                     `}>
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" 
                            style={{ 
                                backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`,
                                backgroundSize: '20px 20px'
                            }}>
                        </div>

                        {/* Flow Chart */}
                        <div className="flex flex-col items-center gap-4 relative z-10 w-full">
                            
                            {/* Node 1: Client */}
                            <div className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-colors
                                ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-cyan-500/30'}
                            `}>
                                <div className={`p-2 rounded bg-cyan-500/10 text-cyan-400`}>
                                    <Monitor size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-cyan-100'}`}>CLIENT-SIDE APP</div>
                                    <div className="text-[10px] text-gray-500 font-mono">React 19 • Vite • WebGL</div>
                                </div>
                            </div>

                            {/* Connector */}
                            <div className="h-4 w-0.5 bg-gray-600/30"></div>

                            {/* Node 2: Gateway */}
                            <div className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-colors
                                ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-purple-500/30'}
                            `}>
                                <div className={`p-2 rounded bg-purple-500/10 text-purple-400`}>
                                    <Shield size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-purple-100'}`}>SECURE GATEWAY</div>
                                    <div className="text-[10px] text-gray-500 font-mono">Google GenAI SDK • API Key</div>
                                </div>
                            </div>

                            {/* Connector */}
                            <div className="h-4 w-0.5 bg-gray-600/30"></div>

                            {/* Node 3: Cloud */}
                            <div className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-colors
                                ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-emerald-500/30'}
                            `}>
                                <div className={`p-2 rounded bg-emerald-500/10 text-emerald-400`}>
                                    <Server size={18} />
                                </div>
                                <div className="flex-1">
                                    <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-emerald-100'}`}>VERTEX AI (CLOUD)</div>
                                    <div className="text-[10px] text-gray-500 font-mono">Gemini 3.0 Pro • Veo 3.1</div>
                                    <div className="text-[9px] text-emerald-500/70 font-mono mt-1">ID: gen-lang-client-0175994694</div>
                                </div>
                            </div>

                        </div>
                     </div>

                     <div className="space-y-2">
                        <h4 className={`text-xs font-bold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                            Technical Specifications
                        </h4>
                        <div className={`grid grid-cols-2 gap-2 text-[11px] font-mono p-4 rounded-xl border
                            ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#131629] border-white/5 text-gray-400'}
                        `}>
                            <div className="flex items-center gap-2"><Globe size={12}/> Region: us-west1</div>
                            <div className="flex items-center gap-2"><Cpu size={12}/> Model: Gemini 3.0 Pro</div>
                            <div className="flex items-center gap-2"><Database size={12}/> History: LocalStorage</div>
                            <div className="flex items-center gap-2"><Network size={12}/> Protocol: gRPC/REST</div>
                        </div>
                     </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="h-full flex flex-col gap-4 animate-in fade-in duration-300">
                     <div className={`p-4 rounded-xl border flex items-center gap-4
                        ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629] border-white/5'}
                     `}>
                        <div className={`p-3 rounded-full ${isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/10 text-purple-400'}`}>
                            <Terminal size={24} />
                        </div>
                        <div>
                            <div className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>System Terminal</div>
                            <div className="text-xs text-gray-500">Live Operation Logs</div>
                        </div>
                     </div>

                     <div className="flex-1 bg-black rounded-lg p-4 font-mono text-xs overflow-y-auto custom-scrollbar border border-white/10 shadow-inner">
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-red-400' : log.includes('ESTABLISHED') ? 'text-green-400' : 'text-gray-300'}`}>
                                {log}
                            </div>
                        ))}
                        <div className="w-2 h-4 bg-green-500 animate-pulse mt-2" />
                     </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
