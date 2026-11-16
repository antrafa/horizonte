/**
 * Partida de exemplo de HORIZONTE v1.0: um duelo PvPvE entre Mara e Kael em Cinzas do Horizonte.
 * Cada lance roda diretamente pelo motor `src/core/partida.ts`; `encenarExemplo()` valida todas as jogadas.
 */
import {
  type Acao,
  agir,
  type CartaAcao,
  criarPartida,
  type FiguraHorizonte,
  linhaDeStatus,
  type Partida,
} from '../core/partida';

export interface PassoDoExemplo {
  hora: string;
  titulo: string;
  quem: string;
  narrativa: string;
  notaMecanica: string;
  acao: Acao;
}

export interface CenaExemploRenderizada {
  passo: PassoDoExemplo;
  antes: Partida;
  depois: Partida;
  statusDepois: string;
}

export interface ExemploEncenado {
  inicial: Partida;
  passos: CenaExemploRenderizada[];
  final: Partida;
  statusFinal: string;
}

const MAO_MARA: CartaAcao[] = [
  { valor: 6, naipe: 'spades' },
  { valor: 2, naipe: 'clubs' },
  { valor: 4, naipe: 'clubs' },
  { valor: 1, naipe: 'spades' },
  { valor: 5, naipe: 'diamonds' },
];

const MAO_KAEL: CartaAcao[] = [
  { valor: 3, naipe: 'hearts' },
  { valor: 7, naipe: 'diamonds' },
  { valor: 5, naipe: 'clubs' },
  { valor: 9, naipe: 'spades' },
  { valor: 4, naipe: 'hearts' },
];

const HORIZONTE_EXEMPLO: FiguraHorizonte[] = [
  { posto: 'J', naipe: 'spades' }, // Batedor de Arpão (10 PV / 3 Atq)
  { posto: 'J', naipe: 'clubs' }, // Rastejador Ácido (10 PV / 3 Atq)
  { posto: 'Q', naipe: 'diamonds' }, // Sentinela de Plasma (14 PV / 5 Atq)
  { posto: 'K', naipe: 'spades' }, // Imperador V8 (20 PV / 7 Atq)
];

const COMPRA_EXEMPLO: CartaAcao[] = [
  { valor: 3, naipe: 'diamonds' },
  { valor: 8, naipe: 'hearts' },
  { valor: 6, naipe: 'hearts' },
  { valor: 7, naipe: 'clubs' },
  { valor: 10, naipe: 'spades' },
  { valor: 5, naipe: 'hearts' },
  { valor: 4, naipe: 'diamonds' },
  { valor: 9, naipe: 'clubs' },
];

export const ROTEIRO_EXEMPLO: PassoDoExemplo[] = [
  {
    hora: 'Turno 1 · Ação',
    titulo: 'Mara abre fogo contra o Batedor de Arpão (J♠)',
    quem: 'Mara',
    narrativa:
      'Mara joga 6♠ (Escopeta de Cano Cerrado). Com +2 perfurante de Espadas e +1 da sua classe Atirador, causa 9 de dano direto e deixa J♠ com apenas 1 PV.',
    notaMecanica: '6 (base) + 2 (♠) + 1 (afinidade ♠) = 9 de dano. Como J♠ sobreviveu com 1 PV, ele contra-ataca com 3.',
    acao: { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' },
  },
  {
    hora: 'Turno 1 · Bloqueio',
    titulo: 'Mara usa sucata leve para amortecer o contra-ataque',
    quem: 'Mara',
    narrativa:
      'Para não perder vida cheia, Mara descarta 2♣ (Estrepes) da mão para bloquear 2 dos 3 pontos de dano, sofrendo apenas 1 PV (vai a 19 PV) e repondo a mão.',
    notaMecanica: 'Bloqueio Tático: 3 de dano pendente - 2 bloqueados = 1 PV perdido. Mão reposta até 5 cartas.',
    acao: { tipo: 'bloquear', quem: 0, indicesMao: [0] },
  },
  {
    hora: 'Turno 2 · Recrutamento',
    titulo: 'Kael recruta o Batedor de Arpão (J♠) para o seu lado',
    quem: 'Kael',
    narrativa:
      'Kael vê o J♠ quase derrotado (1 PV) e joga 3♥ (Atadura Esterilizada). Como usou uma carta vermelha e zerou a vida da Ameaça, ele o recruta como Aliado!',
    notaMecanica: '3 + 1 (afinidade ♥) = 4 de dano (zera 1 PV). Carta ♥ habilita Recrutar: J♠ entra com 2 cargas de +2 de dano e não contra-ataca!',
    acao: { tipo: 'jogarCartas', quem: 1, indicesMao: [0], alvo: 'horizonte_recrutar' },
  },
  {
    hora: 'Turno 3 · Ataque PvP',
    titulo: 'Mara monta um Combo de Comando e atira em Kael!',
    quem: 'Mara',
    narrativa:
      'Vendo Kael ganhar um aliado forte, Mara combina 4♣ + A♠ contra o rival! Além de 11 de dano direto em Kael, o golpe pesado de Paus arranca 1 carta da mão dele.',
    notaMecanica: 'Combo (4 + 4 do Ás = 8) + 2 (♠) + 1 (afinidade ♠) = 11 de dano em Kael + descarte de 1 carta (♣ ≥ 6). Depois disso, o novo Rastejador (J♣) ataca Mara por 3.',
    acao: { tipo: 'jogarCartas', quem: 0, indicesMao: [0, 1], alvo: { rival: 1 } },
  },
  {
    hora: 'Turno 3 · Bloqueio',
    titulo: 'Mara absorve o golpe no corpo para guardar cartas altas',
    quem: 'Mara',
    narrativa:
      'Mara prefere preservar sua mão cheia (5♦, 3♦, 8♥) e aceita os 3 de dano direto nos PV (19 → 16 PV).',
    notaMecanica: 'Receber no Corpo (0 cartas descartadas): excelente para manter recursos de combo para a próxima rodada.',
    acao: { tipo: 'bloquear', quem: 0, indicesMao: [] },
  },
  {
    hora: 'Turno 4 · Aliado',
    titulo: 'Kael aciona o Batedor recrutado (J♠) antes da jogada',
    quem: 'Kael',
    narrativa:
      'Agora é a vez de Kael: ele gasta 1 carga do J♠ recrutado para causar +2 de dano no Rastejador Ácido (J♣), abrindo caminho para sua ação principal.',
    notaMecanica: 'Uso de Aliado (1× por turno, fase de ação): J♠ cai de 2 para 1 carga e reduz J♣ de 10 para 8 PV.',
    acao: { tipo: 'usarAliado', quem: 1, indiceAliado: 0 },
  },
];

export function encenarExemplo(): ExemploEncenado {
  const inicial = criarPartida({
    modo: 'pvp',
    jogadores: [
      { nome: 'Mara', classe: 'spades' },
      { nome: 'Kael', classe: 'hearts' },
    ],
    maosIniciais: [MAO_MARA, MAO_KAEL],
    horizonteDeck: HORIZONTE_EXEMPLO,
    baralhoCompra: COMPRA_EXEMPLO,
    embaralhar: false,
  });

  let atual = inicial;
  const passos: CenaExemploRenderizada[] = [];

  for (const passo of ROTEIRO_EXEMPLO) {
    const antes = atual;
    const depois = agir(antes, passo.acao);
    if (depois === antes) {
      throw new Error(`Passo inválido no roteiro de exemplo: ${passo.titulo} (${JSON.stringify(passo.acao)})`);
    }
    passos.push({
      passo,
      antes,
      depois,
      statusDepois: linhaDeStatus(depois),
    });
    atual = depois;
  }

  return {
    inicial,
    passos,
    final: atual,
    statusFinal: linhaDeStatus(atual),
  };
}
