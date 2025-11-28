import React from 'react';
import { X, Trash2, Copy, Zap, Calendar } from 'lucide-react';
import { GeneratedImage } from '../types';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GeneratedImage[];
  onDelete: (id: string) => void;
  onSelect: (image: GeneratedImage) => void;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ 
  isOpen, 
  onClose, 
  images, 
  onDelete, 
  onSelect 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-5xl bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#131629]">
          <div>
            <h3 className="text-xl font-rajdhani font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">///</span> Gallery
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Locally stored history (Max 10 items)
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#050510]">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                <Calendar size={32} />
              </div>
              <p>No images generated yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative bg-[#131629] rounded-xl overflow-hidden border border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300"
                >
                  {/* Image Aspect Wrapper */}
                  <div className="aspect-square relative overflow-hidden bg-black/20">
                    <img 
                      src={img.url} 
                      alt={img.prompt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <div className="flex gap-2 justify-center mb-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(img);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg"
                         >
                            <Zap size={14} /> Reuse
                         </button>
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(img.id);
                            }}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 transition-colors backdrop-blur-sm"
                            title="Delete"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                         <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                            {img.style || 'No Style'}
                         </span>
                         <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(img.timestamp).toLocaleDateString()}
                         </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 font-light leading-relaxed group-hover:text-white transition-colors">
                        "{img.prompt}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryModal;