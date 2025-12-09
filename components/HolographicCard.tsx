
import React, { useRef, useState, useEffect } from 'react';

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean; // If false, disables the effect (optional)
}

const HolographicCard: React.FC<HolographicCardProps> = ({ children, className = '', isActive = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glowX, setGlowX] = useState(50);
  const [glowY, setGlowY] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isActive) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation (max 15 degrees)
    const rotateYVal = ((x - centerX) / centerX) * 10; 
    const rotateXVal = ((y - centerY) / centerY) * -10; 

    setRotateX(rotateXVal);
    setRotateY(rotateYVal);
    
    // Calculate glow position (percentage)
    setGlowX((x / rect.width) * 100);
    setGlowY((y / rect.height) * 100);
  };

  const handleMouseEnter = () => setIsHovering(true);
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset position gently
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative transform-gpu transition-all duration-200 ease-out ${className}`}
      style={{
        perspective: '1000px',
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-100 ease-out transform-style-3d"
        style={{
          transform: isHovering 
            ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)` 
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        }}
      >
        {children}

        {/* Gloss/Sheen Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20 rounded-xl transition-opacity duration-300 mix-blend-overlay"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 60%)`,
            opacity: isHovering ? 1 : 0,
          }}
        />
        
        {/* Reflection Edge */}
        <div 
           className="absolute inset-0 pointer-events-none z-10 rounded-xl border border-white/10"
           style={{
               boxShadow: isHovering ? '0 20px 50px rgba(0,0,0,0.5)' : 'none'
           }}
        />
      </div>
    </div>
  );
};

export default HolographicCard;
