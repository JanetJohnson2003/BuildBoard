import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function Globe({ isReducedMotion }) {
  const groupRef = useRef();
  
  // Generate random points on sphere for nodes
  const nodes = useMemo(() => {
    const pts = [];
    const radius = 2;
    for (let i = 0; i < 40; i++) {
      const phi = Math.acos(-1 + (2 * i) / 40);
      const theta = Math.sqrt(40 * Math.PI) * phi;
      pts.push(new THREE.Vector3(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      ));
    }
    return pts;
  }, []);

  // Generate connection lines
  const lines = useMemo(() => {
    const lns = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 1.8) {
          lns.push([nodes[i], nodes[j]]);
        }
      }
    }
    return lns;
  }, [nodes]);

  useFrame((state) => {
    if (!isReducedMotion && groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1.98, 32, 32]}>
        <meshBasicMaterial color="#0a0a0f" transparent opacity={0.8} />
      </Sphere>
      
      <Sphere args={[2, 24, 24]}>
        <meshBasicMaterial color="#00d4ff" wireframe transparent opacity={0.15} />
      </Sphere>

      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#06ffc7" />
        </mesh>
      ))}

      {lines.map((line, i) => (
        <Line 
          key={i}
          points={line}
          color="#00d4ff"
          lineWidth={0.5}
          transparent
          opacity={0.3}
        />
      ))}
    </group>
  );
}

export function GlobeScene() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Globe isReducedMotion={prefersReducedMotion} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={!prefersReducedMotion}
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
