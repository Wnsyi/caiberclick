import type { BaseCard } from '../../data/gameTypes';
import { isAdmin } from '../../cloudbase';

interface Props {
  card: BaseCard;
  onSelect: (cardId: string) => void;
  reviewsText?: string;
  onEdit?: (card: BaseCard) => void;
}

export function CarouselCard({ card, onSelect, reviewsText, onEdit }: Props) {
  return (
    <>
      <span className="card-badge-top">{card.badge}</span>
      <div className="card-emoji-large">{card.emoji}</div>
      <div className="card-title-large">{card.title}</div>
      <div className="card-img-area">
        <img src={card.imgSrc} alt={card.title} loading="lazy" />
      </div>
      <div className="card-stars">
        <span className="stars-yellow">
          {'★'.repeat(Math.floor(card.stars))}
          {card.stars % 1 ? '☆' : ''}
        </span>
        <span className="review-count">{reviewsText ?? card.reviews}</span>
      </div>
      <div className="card-desc-short">{card.desc}</div>
      <div className="card-actions">
        <button className="btn-card-primary" onClick={(e) => { e.stopPropagation(); onSelect(card.id); }}>
          ⚡ 立即体验
        </button>
        {isAdmin() && onEdit && (
          <button className="btn-card-edit" onClick={(e) => { e.stopPropagation(); onEdit(card); }}
            style={{ marginLeft: '8px', padding: '10px 16px', border: '1px solid rgba(139,125,104,0.3)', background: '#fff', color: '#5D4E37', cursor: 'pointer', fontSize: '0.85rem' }}>
            ✏️ 编辑
          </button>
        )}
      </div>
    </>
  );
}
