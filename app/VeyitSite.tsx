'use client';

import {
  ArrowRight,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  Gamepad2,
  Gift,
  KeyRound,
  LockKeyhole,
  Menu,
  Moon,
  Send,
  ShieldCheck,
  Sun,
  WalletCards,
  X,
} from 'lucide-react';
import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  SiBinance,
  SiGoogleplay,
  SiPlaystation,
  SiSteam,
  SiTelegram,
  SiTether,
} from 'react-icons/si';
import { ThreePanel } from '../scene/ThreePanel';
import { useSceneProgress } from '../scene/useSceneProgress';
import { SiteCopy } from './copy';
import { VerifiedBadge } from './VerifiedBadge';

const iconSet = [SiTelegram, SiBinance, SiTether, SiSteam, SiPlaystation, SiGoogleplay];
const catalogueIcons = [Gamepad2, Gift, KeyRound, Boxes];

type Theme = 'light' | 'dark';
type StyleVars = CSSProperties & Record<'--scroll-progress' | '--pointer-x' | '--pointer-y', number>;
type HeroStyle = CSSProperties & Record<'--hero-progress', number>;

export default function VeyitSite({ text }: { text: SiteCopy }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [menuOpen, setMenuOpen] = useState(false);
  const [pageProgress, setPageProgress] = useState(0);
  const [heroProgress, setHeroProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const flowRef = useRef<HTMLElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const flowProgress = useSceneProgress(flowRef);
  const activeBeat = Math.min(2, Math.floor(flowProgress * 3));

  const stageStyle = useMemo<StyleVars>(() => ({
    '--scroll-progress': pageProgress,
    '--pointer-x': pointer.x,
    '--pointer-y': pointer.y,
  }), [pageProgress, pointer]);

  useEffect(() => {
    const saved = window.localStorage.getItem('veyit-theme') as Theme | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initial = saved === 'dark' || saved === 'light' ? saved : preferred;
    document.documentElement.dataset.theme = initial;
    const frame = window.requestAnimationFrame(() => setTheme(initial));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setPageProgress(Math.min(1, Math.max(0, window.scrollY / total)));
      setHeroProgress(Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight * 0.88))));
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let previousDpr = window.devicePixelRatio;
    let animation: Animation | null = null;

    const handleViewportZoom = () => {
      const nextDpr = window.devicePixelRatio;
      if (Math.abs(nextDpr - previousDpr) < 0.02) return;
      const isZoomingIn = nextDpr > previousDpr;
      previousDpr = nextDpr;
      animation?.cancel();
      animation = heroTitleRef.current?.animate([
        { transform: 'perspective(1100px) translateZ(0) scale(1)', letterSpacing: '-0.073em', opacity: 1, filter: 'blur(0px)' },
        isZoomingIn
          ? { transform: 'perspective(1100px) translateZ(150px) scale(1.05)', letterSpacing: '-0.125em', opacity: 0.62, filter: 'blur(1.5px)' }
          : { transform: 'perspective(1100px) translateZ(-430px) scale(0.72)', letterSpacing: '-0.14em', opacity: 0.38, filter: 'blur(3px)' },
        { transform: 'perspective(1100px) translateZ(0) scale(1)', letterSpacing: '-0.073em', opacity: 1, filter: 'blur(0px)' },
      ], { duration: 780, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }) ?? null;
    };

    window.addEventListener('resize', handleViewportZoom, { passive: true });
    window.visualViewport?.addEventListener('resize', handleViewportZoom, { passive: true });
    return () => {
      animation?.cancel();
      window.removeEventListener('resize', handleViewportZoom);
      window.visualViewport?.removeEventListener('resize', handleViewportZoom);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('veyit-theme', next);
  };

  const handleHeroPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    });
  };

  return (
    <main className="v-site" id="top">
      <a className="v-skip" href="#content">{text.skip}</a>
      <header className="v-header">
        <a className="v-brand" href="#top" aria-label={text.homeLabel}>
          <span className="v-brand__mark"><span /></span>
          <span>Veyit</span>
        </a>

        <nav className="v-nav" aria-label={text.primaryNavigation}>
          {text.nav.map((item, index) => (
            <a key={item} href={['#top', '#suppliers', '#how', '#pricing', '#about'][index]}>{item}</a>
          ))}
        </nav>

        <div className="v-header__actions">
          <button className="v-icon-button" onClick={toggleTheme} aria-label={text.theme} type="button">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <a className="v-header-cta" href="#start">{text.openStore}<ArrowRight size={14} /></a>
          <button className="v-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={text.menu} aria-expanded={menuOpen} type="button">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className={`v-mobile-menu ${menuOpen ? 'is-open' : ''}`}>
          {text.nav.map((item, index) => (
            <a onClick={() => setMenuOpen(false)} key={item} href={['#top', '#suppliers', '#how', '#pricing', '#about'][index]}>{item}</a>
          ))}
          <a onClick={() => setMenuOpen(false)} href="#start">{text.openStore}</a>
        </div>
      </header>

      <div id="content">
        <section className="v-hero" style={{ '--hero-progress': heroProgress } as HeroStyle}>
          <div className="v-hero__glow" />
          <div className="v-hero__copy">
            <p className="v-kicker v-kicker--blue"><span />{text.eyebrow}</p>
            <h1 ref={heroTitleRef}>{text.heroTitle}</h1>
            <p className="v-hero__deck">{text.heroBody}</p>
            <div className="v-actions">
              <a className="v-button v-button--primary" href="#pricing">{text.primaryCta}<ArrowRight size={16} /></a>
              <a className="v-button v-button--ghost" href="#how">{text.secondaryCta}<ChevronDown size={16} /></a>
            </div>
            <p className="v-activation">{text.activation}</p>
          </div>

          <div
            className="v-hero-stage"
            aria-hidden="true"
            ref={heroStageRef}
            onPointerMove={handleHeroPointer}
            onPointerLeave={() => setPointer({ x: 0, y: 0 })}
            style={stageStyle}
          >
            <div className="v-stage-glow v-stage-glow--blue" />
            <div className="v-stage-glow v-stage-glow--violet" />
            <div className="v-orbit v-orbit--outer" />
            <div className="v-orbit v-orbit--middle" />
            <div className="v-orbit v-orbit--inner" />
            <div className="v-center-card">
              <span className="v-center-card__signal"><Send size={14} />{text.order}</span>
              <strong>{text.matched}</strong>
              <span className="v-center-card__meta">{text.matchMeta}</span>
              <span className="v-delivered"><Check size={12} />{text.delivered}</span>
            </div>
            {text.orbitLabels.map((label, index) => {
              const Icon = iconSet[index];
              return (
                <div className={`v-orbit-item v-orbit-item--${index + 1}`} key={label}>
                  <span className={`v-brand-icon v-brand-icon--${index + 1}`}><Icon size={21} /></span>
                  <small>{label}</small>
                </div>
              );
            })}
            <div className="v-cursor-tail"><ArrowRight size={17} /></div>
          </div>

          <div className="v-proof">
            {text.promises.map((promise, index) => <span key={promise}>0{index + 1} / {promise}</span>)}
          </div>
        </section>

        <section className="v-flow" id="how" ref={flowRef} aria-label={text.sectionAria}>
          <div className="v-flow__sticky">
            <div className="v-flow__copy" data-reveal>
              <p className="v-kicker v-kicker--on-dark">{text.flowKicker}</p>
              <h2>{text.flowTitle}</h2>
              <p>{text.flowBody}</p>
              <div className="v-beat-list">
                {text.beats.map((beat, index) => (
                  <article className={`v-beat ${activeBeat === index ? 'is-active' : ''}`} key={beat.number}>
                    <span>{beat.number}</span>
                    <div><h3>{beat.title}</h3><p>{beat.body}</p></div>
                  </article>
                ))}
              </div>
            </div>

            <div className="v-flow__scene">
              <div className="v-scene-grid" />
              <div className="v-static-flow" aria-hidden="true">
                <div className="v-static-order"><span /><i /><i /><i /></div>
                <div className={`v-static-rings v-static-rings--${activeBeat}`}><span /><span /><span /></div>
                <div className={`v-static-key ${activeBeat === 2 ? 'is-delivered' : ''}`}><KeyRound size={29} /></div>
              </div>
              <ThreePanel progress={flowProgress} />
              <div className="v-scene-status">
                <span>0{activeBeat + 1}</span>
                <strong>{text.sceneLabels[activeBeat]}</strong>
                <i style={{ width: `${Math.max(8, flowProgress * 100)}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="v-trust" id="about">
          <div className="v-section-head" data-reveal>
            <p className="v-kicker v-kicker--blue">{text.trustKicker}</p>
            <h2>{text.trustTitle}</h2>
            <p>{text.trustBody}</p>
          </div>
          <div className="v-trust-grid">
            {text.trustCards.map((card, index) => {
              const Icon = [WalletCards, ShieldCheck, LockKeyhole][index];
              return (
                <article className="v-trust-card" data-reveal key={card.index}>
                  <div className="v-trust-card__top"><span>{card.index}</span><Icon size={22} /></div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <div className={`v-trust-art v-trust-art--${index + 1}`} aria-hidden="true"><span /><span /><span /></div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="v-catalogue">
          <div className="v-section-head v-section-head--light" data-reveal>
            <p className="v-kicker v-kicker--blue">{text.catalogueKicker}</p>
            <h2>{text.catalogueTitle}</h2>
          </div>
          <div className="v-catalogue-grid">
            {text.catalogue.map((item, index) => {
              const Icon = catalogueIcons[index];
              return (
                <article className="v-product-card" data-reveal key={item.title}>
                  <div className="v-product-card__top"><Icon size={20} /><span>0{index + 1}</span></div>
                  <div className="v-product-object" aria-hidden="true"><span>{item.mark}</span><i /></div>
                  <p>{item.tag}</p>
                  <h3>{item.title}</h3>
                </article>
              );
            })}
          </div>
        </section>

        <section className="v-network" id="suppliers">
          <div className="v-network__copy" data-reveal>
            <p className="v-kicker v-kicker--blue">{text.networkKicker}</p>
            <h2>{text.networkTitle}</h2>
            <p>{text.networkBody}</p>
            <ul>
              {text.networkPoints.map((point) => <li key={point}><Check size={15} />{point}</li>)}
            </ul>
            <a className="v-text-cta" href="#badge">{text.badgeCta}<ArrowRight size={16} /></a>
          </div>

          <div className="v-profile-wrap" data-reveal id="badge">
            <span className="v-profile-orbit v-profile-orbit--one" />
            <span className="v-profile-orbit v-profile-orbit--two" />
            <article className="v-profile-card">
              <div className="v-profile-card__header">
                <div className="v-profile-logo"><Bot size={25} /></div>
                <div><span>{text.profileLabel}</span><small>veyit.com/suppliers/your-store</small></div>
              </div>
              <VerifiedBadge label={text.badgeDate} detail={text.badgeGranted} />
              <p>{text.profileBody}</p>
              <div className="v-profile-services"><span>Game top-ups</span><span>Gift cards</span><span>Keys</span></div>
              <div className="v-profile-stats"><span><small>Orders</small><strong>Activity band</strong></span><span><small>Reliability</small><strong>Published band</strong></span></div>
            </article>
          </div>
        </section>

        <section className="v-pricing" id="pricing">
          <div className="v-section-head v-section-head--light" data-reveal>
            <p className="v-kicker v-kicker--blue">{text.pricingKicker}</p>
            <h2>{text.pricingTitle}</h2>
          </div>
          <div className="v-price-grid">
            <article className="v-price-card v-price-card--featured" data-reveal>
              <div className="v-price-card__head"><span>{text.starter}</span><Bot size={20} /></div>
              <div className="v-price"><strong>$4.99</strong><span>{text.perMonth}</span></div>
              <p>{text.starterBody}</p>
              <ul>{text.limits.map((limit) => <li key={limit}><Check size={15} />{limit}</li>)}</ul>
              <a className="v-button v-button--light" href="#start">{text.priceCta}<ArrowRight size={16} /></a>
              <small className="v-price-note">{text.activation}</small>
            </article>
            <article className="v-price-card" data-reveal>
              <div className="v-price-card__head"><span>{text.business}</span><Boxes size={20} /></div>
              <div className="v-business-price">{text.businessPrice}</div>
              <p>{text.businessBody}</p>
              <a className="v-button v-button--outline" href="#start">{text.businessCta}<ArrowRight size={16} /></a>
              <div className="v-data-promise"><ShieldCheck size={18} /><span>{text.expiry}</span></div>
            </article>
          </div>
        </section>

        <section className="v-closing" id="start">
          <div className="v-closing__orb v-closing__orb--one" />
          <div className="v-closing__orb v-closing__orb--two" />
          <div className="v-closing__content" data-reveal>
            <p className="v-kicker v-kicker--on-dark">{text.closeKicker}</p>
            <h2>{text.closeTitle}</h2>
            <p>{text.closeBody}</p>
            <a className="v-button v-button--light" href="#pricing">{text.primaryCta}<ArrowRight size={16} /></a>
            <small>{text.activation}</small>
          </div>
        </section>
      </div>

      <footer className="v-footer">
        <div><a className="v-brand" href="#top"><span className="v-brand__mark"><span /></span><span>Veyit</span></a><p>{text.footerLine}</p></div>
        <div><strong>{text.nav[1]}</strong><a href="#suppliers">{text.networkKicker}</a><a href="#badge">{text.badgeCta}</a></div>
        <div><strong>{text.nav[2]}</strong><a href="#how">{text.beats[0].title}</a><a href="#how">{text.beats[1].title}</a><a href="#how">{text.beats[2].title}</a></div>
        <p className="v-footer__legal">{text.legalNote}</p>
      </footer>
    </main>
  );
}
