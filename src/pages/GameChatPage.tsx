import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState, useGameDispatch } from '../contexts/GameContext';
import { ChatBubble, UserChoiceBubble, TypingIndicator } from '../components/game/ChatBubble';
import { SystemBanner } from '../components/game/SystemBanner';

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

  // Clear messages when starting a new card (original: chatMessages.innerHTML = '')
  useEffect(() => {
    const cardId = card?.id ?? null;
    if (cardId !== lastCardRef.current) {
      lastCardRef.current = cardId;
      setChatHistory([]);
      setShowBanner(false);
      setShowTyping(false);
      lastPhaseRef.current = null;
    }
  }, [card]);

  // Auto-focus input when awaiting choice (original: chatInput.focus())
  useEffect(() => {
    if (game.awaitingChoice && !game.isShowingMessages && inputRef.current) {
      inputRef.current.focus();
    }
  }, [game.awaitingChoice, game.isShowingMessages]);

  // Play messages when phase changes — messages accumulate within the same card
  useEffect(() => {
    if (!card || !currentPhaseId) return;
    if (lastPhaseRef.current === currentPhaseId) return;

    const phase = card.phases[currentPhaseId];
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
      if (idx < messages.length) {
        setShowTyping(true);
      }
      setTimeout(showNext, 400 + Math.random() * 700);
    }
    setTimeout(showNext, 500);

    return () => { cancelled = true; lastPhaseRef.current = null; };
  }, [card, currentPhaseId, dispatch]);

  // Scroll to bottom
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
  }, [chatHistory, showTyping]);

  const handleSend = useCallback(() => {
    if (!game.awaitingChoice || game.isShowingMessages) return;
    const choice = parseInt(inputValue.trim());
    if (choice !== 1 && choice !== 2) return;
    const option = game.currentOptions?.find((o) => o.id === choice);
    if (!option) return;

    setChatHistory((prev) => [...prev, { type: 'user', text: option.text }]);
    setInputValue('');
    setShowBanner(false);

    dispatch({ type: 'PUSH_CHOICE', choice });
    dispatch({ type: 'SET_AWAITING_CHOICE', value: false, options: null });
    lastPhaseRef.current = null; // Allow next phase to trigger

    const effectiveMode = loveChatMode;
    const loveCard = love.currentCard;

    // Track choice in love.choicePath for personality mapping
    if (effectiveMode) {
      dispatch({ type: 'LOVE_PUSH_CHOICE', choice });
    }

    // Reset love chat mode synchronously (matches original: loveChatMode = null)
    if (effectiveMode) {
      dispatch({ type: 'LOVE_CHAT_MODE', value: false });
    }

    setTimeout(() => {
      if (effectiveMode) {
        if (option.next === 'end') {
          dispatch({ type: 'LOVE_FINISH' });
          return;
        }
        if (loveCard?.id === 'love_crush' && option.next === 'crush_3c') {
          dispatch({ type: 'SET_PAGE', page: 'page-love-story' });
          dispatch({ type: 'LOVE_SET_PHASE', phaseId: 'crush_3c' });
          return;
        }
        dispatch({ type: 'SET_PHASE', phaseId: option.next });
        return;
      }

      const nextPhase = card?.phases[option.next];
      if (nextPhase?.isEnd) {
        dispatch({ type: 'FINISH_GAME' });
      } else {
        dispatch({ type: 'SET_PHASE', phaseId: option.next });
      }
    }, 800);
  }, [game, inputValue, dispatch, loveChatMode, love.currentCard, card]);

  const handleEndExperience = useCallback(() => {
    dispatch({ type: 'GO_HOME' });
  }, [dispatch]);

  if (!card) return null;

  const phase = card.phases[currentPhaseId ?? ''] ?? null;

  const getAvatarColor = (sender: string, isMe: boolean) => {
    if (isMe) return '#f59e0b';
    return card.avatarColors?.[sender] ?? '#6b7280';
  };

  const inputDisabled = !game.awaitingChoice || game.isShowingMessages;

  return (
    <div className="page active" id="page-chat" style={{ display: 'flex' }}>
      <div className="chat-bg-logos" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <img
            key={i}
            className="chat-bg-logo"
            src="images/logo.jpg"
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ))}
      </div>

      <div className="chat-topbar">
        <span className="room-emoji">💬</span>
        <div className="chat-room-name">{phase?.chatName || '群聊'}</div>
        <div className="chat-room-count" />
      </div>

      <SystemBanner
        prompt={phase?.prompt ?? ''}
        options={game.awaitingChoice ? game.currentOptions : null}
        visible={showBanner}
      />

      <div className="chat-messages" ref={messagesRef}>
        {chatHistory.map((item, i) =>
          item.type === 'user' ? (
            <UserChoiceBubble key={`item-${i}`} text={item.text} />
          ) : (
            <ChatBubble
              key={`item-${i}`}
              msg={item}
              isMe={false}
              avatarColor={getAvatarColor(item.sender, false)}
            />
          )
        )}
        {showTyping && <TypingIndicator />}
      </div>

      <div className="chat-input-bar">
        <input
          ref={inputRef}
          type="text"
          placeholder="输入 1 或 2 做出选择..."
          maxLength={1}
          inputMode="numeric"
          value={inputValue}
          disabled={inputDisabled}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button className="btn-end" onClick={handleEndExperience}>
          结束体验
        </button>
        <button className="btn-primary" id="chatSendBtn" disabled={inputDisabled} onClick={handleSend}>
          发送
        </button>
      </div>
    </div>
  );
}
