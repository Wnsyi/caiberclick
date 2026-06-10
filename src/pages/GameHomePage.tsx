import { useState, useEffect, useCallback } from 'react';
import { useGameDispatch, useGameState } from '../contexts/GameContext';
import { EXPERIENCE_CARDS } from '../data/experienceCards';
import { LOVE_CARDS } from '../data/loveCards';
import { initCloudBase, getCardCounts, incrementCardCount, isAdmin, saveCard, deleteCard, loadCardEdits, type CardRecord } from '../cloudbase';
import type { BaseCard } from '../data/gameTypes';
import { HeroSection } from '../components/game/HeroSection';
import { CarouselTrack } from '../components/game/CarouselTrack';
import { GachaMachine } from '../components/game/GachaMachine';
import { LoveCardsSection } from '../components/game/LoveCardsSection';
import { FilmStrip } from '../components/game/FilmStrip';
import { EditCardModal } from '../components/game/EditCardModal';
import { useRipple } from '../hooks/useRipple';
import { useTriangleAnimation } from '../hooks/useTriangleAnimation';

function baseCardToRecord(c: BaseCard, isLove?: boolean): CardRecord {
  return { id: c.id, emoji: c.emoji, badge: c.badge, stars: c.stars, reviews: c.reviews, title: c.title, desc: c.desc, imgSrc: c.imgSrc, slideClass: c.slideClass, isLove };
}

export function GameHomePage() {
  const dispatch = useGameDispatch();
  const { cardReviews } = useGameState();

  useRipple('rippleCanvas');
  useTriangleAnimation();

  const [expCards, setExpCards] = useState<BaseCard[]>(EXPERIENCE_CARDS);
  const [loveCards, setLoveCards] = useState<BaseCard[]>(LOVE_CARDS);
  const [editCard, setEditCard] = useState<BaseCard | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const syncCounts = useCallback((exp: BaseCard[], love: BaseCard[]) => {
    getCardCounts().then((counts) => {
      [...exp, ...love].forEach((card) => {
        const count = counts[card.id] || 0;
        dispatch({ type: 'SET_CARD_REVIEWS', cardId: card.id, reviews: count + ' 人体验过' });
      });
    });
  }, [dispatch]);

  // Init CloudBase, sync counts, load card edits
  useEffect(() => {
    initCloudBase().then(async () => {
      // 加载管理员编辑过的卡片
      const expResult = await loadCardEdits(EXPERIENCE_CARDS);
      const loveResult = await loadCardEdits(LOVE_CARDS);
      setExpCards(expResult.cards);
      setLoveCards(loveResult.cards);
      // 同步所有卡片的体验人数（包括新增的）
      syncCounts(expResult.cards, loveResult.cards);
    });
  }, [dispatch, syncCounts]);

  const handleSelectCard = useCallback(
    (cardId: string) => {
      incrementCardCount(cardId);
      const card = expCards.find((c) => c.id === cardId);
      if (card) {
        const cur = parseInt(cardReviews[cardId] ?? card.reviews) || 0;
        dispatch({ type: 'SET_CARD_REVIEWS', cardId, reviews: (cur + 1) + ' 人体验过' });
      }
      dispatch({ type: 'SELECT_CARD', cardId });
    },
    [dispatch, cardReviews, expCards],
  );

  const handleSelectLove = useCallback(
    (cardId: string) => {
      incrementCardCount(cardId);
      dispatch({ type: 'LOVE_SELECT_CARD', cardId });
    },
    [dispatch],
  );

  // 管理员编辑
  const handleEditCard = useCallback((card: BaseCard) => {
    setEditCard(card);
  }, []);

  const handleSaveCard = useCallback(async (record: CardRecord) => {
    await saveCard(record);
    setEditCard(null);
    setShowAddModal(false);
    const expResult = await loadCardEdits(EXPERIENCE_CARDS);
    const loveResult = await loadCardEdits(LOVE_CARDS);
    setExpCards(expResult.cards);
    setLoveCards(loveResult.cards);
    syncCounts(expResult.cards, loveResult.cards);
  }, [syncCounts]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    await deleteCard(cardId);
    setEditCard(null);
    setShowAddModal(false);
    const expResult = await loadCardEdits(EXPERIENCE_CARDS);
    const loveResult = await loadCardEdits(LOVE_CARDS);
    setExpCards(expResult.cards);
    setLoveCards(loveResult.cards);
    syncCounts(expResult.cards, loveResult.cards);
  }, [syncCounts]);

  return (
    <div className="page active" id="page-home">
      <HeroSection />

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
          {isAdmin() && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button onClick={() => setShowAddModal(true)}
                style={{ padding: '8px 20px', border: '1px dashed #B6563A', background: '#fff', color: '#B6563A', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                + 新增体验卡
              </button>
            </div>
          )}
          <CarouselTrack onSelectCard={handleSelectCard} cards={expCards} onEditCard={handleEditCard} />
        </div>
      </section>

      <LoveCardsSection onSelectLove={handleSelectLove} cards={loveCards} onEditCard={handleEditCard} />

      <FilmStrip />

      {/* 编辑弹窗 */}
      {(editCard || showAddModal) && (
        <EditCardModal
          card={editCard ? baseCardToRecord(editCard) : undefined}
          onSave={handleSaveCard}
          onDelete={editCard ? handleDeleteCard : undefined}
          onClose={() => { setEditCard(null); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
