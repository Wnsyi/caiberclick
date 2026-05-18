import { useEffect, useCallback } from 'react';
import { useGameDispatch, useGameState } from '../contexts/GameContext';
import { EXPERIENCE_CARDS } from '../data/experienceCards';
import { LOVE_CARDS } from '../data/loveCards';
import { initCloudBase, getCardCounts, incrementCardCount } from '../cloudbase';
import { HeroSection } from '../components/game/HeroSection';
import { CarouselTrack } from '../components/game/CarouselTrack';
import { GachaMachine } from '../components/game/GachaMachine';
import { LoveCardsSection } from '../components/game/LoveCardsSection';
import { FilmStrip } from '../components/game/FilmStrip';
import { useRipple } from '../hooks/useRipple';
import { useTriangleAnimation } from '../hooks/useTriangleAnimation';

export function GameHomePage() {
  const dispatch = useGameDispatch();
  const { cardReviews } = useGameState();

  useRipple('rippleCanvas');
  useTriangleAnimation();

  // Init CloudBase and sync card counts
  useEffect(() => {
    initCloudBase().then(() => {
      getCardCounts().then((counts) => {
        const allCards = [...EXPERIENCE_CARDS, ...LOVE_CARDS];
        allCards.forEach((card) => {
          const count = counts[card.id] || 0;
          dispatch({ type: 'SET_CARD_REVIEWS', cardId: card.id, reviews: count + ' 人体验过' });
        });
      });
    });
  }, [dispatch]);

  const handleSelectCard = useCallback(
    (cardId: string) => {
      incrementCardCount(cardId);
      const card = EXPERIENCE_CARDS.find((c) => c.id === cardId);
      if (card) {
        const cur = parseInt(cardReviews[cardId] ?? card.reviews) || 0;
        const next = cur + 1 + ' 人体验过';
        dispatch({ type: 'SET_CARD_REVIEWS', cardId, reviews: next });
      }
      dispatch({ type: 'SELECT_CARD', cardId });
    },
    [dispatch, cardReviews],
  );

  const handleSelectLove = useCallback(
    (cardId: string) => {
      incrementCardCount(cardId);
      dispatch({ type: 'LOVE_SELECT_CARD', cardId });
    },
    [dispatch],
  );

  return (
    <div className="page active" id="page-home">
      {/* Comp1: Hero */}
      <HeroSection />

      {/* Comp2: Gacha + Carousel */}
      <section className="comp2" id="comp2">
        <div className="comp2-upper" id="comp2Upper">
          <GachaMachine />
        </div>
        <div className="comp2-lower" id="comp2-cards">
          <div className="section-header">
            <span className="section-tag">EXPERIENCE CARDS</span>
            <h2>选择你的体验卡</h2>
            <span className="divider" />
          </div>
          <CarouselTrack onSelectCard={handleSelectCard} />
        </div>
      </section>

      {/* Comp3: Love Cards */}
      <LoveCardsSection onSelectLove={handleSelectLove} />

      {/* Comp4: Film Strip */}
      <FilmStrip />
    </div>
  );
}
