import type { PersonalityArchetype } from '../../data/gameTypes';
import { getPersonalityGraphicSVG } from '../../data/personalityMappings';
import { PERSONALITY_CHARACTERS } from '../../data/personalities';

export function PersonalityDetailModal({
  personality,
  show,
  onClose,
}: {
  personality: PersonalityArchetype | null;
  show: boolean;
  onClose: () => void;
}) {
  if (!personality) return null;

  return (
    <div
      className={`pd-overlay${show ? ' show' : ''}`}
      id="personalityDetailOverlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pd-close" onClick={onClose}>✕</button>
        <div className="pd-graphic" id="pdGraphic" dangerouslySetInnerHTML={{ __html: getPersonalityGraphicSVG(personality.id) }} />
        {PERSONALITY_CHARACTERS[personality.id] && (
          <div className="pd-character" id="pdCharacter">
            <span className="pd-char-label">代表人物</span>
            <img className="pd-char-img" src={PERSONALITY_CHARACTERS[personality.id]} alt="" />
          </div>
        )}
        <div className="pd-content">
          <div className="pd-badge">PERSONALITY ARCHETYPE</div>
          <div className="pd-persona">{personality.persona}</div>
          <div className="pd-section">
            <h3>【诊断结果】</h3>
            <div className="pd-diagnosis">{personality.dia}</div>
          </div>
          <div className="pd-section">
            <h3>【处方】Rp.</h3>
            <div className="pd-med-box">
              <div className="pd-med-name">{personality.med}</div>
              <div className="pd-med-usage">{personality.usage}</div>
            </div>
          </div>
          <div className="pd-section">
            <h3>【医嘱】</h3>
            <div className="pd-advice">{personality.advice}</div>
          </div>
          <p className="pd-disclaimer">* 本诊断仅供娱乐，不具备临床诊断效度<br />* 人生没有标准答案，你选的每一条路都算数</p>
        </div>
      </div>
    </div>
  );
}

export function GachaHintModal({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div
      className={`gh-overlay${show ? ' show' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="gh-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gh-icon">🎰</div>
        <div className="gh-title">HINT</div>
        <div className="gh-message">这是一个可以玩扭蛋的地方，左边的魔术师其实是个扭蛋机哦！想要知道卡牌是什么，去找找魔术师问问吧。</div>
        <button className="gh-btn" onClick={onClose}>知道啦</button>
      </div>
    </div>
  );
}

export function LoveStoryCardOverlay({
  title,
  desc,
  show,
  onClose,
}: {
  title: string;
  desc: string;
  show: boolean;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="ls-story-card-overlay" style={{ display: show ? 'flex' : 'none' }}>
      <div className="ls-story-card">
        <div className="ls-story-card-title">{title}</div>
        <div className="ls-story-card-text">{desc}</div>
        <div className="ls-story-card-btn">
          <button onClick={onClose}>确定</button>
        </div>
      </div>
    </div>
  );
}
