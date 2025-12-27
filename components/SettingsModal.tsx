
import React, { useState, useEffect, useRef } from 'react';
import { X, Moon, Sun, Key, CheckCircle, Monitor, Terminal, Shield, AlertTriangle, Lock, Cloud, UserCheck, ShieldCheck } from 'lucide-react';
import { AppTheme } from '../types';
import { getUsageStats, setDailyLimit, removeStoredApiKey, revokeAccess } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  commanderName: string;
  onUpdateTheme: (theme: AppTheme) => void;
  onUpdateCommanderName: (name: string) => void;
  onManageApiKey: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  theme, 
  commanderName,
  onUpdateTheme,
  onUpdateCommanderName,
  onManageApiKey
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'safety' | 'system'>('general');
  const [logs, setLogs] = useState<string[]>([]);
  const [usageStats, setUsageStats] = useState({ count: 0, limit: 50, date: '' });
  
  const isLight = theme === 'Starlight Light';

  useEffect(() => {
    if (isOpen) {
        try {
            const stats = getUsageStats();
            if (stats) setUsageStats(stats);
        } catch (e) {}
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOpen && activeTab === 'system') {
        setLogs([]);
        let step = 0;
        const sequence = ["> Initializing Vertex AI...", "> Connecting to Neural Mesh...", "> Connection: READY", "> Node-Link: ONLINE"];
        interval = setInterval(() => {
            if (step < sequence.length) { setLogs(prev => [...prev, sequence[step]]); step++; }
            else { clearInterval(interval); }
        }, 150);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isOpen, activeTab]);

  const handleLimitChange = (val: number) => {
      setDailyLimit(val);
      setUsageStats(prev => ({ ...prev, limit: val }));
  };

  const handlePanicDisconnect = () => {
      removeStoredApiKey();
      revokeAccess();
      window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200" onClick={onClose} />
      <div className={`relative z-10 w-full max-w-lg rounded-2xl border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 transition-colors overflow-hidden ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}`}>
        <div className={`flex flex-col border-b ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-[#131629]'}`}>
            <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${isLight ? 'bg-slate-200 text-slate-600' : 'bg-white/5 text-gray-400'}`}><Monitor size={20} /></div><div><h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>System Settings</h3></div></div>
                <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/10 text-gray-400'}`}><X size={20} /></button>
            </div>
            <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar">
                {['general', 'safety', 'system'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? (isLight ? 'border-cyan-500 text-cyan-600' : 'border-cyan-400 text-cyan-400') : 'border-transparent text-gray-400 hover:text-gray-300'}`}>{tab}</button>
                ))}
            </div>
        </div>

        <div className="p-6 h-[480px] overflow-y-auto custom-scrollbar">
            {activeTab === 'general' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-4">
                        <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-cyan-500'}`}>Command Identity</label>
                        <div className={`p-1 rounded-xl border flex items-center gap-3 px-4 py-3 transition-all ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/10 focus-within:border-cyan-500/50'}`}>
                            <ShieldCheck size={20} className="text-cyan-500 shrink-0" />
                            <div className="flex-1">
                                <span className="text-[8px] uppercase tracking-widest text-gray-500 block mb-0.5">Neural Signature</span>
                                <input 
                                    type="text" 
                                    value={commanderName} 
                                    onChange={(e) => onUpdateCommanderName(e.target.value)}
                                    placeholder="Enter callsign..."
                                    className="bg-transparent text-sm font-bold w-full outline-none text-cyan-50 font-mono"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-500 italic px-1">This callsign will be embedded in all mission logs and onboarding protocols.</p>
                    </div>

                    <div className="space-y-3">
                        <label className={`text-xs font-semibold uppercase tracking-wider ml-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>Interface Theme</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => onUpdateTheme('Nebula Dark')} className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'Nebula Dark' ? 'bg-[#131629] border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/20' : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131629] border-white/5 opacity-50')}`}><div className={`p-3 rounded-full ${theme === 'Nebula Dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`}><Moon size={24} /></div><span className="text-sm font-medium">Dark</span></button>
                            <button onClick={() => onUpdateTheme('Starlight Light')} className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${theme === 'Starlight Light' ? 'bg-white border-purple-500/50 shadow-lg ring-1 ring-purple-500/20' : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5 opacity-50')}`}><div className={`p-3 rounded-full ${theme === 'Starlight Light' ? 'bg-purple-100 text-purple-500' : 'bg-white/5 text-gray-400'}`}><Sun size={24} /></div><span className="text-sm font-medium">Light</span></button>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'safety' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between"><label className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>Daily Usage Limit</label><span className={`text-xs font-mono px-2 py-1 rounded ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}>{usageStats.count} / {usageStats.limit}</span></div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${usageStats.count >= usageStats.limit ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min((usageStats.count / usageStats.limit) * 100, 100)}%` }} /></div>
                        <input type="range" min="5" max="200" step="5" value={usageStats.limit} onChange={(e) => handleLimitChange(Number(e.target.value))} className="w-full accent-cyan-500" />
                    </div>
                    <button onClick={handlePanicDisconnect} className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-sm flex items-center justify-center gap-2"><Lock size={16} /> EMERGENCY DISCONNECT</button>
                </div>
            )}
            {activeTab === 'system' && (
                <div className="h-full flex flex-col gap-4 animate-in fade-in duration-300">
                     <div className="flex-1 bg-black rounded-lg p-4 font-mono text-xs overflow-y-auto custom-scrollbar border border-white/10 shadow-inner">
                        {logs.map((log, i) => (<div key={i} className="mb-1 text-gray-300">{log}</div>))}
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
