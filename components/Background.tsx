
import React, { useEffect, useRef } from 'react';
import { AppTheme } from '../types';

interface BackgroundProps {
    theme: AppTheme;
    isGenerating?: boolean;
}

const Background: React.FC<BackgroundProps> = ({ theme, isGenerating = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLight = theme === 'Starlight Light';

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
    
    const resizeObserver = new ResizeObserver(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    resizeObserver.observe(document.body);

    const particles: Particle[] = [];
    const clouds: NebulaCloud[] = [];
    
    const particleCount = Math.min(150, (width * height) / 10000); 
    const cloudCount = 8;

    let mouseX = -1000;
    let mouseY = -1000;
    let lastMouseX = -1000;
    let lastMouseY = -1000;
    let mouseVelocity = 0;

    const handleMouseMove = (e: MouseEvent) => {
        lastMouseX = mouseX;
        lastMouseY = mouseY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        const dx = mouseX - lastMouseX;
        const dy = mouseY - lastMouseY;
        mouseVelocity = Math.sqrt(dx * dx + dy * dy);
    };

    const handleClick = (e: MouseEvent) => {
        // Supernova effect
        const burstX = e.clientX;
        const burstY = e.clientY;
        
        particles.forEach(p => {
            const dx = p.x - burstX;
            const dy = p.y - burstY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 300) {
                const force = (300 - dist) / 10;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force;
                p.vy += Math.sin(angle) * force;
            }
        });

        clouds.forEach(c => {
            const dx = c.x - burstX;
            const dy = c.y - burstY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 400) {
                const force = (400 - dist) / 50;
                const angle = Math.atan2(dy, dx);
                c.vx += Math.cos(angle) * force;
                c.vy += Math.sin(angle) * force;
            }
        });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);

    class NebulaCloud {
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        color: string;
        opacity: number;
        pulse: number;
        pulseSpeed: number;

        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.2;
            this.vy = (Math.random() - 0.5) * 0.2;
            this.radius = Math.random() * 200 + 150;
            this.pulse = Math.random() * Math.PI;
            this.pulseSpeed = 0.005 + Math.random() * 0.01;
            this.opacity = isLight ? 0.05 : 0.08;
            
            const hues = isLight ? [190, 280] : [180, 270, 310];
            const hue = hues[Math.floor(Math.random() * hues.length)];
            this.color = `hsla(${hue}, 70%, 50%, `;
        }

        update() {
            const isWarping = generatingRef.current;
            
            if (isWarping) {
                const dx = this.x - width / 2;
                const dy = this.y - height / 2;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx);
                
                const speed = 5 + (dist / 100);
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < -this.radius || this.x > width + this.radius || this.y < -this.radius || this.y > height + this.radius) {
                    this.x = width / 2 + (Math.random() - 0.5) * 100;
                    this.y = height / 2 + (Math.random() - 0.5) * 100;
                }
            } else {
                this.x += this.vx;
                this.y += this.vy;

                // Mouse Repulsion
                const dx = mouseX - this.x;
                const dy = mouseY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 400) {
                    const force = (400 - dist) / 4000;
                    this.vx -= (dx / dist) * force;
                    this.vy -= (dy / dist) * force;
                }

                // Friction
                this.vx *= 0.99;
                this.vy *= 0.99;

                // Bounds check
                if (this.x < -this.radius) this.x = width + this.radius;
                if (this.x > width + this.radius) this.x = -this.radius;
                if (this.y < -this.radius) this.y = height + this.radius;
                if (this.y > height + this.radius) this.y = -this.radius;
            }

            this.pulse += this.pulseSpeed;
        }

        draw() {
            if (!ctx) return;
            const currentOpacity = this.opacity * (0.8 + Math.sin(this.pulse) * 0.2);
            const isWarping = generatingRef.current;

            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
            grad.addColorStop(0, this.color + currentOpacity + ')');
            grad.addColorStop(1, this.color + '0)');

            ctx.globalCompositeOperation = isLight ? 'multiply' : 'screen';
            ctx.fillStyle = grad;
            
            if (isWarping) {
                // Stretch the cloud during warp
                ctx.save();
                ctx.translate(this.x, this.y);
                const angle = Math.atan2(this.vy, this.vx);
                ctx.rotate(angle);
                ctx.scale(3, 0.5);
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      originalSize: number;
      speed: number;

      constructor(resetToCenter = false) {
        if (resetToCenter) {
            this.x = (Math.random() - 0.5) * 50 + width / 2;
            this.y = (Math.random() - 0.5) * 50 + height / 2;
        } else {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }
        
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.originalSize = Math.random() * 1.5 + 0.5;
        this.size = this.originalSize;
        this.speed = Math.random() * 0.5 + 0.1;

        const random = Math.random();
        if (isLight) {
             this.color = random > 0.5 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(168, 85, 247, 0.4)'; 
        } else {
             this.color = random > 0.5 ? 'rgba(34, 211, 238, 0.8)' : 'rgba(192, 132, 252, 0.8)'; 
        }
      }

      update() {
        const isWarping = generatingRef.current;

        if (isWarping) {
            const dx = this.x - width / 2;
            const dy = this.y - height / 2;
            this.speed *= 1.05; 
            if (this.speed > 30) this.speed = 30;

            const moveAngle = Math.atan2(dy, dx);
            this.vx = Math.cos(moveAngle) * this.speed;
            this.vy = Math.sin(moveAngle) * this.speed;

            this.x += this.vx;
            this.y += this.vy;
            this.size = this.originalSize + (this.speed * 0.2);

            if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                this.x = (Math.random() - 0.5) * 20 + width / 2;
                this.y = (Math.random() - 0.5) * 20 + height / 2;
                this.speed = Math.random() * 2 + 1;
                this.size = this.originalSize;
            }
        } else {
            if (this.speed > 0.5) {
                this.speed *= 0.95;
            }
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;

            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (150 - distance) / 150;
                this.x -= forceDirectionX * force * 1.5;
                this.y -= forceDirectionY * force * 1.5;
            }
            
            this.vx *= 0.99;
            this.vy *= 0.99;
        }
      }

      draw() {
        if (!ctx) return;
        const isWarping = generatingRef.current;
        ctx.fillStyle = this.color;
        
        if (isWarping && this.speed > 2) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
            ctx.lineWidth = this.originalSize;
            ctx.strokeStyle = this.color;
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }

    for (let i = 0; i < cloudCount; i++) {
        clouds.push(new NebulaCloud());
    }
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      clouds.forEach(c => {
          c.update();
          c.draw();
      });

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleClick);
        resizeObserver.disconnect();
        cancelAnimationFrame(animationFrameId);
    };
  }, [isLight]); 

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-colors duration-1000"
      style={{ 
          background: isLight 
            ? 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' 
            : '#050510' 
      }}
    />
  );
};

export default Background;
