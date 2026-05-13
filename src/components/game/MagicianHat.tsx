import { CAPSULE_COLORS } from '../../data/gacha';

interface Props {
  collected: number;
  order: number[];
  capsuleVisible: boolean;
  capsuleDropping: boolean;
  capsuleOpening: boolean;
  currentColor: string;
}

export function MagicianHat({ collected, order, capsuleVisible, capsuleDropping, capsuleOpening, currentColor }: Props) {
  return (
    <div className="gacha-machine" id="gachaMachine">
      {/* 魔术帽 */}
      <div className="magician-hat">
        <div className="hat-top">
          <div className="gacha-display-window">
            <span className="gacha-display-count" id="gachaRemainCount">
              {16 - collected}
            </span>
          </div>
          <div className="gacha-capsules-pool" id="gachaCapsulesPool">
            {order.map((i) => (
              <div
                key={i}
                className="gacha-mini-capsule"
                style={{ background: `linear-gradient(180deg,${CAPSULE_COLORS[i]}dd,${CAPSULE_COLORS[i]}99)` }}
              />
            ))}
          </div>
        </div>
        <div className="hat-brim" />
      </div>
      {/* 魔术师的脸 */}
      <div className="magician-face">
        <div className="magician-eyes">
          <div className="magician-eye" />
          <div className="magician-eye" />
        </div>
        <div className="magician-nose" />
        <div className="magician-mouth" id="gachaChute">
          <div className="gacha-chute-flap" />
        </div>
      </div>
      {/* 脖子 */}
      <div className="magician-neck" />
      {/* 领结 */}
      <div className="magician-collar">
        <div className="magician-bow-left" />
        <div className="magician-bow-center" />
        <div className="magician-bow-right" />
      </div>
      {/* 披肩 */}
      <div className="magician-cape" />
      {/* 身体 */}
      <div className="magician-body">
        <div className="magician-arm arm-left">
          <div className="magician-forearm forearm-left">
            <div className="magician-palm" />
          </div>
        </div>
        <div className="magician-arm arm-right">
          <div className="magician-forearm">
            <div className="magician-palm">
              {/* 魔术棒手柄 */}
              <div className="gacha-handle-wrapper">
                <div className="gacha-handle" id="gachaHandle">
                  <div className="gacha-handle-knob" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 掉出的扭蛋 */}
      <div
        className={`gacha-dispensed-capsule${capsuleVisible ? ' show' : ''}${capsuleDropping ? ' dropping' : ''}${capsuleOpening ? ' opening' : ''}`}
        id="gachaDispensed"
        style={{ '--capsule-color': currentColor } as React.CSSProperties}
      >
        <div className="gacha-capsule-top" />
        <div className="gacha-capsule-bottom" />
      </div>
    </div>
  );
}

export function GachaButtons({
  disabled,
  onPull,
  onReset,
  onOpenAll,
}: {
  disabled: boolean;
  onPull: () => void;
  onReset: () => void;
  onOpenAll: () => void;
}) {
  return (
    <div className="gacha-btn-row">
      <button className="gacha-start-btn" disabled={disabled} onClick={onPull} id="gachaStartBtn">
        <span className="gacha-btn-inner">PRESS</span>
      </button>
      <button className="gacha-reset-btn" onClick={onReset} id="gachaResetBtn">
        <span className="gacha-btn-inner">RESET</span>
      </button>
      <button className="gacha-all-btn" onClick={onOpenAll} id="gachaAllBtn">
        <span className="gacha-btn-inner">ALL</span>
      </button>
    </div>
  );
}
