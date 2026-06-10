import type { BaseCard } from '../../data/gameTypes';
import { isAdmin } from '../../cloudbase';

interface Props {
  onSelectLove: (cardId: string) => void;
  cards: BaseCard[];
  onEditCard?: (card: BaseCard) => void;
}

export function LoveCardsSection({ onSelectLove, cards, onEditCard }: Props) {
  return (
    <section className="comp3" id="comp3">
      <div className="comp3-upper" id="comp3Upper">
        <h2 style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 4rem)',
          color: '#8B7D68', letterSpacing: '0.08em',
          pointerEvents: 'none', zIndex: 2, margin: 0, whiteSpace: 'nowrap',
        }}>
          JOIN THE EXPERIENCE
        </h2>
        <canvas className="comp3-ripple-canvas" id="rippleCanvas" />
        <div className="comp3-splatter">
          <span className="splat s1" />
          <span className="splat s2" />
          <span className="splat s3" />
          <span className="splat s4" />
          <span className="splat s5" />
          <span className="splat s6" />
          <span className="splat s7" />
          <span className="splat s8" />
        </div>
      </div>
      <div className="comp3-lower" id="comp3Lower">
        <div className="comp3-tri comp3-tri-a" id="triA" />
        <div className="comp3-tri comp3-tri-b" id="triB" />
        {cards.length > 0 && (
          <div
            id="cardA"
            className="comp3-card comp3-card-a"
            onClick={() => onSelectLove(cards[0].id)}
          >
            <div className="comp3-card-upper">
              <img src={cards[0].imgSrc} alt={cards[0].title} draggable={false} />
            </div>
            <div className="comp3-card-lower">
              <div className="comp3-card-title">{cards[0].title}</div>
              <div className="comp3-card-text">{cards[0].desc}</div>
              {isAdmin() && onEditCard && (
                <button onClick={(e) => { e.stopPropagation(); onEditCard(cards[0]); }}
                  style={{ marginTop: '8px', padding: '4px 12px', border: '1px solid rgba(139,125,104,0.3)', background: '#fff', color: '#5D4E37', cursor: 'pointer', fontSize: '0.8rem' }}>
                  ✏️ 编辑
                </button>
              )}
            </div>
          </div>
        )}
        <div className="comp3-insert">
          <div className="comp3-insert-item"><img src="images/leftUp.jpg" alt="" draggable={false} /></div>
          <div className="comp3-insert-item"><img src="images/rightUp.jpg" alt="" draggable={false} /></div>
          <div className="comp3-insert-item"><img src="images/leftLow.jpg" alt="" draggable={false} /></div>
          <div className="comp3-insert-item"><img src="images/rightLow.jpg" alt="" draggable={false} /></div>
        </div>
        {cards.length > 1 && (
          <div
            id="cardB"
            className="comp3-card comp3-card-b"
            onClick={() => onSelectLove(cards[1].id)}
          >
            <div className="comp3-card-upper">
              <img src={cards[1].imgSrc} alt={cards[1].title} draggable={false} />
            </div>
            <div className="comp3-card-lower">
              <div className="comp3-card-title">{cards[1].title}</div>
              <div className="comp3-card-text">{cards[1].desc}</div>
              {isAdmin() && onEditCard && (
                <button onClick={(e) => { e.stopPropagation(); onEditCard(cards[1]); }}
                  style={{ marginTop: '8px', padding: '4px 12px', border: '1px solid rgba(139,125,104,0.3)', background: '#fff', color: '#5D4E37', cursor: 'pointer', fontSize: '0.8rem' }}>
                  ✏️ 编辑
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
