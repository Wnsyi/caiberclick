interface ShareFooterProps {
  onRestart: () => void;
  onRetry: () => void;
}

export default function ShareFooter({ onRestart, onRetry }: ShareFooterProps) {
  return (
    <div className="flex flex-col items-center gap-3 mt-6">
      <button
        onClick={onRestart}
        className="w-full max-w-xs px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:scale-105 transition-all active:scale-95"
      >
        🔄 重新挑选角色
      </button>

      <button
        onClick={onRetry}
        className="w-full max-w-xs px-6 py-2.5 rounded-full bg-purple-800/40 border border-purple-600/30 text-purple-200 text-sm hover:bg-purple-800/60 transition-all"
      >
        🔁 再测一次
      </button>
    </div>
  );
}
