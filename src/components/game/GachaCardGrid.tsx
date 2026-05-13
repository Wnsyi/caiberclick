import { getCardBackGraphic, getPersonalityGraphicSVG } from '../../data/personalityMappings';

import { PERSONALITIES } from '../../data/personalities';

interface Props {
  collectedFlags: boolean[];
  onSlotClick: (index: number) => void;
  onEmptyClick: () => void;
}

export function GachaCardGrid({ collectedFlags, onSlotClick, onEmptyClick }: Props) {
  const backSvg = getCardBackGraphic();

  return (
    <div className="gacha-card-grid" id="gachaCardGrid">
      {Array.from({ length: 16 }, (_, i) => (
        <div
          key={i}
          className="gacha-card-float"
          style={{ animationDelay: `${i * 0.18}s` }}
        >
          {collectedFlags[i] ? (
            <div
              className="gacha-card-slot collected"
              onClick={() => onSlotClick(i)}
            >
              <div className="card-slot-inner">
                <div className="card-slot-graphic" dangerouslySetInnerHTML={{ __html: getPersonalityGraphicSVG(i + 1) }} />
                <span className="card-slot-label">{PERSONALITIES[i]?.persona ?? `#${i + 1}`}</span>
              </div>
            </div>
          ) : (
            <div
              className="gacha-card-slot empty"
              id={`gachaSlot${i}`}
              onClick={onEmptyClick}
            >
              <div className="card-back-graphic" dangerouslySetInnerHTML={{ __html: backSvg }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
