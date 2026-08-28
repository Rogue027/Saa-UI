'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { canRunEnhancedScene } from './capability';

const SceneRoot = dynamic(() => import('./SceneRoot'), { ssr: false });

export function ThreePanel({ progress }: { progress: number }) {
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnhanced(canRunEnhancedScene()), 120);
    return () => window.clearTimeout(timer);
  }, []);

  if (!enhanced) return null;
  return <SceneRoot progress={progress} />;
}
