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
  vidaInicial: 20,
  vidaMaxima: 20,
  maoInicial: 5,
  maoMaxima: 7,
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
  }
> = {
  J: { rotulo: 'Valete', vida: 10, ataque: 3, trofeus: 10, cargas: 2, bonusAliado: 2, saque: 1 },
  Q: { rotulo: 'Dama', vida: 14, ataque: 5, trofeus: 15, cargas: 2, bonusAliado: 4, saque: 2 },
  K: { rotulo: 'Rei', vida: 20, ataque: 7, trofeus: 25, cargas: 3, bonusAliado: 6, saque: 2 },
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
    efeito: `+${REGRA.bonusEspadas} de dano perfurante. Habilita Abater.`,
    corTatica: 'preta',
    papelAliado: 'Causa dano direto na Ameaça ou em um rival.',
  },
  clubs: {
    pilar: 'Sucata & Armadilha',
    efeito: `Reduz o ataque da Ameaça na metade do valor (ou força descarte no PvP com golpe ${REGRA.minGolpeDescartePvp}+). Habilita Abater.`,
    corTatica: 'preta',
    papelAliado: 'Reduz o ataque da Ameaça neste turno.',
  },
  diamonds: {
    pilar: 'Tecnologia & Combustível',
    efeito: 'Compra +1 carta (ou +2 se valor base ≥ 7). Habilita Recrutar/Dominar.',
    corTatica: 'vermelha',
    papelAliado: 'Compra cartas extras de suprimento.',
  },
  hearts: {
    pilar: 'Suprimento & Carisma',
    efeito: 'Cura PV igual à metade do valor arredondada para cima. Habilita Recrutar/Dominar.',
    corTatica: 'vermelha',
    papelAliado: 'Restaura PV (no Coop, cura quem está mais ferido).',
  },
};

export interface Classe {
  nome: string;
  descricao: string;
}

export const CLASSES: Record<Naipe, Classe> = {
  spades: { nome: 'Atirador', descricao: '+1 de poder ao jogar cartas de ♠ Espadas.' },
  hearts: { nome: 'Médico / Diplomata', descricao: '+1 de poder ao jogar cartas de ♥ Copas.' },
  diamonds: { nome: 'Engenheiro / Hacker', descricao: '+1 de poder ao jogar cartas de ♦ Ouros.' },
  clubs: { nome: 'Sabotador', descricao: '+1 de poder ao jogar cartas de ♣ Paus.' },
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
  habilitaAbater: boolean;
  habilitaRecrutar: boolean;
  naipes: Naipe[];
}

export interface OpcoesCriarPartida {
  modo?: ModoDeJogo;
  jogadores: Array<{ nome: string; classe: Naipe }>;
  baralhoCompra?: CartaAcao[];
  horizonteDeck?: FiguraHorizonte[];
  maosIniciais?: CartaAcao[][];
  embaralhar?: boolean;
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

function ehVermelha(c: CartaAcao): boolean {
  if (ehCoringa(c)) return true;
  return c.naipe === 'hearts' || c.naipe === 'diamonds';
}

function ehPreta(c: CartaAcao): boolean {
  if (ehCoringa(c)) return true;
  return c.naipe === 'spades' || c.naipe === 'clubs';
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

function instanciarAmeaca(figura: FiguraHorizonte): AmeacaAtiva {
  const st = STATUS_FIGURA[figura.posto];
  return {
    figura,
    vidaAtual: st.vida,
    vidaMax: st.vida,
    ataqueBase: st.ataque,
    reducaoAtaqueTurno: 0,
  };
}

export function ataqueEfetivoAmeaca(ameaca: AmeacaAtiva | null): number {
  if (!ameaca) return 0;
  return Math.max(0, ameaca.ataqueBase - ameaca.reducaoAtaqueTurno);
}

// ---------- Criação de Partida ----------

export function criarPartida(opcoes: OpcoesCriarPartida): Partida {
  const embaralhar = opcoes.embaralhar ?? true;
  const totalPessoas = Math.max(1, Math.min(REGRA.maxPessoas, opcoes.jogadores.length));
  const modo: ModoDeJogo = totalPessoas === 1 ? 'solo' : opcoes.modo && opcoes.modo !== 'solo' ? opcoes.modo : 'coop';

  let baralhoCompra = opcoes.baralhoCompra ? [...opcoes.baralhoCompra] : criarBaralhoAcao(embaralhar);
  const horizonteDeck = opcoes.horizonteDeck ? [...opcoes.horizonteDeck] : criarHorizonteDeck(embaralhar);

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
      vida: REGRA.vidaInicial,
      vidaMax: REGRA.vidaMaxima,
      mao,
      aliados: [],
      trofeus: [],
      pontosTrofeu: 0,
      eliminado: false,
    };
  });

  const primeiraFigura = horizonteDeck.shift() ?? null;
  const ameacaAtiva = primeiraFigura ? instanciarAmeaca(primeiraFigura) : null;
  const modoRotulo = modo === 'solo' ? 'Solo' : modo === 'coop' ? 'Cooperativo' : 'Competitivo PvP';
  const diario: string[] = [
    `Partida ${modoRotulo} iniciada com ${jogadores.map((j) => `${j.nome} (${SIMBOLO[j.classe]} ${CLASSES[j.classe].nome})`).join(', ')}.`,
  ];
  if (ameacaAtiva) {
    diario.push(`O Horizonte revela ${codigoFigura(ameacaAtiva.figura)} (Vida ${ameacaAtiva.vidaMax} · Ataque ${ameacaAtiva.ataqueBase}).`);
  }

  return {
    modo,
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
    habilitaAbater: false,
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
      const asCount = numericas.filter((c) => c.valor === 1).length;
      if (asCount === 1) {
        const outra = numericas.find((c) => c.valor !== 1)!;
        tipoCombo = `Combo de Comando (${outra.valor} + Ás)`;
        valorBase = outra.valor + REGRA.bonusAsCombo;
      } else {
        tipoCombo = 'Par de Ases';
        valorBase = REGRA.valorAsSolo + REGRA.bonusAsCombo;
      }
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

  const bonusEspadas = naipesSet.has('spades') ? REGRA.bonusEspadas : 0;
  const bonusAfinidade = naipesSet.has(jogador.classe) ? 1 : 0;
  const poderTotal = valorBase + bonusEspadas + bonusAfinidade;

  let reducaoAtaque = naipesSet.has('clubs') ? Math.ceil(valorBase / 2) : 0;
  let cartasComprar = naipesSet.has('diamonds') ? (valorBase >= 7 ? 2 : 1) : 0;
  let cura = naipesSet.has('hearts') ? Math.ceil(valorBase / 2) : 0;
  let danoRecuo = 0;

  if (temEstrela) {
    cura += 4;
    cartasComprar += 2;
    reducaoAtaque += 3;
  }
  if (temCaveira) {
    danoRecuo += REGRA.recuoCaveira;
  }

  const forcarDescartePvp = naipesSet.has('clubs') && poderTotal >= REGRA.minGolpeDescartePvp ? 1 : 0;
  const habilitaAbater = cartas.some(ehPreta);
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
    habilitaAbater,
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

  const motivoFim =
    partida.modo === 'solo'
      ? 'Vitória Solo! Todas as 12 Ameaças do Horizonte foram derrotadas.'
      : 'Vitória Cooperativa! O grupo superou todas as 12 Ameaças do Horizonte.';
  return {
    ...partida,
    ameacaAtiva: null,
    fase: 'fim',
    danoPendente: 0,
    resultado: 'vitoria',
    vencedorIdx: null,
    motivoFim,
    diario: [...diario, motivoFim],
  };
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
    const motivoFim =
      partida.modo === 'solo'
        ? `${caido.nome} caiu sem PV diante da Terra Devastada.`
        : `${caido.nome} não resistiu aos ferimentos. No modo Cooperativo, o grupo cai junto.`;
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

  // Repõe a mão do jogador atual até maoInicial (se vivo) e passa o turno
  let compra = baralhoCompra;
  let desc = descarte;
  const jogadoresComCompra = jogadores.map((j, idx) => {
    if (idx !== quem || j.eliminado || j.mao.length >= REGRA.maoInicial) return j;
    const res = comprarCartas(compra, desc, REGRA.maoInicial - j.mao.length, REGRA.maoInicial, j.mao);
    compra = res.baralhoCompra;
    desc = res.descarte;
    return { ...j, mao: res.mao };
  });

  const prox = proximoJogadorVivo(jogadoresComCompra, quem);
  const proxAmeaca = ameacaAtiva ? { ...ameacaAtiva, reducaoAtaqueTurno: 0 } : null;

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
): Partida {
  const stats = STATUS_FIGURA[figuraDerrotada.posto];
  let compra = baralhoCompra;
  let desc = descarte;
  const jogadores = [...jogadoresAtualizados];
  const j = { ...jogadores[quem], aliados: [...jogadores[quem].aliados], trofeus: [...jogadores[quem].trofeus] };

  if (recrutar) {
    if (j.aliados.length >= REGRA.maxAliados) {
      const dispensado = j.aliados.shift()!;
      const ptsDisp = Math.floor(STATUS_FIGURA[dispensado.figura.posto].trofeus / 2);
      j.trofeus.push(dispensado.figura);
      j.pontosTrofeu += ptsDisp;
      diario.push(`${j.nome} dispensou ${codigoFigura(dispensado.figura)} para os troféus (+${ptsDisp} pts).`);
    }
    j.aliados.push({ figura: figuraDerrotada, cargas: stats.cargas, maxCargas: stats.cargas });
    diario.push(`${j.nome} recrutou ${codigoFigura(figuraDerrotada)} (${stats.cargas} cargas)!`);
  } else {
    j.trofeus.push(figuraDerrotada);
    j.pontosTrofeu += stats.trofeus;
    const saque = comprarCartas(compra, desc, stats.saque, REGRA.maoMaxima, j.mao);
    compra = saque.baralhoCompra;
    desc = saque.descarte;
    j.mao = saque.mao;
    diario.push(`${j.nome} abateu ${codigoFigura(figuraDerrotada)} (+${stats.trofeus} pts, saque +${saque.compradas}).`);
  }

  jogadores[quem] = j;

  const novoHorizonte = [...horizonteDeckAtual];
  const proximaFigura = novoHorizonte.shift() ?? null;

  if (!proximaFigura) {
    const baseFinal: Partida = {
      ...partida,
      jogadores,
      baralhoCompra: compra,
      descarte: desc,
      horizonteDeck: [],
      ameacaAtiva: null,
    };
    return finalizarPorHorizonteLimpo(baseFinal, diario);
  }

  const novaAmeaca = instanciarAmeaca(proximaFigura);
  diario.push(`Nova Ameaça no Horizonte: ${codigoFigura(proximaFigura)} (Vida ${novaAmeaca.vidaMax} · Ataque ${novaAmeaca.ataqueBase}).`);

  return verificarEliminacoesEAvancar(
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
      if (partida.modo !== 'pvp') return partida;
      const rIdx = (acao.alvo as { rival: number }).rival;
      if (rIdx === acao.quem || !partida.jogadores[rIdx] || partida.jogadores[rIdx].eliminado) return partida;
    } else {
      if (!partida.ameacaAtiva) return partida;
      if (acao.alvo === 'horizonte_recrutar') {
        if (!previa.habilitaRecrutar || previa.poderTotal < partida.ameacaAtiva.vidaAtual) {
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
      if (partida.modo === 'coop') {
        let alvoCuraIdx = acao.quem;
        let menorVida = j.vida;
        jogadores.forEach((p, idx) => {
          const v = idx === acao.quem ? j.vida : p.vida;
          if (!p.eliminado && v < menorVida) {
            menorVida = v;
            alvoCuraIdx = idx;
          }
        });
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
      } else {
        const antes = j.vida;
        j.vida = Math.min(j.vidaMax, j.vida + previa.cura);
        if (j.vida > antes) diario.push(`${j.nome} recuperou +${j.vida - antes} PV.`);
      }
    }

    // Aplica compra de ♦ / ★
    if (previa.cartasComprar > 0) {
      const resCompra = comprarCartas(compra, desc, previa.cartasComprar, REGRA.maoMaxima, j.mao);
      compra = resCompra.baralhoCompra;
      desc = resCompra.descarte;
      j.mao = resCompra.mao;
      if (resCompra.compradas > 0) diario.push(`${j.nome} comprou +${resCompra.compradas} carta(s).`);
    }

    // Aplica recuo do Coringa Escuro 💀
    if (previa.danoRecuo > 0) {
      j.vida = Math.max(0, j.vida - previa.danoRecuo);
      diario.push(`${j.nome} sofreu ${previa.danoRecuo} de radiação da Tempestade (💀).`);
    }

    jogadores[acao.quem] = j;

    const nomesCartas = removidos.map(codigoCarta).join(' + ');

    // Caso 1: Ataque direto contra Rival no PvP
    if (ehContraRival) {
      const rIdx = (acao.alvo as { rival: number }).rival;
      const rival = { ...jogadores[rIdx], mao: [...jogadores[rIdx].mao] };
      rival.vida = Math.max(0, rival.vida - previa.poderTotal);
      let msgDescarte = '';
      if (previa.forcarDescartePvp > 0 && rival.mao.length > 0) {
        const descartada = rival.mao.pop()!;
        desc = [...desc, descartada];
        msgDescarte = ` e descartou ${codigoCarta(descartada)}`;
      }
      jogadores[rIdx] = rival;
      diario.push(`${j.nome} jogou [${nomesCartas}] (${previa.tipoCombo}) em ${rival.nome}: ${previa.poderTotal} de dano${msgDescarte}.`);

      // Se jogador atual morreu de recuo ou rival caiu e só sobrou 1
      if (j.vida <= 0 || jogadores.filter((p) => p.vida > 0 && !p.eliminado).length <= 1) {
        return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, partida.ameacaAtiva, acao.quem, diario);
      }

      // Se a Ameaça do Horizonte ainda está ativa, ela contra-ataca o jogador da vez
      const ameaca = partida.ameacaAtiva;
      const danoContra = ataqueEfetivoAmeaca(ameaca);
      if (ameaca && danoContra > 0) {
        diario.push(`${codigoFigura(ameaca.figura)} contra-ataca ${j.nome} com ${danoContra} de dano!`);
        return {
          ...partida,
          jogadores,
          baralhoCompra: compra,
          descarte: desc,
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
    ameaca.vidaAtual = Math.max(0, ameaca.vidaAtual - previa.poderTotal);
    diario.push(
      `${j.nome} usou [${nomesCartas}] (${previa.tipoCombo}) contra ${codigoFigura(ameaca.figura)}: ${previa.poderTotal} de dano${previa.reducaoAtaque > 0 ? ` (-${previa.reducaoAtaque} Atq)` : ''}.`,
    );

    if (j.vida <= 0) {
      return verificarEliminacoesEAvancar(partida, jogadores, compra, desc, ameaca, acao.quem, diario);
    }

    if (ameaca.vidaAtual <= 0) {
      return resolverDerrotaDeAmeaca(
        partida,
        jogadores,
        compra,
        desc,
        partida.horizonteDeck,
        ameaca.figura,
        acao.quem,
        acao.alvo === 'horizonte_recrutar',
        diario,
      );
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
        if (partida.modo !== 'pvp' || acao.alvoRival === acao.quem) return partida;
        const rival = jogadores[acao.alvoRival];
        if (!rival || rival.eliminado) return partida;
        rival.vida = Math.max(0, rival.vida - stats.bonusAliado);
        diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} disparou em ${rival.nome}: ${stats.bonusAliado} de dano!`);
      } else if (ameaca) {
        ameaca.vidaAtual = Math.max(0, ameaca.vidaAtual - stats.bonusAliado);
        diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} causou ${stats.bonusAliado} de dano em ${codigoFigura(ameaca.figura)}!`);
      }
    } else if (aliado.figura.naipe === 'clubs') {
      if (!ameaca) return partida;
      ameaca.reducaoAtaqueTurno += stats.bonusAliado;
      diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} reduziu o ataque de ${codigoFigura(ameaca.figura)} em ${stats.bonusAliado}!`);
    } else if (aliado.figura.naipe === 'diamonds') {
      const qtd = aliado.figura.posto === 'J' ? 1 : aliado.figura.posto === 'Q' ? 2 : 3;
      const res = comprarCartas(compra, desc, qtd, REGRA.maoMaxima, j.mao);
      compra = res.baralhoCompra;
      desc = res.descarte;
      j.mao = res.mao;
      diario.push(`Aliado ${codigoFigura(aliado.figura)} de ${j.nome} garantiu +${res.compradas} carta(s).`);
    } else if (aliado.figura.naipe === 'hearts') {
      let alvoCura = j;
      if (partida.modo === 'coop') {
        const maisFerido = jogadores
          .filter((p) => !p.eliminado)
          .sort((x, y) => x.vida - y.vida)[0];
        if (maisFerido) alvoCura = maisFerido;
      }
      const antes = alvoCura.vida;
      alvoCura.vida = Math.min(alvoCura.vidaMax, alvoCura.vida + stats.bonusAliado);
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

    let bloqueioTotal = removidos.reduce((acc, c) => acc + valorBloqueioCarta(c), 0);
    const diario = [...partida.diario];

    if (acao.usarAliadoEscudo !== undefined) {
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

    return verificarEliminacoesEAvancar(partida, jogadores, partida.baralhoCompra, desc, partida.ameacaAtiva, acao.quem, diario);
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

export function linhaDeStatus(partida: Partida): string {
  const ameaca = partida.ameacaAtiva
    ? `${codigoFigura(partida.ameacaAtiva.figura)} (${partida.ameacaAtiva.vidaAtual}/${partida.ameacaAtiva.vidaMax} PV · Atq ${ataqueEfetivoAmeaca(partida.ameacaAtiva)})`
    : 'Horizonte limpo';
  const jogs = partida.jogadores
    .map((j) => `${j.nome}: ${j.vida}PV / ${j.pontosTrofeu}pts (${j.aliados.length} al.)`)
    .join(' | ');
  return `HORIZONTE [${partida.modo.toUpperCase()} · R${partida.rodada}] · Ameaça: ${ameaca} · ${jogs}`;
}
