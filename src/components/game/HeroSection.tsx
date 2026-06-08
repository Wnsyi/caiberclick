import { useRef, useEffect, useCallback, useState } from 'react';
import { LIGHT_SEQUENCE, FILM_IMAGES, POS_PARAMS, TRANS_DUR, TRANS_EASE } from '../../data/gacha';
import { PERSONALITIES, PERSONALITY_CHARACTERS } from '../../data/personalities';

// 图片路径 → 人格名称 反向映射
const IMG_TO_PERSONA: Record<string, string> = {};
for (const [pid, img] of Object.entries(PERSONALITY_CHARACTERS)) {
  IMG_TO_PERSONA[img] = PERSONALITIES[Number(pid) - 1].persona;
}

// 16 个人格代表人物图片池（首页三个组件使用）
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LANDING_POS_PARAMS: Record<string, { txOffset: number; scale: number; zIndex: string }> = {
  left:   { txOffset: -0.32, scale: 0.38, zIndex: '4' },
  center: { txOffset: 0,     scale: 0.38, zIndex: '4' },
  right:  { txOffset: 0.24,  scale: 1.35, zIndex: '6' },
};

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
  const posParamsRef = useRef(POS_PARAMS);
  const centerLabelRef = useRef<HTMLDivElement>(null);  // 中间组件人格标签 DOM
  const centerImgRef = useRef('');                       // 当前中间组件显示的图片路径
  const [centerPersona, setCenterPersona] = useState(''); // React state 驱动标签文字
  const imagePool = useRef<string[]>([]);       // 16 人格图片（洗牌后）
  const poolIdx = useRef(0);                      // 当前取到第几张
  const posEls = useRef<{ left: HTMLImageElement | null; center: HTMLImageElement | null; right: HTMLImageElement | null }>({
    left: null, center: null, right: null,
  });
  const confettiParticles = useRef<Array<{
    x: number; y: number; w: number; h: number; color: string;
    vx: number; vy: number; op: number; rot: number; rotSpd: number;
  }>>([]);
  const confettiRaf = useRef<number>(0);
  const confettiRunning = useRef(false);
  const nativeRef = useRef(false);
  const bgSlideA = useRef<HTMLImageElement>(null);
  const bgSlideB = useRef<HTMLImageElement>(null);
  const bgIdx = useRef(0);
  const bgTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const s = posParamsRef.current[pos];
    const txPx = getGroupParentWidth() * s.txOffset;
    // 中间组件下移（-25% 代替 -50%）
    const yOff = pos === 'center' ? '-25%' : '-50%';
    el.style.transform = `translateX(calc(${txPx}px - 50%)) translateY(${yOff}) scale(${s.scale})`;
    el.style.zIndex = s.zIndex;
  }, [getGroupParentWidth]);

  // 根据图片路径解析人格名称
  const resolvePersona = useCallback((src: string): string => {
    const match = src.match(/(images\/[^/?#]+\.(?:jpg|jpeg|png|svg))/i);
    return match ? (IMG_TO_PERSONA[match[0]] ?? '') : '';
  }, []);

  // 定位标签 DOM（文字由 React state 驱动）
  const positionCenterLabel = useCallback(() => {
    const label = centerLabelRef.current;
    if (!label) return;
    const s = posParamsRef.current.center;
    const txPx = getGroupParentWidth() * s.txOffset;
    label.style.transform = `translateX(calc(${txPx}px - 50%)) translateY(-230px) scale(${s.scale})`;
    label.style.zIndex = '7';
  }, [getGroupParentWidth]);

  const setElTransition = useCallback((el: HTMLImageElement | null, enabled: boolean) => {
    if (!el) return;
    el.style.transition = enabled ? `transform ${TRANS_DUR} ${TRANS_EASE}` : 'none';
  }, []);

  // 取下一张人格图片（池子用完自动洗牌）
  const takeNextImage = useCallback((): string => {
    if (poolIdx.current >= imagePool.current.length) {
      imagePool.current = shuffleArray(FILM_IMAGES);
      poolIdx.current = 0;
    }
    const img = imagePool.current[poolIdx.current];
    poolIdx.current++;
    return img;
  }, []);

  const rotateGroupPositions = useCallback(() => {
    if (groupSwitching.current) return;
    groupSwitching.current = true;

    const oldLeft = posEls.current.left;
    const oldCenter = posEls.current.center;
    const oldRight = posEls.current.right;

    [oldLeft, oldCenter, oldRight].forEach((el) => { if (el) setElTransition(el, true); });
    if (centerLabelRef.current) setElTransition(centerLabelRef.current as unknown as HTMLImageElement, true);

    // 位置轮换：center → left，right → center，left → right（将取新图）
    applyPosStyle(oldCenter, 'left');
    applyPosStyle(oldRight, 'center');
    applyPosStyle(oldLeft, 'right');

    posEls.current = { left: oldCenter, center: oldRight, right: oldLeft };

    // 更新中心图片引用 + 标签文字
    const newCenterSrc = oldRight?.src ?? '';
    centerImgRef.current = newCenterSrc;
    setCenterPersona(resolvePersona(newCenterSrc));
    positionCenterLabel();

    // 新进入 right 位置的图片
    const nextImg = takeNextImage();

    setTimeout(() => {
      [oldLeft, oldCenter, oldRight].forEach((el) => { if (el) setElTransition(el, false); });
      if (centerLabelRef.current) setElTransition(centerLabelRef.current as unknown as HTMLImageElement, false);
      if (posEls.current.right) posEls.current.right.src = nextImg;
      groupSwitching.current = false;
    }, 750);
  }, [applyPosStyle, setElTransition, takeNextImage, resolvePersona, positionCenterLabel]);

  // 每 3 秒轮换一次
  const startHomeCycle = useCallback(() => {
    if (groupTimer.current) clearInterval(groupTimer.current);
    groupTimer.current = setInterval(() => {
      rotateGroupPositions();
    }, 3000);
  }, [rotateGroupPositions]);

  const startLandingCycle = useCallback(() => {
    if (groupTimer.current) clearInterval(groupTimer.current);
    let idx = 0;
    const el = slideshowRight.current;
    if (!el) return;
    el.src = FILM_IMAGES[0];
    groupTimer.current = setInterval(() => {
      idx++;
      if (idx >= FILM_IMAGES.length) idx = 0;
      if (slideshowRight.current) slideshowRight.current.src = FILM_IMAGES[idx];
    }, 350);
  }, []);

  // Initialize slideshow
  useEffect(() => {
    posParamsRef.current = landing ? LANDING_POS_PARAMS : POS_PARAMS;

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
      el.src = FILM_IMAGES[0];

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

    posEls.current = { left: leftEl, center: centerEl, right: rightEl };

    [leftEl, centerEl, rightEl].forEach((el) => {
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.right = 'auto';
      el.style.maxWidth = '82%';
      el.style.maxHeight = '66%';
      el.style.transition = 'none';
    });

    // 初始化图片池（洗牌），取前三张作为初始 left/center/right
    imagePool.current = shuffleArray(FILM_IMAGES);
    poolIdx.current = 0;

    applyPosStyle(leftEl, 'left');
    leftEl.src = takeNextImage();
    applyPosStyle(centerEl, 'center');
    centerEl.src = takeNextImage();
    applyPosStyle(rightEl, 'right');
    rightEl.src = takeNextImage();

    // 初始中心标签
    centerImgRef.current = centerEl.src;
    setCenterPersona(resolvePersona(centerEl.src));
    positionCenterLabel();

    const t = setTimeout(() => startHomeCycle(), 3000);
    return () => {
      clearTimeout(t);
      if (groupTimer.current) clearInterval(groupTimer.current);
    };
  }, [applyPosStyle, startHomeCycle, startLandingCycle, takeNextImage, resolvePersona, positionCenterLabel, landing]);

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
      const C = window.Capacitor;
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

  // Background slideshow (landing page only)
  const LANDING_BG_IMAGES = ['images/danduye1.jpg', 'images/danduye2.jpg', 'images/danduye3.jpg', 'images/danduye.4.jpg'];

  useEffect(() => {
    if (!landing) return;
    const a = bgSlideA.current;
    const b = bgSlideB.current;
    if (!a || !b) return;

    const len = LANDING_BG_IMAGES.length;
    a.style.opacity = '1';
    b.style.opacity = '0';
    a.src = LANDING_BG_IMAGES[0];
    b.src = LANDING_BG_IMAGES[1];
    bgIdx.current = 0;

    bgTimer.current = setInterval(() => {
      const next = (bgIdx.current + 1) % len;
      // hidden image gets the upcoming src, then we crossfade
      if (a.style.opacity === '1') {
        b.src = LANDING_BG_IMAGES[next];
        a.style.opacity = '0';
        b.style.opacity = '1';
      } else {
        a.src = LANDING_BG_IMAGES[next];
        a.style.opacity = '1';
        b.style.opacity = '0';
      }
      bgIdx.current = next;
    }, 4000);

    return () => {
      if (bgTimer.current) clearInterval(bgTimer.current);
    };
  }, [landing]);

  // Init light show
  useEffect(() => {
    lightSeq.current = landing ? LANDING_LIGHT_SEQUENCE : LIGHT_SEQUENCE;
    if (lightTimer.current) clearTimeout(lightTimer.current);
    runLightField(0);
    return () => { if (lightTimer.current) clearTimeout(lightTimer.current); };
  }, [landing, runLightField]);

  return (
    <section className="comp1" id="comp1">
      {!landing && (
        <img
          className="comp1-bg"
          src="images/shouye.jpeg"
          alt="Hero Background"
        />
      )}
      {landing && (
        <>
          <img className="comp1-bg-slide" ref={bgSlideA} alt="" />
          <img className="comp1-bg-slide" ref={bgSlideB} alt="" />
        </>
      )}
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
          <img
            className="comp1-slideshow-right"
            id="comp1SlideshowRight"
            ref={slideshowRight}
            alt="Slideshow Right"
            style={{ position: 'absolute' }}
          />
          <div
            ref={centerLabelRef}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              fontFamily: "'Ma Shan Zheng', 'KaiTi', 'STKaiti', cursive",
              fontSize: '1.4rem',
              color: '#5D4E37',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              textShadow: '1px 1px 2px rgba(255,255,240,0.8)',
              letterSpacing: '0.05em',
              transition: `transform ${TRANS_DUR} ${TRANS_EASE}`,
            }}
          >
            {centerPersona ? centerPersona + ' 代表人物' : ''}
          </div>
        </>
      )}
      {landing && (
        <div className="comp1-frost-card">
          <h2 className="comp1-frost-title">开药吗</h2>
          <p>这是一个结合了二次元的心理诊疗所。我们通过沉静式体验，根据你的选择来判断你的人格。根据每个人格，我们都会开出不一样的处方哦！快来试试吧！对了，每个人格都有一个代表人物哦，点击人格介绍，看看有没有你喜欢的角色吧！</p>
          <button className="comp1-frost-btn" onClick={() => {
            if (onCtaClick) { onCtaClick(); return; }
            document.getElementById('comp2-cards')?.scrollIntoView({ behavior: 'smooth' });
          }}>立即体验 →</button>
          <a
            className="comp1-frost-btn comp1-frost-android"
            href="downloads/app-debug.apk"
            download
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            🤖 Android 下载
          </a>
        </div>
      )}
      <div className="comp1-overlay" />


    </section>
  );
}
