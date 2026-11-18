import { ALL_THEME_IDS } from '../data/index';
import type { StudioTab } from '../main';
import type { ThemeId } from '../types/card';

export const SLUG_DA_ABA: Record<StudioTab, string> = {
  quickstart: 'como-jogar',
  exemplo: 'primeira-partida',
  temas: 'temas',
  playtest: 'mesa',
  oracle: 'compendio',
  studio: 'estudio',
  print: 'imprimir',
};

const ABA_POR_TOKEN: Record<string, StudioTab> = {
  quickstart: 'quickstart',
  'como-jogar': 'quickstart',
  exemplo: 'exemplo',
  'primeira-partida': 'exemplo',
  temas: 'temas',
  playtest: 'playtest',
  mesa: 'playtest',
  oracle: 'oracle',
  compendio: 'oracle',
  studio: 'studio',
  estudio: 'studio',
  cartas: 'studio',
  print: 'print',
  imprimir: 'print',
};

export const TODOS_OS_SLUGS_DE_ROTA: readonly string[] = Object.keys(ABA_POR_TOKEN);

export interface EstadoDeRota {
  tab?: StudioTab;
  themeId?: ThemeId;
  cardId?: string;
  salaId?: string;
}

export function resolverAba(token: string | null | undefined): StudioTab | undefined {
  if (!token) return undefined;
  const limpo = token.trim().replace(/^[/#]+|[/]+$/g, '').toLowerCase();
  return ABA_POR_TOKEN[limpo];
}

export function obterBasePath(pathname: string): string {
  const semBarraFinal = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const partes = semBarraFinal.split('/');
  const ultimo = (partes[partes.length - 1] ?? '').replace(/\.html$/i, '').toLowerCase();
  if (ultimo === 'index' || ABA_POR_TOKEN[ultimo]) {
    partes.pop();
  }
  const base = partes.join('/');
  return base.endsWith('/') ? base : `${base}/`;
}

export function lerRotaDaUrl(loc: Pick<Location, 'pathname' | 'search' | 'hash'>): EstadoDeRota {
  const params = new URLSearchParams(loc.search);
  const hashLimpo = loc.hash.replace(/^#\/?/, '');
  const [hashPath, hashQuery] = hashLimpo.split('?');
  const hashParams = new URLSearchParams(hashQuery ?? '');

  const partesPath = loc.pathname.replace(/\/+$/, '').split('/');
  const ultimoSegmento = (partesPath[partesPath.length - 1] ?? '').replace(/\.html$/i, '');

  const tab =
    resolverAba(params.get('aba') ?? params.get('tab')) ??
    resolverAba( ultimoSegmento) ??
    resolverAba(hashParams.get('aba') ?? hashParams.get('tab')) ??
    resolverAba(hashPath);

  const rawTema = (params.get('tema') ?? params.get('theme') ?? hashParams.get('tema') ?? '').trim() as ThemeId;
  const themeId = ALL_THEME_IDS.includes(rawTema) ? rawTema : undefined;

  const rawCarta = (params.get('carta') ?? params.get('card') ?? hashParams.get('carta') ?? '').trim();
  const cardId = rawCarta || undefined;

  const rawSala = (params.get('sala') ?? hashParams.get('sala') ?? '').trim();
  const salaId = rawSala || undefined;

  return {
    tab: tab ?? (salaId ? 'playtest' : undefined),
    themeId,
    cardId,
    salaId,
  };
}

export function construirUrlDaRota(
  pathnameAtual: string,
  opcoes: {
    tab: StudioTab;
    themeId: ThemeId;
    cardId?: string;
    salaId?: string | null;
  },
): string {
  const base = obterBasePath(pathnameAtual);
  const slug = SLUG_DA_ABA[opcoes.tab];
  const params = new URLSearchParams();
  params.set('tema', opcoes.themeId);
  if (opcoes.tab === 'studio' && opcoes.cardId) {
    params.set('carta', opcoes.cardId);
  }
  if (opcoes.salaId) {
    params.set('sala', opcoes.salaId);
  }
  const query = params.toString();
  return `${base}${slug}${query ? `?${query}` : ''}`;
}
