import React, { useEffect, useRef } from 'react';
import { AppTheme } from '../types';

interface BackgroundProps {
    theme: AppTheme;
    isGenerating?: boolean;
}

const Background: React.FC<BackgroundProps> = ({ theme, isGenerating = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = theme === 'Starlight Light';

  // Use refs for animation state to avoid re-initializing particles on prop change
  const generatingRef = useRef(isGenerating);

  useEffect(() => {
    generatingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    const particles: Particle[] = [];
    const particleCount = Math.min(200, (width * height) / 8000); 

    let mouseX = -1000;
    let mouseY = -1000;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    class Particle {
      x: number;
      y: number;
      z: number; // Used for hyperspace depth simulation
      vx: number;
      vy: number;
      size: number;
      color: string;
      originalSize: number;
      angle: number;
      speed: number;

      constructor(resetToCenter = false) {
        if (resetToCenter) {
            // Spawn near center for hyperspace effect
            this.x = (Math.random() - 0.5) * 50 + width / 2;
            this.y = (Math.random() - 0.5) * 50 + height / 2;
        } else {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }
        
        this.z = Math.random() * 2;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.originalSize = Math.random() * 2 + 1;
        this.size = this.originalSize;
        
        // Radial properties for hyperspace
        this.angle = Math.atan2(this.y - height / 2, this.x - width / 2);
        this.speed = Math.random() * 0.5 + 0.1;

        const random = Math.random();
        if (isLight) {
             this.color = random > 0.5 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(168, 85, 247, 0.6)'; 
        } else {
             this.color = random > 0.5 ? 'rgba(34, 211, 238, 0.8)' : 'rgba(192, 132, 252, 0.8)'; 
        }
      }

      update() {
        const isWarping = generatingRef.current;

        if (isWarping) {
            // HYPERSPACE LOGIC
            const dx = this.x - width / 2;
            const dy = this.y - height / 2;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Accelerate away from center
            this.speed *= 1.05; 
            if (this.speed > 30) this.speed = 30; // Max speed cap

            const moveAngle = Math.atan2(dy, dx);
            this.vx = Math.cos(moveAngle) * this.speed;
            this.vy = Math.sin(moveAngle) * this.speed;

            this.x += this.vx;
            this.y += this.vy;
            
            // Stretch size based on speed
            this.size = this.originalSize + (this.speed * 0.5);

            // Reset if out of bounds
            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                this.x = (Math.random() - 0.5) * 20 + width / 2;
                this.y = (Math.random() - 0.5) * 20 + height / 2;
                this.speed = Math.random() * 2 + 1;
                this.size = this.originalSize;
            }

        } else {
            // NORMAL FLOATING LOGIC
            // Slowly decelerate if coming out of warp
            if (this.speed > 0.5) {
                this.speed *= 0.95;
                this.x += this.vx * this.speed;
                this.y += this.vy * this.speed;
            } else {
                // Standard float
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interaction
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (150 - distance) / 150;
                    this.x -= forceDirectionX * force * 0.8;
                    this.y -= forceDirectionY * force * 0.8;
                    this.size = Math.min(this.originalSize * 1.5, 5);
                } else {
                    this.size = this.originalSize;
                }
            }
        }
      }

      draw() {
        if (!ctx) return;
        
        const isWarping = generatingRef.current;

        ctx.fillStyle = this.color;
        
        if (isWarping && this.speed > 2) {
            // Draw trails/streaks for warp effect
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            // Trail extends backwards
            ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
            
            ctx.lineWidth = this.originalSize;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        } else {
            // Draw dots
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      const isWarping = generatingRef.current;

      // Update and draw particles
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Only draw connections in normal mode
      if (!isWarping) {
          particles.forEach((p1, i) => {
            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              // Optimization: simple distance check
              if (Math.abs(p1.x - p2.x) > 120 || Math.abs(p1.y - p2.y) > 120) continue;

              const dx = p1.x - p2.x;
              const dy = p1.y - p2.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              if (dist < 120) {
                ctx.beginPath();
                const opacity = (1 - dist / 120);
                const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                
                if (isLight) {
                    gradient.addColorStop(0, `rgba(6, 182, 212, ${opacity * 0.3})`);
                    gradient.addColorStop(1, `rgba(168, 85, 247, ${opacity * 0.3})`);
                } else {
                    gradient.addColorStop(0, `rgba(34, 211, 238, ${opacity * 0.4})`);
                    gradient.addColorStop(1, `rgba(192, 132, 252, ${opacity * 0.4})`);
                }

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 1;
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
              }
            }
          });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isLight]); // Re-run if theme changes, but not if isGenerating changes (handled by ref)

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