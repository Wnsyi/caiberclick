import { useRef } from 'react';

interface PrescriptionCardProps {
  mbtiType: string;
  animal: string;
  animalDesc: string;
  diagnosis: string;
  medicine: string;
  usage: string;
  advice: string;
  closing: string;
  onMedicineTripleClick: () => void;
}

export default function PrescriptionCard({
  mbtiType,
  animal,
  animalDesc,
  diagnosis,
  medicine,
  usage,
  advice,
  closing,
  onMedicineTripleClick,
}: PrescriptionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMedicineClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 3) {
      onMedicineTripleClick();
      clickCountRef.current = 0;
    }
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 800);
  };

  return (
    <div
      ref={cardRef}
      id="prescription-card"
      className="relative bg-amber-50 text-stone-900 rounded-lg p-5 sm:p-6 shadow-2xl max-w-md mx-auto font-prescription overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #fef9e7 0%, #fdf2d1 30%, #fef9e7 60%, #fdf2d1 100%)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(180,130,50,0.2)',
      }}
    >
      {/* 处方笺水印纹理 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, #000 31px, #000 32px)',
          backgroundSize: '100% 32px',
        }}
      />

      {/* 顶部装饰线 */}
      <div className="relative flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-amber-300/60">
        <span className="text-xs tracking-widest text-amber-700/60">赛博华佗处方笺</span>
        <span className="text-xs text-amber-600 font-bold tracking-wider">{mbtiType}</span>
      </div>

      {/* 诊断结果 */}
      <div className="relative mb-4">
        <h3 className="text-sm text-amber-800/70 mb-1">【诊断结果】</h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">{animal.includes('猫') ? '🐱' : animal.includes('修勾') ? '🐶' : animal.includes('鹅') ? '🦢' : animal.includes('仓鼠') ? '🐹' : animal.includes('狮子') ? '🦁' : animal.includes('猫头鹰') ? '🦉' : animal.includes('幽灵') ? '👻' : animal.includes('哈士奇') ? '🐺' : animal.includes('小太阳') ? '☀️' : animal.includes('流浪猫') ? '🐈' : animal.includes('布偶') ? '😺' : '💊'}</span>
          <div>
            <div className="text-xl font-bold text-stone-800">你是「{animal}」</div>
            <div className="text-xs text-stone-500">{animalDesc}</div>
          </div>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed bg-amber-200/30 rounded p-2">
          {diagnosis}
        </p>
      </div>

      {/* 处方用药 */}
      <div className="relative mb-4">
        <h3 className="text-sm text-amber-800/70 mb-1">【处方】Rp.</h3>
        <div
          className="bg-white/60 rounded p-3 border border-amber-300/40 cursor-pointer select-none"
          onClick={handleMedicineClick}
        >
          <div className="font-bold text-lg text-stone-800 mb-1">{medicine}</div>
          <div className="text-xs text-stone-600 leading-relaxed">
            <span className="text-amber-700 font-bold">用法用量：</span>
            {usage}
          </div>
        </div>
      </div>

      {/* 医嘱 */}
      <div className="relative mb-4 p-3 bg-red-50/50 rounded border border-red-200/30">
        <h3 className="text-sm text-red-700/70 mb-1">【医嘱】</h3>
        <p className="text-sm text-stone-700 leading-relaxed">{advice}</p>
      </div>

      {/* 医生签名章 */}
      <div className="relative flex justify-end items-center gap-3 mt-4 pt-3 border-t border-amber-300/40">
        <div className="text-right">
          <div className="text-xs text-amber-700/70">主治医师</div>
          <div className="text-lg text-red-800 font-bold transform -rotate-2" style={{ fontFamily: 'KaiTi, STKaiti, serif' }}>
            赛博华佗
          </div>
        </div>
        <div className="w-12 h-12 border-2 border-red-400/50 rounded-full flex items-center justify-center text-red-400/70 text-xs transform rotate-12">
          印章
        </div>
      </div>

      {/* 底部共情结语 */}
      <div className="relative mt-4 pt-3 border-t border-dashed border-amber-300/40">
        <p className="text-xs text-stone-600 leading-relaxed italic text-center">
          "{closing}"
        </p>
      </div>

      {/* 装饰：撕边效果 */}
      <div className="absolute -bottom-1 left-0 right-0 h-2 bg-amber-50"
        style={{
          maskImage: 'radial-gradient(circle 4px, transparent 95%, black 100%)',
          maskSize: '12px 6px',
          maskPosition: 'bottom',
          maskRepeat: 'repeat-x',
        }}
      />
    </div>
  );
}
