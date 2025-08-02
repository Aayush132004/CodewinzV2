import React, { useEffect, useState } from 'react';
import { Code, Zap, Trophy, Star, Target, Sparkles } from 'lucide-react';

function FloatingElements() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const elements = [
    { Icon: Code, size: 24, color: 'text-blue-400', delay: 0 },
    { Icon: Zap, size: 20, color: 'text-yellow-400', delay: 0.5 },
    { Icon: Trophy, size: 28, color: 'text-orange-400', delay: 1 },
    { Icon: Star, size: 16, color: 'text-purple-400', delay: 1.5 },
    { Icon: Target, size: 22, color: 'text-green-400', delay: 2 },
    { Icon: Sparkles, size: 18, color: 'text-pink-400', delay: 2.5 }
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {elements.map((element, index) => {
        const { Icon, size, color, delay } = element;
        const offsetX = (mousePosition.x * (index % 2 === 0 ? 0.02 : -0.02));
        const offsetY = (mousePosition.y * (index % 2 === 0 ? 0.01 : -0.01));
        
        return (
          <div
            key={index}
            className={`absolute ${color} opacity-20 transition-all duration-1000 ease-out animate-pulse`}
            style={{
              left: `${20 + (index * 15)}%`,
              top: `${30 + (index * 10)}%`,
              transform: `translate(${offsetX}px, ${offsetY}px) rotate(${Math.sin(Date.now() * 0.001 + index) * 15}deg)`,
              animationDelay: `${delay}s`
            }}
          >
            <Icon size={size} />
          </div>
        );
      })}
    </div>
  );
}

export default FloatingElements;