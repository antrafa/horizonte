import type { GameCard, Rank, Suit, ThemeDeck } from '../types/card';

export interface ThemeVisualSpec {
  id: string;
  nomeTema: string;
  estetica: string;
  skyTop: string;
  skyMid: string;
  skyBot: string;
  accent: string;
  accent2: string;
  cardPaper: string;
  cardInk: string;
  cardSubtle: string;
  scene:
    | 'wasteland'
    | 'zombies'
    | 'neon'
    | 'eclipse'
    | 'vampires'
    | 'expedicao'
    | 'noir'
    | 'orbital'
    | 'arcana'
    | 'corsarios'
    | 'kaiju'
    | 'floresta';
}

export const THEME_VISUALS: Record<string, ThemeVisualSpec> = {
  wasteland: {
    id: 'wasteland',
    nomeTema: 'Cinzas do Horizonte',
    estetica: 'Post-apocalyptic wasteland sunset, rusting highway ruins, amber dust storms, Mad Max & Fallout painterly illustration',
    skyTop: '#261409',
    skyMid: '#9a3412',
    skyBot: '#f59e0b',
    accent: '#fbbf24',
    accent2: '#ea580c',
    cardPaper: '#fff7e6',
    cardInk: '#29170a',
    cardSubtle: '#d97706',
    scene: 'wasteland',
  },
  zombies: {
    id: 'zombies',
    nomeTema: 'Protocolo Zumbi',
    estetica: 'Urban quarantine outbreak night, amber searchlights cutting toxic olive fog, abandoned barricades, atmospheric survival horror art',
    skyTop: '#0d140e',
    skyMid: '#1f3320',
    skyBot: '#4d7c0f',
    accent: '#a3e635',
    accent2: '#f59e0b',
    cardPaper: '#f5f9ed',
    cardInk: '#141e12',
    cardSubtle: '#65a30d',
    scene: 'zombies',
  },
  neon: {
    id: 'neon',
    nomeTema: 'Crônicas de Neon',
    estetica: 'Cyberpunk rain-soaked megacity, cyan and magenta holograms, chrome reflections, synthwave chiaroscuro concept art',
    skyTop: '#080b1c',
    skyMid: '#1e1b4b',
    skyBot: '#4c1d95',
    accent: '#22d3ee',
    accent2: '#f472b6',
    cardPaper: '#0f172a',
    cardInk: '#e0f2fe',
    cardSubtle: '#22d3ee',
    scene: 'neon',
  },
  eclipse: {
    id: 'eclipse',
    nomeTema: 'O Último Eclipse',
    estetica: 'Dark fantasy solar eclipse twilight, glowing golden corona, basalt spires and drifting embers, museum tarot engraving',
    skyTop: '#0d0907',
    skyMid: '#3b1d0a',
    skyBot: '#92400e',
    accent: '#fcd34d',
    accent2: '#f97316',
    cardPaper: '#fdf8eb',
    cardInk: '#1c1208',
    cardSubtle: '#b45309',
    scene: 'eclipse',
  },
  vampires: {
    id: 'vampires',
    nomeTema: 'Sangue & Néon',
    estetica: 'Gothic vampire nocturnal cathedral, blood moon glow, velvet crimson shadows and brass filigree, dark romanticism illustration',
    skyTop: '#16050c',
    skyMid: '#4c0519',
    skyBot: '#9f1239',
    accent: '#fda4af',
    accent2: '#f43f5e',
    cardPaper: '#fff1f2',
    cardInk: '#280712',
    cardSubtle: '#be123c',
    scene: 'vampires',
  },
  expedicao: {
    id: 'expedicao',
    nomeTema: 'A Expedição Perdida',
    estetica: '1920s pulp jungle expedition, emerald canopy mist, lost stone pyramid, antique brass compass cartography and warm parchment',
    skyTop: '#071a13',
    skyMid: '#064e3b',
    skyBot: '#059669',
    accent: '#fde68a',
    accent2: '#34d399',
    cardPaper: '#faf5e8',
    cardInk: '#14261c',
    cardSubtle: '#047857',
    scene: 'expedicao',
  },
  noir: {
    id: 'noir',
    nomeTema: 'Cidade de Neblina',
    estetica: '1940s detective noir metropolis, sodium streetlamp cones through rain, art deco skyline shadows, high-contrast sepia ink',
    skyTop: '#100e0c',
    skyMid: '#292218',
    skyBot: '#574228',
    accent: '#fbbf24',
    accent2: '#d97706',
    cardPaper: '#f9f3e8',
    cardInk: '#1c1814',
    cardSubtle: '#9a4708',
    scene: 'noir',
  },
  orbital: {
    id: 'orbital',
    nomeTema: 'Estação Orbital 9',
    estetica: 'Hard sci-fi deep space station interior & curved planet horizon, cold ice-cyan console glow and solar arrays, crisp technical concept art',
    skyTop: '#030816',
    skyMid: '#0c2340',
    skyBot: '#0284c7',
    accent: '#7dd3fc',
    accent2: '#38bdf8',
    cardPaper: '#091526',
    cardInk: '#e0f2fe',
    cardSubtle: '#38bdf8',
    scene: 'orbital',
  },
  arcana: {
    id: 'arcana',
    nomeTema: 'Academia Arcana',
    estetica: 'Astral magic conservatory, midnight indigo starvault, gold astrolabe rings and luminous violet glyphs, illuminated grimoire art',
    skyTop: '#100826',
    skyMid: '#2e1065',
    skyBot: '#5b21b6',
    accent: '#fde047',
    accent2: '#c4b5fd',
    cardPaper: '#f7f4ff',
    cardInk: '#1d1138',
    cardSubtle: '#6d28d9',
    scene: 'arcana',
  },
  corsarios: {
    id: 'corsarios',
    nomeTema: 'Corsários do Céu',
    estetica: 'Steampunk sky-pirate archipelago at golden dusk, cerulean cloud sea, brass airship rigging and tattered canvas sails',
    skyTop: '#082032',
    skyMid: '#0e7490',
    skyBot: '#f59e0b',
    accent: '#fef08a',
    accent2: '#38bdf8',
    cardPaper: '#fcf7ea',
    cardInk: '#102636',
    cardSubtle: '#0c637a',
    scene: 'corsarios',
  },
  kaiju: {
    id: 'kaiju',
    nomeTema: 'Alerta Kaiju',
    estetica: 'Coastal storm alert at Pacific bay, radar sonar rings, giant harbor cranes and lightning over towering silhouettes, tokusatsu poster art',
    skyTop: '#041414',
    skyMid: '#115e59',
    skyBot: '#0d9488',
    accent: '#fb923c',
    accent2: '#5eead4',
    cardPaper: '#f1fbf9',
    cardInk: '#092220',
    cardSubtle: '#0f766e',
    scene: 'kaiju',
  },
  floresta: {
    id: 'floresta',
    nomeTema: 'Contos da Floresta Antiga',
    estetica: 'Enchanted ancient moss forest bathed in emerald sunbeams, glowing fireflies and gnarled roots, Storybook gouache painting',
    skyTop: '#071408',
    skyMid: '#14532d',
    skyBot: '#3f6212',
    accent: '#bef264',
    accent2: '#fde047',
    cardPaper: '#f7faef',
    cardInk: '#142611',
    cardSubtle: '#3f6212',
    scene: 'floresta',
  },
};

function escapeXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function suitColorHex(suit: Suit, darkCard: boolean): string {
  if (suit === 'hearts' || suit === 'diamonds') return darkCard ? '#fb7185' : '#b91c1c';
  if (suit === 'joker') return darkCard ? '#c4b5fd' : '#6d28d9';
  return darkCard ? '#e2e8f0' : '#18181b';
}

function suitShapePath(suit: Suit, cx: number, cy: number, size: number, fill: string): string {
  const s = size;
  if (suit === 'hearts') {
    return `<path d="M${cx} ${cy + s * 0.72} C${cx - s * 0.9} ${cy + s * 0.15} ${cx - s * 0.9} ${cy - s * 0.65} ${cx} ${cy - s * 0.25} C${cx + s * 0.9} ${cy - s * 0.65} ${cx + s * 0.9} ${cy + s * 0.15} ${cx} ${cy + s * 0.72}Z" fill="${fill}" />`;
  }
  if (suit === 'diamonds') {
    return `<path d="M${cx} ${cy - s * 0.78} L${cx + s * 0.62} ${cy} L${cx} ${cy + s * 0.78} L${cx - s * 0.62} ${cy}Z" fill="${fill}" />`;
  }
  if (suit === 'clubs') {
    const r = s * 0.34;
    return `
      <g fill="${fill}">
        <circle cx="${cx}" cy="${cy - s * 0.36}" r="${r}" />
        <circle cx="${cx - s * 0.36}" cy="${cy + s * 0.12}" r="${r}" />
        <circle cx="${cx + s * 0.36}" cy="${cy + s * 0.12}" r="${r}" />
        <path d="M${cx} ${cy + s * 0.12} L${cx + s * 0.22} ${cy + s * 0.72} L${cx - s * 0.22} ${cy + s * 0.72}Z" />
      </g>`;
  }
  if (suit === 'spades') {
    return `
      <g fill="${fill}">
        <path d="M${cx} ${cy - s * 0.78} C${cx - s * 0.85} ${cy - s * 0.12} ${cx - s * 0.78} ${cy + s * 0.45} ${cx} ${cy + s * 0.28} C${cx + s * 0.78} ${cy + s * 0.45} ${cx + s * 0.85} ${cy - s * 0.12} ${cx} ${cy - s * 0.78}Z" />
        <path d="M${cx} ${cy + s * 0.18} L${cx + s * 0.22} ${cy + s * 0.74} L${cx - s * 0.22} ${cy + s * 0.74}Z" />
      </g>`;
  }
  return `<path d="M${cx} ${cy - s * 0.78} L${cx + s * 0.24} ${cy - s * 0.2} L${cx + s * 0.82} ${cy} L${cx + s * 0.24} ${cy + s * 0.2} L${cx} ${cy + s * 0.78} L${cx - s * 0.24} ${cy + s * 0.2} L${cx - s * 0.82} ${cy} L${cx - s * 0.24} ${cy - s * 0.2}Z" fill="${fill}" />`;
}

const PIP_COORDS: Record<string, Array<[number, number]>> = {
  '2': [
    [0, -0.58],
    [0, 0.58],
  ],
  '3': [
    [0, -0.62],
    [0, 0],
    [0, 0.62],
  ],
  '4': [
    [-0.42, -0.55],
    [0.42, -0.55],
    [-0.42, 0.55],
    [0.42, 0.55],
  ],
  '5': [
    [-0.44, -0.55],
    [0.44, -0.55],
    [0, 0],
    [-0.44, 0.55],
    [0.44, 0.55],
  ],
  '6': [
    [-0.44, -0.58],
    [0.44, -0.58],
    [-0.44, 0],
    [0.44, 0],
    [-0.44, 0.58],
    [0.44, 0.58],
  ],
  '7': [
    [-0.44, -0.6],
    [0.44, -0.6],
    [0, -0.26],
    [-0.44, 0.08],
    [0.44, 0.08],
    [-0.44, 0.6],
    [0.44, 0.6],
  ],
  '8': [
    [-0.44, -0.62],
    [0.44, -0.62],
    [0, -0.28],
    [-0.44, 0.05],
    [0.44, 0.05],
    [0, 0.34],
    [-0.44, 0.64],
    [0.44, 0.64],
  ],
  '9': [
    [-0.44, -0.64],
    [0.44, -0.64],
    [-0.44, -0.22],
    [0.44, -0.22],
    [0, 0],
    [-0.44, 0.22],
    [0.44, 0.22],
    [-0.44, 0.64],
    [0.44, 0.64],
  ],
  '10': [
    [-0.44, -0.64],
    [0.44, -0.64],
    [0, -0.4],
    [-0.44, -0.18],
    [0.44, -0.18],
    [-0.44, 0.18],
    [0.44, 0.18],
    [0, 0.4],
    [-0.44, 0.64],
    [0.44, 0.64],
  ],
};

function renderCrownOrEmblem(rank: Rank, cx: number, cy: number, color: string, accent: string): string {
  if (rank === 'K') {
    return `
      <path d="M${cx - 8} ${cy + 3} L${cx - 10} ${cy - 6} L${cx - 4} ${cy - 1} L${cx} ${cy - 9} L${cx + 4} ${cy - 1} L${cx + 10} ${cy - 6} L${cx + 8} ${cy + 3}Z" fill="${accent}" stroke="${color}" stroke-width="0.9" />
      <rect x="${cx - 8.5}" y="${cy + 3}" width="17" height="2.6" rx="1" fill="${color}" />`;
  }
  if (rank === 'Q') {
    return `
      <path d="M${cx - 7.5} ${cy + 3} Q${cx} ${cy - 8} ${cx + 7.5} ${cy + 3}Z" fill="${accent}" fill-opacity="0.85" stroke="${color}" stroke-width="0.85" />
      <circle cx="${cx}" cy="${cy - 6.5}" r="1.7" fill="${accent}" stroke="${color}" stroke-width="0.7" />
      <circle cx="${cx - 5.2}" cy="${cy - 2.5}" r="1.3" fill="${accent}" stroke="${color}" stroke-width="0.6" />
      <circle cx="${cx + 5.2}" cy="${cy - 2.5}" r="1.3" fill="${accent}" stroke="${color}" stroke-width="0.6" />`;
  }
  if (rank === 'J') {
    return `
      <path d="M${cx - 6} ${cy + 3} L${cx - 6} ${cy - 3} Q${cx} ${cy - 9} ${cx + 6} ${cy - 3} L${cx + 6} ${cy + 3}Z" fill="${accent}" fill-opacity="0.78" stroke="${color}" stroke-width="0.85" />
      <path d="M${cx} ${cy - 8} L${cx} ${cy + 3} M${cx - 5} ${cy - 1} L${cx + 5} ${cy - 1}" stroke="${color}" stroke-width="0.8" />`;
  }
  return '';
}

function renderBackdropScenery(vis: ThemeVisualSpec, w: number, h: number): string {
  const horizonY = Math.round(h * 0.72);
  switch (vis.scene) {
    case 'wasteland':
      return `
        <circle cx="${w * 0.72}" cy="${h * 0.36}" r="${w * 0.24}" fill="${vis.accent}" fill-opacity="0.24" />
        <circle cx="${w * 0.72}" cy="${h * 0.36}" r="${w * 0.14}" fill="${vis.accent}" fill-opacity="0.58" />
        <path d="M0 ${horizonY} L${w * 0.16} ${horizonY - 12} L${w * 0.25} ${horizonY - 5} L${w * 0.44} ${horizonY - 16} L${w * 0.61} ${horizonY - 7} L${w * 0.78} ${horizonY - 22} L${w} ${horizonY - 9} L${w} ${h} L0 ${h}Z" fill="#1b1109" fill-opacity="0.82" />
        <path d="M${w * 0.74} ${horizonY - 4} L${w * 0.76} ${h * 0.28} L${w * 0.79} ${horizonY - 4} M${w * 0.71} ${h * 0.4} L${w * 0.81} ${h * 0.37}" stroke="#1b1109" stroke-width="1.6" />
        <path d="M${w * 0.45} ${horizonY + 2} Q${w * 0.72} ${horizonY - 10} ${w} ${horizonY - 2}" stroke="${vis.accent}" stroke-opacity="0.4" stroke-width="1.3" fill="none" />
        <circle cx="${w * 0.65}" cy="${h * 0.26}" r="1.5" fill="${vis.accent}" fill-opacity="0.8" />
        <circle cx="${w * 0.88}" cy="${h * 0.52}" r="1.3" fill="${vis.accent}" fill-opacity="0.7" />`;

    case 'zombies':
      return `
        <polygon points="${w * 0.68},${horizonY} ${w * 0.52},0 ${w * 0.65},0" fill="${vis.accent}" fill-opacity="0.16" />
        <polygon points="${w * 0.84},${horizonY} ${w * 0.88},0 ${w},0" fill="${vis.accent2}" fill-opacity="0.18" />
        <path d="M0 ${horizonY + 2} L${w * 0.11} ${horizonY - 14} L${w * 0.11} ${horizonY - 4} L${w * 0.2} ${horizonY - 20} L${w * 0.28} ${horizonY - 20} L${w * 0.28} ${horizonY - 6} L${w * 0.57} ${horizonY - 12} L${w * 0.67} ${horizonY - 26} L${w * 0.77} ${horizonY - 26} L${w * 0.77} ${horizonY - 7} L${w * 0.89} ${horizonY - 16} L${w} ${horizonY - 8} L${w} ${h} L0 ${h}Z" fill="#091109" fill-opacity="0.86" />
        <path d="M${w * 0.54} ${horizonY} L${w} ${horizonY - 4} M${w * 0.6} ${horizonY - 8} L${w * 0.6} ${h} M${w * 0.71} ${horizonY - 9} L${w * 0.71} ${h} M${w * 0.82} ${horizonY - 8} L${w * 0.82} ${h} M${w * 0.92} ${horizonY - 7} L${w * 0.92} ${h}" stroke="${vis.accent}" stroke-opacity="0.28" stroke-width="1" />`;

    case 'neon':
      return `
        <g stroke="${vis.accent}" stroke-opacity="0.25" stroke-width="0.85">
          <line x1="0" y1="${horizonY}" x2="${w}" y2="${horizonY}" />
          <line x1="0" y1="${horizonY + 12}" x2="${w}" y2="${horizonY + 12}" />
          <line x1="${w * 0.45}" y1="${horizonY}" x2="${w * 0.08}" y2="${h}" />
          <line x1="${w * 0.55}" y1="${horizonY}" x2="${w * 0.5}" y2="${h}" />
          <line x1="${w * 0.65}" y1="${horizonY}" x2="${w * 0.88}" y2="${h}" />
          <line x1="${w * 0.75}" y1="${horizonY}" x2="${w}" y2="${h}" />
        </g>
        <path d="M0 ${horizonY} L${w * 0.08} ${horizonY - 28} L${w * 0.17} ${horizonY - 28} L${w * 0.17} ${horizonY - 8} L${w * 0.58} ${horizonY - 18} L${w * 0.66} ${horizonY - 46} L${w * 0.76} ${horizonY - 46} L${w * 0.76} ${horizonY - 22} L${w * 0.84} ${horizonY - 36} L${w * 0.94} ${horizonY - 36} L${w * 0.94} ${horizonY - 12} L${w} ${horizonY - 20} L${w} ${horizonY}Z" fill="#050816" fill-opacity="0.85" />
        <line x1="${w * 0.71}" y1="${horizonY - 40}" x2="${w * 0.71}" y2="${horizonY - 14}" stroke="${vis.accent2}" stroke-width="2.4" />
        <line x1="${w * 0.89}" y1="${horizonY - 30}" x2="${w * 0.89}" y2="${horizonY - 10}" stroke="${vis.accent}" stroke-width="2" />
        <line x1="${w * 0.92}" y1="14" x2="${w * 0.86}" y2="48" stroke="${vis.accent}" stroke-opacity="0.45" stroke-width="0.9" />`;

    case 'eclipse':
      return `
        <circle cx="${w * 0.72}" cy="${h * 0.34}" r="${w * 0.24}" fill="${vis.accent}" fill-opacity="0.24" />
        <circle cx="${w * 0.72}" cy="${h * 0.34}" r="${w * 0.17}" fill="${vis.accent}" fill-opacity="0.85" />
        <circle cx="${w * 0.72}" cy="${h * 0.34}" r="${w * 0.135}" fill="#0c0806" />
        <path d="M0 ${horizonY} L${w * 0.19} ${horizonY - 16} L${w * 0.36} ${horizonY - 7} L${w * 0.57} ${horizonY - 22} L${w * 0.69} ${horizonY - 10} L${w * 0.85} ${horizonY - 26} L${w} ${horizonY - 12} L${w} ${h} L0 ${h}Z" fill="#0d0806" fill-opacity="0.86" />
        <circle cx="${w * 0.58}" cy="${h * 0.2}" r="1.4" fill="${vis.accent}" />
        <circle cx="${w * 0.9}" cy="${h * 0.18}" r="1.6" fill="${vis.accent2}" />`;

    case 'vampires':
      return `
        <circle cx="${w * 0.74}" cy="${h * 0.32}" r="${w * 0.2}" fill="${vis.accent2}" fill-opacity="0.32" />
        <circle cx="${w * 0.74}" cy="${h * 0.32}" r="${w * 0.14}" fill="${vis.accent}" fill-opacity="0.72" />
        <path d="M${w * 0.54} ${horizonY} Q${w * 0.62} ${h * 0.18} ${w * 0.69} ${horizonY} M${w * 0.71} ${horizonY} Q${w * 0.79} ${h * 0.12} ${w * 0.87} ${horizonY} M${w * 0.88} ${horizonY} Q${w * 0.94} ${h * 0.22} ${w} ${horizonY}" stroke="#24050f" stroke-width="2.4" fill="none" />
        <path d="M0 ${horizonY} L${w} ${horizonY - 6} L${w} ${h} L0 ${h}Z" fill="#18040b" fill-opacity="0.85" />
        <path d="M${w * 0.58} ${horizonY - 4} Q${w * 0.78} ${horizonY - 20} ${w} ${horizonY - 3}" stroke="${vis.accent2}" stroke-opacity="0.55" stroke-width="1" fill="none" />`;

    case 'expedicao':
      return `
        <circle cx="${w * 0.74}" cy="${h * 0.38}" r="${w * 0.22}" stroke="${vis.accent}" stroke-opacity="0.32" stroke-width="0.9" stroke-dasharray="2.5 2.5" fill="none" />
        <path d="M${w * 0.65} ${horizonY} L${w * 0.7} ${horizonY - 12} L${w * 0.73} ${horizonY - 12} L${w * 0.75} ${horizonY - 24} L${w * 0.81} ${horizonY - 24} L${w * 0.83} ${horizonY - 12} L${w * 0.86} ${horizonY - 12} L${w * 0.9} ${horizonY}Z" fill="#041911" fill-opacity="0.82" />
        <path d="M0 ${horizonY} Q${w * 0.25} ${horizonY - 20} ${w * 0.54} ${horizonY - 6} T${w} ${horizonY - 8} L${w} ${h} L0 ${h}Z" fill="#052116" fill-opacity="0.88" />
        <path d="M${w * 0.58} ${h * 0.24} L${w * 0.92} ${h * 0.24} M${w * 0.75} ${h * 0.12} L${w * 0.75} ${h * 0.68}" stroke="${vis.accent}" stroke-opacity="0.26" stroke-width="0.8" />`;

    case 'noir':
      return `
        <polygon points="${w * 0.78},${h * 0.16} ${w * 0.62},${h} ${w * 0.94},${h}" fill="${vis.accent}" fill-opacity="0.16" />
        <circle cx="${w * 0.78}" cy="${h * 0.18}" r="4.5" fill="${vis.accent}" fill-opacity="0.85" />
        <path d="M0 ${horizonY} L${w * 0.1} ${horizonY - 32} L${w * 0.22} ${horizonY - 32} L${w * 0.22} ${horizonY - 12} L${w * 0.56} ${horizonY - 24} L${w * 0.69} ${horizonY - 48} L${w * 0.77} ${horizonY - 48} L${w * 0.77} ${horizonY - 18} L${w * 0.9} ${horizonY - 34} L${w} ${horizonY - 34} L${w} ${h} L0 ${h}Z" fill="#0f0c0a" fill-opacity="0.82" />
        <g stroke="#000000" stroke-opacity="0.22" stroke-width="1">
          <line x1="0" y1="16" x2="${w}" y2="16" />
          <line x1="0" y1="28" x2="${w}" y2="28" />
        </g>`;

    case 'orbital':
      return `
        <circle cx="${w * 0.82}" cy="${h * 0.84}" r="${w * 0.55}" fill="${vis.skyBot}" fill-opacity="0.42" stroke="${vis.accent}" stroke-opacity="0.7" stroke-width="1.4" />
        <ellipse cx="${w * 0.72}" cy="${h * 0.35}" rx="${w * 0.22}" ry="14" transform="rotate(-14 ${w * 0.72} ${h * 0.35})" stroke="${vis.accent}" stroke-opacity="0.45" stroke-width="1" fill="none" />
        <circle cx="${w * 0.58}" cy="${h * 0.14}" r="1.2" fill="#ffffff" />
        <circle cx="${w * 0.68}" cy="${h * 0.22}" r="1.5" fill="${vis.accent}" />
        <circle cx="${w * 0.88}" cy="${h * 0.16}" r="1.1" fill="#ffffff" />
        <circle cx="${w * 0.92}" cy="${h * 0.3}" r="1.3" fill="#ffffff" />`;

    case 'arcana':
      return `
        <circle cx="${w * 0.74}" cy="${h * 0.4}" r="${w * 0.24}" stroke="${vis.accent}" stroke-opacity="0.45" stroke-width="1" fill="none" />
        <circle cx="${w * 0.74}" cy="${h * 0.4}" r="${w * 0.17}" stroke="${vis.accent2}" stroke-opacity="0.45" stroke-width="0.9" stroke-dasharray="2.5 2.5" fill="none" />
        <polygon points="${w * 0.74},${h * 0.2} ${w * 0.84},${h * 0.54} ${w * 0.64},${h * 0.54}" stroke="${vis.accent}" stroke-opacity="0.38" stroke-width="0.9" fill="none" />
        <circle cx="${w * 0.58}" cy="${h * 0.22}" r="1.5" fill="${vis.accent}" />
        <circle cx="${w * 0.88}" cy="${h * 0.24}" r="1.3" fill="${vis.accent}" />
        <circle cx="${w * 0.86}" cy="${h * 0.6}" r="1.6" fill="${vis.accent2}" />`;

    case 'corsarios':
      return `
        <circle cx="${w * 0.8}" cy="${h * 0.3}" r="${w * 0.16}" fill="${vis.accent}" fill-opacity="0.65" />
        <path d="M${w * 0.62} ${h * 0.48} Q${w * 0.75} ${h * 0.53} ${w * 0.88} ${h * 0.46} L${w * 0.85} ${h * 0.56} L${w * 0.65} ${h * 0.56}Z" fill="#0d2230" />
        <path d="M${w * 0.74} ${h * 0.48} L${w * 0.74} ${h * 0.24} L${w * 0.83} ${h * 0.42}Z" fill="${vis.accent}" fill-opacity="0.55" />
        <path d="M0 ${horizonY + 4} Q${w * 0.17} ${horizonY - 12} ${w * 0.34} ${horizonY + 4} T${w * 0.68} ${horizonY - 3} T${w} ${horizonY + 4} L${w} ${h} L0 ${h}Z" fill="#f8fafc" fill-opacity="0.22" />`;

    case 'kaiju':
      return `
        <circle cx="${w * 0.75}" cy="${h * 0.42}" r="${w * 0.16}" stroke="${vis.accent}" stroke-opacity="0.45" stroke-width="1" fill="none" />
        <circle cx="${w * 0.75}" cy="${h * 0.42}" r="${w * 0.26}" stroke="${vis.accent2}" stroke-opacity="0.3" stroke-width="0.9" stroke-dasharray="3.5 2.5" fill="none" />
        <path d="M${w * 0.65} 14 L${w * 0.7} 40 L${w * 0.66} 44 L${w * 0.73} 74" stroke="${vis.accent}" stroke-width="1.5" fill="none" />
        <path d="M0 ${horizonY} L${w * 0.13} ${horizonY - 18} L${w * 0.21} ${horizonY - 6} L${w * 0.58} ${horizonY - 14} L${w * 0.68} ${horizonY - 34} L${w * 0.77} ${horizonY - 22} L${w * 0.89} ${horizonY - 40} L${w} ${horizonY - 14} L${w} ${h} L0 ${h}Z" fill="#041212" fill-opacity="0.88" />`;

    case 'floresta':
    default:
      return `
        <polygon points="${w * 0.66},0 ${w * 0.56},${h} ${w * 0.72},${h}" fill="${vis.accent}" fill-opacity="0.14" />
        <polygon points="${w * 0.84},0 ${w * 0.77},${h} ${w * 0.92},${h}" fill="${vis.accent2}" fill-opacity="0.12" />
        <path d="M0 ${horizonY + 4} Q${w * 0.28} ${horizonY - 16} ${w * 0.6} ${horizonY - 3} T${w} ${horizonY - 10} L${w} ${h} L0 ${h}Z" fill="#071a09" fill-opacity="0.86" />
        <path d="M${w * 0.64} ${h} L${w * 0.66} ${h * 0.14} M${w * 0.84} ${h} L${w * 0.82} ${h * 0.1}" stroke="#061407" stroke-width="4.2" />
        <circle cx="${w * 0.6}" cy="${h * 0.3}" r="1.7" fill="${vis.accent2}" />
        <circle cx="${w * 0.73}" cy="${h * 0.22}" r="1.4" fill="${vis.accent}" />
        <circle cx="${w * 0.9}" cy="${h * 0.4}" r="1.8" fill="${vis.accent2}" />`;
  }
}

function isFigureCard(card: GameCard): boolean {
  return card.kind === 'archetype_king' || card.kind === 'trump_queen' || card.kind === 'scar_jack';
}

function renderPlayingCardMini(card: GameCard, vis: ThemeVisualSpec, cx: number, cy: number): string {
  const isFig = isFigureCard(card);
  const cardW = isFig ? 76 : 62;
  const cardH = isFig ? 108 : 88;
  const x = cx - cardW / 2;
  const y = cy - cardH / 2;

  const darkCard = vis.id === 'neon' || vis.id === 'orbital';
  const ink = suitColorHex(card.suit, darkCard);
  const code = escapeXml(card.playingCardCode);

  let interior = '';
  if (isFig) {
    const crestY = cy - 8;
    interior = `
      <rect x="${x + 9}" y="${y + 18}" width="${cardW - 18}" height="${cardH - 36}" rx="4" fill="${vis.cardSubtle}" fill-opacity="0.11" stroke="${vis.cardSubtle}" stroke-opacity="0.55" stroke-width="0.9" />
      ${renderCrownOrEmblem(card.rank, cx, crestY - 8, ink, vis.accent)}
      ${suitShapePath(card.suit, cx, crestY + 18, 12.5, ink)}
      <text x="${cx}" y="${y + cardH - 21}" text-anchor="middle" font-size="16" font-weight="800" fill="${vis.cardInk}">${escapeXml(card.rank)}</text>`;
  } else if (card.rank === 'A') {
    interior = `
      <circle cx="${cx}" cy="${cy}" r="15" fill="${vis.cardSubtle}" fill-opacity="0.14" stroke="${vis.cardSubtle}" stroke-opacity="0.45" stroke-width="0.8" />
      ${suitShapePath(card.suit, cx, cy, 12.5, ink)}`;
  } else if (card.kind === 'joker') {
    interior = `
      <circle cx="${cx}" cy="${cy}" r="16" fill="${ink}" fill-opacity="0.14" stroke="${ink}" stroke-opacity="0.55" stroke-width="0.8" />
      ${suitShapePath('joker', cx, cy, 12.5, ink)}`;
  } else {
    const coords = PIP_COORDS[card.rank] ?? [[0, 0]];
    const pipScale = coords.length >= 8 ? 3.8 : coords.length >= 5 ? 4.4 : 5.2;
    interior = coords
      .map(([px, py]) => suitShapePath(card.suit, cx + px * (cardW * 0.32), cy + py * (cardH * 0.3), pipScale, ink))
      .join('');
  }

  const cornerSize = isFig ? 10.5 : 9;

  return `
    <!-- Carta sombra em leque atrás da carta principal -->
    <g transform="translate(12, 4) rotate(7 ${cx} ${cy})" opacity="0.68">
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="5" fill="${vis.cardSubtle}" stroke="${vis.accent}" stroke-width="0.95" />
    </g>

    <!-- Carta principal temática na janela de arte -->
    <g transform="rotate(-5 ${cx} ${cy})">
      <rect x="${x + 2.5}" y="${y + 3}" width="${cardW}" height="${cardH}" rx="5" fill="#000000" fill-opacity="0.38" />
      <rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="5" fill="${vis.cardPaper}" stroke="${vis.accent}" stroke-width="1.4" />
      <rect x="${x + 3.5}" y="${y + 3.5}" width="${cardW - 7}" height="${cardH - 7}" rx="3.2" fill="none" stroke="${vis.cardSubtle}" stroke-opacity="0.6" stroke-width="0.8" />
      <text x="${x + 6.5}" y="${y + cornerSize + 4}" font-family="Cinzel, Georgia, serif" font-size="${cornerSize}" font-weight="800" fill="${ink}">${code}</text>
      <text x="${x + cardW - 6.5}" y="${y + cardH - 5.5}" text-anchor="end" font-family="Cinzel, Georgia, serif" font-size="${cornerSize}" font-weight="800" fill="${ink}">${code}</text>
      ${interior}
    </g>`;
}

export const THEMES_WITH_GENERATED_CARDS: ReadonlySet<string> = new Set([
  'expedicao',
  'noir',
  'corsarios',
  'floresta',
  'eclipse',
  'vampires',
  'arcana',
  'kaiju',
  'wasteland',
  'zombies',
  'neon',
  'orbital',
]);

export function getGeneratedCardArtPath(card: GameCard): string | undefined {
  if (!THEMES_WITH_GENERATED_CARDS.has(card.themeId)) return undefined;
  if (card.kind === 'joker') {
    return `/cards/${card.themeId}/${card.rank === 'JOKER_LIGHT' ? 'joker-light' : 'joker-dark'}.jpg`;
  }
  return `/cards/${card.themeId}/${card.rank}-${card.suit}.jpg`;
}

export function getGeneratedCardBackPath(themeId: string): string | undefined {
  if (!THEMES_WITH_GENERATED_CARDS.has(themeId)) return undefined;
  return `./cards/${themeId}/back.jpg`;
}

function renderConstellationLines(
  coords: Array<[number, number]>,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  strokeColor: string,
): string {
  if (coords.length < 2) return '';
  const points = coords
    .map(([px, py]) => `${(cx + px * rx).toFixed(1)},${(cy + py * ry).toFixed(1)}`)
    .join(' ');
  return `<polyline points="${points}" fill="none" stroke="${strokeColor}" stroke-opacity="0.52" stroke-width="0.65" stroke-linejoin="round" />`;
}

function renderConceptualCardInterior(
  card: GameCard,
  vis: ThemeVisualSpec,
  cardCx: number,
  cy: number,
  cardW: number,
  cardH: number,
  ink: string,
): string {
  if (card.kind === 'joker') {
    return `
      <circle cx="${cardCx}" cy="${cy}" r="42" fill="none" stroke="${vis.accent}" stroke-opacity="0.62" stroke-width="1.1" stroke-dasharray="3.2 2.5" />
      <circle cx="${cardCx}" cy="${cy - 18}" r="18" fill="${vis.accent}" fill-opacity="0.18" stroke="${vis.accent}" stroke-width="0.95" />
      ${suitShapePath('joker', cardCx, cy - 18, 17, vis.accent)}
      <circle cx="${cardCx}" cy="${cy + 24}" r="16" fill="${ink}" fill-opacity="0.14" stroke="${ink}" stroke-opacity="0.62" stroke-width="0.95" />
      <circle cx="${cardCx - 5.2}" cy="${cy + 22}" r="2.6" fill="${ink}" />
      <circle cx="${cardCx + 5.2}" cy="${cy + 22}" r="2.6" fill="${ink}" />
      <line x1="${cardCx - 5}" y1="${cy + 31}" x2="${cardCx + 5}" y2="${cy + 31}" stroke="${ink}" stroke-width="1.1" />`;
  }
  if (card.rank === 'A') {
    return `
      <circle cx="${cardCx}" cy="${cy}" r="44" fill="none" stroke="${vis.accent}" stroke-opacity="0.72" stroke-width="1.1" />
      <polygon points="${cardCx},${cy - 38} ${cardCx + 38},${cy} ${cardCx},${cy + 38} ${cardCx - 38},${cy}" fill="none" stroke="${vis.cardSubtle}" stroke-opacity="0.62" stroke-width="0.95" />
      <polygon points="${cardCx - 26},${cy - 26} ${cardCx + 26},${cy - 26} ${cardCx + 26},${cy + 26} ${cardCx - 26},${cy + 26}" fill="none" stroke="${vis.accent}" stroke-opacity="0.42" stroke-width="0.85" />
      ${suitShapePath(card.suit, cardCx, cy, 28, ink)}`;
  }
  const coords = PIP_COORDS[card.rank] ?? [[0, 0]];
  const rx = cardW * 0.32;
  const ry = cardH * 0.3;
  const leyLines = renderConstellationLines(coords, cardCx, cy, rx, ry, vis.accent);
  const pipScale = coords.length >= 8 ? 7.2 : coords.length >= 5 ? 8.4 : 9.8;
  const pips = coords
    .map(([px, py]) => suitShapePath(card.suit, cardCx + px * rx, cy + py * ry, pipScale, ink))
    .join('');
  return `${leyLines}${pips}`;
}

function renderConceptualCardDiagramSvg(card: GameCard, vis: ThemeVisualSpec): string {
  const w = 252;
  const h = 352;
  const gid = safeId(card.id);
  const bgGrad = `bg_${gid}`;
  const haloGrad = `halo_${gid}`;
  const cx = w / 2;
  const cy = 148;
  const darkCard = vis.id === 'neon' || vis.id === 'orbital';
  const ink = suitColorHex(card.suit, darkCard);
  const code = escapeXml(card.playingCardCode);
  const artPath = getGeneratedCardArtPath(card);

  if (artPath) {
    return `
      <svg class="mtg-art-engraving mtg-art-scene-svg mtg-art-conceptual-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
        <image href="${escapeXml(artPath)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" />
      </svg>`;
  }

  return `
    <svg class="mtg-art-engraving mtg-art-scene-svg mtg-art-conceptual-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="${bgGrad}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${vis.cardPaper}" stop-opacity="${darkCard ? '0.98' : '0.94'}" />
          <stop offset="55%" stop-color="${vis.skyMid}" stop-opacity="0.18" />
          <stop offset="100%" stop-color="${vis.cardSubtle}" stop-opacity="0.32" />
        </linearGradient>
        <radialGradient id="${haloGrad}" cx="0.5" cy="0.42" r="0.52">
          <stop offset="0%" stop-color="${vis.accent}" stop-opacity="0.34" />
          <stop offset="100%" stop-color="${vis.accent}" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="${w}" height="${h}" fill="url(#${bgGrad})" />
      <rect width="${w}" height="${h}" fill="url(#${haloGrad})" />

      <!-- Moldura de carta vertical 63x88mm com geometria sagrada -->
      <rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="9" fill="none" stroke="${vis.accent}" stroke-opacity="0.65" stroke-width="1.2" />
      <rect x="13" y="13" width="${w - 26}" height="${h - 26}" rx="6" fill="none" stroke="${vis.cardSubtle}" stroke-opacity="0.42" stroke-width="0.75" />
      <line x1="16" y1="${cy}" x2="${w - 16}" y2="${cy}" stroke="${vis.accent}" stroke-opacity="0.28" stroke-width="0.85" stroke-dasharray="3 3" />
      <line x1="${cx}" y1="16" x2="${cx}" y2="${h - 16}" stroke="${vis.accent}" stroke-opacity="0.28" stroke-width="0.85" />
      <circle cx="${cx}" cy="${cy}" r="94" fill="none" stroke="${vis.accent}" stroke-opacity="0.34" stroke-width="0.95" stroke-dasharray="3.5 3" />
      <circle cx="${cx}" cy="${cy}" r="74" fill="none" stroke="${vis.cardSubtle}" stroke-opacity="0.42" stroke-width="0.85" />
      <polygon points="${cx},${cy - 92} ${cx + 92},${cy} ${cx},${cy + 92} ${cx - 92},${cy}" fill="none" stroke="${vis.cardSubtle}" stroke-opacity="0.38" stroke-width="0.9" />
      <polygon points="${cx - 64},${cy - 64} ${cx + 64},${cy - 64} ${cx + 64},${cy + 64} ${cx - 64},${cy + 64}" fill="none" stroke="${vis.accent}" stroke-opacity="0.28" stroke-width="0.8" />

      <!-- Constelação central do naipe / Ás / Coringa (proporção 63x88mm) -->
      <g>
        ${renderConceptualCardInterior(card, vis, cx, cy, 150, 210, ink)}
      </g>

      <!-- Medalhão discreto com glifo temático abaixo da mandala -->
      <g>
        <circle cx="${cx}" cy="264" r="18" fill="${vis.cardPaper}" fill-opacity="0.9" stroke="${vis.accent}" stroke-opacity="0.82" stroke-width="1" />
        <text x="${cx}" y="270" text-anchor="middle" font-size="16">${escapeXml(card.artGlyph)}</text>
        <text x="${cx}" y="294" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="9" font-weight="800" letter-spacing="0.08em" fill="${vis.cardInk}">${code}</text>
      </g>
    </svg>`;
}

export function renderThematicCardArtSvg(card: GameCard): string {
  const vis = THEME_VISUALS[card.themeId] ?? THEME_VISUALS.eclipse;
  if (!isFigureCard(card)) {
    return renderConceptualCardDiagramSvg(card, vis);
  }

  const w = 252;
  const h = 352;
  const gid = safeId(card.id);
  const bgGrad = `bg_${gid}`;
  const auraGrad = `aura_${gid}`;

  const badgeX = 180;
  const badgeY = 148;
  const badgeR = 32;
  const emblemInk = suitColorHex(card.suit, true);

  return `
    <svg class="mtg-art-engraving mtg-art-scene-svg mtg-art-illustration-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="${bgGrad}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${vis.skyTop}" />
          <stop offset="56%" stop-color="${vis.skyMid}" />
          <stop offset="100%" stop-color="${vis.skyBot}" />
        </linearGradient>
        <radialGradient id="${auraGrad}" cx="0.38" cy="0.42" r="0.54">
          <stop offset="0%" stop-color="${vis.accent}" stop-opacity="0.48" />
          <stop offset="65%" stop-color="${vis.accent2}" stop-opacity="0.16" />
          <stop offset="100%" stop-color="${vis.skyTop}" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="${w}" height="${h}" fill="url(#${bgGrad})" />
      ${renderBackdropScenery(vis, w, h)}
      <rect width="${w}" height="${h}" fill="url(#${auraGrad})" />

      <!-- Moldura interna ornamentada 63x88mm -->
      <rect x="7" y="7" width="${w - 14}" height="${h - 14}" rx="8" fill="none" stroke="${vis.accent}" stroke-opacity="0.45" stroke-width="1.1" />
      <path d="M12 28V12h16M${w - 12} 28V12h-16M12 ${h - 28}v16h16M${w - 12} ${h - 28}v16h-16" stroke="${vis.accent}" stroke-opacity="0.78" stroke-width="1.4" fill="none" />

      ${renderPlayingCardMini(card, vis, 88, 138)}

      <!-- Brasão temático da Figura -->
      <g>
        <circle cx="${badgeX}" cy="${badgeY}" r="${badgeR + 5}" fill="${vis.skyTop}" fill-opacity="0.62" stroke="${vis.accent}" stroke-opacity="0.5" stroke-width="1.1" stroke-dasharray="3 3" />
        <circle cx="${badgeX}" cy="${badgeY}" r="${badgeR}" fill="${vis.skyMid}" fill-opacity="0.88" stroke="${vis.accent}" stroke-width="1.4" />
        <text x="${badgeX}" y="${badgeY + 10}" text-anchor="middle" font-size="28">${escapeXml(card.artGlyph)}</text>
        <text x="${badgeX}" y="${badgeY + badgeR + 18}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="8.2" font-weight="700" letter-spacing="0.08em" fill="${emblemInk}">${escapeXml(vis.nomeTema.toUpperCase())}</text>
      </g>
    </svg>`;
}

export interface NanoBananaPrompts {
  promptUnicoTema: string;
  promptCartaAtual: string;
  promptDeckCompleto: string;
  promptVersoCarta: string;
}

export function gerarPromptUnicoDoTema(deck: ThemeDeck): string {
  const vis = THEME_VISUALS[deck.id] ?? THEME_VISUALS.eclipse;
  return [
    `[ALL-IN-ONE MASTER DECK PACK — "${deck.name}" (${deck.subtitle}) — ALL 54 CARDS & ALL 4 SUITS (♠ ♥ ♦ ♣)]`,
    `Generate a clean modular deck sheet of COMPLETE full-bleed 63x88mm vertical playing cards (5:7 aspect ratio, ornate full-card borders, crisp top-left & inverted bottom-right corner indices for every suit ♠ ♥ ♦ ♣ and rank A, 2–10, J, Q, K, ★/💀, NO rule text boxes, NO gibberish text, NO watermarks). EVERY card across all 4 suits is a complete card-sized background artwork:`,
    `All 12 Figure cards (J, Q, K in ♠ ♥ ♦ ♣) receive full illustrated character/threat portraits; all 4 Aces (A♠ A♥ A♦ A♣), 36 numerals (2–10 across ♠ ♥ ♦ ♣), and 2 Jokers (★/💀) receive full-card artistic conceptual tarot/engraving compositions (sacred geometry mandalas, constellation ley-lines linking the exact N suit pips, NO character portraits).`,
    `Art style: ${vis.estetica}. Color palette: shadows ${vis.skyTop}, midtones ${vis.skyMid}, accents ${vis.accent} & ${vis.accent2}.`,
    `Panels (complete 63x88mm vertical playing cards covering all 4 suits ♠ ♥ ♦ ♣):`,
    `1) TOP-LEFT (Valetes J♠ & Damas Q♠): Full 63x88mm illustrated Figure cards for "${deck.suits.spades.vocationName}" holding tilted J♠/Q♠ playing cards.`,
    `2) TOP-CENTER (Valetes J♥ & Damas Q♥): Full 63x88mm illustrated Figure cards for "${deck.suits.hearts.vocationName}" holding tilted J♥/Q♥ playing cards.`,
    `3) TOP-RIGHT (Valetes J♦ & Damas Q♦): Full 63x88mm illustrated Figure cards for "${deck.suits.diamonds.vocationName}" holding tilted J♦/Q♦ playing cards.`,
    `4) MID-LEFT (Valetes J♣ & Damas Q♣): Full 63x88mm illustrated Figure cards for "${deck.suits.clubs.vocationName}" holding tilted J♣/Q♣ playing cards.`,
    `5) MID-CENTER (Reis K ♠/♣ — Combat & Threat Kings): Full 63x88mm majestic illustrated King cards with K♠/K♣ indices (Boss climax: "${deck.chefe.nome}").`,
    `6) MID-RIGHT (Reis K ♥/♦ — Ally & Specialist Kings): Full 63x88mm illustrated King cards with K♥/K♦ indices.`,
    `7) BOTTOM-LEFT (Ás A & Numerais 2–10 em ♠ ♥ ♦ ♣): Complete 63x88mm artistic conceptual tarot/engraving cards for all 4 suits — sculpted suit-medallion Aces (A♠ A♥ A♦ A♣) + constellation ley-line numerals (2–10 in ♠ ♥ ♦ ♣) with ornate borders & corner indices (NO rule text boxes).`,
    `8) BOTTOM-CENTER (Coringas Conceituais ★ & 💀): Complete 63x88mm esoteric dual-totem conceptual Joker cards — radiant Star (★) & shadow Skull (💀).`,
    `9) BOTTOM-RIGHT (O Fundo da Carta — Symmetrical Card Back 63x88mm): Complete reversible 63x88mm card back in ${vis.skyTop} & ${vis.accent} filigree with 4 corner suit ornaments (♠ ♥ ♦ ♣).`,
  ].join('\n');
}

export function gerarPromptsNanoBanana(deck: ThemeDeck, card?: GameCard): NanoBananaPrompts {
  const vis = THEME_VISUALS[deck.id] ?? THEME_VISUALS.eclipse;
  const c = card ?? deck.cards[0];
  const promptUnicoTema = gerarPromptUnicoDoTema(deck);

  const promptCartaAtual = isFigureCard(c)
    ? [
        `Illustrated tabletop Figure full-bleed 63x88mm vertical playing card (5:7 aspect ratio, ornate border, crisp top-left & inverted bottom-right "${c.playingCardCode}" corner indices, NO rule text boxes), ${vis.estetica}.`,
        `Features the Figure "${c.playingCardCode}" (${c.title}) holding or framed beside an ornate tilted "${c.playingCardCode}" playing card.`,
        `Visual subject inside the world of "${deck.name}": ${c.artSubtitle}. Mood: ${c.flavorText}.`,
        `Color harmony: deep ${vis.skyTop} shadows, ${vis.skyMid} midtones, glowing ${vis.accent} & ${vis.accent2} highlights, rich painterly brushwork, open center composition.`,
      ].join(' ')
    : [
        `Full-bleed 63x88mm vertical playing card (5:7 aspect ratio, ornate border, crisp top-left & inverted bottom-right "${c.playingCardCode}" corner indices, NO rule text boxes), intricate artistic conceptual engraving and sacred-geometry symbolic composition (NO character portrait), themed around "${deck.name}" (${vis.estetica}).`,
        `Features esoteric mandala geometry, constellation ley-lines connecting the exact suit pips, metallic ink filigree, and sculpted suit sigils for "${c.playingCardCode}" (${c.title}) in ${vis.accent} & ${vis.accent2} over ${vis.cardPaper}.`,
      ].join(' ');

  const promptDeckCompleto = [
    `Create a complete cohesive 54-card custom 63x88mm vertical playing deck covering ALL 4 SUITS (♠ Espadas, ♥ Copas, ♦ Ouros, ♣ Paus) and ALL RANKS (A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K) + ★ & 💀 Jokers + 1 symmetrical 63x88mm Card Back (O Fundo da Carta) for "${deck.name}" (${deck.subtitle}).`,
    `Art direction: ${vis.estetica}. Palette anchored in ${vis.skyTop}, ${vis.skyMid}, ${vis.accent}, and ${vis.accent2}.`,
    `Every single one of the 54 cards is a complete 5:7 full-bleed card with ornate borders & corner indices (NO rule text boxes), usable both as full-card game backgrounds and as a standalone conventional deck:`,
    `- 12 Court Figures (J♠ Q♠ K♠, J♥ Q♥ K♥, J♦ Q♦ K♦, J♣ Q♣ K♣): 12 distinct full 63x88mm illustrated character/threat portrait cards holding stylized playing cards (♠ ${deck.suits.spades.vocationName}, ♥ ${deck.suits.hearts.vocationName}, ♦ ${deck.suits.diamonds.vocationName}, ♣ ${deck.suits.clubs.vocationName}). Final boss climax: ${deck.chefe.nome}.`,
    `- 4 Aces (A♠, A♥, A♦, A♣): 4 full 63x88mm sacred-geometry mandala cards featuring monumental sculpted central suit medallions.`,
    `- 36 Numbered Cards (2–10 across ♠ ♥ ♦ ♣): 36 full 63x88mm artistic conceptual engraving cards with constellation ley-lines connecting the exact N sculpted suit pips (bottom pips inverted) and exact corner indices.`,
    `- 2 Jokers (★ & 💀): 2 full 63x88mm esoteric conceptual cards — radiant Star (★) and shadow Skull (💀) with matching corner indices.`,
    `- 1 Symmetrical Card Back (O Fundo da Carta 63x88mm): reversible ornament border & central crest.`,
  ].join('\n');

  const promptVersoCarta = [
    `Symmetrical reversible 63x88mm poker card back illustration for "${deck.name}".`,
    `Theme aesthetic: ${vis.estetica}.`,
    `Features a central compass-rose / horizon medallion flanked by four subtle suit ornaments (♠ ♥ ♦ ♣) framed inside a golden-line border on ${vis.skyTop} background with ${vis.accent} filigree. High symmetry vertically and horizontally, printable CMYK-safe contrast, no text.`,
  ].join(' ');

  return {
    promptUnicoTema,
    promptCartaAtual,
    promptDeckCompleto,
    promptVersoCarta,
  };
}
