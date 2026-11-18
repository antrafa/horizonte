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
      'Mara joga 6♠. Com +2 de bônus de Espadas e +2 da sua Especialização de Atirador (♠), causa 10 de dano direto e deixa J♠ com 2 PV. Como J♠ sobreviveu, ele contra-ataca com 5 (4 base + 1 do traço ♠ Feroz).',
    notaMecanica:
      'Dano: 6 (base) + 2 (♠) + 2 (Atirador) = 10. O naipe ♠ do J♠ dá a ele o traço passivo Feroz (+1 de ataque na onda dos Valetes: 4 + 1 = 5). Ainda não há compra de carta: a compra fixa só ocorre no Passo 4 (fim do turno), após o bloqueio.',
    acao: { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' },
  },
  {
    hora: 'Turno 1 · Bloqueio',
    titulo: 'Mara bloqueia pelo valor da carta e compra +1 no fim do turno',
    quem: 'Mara',
    narrativa:
      'Para amortecer o contra-ataque de 5, Mara descarta 2♣ da mão: cada carta absorve o próprio valor numérico (2 pontos, e não 1 por carta), então ela sofre 3 de dano (15 → 12 PV). Só agora, no fim do turno, ela compra +1 carta (3♦).',
    notaMecanica:
      'Bloqueio = valor da carta (5 pendente − 2 do 2♣ = 3 PV perdidos). Mara poderia descartar mais cartas (até a mão toda), mas no Passo 4 se compra APENAS 1 carta (não volta a 5): cada carta gasta na defesa faz falta depois.',
    acao: { tipo: 'bloquear', quem: 0, indicesMao: [0] },
  },
  {
    hora: 'Turno 2 · Recrutamento',
    titulo: 'Kael recruta o Batedor de Arpão (J♠) para o seu lado',
    quem: 'Kael',
    narrativa:
      'Kael vê o J♠ com 2 PV e joga 3♥. Os 3 de dano zeram a vida da Ameaça e, como o golpe fatal tem ♥, ele escolhe Recrutar em vez de Abater: J♠ vira Aliado de Kael com 2 usos e não contra-ataca! No fim do turno, Kael compra +1 carta (8♥).',
    notaMecanica:
      'A Especialização Médico (♥) de Kael dá +2 na cura (ele já está com 15/15 PV), não no dano. Recrutar (♥/♦/★/💀) traz o J♠ como Aliado com 2 usos (causa 2 de dano por uso no Passo 1 ou dá Escudo +4 no Passo 3), mas sem as cartas bônus de Abate — Kael compra só a +1 fixa do Passo 4.',
    acao: { tipo: 'jogarCartas', quem: 1, indicesMao: [0], alvo: 'horizonte_recrutar' },
  },
  {
    hora: 'Turno 3 · Ataque PvP',
    titulo: 'Mara monta um Combo de Comando e atira em Kael!',
    quem: 'Mara',
    narrativa:
      'Com Kael armado com um Aliado, Mara combina 4♣ + A♠ contra o rival! Kael leva 12 de dano direto nos PV (sem direito a bloqueio) e perde 1 carta aleatória pelo golpe pesado de ♣. Porém, o novo Rastejador (J♣) no centro contra-ataca Mara por 4.',
    notaMecanica:
      'Combo de Comando: 4 + 4 (Ás em combo) = 8 base + 2 (♠) + 2 (Atirador) = 12 de dano em Kael (15 → 3 PV) + descarte de 1 carta (♣ ≥ 6). Como atacou o rival e J♣ tem Imune a armadilhas, o 4♣ não reduz o contra-ataque de 4 do Rastejador.',
    acao: { tipo: 'jogarCartas', quem: 0, indicesMao: [0, 1], alvo: { rival: 1 } },
  },
  {
    hora: 'Turno 3 · Bloqueio',
    titulo: 'Mara absorve 4 de dano no corpo para não zerar a mão',
    quem: 'Mara',
    narrativa:
      'Com só 2 cartas na mão (5♦, 3♦), Mara decide aceitar os 4 de dano direto nos PV (12 → 8 PV) em vez de descartá-las no bloqueio. No Passo 4, compra +1 carta (6♥) e fica com 3 cartas para o próximo turno.',
    notaMecanica:
      'Por que não bloquear com a mão toda? Poder ela até pode, mas a reposição de fim de turno é de apenas +1 carta. Guardar 5♦ e 3♦ permite um combo ou compra extra (♦) depois, trocando PV por fôlego ofensivo.',
    acao: { tipo: 'bloquear', quem: 0, indicesMao: [] },
  },
  {
    hora: 'Turno 4 · Aliado',
    titulo: 'Kael aciona o Batedor recrutado (J♠) no Passo 1 do turno',
    quem: 'Kael',
    narrativa:
      'Antes de jogar cartas da mão, Kael gasta 1 uso do seu Aliado J♠ (2 → 1 uso) para causar 2 de dano no Rastejador Ácido (J♣: 12 → 10 PV) e segue para sua ação principal!',
    notaMecanica:
      'Regra de Aliado: 1 único uso de Aliado por turno! Como Kael ativou o poder de ♠ no Passo 1 (que agora funciona pelo naipe do Aliado, 2 de dano no Valete), ele não poderá usar o Escudo +4 desse Aliado no Passo 3 deste mesmo turno.',
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
