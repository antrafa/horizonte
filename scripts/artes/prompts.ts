import { THEME_VISUALS } from '../../src/components/card-art';
import type { GameCard, ThemeDeck, ThemeId } from '../../src/types/card';

/**
 * Direção de arte por tema, herdada de PROMPTS-NANO-BANANA.md.
 * `estilo` sobrescreve THEME_VISUALS.estetica quando o .md diverge do código.
 */
const DIRECAO_DO_TEMA: Partial<Record<ThemeId, { estilo?: string; evitar?: string }>> = {
  vampires: { evitar: 'gothic castles, capes, stained glass, blood moon, aristocratic counts' },
  corsarios: {
    estilo:
      'Age-of-sail sea adventure with light humor: wooden sailing ship on a cerulean ocean at golden sunset, canvas sails and rope rigging, painterly adventure illustration',
    evitar: 'airships, flying ships, aviator goggles, steampunk gadgets',
  },
};

export interface AlvoDeArte {
  /** Nome do arquivo em public/cards/<tema>/, ex.: "K-clubs.jpg". */
  arquivo: string;
  rotulo: string;
  prompt: string;
}

export const ARQUIVO_ANCORA = 'K-clubs.jpg';

const POSTO_DA_FIGURA: Record<string, string> = {
  J: 'Jack-rank figure (young, agile, the lowest of the three court ranks)',
  Q: 'Queen-rank figure (seasoned, commanding)',
  K: 'King-rank figure (the leader, the most imposing and powerful presence)',
};

export function arquivoDaCarta(card: GameCard): string {
  if (card.kind === 'joker') return card.rank === 'JOKER_LIGHT' ? 'joker-light.jpg' : 'joker-dark.jpg';
  return `${card.rank}-${card.suit}.jpg`;
}

function estiloBase(deck: ThemeDeck, comReferencia: boolean, ajustes?: string): string[] {
  const vis = THEME_VISUALS[deck.id];
  const direcao = DIRECAO_DO_TEMA[deck.id] ?? {};
  return [
    `STYLE: ${direcao.estilo ?? vis.estetica}.`,
    `PALETTE: deep shadows ${vis.skyTop}, midtones ${vis.skyMid}, highlights ${vis.accent} and ${vis.accent2}.`,
    'Highly detailed, sharp focus, rich lighting, professional print-quality illustration.',
    direcao.evitar ? `AVOID: ${direcao.evitar}.` : '',
    comReferencia
      ? 'Match the art style, rendering technique, brushwork, lighting and palette of the attached reference image exactly, but depict the NEW subject described here (do not copy the reference subject).'
      : '',
    ajustes?.trim() ? `ART DIRECTOR NOTES: ${ajustes.trim()}` : '',
  ];
}

const SEM_TEXTO =
  'STRICTLY NO text, letters, numbers, card indices, corner suit symbols, playing-card frames, borders, logos, signatures or watermarks anywhere in the image.';

function assunto(deck: ThemeDeck, card: GameCard): string {
  if (card.kind === 'joker') {
    const clima = card.rank === 'JOKER_LIGHT' ? 'radiant, hopeful, luminous' : 'ominous, shadowy, dangerous';
    return `SUBJECT: a symbolic ${clima} wildcard scene for the world of "${deck.name}": "${card.title}" — ${card.artSubtitle}. ${card.topWatcherEvent ?? ''} No character portrait; an iconic symbol or relic dominates the scene.`;
  }
  const naipe = deck.suits[card.suit as Exclude<GameCard['suit'], 'joker'>];
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
    return `SUBJECT: character portrait of a ${POSTO_DA_FIGURA[card.rank]} of the "${naipe.vocationName}" faction in the world of "${deck.name}": "${card.title}" — ${card.artSubtitle}. Mood: ${card.flavorText} Waist-up or full-body, expressive face, strong silhouette, the character is the clear focal point.`;
  }
  if (card.rank === 'A') {
    return `SUBJECT: monumental symbolic emblem of the "${naipe.vocationName}" faction in the world of "${deck.name}": "${card.title}" — ${card.artSubtitle}. A single iconic central object or relic, dramatically lit, no people.`;
  }
  return `SUBJECT: atmospheric environmental vignette from the world of "${deck.name}" illustrating "${card.title}" — ${card.artSubtitle}. Scene: ${card.topWatcherEvent ?? ''} Focus on place, objects and light; people only as small distant silhouettes, no portraits.`;
}

export function promptDaCarta(deck: ThemeDeck, card: GameCard, comReferencia: boolean, ajustes?: string): string {
  return [
    'Vertical full-bleed background illustration for a premium tabletop card game card, portrait 3:4 frame, edge-to-edge artwork.',
    assunto(deck, card),
    'COMPOSITION: the main subject sits in the upper 55% of the frame; the lower 40% is calmer, darker and less detailed because a semi-transparent rules text panel will cover it; keep important details at least 5% away from every edge (it will be trimmed).',
    ...estiloBase(deck, comReferencia, ajustes),
    SEM_TEXTO,
  ]
    .filter(Boolean)
    .join('\n');
}

export function promptDoVerso(deck: ThemeDeck, comReferencia: boolean, ajustes?: string): string {
  const vis = THEME_VISUALS[deck.id];
  return [
    `Card back design for the "${deck.name}" playing card deck, portrait 3:4 frame, edge-to-edge.`,
    `Perfectly symmetrical ornamental pattern (mirror symmetric vertically and horizontally, identical when rotated 180°) with a central emblem: a compass rose merged with a horizon line, framed by fine filigree in ${vis.accent} over a ${vis.skyTop} background, subtle motifs from the theme.`,
    ...estiloBase(deck, comReferencia, ajustes),
    'STRICTLY NO text, letters, numbers, logos, signatures or watermarks.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Âncora (K♣) primeiro, depois as demais 53 cartas e o verso. */
export function listarAlvos(deck: ThemeDeck, ajustes?: string): { ancora: AlvoDeArte; demais: AlvoDeArte[] } {
  const ancoraCard = deck.cards.find((c) => arquivoDaCarta(c) === ARQUIVO_ANCORA);
  if (!ancoraCard) throw new Error(`Tema ${deck.id} sem carta ${ARQUIVO_ANCORA}.`);
  const ancora: AlvoDeArte = {
    arquivo: ARQUIVO_ANCORA,
    rotulo: `${ancoraCard.playingCardCode} ${ancoraCard.title}`,
    prompt: promptDaCarta(deck, ancoraCard, false, ajustes),
  };
  const demais: AlvoDeArte[] = deck.cards
    .filter((c) => c !== ancoraCard)
    .map((c) => ({
      arquivo: arquivoDaCarta(c),
      rotulo: `${c.playingCardCode} ${c.title}`,
      prompt: promptDaCarta(deck, c, true, ajustes),
    }));
  demais.push({ arquivo: 'back.jpg', rotulo: 'Verso', prompt: promptDoVerso(deck, true, ajustes) });
  return { ancora, demais };
}
