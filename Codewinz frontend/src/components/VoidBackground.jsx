// src/components/FlowingParticlesBackground.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FlowingParticles() {
  const ref = useRef();
  const numParticles = 2000;

  // Generate initial random positions
  const positions = useMemo(() => {
    const posArr = new Float32Array(numParticles * 3);
    for (let i = 0; i < numParticles; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      posArr[i * 3] = x;
      posArr[i * 3 + 1] = y;
      posArr[i * 3 + 2] = z;
    }
    return posArr;
  }, [numParticles]);

  useFrame((state, delta) => {
    // Animate particles
    for (let i = 0; i < numParticles; i++) {
      const i3 = i * 3;
      // Simple upward movement
      ref.current.geometry.attributes.position.array[i3 + 1] += 0.01 * delta; // Move up slowly
      if (ref.current.geometry.attributes.position.array[i3 + 1] > 5) {
        ref.current.geometry.attributes.position.array[i3 + 1] = -5; // Reset if too high
      }

      // Add a slight horizontal drift based on sine wave
      ref.current.geometry.attributes.position.array[i3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.001;
      ref.current.geometry.attributes.position.array[i3 + 2] += Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;

    // Mouse interaction for subtle camera shift or particle direction
    ref.current.position.x = state.mouse.x * 0.1;
    ref.current.position.y = state.mouse.y * 0.1;
  });

  return (
    <Points positions={positions} ref={ref} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#00ffff" // Cyan/blue for a techy feel
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

function VoidBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 3] }} className="pointer-events-auto">
        <ambientLight intensity={0.5} />
        <FlowingParticles />
      </Canvas>
    </div>
  );
}

export default VoidBackground;