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
const revealEase = [0.22, 1, 0.36, 1] as const;

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

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
    let playbackRequest = 0;
    let resizeFrame = 0;
    let desiredFrame = 0;
    let displayedFrame = 0;
    let lastDrawnFrame = -1;
    let latestProgress = 0;
    let presentationProgress = 0;
    let needsScrollMeasurement = true;
    let lastTickTime = 0;
    let frameAccumulator = 0;
    let endHoldStarted = 0;
    let isCatchUpPinned = false;
    let catchUpDirection = 0;
    let warmTimer = 0;
    let hasSignalledReady = false;
    let lastMessageVisible = false;
    const frameCache = new Map<number, HTMLImageElement>();
    const pendingFrames = new Map<number, HTMLImageElement>();
    const recentlyUsed: number[] = [];
    const isMobile = window.innerWidth < 700;
    const maximumCachedFrames = isMobile ? 16 : 28;
    const maximumPendingFrames = isMobile ? 9 : 16;
    const lookAheadFrames = isMobile ? 8 : 15;
    const initialRunwayFrames = isMobile ? 5 : 9;
    const frameInterval = 1000 / (isMobile ? 30 : 48);
    const endHoldDuration = 620;
    const warmController = new AbortController();
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
        const evictionPosition = recentlyUsed.findIndex(
          (candidate) => Math.abs(candidate - displayedFrame) > 5,
        );
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
      if (lastDrawnFrame >= 0 && index !== lastDrawnFrame && Math.abs(index - lastDrawnFrame) > 1) {
        section.dataset.launchFrameIntegrity = 'failed';
      } else if (!section.dataset.launchFrameIntegrity) {
        section.dataset.launchFrameIntegrity = 'sequential';
      }
      displayedFrame = index;
      lastDrawnFrame = index;
      section.dataset.launchFrame = String(index + 1);
      touchFrame(index);
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

      const currentFrame = frameCache.get(displayedFrame);
      if (currentFrame) drawImage(currentFrame, displayedFrame);
    };

    const schedulePlayback = (frames: string[]) => {
      if (!playbackRequest && !disposed && !reduceMotion) {
        playbackRequest = window.requestAnimationFrame((timestamp) => playbackTick(timestamp, frames));
      }
    };

    const signalReadyWhenBuffered = () => {
      if (hasSignalledReady) return;

      if (reduceMotion) {
        if (lastDrawnFrame < 0) return;
      } else {
        for (let index = 0; index <= initialRunwayFrames; index += 1) {
          if (!frameCache.has(index)) return;
        }
      }

      hasSignalledReady = true;
      setIsReady(true);
    };

    const loadFrame = (index: number, frames: string[], urgent = false) => {
      const clampedIndex = Math.max(0, Math.min(frames.length - 1, index));
      if (frameCache.has(clampedIndex) || pendingFrames.has(clampedIndex)) return;
      if (!urgent && pendingFrames.size >= maximumPendingFrames) return;

      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = urgent ? 'high' : 'low';
      image.onload = () => {
        void image.decode().catch(() => undefined).then(() => {
          if (disposed) return;
          pendingFrames.delete(clampedIndex);
          frameCache.set(clampedIndex, image);
          touchFrame(clampedIndex);

          if (lastDrawnFrame < 0 || (reduceMotion && clampedIndex === frames.length - 1)) {
            drawImage(image, clampedIndex);
          }

          signalReadyWhenBuffered();
          schedulePlayback(frames);
        });
      };
      image.onerror = () => pendingFrames.delete(clampedIndex);
      pendingFrames.set(clampedIndex, image);
      image.src = frames[clampedIndex];
    };

    const preloadPlaybackWindow = (frames: string[], direction: number) => {
      const playbackDirection = direction || 1;
      loadFrame(displayedFrame, frames, true);

      for (let distance = 1; distance <= lookAheadFrames; distance += 1) {
        loadFrame(displayedFrame + playbackDirection * distance, frames, distance <= 2);
      }

      for (let distance = 1; distance <= 4; distance += 1) {
        loadFrame(displayedFrame - playbackDirection * distance, frames);
      }
    };

    const applyPresentationProgress = (progress: number) => {
      const imageOpacity = 1 - clamp((progress - 0.91) / 0.055);
      const calmOpacity = clamp((progress - 0.89) / 0.075);
      const shouldRevealMessage = progress >= 0.97;

      section.style.setProperty('--launch-image-opacity', imageOpacity.toFixed(4));
      section.style.setProperty('--launch-calm-opacity', calmOpacity.toFixed(4));
      if (lastMessageVisible !== shouldRevealMessage) {
        lastMessageVisible = shouldRevealMessage;
        setMessageVisible(shouldRevealMessage);
      }
    };

    const measureScrollProgress = () => {
      if (needsScrollMeasurement) {
        const sectionTop = section.getBoundingClientRect().top;
        const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);
        latestProgress = clamp(-sectionTop / scrollableDistance);
        needsScrollMeasurement = false;
      }
    };

    const updateCatchUpPin = (timestamp: number, frames: string[]) => {
      const finalFrame = frames.length - 1;
      const reachedEnd = displayedFrame === finalFrame && presentationProgress >= 0.999;

      if (latestProgress >= 0.999 && reachedEnd) {
        if (!endHoldStarted) endHoldStarted = timestamp;
      } else {
        endHoldStarted = 0;
      }

      const holdingEnd = Boolean(endHoldStarted) && timestamp - endHoldStarted < endHoldDuration;
      const catchingForward = latestProgress >= 0.999
        && (displayedFrame < finalFrame || presentationProgress < 0.999 || holdingEnd);
      const catchingBackward = latestProgress <= 0.001 && displayedFrame > 0;
      const shouldPin = catchingForward || catchingBackward;

      if (shouldPin !== isCatchUpPinned) {
        isCatchUpPinned = shouldPin;
        section.classList.toggle('is-catching-up', shouldPin);

        if (shouldPin) {
          catchUpDirection = catchingForward ? 1 : -1;
        } else if (catchUpDirection) {
          const sectionStart = section.offsetTop;
          const sectionEnd = sectionStart + Math.max(1, section.offsetHeight - window.innerHeight);
          const boundary = catchUpDirection > 0 ? sectionEnd : sectionStart;
          const passedBoundary = catchUpDirection > 0
            ? window.scrollY > boundary
            : window.scrollY < boundary;
          if (passedBoundary) window.scrollTo({ top: boundary, behavior: 'auto' });
          catchUpDirection = 0;
          needsScrollMeasurement = true;
        }
      }
    };

    function playbackTick(timestamp: number, frames: string[]) {
      playbackRequest = 0;
      if (disposed || reduceMotion) return;

      const elapsed = lastTickTime ? Math.min(50, timestamp - lastTickTime) : 0;
      lastTickTime = timestamp;
      frameAccumulator = Math.min(frameInterval * 1.5, frameAccumulator + elapsed);

      measureScrollProgress();

      const sequenceProgress = clamp((latestProgress - 0.08) / 0.82);
      desiredFrame = Math.round(sequenceProgress * (frames.length - 1));
      const direction = Math.sign(desiredFrame - displayedFrame);

      if (direction && frameAccumulator >= frameInterval) {
        const nextFrame = displayedFrame + direction;
        const nextImage = frameCache.get(nextFrame);

        if (nextImage) {
          drawImage(nextImage, nextFrame);
          frameAccumulator -= frameInterval;
        } else {
          loadFrame(nextFrame, frames, true);
          frameAccumulator = Math.min(frameAccumulator, frameInterval);
        }
      }

      const finalFrame = frames.length - 1;
      const frameTimelineProgress = 0.08 + (displayedFrame / Math.max(1, finalFrame)) * 0.82;

      if (displayedFrame === 0 && desiredFrame === 0) {
        presentationProgress = Math.min(latestProgress, 0.08);
      } else if (displayedFrame === finalFrame && desiredFrame === finalFrame) {
        const tailTarget = Math.max(0.9, latestProgress);
        const tailStep = elapsed * 0.0002;
        presentationProgress = Math.min(tailTarget, presentationProgress + tailStep);
      } else {
        presentationProgress = frameTimelineProgress;
      }

      applyPresentationProgress(presentationProgress);
      preloadPlaybackWindow(frames, direction);
      updateCatchUpPin(timestamp, frames);

      const tailIsMoving = displayedFrame === finalFrame
        && desiredFrame === finalFrame
        && presentationProgress < Math.max(0.9, latestProgress) - 0.0001;
      const holdingEnd = Boolean(endHoldStarted) && timestamp - endHoldStarted < endHoldDuration;

      if (desiredFrame !== displayedFrame || needsScrollMeasurement || tailIsMoving || holdingEnd) {
        schedulePlayback(frames);
      }
    }

    const requestScrollUpdate = (frames: string[]) => {
      needsScrollMeasurement = true;
      schedulePlayback(frames);
    };

    const warmFrameResponses = async (frames: string[]) => {
      const connection = (navigator as NavigatorWithConnection).connection;
      if (connection?.saveData) return;

      for (let index = 0; index < frames.length && !disposed; index += 2) {
        const batch = frames.slice(index, index + 2);
        await Promise.allSettled(batch.map(async (url) => {
          const response = await fetch(url, { cache: 'force-cache', signal: warmController.signal });
          if (response.ok) await response.arrayBuffer();
        }));
        await new Promise((resolve) => window.setTimeout(resolve, 36));
      }
    };

    const initialise = async () => {
      try {
        const response = await fetch('/launch/frames.json');
        if (!response.ok) throw new Error('Launch manifest unavailable');
        const manifest = await response.json() as LaunchManifest;
        if (!manifest.frames.length) throw new Error('Launch manifest is empty');
        if (disposed) return;

        displayedFrame = reduceMotion ? manifest.frames.length - 1 : 0;
        desiredFrame = displayedFrame;
        presentationProgress = reduceMotion ? 1 : 0;
        resizeCanvas();
        loadFrame(displayedFrame, manifest.frames, true);

        if (reduceMotion) {
          section.style.setProperty('--launch-image-opacity', '0.3');
          section.style.setProperty('--launch-calm-opacity', '0.82');
          lastMessageVisible = true;
          setMessageVisible(true);
          return;
        }

        for (let index = 1; index <= initialRunwayFrames; index += 1) {
          loadFrame(index, manifest.frames, index <= 2);
        }

        const onScroll = () => requestScrollUpdate(manifest.frames);
        const onResize = () => {
          if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(() => {
            resizeCanvas();
            requestScrollUpdate(manifest.frames);
          });
        };

        requestScrollUpdate(manifest.frames);
        warmTimer = window.setTimeout(() => {
          void warmFrameResponses(manifest.frames).catch(() => undefined);
        }, 450);
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
      if (playbackRequest) window.cancelAnimationFrame(playbackRequest);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (warmTimer) window.clearTimeout(warmTimer);
      warmController.abort();
      section.classList.remove('is-catching-up');
      delete section.dataset.launchFrame;
      delete section.dataset.launchFrameIntegrity;
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
