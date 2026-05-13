import { useState, useCallback, useRef } from 'react';
import { useGameState, useGameDispatch } from '../../contexts/GameContext';
import { CAPSULE_COLORS } from '../../data/gacha';
import { MagicianHat, GachaButtons } from './MagicianHat';
import { GachaCardGrid } from './GachaCardGrid';
import { PersonalityDetailModal, GachaHintModal } from './Modals';
import { PERSONALITIES } from '../../data/personalities';
import type { PersonalityArchetype } from '../../data/gameTypes';

export function GachaMachine() {
  const { gacha } = useGameState();
  const dispatch = useGameDispatch();

  const [capsuleState, setCapsuleState] = useState<'idle' | 'dropping' | 'opening'>('idle');
  const [currentColor, setCurrentColor] = useState(CAPSULE_COLORS[0]);
  const [selectedPersonality, setSelectedPersonality] = useState<PersonalityArchetype | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isAnimating = useRef(false);

  const pullGacha = useCallback(() => {
    if (gacha.collected >= 16 || isAnimating.current) return;
    isAnimating.current = true;

    const nextOrder = [...gacha.order];
    const idx = nextOrder.shift();
    if (idx === undefined) { isAnimating.current = false; return; }

    // Trigger handle spin via class (the CSS animation handles it)
    const handle = document.getElementById('gachaHandle');
    handle?.classList.add('spinning');
    setTimeout(() => handle?.classList.remove('spinning'), 600);

    setCurrentColor(CAPSULE_COLORS[idx]);
    setCapsuleState('dropping');

    setTimeout(() => {
      setCapsuleState('opening');
    }, 600);

    setTimeout(() => {
      dispatch({ type: 'GACHA_COLLECT', slotIndex: idx });
      setCapsuleState('idle');
      isAnimating.current = false;
    }, 1200);
  }, [gacha.collected, gacha.order, dispatch]);

  const resetGacha = useCallback(() => {
    dispatch({ type: 'GACHA_INIT' });
    setCapsuleState('idle');
  }, [dispatch]);

  const openAll = useCallback(() => {
    if (gacha.collected >= 16 || isAnimating.current) return;
    dispatch({ type: 'GACHA_REVEAL_ALL' });
    setCapsuleState('idle');
  }, [gacha.collected, dispatch]);

  const handleSlotClick = useCallback((index: number) => {
    const p = PERSONALITIES[index];
    if (p) {
      setSelectedPersonality(p);
      setShowDetail(true);
    }
  }, []);

  return (
    <>
      <div className="gacha-container">
        <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
          <defs>
            <clipPath id="capeClip" clipPathUnits="objectBoundingBox">
              <path d="M 0.20 0 Q 0.125 0, 0.125 0.14 L 0 1 L 1 1 L 0.875 0.14 Q 0.875 0, 0.80 0 Z" />
            </clipPath>
            <clipPath id="bodyClip" clipPathUnits="objectBoundingBox">
              <path d="M 0.08 0 Q 0.02 0, 0.02 0.08 L 0 1 L 1 1 L 0.98 0.08 Q 0.98 0, 0.92 0 Z" />
            </clipPath>
          </defs>
        </svg>
        <div className="gacha-machine-wrapper">
          <MagicianHat
            collected={gacha.collected}
            order={gacha.order}
            capsuleVisible={capsuleState !== 'idle'}
            capsuleDropping={capsuleState === 'dropping'}
            capsuleOpening={capsuleState === 'opening'}
            currentColor={currentColor}
          />
          <GachaButtons
            disabled={gacha.collected >= 16 || isAnimating.current}
            onPull={pullGacha}
            onReset={resetGacha}
            onOpenAll={openAll}
          />
        </div>
        <div className="gacha-collection">
          <div className="gacha-collection-header">
            <span className="gacha-collection-title">COLLECTION</span>
            <span className="gacha-collection-sub" id="gachaCollectedCount">
              {gacha.collected} / 16
            </span>
          </div>
          <GachaCardGrid
            collectedFlags={gacha.collectedFlags}
            onSlotClick={handleSlotClick}
            onEmptyClick={() => setShowHint(true)}
          />
        </div>
      </div>
      <PersonalityDetailModal
        personality={selectedPersonality}
        show={showDetail}
        onClose={() => setShowDetail(false)}
      />
      <GachaHintModal
        show={showHint}
        onClose={() => setShowHint(false)}
      />
    </>
  );
}
