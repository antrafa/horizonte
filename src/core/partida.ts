/**
 * Motor tático PvPvE de HORIZONTE — Zona de Conflito (v1.0).
 * Um único baralho convencional de 54 cartas:
 * - 12 Figuras (J, Q, K) formam o Deck de Ameaças (O Horizonte).
 * - 42 Cartas (A–10 + 2 Coringas) formam o Deck de Ação/Suprimento.
 * Funções puras: `agir(partida, acao)` devolve uma nova partida; ação inválida devolve a mesma referência.
 */

export type Naipe = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type PostoFigura = 'J' | 'Q' | 'K';
export type ModoDeJogo = 'solo' | 'coop' | 'pvp';
export type Nivel = 'recruta' | 'veterano' | 'lenda';

/** O nível só muda a vida dos jogadores: o resto da regra é igual em todos. */
export const NIVEIS: Record<Nivel, { nome: string; vida: number; resumo: string }> = {
  recruta: { nome: 'Recruta', vida: 20, resumo: 'Para aprender: mais folga para errar.' },
  veterano: { nome: 'Veterano', vida: 15, resumo: 'A regra padrão.' },
  lenda: { nome: 'Lenda', vida: 12, resumo: 'Cada bloqueio conta.' },
};

export interface CartaNumerica {
  valor: number; // 1 (Ás) a 10
  naipe: Naipe;
}

export type CartaAcao = CartaNumerica | { coringa: 'estrela' | 'caveira' };

export interface FiguraHorizonte {
  posto: PostoFigura;
  naipe: Naipe;
}

export interface AliadoRecrutado {
  figura: FiguraHorizonte;
  cargas: number;
  maxCargas: number;
}

export interface AmeacaAtiva {
  figura: FiguraHorizonte;
  vidaAtual: number;
  vidaMax: number;
  ataqueBase: number;
  reducaoAtaqueTurno: number;
  /** Só a última Figura do Horizonte tem: a regra do chefe do tema. */
  chefe?: RegraChefe;
  /** Chefe 'renasce': já voltou uma vez. */
  renasceu?: boolean;
}

export interface Jogador {
  nome: string;
  classe: Naipe;
  vida: number;
  vidaMax: number;
  mao: CartaAcao[];
  aliados: AliadoRecrutado[];
  trofeus: FiguraHorizonte[];
  pontosTrofeu: number;
  eliminado: boolean;
}

export interface Partida {
  modo: ModoDeJogo;
  /** Opcionais porque partidas salvas antes destas regras não os têm. */
  nivel?: Nivel;
  chefe?: RegraChefe;
  jogadores: Jogador[];
  baralhoCompra: CartaAcao[];
  descarte: CartaAcao[];
  horizonteDeck: FiguraHorizonte[];
  ameacaAtiva: AmeacaAtiva | null;
  turnoDe: number;
  rodada: number;
  fase: 'acao' | 'bloqueio' | 'fim';
  danoPendente: number;
  aliadoUsadoNoTurno: boolean;
  resultado: null | 'vitoria' | 'derrota';
  vencedorIdx: number | null;
  motivoFim: string;
  diario: string[];
}

export const REGRA = {
  vidaInicial: 15,
  vidaMaxima: 15,
  maoInicial: 5,
  maoMaxima: 6,
  compraFimTurno: 1,
  maxAliados: 2,
  maxPessoas: 4,
  bonusEspadas: 2,
  bonusAsCombo: 4,
  valorAsSolo: 5,
  valorEstrela: 5,
  valorCaveira: 8,
  recuoCaveira: 2,
  escudoAliado: 4,
  minGolpeDescartePvp: 6,
  maxDescarteCiclo: 2,
} as const;

export const STATUS_FIGURA: Record<
  PostoFigura,
  {
    rotulo: string;
    vida: number;
    ataque: number;
    trofeus: number;
    cargas: number;
    bonusAliado: number;
    saque: number;
    /** Traço ♠ Feroz: ataque extra. */
    ferocidade: number;
    /** Traço ♥ Regenera: PV recuperados no fim de cada turno em que sobrevive. */
    regeneracao: number;
    /** Traço ♦ Blindada: dano descontado de cada golpe que recebe. */
    blindagem: number;
    /** No Cooperativo, PV extras por jogador além do primeiro (o grupo soma dano, mas a Ameaça só ataca quem está jogando). */
    vidaPorJogadorExtra: number;
  }
> = {
  J: { rotulo: 'Valete', vida: 12, ataque: 4, trofeus: 10, cargas: 2, bonusAliado: 2, saque: 1, ferocidade: 1, regeneracao: 2, blindagem: 1, vidaPorJogadorExtra: 2 },
  Q: { rotulo: 'Dama', vida: 18, ataque: 6, trofeus: 15, cargas: 2, bonusAliado: 4, saque: 2, ferocidade: 2, regeneracao: 3, blindagem: 2, vidaPorJogadorExtra: 3 },
  K: { rotulo: 'Rei', vida: 26, ataque: 8, trofeus: 25, cargas: 3, bonusAliado: 6, saque: 2, ferocidade: 3, regeneracao: 4, blindagem: 3, vidaPorJogadorExtra: 4 },
};

/**
 * Cada Ameaça tem um traço dado pelo naipe. Como a ordem das Figuras muda a cada partida,
 * a sequência de problemas a resolver também muda — é a principal fonte de variedade do jogo.
 */
export const TRACO_AMEACA: Record<Naipe, { nome: string; descricao: (posto: PostoFigura) => string }> = {
  spades: {
    nome: 'Feroz',
    descricao: (p) => `Seu Ataque de ${STATUS_FIGURA[p].ataque + STATUS_FIGURA[p].ferocidade} já inclui +${STATUS_FIGURA[p].ferocidade} de força deste traço (base ${STATUS_FIGURA[p].ataque}).`,
  },
  hearts: { nome: 'Regenera', descricao: (p) => `Recupera ${STATUS_FIGURA[p].regeneracao} PV no fim de cada turno em que sobreviver.` },
  diamonds: { nome: 'Blindada', descricao: (p) => `Cada golpe que ela recebe causa ${STATUS_FIGURA[p].blindagem} de dano a menos.` },
  clubs: { nome: 'Imune a armadilhas', descricao: () => 'Nada reduz o ataque dela: ♣, ★ e Figuras de ♣ recrutadas não funcionam.' },
};

export type RegraChefe =
  | 'detencao'
  | 'abordagem'
  | 'fome'
  | 'pulsa'
  | 'geada'
  | 'colossal'
  | 'firewall'
  | 'sombra'
  | 'portas'
  | 'drena'
  | 'racionamento'
  | 'renasce';

export const PONTUACAO = { vitoria: 50, rodadasParaBonus: 40, porRodadaPoupada: 2 } as const;

const CHEFE = { colossalVida: 20, firewall: 8, maoDetencao: 3, pulsa: 3, portas: 1, fome: 2, drena: 2, abordagem: 2, geadaPorCarta: 1 } as const;

/**
 * A última Figura do Horizonte é o chefe do tema: além do traço do naipe, ganha a regra do tema.
 * É o que faz cada um dos 12 temas terminar de um jeito diferente.
 */
export const REGRA_CHEFE: Record<RegraChefe, { nome: string; descricao: string }> = {
  detencao: { nome: 'Detenção', descricao: `Ninguém compra cartas além de ${CHEFE.maoDetencao} na mão.` },
  abordagem: { nome: 'Abordagem', descricao: `Sempre que ele te causa dano, leva ${CHEFE.abordagem} cartas aleatórias da sua mão.` },
  fome: { nome: 'Fome Crescente', descricao: `Ganha +${CHEFE.fome} de Ataque no fim de cada turno.` },
  pulsa: { nome: 'A Trilha Se Fecha', descricao: `Recupera ${CHEFE.pulsa} PV no fim de cada turno (soma com o traço ♥).` },
  geada: { nome: 'Geada', descricao: `Ninguém cura, e cada carta de bloqueio absorve ${CHEFE.geadaPorCarta} a menos.` },
  colossal: { nome: 'Colossal', descricao: `Some +${CHEFE.colossalVida} PV à Vida impressa do Chefe (o Rei passa a ter ${STATUS_FIGURA.K.vida + CHEFE.colossalVida} PV no Solo).` },
  firewall: { nome: 'Firewall', descricao: `Golpes de ${CHEFE.firewall} ou menos de dano não passam.` },
  sombra: { nome: 'Sem Retrato', descricao: 'Golpe de dano ímpar não acerta: só dano par passa.' },
  portas: { nome: 'Portas Seladas', descricao: `Só dá para bloquear com ${CHEFE.portas} carta por ataque (o Escudo de Aliado vale).` },
  drena: { nome: 'Sede', descricao: `Recupera ${CHEFE.drena}× o dano que te causa depois do bloqueio.` },
  racionamento: { nome: 'Racionamento', descricao: '♦, ★ e Aliados de ♦ não compram cartas.' },
  renasce: { nome: 'Levanta de Novo', descricao: 'Ao cair pela 1ª vez, volta com metade da Vida; só então pode ser recrutado.' },
};

export const NAIPES: Naipe[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const SIMBOLO: Record<Naipe, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };

export const FUNCAO_DO_NAIPE: Record<
  Naipe,
  {
    pilar: string;
    efeito: string;
    corTatica: 'preta' | 'vermelha';
    papelAliado: string;
  }
> = {
  spades: {
    pilar: 'Chumbo & Lâmina',
    efeito: `Causa +${REGRA.bonusEspadas} de dano extra (1 vez por jogada).`,
    corTatica: 'preta',
    papelAliado: 'Causa dano direto na Ameaça ou em um rival.',
  },
  clubs: {
    pilar: 'Sucata & Armadilha',
    efeito: `A Ameaça perde ataque igual à metade do valor jogado, só neste turno. No PvP, um golpe de ${REGRA.minGolpeDescartePvp}+ de dano faz o rival descartar 1 carta.`,
    corTatica: 'preta',
    papelAliado: 'Reduz o ataque da Ameaça neste turno.',
  },
  diamonds: {
    pilar: 'Tecnologia & Combustível',
    efeito: 'Você compra 1 carta (2 se o valor jogado for 7 ou mais). Pode recrutar a Ameaça no golpe final.',
    corTatica: 'vermelha',
    papelAliado: 'Compra cartas extras de suprimento.',
  },
  hearts: {
    pilar: 'Suprimento & Carisma',
    efeito: 'Você cura PV igual à metade do valor jogado (arredonde para cima). Pode recrutar a Ameaça no golpe final.',
    corTatica: 'vermelha',
    papelAliado: 'Restaura PV (no Coop, cura quem está mais ferido).',
  },
};

export interface Classe {
  nome: string;
  descricao: string;
}

/** Cada Especialização reforça o efeito do próprio naipe, não só o dano: são papéis diferentes na mesa. */
const BONUS_CLASSE: Record<Naipe, number> = { spades: 2, hearts: 2, diamonds: 1, clubs: 2 };

export const CLASSES: Record<Naipe, Classe> = {
  spades: { nome: 'Atirador', descricao: `Jogadas com ♠ causam +${BONUS_CLASSE.spades} de dano.` },
  hearts: { nome: 'Médico / Diplomata', descricao: `Jogadas com ♥ curam +${BONUS_CLASSE.hearts} PV.` },
  diamonds: { nome: 'Engenheiro / Hacker', descricao: `Jogadas com ♦ compram +${BONUS_CLASSE.diamonds} carta.` },
  clubs: { nome: 'Sabotador', descricao: `Jogadas com ♣ tiram +${BONUS_CLASSE.clubs} do ataque da Ameaça.` },
};

export type AlvoJogada = 'horizonte_abater' | 'horizonte_recrutar' | { rival: number };

export type Acao =
  | { tipo: 'jogarCartas'; quem: number; indicesMao: number[]; alvo: AlvoJogada }
  | { tipo: 'usarAliado'; quem: number; indiceAliado: number; alvoRival?: number }
  | { tipo: 'bloquear'; quem: number; indicesMao: number[]; usarAliadoEscudo?: number }
  | { tipo: 'passarTurno'; quem: number; descartarIndices?: number[] };

export interface PreviaJogada {
  valida: boolean;
  motivoInvalida?: string;
  tipoCombo: string;
  valorBase: number;
  bonusEspadas: number;
  bonusAfinidade: number;
  poderTotal: number;
  reducaoAtaque: number;
  cartasComprar: number;
  cura: number;
  danoRecuo: number;
  forcarDescartePvp: number;
  habilitaRecrutar: boolean;
  naipes: Naipe[];
}

export interface OpcoesCriarPartida {
  modo?: ModoDeJogo;
  nivel?: Nivel;
  jogadores: Array<{ nome: string; classe: Naipe }>;
  baralhoCompra?: CartaAcao[];
  horizonteDeck?: FiguraHorizonte[];
  maosIniciais?: CartaAcao[][];
  embaralhar?: boolean;
  chefe?: RegraChefe;
}

// ---------- Utilitários de Carta ----------

export function ehCoringa(c: CartaAcao): c is { coringa: 'estrela' | 'caveira' } {
  return 'coringa' in c;
}

export function codigoCarta(c: CartaAcao): string {
  if (ehCoringa(c)) return c.coringa === 'estrela' ? '★' : '💀';
  const r = c.valor === 1 ? 'A' : String(c.valor);
  return `${r}${SIMBOLO[c.naipe]}`;
}

export function codigoFigura(f: FiguraHorizonte): string {
  return `${f.posto}${SIMBOLO[f.naipe]}`;
}

export function valorBloqueioCarta(c: CartaAcao): number {
  if (ehCoringa(c)) return c.coringa === 'estrela' ? REGRA.valorEstrela : REGRA.valorCaveira;
  return c.valor === 1 ? REGRA.valorAsSolo : c.valor;
}

function estaEmJogo(j: Jogador | undefined): boolean {
  return !!j && !j.eliminado && j.vida > 0;
}

function ehVermelha(c: CartaAcao): boolean {
  if (ehCoringa(c)) return true;
  return c.naipe === 'hearts' || c.naipe === 'diamonds';
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function criarBaralhoAcao(embaralhar = true): CartaAcao[] {
  const deck: CartaAcao[] = [];
  for (const naipe of NAIPES) {
    for (let valor = 1; valor <= 10; valor++) {
      deck.push({ valor, naipe });
    }
  }
  deck.push({ coringa: 'estrela' }, { coringa: 'caveira' });
  return embaralhar ? shuffle(deck) : deck;
}

export function criarHorizonteDeck(embaralhar = true): FiguraHorizonte[] {
  const valetes: FiguraHorizonte[] = NAIPES.map((naipe) => ({ posto: 'J', naipe }));
  const damas: FiguraHorizonte[] = NAIPES.map((naipe) => ({ posto: 'Q', naipe }));
  const reis: FiguraHorizonte[] = NAIPES.map((naipe) => ({ posto: 'K', naipe }));
  if (!embaralhar) return [...valetes, ...damas, ...reis];
  return [...shuffle(valetes), ...shuffle(damas), ...shuffle(reis)];
}

function vidaDaAmeaca(posto: PostoFigura, modo: ModoDeJogo, totalJogadores: number): number {
  const st = STATUS_FIGURA[posto];
  const extras = modo === 'coop' ? totalJogadores - 1 : 0;
  return st.vida + extras * st.vidaPorJogadorExtra;
}

function instanciarAmeaca(figura: FiguraHorizonte, modo: ModoDeJogo, totalJogadores: number, chefe?: RegraChefe): AmeacaAtiva {
  const st = STATUS_FIGURA[figura.posto];
  const colossal = chefe === 'colossal';
  const vida = vidaDaAmeaca(figura.posto, modo, totalJogadores) + (colossal ? CHEFE.colossalVida : 0);
  return {
    figura,
    vidaAtual: vida,
    vidaMax: vida,
    ataqueBase: st.ataque + (figura.naipe === 'spades' ? st.ferocidade : 0),
    reducaoAtaqueTurno: 0,
    ...(chefe ? { chefe } : {}),
  };
}

export function ataqueEfetivoAmeaca(ameaca: AmeacaAtiva | null): number {
  if (!ameaca) return 0;
  if (ameaca.figura.naipe === 'clubs') return ameaca.ataqueBase;
  return Math.max(0, ameaca.ataqueBase - ameaca.reducaoAtaqueTurno);
}

/** Dano que um golpe realmente tira da Ameaça, descontada a blindagem (♦) e as regras de chefe. */
export function danoNaAmeaca(ameaca: AmeacaAtiva, dano: number): number {
  const blindagem = ameaca.figura.naipe === 'diamonds' ? STATUS_FIGURA[ameaca.figura.posto].blindagem : 0;
  const golpe = Math.max(0, dano - blindagem);
  if (ameaca.chefe === 'firewall' && golpe <= CHEFE.firewall) return 0;
  if (ameaca.chefe === 'sombra' && golpe % 2 === 1) return 0;
  return golpe;
}

/** O golpe tira a Ameaça de vez? O chefe que renasce não cai na primeira vez. */
export function golpeDerruba(ameaca: AmeacaAtiva, dano: number): boolean {
  return danoNaAmeaca(ameaca, dano) >= ameaca.vidaAtual && !(ameaca.chefe === 'renasce' && !ameaca.renasceu);
}

/** Aplica o golpe na cópia da Ameaça recebida (muta `ameaca`). */
function golpearAmeaca(ameaca: AmeacaAtiva, dano: number, diario: string[]): void {
  ameaca.vidaAtual = Math.max(0, ameaca.vidaAtual - danoNaAmeaca(ameaca, dano));
  if (ameaca.vidaAtual > 0 || ameaca.chefe !== 'renasce' || ameaca.renasceu) return;
  ameaca.vidaAtual = Math.ceil(ameaca.vidaMax / 2);
  ameaca.renasceu = true;
  diario.push(`${codigoFigura(ameaca.figura)} levanta de novo com ${ameaca.vidaAtual} PV!`);
}

function fimDoTurnoDaAmeaca(ameaca: AmeacaAtiva, diario: string[]): AmeacaAtiva {
  const proxima = { ...ameaca, reducaoAtaqueTurno: 0 };
  if (ameaca.chefe === 'fome') {
    proxima.ataqueBase += CHEFE.fome;
    diario.push(`${codigoFigura(ameaca.figura)} tem mais fome (Ataque ${proxima.ataqueBase}).`);
  }
  const regeneracao =
    (ameaca.figura.naipe === 'hearts' ? STATUS_FIGURA[ameaca.figura.posto].regeneracao : 0) +
    (ameaca.chefe === 'pulsa' ? CHEFE.pulsa : 0);
  if (regeneracao === 0 || ameaca.vidaAtual >= ameaca.vidaMax) return proxima;
  proxima.vidaAtual = Math.min(ameaca.vidaMax, ameaca.vidaAtual + regeneracao);
  diario.push(`${codigoFigura(ameaca.figura)} se regenera (+${proxima.vidaAtual - ameaca.vidaAtual} PV).`);
  return proxima;
}

function limiteDeMao(ameaca: AmeacaAtiva | null): number {
  return ameaca?.chefe === 'detencao' ? CHEFE.maoDetencao : REGRA.maoMaxima;
}

/** Cura que chega a um jogador: zero sob a Geada do chefe. */
function curaEfetiva(partida: Partida, cura: number): number {
  return partida.ameacaAtiva?.chefe === 'geada' ? 0 : cura;
}

// ---------- Criação de Partida ----------

export function criarPartida(opcoes: OpcoesCriarPartida): Partida {
  const embaralhar = opcoes.embaralhar ?? true;
  const totalPessoas = Math.max(1, Math.min(REGRA.maxPessoas, opcoes.jogadores.length));
  const modo: ModoDeJogo = totalPessoas === 1 ? 'solo' : opcoes.modo && opcoes.modo !== 'solo' ? opcoes.modo : 'coop';

  let baralhoCompra = opcoes.baralhoCompra ? [...opcoes.baralhoCompra] : criarBaralhoAcao(embaralhar);
  const horizonteDeck = opcoes.horizonteDeck ? [...opcoes.horizonteDeck] : criarHorizonteDeck(embaralhar);
  const vidaDoNivel = opcoes.nivel ? NIVEIS[opcoes.nivel].vida : REGRA.vidaInicial;

  const jogadores: Jogador[] = opcoes.jogadores.slice(0, totalPessoas).map((j, idx) => {
    let mao: CartaAcao[];
    if (opcoes.maosIniciais && opcoes.maosIniciais[idx]) {
      mao = [...opcoes.maosIniciais[idx]];
    } else {
      mao = baralhoCompra.slice(0, REGRA.maoInicial);
      baralhoCompra = baralhoCompra.slice(REGRA.maoInicial);
    }
    return {
      nome: j.nome.trim() || `Jogador ${idx + 1}`,
      classe: j.classe,
      vida: vidaDoNivel,
      vidaMax: vidaDoNivel,
      mao,
      aliados: [],
      trofeus: [],
      pontosTrofeu: 0,
      eliminado: false,
    };
  });

  const primeiraFigura = horizonteDeck.shift() ?? null;
  const chefeJaNaMesa = horizonteDeck.length === 0 ? opcoes.chefe : undefined;
  const ameacaAtiva = primeiraFigura ? instanciarAmeaca(primeiraFigura, modo, jogadores.length, chefeJaNaMesa) : null;
  const modoRotulo = modo === 'solo' ? 'Solo' : modo === 'coop' ? 'Cooperativo' : 'Competitivo PvP';
  const diario: string[] = [
    `Partida ${modoRotulo} iniciada com ${jogadores.map((j) => `${j.nome} (${SIMBOLO[j.classe]} ${CLASSES[j.classe].nome})`).join(', ')}.`,
  ];
  if (ameacaAtiva) {
    diario.push(`O Horizonte revela ${codigoFigura(ameacaAtiva.figura)} (Vida ${ameacaAtiva.vidaMax} · Ataque ${ameacaAtiva.ataqueBase}).`);
  }

  return {
    modo,
    nivel: opcoes.nivel ?? 'veterano',
    ...(opcoes.chefe ? { chefe: opcoes.chefe } : {}),
    jogadores,
    baralhoCompra,
    descarte: [],
    horizonteDeck,
    ameacaAtiva,
    turnoDe: 0,
    rodada: 1,
    fase: ameacaAtiva ? 'acao' : 'fim',
    danoPendente: 0,
    aliadoUsadoNoTurno: false,
    resultado: ameacaAtiva ? null : 'vitoria',
    vencedorIdx: null,
    motivoFim: ameacaAtiva ? '' : 'Nenhuma ameaça restante.',
    diario,
  };
}

// ---------- Validação e Prévia de Jogada ----------

export function simularJogada(partida: Partida, quem: number, indicesMao: number[]): PreviaJogada {
  const invalida = (motivoInvalida: string): PreviaJogada => ({
    valida: false,
    motivoInvalida,
    tipoCombo: 'Inválido',
    valorBase: 0,
    bonusEspadas: 0,
    bonusAfinidade: 0,
    poderTotal: 0,
    reducaoAtaque: 0,
    cartasComprar: 0,
    cura: 0,
    danoRecuo: 0,
    forcarDescartePvp: 0,
    habilitaRecrutar: false,
    naipes: [],
  });

  const jogador = partida.jogadores[quem];
  if (!jogador) return invalida('Jogador inválido.');
  if (indicesMao.length === 0) return invalida('Selecione ao menos 1 carta.');

  const unicos = new Set(indicesMao);
  if (unicos.size !== indicesMao.length) return invalida('Índices repetidos.');
  if (indicesMao.some((i) => !Number.isInteger(i) || i < 0 || i >= jogador.mao.length)) {
    return invalida('Carta fora da mão.');
  }

  const cartas = indicesMao.map((i) => jogador.mao[i]);
  let tipoCombo = '';
  let valorBase = 0;

  if (cartas.length === 1) {
    const c = cartas[0];
    if (ehCoringa(c)) {
      tipoCombo = c.coringa === 'estrela' ? 'Coringa ★ (Suprimento Raro)' : 'Coringa 💀 (Impacto Crítico)';
      valorBase = c.coringa === 'estrela' ? REGRA.valorEstrela : REGRA.valorCaveira;
    } else {
      tipoCombo = c.valor === 1 ? 'Ás Solitário' : 'Carta Única';
      valorBase = c.valor === 1 ? REGRA.valorAsSolo : c.valor;
    }
  } else {
    if (cartas.some(ehCoringa)) {
      return invalida('Coringas devem ser jogados sozinhos.');
    }
    const numericas = cartas as CartaNumerica[];
    const todosIguais = numericas.every((c) => c.valor === numericas[0].valor);
    if (todosIguais && numericas.length <= 4) {
      const v = numericas[0].valor;
      const nomes = ['', '', 'Par', 'Trinca', 'Quadra'];
      tipoCombo = `${nomes[numericas.length]} de ${v === 1 ? 'Ases' : v}`;
      valorBase = v === 1 ? REGRA.valorAsSolo + (numericas.length - 1) * REGRA.bonusAsCombo : v * numericas.length;
    } else if (numericas.length === 2 && numericas.some((c) => c.valor === 1)) {
      const outra = numericas.find((c) => c.valor !== 1)!;
      tipoCombo = `Combo de Comando (${outra.valor} + Ás)`;
      valorBase = outra.valor + REGRA.bonusAsCombo;
    } else {
      return invalida('Combine 2–4 cartas de mesmo valor ou 1 carta numérica + 1 Ás.');
    }
  }

  const naipesSet = new Set<Naipe>();
  for (const c of cartas) {
    if (!ehCoringa(c)) naipesSet.add(c.naipe);
  }
  const naipes = Array.from(naipesSet);

  const temEstrela = cartas.some((c) => ehCoringa(c) && c.coringa === 'estrela');
  const temCaveira = cartas.some((c) => ehCoringa(c) && c.coringa === 'caveira');

  const bonusDaClasse = (naipe: Naipe): number => (jogador.classe === naipe && naipesSet.has(naipe) ? BONUS_CLASSE[naipe] : 0);
  const bonusEspadas = naipesSet.has('spades') ? REGRA.bonusEspadas : 0;
  const bonusAfinidade = bonusDaClasse('spades');
  const poderTotal = valorBase + bonusEspadas + bonusAfinidade;

  let reducaoAtaque = naipesSet.has('clubs') ? Math.ceil(valorBase / 2) + bonusDaClasse('clubs') : 0;
  let cartasComprar = naipesSet.has('diamonds') ? (valorBase >= 7 ? 2 : 1) + bonusDaClasse('diamonds') : 0;
  let cura = naipesSet.has('hearts') ? Math.ceil(valorBase / 2) + bonusDaClasse('hearts') : 0;
  let danoRecuo = 0;

  if (temEstrela) {
    cura += 4;
    cartasComprar += 2;
    reducaoAtaque += 3;
  }
  if (temCaveira) {
    danoRecuo += REGRA.recuoCaveira;
  }
  cura = curaEfetiva(partida, cura);
  if (partida.ameacaAtiva?.chefe === 'racionamento') cartasComprar = 0;

  const forcarDescartePvp = naipesSet.has('clubs') && poderTotal >= REGRA.minGolpeDescartePvp ? 1 : 0;
  const habilitaRecrutar = cartas.some(ehVermelha);

  return {
    valida: true,
    tipoCombo,
    valorBase,
    bonusEspadas,
    bonusAfinidade,
    poderTotal,
    reducaoAtaque,
    cartasComprar,
    cura,
    danoRecuo,
    forcarDescartePvp,
    habilitaRecrutar,
    naipes,
  };
}

// ---------- Helpers Internos de Estado ----------

function comprarCartas(
  baralhoCompra: CartaAcao[],
  descarte: CartaAcao[],
  quantidade: number,
  limiteMaoAtual: number,
  maoAtual: CartaAcao[],
): { baralhoCompra: CartaAcao[]; descarte: CartaAcao[]; mao: CartaAcao[]; compradas: number } {
  let compra = [...baralhoCompra];
  let desc = [...descarte];
  const mao = [...maoAtual];
  let compradas = 0;

  while (compradas < quantidade && mao.length < limiteMaoAtual) {
    if (compra.length === 0) {
      if (desc.length === 0) break;
      compra = shuffle(desc);
      desc = [];
    }
    const topo = compra.shift();
    if (!topo) break;
    mao.push(topo);
    compradas++;
  }

  return { baralhoCompra: compra, descarte: desc, mao, compradas };
}

function removerIndices<T>(lista: T[], indices: number[]): { restantes: T[]; removidos: T[] } {
  const remover = new Set(indices);
  const restantes: T[] = [];
  const removidos: T[] = [];
  lista.forEach((item, i) => {
    if (remover.has(i)) removidos.push(item);
    else restantes.push(item);
  });
  return { restantes, removidos };
}

function proximoJogadorVivo(jogadores: Jogador[], atual: number): { indice: number; virouRodada: boolean } {
  for (let offset = 1; offset <= jogadores.length; offset++) {
    const idx = (atual + offset) % jogadores.length;
    if (!jogadores[idx].eliminado) {
      return { indice: idx, virouRodada: idx <= atual };
    }
  }
  return { indice: atual, virouRodada: false };
}

function indiceAlvoCuraCoop(jogadores: Jogador[], quem: number): number {
  let alvoIdx = quem;
  let menorVida = jogadores[quem]?.vida ?? Infinity;
  for (let offset = 1; offset <= jogadores.length; offset++) {
    const idx = (quem + offset) % jogadores.length;
    const p = jogadores[idx];
    if (!p.eliminado && p.vida < menorVida) {
      menorVida = p.vida;
      alvoIdx = idx;
    }
  }
  return alvoIdx;
}

export function pontosDeDominio(jogador: Jogador): number {
  const bonusAliados = jogador.aliados.reduce((acc, a) => acc + Math.floor(STATUS_FIGURA[a.figura.posto].trofeus / 2), 0);
  return jogador.pontosTrofeu + jogador.vida + bonusAliados;
}

function finalizarPorHorizonteLimpo(partida: Partida, diario: string[]): Partida {
  if (partida.modo === 'pvp') {
    const vivos = partida.jogadores
      .map((j, idx) => ({ j, idx, pts: pontosDeDominio(j) }))
      .filter((x) => !x.j.eliminado);
    vivos.sort((a, b) => b.pts - a.pts || b.j.vida - a.j.vida);
    const vencedor = vivos[0];
    const motivoFim = vencedor
      ? `O Horizonte foi limpo! ${vencedor.j.nome} venceu com ${vencedor.pts} pontos de Domínio.`
      : 'O Horizonte foi limpo!';
    return {
      ...partida,
      ameacaAtiva: null,
      fase: 'fim',
      danoPendente: 0,
      resultado: 'vitoria',
      vencedorIdx: vencedor?.idx ?? null,
      motivoFim,
      diario: [...diario, motivoFim],
    };
  }

  const fim: Partida = { ...partida, ameacaAtiva: null, fase: 'fim', danoPendente: 0, resultado: 'vitoria', vencedorIdx: null };
  const motivoFim =
    partida.modo === 'solo'
      ? `Vitória Solo! Todas as 12 Ameaças do Horizonte foram derrotadas. Pontuação: ${pontuacaoSolo(fim)}.`
      : 'Vitória Cooperativa! O grupo superou todas as 12 Ameaças do Horizonte.';
  return { ...fim, motivoFim, diario: [...diario, motivoFim] };
}

function verificarEliminacoesEAvancar(
  partida: Partida,
  jogadoresAtualizados: Jogador[],
  baralhoCompra: CartaAcao[],
  descarte: CartaAcao[],
  ameacaAtiva: AmeacaAtiva | null,
  quem: number,
  diario: string[],
): Partida {
  const jogadores = jogadoresAtualizados.map((j) => (j.vida <= 0 ? { ...j, vida: 0, eliminado: true } : j));
  const alguemCaiu = jogadores.some((j) => j.eliminado);

  if (alguemCaiu && (partida.modo === 'solo' || partida.modo === 'coop')) {
    const caido = jogadores.find((j) => j.eliminado)!;
    const fim: Partida = {
      ...partida,
      jogadores,
      baralhoCompra,
      descarte,
      ameacaAtiva,
      fase: 'fim',
      danoPendente: 0,
      resultado: 'derrota',
      vencedorIdx: null,
    };
    const motivoFim =
      partida.modo === 'solo'
        ? `${caido.nome} caiu sem PV diante do Horizonte. Pontuação: ${pontuacaoSolo(fim)}.`
        : `${caido.nome} não resistiu aos ferimentos. No modo Cooperativo, o grupo cai junto.`;
    return { ...fim, motivoFim, diario: [...diario, motivoFim] };
  }

  if (partida.modo === 'pvp') {
    const vivos = jogadores.map((j, idx) => ({ j, idx })).filter((x) => !x.j.eliminado);
    if (vivos.length === 1) {
      const sobrevivente = vivos[0];
      const motivoFim = `${sobrevivente.j.nome} é o último sobrevivente do Horizonte!`;
      return {
        ...partida,
        jogadores,
        baralhoCompra,
        descarte,
        ameacaAtiva,
        fase: 'fim',
        danoPendente: 0,
        resultado: 'vitoria',
        vencedorIdx: sobrevivente.idx,
        motivoFim,
        diario: [...diario, motivoFim],
      };
    }
    if (vivos.length === 0) {
      const motivoFim = 'Todos os sobreviventes caíram simultaneamente no conflito.';
      return {
        ...partida,
        jogadores,
        baralhoCompra,
        descarte,
        ameacaAtiva,
        fase: 'fim',
        danoPendente: 0,
        resultado: 'derrota',
        vencedorIdx: null,
        motivoFim,
        diario: [...diario, motivoFim],
      };
    }
  }

  // Compra fixa de fim de turno: cartas gastas no bloqueio fazem falta no próximo ataque
  let compra = baralhoCompra;
  let desc = descarte;
  const jogadoresComCompra = jogadores.map((j, idx) => {
    if (idx !== quem || j.eliminado) return j;
    const res = comprarCartas(compra, desc, REGRA.compraFimTurno, limiteDeMao(ameacaAtiva), j.mao);
    compra = res.baralhoCompra;
    desc = res.descarte;
    return { ...j, mao: res.mao };
  });

  const prox = proximoJogadorVivo(jogadoresComCompra, quem);
  const proxAmeaca = ameacaAtiva ? fimDoTurnoDaAmeaca(ameacaAtiva, diario) : null;

  return {
    ...partida,
    jogadores: jogadoresComCompra,
    baralhoCompra: compra,
    descarte: desc,
    ameacaAtiva: proxAmeaca,
    turnoDe: prox.indice,
    rodada: partida.rodada + (prox.virouRodada ? 1 : 0),
    fase: 'acao',
    danoPendente: 0,
    aliadoUsadoNoTurno: false,
    diario,
  };
}

type SeguirAposRevelar = (
  partida: Partida,
  jogadores: Jogador[],
  baralhoCompra: CartaAcao[],
  descarte: CartaAcao[],
  novaAmeaca: AmeacaAtiva,
  quem: number,
  diario: string[],
) => Partida;

/** Depois de um ataque da mão, a nova Ameaça entra e o turno passa. */
const encerrarTurno: SeguirAposRevelar = verificarEliminacoesEAvancar;

/** Depois de um disparo de Aliado, a nova Ameaça entra e o jogador ainda faz a ação principal. */
const continuarTurno: SeguirAposRevelar = (partida, jogadores, baralhoCompra, descarte, novaAmeaca, _quem, diario) => ({
  ...partida,
  jogadores,
  baralhoCompra,
  descarte,
  ameacaAtiva: novaAmeaca,
  fase: 'acao',
  aliadoUsadoNoTurno: true,
  diario,
});

function resolverDerrotaDeAmeaca(
  partida: Partida,
  jogadoresAtualizados: Jogador[],
  baralhoCompra: CartaAcao[],
  descarte: CartaAcao[],
  horizonteDeckAtual: FiguraHorizonte[],
  figuraDerrotada: FiguraHorizonte,
  quem: number,
  recrutar: boolean,
  diario: string[],
  seguir: SeguirAposRevelar = encerrarTurno,
): Partida {
  const stats = STATUS_FIGURA[figuraDerrotada.posto];
  let compra = baralhoCompra;
  let desc = descarte;
  const jogadores = [...jogadoresAtualizados];
  const j = { ...jogadores[quem], aliados: [...jogadores[quem].aliados], trofeus: [...jogadores[quem].trofeus] };

  if (recrutar && j.vida > 0) {
    if (j.aliados.length >= REGRA.maxAliados) {
      const dispensado = j.aliados.shift()!;
      const ptsDisp = Math.floor(STATUS_FIGURA[dispensado.figura.posto].trofeus / 2);
      j.trofeus.push(dispensado.figura);
      j.pontosTrofeu += ptsDisp;
      diario.push(`${j.nome} dispensou ${codigoFigura(dispensado.figura)} para os troféus (+${ptsDisp} pts).`);
    }
    j.aliados.push({ figura: figuraDerrotada, cargas: stats.cargas, maxCargas: stats.cargas });
    diario.push(`${j.nome} recrutou ${codigoFigura(figuraDerrotada)} (${stats.cargas} cargas)!`);
  } else if (j.vida > 0) {
    j.trofeus.push(figuraDerrotada);
    j.pontosTrofeu += stats.trofeus;
    const saque = comprarCartas(compra, desc, stats.saque, REGRA.maoMaxima, j.mao);
    compra = saque.baralhoCompra;
    desc = saque.descarte;
    j.mao = saque.mao;
    diario.push(`${j.nome} abateu ${codigoFigura(figuraDerrotada)} (+${stats.trofeus} pts, saque +${saque.compradas}).`);
  } else {
    j.trofeus.push(figuraDerrotada);
    j.pontosTrofeu += stats.trofeus;
    diario.push(`${j.nome} abateu ${codigoFigura(figuraDerrotada)} no sacrifício final (+${stats.trofeus} pts).`);
  }

  jogadores[quem] = j;

  // Em Solo/Coop, se quem jogou morreu pelo recuo (💀), a derrota do grupo prevalece mesmo na última Ameaça
  if (jogadores.some((p) => p.vida <= 0) && (partida.modo === 'solo' || partida.modo === 'coop')) {
    return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, null, quem, diario);
  }

  const novoHorizonte = [...horizonteDeckAtual];
  const proximaFigura = novoHorizonte.shift() ?? null;

  if (!proximaFigura) {
    const jogadoresFinais = jogadores.map((p) => (p.vida <= 0 ? { ...p, vida: 0, eliminado: true } : p));
    const baseFinal: Partida = {
      ...partida,
      jogadores: jogadoresFinais,
      baralhoCompra: compra,
      descarte: desc,
      horizonteDeck: [],
      ameacaAtiva: null,
    };
    return finalizarPorHorizonteLimpo(baseFinal, diario);
  }

  const chefe = novoHorizonte.length === 0 ? partida.chefe : undefined;
  const novaAmeaca = instanciarAmeaca(proximaFigura, partida.modo, partida.jogadores.length, chefe);
  diario.push(`Nova Ameaça no Horizonte: ${codigoFigura(proximaFigura)} (Vida ${novaAmeaca.vidaMax} · Ataque ${novaAmeaca.ataqueBase}).`);
  if (chefe) diario.push(`É o chefe final! ${REGRA_CHEFE[chefe].nome}: ${REGRA_CHEFE[chefe].descricao}`);

  return seguir(
    { ...partida, horizonteDeck: novoHorizonte },
    jogadores,
    compra,
    desc,
    novaAmeaca,
    quem,
    diario,
  );
}

// ---------- Ação Principal ----------

export function agir(partida: Partida, acao: Acao): Partida {
  if (partida.resultado !== null || partida.fase === 'fim') return partida;
  if (acao.quem !== partida.turnoDe) return partida;

  const jogadorAtual = partida.jogadores[acao.quem];
  if (!jogadorAtual || jogadorAtual.eliminado) return partida;

  if (acao.tipo === 'jogarCartas') {
    if (partida.fase !== 'acao') return partida;

    const previa = simularJogada(partida, acao.quem, acao.indicesMao);
    if (!previa.valida) return partida;

    const ehContraRival = typeof acao.alvo === 'object' && 'rival' in acao.alvo;
    if (ehContraRival) {
      if (partida.modo !== 'pvp' || partida.rodada < 2) return partida;
      const rIdx = (acao.alvo as { rival: number }).rival;
      if (rIdx === acao.quem || !estaEmJogo(partida.jogadores[rIdx])) return partida;
    } else {
      if (!partida.ameacaAtiva) return partida;
      if (acao.alvo === 'horizonte_recrutar') {
        if (!previa.habilitaRecrutar || !golpeDerruba(partida.ameacaAtiva, previa.poderTotal)) {
          return partida;
        }
      }
    }

    const { restantes, removidos } = removerIndices(jogadorAtual.mao, acao.indicesMao);
    let compra = [...partida.baralhoCompra];
    let desc = [...partida.descarte, ...removidos];
    const diario = [...partida.diario];

    const jogadores = partida.jogadores.map((j) => ({ ...j, mao: [...j.mao] }));
    let j = { ...jogadores[acao.quem], mao: restantes };

    // Aplica cura (no Coop, cura o jogador vivo mais ferido; caso contrário, o próprio jogador)
    if (previa.cura > 0) {
      jogadores[acao.quem] = j;
      const alvoCuraIdx = partida.modo === 'coop' ? indiceAlvoCuraCoop(jogadores, acao.quem) : acao.quem;
      if (alvoCuraIdx === acao.quem) {
        const antes = j.vida;
        j.vida = Math.min(j.vidaMax, j.vida + previa.cura);
        if (j.vida > antes) diario.push(`${j.nome} recuperou +${j.vida - antes} PV.`);
      } else {
        const aliado = jogadores[alvoCuraIdx];
        const antes = aliado.vida;
        aliado.vida = Math.min(aliado.vidaMax, aliado.vida + previa.cura);
        if (aliado.vida > antes) diario.push(`${j.nome} curou ${aliado.nome} (+${aliado.vida - antes} PV).`);
      }
    }

    // Aplica compra de ♦ / ★
    if (previa.cartasComprar > 0) {
      const resCompra = comprarCartas(compra, desc, previa.cartasComprar, limiteDeMao(partida.ameacaAtiva), j.mao);
      compra = resCompra.baralhoCompra;
      desc = resCompra.descarte;
      j.mao = resCompra.mao;
      if (resCompra.compradas > 0) diario.push(`${j.nome} comprou +${resCompra.compradas} carta(s).`);
    }

    // Aplica recuo do Coringa Escuro 💀
    if (previa.danoRecuo > 0) {
      j.vida = Math.max(0, j.vida - previa.danoRecuo);
      diario.push(`${j.nome} sofreu ${previa.danoRecuo} de recuo do Coringa Escuro (💀).`);
    }

    jogadores[acao.quem] = j;

    const nomesCartas = removidos.map(codigoCarta).join(' + ');

    // Caso 1: Ataque contra Rival no PvP (Fogo Cruzado: metade p/ cima no rival, metade p/ baixo na Ameaça)
    if (ehContraRival) {
      const rIdx = (acao.alvo as { rival: number }).rival;
      const rival = { ...jogadores[rIdx], mao: [...jogadores[rIdx].mao] };
      const danoNoRival = Math.ceil(previa.poderTotal / 2);
      const poderNaAmeaca = Math.floor(previa.poderTotal / 2);
      rival.vida = Math.max(0, rival.vida - danoNoRival);
      let msgDescarte = '';
      if (previa.forcarDescartePvp > 0 && rival.mao.length > 0) {
        const [descartada] = rival.mao.splice(Math.floor(Math.random() * rival.mao.length), 1);
        desc = [...desc, descartada];
        msgDescarte = ` e descartou ${codigoCarta(descartada)}`;
      }
      jogadores[rIdx] = rival;

      // Coringa Claro (★) mantém redução de ataque da Ameaça mesmo ao mirar rival; ♣ só reduz ao mirar a Ameaça
      const jogouEstrela = removidos.some((c) => ehCoringa(c) && c.coringa === 'estrela');
      const ameaca = partida.ameacaAtiva
        ? {
            ...partida.ameacaAtiva,
            reducaoAtaqueTurno: partida.ameacaAtiva.reducaoAtaqueTurno + (jogouEstrela ? previa.reducaoAtaque : 0),
          }
        : null;

      const danoAmeaca = ameaca && poderNaAmeaca > 0 ? danoNaAmeaca(ameaca, poderNaAmeaca) : 0;
      diario.push(
        `${j.nome} jogou [${nomesCartas}] (${previa.tipoCombo}) em Fogo Cruzado contra ${rival.nome}: ${danoNoRival} de dano no rival${msgDescarte}${ameaca ? ` e ${danoAmeaca} em ${codigoFigura(ameaca.figura)}` : ''}.`,
      );
      if (ameaca && poderNaAmeaca > 0) {
        golpearAmeaca(ameaca, poderNaAmeaca, diario);
      }

      // Se jogador atual morreu de recuo ou rival caiu e só sobrou 1
      if (j.vida <= 0 || jogadores.filter((p) => p.vida > 0 && !p.eliminado).length <= 1) {
        return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, ameaca, acao.quem, diario);
      }

      // Se a Ameaça caiu com a metade do Fogo Cruzado, quem jogou a Abate (ganha Troféu + saque, sem contra-ataque!)
      if (ameaca && ameaca.vidaAtual <= 0) {
        return resolverDerrotaDeAmeaca(
          partida,
          jogadores,
          compra,
          desc,
          partida.horizonteDeck,
          ameaca.figura,
          acao.quem,
          false,
          diario,
        );
      }

      // Se a Ameaça do Horizonte ainda está ativa, ela contra-ataca o jogador da vez
      const danoContra = ataqueEfetivoAmeaca(ameaca);
      if (ameaca && danoContra > 0) {
        diario.push(`${codigoFigura(ameaca.figura)} contra-ataca ${j.nome} com ${danoContra} de dano!`);
        return {
          ...partida,
          jogadores,
          baralhoCompra: compra,
          descarte: desc,
          ameacaAtiva: ameaca,
          fase: 'bloqueio',
          danoPendente: danoContra,
          diario,
        };
      }

      return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, ameaca, acao.quem, diario);
    }

    // Caso 2: Jogada contra o Horizonte
    const ameaca = { ...partida.ameacaAtiva! };
    ameaca.reducaoAtaqueTurno += previa.reducaoAtaque;
    const danoCausado = danoNaAmeaca(ameaca, previa.poderTotal);
    diario.push(
      `${j.nome} usou [${nomesCartas}] (${previa.tipoCombo}) contra ${codigoFigura(ameaca.figura)}: ${danoCausado} de dano${previa.reducaoAtaque > 0 ? ` (-${previa.reducaoAtaque} Atq)` : ''}.`,
    );
    golpearAmeaca(ameaca, previa.poderTotal, diario);

    if (ameaca.vidaAtual <= 0) {
      return resolverDerrotaDeAmeaca(
        partida,
        jogadores,
        compra,
        desc,
        partida.horizonteDeck,
        ameaca.figura,
        acao.quem,
        j.vida > 0 && acao.alvo === 'horizonte_recrutar',
        diario,
      );
    }

    if (j.vida <= 0) {
      return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, ameaca, acao.quem, diario);
    }

    const danoContra = ataqueEfetivoAmeaca(ameaca);
    if (danoContra > 0) {
      diario.push(`${codigoFigura(ameaca.figura)} contra-ataca ${j.nome} com ${danoContra} de dano!`);
      return {
        ...partida,
        jogadores,
        baralhoCompra: compra,
        descarte: desc,
        ameacaAtiva: ameaca,
        fase: 'bloqueio',
        danoPendente: danoContra,
        diario,
      };
    }

    diario.push(`${codigoFigura(ameaca.figura)} teve o ataque neutralizado neste turno!`);
    return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, ameaca, acao.quem, diario);
  }

  if (acao.tipo === 'usarAliado') {
    if (partida.fase !== 'acao' || partida.aliadoUsadoNoTurno) return partida;
    const aliado = jogadorAtual.aliados[acao.indiceAliado];
    if (!aliado || aliado.cargas <= 0) return partida;
    if (aliado.figura.naipe === 'diamonds' && partida.ameacaAtiva?.chefe === 'racionamento') return partida;

    const stats = STATUS_FIGURA[aliado.figura.posto];
    let compra = [...partida.baralhoCompra];
    let desc = [...partida.descarte];
    const diario = [...partida.diario];
    const jogadores = partida.jogadores.map((p) => ({
      ...p,
      mao: [...p.mao],
      aliados: p.aliados.map((a) => ({ ...a })),
      trofeus: [...p.trofeus],
    }));

    const j = jogadores[acao.quem];
    const a = j.aliados[acao.indiceAliado];
    a.cargas -= 1;

    let ameaca = partida.ameacaAtiva ? { ...partida.ameacaAtiva } : null;

    if (aliado.figura.naipe === 'spades') {
      if (acao.alvoRival !== undefined) {
        if (partida.modo !== 'pvp' || partida.rodada < 2 || acao.alvoRival === acao.quem) return partida;
        const rival = jogadores[acao.alvoRival];
        if (!estaEmJogo(rival)) return partida;
        rival.vida = Math.max(0, rival.vida - stats.bonusAliado);
        diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} disparou em ${rival.nome}: ${stats.bonusAliado} de dano!`);
      } else if (ameaca) {
        diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} causou ${danoNaAmeaca(ameaca, stats.bonusAliado)} de dano em ${codigoFigura(ameaca.figura)}!`);
        golpearAmeaca(ameaca, stats.bonusAliado, diario);
      }
    } else if (aliado.figura.naipe === 'clubs') {
      if (!ameaca) return partida;
      ameaca.reducaoAtaqueTurno += stats.bonusAliado;
      diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} reduziu o ataque de ${codigoFigura(ameaca.figura)} em ${stats.bonusAliado}!`);
    } else if (aliado.figura.naipe === 'diamonds') {
      const qtd = aliado.figura.posto === 'J' ? 1 : aliado.figura.posto === 'Q' ? 2 : 3;
      const res = comprarCartas(compra, desc, qtd, limiteDeMao(ameaca), j.mao);
      compra = res.baralhoCompra;
      desc = res.descarte;
      j.mao = res.mao;
      diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} garantiu +${res.compradas} carta(s).`);
    } else if (aliado.figura.naipe === 'hearts') {
      const alvoIdx = partida.modo === 'coop' ? indiceAlvoCuraCoop(jogadores, acao.quem) : acao.quem;
      const alvoCura = jogadores[alvoIdx];
      const antes = alvoCura.vida;
      alvoCura.vida = Math.min(alvoCura.vidaMax, alvoCura.vida + curaEfetiva(partida, stats.bonusAliado));
      diario.push(`Aliado ${codigoFigura(aliado.figura)} restaurou +${alvoCura.vida - antes} PV em ${alvoCura.nome}.`);
    }

    if (a.cargas <= 0) {
      j.aliados.splice(acao.indiceAliado, 1);
      const ptsResto = Math.floor(stats.trofeus / 2);
      j.trofeus.push(aliado.figura);
      j.pontosTrofeu += ptsResto;
      diario.push(`${codigoFigura(aliado.figura)} esgotou as cargas e foi para Troféus de ${j.nome} (+${ptsResto} pts).`);
    }

    // Se algum rival morreu pelo aliado no PvP
    if (partida.modo === 'pvp' && jogadores.filter((p) => p.vida > 0 && !p.eliminado).length <= 1) {
      return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, ameaca, acao.quem, diario);
    }

    // Se a Ameaça do Horizonte foi derrotada pelo aliado
    if (ameaca && ameaca.vidaAtual <= 0) {
      return resolverDerrotaDeAmeaca(
        partida,
        jogadores,
        compra,
        desc,
        partida.horizonteDeck,
        ameaca.figura,
        acao.quem,
        false,
        diario,
        continuarTurno,
      );
    }

    return {
      ...partida,
      jogadores,
      baralhoCompra: compra,
      descarte: desc,
      ameacaAtiva: ameaca,
      aliadoUsadoNoTurno: true,
      diario,
    };
  }

  if (acao.tipo === 'bloquear') {
    if (partida.fase !== 'bloqueio') return partida;
    const chefe = partida.ameacaAtiva?.chefe;
    if (chefe === 'portas' && acao.indicesMao.length > CHEFE.portas) return partida;

    const unicos = new Set(acao.indicesMao);
    if (unicos.size !== acao.indicesMao.length) return partida;
    if (acao.indicesMao.some((i) => !Number.isInteger(i) || i < 0 || i >= jogadorAtual.mao.length)) {
      return partida;
    }

    const jogadores = partida.jogadores.map((p) => ({
      ...p,
      mao: [...p.mao],
      aliados: p.aliados.map((a) => ({ ...a })),
      trofeus: [...p.trofeus],
    }));
    const j = jogadores[acao.quem];
    const { restantes, removidos } = removerIndices(j.mao, acao.indicesMao);
    j.mao = restantes;

    const perdaPorCarta = chefe === 'geada' ? CHEFE.geadaPorCarta : 0;
    let bloqueioTotal = removidos.reduce((acc, c) => acc + Math.max(0, valorBloqueioCarta(c) - perdaPorCarta), 0);
    const diario = [...partida.diario];

    if (acao.usarAliadoEscudo !== undefined) {
      if (partida.aliadoUsadoNoTurno) return partida;
      const a = j.aliados[acao.usarAliadoEscudo];
      if (!a || a.cargas <= 0) return partida;
      a.cargas -= 1;
      bloqueioTotal += REGRA.escudoAliado;
      diario.push(`${j.nome} usou ${codigoFigura(a.figura)} como escudo (+${REGRA.escudoAliado} bloqueio).`);
      if (a.cargas <= 0) {
        const fig = a.figura;
        j.aliados.splice(acao.usarAliadoEscudo, 1);
        const pts = Math.floor(STATUS_FIGURA[fig.posto].trofeus / 2);
        j.trofeus.push(fig);
        j.pontosTrofeu += pts;
        diario.push(`${codigoFigura(fig)} foi para Troféus (+${pts} pts).`);
      }
    }

    const danoFinal = Math.max(0, partida.danoPendente - bloqueioTotal);
    j.vida = Math.max(0, j.vida - danoFinal);
    const desc = [...partida.descarte, ...removidos];

    if (removidos.length > 0) {
      diario.push(
        `${j.nome} bloqueou com [${removidos.map(codigoCarta).join(', ')}] (absorveu ${bloqueioTotal}) e sofreu ${danoFinal} de dano (PV: ${j.vida}).`,
      );
    } else {
      diario.push(`${j.nome} recebeu ${danoFinal} de dano direto (PV: ${j.vida}).`);
    }

    const ameaca = partida.ameacaAtiva ? { ...partida.ameacaAtiva } : null;
    if (ameaca && danoFinal > 0) aplicarChefeAoFerir(ameaca, j, danoFinal, desc, diario);

    return verificarEliminacoesEAvancar(partida, jogadores, partida.baralhoCompra, desc, ameaca, acao.quem, diario);
  }

  if (acao.tipo === 'passarTurno') {
    if (partida.fase !== 'acao') return partida;
    const descartar = acao.descartarIndices ?? [];
    if (descartar.length > REGRA.maxDescarteCiclo) return partida;
    const unicos = new Set(descartar);
    if (unicos.size !== descartar.length) return partida;
    if (descartar.some((i) => !Number.isInteger(i) || i < 0 || i >= jogadorAtual.mao.length)) return partida;

    const jogadores = partida.jogadores.map((p) => ({ ...p, mao: [...p.mao] }));
    const { restantes, removidos } = removerIndices(jogadores[acao.quem].mao, descartar);
    jogadores[acao.quem].mao = restantes;
    const desc = [...partida.descarte, ...removidos];
    const diario = [...partida.diario];

    if (removidos.length > 0) {
      diario.push(`${jogadorAtual.nome} reciclou ${removidos.map(codigoCarta).join(', ')}.`);
    } else {
      diario.push(`${jogadorAtual.nome} passou o turno.`);
    }

    const ameaca = partida.ameacaAtiva;
    const danoContra = ataqueEfetivoAmeaca(ameaca);
    if (ameaca && danoContra > 0) {
      diario.push(`${codigoFigura(ameaca.figura)} ataca ${jogadorAtual.nome} com ${danoContra} de dano!`);
      return {
        ...partida,
        jogadores,
        descarte: desc,
        fase: 'bloqueio',
        danoPendente: danoContra,
        diario,
      };
    }

    return verificarEliminacoesEAvancar(partida, jogadores, partida.baralhoCompra, desc, ameaca, acao.quem, diario);
  }

  return partida;
}

/** Regras de chefe que disparam quando o ataque passa do bloqueio (mutam a cópia da Ameaça, o jogador e o descarte). */
function aplicarChefeAoFerir(ameaca: AmeacaAtiva, j: Jogador, dano: number, descarte: CartaAcao[], diario: string[]): void {
  if (ameaca.chefe === 'drena' && ameaca.vidaAtual < ameaca.vidaMax) {
    const antes = ameaca.vidaAtual;
    ameaca.vidaAtual = Math.min(ameaca.vidaMax, ameaca.vidaAtual + dano * CHEFE.drena);
    diario.push(`${codigoFigura(ameaca.figura)} bebe o seu sangue (+${ameaca.vidaAtual - antes} PV).`);
  }
  if (ameaca.chefe !== 'abordagem') return;
  for (let i = 0; i < CHEFE.abordagem && j.mao.length > 0; i++) {
    const [levada] = j.mao.splice(Math.floor(Math.random() * j.mao.length), 1);
    descarte.push(levada);
    diario.push(`${codigoFigura(ameaca.figura)} levou ${codigoCarta(levada)} da mão de ${j.nome}.`);
  }
}

export const EXPLICACAO_PONTUACAO = `A pontuação do Solo soma Troféus, PV restantes, metade do valor dos Aliados, +${PONTUACAO.vitoria} por vencer e +${PONTUACAO.porRodadaPoupada} por rodada abaixo de ${PONTUACAO.rodadasParaBonus}.`;

/** Pontuação do Solo: Domínio (Troféus + PV + Aliados), bônus por vencer e por vencer rápido. */
export function pontuacaoSolo(partida: Partida): number {
  const j = partida.jogadores[0];
  if (!j || partida.modo !== 'solo') return 0;
  const vitoria = partida.resultado === 'vitoria';
  const rapidez = vitoria ? Math.max(0, PONTUACAO.rodadasParaBonus - partida.rodada) * PONTUACAO.porRodadaPoupada : 0;
  return pontosDeDominio(j) + (vitoria ? PONTUACAO.vitoria : 0) + rapidez;
}

export function linhaDeStatus(partida: Partida): string {
  const ameaca = partida.ameacaAtiva
    ? `${codigoFigura(partida.ameacaAtiva.figura)} (${partida.ameacaAtiva.vidaAtual}/${partida.ameacaAtiva.vidaMax} PV · Atq ${ataqueEfetivoAmeaca(partida.ameacaAtiva)})`
    : 'Horizonte limpo';
  const jogs = partida.jogadores
    .map((j) => `${j.nome}: ${j.vida}PV / ${j.pontosTrofeu}pts (${j.aliados.length} al.)`)
    .join(' | ');
  return `HORIZONTE [${partida.modo.toUpperCase()} · R${partida.rodada}] · Ameaça: ${ameaca} · ${jogs}`;
}
