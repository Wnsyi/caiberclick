import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState, useGameDispatch } from '../contexts/GameContext';
import { ChatBubble, UserChoiceBubble, TypingIndicator } from '../components/game/ChatBubble';
import { SystemBanner } from '../components/game/SystemBanner';
import { startAIChat, sendAIMessage, analyzeAIPersonality, type AIChatItem } from '../ai';
import { saveAIChat } from '../cloudbase';
import type { BaseCard } from '../data/gameTypes';

export function GameChatPage() {
  const { game, loveChatMode, love } = useGameState();
  const dispatch = useGameDispatch();
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  type ChatItem = { type: 'npc'; sender: string; text: string } | { type: 'user'; text: string };
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const card = game.currentCard;
  const currentPhaseId = game.currentPhase;
  const lastPhaseRef = useRef<string | null>(null);
  const lastCardRef = useRef<string | null>(null);

  // ---- AI MODE state ----
  const isAIMode = !!card;
  const [aiMessages, setAiMessages] = useState<AIChatItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFinished, setAiFinished] = useState(false);
  const [showResultBtn, setShowResultBtn] = useState(false);
  const aiInitedRef = useRef(false);

  // Clear messages when starting a new card
  useEffect(() => {
    const cardId = card?.id ?? null;
    if (cardId !== lastCardRef.current) {
      lastCardRef.current = cardId;
      setChatHistory([]);
      setShowBanner(false);
      setShowTyping(false);
      lastPhaseRef.current = null;
      // Reset AI state
      setAiMessages([]);
      setAiLoading(false);
      setAiFinished(false);
      setShowResultBtn(false);
      aiInitedRef.current = false;
    }
  }, [card]);

  // ---- AI MODE: Init ----
  useEffect(() => {
    if (!isAIMode || !card || aiInitedRef.current) return;
    aiInitedRef.current = true;
    setAiLoading(true);
    startAIChat(card.title, card.desc)
      .then((reply) => {
        setAiMessages([{ role: 'assistant' as const, text: reply }]);
        setAiLoading(false);
        setTimeout(() => inputRef.current?.focus(), 200);
      })
      .catch((err) => {
        console.error('[AI] 初始化失败:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        setAiMessages([{ role: 'assistant' as const, text: `🤖 AI连接失败: ${errMsg}` }]);
        setAiLoading(false);
      });
  }, [isAIMode, card]);

  // ---- AI MODE: Send message ----
  const handleAISend = useCallback(async () => {
    if (!inputValue.trim() || aiLoading || aiFinished || !card) return;
    const userMsg: AIChatItem = { role: 'user', text: inputValue.trim() };
    const newHistory = [...aiMessages, userMsg];
    setAiMessages(newHistory);
    setInputValue('');
    setAiLoading(true);

    try {
      const { reply, isFinished } = await sendAIMessage(card.title, card.desc, newHistory, userMsg.text);
      if (isFinished) {
        const finalHistory = [...newHistory, { role: 'assistant' as const, text: reply }];
        setAiMessages(finalHistory);
        setAiLoading(false);
        setAiFinished(true);
        setShowResultBtn(true);
        // 不自动跳转，等用户点击按钮
      } else {
        setAiMessages([...newHistory, { role: 'assistant' as const, text: reply }]);
        setAiLoading(false);
        // AI 回复后自动聚焦输入框
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error('[AI] 发送失败:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiMessages([...newHistory, { role: 'assistant' as const, text: `🤖 发送失败: ${errMsg}` }]);
      setAiLoading(false);
    }
  }, [inputValue, aiLoading, aiFinished, card, aiMessages, dispatch]);

  // ---- NORMAL MODE: Auto-focus input ----
  useEffect(() => {
    if (!isAIMode && game.awaitingChoice && !game.isShowingMessages && inputRef.current) {
      inputRef.current.focus();
    }
  }, [game.awaitingChoice, game.isShowingMessages, isAIMode]);

  // ---- NORMAL MODE: Play messages when phase changes ----
  useEffect(() => {
    if (isAIMode || !card || !currentPhaseId) return;
    if (lastPhaseRef.current === currentPhaseId) return;
    const phase = (card as BaseCard).phases[currentPhaseId];
    if (!phase || phase.isEnd) return;
    lastPhaseRef.current = currentPhaseId;
    const messages = phase.messages ?? [];
    if (messages.length === 0) {
      if (phase.prompt && phase.options) {
        dispatch({ type: 'SET_AWAITING_CHOICE', value: true, options: phase.options });
        setShowBanner(true);
      }
      return;
    }
    dispatch({ type: 'SET_SHOWING_MESSAGES', value: true });
    setShowTyping(true);
    setShowBanner(false);
    let cancelled = false;
    let idx = 0;
    function showNext() {
      if (cancelled) return;
      if (idx >= messages.length) {
        setShowTyping(false);
        dispatch({ type: 'SET_SHOWING_MESSAGES', value: false });
        if (phase.prompt && phase.options) {
          dispatch({ type: 'SET_AWAITING_CHOICE', value: true, options: phase.options });
          setShowBanner(true);
        }
        return;
      }
      setShowTyping(false);
      const msg = messages[idx];
      setChatHistory((prev) => [...prev, { type: 'npc', sender: msg.sender, text: msg.text }]);
      idx++;
      if (idx < messages.length) setShowTyping(true);
      setTimeout(showNext, 400 + Math.random() * 700);
    }
    setTimeout(showNext, 500);
    return () => { cancelled = true; lastPhaseRef.current = null; };
  }, [card, currentPhaseId, dispatch, isAIMode]);

  // Scroll to bottom
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => { requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; }); });
  }, [chatHistory, showTyping, aiMessages, aiLoading]);

  // ---- NORMAL MODE: handleSend ----
  const handleSend = useCallback((arg?: number | React.MouseEvent) => {
    if (isAIMode) return;
    if (!game.awaitingChoice || game.isShowingMessages) return;
    const choice = typeof arg === 'number' ? arg : parseInt(inputValue.trim());
    if (choice !== 1 && choice !== 2) return;
    const option = game.currentOptions?.find((o) => o.id === choice);
    if (!option) return;
    setChatHistory((prev) => [...prev, { type: 'user', text: option.text }]);
    setInputValue('');
    setShowBanner(false);
    dispatch({ type: 'PUSH_CHOICE', choice });
    dispatch({ type: 'SET_AWAITING_CHOICE', value: false, options: null });
    lastPhaseRef.current = null;
    const effectiveMode = loveChatMode;
    const loveCard = love.currentCard;
    if (effectiveMode) { dispatch({ type: 'LOVE_PUSH_CHOICE', choice }); }
    if (effectiveMode) { dispatch({ type: 'LOVE_CHAT_MODE', value: false }); }
    setTimeout(() => {
      if (effectiveMode) {
        if (option.next === 'end') { dispatch({ type: 'LOVE_FINISH' }); return; }
        if (loveCard?.id === 'love_crush' && option.next === 'crush_3c') {
          dispatch({ type: 'SET_PAGE', page: 'page-love-story' });
          dispatch({ type: 'LOVE_SET_PHASE', phaseId: 'crush_3c' });
          return;
        }
        dispatch({ type: 'SET_PHASE', phaseId: option.next });
        return;
      }
      const nextPhase = (card as unknown as BaseCard)?.phases[option.next];
      if ((card as unknown as BaseCard)?.id?.startsWith('love_') && nextPhase?.isEnd) {
        dispatch({ type: 'LOVE_PUSH_CHOICE', choice });
        dispatch({ type: 'LOVE_FINISH' });
        return;
      }
      if (nextPhase?.isEnd) { dispatch({ type: 'FINISH_GAME' }); }
      else { dispatch({ type: 'SET_PHASE', phaseId: option.next }); }
    }, 800);
  }, [game, inputValue, dispatch, loveChatMode, love.currentCard, card, isAIMode]);

  const handleEndExperience = useCallback(() => {
    dispatch({ type: 'GO_HOME' });
    setTimeout(() => { document.getElementById('comp2-cards')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  }, [dispatch]);

  if (!card) return null;

  // ---- RENDER ----
  if (isAIMode) {
    return (
      <div className="page active" id="page-chat" style={{ display: 'flex' }}>
        <div className="chat-bg-logos" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <img key={i} className="chat-bg-logo" src="images/logo.jpg" alt=""
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ))}
        </div>
        <button onClick={handleEndExperience}
          style={{ position: 'fixed', left: '12px', top: '12px', zIndex: 30, background: 'rgba(139,125,104,0.85)', border: 'none', borderRadius: '0', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
          ← 返回
        </button>
        <div className="chat-topbar">
          <span className="room-emoji">🤖</span>
          <div className="chat-room-name">{card.title}（AI对话）</div>
          <div className="chat-room-count" />
        </div>
        <div className="chat-messages" ref={messagesRef} style={{ paddingBottom: '80px' }}>
          {aiMessages.map((item, i) => (
            item.role === 'user' ? (
              <UserChoiceBubble key={`ai-${i}`} text={item.text} />
            ) : (
              <ChatBubble key={`ai-${i}`} msg={{ sender: 'AI', text: item.text }} isMe={false} avatarColor="#7c3aed" />
            )
          ))}
          {aiLoading && <TypingIndicator />}
        </div>
        {showResultBtn && (
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(182,86,58,0.06)', borderTop: '1px solid rgba(182,86,58,0.15)' }}>
            <p style={{ fontSize: '0.85rem', color: '#5D4E37', marginBottom: '10px' }}>✅ 对话已结束</p>
            <button
              onClick={async () => {
                if (!card) return;
                setShowResultBtn(false);
                setAiLoading(true);
                const result = await analyzeAIPersonality(aiMessages);
                saveAIChat(card.id, aiMessages, result);
                dispatch({
                  type: 'FINISH_AI_GAME',
                  personalityId: result.personalityId,
                  persona: result.persona,
                  dia: result.dia,
                  med: result.med,
                  usage: result.usage,
                  advice: result.advice,
                });
              }}
              disabled={aiLoading}
              style={{
                padding: '10px 28px', border: 'none', background: '#B6563A', color: '#fff',
                cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, borderRadius: '0',
              }}
            >{aiLoading ? '🤖 分析中...' : '📋 查看测试结果'}</button>
            <p style={{ fontSize: '0.75rem', color: 'rgba(139,125,104,0.5)', marginTop: '6px' }}>点击查看 AI 为你生成的专属人格分析</p>
          </div>
        )}
        {!showResultBtn && (
          <div className="chat-input-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder={aiFinished ? '对话已结束' : '输入你的回答...'}
              value={inputValue}
              disabled={aiLoading || aiFinished}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAISend(); }}
              style={{ flex: 1 }}
            />
            <button className="btn-end" onClick={handleEndExperience}>结束体验</button>
            {aiMessages.length >= 4 && (
              <button
                onClick={async () => {
                  if (!card) return;
                  setAiFinished(true);
                  setShowResultBtn(true);
                }}
                style={{
                  padding: '6px 12px', border: '1px solid #7c3aed', background: '#fff',
                  color: '#7c3aed', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                }}
              >结束对话</button>
            )}
            <button className="btn-primary" disabled={aiLoading || aiFinished || !inputValue.trim()} onClick={handleAISend}>发送</button>
          </div>
        )}
      </div>
    );
  }

  // ---- NORMAL MODE ----
  const phase = (card as BaseCard).phases[currentPhaseId ?? ''] ?? null;
  const getAvatarColor = (sender: string, isMe: boolean) => isMe ? '#f59e0b' : ((card as BaseCard).avatarColors?.[sender] ?? '#6b7280');
  const inputDisabled = !game.awaitingChoice || game.isShowingMessages;

  return (
    <div className="page active" id="page-chat" style={{ display: 'flex' }}>
      <div className="chat-bg-logos" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <img key={i} className="chat-bg-logo" src="images/logo.jpg" alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ))}
      </div>
      <button onClick={handleEndExperience}
        style={{ position: 'fixed', left: '12px', top: '12px', zIndex: 30, background: 'rgba(139,125,104,0.85)', border: 'none', borderRadius: '0', padding: '6px 14px', cursor: 'pointer', fontSize: '0.85rem', color: '#fff' }}>
        ← 返回
      </button>
      <div className="chat-topbar">
        <span className="room-emoji">💬</span>
        <div className="chat-room-name">{phase?.chatName || '群聊'}</div>
        <div className="chat-room-count" />
      </div>
      <SystemBanner
        prompt={phase?.prompt ?? ''}
        options={game.awaitingChoice ? game.currentOptions : null}
        visible={showBanner}
        onOptionClick={(id) => handleSend(id)}
      />
      <div className="chat-messages" ref={messagesRef}>
        {chatHistory.map((item, i) =>
          item.type === 'user' ? (
            <UserChoiceBubble key={`item-${i}`} text={item.text} />
          ) : (
            <ChatBubble key={`item-${i}`} msg={item} isMe={false} avatarColor={getAvatarColor(item.sender, false)} />
          )
        )}
        {showTyping && <TypingIndicator />}
      </div>
      <div className="chat-input-bar">
        <input ref={inputRef} type="text" placeholder="输入 1 或 2 做出选择..." maxLength={1} inputMode="numeric"
          value={inputValue} disabled={inputDisabled}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }} />
        <button className="btn-end" onClick={handleEndExperience}>结束体验</button>
        <button className="btn-primary" id="chatSendBtn" disabled={inputDisabled} onClick={handleSend}>发送</button>
      </div>
    </div>
  );
}
