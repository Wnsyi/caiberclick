import type { BaseCard } from './gameTypes';

export function buildResults(
  card: BaseCard,
  resultsData: Record<string, { personalityId: number }>,
): void {
  card.results = {};
  for (const [path, data] of Object.entries(resultsData)) {
    card.results[path] = data;
  }
}

export function populateCardResults(cards: BaseCard[]): void {
  const map: Record<string, Record<string, { personalityId: number }>> = {
    lottery: {
      '1-1-1': { personalityId: 3 },
      '1-1-2': { personalityId: 2 },
      '1-2-1': { personalityId: 3 },
      '1-2-2': { personalityId: 15 },
      '2-1-1': { personalityId: 12 },
      '2-1-2': { personalityId: 4 },
      '2-2-1': { personalityId: 11 },
      '2-2-2': { personalityId: 15 },
    },
    hogwarts: {
      '1-1-1': { personalityId: 5 },
      '1-1-2': { personalityId: 14 },
      '1-2-1': { personalityId: 5 },
      '1-2-2': { personalityId: 14 },
      '2-1-1': { personalityId: 6 },
      '2-1-2': { personalityId: 14 },
      '2-2-1': { personalityId: 1 },
      '2-2-2': { personalityId: 16 },
    },
    invisible: {
      '1-1-1': { personalityId: 16 },
      '1-1-2': { personalityId: 16 },
      '1-2-1': { personalityId: 6 },
      '1-2-2': { personalityId: 12 },
      '2-1-1': { personalityId: 3 },
      '2-1-2': { personalityId: 13 },
      '2-2-1': { personalityId: 9 },
      '2-2-2': { personalityId: 5 },
    },
    reunion: {
      '1-1-1': { personalityId: 7 },
      '1-1-2': { personalityId: 9 },
      '1-2-1': { personalityId: 10 },
      '1-2-2': { personalityId: 6 },
      '2-1-1': { personalityId: 1 },
      '2-1-2': { personalityId: 3 },
      '2-2-1': { personalityId: 10 },
      '2-2-2': { personalityId: 9 },
    },
    gaokao: {
      '1-1-1': { personalityId: 1 },
      '1-1-2': { personalityId: 6 },
      '1-2-1': { personalityId: 7 },
      '1-2-2': { personalityId: 11 },
      '2-1-1': { personalityId: 8 },
      '2-1-2': { personalityId: 11 },
      '2-2-1': { personalityId: 16 },
      '2-2-2': { personalityId: 8 },
    },
    timeloop: {
      '1-1-1': { personalityId: 1 },
      '1-1-2': { personalityId: 5 },
      '1-2-1': { personalityId: 7 },
      '1-2-2': { personalityId: 8 },
      '2-1-1': { personalityId: 6 },
      '2-1-2': { personalityId: 11 },
      '2-2-1': { personalityId: 13 },
      '2-2-2': { personalityId: 11 },
    },
    love_crush: {
      '1-1-1': { personalityId: 1 },
      '1-1-2': { personalityId: 11 },
      '1-2-1': { personalityId: 6 },
      '1-2-2': { personalityId: 12 },
      '2-1-1': { personalityId: 1 },
      '2-1-2': { personalityId: 14 },
      '2-2-1': { personalityId: 3 },
      '2-2-2': { personalityId: 13 },
    },
    love_reunion: {
      '1-1-1': { personalityId: 1 },
      '1-1-2': { personalityId: 11 },
      '1-2-1': { personalityId: 9 },
      '1-2-2': { personalityId: 10 },
      '2-1-1': { personalityId: 1 },
      '2-1-2': { personalityId: 14 },
      '2-2-1': { personalityId: 12 },
      '2-2-2': { personalityId: 13 },
    },
  };

  for (const card of cards) {
    const results = map[card.id];
    if (results) buildResults(card, results);
  }
}

// 16 personality SVG graphics
const _SVG_RAW: Record<number, string> = {
  1: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FF6B4A"/><stop offset="100%" stop-color="#E0442B"/></linearGradient></defs>
    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#g1)" stroke-width="2.5"/>
    <polygon points="42,30 82,60 42,90" fill="none" stroke="url(#g1)" stroke-width="3" stroke-linejoin="round"/>
    <line x1="60" y1="60" x2="82" y2="60" stroke="url(#g1)" stroke-width="3" stroke-linecap="round"/>
    <line x1="48" y1="45" x2="82" y2="60" stroke="url(#g1)" stroke-width="2" stroke-linecap="round"/>
    <line x1="48" y1="75" x2="82" y2="60" stroke="url(#g1)" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  2: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5B8CDE"/><stop offset="100%" stop-color="#3A6FC4"/></linearGradient></defs>
    <circle cx="60" cy="60" r="48" fill="none" stroke="url(#g2)" stroke-width="2" opacity="0.25"/>
    <circle cx="60" cy="60" r="34" fill="none" stroke="url(#g2)" stroke-width="2.5"/>
    <line x1="28" y1="60" x2="92" y2="60" stroke="url(#g2)" stroke-width="2" opacity="0.4"/>
    <circle cx="60" cy="60" r="6" fill="url(#g2)"/>
  </svg>`,
  3: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#00A86B"/><stop offset="100%" stop-color="#007D4F"/></linearGradient></defs>
    <path d="M60,20 L82,38 L82,62 L60,80 L38,62 L38,38 Z" fill="none" stroke="url(#g3)" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60,38 L72,48 L72,60 L60,70 L48,60 L48,48 Z" fill="url(#g3)" opacity="0.35"/>
    <circle cx="60" cy="50" r="8" fill="none" stroke="url(#g3)" stroke-width="2"/>
  </svg>`,
  4: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#7C3AED"/><stop offset="100%" stop-color="#5B21B6"/></linearGradient></defs>
    <polygon points="60,18 68,42 94,42 74,58 82,82 60,66 38,82 46,58 26,42 52,42" fill="none" stroke="url(#g4)" stroke-width="2.2" stroke-linejoin="round"/>
    <polygon points="60,32 64,46 78,46 66,56 70,70 60,60 50,70 54,56 42,46 56,46" fill="url(#g4)" opacity="0.4"/>
  </svg>`,
  5: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#D946EF"/><stop offset="100%" stop-color="#A21CAF"/></linearGradient></defs>
    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#g5)" stroke-width="1.5" opacity="0.2"/>
    <path d="M60,20 Q82,40 60,60 Q38,80 60,100" fill="none" stroke="url(#g5)" stroke-width="2.5"/>
    <path d="M60,20 Q38,40 60,60 Q82,80 60,100" fill="none" stroke="url(#g5)" stroke-width="1.5" opacity="0.4"/>
    <circle cx="60" cy="60" r="5" fill="url(#g5)"/>
  </svg>`,
  6: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g6" cx="50%" cy="50%"><stop offset="0%" stop-color="#F5A623"/><stop offset="100%" stop-color="#E08E0B"/></radialGradient></defs>
    <circle cx="60" cy="60" r="20" fill="url(#g6)" opacity="0.3"/>
    <circle cx="60" cy="60" r="8" fill="url(#g6)"/>
    <line x1="60" y1="28" x2="60" y2="16" stroke="url(#g6)" stroke-width="3" stroke-linecap="round"/>
    <line x1="60" y1="92" x2="60" y2="104" stroke="url(#g6)" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="60" x2="16" y2="60" stroke="url(#g6)" stroke-width="3" stroke-linecap="round"/>
    <line x1="92" y1="60" x2="104" y2="60" stroke="url(#g6)" stroke-width="3" stroke-linecap="round"/>
    <line x1="37" y1="37" x2="29" y2="29" stroke="url(#g6)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="83" y1="37" x2="91" y2="29" stroke="url(#g6)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="37" y1="83" x2="29" y2="91" stroke="url(#g6)" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="83" y1="83" x2="91" y2="91" stroke="url(#g6)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  7: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g7" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#8B6914"/><stop offset="100%" stop-color="#C49A2A"/></linearGradient></defs>
    <rect x="32" y="22" width="56" height="22" rx="3" fill="none" stroke="url(#g7)" stroke-width="2.5"/>
    <rect x="28" y="48" width="64" height="22" rx="3" fill="none" stroke="url(#g7)" stroke-width="2.5"/>
    <rect x="36" y="74" width="48" height="22" rx="3" fill="none" stroke="url(#g7)" stroke-width="2.5"/>
    <rect x="32" y="22" width="20" height="22" rx="3" fill="url(#g7)" opacity="0.2"/>
    <rect x="28" y="48" width="26" height="22" rx="3" fill="url(#g7)" opacity="0.25"/>
    <rect x="36" y="74" width="16" height="22" rx="3" fill="url(#g7)" opacity="0.3"/>
  </svg>`,
  8: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#06B6D4"/><stop offset="100%" stop-color="#0891B2"/></linearGradient></defs>
    <path d="M42,70 Q30,50 42,32 Q54,20 60,14 Q66,20 78,32 Q90,50 78,70" fill="none" stroke="url(#g8)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M60,14 Q68,28 78,34" fill="none" stroke="url(#g8)" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    <path d="M60,14 Q52,28 42,34" fill="none" stroke="url(#g8)" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
    <circle cx="60" cy="84" r="3" fill="url(#g8)"/>
  </svg>`,
  9: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g9" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#EC4899"/><stop offset="100%" stop-color="#DB2777"/></linearGradient></defs>
    <path d="M60,20 Q44,40 44,56 Q44,76 60,76 Q76,76 76,56 Q76,40 60,20 Z" fill="none" stroke="url(#g9)" stroke-width="2.5"/>
    <path d="M44,64 Q50,72 60,72 Q70,72 76,64" fill="none" stroke="url(#g9)" stroke-width="2" opacity="0.5"/>
    <circle cx="60" cy="48" r="6" fill="url(#g9)" opacity="0.5"/>
  </svg>`,
  10: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g10" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366F1"/><stop offset="100%" stop-color="#4F46E5"/></linearGradient></defs>
    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#g10)" stroke-width="1.5" opacity="0.15"/>
    <path d="M78,30 A36,36 0 1,0 82,72" fill="none" stroke="url(#g10)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="72" cy="38" r="2" fill="url(#g10)"/>
    <circle cx="82" cy="48" r="1.5" fill="url(#g10)" opacity="0.7"/>
    <circle cx="86" cy="58" r="1.2" fill="url(#g10)" opacity="0.5"/>
    <circle cx="40" cy="78" r="1.5" fill="url(#g10)" opacity="0.4"/>
    <circle cx="32" cy="68" r="1" fill="url(#g10)" opacity="0.3"/>
  </svg>`,
  11: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g11" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#84CC16"/><stop offset="100%" stop-color="#65A30D"/></linearGradient></defs>
    <circle cx="60" cy="60" r="48" fill="none" stroke="url(#g11)" stroke-width="1.5" opacity="0.2"/>
    <path d="M60,20 Q72,38 68,56 Q64,74 60,86" fill="none" stroke="url(#g11)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M60,20 Q48,38 52,56 Q56,74 60,86" fill="none" stroke="url(#g11)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M60,86 Q44,94 32,98" fill="none" stroke="url(#g11)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M60,86 Q76,94 88,98" fill="none" stroke="url(#g11)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
  </svg>`,
  12: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g12" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#F97316"/><stop offset="100%" stop-color="#EA580C"/></linearGradient></defs>
    <ellipse cx="60" cy="60" rx="28" ry="18" fill="none" stroke="url(#g12)" stroke-width="2.5"/>
    <circle cx="60" cy="60" r="10" fill="url(#g12)" opacity="0.55"/>
    <circle cx="60" cy="60" r="4" fill="#FFF8E7"/>
    <path d="M22,60 Q38,42 60,46 Q82,50 98,60" fill="none" stroke="url(#g12)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22,60 Q38,78 60,74 Q82,70 98,60" fill="none" stroke="url(#g12)" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,
  13: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g13" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#EAB308"/><stop offset="100%" stop-color="#CA8A04"/></linearGradient></defs>
    <circle cx="46" cy="60" r="18" fill="none" stroke="url(#g13)" stroke-width="2.5"/>
    <circle cx="74" cy="60" r="18" fill="none" stroke="url(#g13)" stroke-width="2.5"/>
    <circle cx="46" cy="60" r="5" fill="url(#g13)" opacity="0.5"/>
    <circle cx="74" cy="60" r="5" fill="url(#g13)" opacity="0.5"/>
  </svg>`,
  14: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g14" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0D9488"/><stop offset="100%" stop-color="#0F766E"/></linearGradient></defs>
    <rect x="18" y="18" width="84" height="84" rx="6" fill="none" stroke="url(#g14)" stroke-width="2" opacity="0.25"/>
    <line x1="48" y1="18" x2="48" y2="102" stroke="url(#g14)" stroke-width="2" opacity="0.3"/>
    <line x1="72" y1="18" x2="72" y2="102" stroke="url(#g14)" stroke-width="2" opacity="0.3"/>
    <line x1="18" y1="40" x2="102" y2="40" stroke="url(#g14)" stroke-width="2" opacity="0.3"/>
    <line x1="18" y1="64" x2="102" y2="64" stroke="url(#g14)" stroke-width="2" opacity="0.3"/>
    <line x1="18" y1="88" x2="102" y2="88" stroke="url(#g14)" stroke-width="2" opacity="0.3"/>
    <rect x="26" y="26" width="18" height="10" rx="2" fill="url(#g14)" opacity="0.5"/>
    <rect x="50" y="44" width="18" height="10" rx="2" fill="url(#g14)" opacity="0.4"/>
    <rect x="74" y="68" width="18" height="10" rx="2" fill="url(#g14)" opacity="0.35"/>
  </svg>`,
  15: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g15" cx="50%" cy="40%"><stop offset="0%" stop-color="#FF6B9D"/><stop offset="100%" stop-color="#E0446A"/></radialGradient></defs>
    <path d="M60,34 C60,34 38,52 38,72 C38,88 50,100 60,100 C70,100 82,88 82,72 C82,52 60,34 60,34 Z" fill="none" stroke="url(#g15)" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50,68 Q60,80 70,68" fill="none" stroke="url(#g15)" stroke-width="2" opacity="0.5"/>
    <circle cx="52" cy="62" r="2.5" fill="url(#g15)" opacity="0.5"/>
    <circle cx="68" cy="62" r="2.5" fill="url(#g15)" opacity="0.5"/>
  </svg>`,
  16: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g16" cx="50%" cy="50%"><stop offset="0%" stop-color="#F5A623"/><stop offset="70%" stop-color="#F5A62320"/><stop offset="100%" stop-color="#F5A62300"/></radialGradient></defs>
    <circle cx="60" cy="60" r="52" fill="url(#g16)" opacity="0.2"/>
    <path d="M60,24 L68,48 L94,48 L74,64 L82,88 L60,72 L38,88 L46,64 L26,48 L52,48 Z" fill="none" stroke="#C49A2A" stroke-width="2" stroke-linejoin="round" opacity="0.4"/>
    <circle cx="60" cy="56" r="14" fill="none" stroke="#C49A2A" stroke-width="2"/>
    <path d="M54,56 L58,60 L66,52" fill="none" stroke="#C49A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

let _svgUid = 0;

export function getPersonalityGraphicSVG(pid: number): string {
  _svgUid++;
  const raw = _SVG_RAW[pid];
  if (!raw) return '';
  return raw
    .replace(/id="g(\d+)"/g, 'id="g$1_u' + _svgUid + '"')
    .replace(/url\(#g(\d+)\)/g, 'url(#g$1_u' + _svgUid + ')');
}

export function getCardBackGraphic(): string {
  const letters = ['F', 'J', 'C', 'W', 'Q', 'L', 'W', 'W', 'X', 'Y'];
  const cx = 60,
    cy = 60,
    r = 38,
    n = letters.length;
  let els = '';
  for (let i = 0; i < n; i++) {
    const angle = ((i * 360) / n - 90) * Math.PI / 180;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    els += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-size="16" font-weight="700" fill="rgba(60,40,20,0.35)">${letters[i]}</text>`;
  }
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(60,40,20,0.12)" stroke-width="1"/>
    <circle cx="60" cy="60" r="30" fill="none" stroke="rgba(60,40,20,0.08)" stroke-width="0.8"/>
    ${els}
    <circle cx="60" cy="60" r="5" fill="rgba(60,40,20,0.2)"/>
  </svg>`;
}
