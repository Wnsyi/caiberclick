import { LOVE_CARDS } from '../../data/loveCards';

interface Props {
  onSelectLove: (cardId: string) => void;
}

export function LoveCardsSection({ onSelectLove }: Props) {
  return (
    <section className="comp3" id="comp3">
      <div className="comp3-upper" id="comp3Upper">
        <img
          id="comp3BgImg"
          src="https://placehold.co/1600x800/E0D8CB/3D3020?text=JOIN+THE+EXPERIENCE"
          alt="Community Banner"
          loading="lazy"
          crossOrigin="anonymous"
        />
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
        {LOVE_CARDS.length > 0 && (
          <div
            id="cardA"
            className="comp3-card comp3-card-a"
            onClick={() => onSelectLove(LOVE_CARDS[0].id)}
          >
            <div className="comp3-card-upper">
              <img src={LOVE_CARDS[0].imgSrc} alt={LOVE_CARDS[0].title} draggable={false} />
            </div>
            <div className="comp3-card-lower">
              <div className="comp3-card-title">{LOVE_CARDS[0].title}</div>
              <div className="comp3-card-text">{LOVE_CARDS[0].desc}</div>
            </div>
          </div>
        )}
        <div className="comp3-insert">
          <div className="comp3-insert-item"><img src="images/leftUp.jpg" alt="" draggable={false} /></div>
          <div className="comp3-insert-item"><img src="images/rightUp.jpg" alt="" draggable={false} /></div>
          <div className="comp3-insert-item"><img src="images/leftLow.jpg" alt="" draggable={false} /></div>
          <div className="comp3-insert-item"><img src="images/rightLow.jpg" alt="" draggable={false} /></div>
        </div>
        {LOVE_CARDS.length > 1 && (
          <div
            id="cardB"
            className="comp3-card comp3-card-b"
            onClick={() => onSelectLove(LOVE_CARDS[1].id)}
          >
            <div className="comp3-card-upper">
              <img src={LOVE_CARDS[1].imgSrc} alt={LOVE_CARDS[1].title} draggable={false} />
            </div>
            <div className="comp3-card-lower">
              <div className="comp3-card-title">{LOVE_CARDS[1].title}</div>
              <div className="comp3-card-text">{LOVE_CARDS[1].desc}</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
