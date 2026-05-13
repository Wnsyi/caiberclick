import { useState, useEffect, useCallback } from 'react';
import { useGameState, useGameDispatch } from '../contexts/GameContext';
import { PrescriptionCard, getFallbackResult } from '../components/game/PrescriptionCard';
import { PERSONALITIES } from '../data/personalities';
import { saveConsultation, savePrescription } from '../cloudbase';
import type { PersonalityArchetype } from '../data/gameTypes';

export function GameResultPage() {
  const { game } = useGameState();
  const dispatch = useGameDispatch();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PersonalityArchetype | null>(null);
  const [personalityId, setPersonalityId] = useState<number | undefined>();

  useEffect(() => {
    setLoading(true);
    // Simulate loading delay
    const timer = setTimeout(() => {
      const card = game.currentCard;
      if (!card) {
        setLoading(false);
        return;
      }
      const pathKey = game.choicePath.join('-');
      const raw = card.results?.[pathKey] ?? null;
      const pid = raw?.personalityId;
      const r = pid ? PERSONALITIES[pid - 1] : getFallbackResult();

      setResult(r);
      setPersonalityId(pid);
      setLoading(false);

      // Save to CloudBase
      saveConsultation({
        cardId: card.id,
        cardTitle: card.title,
        choicePath: game.choicePath,
        personalityId: pid,
        persona: r.persona,
      });
      savePrescription({
        cardId: card.id,
        cardTitle: card.title,
        personalityId: pid,
        persona: r.persona,
        dia: r.dia,
        med: r.med,
        usage: r.usage,
        advice: r.advice,
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [game.currentCard, game.choicePath]);

  const handleRetry = useCallback(() => {
    dispatch({ type: 'RETRY_SAME_CARD' });
  }, [dispatch]);

  const handleHome = useCallback(() => {
    const cardId = game.currentCard?.id;
    dispatch({ type: 'GO_HOME' });
    setTimeout(() => {
      if (cardId?.startsWith('love_')) {
        document.getElementById('comp3')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('comp2-cards')?.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, [dispatch, game.currentCard]);

  return (
    <div className="page active" id="page-result" style={{ display: 'flex' }}>
      {loading ? (
        <div className="result-loading" id="resultLoading" style={{ display: 'flex' }}>
          <div className="chat-bg-logos" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <img key={i} src="images/logo.jpg" className="chat-bg-logo" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ))}
          </div>
          <div className="loading-pill">💊</div>
          <div className="loading-text">正在调配你的专属人格处方...</div>
        </div>
      ) : result && game.currentCard ? (
        <div id="resultContent" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <PrescriptionCard
            result={result}
            personalityId={personalityId}
            cardTitle={game.currentCard.title}
            pathKey={game.choicePath.join('-')}
          />
          <div className="result-buttons">
            <button className="btn-retry" onClick={handleRetry}>
              🔄 再测一次当前体验
            </button>
            <button className="btn-home" onClick={handleHome}>
              🎴 重新挑选体验卡
            </button>
          </div>
          <p
            style={{
              fontSize: 10,
              color: 'rgba(139,125,104,0.5)',
              textAlign: 'center',
              padding: '0 20px 11px',
              lineHeight: 1.8,
              marginTop: '-5mm',
            }}
          >
            * 本诊断仅供娱乐，不具备临床诊断效度
            <br />* 人生没有标准答案，你选的每一条路都算数
          </p>
        </div>
      ) : (
        <p style={{ textAlign: 'center', padding: 40 }}>数据丢失，请重新选择体验卡</p>
      )}
    </div>
  );
}
