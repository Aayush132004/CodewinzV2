import React, { useEffect, useRef, useState } from 'react';

function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 800,
  threshold = 0.1,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [delay, threshold]);

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
    
    switch (direction) {
      case 'up': return 'translate3d(0, 60px, 0) scale(0.95)';
      case 'down': return 'translate3d(0, -60px, 0) scale(0.95)';
      case 'left': return 'translate3d(60px, 0, 0) scale(0.95)';
      case 'right': return 'translate3d(-60px, 0, 0) scale(0.95)';
      case 'scale': return 'translate3d(0, 0, 0) scale(0.8)';
      case 'rotate': return 'translate3d(0, 30px, 0) scale(0.9) rotate(-5deg)';
      default: return 'translate3d(0, 0, 0) scale(1)';
    }
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </div>
  );
}

export default ScrollReveal;