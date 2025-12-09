import React, { useEffect, useRef } from 'react';
import { AppTheme } from '../types';

interface BackgroundProps {
    theme: AppTheme;
}

const Background: React.FC<BackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = theme === 'Starlight Light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = Math.min(120, (width * height) / 12000); 

    let mouseX = -1000;
    let mouseY = -1000;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 2 + 1.5;
        
        // Randomly assign Cyan or Purple tints for "Nebula" feel
        const random = Math.random();
        if (isLight) {
             this.color = random > 0.5 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.4)'; // Cyan/Purple for light
        } else {
             this.color = random > 0.5 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(192, 132, 252, 0.6)'; // Cyan/Purple for dark
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction: Gentle repulsion
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (150 - distance) / 150;
            const directionX = forceDirectionX * force * 0.5;
            const directionY = forceDirectionY * force * 0.5;
            this.x -= directionX;
            this.y -= directionY;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            const opacity = 1 - dist / 120;
            // Gradient lines
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            
            if (isLight) {
                 gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity * 0.2})`);
                 gradient.addColorStop(1, `rgba(168, 85, 247, ${opacity * 0.2})`);
            } else {
                 gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity * 0.3})`);
                 gradient.addColorStop(1, `rgba(168, 85, 247, ${opacity * 0.3})`);
            }

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-colors duration-1000"
      style={{ 
          background: isLight 
            ? 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' 
            : 'linear-gradient(to bottom, #050510, #0f172a)' 
      }}
    />
  );
};

export default Background;