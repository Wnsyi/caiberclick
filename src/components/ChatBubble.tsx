interface ChatBubbleProps {
  role: 'ai' | 'user';
  text: string;
}

export default function ChatBubble({ role, text }: ChatBubbleProps) {
  const isAI = role === 'ai';

  return (
    <div className={`flex gap-3 mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {/* AI头像 */}
      {isAI && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-lg">
          👨‍⚕️
        </div>
      )}

      {/* 气泡 */}
      <div
        className={`
          max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${
            isAI
              ? 'bg-purple-900/40 border border-purple-700/30 rounded-tl-sm text-amber-100'
              : 'bg-amber-500/15 border border-amber-400/20 rounded-tr-sm text-amber-50'
          }
        `}
      >
        {text}
      </div>

      {/* 用户头像 */}
      {!isAI && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-lg">
          🫵
        </div>
      )}
    </div>
  );
}
