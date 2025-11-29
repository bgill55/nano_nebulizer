
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowRight, Layout, Search, Save, Edit3, Check, AlertCircle } from 'lucide-react';
import { PromptTemplate, AppTheme } from '../types';
import { saveTemplate, deleteTemplate, getTemplates, generateUUID } from '../services/storageService';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
  theme?: AppTheme;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ 
  isOpen, 
  onClose, 
  onApply,
  theme = 'Nebula Dark' 
}) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [view, setView] = useState<'list' | 'create' | 'fill'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Creation State
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateContent, setNewTemplateContent] = useState('');

  // Filling State
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [fillValues, setFillValues] = useState<Record<string, string>>({});

  // Deletion State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isLight = theme === 'Starlight Light';

  useEffect(() => {
    if (isOpen) {
      setTemplates(getTemplates());
      setView('list');
      setSearchQuery('');
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;

    const newTemplate: PromptTemplate = {
      id: generateUUID(),
      name: newTemplateName.trim(),
      content: newTemplateContent.trim(),
      timestamp: Date.now()
    };

    const updated = saveTemplate(newTemplate);
    setTemplates(updated);
    setView('list');
    setNewTemplateName('');
    setNewTemplateContent('');
  };

  const handleInitialDeleteClick = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteTemplate(id);
    setTemplates(updated);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDeleteId(null);
  };

  const handleSelectTemplate = (template: PromptTemplate) => {
    if (confirmDeleteId === template.id) return; // Prevent selection if in delete mode

    // Check for placeholders e.g. [subject]
    const regex = /\[(.*?)\]/g;
    const found = template.content.match(regex);

    if (found && found.length > 0) {
        // Remove brackets for the key
        const keys = found.map(s => s.slice(1, -1));
        // Remove duplicates
        const uniqueKeys = Array.from(new Set(keys));
        
        setPlaceholders(uniqueKeys);
        setFillValues({});
        setSelectedTemplate(template);
        setView('fill');
    } else {
        onApply(template.content);
        onClose();
    }
  };

  const handleFillApply = () => {
    if (!selectedTemplate) return;

    let result = selectedTemplate.content;
    placeholders.forEach(key => {
       const val = fillValues[key] || '';
       // Replace ALL occurrences
       result = result.split(`[${key}]`).join(val);
    });

    onApply(result);
    onClose();
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SUGGESTIONS = ['Portrait', 'Landscape', 'Cyberpunk', '3D', 'Cinematic', 'Fantasy'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className={`relative z-10 w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 transition-colors
         ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f172a] border-white/10'}
      `}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b 
             ${isLight ? 'border-slate-100 bg-slate-50 rounded-t-2xl' : 'border-white/5 bg-[#131629] rounded-t-2xl'}
        `}>
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${isLight ? 'bg-cyan-100 text-cyan-600' : 'bg-cyan-500/20 text-cyan-400'}`}>
                <Layout size={20} />
             </div>
             <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {view === 'list' ? 'Prompt Templates' : view === 'create' ? 'New Template' : 'Fill Details'}
                </h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                    {view === 'list' ? 'Select a template or create your own' : view === 'create' ? 'Define a reusable prompt structure' : 'Customize your template'}
                </p>
             </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-white/10 text-gray-400'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            
            {/* View: LIST */}
            {view === 'list' && (
                <div className="space-y-4">
                    <div className="flex gap-2 mb-2">
                        <div className={`flex-1 flex items-center px-3 border rounded-xl transition-colors
                             ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#050510] border-white/10'}
                        `}>
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input 
                                type="text" 
                                placeholder="Search templates..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent py-3 outline-none text-sm placeholder-gray-500"
                            />
                        </div>
                        <button 
                            onClick={() => setView('create')}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-purple-900/20"
                        >
                            <Plus size={16} /> <span className="hidden sm:inline">New</span>
                        </button>
                    </div>

                    {/* Quick Search Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar">
                        {SUGGESTIONS.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSearchQuery(tag)}
                                className={`px-3 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap transition-colors
                                    ${searchQuery === tag 
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' 
                                        : (isLight ? 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10')}
                                `}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {filteredTemplates.map(t => (
                            <div 
                                key={t.id}
                                onClick={() => handleSelectTemplate(t)}
                                className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 relative
                                    ${isLight 
                                        ? 'bg-white border-slate-200 hover:border-cyan-400 hover:shadow-md' 
                                        : 'bg-[#131629] border-white/5 hover:border-white/20 hover:bg-white/5'}
                                    ${confirmDeleteId === t.id ? 'border-red-500/50' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2 h-7">
                                    <h4 className={`font-medium ${isLight ? 'text-slate-800' : 'text-gray-200 group-hover:text-white'}`}>{t.name}</h4>
                                    
                                    {/* Delete Logic */}
                                    <div className="flex items-center gap-2">
                                        {confirmDeleteId === t.id ? (
                                            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                                                <span className={`text-[10px] font-bold uppercase mr-1 ${isLight ? 'text-red-500' : 'text-red-400'}`}>Sure?</span>
                                                <button 
                                                    onClick={(e) => handleConfirmDelete(t.id, e)}
                                                    className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                                                    title="Confirm Delete"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button 
                                                    onClick={handleCancelDelete}
                                                    className={`p-1.5 rounded-lg transition-colors border
                                                        ${isLight ? 'bg-white border-slate-200 text-slate-400 hover:text-slate-600' : 'bg-[#050510] border-white/10 text-gray-500 hover:text-gray-300'}
                                                    `}
                                                    title="Cancel"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={(e) => handleInitialDeleteClick(t.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                                title="Delete Template"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className={`text-sm line-clamp-2 ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>{t.content}</p>
                                
                                {/* Placeholder Badge */}
                                {t.content.includes('[') && (
                                    <div className={`absolute bottom-4 right-4 text-[10px] px-2 py-0.5 rounded border
                                         ${isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-black/30 text-gray-500 border-white/5'}
                                    `}>
                                        Customizable
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredTemplates.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                <p>No templates found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View: CREATE */}
            {view === 'create' && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Template Name</label>
                        <input 
                            type="text"
                            placeholder="e.g., Isometric Icon"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                                ${isLight 
                                    ? 'bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-800' 
                                    : 'bg-[#050510] border-white/10 focus:border-cyan-500/50 text-white'}
                            `}
                        />
                    </div>
                    
                    <div className="space-y-2">
                         <div className="flex justify-between">
                            <label className={`text-sm font-medium ${isLight ? 'text-slate-700' : 'text-gray-300'}`}>Prompt Structure</label>
                            <span className="text-xs text-cyan-500">Use [brackets] for placeholders</span>
                         </div>
                        <textarea 
                            placeholder="e.g., A [style] portrait of a [subject]..."
                            value={newTemplateContent}
                            onChange={(e) => setNewTemplateContent(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none min-h-[150px] resize-none transition-colors
                                ${isLight 
                                    ? 'bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-800 placeholder-slate-400' 
                                    : 'bg-[#050510] border-white/10 focus:border-cyan-500/50 text-white placeholder-gray-600'}
                            `}
                        />
                         <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-gray-500'}`}>
                            Tip: Text inside square brackets like <code>[color]</code> will become a form field when you use the template.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setView('list')}
                            className={`flex-1 py-3 rounded-xl font-medium transition-colors border
                                ${isLight 
                                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                                    : 'border-white/10 text-gray-400 hover:bg-white/5'}
                            `}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!newTemplateName || !newTemplateContent}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Save Template
                        </button>
                    </div>
                </div>
            )}

            {/* View: FILL */}
            {view === 'fill' && selectedTemplate && (
                <div className="space-y-6">
                    <div className={`p-4 rounded-xl border text-sm italic mb-6
                        ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-gray-400'}
                    `}>
                        "{selectedTemplate.content}"
                    </div>
                    
                    <div className="space-y-4">
                        {placeholders.map(key => (
                            <div key={key} className="space-y-1">
                                <label className={`text-xs uppercase font-bold tracking-wider ml-1 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`}>
                                    {key}
                                </label>
                                <input 
                                    type="text"
                                    autoFocus={key === placeholders[0]}
                                    placeholder={`Enter ${key}...`}
                                    value={fillValues[key] || ''}
                                    onChange={(e) => setFillValues({...fillValues, [key]: e.target.value})}
                                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-colors
                                        ${isLight 
                                            ? 'bg-white border-slate-200 focus:border-cyan-500 text-slate-800' 
                                            : 'bg-[#050510] border-white/10 focus:border-cyan-500/50 text-white'}
                                    `}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button 
                            onClick={() => setView('list')}
                            className={`flex-1 py-3 rounded-xl font-medium transition-colors border
                                ${isLight 
                                    ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                                    : 'border-white/10 text-gray-400 hover:bg-white/5'}
                            `}
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleFillApply}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                        >
                            Insert <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
