'use client';

import { MeshGradient } from '@paper-design/shaders-react';
import { Check, KeyRound, PackageCheck, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SiBinance, SiTelegram, SiTether } from 'react-icons/si';
import type { SiteCopy } from './copy';
import { flowPalette } from './flowPalette';

const stateIcons = [SiTelegram, ShieldCheck, PackageCheck];
const ease = [0.22, 1, 0.36, 1] as const;

type FlowVisualProps = {
  activeBeat: number;
  progress: number;
  content: SiteCopy['flowVisual'];
  labels: SiteCopy['sceneLabels'];
};

export default function FlowVisual({ activeBeat, progress, content, labels }: FlowVisualProps) {
  const reduceMotion = useReducedMotion();
  const state = content.states[activeBeat];
  const StateIcon = stateIcons[activeBeat];
  const duration = reduceMotion ? 0 : 0.52;

  return (
    <div className="v-flow__scene" aria-label={`${labels[activeBeat]}. ${state.caption}`}>
      <MeshGradient
        className="v-flow-shader"
        colors={[...flowPalette]}
        distortion={0.76}
        swirl={0.58}
        grainMixer={0.28}
        grainOverlay={0.12}
        speed={reduceMotion ? 0 : 0.22}
        maxPixelCount={900_000}
      />
      <div className="v-flow-tint" />
      <motion.div
        className="v-flow-halo v-flow-halo--one"
        animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, scale: { duration: 5, repeat: Infinity } }}
      />
      <motion.div
        className="v-flow-halo v-flow-halo--two"
        animate={reduceMotion ? undefined : { rotate: -360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />

      <div className="v-flow-console">
        <div className="v-flow-console__bar">
          <span className="v-flow-console__brand"><SiTelegram size={15} /> Veyit console</span>
          <span className="v-flow-console__live"><i /> Live</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={activeBeat}
            className={`v-flow-state v-flow-state--${activeBeat + 1}`}
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.95, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -18, scale: 0.97, rotateX: -5 }}
            transition={{ duration, ease }}
          >
            <header className="v-flow-state__head">
              <motion.span
                className="v-flow-state__icon"
                animate={reduceMotion ? undefined : { rotate: activeBeat === 1 ? [0, -8, 8, 0] : 0 }}
                transition={{ duration: 0.65, delay: 0.15 }}
              >
                <StateIcon size={23} />
              </motion.span>
              <span><small>{state.stage}</small><strong>{state.title}</strong></span>
              <span className="v-flow-state__check"><Check size={14} /></span>
            </header>

            <div className="v-flow-state__focus">
              <div>
                <small>{state.secondary}</small>
                <strong>{state.primary}</strong>
              </div>
              <div className="v-flow-brand-pair" aria-hidden="true">
                {activeBeat === 1 ? <><span><SiBinance /></span><i /><span><SiTether /></span></> : <span><KeyRound /></span>}
              </div>
            </div>

            <div className="v-flow-fields">
              {state.fields.map((field, index) => (
                <motion.div
                  key={field.label}
                  initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.34, delay: reduceMotion ? 0 : 0.16 + index * 0.06 }}
                >
                  <span>{field.label}</span>
                  <strong><Check size={12} />{field.value}</strong>
                </motion.div>
              ))}
            </div>

            <footer className="v-flow-state__foot">
              <span>{state.caption}</span>
              <ShieldCheck size={15} />
            </footer>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="v-flow-progress" aria-label={content.progressLabel}>
        <div className="v-flow-progress__labels">
          {labels.map((label, index) => <span className={index === activeBeat ? 'is-active' : ''} key={label}>0{index + 1} {label}</span>)}
        </div>
        <span className="v-flow-progress__track"><i style={{ width: `${Math.max(5, progress * 100)}%` }} /></span>
      </div>
    </div>
  );
}
