interface IdentityTagProps {
  id: string;
  label: string;
  emoji: string;
  description: string;
  selected: boolean;
  onClick: (id: string) => void;
}

export default function IdentityTag({
  id,
  label,
  emoji,
  description,
  selected,
  onClick,
}: IdentityTagProps) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`
        relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-300
        ${
          selected
            ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/20 scale-[1.02]'
            : 'border-purple-900/40 bg-purple-900/20 hover:border-amber-400/50 hover:bg-purple-900/30'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-amber-200 text-base">{label}</div>
          <div className="text-xs text-purple-300/60 mt-0.5 leading-relaxed">
            {description}
          </div>
        </div>
        {selected && (
          <span className="text-amber-400 text-lg flex-shrink-0">✓</span>
        )}
      </div>
    </button>
  );
}
