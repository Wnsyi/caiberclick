import { useRef, useEffect, useCallback } from 'react';
import { EXPERIENCE_CARDS } from '../../data/experienceCards';
import { CarouselCard } from './CarouselCard';

interface Props {
  onSelectCard: (cardId: string) => void;
}

export function CarouselTrack({ onSelectCard }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const carouselPos = useRef(0);
  const carouselRaf = useRef<number>(0);
  const carouselPaused = useRef(false);
  const touchStart = useRef<{ x: number; y: number; pos: number } | null>(null);
  const CAROUSEL_SPEED = 0.06; // px/ms
  const n = EXPERIENCE_CARDS.length;

  useEffect(() => {
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    const onEnter = () => { carouselPaused.current = true; };
    const onLeave = () => { carouselPaused.current = false; };
    wrapper.addEventListener('mouseenter', onEnter);
    wrapper.addEventListener('mouseleave', onLeave);

    // Touch swipe support
    const onTouchStart = (e: TouchEvent) => {
      carouselPaused.current = true;
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, pos: carouselPos.current };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const dx = touchStart.current.x - e.touches[0].clientX;
      const dy = touchStart.current.y - e.touches[0].clientY;
      if (Math.abs(dx) > Math.abs(dy)) {
        carouselPos.current = touchStart.current.pos + dx;
        e.preventDefault();
      }
    };
    const onTouchEnd = () => {
      touchStart.current = null;
      carouselPaused.current = false;
    };
    wrapper.addEventListener('touchstart', onTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false });
    wrapper.addEventListener('touchend', onTouchEnd);

    let lastTime = 0;
    const slides = track.querySelectorAll('.carousel-slide');

    function step(now: number) {
      if (!lastTime) lastTime = now;
      const dt = Math.min(now - lastTime, 120);
      lastTime = now;

      if (!carouselPaused.current && slides.length > 0) {
        carouselPos.current += CAROUSEL_SPEED * dt;
        const slideW = (slides[0] as HTMLElement).offsetWidth;
        const gap = 20;
        const cardW = slideW + gap;
        const tw = n * cardW;
        const wrapper = wrapperRef.current;
      if (!wrapper) return;
        const vw = wrapper.offsetWidth;

        slides.forEach((slide, i) => {
          let x = i * cardW - carouselPos.current;
          while (x < -cardW) x += tw;
          while (x > vw + cardW) x -= tw;
          (slide as HTMLElement).style.left = x + 'px';
        });

        const effectivePos = ((carouselPos.current % tw) + tw) % tw;
        const activeIdx = Math.floor((effectivePos + cardW / 2) / cardW) % n;

        const dots = dotsRef.current?.querySelectorAll('.dot');
        dots?.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
      }
      carouselRaf.current = requestAnimationFrame(step);
    }

    carouselRaf.current = requestAnimationFrame(step);

    return () => {
      if (carouselRaf.current) cancelAnimationFrame(carouselRaf.current);
      wrapper.removeEventListener('mouseenter', onEnter);
      wrapper.removeEventListener('mouseleave', onLeave);
      wrapper.removeEventListener('touchstart', onTouchStart);
      wrapper.removeEventListener('touchmove', onTouchMove);
      wrapper.removeEventListener('touchend', onTouchEnd);
    };
  }, [n]);

  const snap = useCallback((delta: number) => {
    const track = trackRef.current;
    const wrapper = wrapperRef.current;
    if (!track || !wrapper) return;

    const slides = track.querySelectorAll('.carousel-slide');
    if (!slides.length) return;
    const slideW = (slides[0] as HTMLElement).offsetWidth;
    const gap = 20;
    const cardW = slideW + gap;
    const tw = n * cardW;
    const vw = wrapper.offsetWidth;

    carouselPos.current += delta * cardW;
    slides.forEach((slide, i) => {
      let x = i * cardW - carouselPos.current;
      while (x < -cardW) x += tw;
      while (x > vw + cardW) x -= tw;
      (slide as HTMLElement).style.left = x + 'px';
    });

    const effectivePos = ((carouselPos.current % tw) + tw) % tw;
    const activeIdx = Math.floor((effectivePos + cardW / 2) / cardW) % n;
    dotsRef.current?.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === activeIdx));
  }, [n]);

  return (
    <div className="carousel-wrapper" ref={wrapperRef} id="carouselWrapper">
      <div className="carousel-track" ref={trackRef} id="carouselTrack">
        {EXPERIENCE_CARDS.map((card, i) => (
          <div
            key={card.id}
            className={`carousel-slide ${card.slideClass}`}
            data-index={i}
            style={{ left: '0px' }}
            onClick={() => onSelectCard(card.id)}
          >
            <CarouselCard card={card} onSelect={onSelectCard} />
          </div>
        ))}
      </div>
      <button className="carousel-arrow carousel-arrow-left" onClick={() => snap(-1)} aria-label="上一张">
        ◂
      </button>
      <button className="carousel-arrow carousel-arrow-right" onClick={() => snap(1)} aria-label="下一张">
        ▸
      </button>
      <div className="carousel-dots" ref={dotsRef} id="carouselDots">
        {EXPERIENCE_CARDS.map((_, i) => (
          <span key={i} className={`dot${i === 0 ? ' active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
