import React, { useEffect, useRef, useState } from 'react';

function ParallaxSection({ children, speed = 0.5, className = '' }) {
  const elementRef = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;
      
      const scrollTop = window.pageYOffset;
      const rate = scrollTop * -speed;
      
      setOffset(rate);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        transform: `translate3d(0, ${offset}px, 0)`,
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
}

export default ParallaxSection;