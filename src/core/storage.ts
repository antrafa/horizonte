import { DEFAULT_THEME_ID, getDefaultTheme } from '../data/index';
import type { GameCard, ThemeDeck, ThemeId } from '../types/card';
import { linhaDeStatus, type ModoDeJogo, type Partida } from './partida';

const OVERRIDES_KEY_PREFIX = 'horizonte_overrides_v1_';
const PARTIDA_KEY = 'horizonte_partida_v1';
const ESTADO_MUNDO_KEY_PREFIX = 'horizonte_estado_mundo_v1_';
const THEME_KEY = 'horizonte_tema';
const SALA_ONLINE_KEY = 'horizonte_sala_online_id';

export interface EstadoDoMundo {
  themeId: ThemeId;
  modo: ModoDeJogo;
  figurasRestantes: number;
  rodada: number;
  notaDoMundo: string;
  ultimoEvento: string;
  atualizadoEm: string;
}

function getStorage(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

const LEGACY_ART_URL_RE = /^\/cards\/[^/]+\/(J|Q|K|K-boss|A|numeral|joker)\.jpg$/;

function resolveMergedArtUrl(defaultArtUrl: string | undefined, overrideArtUrl: string | undefined): string | undefined {
  const trimmed = overrideArtUrl?.trim();
  if (!trimmed || LEGACY_ART_URL_RE.test(trimmed)) {
    return defaultArtUrl;
  }
  return trimmed;
}

export function loadThemeWithOverrides(themeId: ThemeId): ThemeDeck {
  const base = getDefaultTheme(themeId);
  const store = getStorage();
  if (!store) return base;

  const raw = store.getItem(`${OVERRIDES_KEY_PREFIX}${themeId}`);
  if (!raw) return base;

  try {
    const overridesMap = JSON.parse(raw) as Record<string, GameCard>;
    return {
      ...base,
      cards: base.cards.map((c) => {
        const override = overridesMap[c.id];
        if (!override) return c;
        return {
          ...c,
          ...override,
          artUrl: resolveMergedArtUrl(c.artUrl, override.artUrl),
        };
      }),
    };
  } catch {
    return base;
  }
}

export function saveCardOverride(card: GameCard): void {
  const store = getStorage();
  if (!store) return;

  const key = `${OVERRIDES_KEY_PREFIX}${card.themeId}`;
  const existingRaw = store.getItem(key);
  let overridesMap: Record<string, GameCard> = {};
  if (existingRaw) {
    try {
      overridesMap = JSON.parse(existingRaw) as Record<string, GameCard>;
    } catch {
      overridesMap = {};
    }
  }
  overridesMap[card.id] = card;
  store.setItem(key, JSON.stringify(overridesMap));
}

export function resetThemeOverrides(themeId: ThemeId): void {
  const store = getStorage();
  if (!store) return;
  store.removeItem(`${OVERRIDES_KEY_PREFIX}${themeId}`);
}

export function exportThemeJson(deck: ThemeDeck): string {
  return JSON.stringify(deck, null, 2);
}

export function importThemeJson(jsonStr: string): ThemeDeck {
  const parsed = JSON.parse(jsonStr) as ThemeDeck;
  if (!parsed || !Array.isArray(parsed.cards) || parsed.cards.length !== 54) {
    throw new Error('JSON inválido: o baralho precisa conter exatamente 54 cartas.');
  }
  for (const card of parsed.cards) {
    saveCardOverride(card);
  }
  return parsed;
}

export function loadPartida(): Partida | null {
  const store = getStorage();
  const raw = store?.getItem(PARTIDA_KEY);
  if (!raw) return null;
  try {
    const partida = JSON.parse(raw) as Partida;
    const valida =
      Array.isArray(partida.jogadores) &&
      partida.jogadores.every((j) => Array.isArray(j.mao) && typeof j.vida === 'number') &&
      Array.isArray(partida.horizonteDeck);
    return valida ? partida : null;
  } catch {
    return null;
  }
}

export function savePartida(partida: Partida | null): void {
  const store = getStorage();
  if (!store) return;
  if (partida) store.setItem(PARTIDA_KEY, JSON.stringify(partida));
  else store.removeItem(PARTIDA_KEY);
}

export function loadSalaOnlineId(): string | null {
  return getStorage()?.getItem(SALA_ONLINE_KEY) ?? null;
}

export function saveSalaOnlineId(salaId: string | null): void {
  const store = getStorage();
  if (!store) return;
  if (salaId) store.setItem(SALA_ONLINE_KEY, salaId);
  else store.removeItem(SALA_ONLINE_KEY);
}

export function loadThemeId(): ThemeId | null {
  return (getStorage()?.getItem(THEME_KEY) as ThemeId | null) ?? null;
}

export function saveThemeId(themeId: ThemeId): void {
  getStorage()?.setItem(THEME_KEY, themeId);
}

export function estadoDoMundoPadrao(themeId: ThemeId = DEFAULT_THEME_ID): EstadoDoMundo {
  return {
    themeId,
    modo: 'solo',
    figurasRestantes: 12,
    rodada: 0,
    notaDoMundo: '',
    ultimoEvento: 'O Horizonte aguarda o início do primeiro conflito.',
    atualizadoEm: '',
  };
}

export function loadEstadoDoMundo(themeId: ThemeId): EstadoDoMundo {
  const base = estadoDoMundoPadrao(themeId);
  const store = getStorage();
  const raw = store?.getItem(`${ESTADO_MUNDO_KEY_PREFIX}${themeId}`);
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<EstadoDoMundo>;
    return { ...base, ...parsed, themeId };
  } catch {
    return base;
  }
}

export function saveEstadoDoMundo(estado: EstadoDoMundo): void {
  const store = getStorage();
  if (!store) return;
  store.setItem(`${ESTADO_MUNDO_KEY_PREFIX}${estado.themeId}`, JSON.stringify(estado));
}

export function syncEstadoDoMundo(themeId: ThemeId, partida: Partida | null, notaOpcional?: string): EstadoDoMundo {
  const anterior = loadEstadoDoMundo(themeId);
  const notaDoMundo = notaOpcional !== undefined ? notaOpcional : anterior.notaDoMundo;
  if (!partida) {
    const atualizado: EstadoDoMundo = { ...anterior, notaDoMundo };
    saveEstadoDoMundo(atualizado);
    return atualizado;
  }

  const restantes = partida.horizonteDeck.length + (partida.ameacaAtiva ? 1 : 0);
  const ultimoEvento = partida.diario[partida.diario.length - 1] ?? linhaDeStatus(partida);

  const atualizado: EstadoDoMundo = {
    themeId,
    modo: partida.modo,
    figurasRestantes: restantes,
    rodada: partida.rodada,
    notaDoMundo,
    ultimoEvento,
    atualizadoEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
  saveEstadoDoMundo(atualizado);
  return atualizado;
}
