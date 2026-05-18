import type { BaseCard } from '../../data/gameTypes';

interface Props {
  card: BaseCard;
  onSelect: (cardId: string) => void;
  reviewsText?: string;
}

export function CarouselCard({ card, onSelect, reviewsText }: Props) {
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
      </div>
    </>
  );
}
