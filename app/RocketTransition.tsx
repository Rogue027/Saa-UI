'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type { SiteCopy } from './copy';

type LaunchManifest = {
  frames: string[];
  sourceFrameCount: number;
  playbackFrameCount: number;
};

type RocketTransitionProps = {
  content: SiteCopy['launch'];
};

const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const easeInOut = (value: number) => value * value * (3 - 2 * value);
const revealEase = [0.22, 1, 0.36, 1] as const;

export default function RocketTransition({ content }: RocketTransitionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const [isReady, setIsReady] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    let disposed = false;
    let scrollFrame = 0;
    let resizeFrame = 0;
    let targetFrame = 0;
    let lastDrawnFrame = -1;
    let latestProgress = 0;
    let hasRenderedFirstFrame = false;
    let lastMessageVisible = false;
    const frameCache = new Map<number, HTMLImageElement>();
    const pendingFrames = new Map<number, HTMLImageElement>();
    const recentlyUsed: number[] = [];
    const maximumCachedFrames = window.innerWidth < 700 ? 12 : 22;
    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });

    if (!context) {
      setIsReady(true);
      setMessageVisible(true);
      return;
    }

    const touchFrame = (index: number) => {
      const existingIndex = recentlyUsed.indexOf(index);
      if (existingIndex >= 0) recentlyUsed.splice(existingIndex, 1);
      recentlyUsed.push(index);

      while (frameCache.size > maximumCachedFrames) {
        const evictionPosition = recentlyUsed.findIndex((candidate) => Math.abs(candidate - targetFrame) > 2);
        if (evictionPosition < 0) break;
        const [evictedIndex] = recentlyUsed.splice(evictionPosition, 1);
        frameCache.delete(evictedIndex);
      }
    };

    const drawImage = (image: HTMLImageElement, index: number) => {
      if (!canvas.width || !canvas.height || !image.naturalWidth || !image.naturalHeight) return;

      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (sourceRatio > canvasRatio) {
        drawWidth = canvas.height * sourceRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      } else {
        drawHeight = canvas.width / sourceRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      context.fillStyle = '#05070b';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      lastDrawnFrame = index;
      touchFrame(index);
    };

    const drawNearestFrame = () => {
      const exactFrame = frameCache.get(targetFrame);
      if (exactFrame) {
        if (lastDrawnFrame !== targetFrame) drawImage(exactFrame, targetFrame);
        return;
      }

      let nearestIndex = -1;
      let nearestDistance = Number.POSITIVE_INFINITY;
      frameCache.forEach((_image, index) => {
        const distance = Math.abs(index - targetFrame);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      if (nearestIndex >= 0 && nearestIndex !== lastDrawnFrame) {
        drawImage(frameCache.get(nearestIndex)!, nearestIndex);
      }
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const requestedRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.6);
      const maximumPixels = 3_200_000;
      const pixelRatio = Math.min(
        requestedRatio,
        Math.sqrt(maximumPixels / Math.max(1, bounds.width * bounds.height)),
      );
      const nextWidth = Math.max(1, Math.round(bounds.width * pixelRatio));
      const nextHeight = Math.max(1, Math.round(bounds.height * pixelRatio));

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        lastDrawnFrame = -1;
      }

      drawNearestFrame();
    };

    const cancelDistantPendingFrames = () => {
      pendingFrames.forEach((image, index) => {
        if (Math.abs(index - targetFrame) <= 8) return;
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
        pendingFrames.delete(index);
      });
    };

    const loadFrame = (index: number, frames: string[], urgent = false) => {
      const clampedIndex = Math.max(0, Math.min(frames.length - 1, index));
      if (frameCache.has(clampedIndex) || pendingFrames.has(clampedIndex)) return;
      if (!urgent && pendingFrames.size >= 7) return;

      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (disposed) return;
        pendingFrames.delete(clampedIndex);
        frameCache.set(clampedIndex, image);
        touchFrame(clampedIndex);
        if (!hasRenderedFirstFrame) {
          hasRenderedFirstFrame = true;
          setIsReady(true);
        }
        if (clampedIndex === targetFrame || lastDrawnFrame < 0) drawNearestFrame();
      };
      image.onerror = () => pendingFrames.delete(clampedIndex);
      pendingFrames.set(clampedIndex, image);
      image.src = frames[clampedIndex];
    };

    const preloadNeighborhood = (frames: string[]) => {
      loadFrame(targetFrame, frames, true);
      [1, -1, 2, -2, 4, -4, 7].forEach((offset) => loadFrame(targetFrame + offset, frames));
    };

    const updateFromScroll = (frames: string[]) => {
      scrollFrame = 0;
      if (disposed || reduceMotion) return;

      const sectionTop = section.getBoundingClientRect().top;
      const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);
      latestProgress = clamp(-sectionTop / scrollableDistance);

      const sequenceProgress = easeInOut(clamp((latestProgress - 0.08) / 0.8));
      targetFrame = Math.round(sequenceProgress * (frames.length - 1));
      const imageOpacity = 1 - clamp((latestProgress - 0.88) / 0.075);
      const calmOpacity = clamp((latestProgress - 0.82) / 0.145);
      const shouldRevealMessage = latestProgress >= 0.958;

      section.style.setProperty('--launch-image-opacity', imageOpacity.toFixed(4));
      section.style.setProperty('--launch-calm-opacity', calmOpacity.toFixed(4));
      if (lastMessageVisible !== shouldRevealMessage) {
        lastMessageVisible = shouldRevealMessage;
        setMessageVisible(shouldRevealMessage);
      }

      cancelDistantPendingFrames();
      drawNearestFrame();
      preloadNeighborhood(frames);
    };

    const requestScrollUpdate = (frames: string[]) => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(() => updateFromScroll(frames));
    };

    const initialise = async () => {
      try {
        const response = await fetch('/launch/frames.json');
        if (!response.ok) throw new Error('Launch manifest unavailable');
        const manifest = await response.json() as LaunchManifest;
        if (!manifest.frames.length) throw new Error('Launch manifest is empty');
        if (disposed) return;

        targetFrame = reduceMotion ? manifest.frames.length - 1 : 0;
        resizeCanvas();
        loadFrame(targetFrame, manifest.frames, true);

        if (reduceMotion) {
          section.style.setProperty('--launch-image-opacity', '0.42');
          section.style.setProperty('--launch-calm-opacity', '0.7');
          lastMessageVisible = true;
          setMessageVisible(true);
          return;
        }

        const onScroll = () => requestScrollUpdate(manifest.frames);
        const onResize = () => {
          if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(() => {
            resizeCanvas();
            requestScrollUpdate(manifest.frames);
          });
        };

        updateFromScroll(manifest.frames);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });

        return () => {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
        };
      } catch {
        setIsReady(true);
        setMessageVisible(true);
      }
    };

    let removeListeners: (() => void) | undefined;
    void initialise().then((cleanup) => {
      removeListeners = cleanup;
    });

    return () => {
      disposed = true;
      removeListeners?.();
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      pendingFrames.forEach((image) => {
        image.onload = null;
        image.onerror = null;
        image.removeAttribute('src');
      });
      pendingFrames.clear();
      frameCache.clear();
    };
  }, [reduceMotion]);

  const hiddenState = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 26 };
  const visibleState = { opacity: 1, y: 0 };

  return (
    <section
      className={`v-launch ${isReady ? 'is-ready' : ''}`}
      id="beyond"
      ref={sectionRef}
      aria-label={content.sectionLabel}
    >
      <div className="v-launch__sticky">
        <div className="v-launch__fallback" />
        <canvas ref={canvasRef} className="v-launch__canvas" aria-hidden="true" />
        <div className="v-launch__calm" />
        <p className="v-launch__loading" aria-live="polite">{isReady ? '' : content.loadingLabel}</p>

        <div className="v-launch__statement">
          <motion.p
            className="v-launch__eyebrow"
            initial={false}
            animate={messageVisible ? visibleState : hiddenState}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: revealEase }}
          >
            {content.eyebrow}
          </motion.p>
          <div className="v-launch__title-mask">
            <motion.h2
              initial={false}
              animate={messageVisible ? visibleState : hiddenState}
              transition={{ duration: reduceMotion ? 0 : 0.72, delay: reduceMotion ? 0 : 0.08, ease: revealEase }}
            >
              {content.title}
            </motion.h2>
          </div>
          <motion.p
            className="v-launch__body"
            initial={false}
            animate={messageVisible ? visibleState : hiddenState}
            transition={{ duration: reduceMotion ? 0 : 0.64, delay: reduceMotion ? 0 : 0.2, ease: revealEase }}
          >
            {content.body}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
