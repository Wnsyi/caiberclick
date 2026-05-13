export interface GameMessage {
  sender: string;
  text: string;
}

export interface GameOption {
  id: number;
  text: string;
  next: string;
}

export interface GamePhase {
  chatName: string;
  messages: GameMessage[];
  prompt: string;
  options: GameOption[];
  isEnd?: boolean;
}

export interface BaseCard {
  id: string;
  emoji: string;
  badge: string;
  stars: number;
  reviews: string;
  title: string;
  desc: string;
  slideClass: string;
  imgSrc: string;
  avatarColors: Record<string, string>;
  startPhase: string;
  results: Record<string, { personalityId: number }> | null;
  phases: Record<string, GamePhase>;
}

export interface PersonalityArchetype {
  id: number;
  persona: string;
  dia: string;
  med: string;
  usage: string;
  advice: string;
}

export interface LightField {
  d: number;
  c: string | null;
  l: string | null;
  r: string | null;
}

export interface GroupPerson {
  images: string[];
}

export interface PositionParams {
  txOffset: number;
  scale: number;
  zIndex: string;
}

export interface ConfettiParticle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  op: number;
  rot: number;
  rotSpd: number;
}
