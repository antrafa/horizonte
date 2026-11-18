import { existsSync } from 'node:fs';
import path from 'node:path';
import { TEMAS_COM_ARTE_LIMPA } from '../../src/data/artes-limpas';
import { THEMES } from '../../src/data/index';
import type { ThemeDeck, ThemeId } from '../../src/types/card';
import { listarAlvos, type AlvoDeArte } from './prompts';
import type { NomeProvedor } from './provedores';

export interface StatusPorProvedor {
  gerados: AlvoDeArte[];
  pendentes: AlvoDeArte[];
  totalEsperado: number;
}

export interface StatusDoTema {
  temaId: ThemeId;
  nome: string;
  aplicadoNoJogo: boolean;
  porProvedor: Record<NomeProvedor, StatusPorProvedor>;
}

export function todosOsAlvosDoTema(deck: ThemeDeck, ajustes?: string): AlvoDeArte[] {
  const { ancora, demais } = listarAlvos(deck, ajustes);
  return [ancora, ...demais];
}

export function inspecionarStatusPorProvedor(
  raiz: string,
  deck: ThemeDeck,
  provedor: NomeProvedor,
  ajustes?: string,
): StatusPorProvedor {
  const pasta = path.join(raiz, 'artes-geradas', deck.id, provedor);
  const alvos = todosOsAlvosDoTema(deck, ajustes);
  const gerados: AlvoDeArte[] = [];
  const pendentes: AlvoDeArte[] = [];
  for (const alvo of alvos) {
    if (existsSync(path.join(pasta, alvo.arquivo))) {
      gerados.push(alvo);
    } else {
      pendentes.push(alvo);
    }
  }
  return { gerados, pendentes, totalEsperado: alvos.length };
}

export function inspecionarStatusDoTema(raiz: string, temaId: ThemeId): StatusDoTema {
  const deck = THEMES[temaId];
  const backupOriginal = path.join(raiz, 'artes-geradas', temaId, '_original');
  const aplicadoNoJogo = TEMAS_COM_ARTE_LIMPA.includes(temaId) || existsSync(backupOriginal);
  return {
    temaId,
    nome: deck.name,
    aplicadoNoJogo,
    porProvedor: {
      openai: inspecionarStatusPorProvedor(raiz, deck, 'openai'),
      gemini: inspecionarStatusPorProvedor(raiz, deck, 'gemini'),
    },
  };
}

function seloContagem(st: StatusPorProvedor): string {
  const qtd = st.gerados.length;
  const tot = st.totalEsperado;
  const icone = qtd === tot ? '✓' : qtd > 0 ? '◐' : '·';
  return `${icone} ${String(qtd).padStart(2, ' ')}/${tot}`;
}

export function formatarLinhaDeStatusDoTema(
  numero: number,
  status: StatusDoTema,
  provedorAtivo: NomeProvedor,
): string {
  const outro: NomeProvedor = provedorAtivo === 'openai' ? 'gemini' : 'openai';
  const stAtivo = status.porProvedor[provedorAtivo];
  const stOutro = status.porProvedor[outro];
  const tagAplicado = status.aplicadoNoJogo ? '✓ APLICADO' : '  pendente';
  const numStr = String(numero).padStart(2, ' ');
  const idStr = status.temaId.padEnd(10, ' ');
  return `  ${numStr}) [${seloContagem(stAtivo)} ${provedorAtivo} | ${seloContagem(stOutro)} ${outro} | ${tagAplicado}] ${idStr} — ${status.nome}`;
}

const MAPA_SUIT_TOKEN: Record<string, string> = {
  '♠': 'spades',
  s: 'spades',
  espadas: 'spades',
  '♥': 'hearts',
  h: 'hearts',
  copas: 'hearts',
  '♦': 'diamonds',
  d: 'diamonds',
  ouros: 'diamonds',
  '♣': 'clubs',
  c: 'clubs',
  paus: 'clubs',
};

function normalizarTokenParaArquivo(token: string): string | null {
  const limpo = token.trim().toLowerCase();
  if (!limpo) return null;
  if (limpo === 'verso' || limpo === 'back' || limpo === 'back.jpg') return 'back.jpg';
  if (limpo === '★' || limpo === 'x1' || limpo === 'estrela' || limpo === 'joker-light' || limpo === 'joker-light.jpg') {
    return 'joker-light.jpg';
  }
  if (limpo === '💀' || limpo === 'x2' || limpo === 'caveira' || limpo === 'joker-dark' || limpo === 'joker-dark.jpg') {
    return 'joker-dark.jpg';
  }
  if (limpo.endsWith('.jpg')) return limpo;
  if (/^(10|[2-9]|[ajqk])-(spades|hearts|diamonds|clubs)$/.test(limpo)) {
    const [r, s] = limpo.split('-');
    return `${r.toUpperCase()}-${s}.jpg`;
  }
  const m = limpo.match(/^(10|[2-9]|[ajqk])([♠♥♦♣shdc]|espadas|copas|ouros|paus)$/);
  if (m) {
    const rank = m[1].toUpperCase();
    const suit = MAPA_SUIT_TOKEN[m[2]];
    if (suit) return `${rank}-${suit}.jpg`;
  }
  return null;
}

export function resolverAlvosParaRegerar(
  deck: ThemeDeck,
  entrada: string,
  ajustes?: string,
): { selecionados: AlvoDeArte[]; invalidos: string[] } {
  const alvos = todosOsAlvosDoTema(deck, ajustes);
  const tokens = entrada
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const selecionados: AlvoDeArte[] = [];
  const invalidos: string[] = [];
  const jaIncluidos = new Set<string>();

  for (const token of tokens) {
    let achado: AlvoDeArte | undefined;
    if (/^\d+$/.test(token)) {
      const idx = Number(token) - 1;
      if (idx >= 0 && idx < alvos.length) {
        achado = alvos[idx];
      }
    }
    if (!achado) {
      const arq = normalizarTokenParaArquivo(token);
      if (arq) {
        achado = alvos.find((a) => a.arquivo.toLowerCase() === arq.toLowerCase());
      }
    }
    if (achado) {
      if (!jaIncluidos.has(achado.arquivo)) {
        jaIncluidos.add(achado.arquivo);
        selecionados.push(achado);
      }
    } else {
      invalidos.push(token);
    }
  }

  return { selecionados, invalidos };
}
