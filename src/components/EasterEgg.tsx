interface EasterEggProps {
  visible: boolean;
  quote: string;
  onClose: () => void;
}

export default function EasterEgg({ visible, quote, onClose }: EasterEggProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-purple-950 to-indigo-950 border-2 border-amber-400/50 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">💊</div>
        <h2 className="text-amber-300 font-bold text-lg mb-2">
          🌀 发疯语录 🌀
        </h2>
        <p className="text-amber-100 text-sm leading-relaxed italic">
          "{quote}"
        </p>
        <p className="text-xs text-purple-400/50 mt-4">
          赛博华佗温馨提示：发疯是正常的，不发疯才需要挂号。
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs hover:bg-amber-500/30 transition-all"
        >
          我好了（暂时）
        </button>
      </div>
    </div>
  );
}
