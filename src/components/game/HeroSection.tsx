import { useRef, useEffect, useCallback } from 'react';
import { LIGHT_SEQUENCE, GROUP_PERSONS, POS_PARAMS, TRANS_DUR, TRANS_EASE } from '../../data/gacha';

const ALL_IMAGES = GROUP_PERSONS.flatMap((p) => p.images);

const LANDING_LIGHT_SEQUENCE = [
  { d: 1800, c: 'purple', l: null,    r: 'orange' },
  { d: 1800, c: 'orange', l: null,    r: 'purple' },
  { d: 1800, c: 'green',  l: null,    r: 'orange' },
  { d: 1800, c: 'orange', l: null,    r: 'green' },
  { d: 1800, c: 'green',  l: null,    r: 'purple' },
  { d: 1800, c: 'purple', l: null,    r: 'green' },
];

export function HeroSection({ onCtaClick, landing }: { onCtaClick?: () => void; landing?: boolean }) {
  const beamCenter = useRef<HTMLDivElement>(null);
  const beamLeft = useRef<HTMLDivElement>(null);
  const beamRight = useRef<HTMLDivElement>(null);
  const slideshowCenter = useRef<HTMLImageElement>(null);
  const slideshowLeft = useRef<HTMLImageElement>(null);
  const slideshowRight = useRef<HTMLImageElement>(null);
  const confettiCanvas = useRef<HTMLCanvasElement>(null);
  const lightField = useRef(0);
  const lightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lightSeq = useRef(LIGHT_SEQUENCE);
  const groupSwitching = useRef(false);
  const groupTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const groupRightIdx = useRef(0);
  const posEls = useRef<{ left: HTMLImageElement | null; center: HTMLImageElement | null; right: HTMLImageElement | null }>({
    left: null, center: null, right: null,
  });
  const elPerson = useRef<Map<HTMLImageElement, number>>(new Map());
  const confettiParticles = useRef<Array<{
    x: number; y: number; w: number; h: number; color: string;
    vx: number; vy: number; op: number; rot: number; rotSpd: number;
  }>>([]);
  const confettiRaf = useRef<number>(0);
  const confettiRunning = useRef(false);
  const nativeRef = useRef(false);

  // Light show
  const setBeam = useCallback((el: HTMLDivElement | null, color: string | null) => {
    if (!el) return;
    const pos = el.classList.contains('beam-left') ? 'beam-left'
      : el.classList.contains('beam-center') ? 'beam-center'
      : el.classList.contains('beam-right') ? 'beam-right' : '';
    el.className = `beam ${pos}`;
    el.style.opacity = '0';
    if (color) {
      el.classList.add(`beam-${color}`);
      el.style.opacity = '1';
    }
  }, []);

  const runLightField = useCallback((i: number) => {
    const seq = lightSeq.current;
    const f = seq[i];
    setBeam(beamCenter.current, f.c);
    setBeam(beamLeft.current, f.l);
    setBeam(beamRight.current, f.r);
    lightField.current = (i + 1) % seq.length;
    lightTimer.current = setTimeout(() => runLightField(lightField.current), f.d);
  }, [setBeam]);

  // Slideshow
  const getGroupParentWidth = useCallback(() => {
    const el = posEls.current.center || posEls.current.left || posEls.current.right;
    return el?.parentElement?.offsetWidth ?? window.innerWidth;
  }, []);

  const applyPosStyle = useCallback((el: HTMLImageElement | null, pos: 'left' | 'center' | 'right') => {
    if (!el) return;
    const s = POS_PARAMS[pos];
    const txPx = getGroupParentWidth() * s.txOffset;
    el.style.transform = `translateX(calc(${txPx}px - 50%)) translateY(-50%) scale(${s.scale})`;
    el.style.zIndex = s.zIndex;
  }, [getGroupParentWidth]);

  const setElTransition = useCallback((el: HTMLImageElement | null, enabled: boolean) => {
    if (!el) return;
    el.style.transition = enabled ? `transform ${TRANS_DUR} ${TRANS_EASE}` : 'none';
  }, []);

  const rotateGroupPositions = useCallback(() => {
    if (groupSwitching.current) return;
    groupSwitching.current = true;
    if (groupTimer.current) { clearInterval(groupTimer.current); groupTimer.current = null; }

    const oldLeft = posEls.current.left;
    const oldCenter = posEls.current.center;
    const oldRight = posEls.current.right;

    [oldLeft, oldCenter, oldRight].forEach((el) => { if (el) setElTransition(el, true); });

    applyPosStyle(oldCenter, 'left');
    applyPosStyle(oldRight, 'center');
    applyPosStyle(oldLeft, 'right');

    posEls.current = { left: oldCenter, center: oldRight, right: oldLeft };

    setTimeout(() => {
      [oldLeft, oldCenter, oldRight].forEach((el) => { if (el) setElTransition(el, false); });
      if (posEls.current.left) posEls.current.left.src = GROUP_PERSONS[elPerson.current.get(posEls.current.left)!].images[0];
      if (posEls.current.center) posEls.current.center.src = GROUP_PERSONS[elPerson.current.get(posEls.current.center)!].images[0];
      groupRightIdx.current = 0;
      groupSwitching.current = false;
      startRightCycle();
    }, 750);
  }, [applyPosStyle, setElTransition]);

  const startRightCycle = useCallback(() => {
    if (groupTimer.current) clearInterval(groupTimer.current);
    groupRightIdx.current = 0;
    const rightEl = posEls.current.right;
    if (!rightEl) return;
    const personIdx = elPerson.current.get(rightEl);
    if (personIdx === undefined) return;
    const images = GROUP_PERSONS[personIdx].images;
    rightEl.src = images[0];
    groupTimer.current = setInterval(() => {
      if (groupSwitching.current) return;
      groupRightIdx.current++;
      if (groupRightIdx.current >= images.length) {
        clearInterval(groupTimer.current!);
        groupTimer.current = null;
        rotateGroupPositions();
        return;
      }
      if (posEls.current.right) posEls.current.right.src = images[groupRightIdx.current];
    }, 300);
  }, [rotateGroupPositions]);

  const startLandingCycle = useCallback(() => {
    if (groupTimer.current) clearInterval(groupTimer.current);
    let idx = 0;
    const el = slideshowRight.current;
    if (!el) return;
    el.src = ALL_IMAGES[0];
    groupTimer.current = setInterval(() => {
      idx++;
      if (idx >= ALL_IMAGES.length) idx = 0;
      if (slideshowRight.current) slideshowRight.current.src = ALL_IMAGES[idx];
    }, 350);
  }, []);

  // Initialize slideshow
  useEffect(() => {
    if (landing) {
      const el = slideshowRight.current;
      if (!el) return;
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.right = 'auto';
      el.style.maxWidth = '82%';
      el.style.maxHeight = '66%';
      el.style.transition = 'none';
      applyPosStyle(el, 'right');
      el.src = ALL_IMAGES[0];

      const t = setTimeout(() => startLandingCycle(), 800);
      return () => {
        clearTimeout(t);
        if (groupTimer.current) clearInterval(groupTimer.current);
      };
    }

    const leftEl = slideshowLeft.current;
    const centerEl = slideshowCenter.current;
    const rightEl = slideshowRight.current;
    if (!leftEl || !centerEl || !rightEl) return;

    elPerson.current.set(leftEl, 1);
    elPerson.current.set(centerEl, 0);
    elPerson.current.set(rightEl, 2);
    posEls.current = { left: leftEl, center: centerEl, right: rightEl };

    [leftEl, centerEl, rightEl].forEach((el) => {
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.right = 'auto';
      el.style.maxWidth = '82%';
      el.style.maxHeight = '66%';
      el.style.transition = 'none';
    });

    applyPosStyle(leftEl, 'left');
    leftEl.src = GROUP_PERSONS[1].images[0];
    applyPosStyle(centerEl, 'center');
    centerEl.src = GROUP_PERSONS[0].images[0];
    applyPosStyle(rightEl, 'right');
    rightEl.src = GROUP_PERSONS[2].images[0];

    const t = setTimeout(() => startRightCycle(), 1200);
    return () => {
      clearTimeout(t);
      if (groupTimer.current) clearInterval(groupTimer.current);
    };
  }, [applyPosStyle, startRightCycle, startLandingCycle, landing]);

  // Confetti
  const CONFETTI_COLORS = ['#E5902F', '#F5A623', '#E07060', '#7C3AED', '#5B8CDE', '#0D9488', '#00A86B', '#FF6B9D', '#FFD93D', '#C084FC'];

  useEffect(() => {
    const canvas = confettiCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawn = () => {
      const w = canvas.width;
      for (let i = 0; i < 3; i++) {
        confettiParticles.current.push({
          x: Math.random() * w * 1.2 - w * 0.1,
          y: -20 - Math.random() * 100,
          w: 6 + Math.random() * 10,
          h: 3 + Math.random() * 6,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          vx: (Math.random() - 0.5) * 1.5,
          vy: 1.5 + Math.random() * 3,
          rot: Math.random() * Math.PI * 2,
          rotSpd: (Math.random() - 0.5) * 0.08,
          op: 0.7 + Math.random() * 0.3,
        });
      }
    };

    const animate = () => {
      if (!confettiRunning.current) {
        confettiRaf.current = requestAnimationFrame(animate);
        return;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      confettiParticles.current = confettiParticles.current.filter((p) => p.y < h + 20 && p.op > 0);
      for (const p of confettiParticles.current) {
        p.x += p.vx + Math.sin(p.y * 0.02) * 0.5;
        p.y += p.vy;
        p.rot += p.rotSpd;
        ctx.save();
        ctx.globalAlpha = p.op;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (confettiParticles.current.length < 60) spawn();
      confettiRaf.current = requestAnimationFrame(animate);
    };

    confettiRunning.current = true;
    confettiRaf.current = requestAnimationFrame(animate);

    return () => {
      confettiRunning.current = false;
      if (confettiRaf.current) cancelAnimationFrame(confettiRaf.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Detect Capacitor native platform (via DOM manipulation, no state/re-render)
  useEffect(() => {
    const hideBtn = () => {
      const btn = document.querySelector('.comp1-frost-android') as HTMLElement | null;
      if (btn) btn.style.display = 'none';
    };

    const checkNative = () => {
      const C = (window as any).Capacitor;
      if (!C) return false;
      // Capacitor 3+ uses isNativePlatform() method
      if (typeof C.isNativePlatform === 'function' && C.isNativePlatform()) return true;
      // Capacitor 2.x uses isNative property (kept for safety)
      if (C.isNative === true) return true;
      // getPlatform returns 'android'/'ios' when native, 'web' otherwise
      if (typeof C.getPlatform === 'function') {
        const p = C.getPlatform();
        if (p === 'android' || p === 'ios') return true;
      }
      return false;
    };

    if (checkNative()) {
      nativeRef.current = true;
      hideBtn();
      return;
    }

    // Retry: Capacitor bridge may inject asynchronously on slow devices
    const retry = setTimeout(() => {
      if (checkNative()) {
        nativeRef.current = true;
        hideBtn();
      }
    }, 600);

    return () => clearTimeout(retry);
  }, []);

  // Init light show
  useEffect(() => {
    lightSeq.current = landing ? LANDING_LIGHT_SEQUENCE : LIGHT_SEQUENCE;
    if (lightTimer.current) clearTimeout(lightTimer.current);
    runLightField(0);
    return () => { if (lightTimer.current) clearTimeout(lightTimer.current); };
  }, [landing, runLightField]);

  return (
    <section className="comp1" id="comp1">
      <img
        className="comp1-bg"
        src="https://placehold.co/1600x900/E5902F/FDF8EE?text=+"
        alt="Hero Background"
      />
      <div className="comp1-image-sub" />
      <div className="comp1-lights" id="comp1Lights">
        <div className="beam beam-left" ref={beamLeft} />
        <div className="beam beam-center" ref={beamCenter} />
        <div className="beam beam-right" ref={beamRight} />
      </div>
      {!landing && (
        <>
          <img
            className="comp1-slideshow-left"
            id="comp1SlideshowLeft"
            ref={slideshowLeft}
            alt="Slideshow Left"
            style={{ position: 'absolute' }}
          />
          <img
            className="comp1-slideshow"
            id="comp1Slideshow"
            ref={slideshowCenter}
            alt="Slideshow"
            style={{ position: 'absolute' }}
          />
        </>
      )}
      <img
        className="comp1-slideshow-right"
        id="comp1SlideshowRight"
        ref={slideshowRight}
        alt="Slideshow Right"
        style={{ position: 'absolute' }}
      />
      {landing && (
        <div className="comp1-frost-card">
          <h2 className="comp1-frost-title">开药吗</h2>
          <p>这是一个结合了二次元的心理诊疗所。我们通过沉静式体验，根据你的选择来判断你的人格。根据每个人格，我们都会开出不一样的处方哦！快来试试吧！对了，每个人格都有一个代表人物哦，点击人格介绍，看看有没有你喜欢的角色吧！</p>
          <button className="comp1-frost-btn" onClick={() => {
            if (onCtaClick) { onCtaClick(); return; }
            document.getElementById('comp2-cards')?.scrollIntoView({ behavior: 'smooth' });
          }}>立即体验 →</button>
          <button className="comp1-frost-btn comp1-frost-android" onClick={() => {
            window.open('downloads/app-debug.apk', '_blank');
          }}>
            🤖 Android 下载
          </button>
        </div>
      )}
      <div className="comp1-overlay" />
      <canvas className="comp1-confetti" ref={confettiCanvas} />
    </section>
  );
}
