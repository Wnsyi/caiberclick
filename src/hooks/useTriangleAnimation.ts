import { useEffect, useRef } from 'react';

export function useTriangleAnimation() {
  const triAnimId = useRef<number>(0);

  useEffect(() => {
    const triA = document.getElementById('triA');
    const triB = document.getElementById('triB');
    const cardA = document.getElementById('cardA');
    const cardB = document.getElementById('cardB');
    const lower = document.getElementById('comp3Lower');

    if (!triA || !triB || !cardA || !cardB || !lower) return;

    const duration = 10000;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function clipFor(corner: string, scale: number): string {
      const m = 50 * (1 - scale);
      if (corner === 'tr') return `polygon(${m}% ${m}%, 100% 0, 100% 100%)`;
      if (corner === 'bl') return `polygon(0 0, 0 100%, ${100 - m}% ${100 - m}%)`;
      if (corner === 'tl') return `polygon(0 0, ${100 - m}% 0, 0 ${100 - m}%)`;
      if (corner === 'br') return `polygon(${m}% 100%, 100% ${m}%, 100% 100%)`;
      return '';
    }

    function originFor(corner: string): string {
      if (corner === 'tr') return '100% 0';
      if (corner === 'bl') return '0 100%';
      if (corner === 'tl') return '0 0';
      if (corner === 'br') return '100% 100%';
      return '';
    }

    function getPhase(progress: number) {
      if (progress < 0.25) return { cornerA: 'tl', cornerB: 'br', scale: 0.05 + easeInOut(progress / 0.25) * 0.95 };
      if (progress < 0.5) return { cornerA: 'tl', cornerB: 'br', scale: 1 - easeInOut((progress - 0.25) / 0.25) * 0.95 };
      if (progress < 0.75) return { cornerA: 'tr', cornerB: 'bl', scale: 0.05 + easeInOut((progress - 0.5) / 0.25) * 0.95 };
      return { cornerA: 'tr', cornerB: 'bl', scale: 1 - easeInOut((progress - 0.75) / 0.25) * 0.95 };
    }

    const triAnimStart = performance.now();

    function frame(now: number) {
      const elapsed = (now - triAnimStart) % duration;
      const progress = elapsed / duration;
      const s = getPhase(progress);

      triA!.style.clipPath = clipFor(s.cornerA, s.scale);
      triA!.style.transformOrigin = originFor(s.cornerA);
      triA!.style.transform = `scale(${s.scale})`;

      triB!.style.clipPath = clipFor(s.cornerB, s.scale);
      triB!.style.transformOrigin = originFor(s.cornerB);
      triB!.style.transform = `scale(${s.scale})`;

      const touchA =
        (s.cornerA === 'tl' && s.scale > 0.4) || (s.cornerB === 'bl' && s.scale > 0.4);
      const touchB =
        (s.cornerA === 'tr' && s.scale > 0.4) || (s.cornerB === 'br' && s.scale > 0.4);
      cardA!.style.transition = 'opacity 0.4s';
      cardB!.style.transition = 'opacity 0.4s';
      cardA!.style.opacity = touchA ? '0.12' : '1';
      cardB!.style.opacity = touchB ? '0.12' : '1';

      triAnimId.current = requestAnimationFrame(frame);
    }

    triAnimId.current = requestAnimationFrame(frame);

    return () => {
      if (triAnimId.current) cancelAnimationFrame(triAnimId.current);
    };
  }, []);
}
