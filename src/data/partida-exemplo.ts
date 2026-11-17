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
  { posto: 'J', naipe: 'spades' }, // Batedor de Arpão (12 PV / 5 Atq · Feroz)
  { posto: 'J', naipe: 'clubs' }, // Rastejador Ácido (12 PV / 4 Atq · Imune a armadilhas)
  { posto: 'Q', naipe: 'diamonds' }, // Sentinela de Plasma (18 PV / 6 Atq · Blindada)
  { posto: 'K', naipe: 'spades' }, // Imperador V8 (26 PV / 11 Atq · Feroz)
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
      'Mara joga 6♠ (Escopeta de Cano Cerrado). Com +2 de bônus de Espadas e +1 da sua classe Atirador, causa 9 de dano direto e deixa J♠ com apenas 3 PV.',
    notaMecanica: '6 (base) + 2 (♠) + 1 (afinidade ♠) = 9 de dano. Como J♠ sobreviveu com 3 PV, ele contra-ataca com 5 (4 de Ataque + 1 por ser Feroz).',
    acao: { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' },
  },
  {
    hora: 'Turno 1 · Bloqueio',
    titulo: 'Mara usa sucata leve para amortecer o contra-ataque',
    quem: 'Mara',
    narrativa:
      'Para não perder vida cheia, Mara descarta 2♣ (Estrepes) da mão para bloquear 2 dos 5 pontos de dano, sofre 3 (vai a 12 PV) e compra 1 carta no fim do turno.',
    notaMecanica: 'Bloqueio Tático: 5 de dano pendente - 2 bloqueados = 3 PV perdidos. No fim do turno, compra 1 carta: a carta gasta no bloqueio vai fazer falta.',
    acao: { tipo: 'bloquear', quem: 0, indicesMao: [0] },
  },
  {
    hora: 'Turno 2 · Recrutamento',
    titulo: 'Kael recruta o Batedor de Arpão (J♠) para o seu lado',
    quem: 'Kael',
    narrativa:
      'Kael vê o J♠ quase derrotado (3 PV) e joga 3♥ (Atadura Esterilizada). Como usou uma carta vermelha e zerou a vida da Ameaça, ele o recruta como Aliado!',
    notaMecanica: '3 + 1 (afinidade ♥) = 4 de dano (zera os 3 PV). Como o golpe final tem ♥, Kael pode Recrutar: J♠ vira Aliado com 2 usos (cada um causa 2 de dano) e não contra-ataca!',
    acao: { tipo: 'jogarCartas', quem: 1, indicesMao: [0], alvo: 'horizonte_recrutar' },
  },
  {
    hora: 'Turno 3 · Ataque PvP',
    titulo: 'Mara monta um Combo de Comando e atira em Kael!',
    quem: 'Mara',
    narrativa:
      'Vendo Kael ganhar um aliado forte, Mara combina 4♣ + A♠ contra o rival! Além de 11 de dano direto em Kael, o golpe pesado de Paus arranca 1 carta da mão dele, puxada às cegas.',
    notaMecanica: 'Combo (4 + 4 do Ás = 8) + 2 (♠) + 1 (afinidade ♠) = 11 de dano em Kael + descarte de 1 carta (♣ ≥ 6). Depois disso, o novo Rastejador (J♣) ataca Mara por 4 — e, Imune a armadilhas, ignora o ♣ que ela jogou.',
    acao: { tipo: 'jogarCartas', quem: 0, indicesMao: [0, 1], alvo: { rival: 1 } },
  },
  {
    hora: 'Turno 3 · Bloqueio',
    titulo: 'Mara absorve o golpe no corpo para guardar cartas altas',
    quem: 'Mara',
    narrativa:
      'Com só 2 cartas na mão (5♦, 3♦), Mara prefere guardá-las e aceita os 4 de dano direto nos PV (12 → 8 PV).',
    notaMecanica: 'Receber no Corpo (0 cartas descartadas): troca vida por cartas, porque a reposição é de só 1 carta por turno.',
    acao: { tipo: 'bloquear', quem: 0, indicesMao: [] },
  },
  {
    hora: 'Turno 4 · Aliado',
    titulo: 'Kael aciona o Batedor recrutado (J♠) antes da jogada',
    quem: 'Kael',
    narrativa:
      'Agora é a vez de Kael: ele gasta 1 uso do J♠ recrutado para causar +2 de dano no Rastejador Ácido (J♣), abrindo caminho para sua ação principal.',
    notaMecanica: 'Uso de Aliado (1× por turno, fase de ação): J♠ cai de 2 para 1 uso e reduz J♣ de 12 para 10 PV.',
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
