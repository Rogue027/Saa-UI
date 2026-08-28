'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { canRunEnhancedScene } from './capability';

const SceneRoot = dynamic(() => import('./SceneRoot'), { ssr: false });

export function ThreePanel({ progress }: { progress: number }) {
  const [enhanced, setEnhanced] = useState(false);
  const [inView, setInView] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setEnhanced(canRunEnhancedScene()), 120);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '20% 0px',
      threshold: 0.01,
    });
    observer.observe(layer);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={layerRef} className="v-three-layer" aria-hidden="true">
      {enhanced && inView ? <SceneRoot progress={progress} /> : null}
    </div>
  );
}
