/**
 * 全局应用上下文
 * 管理问诊流程中的所有状态：身份选择、对话记录、MBTI结果、处方数据
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { MBTIResult } from '../utils/nlp';
import type { PrescriptionData } from '../utils/prescription';

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

interface AppState {
  /** 用户选择的身份标签ID */
  identityTag: string | null;
  /** 问诊对话记录 */
  messages: ChatMessage[];
  /** NLP分析结果 */
  mbtiResult: MBTIResult | null;
  /** 处方数据 */
  prescription: PrescriptionData | null;
  /** 当前对话轮次（用户回答次数） */
  dialogueRound: number;
  /** 处方在CloudBase中的文档ID，用于分享计数 */
  prescriptionDocId: string | null;
  /** 分享次数 */
  shareCount: number;
  /** 彩蛋触发次数 */
  easterEggClicks: number;
}

interface AppContextType extends AppState {
  setIdentityTag: (tag: string) => void;
  addMessage: (message: ChatMessage) => void;
  setMBTIResult: (result: MBTIResult) => void;
  setPrescription: (prescription: PrescriptionData) => void;
  incrementRound: () => void;
  setPrescriptionDocId: (id: string) => void;
  incrementShareCount: () => void;
  incrementEasterEggClicks: () => void;
  resetEasterEggClicks: () => void;
  resetAll: () => void;
  resetConversation: () => void;
}

const initialState: AppState = {
  identityTag: null,
  messages: [],
  mbtiResult: null,
  prescription: null,
  dialogueRound: 0,
  prescriptionDocId: null,
  shareCount: 0,
  easterEggClicks: 0,
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const setIdentityTag = useCallback((tag: string) => {
    setState(prev => ({ ...prev, identityTag: tag }));
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  const setMBTIResult = useCallback((result: MBTIResult) => {
    setState(prev => ({ ...prev, mbtiResult: result }));
  }, []);

  const setPrescription = useCallback((prescription: PrescriptionData) => {
    setState(prev => ({ ...prev, prescription }));
  }, []);

  const incrementRound = useCallback(() => {
    setState(prev => ({ ...prev, dialogueRound: prev.dialogueRound + 1 }));
  }, []);

  const setPrescriptionDocId = useCallback((id: string) => {
    setState(prev => ({ ...prev, prescriptionDocId: id }));
  }, []);

  const incrementShareCount = useCallback(() => {
    setState(prev => ({ ...prev, shareCount: prev.shareCount + 1 }));
  }, []);

  const incrementEasterEggClicks = useCallback(() => {
    setState(prev => ({ ...prev, easterEggClicks: prev.easterEggClicks + 1 }));
  }, []);

  const resetEasterEggClicks = useCallback(() => {
    setState(prev => ({ ...prev, easterEggClicks: 0 }));
  }, []);

  const resetAll = useCallback(() => {
    setState(initialState);
  }, []);

  const resetConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      mbtiResult: null,
      prescription: null,
      dialogueRound: 0,
      prescriptionDocId: null,
      shareCount: 0,
      easterEggClicks: 0,
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setIdentityTag,
        addMessage,
        setMBTIResult,
        setPrescription,
        incrementRound,
        setPrescriptionDocId,
        incrementShareCount,
        incrementEasterEggClicks,
        resetEasterEggClicks,
        resetAll,
        resetConversation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
