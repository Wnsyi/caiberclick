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
  const carouselRaf = useRef<number>();
  const carouselPaused = useRef(false);
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
