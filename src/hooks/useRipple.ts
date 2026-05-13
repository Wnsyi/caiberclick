import { useEffect, useRef } from 'react';

export function useRipple(canvasId: string) {
  const rippleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    let ripples: Array<{ x: number; y: number; r: number; maxR: number; op: number }> = [];

    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ripples = ripples.filter((r) => r.op > 0);
      for (const r of ripples) {
        r.r += 1.5;
        r.op -= 0.008;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(229,144,47,${r.op})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      rippleRef.current = requestAnimationFrame(animate);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 0,
        maxR: 120,
        op: 0.5,
      });
    };

    container.addEventListener('click', onClick);
    rippleRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rippleRef.current!);
      container.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
    };
  }, [canvasId]);
}
