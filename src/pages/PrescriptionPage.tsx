import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PrescriptionCard from '../components/PrescriptionCard';
import ShareFooter from '../components/ShareFooter';
import EasterEgg from '../components/EasterEgg';
import { useAppContext } from '../contexts/AppContext';
import { analyzeMBTI } from '../utils/nlp';
import { generatePrescription, getRandomCrazyQuote } from '../utils/prescription';

export default function PrescriptionPage() {
  const {
    identityTag,
    messages,
    mbtiResult,
    setMBTIResult,
    prescription,
    setPrescription,
    easterEggClicks,
    incrementEasterEggClicks,
    resetEasterEggClicks,
    resetAll,
    resetConversation,
  } = useAppContext();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [easterEggQuote, setEasterEggQuote] = useState('');

  // 进入页面即执行NLP分析（仅一次）
  useEffect(() => {
    // 如果没有选择身份标签，返回首页
    if (!identityTag) {
      navigate('/');
      return;
    }

    if (mbtiResult && prescription) {
      // 已经分析过，跳过
      setLoading(false);
      return;
    }

    // 模拟NLP分析延迟
    const timer = setTimeout(() => {
      // 提取用户消息文本
      const userMessages = messages
        .filter((m) => m.role === 'user')
        .map((m) => m.text);

      // 执行NLP分析
      const result = analyzeMBTI(userMessages);
      setMBTIResult(result);

      // 生成处方
      const presc = generatePrescription(result.type, result.animal, result.description);
      setPrescription(presc);

      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 处理药名三连击彩蛋
  const handleMedicineTripleClick = () => {
    incrementEasterEggClicks();
    if (easterEggClicks >= 2) {
      // 第三次点击触发
      setEasterEggQuote(getRandomCrazyQuote());
      setShowEasterEgg(true);
      resetEasterEggClicks();
    }
  };

  const handleCloseEasterEgg = () => {
    setShowEasterEgg(false);
  };

  const handleRestart = () => {
    resetAll();
    navigate('/');
  };

  const handleRetry = () => {
    resetConversation();
    navigate('/consultation');
  };

  // 加载动画
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header subtitle="正在为您配制专属处方..." />
        <main className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-6xl animate-bounce mb-6">💊</div>
          <div className="flex gap-1 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-amber-400 rounded-full"
                style={{
                  animation: 'pulse 1s infinite',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <p className="text-amber-200/70 text-sm">赛博华佗正在调配药方...</p>
          <p className="text-purple-400/40 text-xs mt-2">正在分析你的怨气成分...</p>
        </main>
      </div>
    );
  }

  if (!prescription) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header subtitle={`${prescription.mbtiType} · 你的赛博诊断报告`} />

      <main className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        {/* 处方卡片 */}
        <PrescriptionCard
          {...prescription}
          onMedicineTripleClick={handleMedicineTripleClick}
        />

        {/* 操作按钮 */}
        <ShareFooter onRestart={handleRestart} onRetry={handleRetry} />

        <p className="text-center text-xs text-purple-500/30 mt-4 leading-relaxed">
          * 你的处方数据已加密存储（大概吧）
          <br />
          * 本诊断仅供娱乐，如有雷同，说明人类精神问题是大同小异的
        </p>
      </main>

      {/* 彩蛋弹窗 */}
      <EasterEgg
        visible={showEasterEgg}
        quote={easterEggQuote}
        onClose={handleCloseEasterEgg}
      />
    </div>
  );
}
