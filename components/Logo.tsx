
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
      >
        {/* Hexagonal Shield Frame */}
        <path
          d="M50 5L89.5 27.5V72.5L50 95L10.5 72.5V27.5L50 5Z"
          stroke="currentColor"
          strokeWidth="2"
          className="text-cyan-500/30"
        />
        <path
          d="M50 12L83.5 31V69L50 88L16.5 69V31L50 12Z"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-purple-500/50"
        />

        {/* Swirling Nebula Core */}
        <defs>
          <radialGradient id="nebulaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <circle cx="50" cy="50" r="18" fill="url(#nebulaGradient)" className="animate-pulse" />
        
        {/* Neural Network Nodes */}
        <g className="text-white" filter="url(#glow)">
          <circle cx="50" cy="50" r="3" fill="currentColor" />
          <circle cx="50" cy="30" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="68" cy="40" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="68" cy="60" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="50" cy="70" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="32" cy="60" r="2" fill="currentColor" opacity="0.8" />
          <circle cx="32" cy="40" r="2" fill="currentColor" opacity="0.8" />
          
          {/* Connections */}
          <line x1="50" y1="50" x2="50" y2="30" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="50" y1="50" x2="68" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="50" y1="50" x2="68" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="50" y1="50" x2="50" y2="70" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="50" y1="50" x2="32" y2="60" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
          <line x1="50" y1="50" x2="32" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
};

export default Logo;
