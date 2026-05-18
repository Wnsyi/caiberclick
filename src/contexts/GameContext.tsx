import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { BaseCard, GameOption } from '../data/gameTypes';
import { EXPERIENCE_CARDS } from '../data/experienceCards';
import { LOVE_CARDS } from '../data/loveCards';

// ---- State types ----

export interface GameState {
  currentCard: BaseCard | null;
  currentPhase: string | null;
  choicePath: number[];
  isPlaying: boolean;
  awaitingChoice: boolean;
  currentOptions: GameOption[] | null;
  messageQueue: { sender: string; text: string }[];
  isShowingMessages: boolean;
}

export interface LoveState {
  currentCard: BaseCard | null;
  currentPhase: string | null;
  choicePath: number[];
  messageQueue: { sender: string; text: string }[];
  messageIndex: number;
  isShowingPrompt: boolean;
  currentOptions: GameOption[] | null;
}

export interface GachaState {
  collected: number;
  order: number[];
  collectedFlags: boolean[];
}

export type PageId = 'page-landing' | 'page-home' | 'page-chat' | 'page-love-story' | 'page-result';

export interface AppState {
  page: PageId;
  game: GameState;
  love: LoveState;
  gacha: GachaState;
  loveChatMode: boolean;
  cardReviews: Record<string, string>;
}

// ---- Actions ----

export type GameAction =
  | { type: 'SET_PAGE'; page: PageId }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'SET_PHASE'; phaseId: string }
  | { type: 'PUSH_CHOICE'; choice: number }
  | { type: 'SET_AWAITING_CHOICE'; value: boolean; options: GameOption[] | null }
  | { type: 'SET_SHOWING_MESSAGES'; value: boolean }
  | { type: 'FINISH_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'RETRY_SAME_CARD' }
  | { type: 'GO_HOME' }
  // Love story
  | { type: 'LOVE_SELECT_CARD'; cardId: string }
  | { type: 'LOVE_SET_PHASE'; phaseId: string }
  | { type: 'LOVE_PUSH_CHOICE'; choice: number }
  | { type: 'LOVE_NEXT_MESSAGE' }
  | { type: 'LOVE_SHOW_PROMPT'; prompt: string; options: GameOption[] }
  | { type: 'LOVE_HIDE_PROMPT' }
  | { type: 'LOVE_FINISH' }
  | { type: 'LOVE_CHAT_MODE'; value: boolean }
  // Gacha
  | { type: 'GACHA_INIT' }
  | { type: 'GACHA_COLLECT'; slotIndex: number }
  | { type: 'GACHA_REVEAL_ALL' }
  | { type: 'SET_CARD_REVIEWS'; cardId: string; reviews: string };

// ---- Initial state ----

const initialGame: GameState = {
  currentCard: null,
  currentPhase: null,
  choicePath: [],
  isPlaying: false,
  awaitingChoice: false,
  currentOptions: null,
  messageQueue: [],
  isShowingMessages: false,
};

const initialLove: LoveState = {
  currentCard: null,
  currentPhase: null,
  choicePath: [],
  messageQueue: [],
  messageIndex: 0,
  isShowingPrompt: false,
  currentOptions: null,
};

function shuffleArray(a: number[]): number[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const initialGacha: GachaState = {
  collected: 0,
  order: shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
  collectedFlags: Array(16).fill(false),
};

const initialState: AppState = {
  page: 'page-landing',
  game: initialGame,
  love: initialLove,
  gacha: initialGacha,
  loveChatMode: false,
  cardReviews: {},
};

// ---- Reducer ----

function findCard(cardId: string): BaseCard | undefined {
  return EXPERIENCE_CARDS.find((c) => c.id === cardId) ?? LOVE_CARDS.find((c) => c.id === cardId);
}

function gameReducer(state: AppState, action: GameAction): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, page: action.page };

    case 'SELECT_CARD': {
      const card = findCard(action.cardId);
      if (!card) return state;
      return {
        ...state,
        page: 'page-chat',
        game: {
          ...initialGame,
          currentCard: card,
          currentPhase: card.startPhase,
          isPlaying: true,
        },
      };
    }

    case 'SET_PHASE':
      return {
        ...state,
        game: { ...state.game, currentPhase: action.phaseId },
      };

    case 'PUSH_CHOICE':
      return {
        ...state,
        game: {
          ...state.game,
          choicePath: [...state.game.choicePath, action.choice],
        },
      };

    case 'SET_AWAITING_CHOICE':
      return {
        ...state,
        game: {
          ...state.game,
          awaitingChoice: action.value,
          currentOptions: action.options,
        },
      };

    case 'SET_SHOWING_MESSAGES':
      return {
        ...state,
        game: { ...state.game, isShowingMessages: action.value },
      };

    case 'FINISH_GAME':
      return {
        ...state,
        page: 'page-result',
        game: { ...state.game, isPlaying: false },
      };

    case 'RESET_GAME':
      return { ...state, game: initialGame };

    case 'RETRY_SAME_CARD': {
      const cardId = state.game.currentCard?.id;
      if (!cardId) return { ...state, game: initialGame, page: 'page-home' };
      const card = findCard(cardId);
      if (!card) return { ...state, game: initialGame, page: 'page-home' };
      if (cardId.startsWith('love_')) {
        return {
          ...state,
          page: 'page-love-story',
          game: initialGame,
          love: { ...initialLove, currentCard: card, currentPhase: card.startPhase },
        };
      }
      return {
        ...state,
        page: 'page-chat',
        game: { ...initialGame, currentCard: card, currentPhase: card.startPhase, isPlaying: true },
      };
    }

    case 'GO_HOME':
      return {
        ...state,
        page: 'page-home',
        game: initialGame,
        love: initialLove,
        loveChatMode: false,
      };

    // Love story actions
    case 'LOVE_SELECT_CARD': {
      const loveCard = LOVE_CARDS.find((c) => c.id === action.cardId);
      if (!loveCard) return state;
      return {
        ...state,
        page: 'page-love-story',
        love: {
          ...initialLove,
          currentCard: loveCard,
          currentPhase: loveCard.startPhase,
        },
      };
    }

    case 'LOVE_SET_PHASE':
      return {
        ...state,
        love: { ...state.love, currentPhase: action.phaseId },
      };

    case 'LOVE_PUSH_CHOICE':
      return {
        ...state,
        love: {
          ...state.love,
          choicePath: [...state.love.choicePath, action.choice],
        },
      };

    case 'LOVE_NEXT_MESSAGE':
      return {
        ...state,
        love: {
          ...state.love,
          messageIndex: state.love.messageIndex + 1,
        },
      };

    case 'LOVE_SHOW_PROMPT':
      return {
        ...state,
        love: {
          ...state.love,
          isShowingPrompt: true,
          currentOptions: action.options,
        },
      };

    case 'LOVE_HIDE_PROMPT':
      return {
        ...state,
        love: {
          ...state.love,
          isShowingPrompt: false,
          currentOptions: null,
        },
      };

    case 'LOVE_FINISH': {
      const loveCard = state.love.currentCard;
      return {
        ...state,
        page: 'page-result',
        game: {
          ...state.game,
          currentCard: loveCard,
          choicePath: [...state.love.choicePath],
          isPlaying: false,
        },
      };
    }

    case 'LOVE_CHAT_MODE':
      return { ...state, loveChatMode: action.value };

    // Gacha
    case 'GACHA_INIT':
      return {
        ...state,
        gacha: initialGacha,
      };

    case 'GACHA_COLLECT': {
      if (action.slotIndex < 0 || action.slotIndex >= 16) return state;
      const newFlags = [...state.gacha.collectedFlags];
      newFlags[action.slotIndex] = true;
      return {
        ...state,
        gacha: {
          ...state.gacha,
          collected: state.gacha.collected + 1,
          collectedFlags: newFlags,
          order: state.gacha.order.filter((i) => i !== action.slotIndex),
        },
      };
    }

    case 'GACHA_REVEAL_ALL':
      return {
        ...state,
        gacha: {
          collected: 16,
          order: [],
          collectedFlags: Array(16).fill(true),
        },
      };

    case 'SET_CARD_REVIEWS': {
      return {
        ...state,
        cardReviews: { ...state.cardReviews, [action.cardId]: action.reviews },
      };
    }

    default:
      return state;
  }
}

// ---- Context ----

const GameCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </GameCtx.Provider>
  );
}

export function useGameState(): AppState {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const ctx = useContext(DispatchCtx);
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider');
  return ctx;
}
