import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState, useGameDispatch } from '../contexts/GameContext';
import { LoveStoryCardOverlay } from '../components/game/Modals';

export function LoveStoryPage() {
  const { love } = useGameState();
  const dispatch = useGameDispatch();

  const [displayText, setDisplayText] = useState('');
  const [charName, setCharName] = useState('');
  const [charImg, setCharImg] = useState('');
  const [bgImage, setBgImage] = useState('');
  const [showChoices, setShowChoices] = useState(false);
  const [choiceTexts, setChoiceTexts] = useState<string[]>(['', '']);
  const [showTapHint, setShowTapHint] = useState(false);
  const [showStoryCard, setShowStoryCard] = useState(true);
  const [isLargeChar, setIsLargeChar] = useState(true);

  const msgIndexRef = useRef(0);
  const lastPhaseRef = useRef<string | null>(null);

  const card = love.currentCard;
  const phaseId = love.currentPhase;

  // Initialize love story when card changes
  useEffect(() => {
    if (!card) return;
    setBgImage(
      card.id === 'love_crush'
        ? 'url(images/lovecard1.jpg)'
        : 'url(images/lovecard2.jpg)',
    );
    setCharImg(
      card.id === 'love_crush' ? 'images/server.png' : 'images/ta.jpeg',
    );
    setIsLargeChar(true);
    setShowChoices(false);
    setShowTapHint(false);
    setDisplayText('');
    setCharName('');
    msgIndexRef.current = 0;
    lastPhaseRef.current = null;
    setShowStoryCard(true);
  }, [card]);

  // Play messages for current phase (tracked by phase ID string)
  useEffect(() => {
    if (!card || !phaseId) return;

    const phase = card.phases[phaseId];
    if (!phase || phase.isEnd) return;

    // If we're in prompt mode, handle it regardless of phase tracking guard
    if (love.isShowingPrompt && phase.prompt && phase.options) {
      setDisplayText(phase.prompt);
      setShowChoices(true);
      setShowTapHint(false);
      setChoiceTexts([
        phase.options[0]?.text ?? '',
        phase.options[1]?.text ?? '',
      ]);
      return;
    }

    if (lastPhaseRef.current === phaseId) return;
    lastPhaseRef.current = phaseId;

    const messages = phase.messages ?? [];
    msgIndexRef.current = 0;

    if (messages.length === 0 && phase.prompt && phase.options) {
      dispatch({ type: 'LOVE_SHOW_PROMPT', prompt: phase.prompt, options: phase.options });
      return;
    }

    if (messages.length > 0) {
      showMessage(messages[0], card);
    }
  }, [card, phaseId, love.isShowingPrompt, dispatch]);

  const showMessage = useCallback(
    (msg: { sender: string; text: string }, cardCtx: typeof card) => {
      setCharName(msg.sender || '');
      setDisplayText(msg.text);
      setShowChoices(false);
      setShowTapHint(true);

      if (cardCtx?.id === 'love_crush') {
        if (msg.sender === 'TA') {
          setCharImg('images/lovecard1ta.png');
        } else {
          setCharImg('images/server.png');
        }
        setIsLargeChar(true);
      }

      if (cardCtx?.id === 'love_reunion') {
        if (msg.sender === '咖啡店老板') {
          setCharImg('images/server.png');
        } else if (msg.sender === '好友阿哲') {
          setCharImg('images/azhe.png');
        } else if (msg.sender === 'TA') {
          setCharImg('images/ta.jpeg');
        }
      }

      // Background triggers
      if (msg.text.includes('你真的来了。说实话，我昨天写完纸条就后悔了')) {
        setBgImage('url(images/lovecard1Background2.jpeg)');
      }
      if (cardCtx?.id === 'love_reunion' && msg.text.includes('二位要点什么')) {
        setBgImage('url(images/lovecard1Background2.jpeg)');
      }
      if (cardCtx?.id === 'love_reunion' && msg.text.includes('我刚才好像看到')) {
        setBgImage('url(images/lovecard2Background2.jpeg)');
      }
      if (cardCtx?.id === 'love_reunion' && msg.text.includes('气喘吁吁地出现')) {
        setBgImage('url(images/lovecard2.jpg)');
      }
    },
    [],
  );

  const handleTap = useCallback(() => {
    if (love.isShowingPrompt || !card || !phaseId) return;
    const phase = card.phases[phaseId];
    if (!phase) return;
    const messages = phase.messages ?? [];

    if (msgIndexRef.current < messages.length - 1) {
      msgIndexRef.current++;
      showMessage(messages[msgIndexRef.current], card);
    } else if (phase.prompt && phase.options) {
      dispatch({ type: 'LOVE_SHOW_PROMPT', prompt: phase.prompt, options: phase.options });
    }
  }, [love.isShowingPrompt, card, phaseId, showMessage, dispatch]);

  const handleChoice = useCallback(
    (choiceId: number) => {
      if (!love.isShowingPrompt || !love.currentOptions) return;
      const option = love.currentOptions.find((o) => o.id === choiceId);
      if (!option || !card) return;

      dispatch({ type: 'LOVE_PUSH_CHOICE', choice: choiceId });
      dispatch({ type: 'LOVE_HIDE_PROMPT' });
      lastPhaseRef.current = null;

      const nextPhase = card.phases[option.next];
      if (!nextPhase) return;

      if (nextPhase.isEnd) {
        dispatch({ type: 'LOVE_FINISH' });
        return;
      }

      if (card.id === 'love_crush' && option.next === 'crush_2b') {
        dispatch({ type: 'LOVE_CHAT_MODE', value: true });
        dispatch({ type: 'SELECT_CARD', cardId: card.id });
        dispatch({ type: 'SET_PHASE', phaseId: 'crush_2b' });
        return;
      }
      if (card.id === 'love_reunion' && option.next === 'reun_3d') {
        dispatch({ type: 'LOVE_CHAT_MODE', value: true });
        dispatch({ type: 'SELECT_CARD', cardId: card.id });
        dispatch({ type: 'SET_PHASE', phaseId: 'reun_3d' });
        return;
      }

      dispatch({ type: 'LOVE_SET_PHASE', phaseId: option.next });
    },
    [love, card, dispatch],
  );

  const handleBack = useCallback(() => {
    dispatch({ type: 'GO_HOME' });
  }, [dispatch]);

  if (!card) return null;

  return (
    <div
      className="page active"
      id="page-love-story"
      style={{ display: 'flex', backgroundImage: bgImage }}
    >
      <div className="ls-topbar">
        <button className="ls-back-btn" onClick={handleBack}>
          ✕ 退出
        </button>
        <span className="ls-story-title">{card.title}</span>
      </div>

      <LoveStoryCardOverlay
        title={card.title}
        desc={card.desc}
        show={showStoryCard}
        onClose={() => setShowStoryCard(false)}
      />

      <div className="ls-stage" onClick={handleTap}>
        <div className="ls-bottom-row">
          <div className="ls-char-area">
            <div className="ls-char-avatar">
              <img
                src={charImg}
                alt=""
                className={isLargeChar ? 'char-large' : ''}
              />
            </div>
            <div className="ls-char-name">{charName}</div>
          </div>

          <div className="ls-dialog-area">
            <div className="ls-dialog-bubble">
              <p className="ls-dialog-text">{displayText}</p>
            </div>

            {showChoices && (
              <div className="ls-choices" style={{ display: 'flex' }}>
                <button
                  className="ls-choice-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoice(1);
                  }}
                >
                  {choiceTexts[0]}
                </button>
                <button
                  className="ls-choice-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoice(2);
                  }}
                >
                  {choiceTexts[1]}
                </button>
              </div>
            )}

            {showTapHint && (
              <div className="ls-tap-hint">点击继续 ▼</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
