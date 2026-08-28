'use client';

import { RoundedBox } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Points,
} from 'three';
import { useMemo, useRef } from 'react';
import { scenePalette } from './palette';

function ParticleField({ progress }: { progress: number }) {
  const pointsRef = useRef<Points>(null);
  const { positions, colours } = useMemo(() => {
    const count = 140;
    const positionsArray = new Float32Array(count * 3);
    const colourArray = new Float32Array(count * 3);
    const palette = [
      new Color(scenePalette.accent),
      new Color(scenePalette.cyan),
      new Color(scenePalette.violet),
      new Color(scenePalette.signal),
      new Color(scenePalette.magenta),
    ];

    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963;
      const radius = 1.15 + ((index * 37) % 97) / 27;
      positionsArray[index * 3] = Math.cos(angle) * radius;
      positionsArray[index * 3 + 1] = Math.sin(angle * 1.37) * (1.15 + (index % 9) / 13);
      positionsArray[index * 3 + 2] = -1.6 + ((index * 19) % 73) / 18;
      const colour = palette[index % palette.length];
      colourArray[index * 3] = colour.r;
      colourArray[index * 3 + 1] = colour.g;
      colourArray[index * 3 + 2] = colour.b;
    }
    return { positions: positionsArray, colours: colourArray };
  }, []);

  useFrame(({ clock }, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * (0.035 + progress * 0.045);
    pointsRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.16) * 0.11;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colours, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.042}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.76}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function EnergyCore({ progress }: { progress: number }) {
  const coreRef = useRef<Group>(null);
  const phase = Math.min(1, Math.max(0, (progress - 0.18) * 1.8));
  const confirmed = progress > 0.66;

  useFrame(({ clock }, delta) => {
    if (!coreRef.current) return;
    coreRef.current.rotation.y += delta * 0.48;
    coreRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.72) * 0.17;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.045;
    coreRef.current.scale.setScalar((0.48 + phase * 0.48) * pulse);
  });

  return (
    <group ref={coreRef} position={[0.55, 0.03, -0.02]}>
      <mesh>
        <icosahedronGeometry args={[0.56, 2]} />
        <meshStandardMaterial
          color={confirmed ? scenePalette.signal : scenePalette.violet}
          emissive={confirmed ? scenePalette.signal : scenePalette.magenta}
          emissiveIntensity={1.55}
          metalness={0.52}
          roughness={0.18}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusKnotGeometry args={[0.93, 0.018, 110, 12, 2, 3]} />
        <meshBasicMaterial color={scenePalette.cyan} transparent opacity={0.68} blending={AdditiveBlending} />
      </mesh>
      <mesh rotation={[0.45, 0.2, 1.1]}>
        <torusGeometry args={[1.22, 0.018, 12, 96]} />
        <meshBasicMaterial color={confirmed ? scenePalette.signal : scenePalette.accent} transparent opacity={0.54} blending={AdditiveBlending} />
      </mesh>
      {[-1, 1].map((direction) => (
        <mesh key={direction} position={[direction * 1.18, 0, 0]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshBasicMaterial color={direction > 0 ? scenePalette.magenta : scenePalette.cyan} />
        </mesh>
      ))}
    </group>
  );
}

function OrderNode({ progress }: { progress: number }) {
  const groupRef = useRef<Group>(null);
  const x = MathUtils.lerp(-2.7, -0.65, Math.min(progress * 2.2, 1));
  const baseY = Math.sin(progress * Math.PI) * 0.24;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = baseY + Math.sin(clock.elapsedTime * 1.05) * 0.075;
    groupRef.current.rotation.z = -0.08 + Math.sin(clock.elapsedTime * 0.8) * 0.025;
  });

  return (
    <group ref={groupRef} position={[x, baseY, 0]} rotation={[0.08, -0.22 + progress * 0.32, -0.08]}>
      <RoundedBox args={[2.15, 1.31, 0.18]} radius={0.15} smoothness={4}>
        <meshStandardMaterial color={scenePalette.surface} metalness={0.48} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[2.02, 1.18, 0.022]} radius={0.13} position={[0, 0, 0.11]}>
        <meshBasicMaterial color={scenePalette.deepBlue} transparent opacity={0.72} />
      </RoundedBox>
      <mesh position={[-0.59, 0.29, 0.15]}>
        <circleGeometry args={[0.18, 32]} />
        <meshStandardMaterial color={scenePalette.accent} emissive={scenePalette.cyan} emissiveIntensity={1.2} />
      </mesh>
      {[0.23, -0.05, -0.33].map((lineY, index) => (
        <RoundedBox key={lineY} args={[index === 2 ? 0.84 : 1.08, 0.1, 0.05]} radius={0.04} position={[0.27, lineY, 0.15]}>
          <meshStandardMaterial
            color={index === 2 ? scenePalette.accent : scenePalette.accentMuted}
            emissive={index === 2 ? scenePalette.accentDeep : scenePalette.ground}
            emissiveIntensity={index === 2 ? 0.8 : 0}
          />
        </RoundedBox>
      ))}
      <mesh position={[0, 0, -0.15]}>
        <planeGeometry args={[2.5, 1.7]} />
        <meshBasicMaterial color={scenePalette.magenta} transparent opacity={0.045} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

function VerifyNode({ progress }: { progress: number }) {
  const ringsRef = useRef<Group>(null);
  const phase = Math.min(1, Math.max(0, (progress - 0.23) * 2.4));

  useFrame(({ clock }, delta) => {
    if (!ringsRef.current) return;
    ringsRef.current.rotation.z += delta * (0.33 + phase * 0.42);
    ringsRef.current.position.y = 0.02 + Math.sin(clock.elapsedTime * 1.4) * 0.035;
  });

  return (
    <group ref={ringsRef} position={[0.55, 0.02, -0.1]} rotation={[Math.PI / 2, 0, progress * 1.2]} scale={0.7 + phase * 0.3}>
      {[1.36, 1.08, 0.78, 0.49].map((radius, index) => (
        <mesh key={radius} rotation={[0, index * 0.17, index * 0.3]}>
          <torusGeometry args={[radius, index === 3 ? 0.045 : 0.014 + index * 0.004, 12, 80]} />
          <meshStandardMaterial
            color={phase > 0.78 ? scenePalette.signal : [scenePalette.cyan, scenePalette.violet, scenePalette.magenta, scenePalette.accent][index]}
            emissive={phase > 0.78 ? scenePalette.signal : [scenePalette.accent, scenePalette.magenta, scenePalette.violet, scenePalette.cyan][index]}
            emissiveIntensity={index === 3 ? 1.25 : 0.6}
            transparent
            opacity={0.26 + phase * 0.64}
          />
        </mesh>
      ))}
    </group>
  );
}

function DeliveryNode({ progress }: { progress: number }) {
  const groupRef = useRef<Group>(null);
  const phase = Math.min(1, Math.max(0, (progress - 0.61) * 2.56));
  const x = MathUtils.lerp(0.65, 2.65, phase);
  const baseY = Math.sin(phase * Math.PI) * 0.55;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = baseY + Math.sin(clock.elapsedTime * 1.8) * 0.06;
    const pulse = 0.25 + phase * 0.72 + Math.sin(clock.elapsedTime * 2.2) * 0.025 * phase;
    groupRef.current.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef} position={[x, baseY, 0.1]} rotation={[phase * 1.1, phase * 1.6, -phase * 0.4]} scale={0.25 + phase * 0.72}>
      <RoundedBox args={[1.05, 0.76, 0.76]} radius={0.17} smoothness={4}>
        <meshStandardMaterial color={scenePalette.signal} emissive={scenePalette.signal} emissiveIntensity={1.05} metalness={0.34} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0.01, 0.45]}>
        <boxGeometry args={[0.14, 0.38, 0.08]} />
        <meshStandardMaterial color={scenePalette.signalSoft} emissive={scenePalette.signalSoft} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.12, 0.1, 0.46]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.12, 0.32, 0.08]} />
        <meshStandardMaterial color={scenePalette.signalSoft} emissive={scenePalette.signalSoft} emissiveIntensity={0.35} />
      </mesh>
      <mesh scale={1.65}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color={scenePalette.signal} wireframe transparent opacity={0.16} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Scene({ progress }: { progress: number }) {
  return (
    <>
      <fog attach="fog" args={[scenePalette.ground, 5.4, 10]} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={[scenePalette.cyan, scenePalette.deepBlue, 1.8]} />
      <pointLight position={[-3, 3, 4]} intensity={24} color={scenePalette.accent} />
      <pointLight position={[3, -2, 4]} intensity={21} color={scenePalette.violet} />
      <pointLight position={[0, 2.6, 2]} intensity={17} color={scenePalette.magenta} />
      <spotLight position={[0, 5, 3]} angle={0.48} penumbra={1} intensity={34} color={scenePalette.cyan} />
      <ParticleField progress={progress} />
      <OrderNode progress={progress} />
      <VerifyNode progress={progress} />
      <EnergyCore progress={progress} />
      <DeliveryNode progress={progress} />
      <gridHelper args={[10, 18, scenePalette.accentDeep, scenePalette.deepBlue]} position={[0, -1.42, -0.6]} />
      <mesh position={[0, -1.45, -0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color={scenePalette.ground} roughness={0.78} metalness={0.16} />
      </mesh>
    </>
  );
}

export default function SceneRoot({ progress }: { progress: number }) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.1, 5.5], fov: 43 }}
      dpr={[1, 1.6]}
      frameloop="always"
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.28;
      }}
    >
      <Scene progress={progress} />
    </Canvas>
  );
}
