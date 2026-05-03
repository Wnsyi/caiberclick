import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import { useAppContext } from '../contexts/AppContext';
import {
  getOpeningPhrase,
  getFollowUp,
  getDeepQuestion,
  getClosingPhrase,
} from '../utils/dialogue';

/**
 * 问诊阶段枚举
 * opening = 开场白
 * followUp = 第1轮追问
 * deepQuestion = 第2轮深度追问
 * closing = 诊断结语
 * done = 对话完成
 */
type Phase = 'opening' | 'followUp' | 'deepQuestion' | 'closing' | 'done';

export default function ConsultationPage() {
  const { identityTag, messages, addMessage, dialogueRound, incrementRound } = useAppContext();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('opening');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 首条AI消息：开场白
  useEffect(() => {
    if (!identityTag) {
      navigate('/');
      return;
    }

    if (messages.length === 0) {
      const timer = setTimeout(() => {
        const opening = getOpeningPhrase(identityTag);
        addMessage({ role: 'ai', text: opening, timestamp: Date.now() });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [identityTag, messages.length, addMessage, navigate]);

  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * 发送用户消息 & 触发AI回复
   */
  const sendMessage = useCallback(
    async (text: string) => {
      if (isSending || phase === 'done') return;
      const trimmedText = text.trim();
      if (!trimmedText) return;

      setIsSending(true);
      setInputText('');

      // 添加用户消息
      addMessage({ role: 'user', text: trimmedText, timestamp: Date.now() });
      incrementRound();
      const newRound = dialogueRound + 1;

      // AI开始"打字"
      setIsTyping(true);

      // 模拟AI延迟（1.5-3秒，像真人在打字）
      const delay = 1500 + Math.random() * 1500;
      await new Promise((r) => setTimeout(r, delay));

      let aiText: string;
      let nextPhase: Phase;

      if (newRound === 1) {
        // 第1轮回答 → AI追问
        aiText = getFollowUp(trimmedText);
        nextPhase = 'followUp';
      } else if (newRound === 2) {
        // 第2轮回答 → AI深度追问
        aiText = getDeepQuestion();
        nextPhase = 'deepQuestion';
      } else if (newRound >= 3) {
        // 第3轮及以上 → 诊断结语
        aiText = getClosingPhrase();
        nextPhase = 'closing';
      } else {
        aiText = getFollowUp(trimmedText);
        nextPhase = 'followUp';
      }

      addMessage({ role: 'ai', text: aiText, timestamp: Date.now() });
      setPhase(nextPhase);
      setIsTyping(false);
      setIsSending(false);

      if (nextPhase === 'closing') {
        // 再等1秒，允许用户看到结语后跳转
        setTimeout(() => {
          setPhase('done');
        }, 800);
      }
    },
    [phase, dialogueRound, isSending, addMessage, incrementRound]
  );

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleEndConsultation = () => {
    navigate('/');
  };

  const handleGoToPrescription = () => {
    navigate('/prescription');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header subtitle={phase !== 'done' ? '正在为您把脉中...' : '诊断完成'} />

      {/* 对话区域 */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 max-w-lg mx-auto w-full">
        <div className="space-y-1 pt-2">
          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} text={msg.text} />
          ))}

          {/* AI正在输入指示器 */}
          {isTyping && (
            <div className="flex items-center gap-2 px-4 py-3 text-purple-400/60 text-sm">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="ml-1">赛博华佗正在输入...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* 诊断完成按钮 */}
        {phase === 'done' && (
          <div className="text-center mt-4">
            <button
              onClick={handleGoToPrescription}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all active:scale-95 animate-pulse"
            >
              💊 诊断完成，开药！
            </button>
            <p className="text-xs text-purple-400/40 mt-3">
              * 如果对话不足3轮，也可以直接开药（但华佗建议多聊几句）
            </p>
          </div>
        )}
      </main>

      {/* 底部输入栏 */}
      {phase !== 'done' && (
        <footer className="sticky bottom-0 bg-gradient-to-t from-[#1a1a2e] via-[#1a1a2e]/95 to-transparent px-4 py-3 border-t border-purple-900/30">
          <form
            onSubmit={handleInputSubmit}
            className="flex items-center gap-2 max-w-lg mx-auto"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="跟华佗说说..."
              disabled={isSending}
              className="flex-1 bg-purple-950/40 border border-purple-700/30 rounded-full px-4 py-2.5 text-sm text-amber-100 placeholder-purple-400/40 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
            />
            <button
              type="button"
              onClick={handleEndConsultation}
              className="px-4 py-2.5 rounded-full bg-purple-800/40 border border-purple-600/30 text-purple-200 text-sm hover:bg-purple-800/60 transition-all"
            >
              结束对话
            </button>
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2.5 rounded-full bg-amber-500/80 text-white text-sm font-bold hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              发送
            </button>
          </form>
        </footer>
      )}
    </div>
  );
}
