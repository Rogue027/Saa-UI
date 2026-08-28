'use client';

import { Canvas } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { MathUtils } from 'three';
import { scenePalette } from './palette';

function OrderNode({ progress }: { progress: number }) {
  const x = MathUtils.lerp(-2.7, -0.55, Math.min(progress * 2.2, 1));
  const y = Math.sin(progress * Math.PI) * 0.24;
  return (
    <group position={[x, y, 0]} rotation={[0.08, -0.22 + progress * 0.32, -0.08]}>
      <RoundedBox args={[2.1, 1.28, 0.16]} radius={0.14} smoothness={3}>
        <meshStandardMaterial color={scenePalette.surface} metalness={0.3} roughness={0.35} />
      </RoundedBox>
      <mesh position={[-0.56, 0.27, 0.1]}>
        <circleGeometry args={[0.17, 32]} />
        <meshStandardMaterial color={scenePalette.accent} emissive={scenePalette.accentDeep} emissiveIntensity={0.7} />
      </mesh>
      {[0.22, -0.05, -0.31].map((lineY, index) => (
        <RoundedBox key={lineY} args={[index === 2 ? 0.84 : 1.08, 0.1, 0.05]} radius={0.04} position={[0.27, lineY, 0.11]}>
          <meshStandardMaterial color={index === 2 ? scenePalette.accent : scenePalette.accentMuted} />
        </RoundedBox>
      ))}
    </group>
  );
}

function VerifyNode({ progress }: { progress: number }) {
  const phase = Math.min(1, Math.max(0, (progress - 0.23) * 2.4));
  return (
    <group position={[0.55, 0.02, -0.1]} rotation={[Math.PI / 2, 0, progress * 1.2]} scale={0.7 + phase * 0.3}>
      {[1.05, 0.76, 0.48].map((radius, index) => (
        <mesh key={radius}>
          <torusGeometry args={[radius, index === 2 ? 0.045 : 0.018, 12, 64]} />
          <meshStandardMaterial
            color={phase > 0.78 ? scenePalette.signal : scenePalette.accent}
            emissive={phase > 0.78 ? scenePalette.signal : scenePalette.accentDeep}
            emissiveIntensity={index === 2 ? 1.1 : 0.38}
            transparent
            opacity={0.32 + phase * 0.58}
          />
        </mesh>
      ))}
    </group>
  );
}

function DeliveryNode({ progress }: { progress: number }) {
  const phase = Math.min(1, Math.max(0, (progress - 0.61) * 2.56));
  const x = MathUtils.lerp(0.65, 2.65, phase);
  const y = Math.sin(phase * Math.PI) * 0.55;
  return (
    <group position={[x, y, 0.1]} rotation={[phase * 1.1, phase * 1.6, -phase * 0.4]} scale={0.25 + phase * 0.72}>
      <RoundedBox args={[1, 0.72, 0.72]} radius={0.16} smoothness={3}>
        <meshStandardMaterial color={scenePalette.signal} emissive={scenePalette.signal} emissiveIntensity={0.5} metalness={0.25} roughness={0.27} />
      </RoundedBox>
      <mesh position={[0, 0.01, 0.42]}>
        <boxGeometry args={[0.14, 0.38, 0.08]} />
        <meshStandardMaterial color={scenePalette.signalSoft} />
      </mesh>
      <mesh position={[0.12, 0.1, 0.43]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.12, 0.32, 0.08]} />
        <meshStandardMaterial color={scenePalette.signalSoft} />
      </mesh>
    </group>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <ambientLight intensity={1.1} />
      <pointLight position={[-3, 3, 4]} intensity={18} color={scenePalette.accent} />
      <pointLight position={[3, -2, 4]} intensity={15} color={scenePalette.violet} />
      <OrderNode progress={progress} />
      <VerifyNode progress={progress} />
      <DeliveryNode progress={progress} />
      <mesh position={[0, -1.45, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={scenePalette.ground} roughness={0.7} />
      </mesh>
    </>
  );
}

export default function SceneRoot({ progress }: { progress: number }) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.1, 5.5], fov: 43 }}
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <Scene progress={progress} />
    </Canvas>
  );
}
