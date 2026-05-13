import { useState, useRef, useCallback, useEffect } from 'react';
import type { GameOption } from '../../data/gameTypes';

interface Props {
  prompt: string;
  options: GameOption[] | null;
  visible: boolean;
}

export function SystemBanner({ prompt, options, visible }: Props) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startTop: number } | null>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback((cx: number, cy: number) => {
    if (!dragRef.current) return;
    setPos({
      left: dragRef.current.startLeft + cx - dragRef.current.startX,
      top: dragRef.current.startTop + cy - dragRef.current.startY,
    });
  }, []);

  const onEnd = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  // Global mouse/touch tracking for drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => { if (dragRef.current) { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); } };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [onMove, onEnd]);

  useEffect(() => {
    if (!visible) setPos(null);
  }, [visible]);

  if (!visible || !prompt) return null;

  const style: React.CSSProperties = pos
    ? { left: pos.left, top: pos.top, right: 'auto', transform: 'none' }
    : {};

  return (
    <div
      ref={bannerRef}
      className={`system-banner${dragging ? ' dragging' : ''}`}
      style={style}
      onMouseDown={(e) => {
        const rect = bannerRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragRef.current = { startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
        setPos({ left: rect.left, top: rect.top });
        setDragging(true);
        e.preventDefault();
      }}
      onTouchStart={(e) => {
        const rect = bannerRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startLeft: rect.left, startTop: rect.top };
        setPos({ left: rect.left, top: rect.top });
        setDragging(true);
      }}
    >
      <div className="sys-label">⚡ 系统提示</div>
      <div className="sys-text">{prompt}</div>
      {(options ?? []).map((opt) => (
        <span key={opt.id} className="sys-option">
          {opt.id}. {opt.text}
        </span>
      ))}
    </div>
  );
}
