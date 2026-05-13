import type { LightField, GroupPerson, PositionParams } from './gameTypes';
import { PERSONALITY_CHARACTERS } from './personalities';

export const CAPSULE_COLORS: string[] = [
  '#F0A090', '#F8C880', '#90B8F0', '#70D0A0',
  '#A080F0', '#FFA0C0', '#70C8C0', '#FFB890',
  '#E890F0', '#FAA870', '#80D8F0', '#B0E870',
  '#A0A0F8', '#F090C0', '#80D8D0', '#F0D070',
];

export const GACHA_CARD_ICONS: string[] = [
  '💎', '🌟', '🔮', '🎯', '🌙', '🦋', '🔥', '🍀',
  '💫', '⚡', '🌊', '🎪', '🗝️', '🌸', '💜', '🍄',
];

export const CONFETTI_COLORS: string[] = [
  '#E5902F', '#F5A623', '#E07060', '#7C3AED', '#5B8CDE',
  '#0D9488', '#00A86B', '#FF6B9D', '#FFD93D', '#C084FC',
];

export const FILM_IMAGES: string[] = Object.values(PERSONALITY_CHARACTERS);

export const LIGHT_SEQUENCE: LightField[] = [
  { d: 1800, c: 'purple', l: 'green',  r: 'orange' },
  { d: 1800, c: 'orange', l: null,     r: 'green' },
  { d: 1800, c: 'orange', l: 'green',  r: 'purple' },
  { d: 1800, c: 'green',  l: 'purple', r: null },
  { d: 1800, c: 'orange', l: 'purple', r: 'green' },
  { d: 1800, c: 'purple', l: null,     r: null },
  { d: 1800, c: 'green',  l: 'purple', r: 'orange' },
  { d: 1800, c: 'green',  l: null,     r: 'orange' },
  { d: 1800, c: 'green',  l: 'orange', r: 'purple' },
  { d: 1800, c: 'purple', l: 'green',  r: null },
  { d: 1800, c: 'purple', l: 'orange', r: 'green' },
];

export const GROUP_PERSONS: GroupPerson[] = [
  { images: ['images/ta.jpeg', 'images/ta.0.jpg', 'images/ta.1.jpg', 'images/ta.2.jpg', 'images/ta.3.jpg', 'images/ta.4.jpg'] },
  { images: ['images/lovecard1ta.png', 'images/cta.0.jpg', 'images/cta.1.jpg?v=2', 'images/cta.2.jpg', 'images/cta.3.jpg', 'images/cta.4.jpg'] },
  { images: ['images/azhe.png', 'images/azhe.0.jpg', 'images/azhe.1.jpg?v=2', 'images/azhe.2.jpg', 'images/azhe.3.jpg', 'images/azhe.4.jpg'] },
];

export const POS_PARAMS: Record<string, PositionParams> = {
  left:   { txOffset: -0.32, scale: 0.38, zIndex: '4' },
  center: { txOffset: 0,     scale: 1,    zIndex: '6' },
  right:  { txOffset: 0.32,  scale: 0.38, zIndex: '4' },
};

export const TRANS_DUR = '0.7s';
export const TRANS_EASE = 'cubic-bezier(0.4,0,0.2,1)';
