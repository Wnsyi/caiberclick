import { useState, useRef, useCallback } from 'react';

// Web Speech API 类型声明（浏览器原生支持，但TypeScript可能缺少）
interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

/**
 * 语音输入组件
 *
 * 【技术说明】
 * 使用浏览器 Web Speech API 进行语音识别。
 * 兼容性：Chrome/Edge 完整支持，Firefox/Safari 部分支持或需HTTPS。
 *
 * 【交互设计】
 * 按住按钮开始录音，松开后识别并回调文本。类似微信语音消息体验。
 */

interface VoiceInputProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onResult, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    // 检查浏览器是否支持 Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false; // 仅返回最终结果
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        onResult(transcript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn('[VoiceInput] 语音识别错误:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  if (!isSupported) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-full bg-gray-700/50 text-gray-400 text-sm cursor-not-allowed"
        title="您的浏览器不支持语音识别"
      >
        🎤 语音不可用
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      onMouseDown={startListening}
      onMouseUp={stopListening}
      onMouseLeave={stopListening}
      onTouchStart={startListening}
      onTouchEnd={stopListening}
      className={`
        px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 select-none
        ${isListening
          ? 'bg-red-500/80 text-white animate-pulse shadow-lg shadow-red-500/30 scale-105'
          : 'bg-amber-500/20 border border-amber-400/30 text-amber-200 hover:bg-amber-500/30'
        }
      `}
    >
      {isListening ? '🎤 正在倾听...' : '🎤 按住说话'}
    </button>
  );
}
