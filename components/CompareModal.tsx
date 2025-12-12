
import React, { useState, useEffect, useRef } from 'react';
import { X, MoveHorizontal } from 'lucide-react';
import { GeneratedImage } from '../types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageA: GeneratedImage | null;
  imageB: GeneratedImage | null;
}

const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, imageA, imageB }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isOpen) setPosition(50);
  }, [isOpen]);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    
    setPosition((x / rect.width) * 100);
  };

  if (!isOpen || !imageA || !imageB) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
         <button 
            onClick={onClose}
            className="absolute -top-12 right-0 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
         >
             <X size={24} />
         </button>

         <div 
            ref={containerRef}
            className="relative w-full h-full max-w-4xl max-h-[80vh] aspect-square md:aspect-auto select-none overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onMouseLeave={handleMouseUp}
         >
            {/* Image B (Bottom/After) */}
            <img 
                src={imageB.url} 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                alt="After" 
            />
            
            {/* Image A (Top/Before) - Clipped */}
            <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}
            >
                <img 
                    src={imageA.url} 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    alt="Before" 
                />
            </div>

            {/* Slider Handle */}
            <div 
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${position}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg text-black hover:scale-110 transition-transform">
                    <MoveHorizontal size={16} />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-bold border border-white/10">
                A (Before)
            </div>
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-bold border border-white/10">
                B (After)
            </div>
         </div>
         
         <p className="mt-4 text-gray-400 text-sm">Drag slider to compare</p>
      </div>
    </div>
  );
};

export default CompareModal;
