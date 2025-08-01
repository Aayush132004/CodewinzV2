// src/components/ProfessionalBackground.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FlowingParticles() {
  const ref = useRef();
  const numParticles = 1500; // Reduced for better performance
  
  // Generate initial positions and velocities
  const particleData = useMemo(() => {
    const positions = new Float32Array(numParticles * 3);
    const velocities = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);
    
    for (let i = 0; i < numParticles; i++) {
      const i3 = i * 3;
      
      // Distribute particles in a larger space
      positions[i3] = (Math.random() - 0.5) * 15;
      positions[i3 + 1] = (Math.random() - 0.5) * 15;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
      
      // Random velocities for organic movement
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = Math.random() * 0.01 + 0.005; // Slight upward bias
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
      
      // Varying particle sizes
      scales[i] = Math.random() * 0.8 + 0.2;
    }
    
    return { positions, velocities, scales };
  }, [numParticles]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const positions = ref.current.geometry.attributes.position.array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < numParticles; i++) {
      const i3 = i * 3;
      
      // Apply velocities with some variation
      positions[i3] += particleData.velocities[i3] * delta * 60;
      positions[i3 + 1] += particleData.velocities[i3 + 1] * delta * 60;
      positions[i3 + 2] += particleData.velocities[i3 + 2] * delta * 60;
      
      // Add subtle wave motion
      positions[i3] += Math.sin(time * 0.3 + i * 0.01) * 0.001;
      positions[i3 + 2] += Math.cos(time * 0.2 + i * 0.01) * 0.001;
      
      // Boundary wrapping for continuous flow
      if (positions[i3] > 8) positions[i3] = -8;
      if (positions[i3] < -8) positions[i3] = 8;
      if (positions[i3 + 1] > 8) positions[i3 + 1] = -8;
      if (positions[i3 + 1] < -8) positions[i3 + 1] = 8;
      if (positions[i3 + 2] > 4) positions[i3 + 2] = -4;
      if (positions[i3 + 2] < -4) positions[i3 + 2] = 4;
    }
    
    ref.current.geometry.attributes.position.needsUpdate = true;
    
    // Subtle mouse interaction
    const mouseX = state.mouse.x * 0.05;
    const mouseY = state.mouse.y * 0.05;
    ref.current.rotation.x = mouseY * 0.1;
    ref.current.rotation.y = mouseX * 0.1;
  });

  return (
    <Points 
      positions={particleData.positions} 
      ref={ref} 
      stride={3} 
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        color="#1e40af" // Professional blue
        size={0.015}
        sizeAttenuation={true}
        depthWrite={false}
        alphaTest={0.1}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function GridOverlay() {
  const ref = useRef();
  
  const gridPoints = useMemo(() => {
    const points = [];
    const size = 20;
    const divisions = 40;
    const step = size / divisions;
    
    // Create subtle grid lines
    for (let i = 0; i <= divisions; i++) {
      const x = -size/2 + i * step;
      // Horizontal lines
      points.push(new THREE.Vector3(x, -size/2, -2));
      points.push(new THREE.Vector3(x, size/2, -2));
      // Vertical lines
      points.push(new THREE.Vector3(-size/2, x, -2));
      points.push(new THREE.Vector3(size/2, x, -2));
    }
    
    return points;
  }, []);
  
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.02 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
  });
  
  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={gridPoints.length}
          array={new Float32Array(gridPoints.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color="#1e40af" 
        transparent 
        opacity={0.03}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

function ProfessionalBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }} 
        className="pointer-events-auto"
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[10, 10, 10]} intensity={0.2} color="#1e40af" />
        
        <GridOverlay />
        <FlowingParticles />
        
        {/* Subtle fog for depth */}
        <fog attach="fog" args={['#0f172a', 8, 20]} />
      </Canvas>
      
      {/* Overlay gradient for content readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none" />
    </div>
  );
}

export default VoidBackground;