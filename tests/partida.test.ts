import { describe, expect, it } from 'vitest';
import {
  NIVEIS,
  REGRA,
  STATUS_FIGURA,
  agir,
  ataqueEfetivoAmeaca,
  criarBaralhoAcao,
  criarHorizonteDeck,
  criarPartida,
  linhaDeStatus,
  pontosDeDominio,
  pontuacaoSolo,
  simularJogada,
  type CartaAcao,
  type FiguraHorizonte,
} from '../src/core/partida';

function figura(posto: 'J' | 'Q' | 'K', naipe: 'spades' | 'hearts' | 'diamonds' | 'clubs'): FiguraHorizonte {
  return { posto, naipe };
}

function maoPadrao(): CartaAcao[] {
  return [
    { valor: 7, naipe: 'spades' },
    { valor: 4, naipe: 'clubs' },
    { valor: 6, naipe: 'hearts' },
    { valor: 8, naipe: 'diamonds' },
    { valor: 2, naipe: 'spades' },
  ];
}

describe('Motor PvPvE de HORIZONTE — Zona de Conflito', () => {
  it('constrói baralhos padrão com 42 cartas de ação e 12 figuras em ondas J -> Q -> K', () => {
    const acao = criarBaralhoAcao(false);
    const horizonte = criarHorizonteDeck(false);

    expect(acao).toHaveLength(42);
    expect(horizonte).toHaveLength(12);
    expect(horizonte.slice(0, 4).every((f) => f.posto === 'J')).toBe(true);
    expect(horizonte.slice(4, 8).every((f) => f.posto === 'Q')).toBe(true);
    expect(horizonte.slice(8, 12).every((f) => f.posto === 'K')).toBe(true);
  });

  it('simula carta única, Par, Trinca, Quadra, Combo +Ás, Coringas e rejeita combinações inválidas', () => {
    const p = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Alice', classe: 'spades' }],
      horizonteDeck: [figura('J', 'clubs')],
      maosIniciais: [
        [
          { valor: 6, naipe: 'spades' }, // 0: +2 ♠ +2 Atirador = 10
          { valor: 6, naipe: 'clubs' }, // 1: Par de 6 (base 12, -6 atq, +2 ♠ +2 Atirador = 16)
          { valor: 1, naipe: 'hearts' }, // 2: Ás solo = 5 (base 5, +3 cura)
          { valor: 4, naipe: 'diamonds' }, // 3: Carta 4 ♦ + Ás ♥ -> base 4+4=8, compra +2, cura +4
          { coringa: 'estrela' }, // 4: ★ = 5, cura 4, compra 2, -3 ataque
          { coringa: 'caveira' }, // 5: 💀 = 8, recuo 2
          { valor: 6, naipe: 'hearts' }, // 6
          { valor: 6, naipe: 'diamonds' }, // 7
        ],
      ],
      embaralhar: false,
    });

    const s0 = simularJogada(p, 0, [0]);
    expect(s0.valida).toBe(true);
    expect(s0.valorBase).toBe(6);
    expect(s0.bonusEspadas).toBe(REGRA.bonusEspadas);
    expect(s0.bonusAfinidade).toBe(2);
    expect(s0.poderTotal).toBe(10);
    expect(s0.habilitaRecrutar).toBe(false);

    const par = simularJogada(p, 0, [0, 1]);
    expect(par.valida).toBe(true);
    expect(par.tipoCombo).toContain('Par');
    expect(par.valorBase).toBe(12);
    expect(par.reducaoAtaque).toBe(6);
    expect(par.poderTotal).toBe(16);

    const trinca = simularJogada(p, 0, [0, 1, 6]);
    expect(trinca.valida).toBe(true);
    expect(trinca.tipoCombo).toContain('Trinca');
    expect(trinca.valorBase).toBe(18);
    expect(trinca.habilitaRecrutar).toBe(true);

    const quadra = simularJogada(p, 0, [0, 1, 6, 7]);
    expect(quadra.valida).toBe(true);
    expect(quadra.tipoCombo).toContain('Quadra');
    expect(quadra.valorBase).toBe(24);

    const asSolo = simularJogada(p, 0, [2]);
    expect(asSolo.valida).toBe(true);
    expect(asSolo.valorBase).toBe(REGRA.valorAsSolo);
    expect(asSolo.cura).toBe(3);

    const comboAs = simularJogada(p, 0, [2, 3]);
    expect(comboAs.valida).toBe(true);
    expect(comboAs.tipoCombo).toContain('Combo de Comando');
    expect(comboAs.valorBase).toBe(8);
    expect(comboAs.cartasComprar).toBe(2);
    expect(comboAs.cura).toBe(4);

    const estrela = simularJogada(p, 0, [4]);
    expect(estrela.valida).toBe(true);
    expect(estrela.valorBase).toBe(REGRA.valorEstrela);
    expect(estrela.cura).toBe(4);
    expect(estrela.cartasComprar).toBe(2);
    expect(estrela.reducaoAtaque).toBe(3);
    expect(estrela.habilitaRecrutar).toBe(true);

    const caveira = simularJogada(p, 0, [5]);
    expect(caveira.valida).toBe(true);
    expect(caveira.valorBase).toBe(REGRA.valorCaveira);
    expect(caveira.danoRecuo).toBe(REGRA.recuoCaveira);

    // Inválidas
    expect(simularJogada(p, 0, []).valida).toBe(false);
    expect(simularJogada(p, 0, [0, 3]).valida).toBe(false); // 6♠ + 4♦ não combinam
    expect(simularJogada(p, 0, [4, 0]).valida).toBe(false); // Coringa não comba
    expect(simularJogada(p, 0, [2, 3, 7]).valida).toBe(false); // 3 cartas valores distintos
  });

  it('aplica efeitos de ataque, bloqueio tático com descarte/aliado e compra 1 carta ao fim do turno', () => {
    const p0 = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Solo', classe: 'diamonds' }],
      horizonteDeck: [figura('J', 'hearts'), figura('K', 'hearts')],
      maosIniciais: [
        [
          { valor: 4, naipe: 'clubs' }, // 0: poder 4, -2 ataque J♥ (4->2)
          { valor: 2, naipe: 'hearts' }, // 1: usado p/ bloqueio
          { valor: 3, naipe: 'diamonds' }, // 2
          { valor: 5, naipe: 'spades' }, // 3
          { valor: 6, naipe: 'clubs' }, // 4
        ],
      ],
      baralhoCompra: Array.from({ length: 10 }, () => ({ valor: 9, naipe: 'hearts' as const })),
      embaralhar: false,
    });

    const p1 = agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(p1).not.toBe(p0);
    expect(p1.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.J.vida - 4);
    expect(ataqueEfetivoAmeaca(p1.ameacaAtiva)).toBe(2);
    expect(p1.fase).toBe('bloqueio');
    expect(p1.danoPendente).toBe(2);

    // Bloqueia com a carta 2♥ (index 0 agora porque index 0 anterior foi descartada -> index 0 é 2♥)
    const p2 = agir(p1, { tipo: 'bloquear', quem: 0, indicesMao: [0] });
    expect(p2.fase).toBe('acao');
    expect(p2.danoPendente).toBe(0);
    expect(p2.jogadores[0].vida).toBe(REGRA.vidaInicial);
    // Tinha 3 cartas na mão após jogar 1 e bloquear com 1 -> compra só 1 no fim do turno
    expect(p2.jogadores[0].mao).toHaveLength(3 + REGRA.compraFimTurno);
    // J♥ sobreviveu ao turno e se regenera (traço ♥)
    expect(p2.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.J.vida - 4 + STATUS_FIGURA.J.regeneracao);
  });

  it('diferencia Abater (♠/♣) e Recrutar (♥/♦/Coringa), respeitando limite de 2 aliados e uso com cargas', () => {
    const p0 = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Recrutador', classe: 'hearts' }],
      horizonteDeck: [figura('J', 'spades'), figura('Q', 'spades'), figura('K', 'clubs')],
      maosIniciais: [
        [
          { valor: 9, naipe: 'hearts' }, // 0: com o Ás ♦ (índice 3): 9+4 = 13 -> mata J (12 vida)
          { valor: 10, naipe: 'spades' }, // 1: poder 10+2=12 (não mata Q=14)
          { valor: 9, naipe: 'clubs' }, // 2: só preta
          { valor: 1, naipe: 'diamonds' }, // 3
          { valor: 3, naipe: 'spades' }, // 4
        ],
      ],
      baralhoCompra: Array.from({ length: 12 }, () => ({ valor: 5, naipe: 'spades' as const })),
      embaralhar: false,
    });

    // Tentar recrutar com carta preta pura falha
    expect(agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [2], alvo: 'horizonte_recrutar' })).toBe(p0);

    // Recrutar J♠ com 9♥ + A♦ (poder 14 >= 12 vida do J)
    const p1 = agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [0, 3], alvo: 'horizonte_recrutar' });
    expect(p1.jogadores[0].aliados).toHaveLength(1);
    expect(p1.jogadores[0].aliados[0].cargas).toBe(STATUS_FIGURA.J.cargas);
    // Avançou para a segunda figura (Q♠)
    expect(p1.ameacaAtiva?.figura.posto).toBe('Q');
    expect(p1.fase).toBe('acao');

    // Usa aliado J♠ (bonus +2 na Ameaça, gasta 1 carga)
    const p2 = agir(p1, { tipo: 'usarAliado', quem: 0, indiceAliado: 0 });
    expect(p2.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.Q.vida - STATUS_FIGURA.J.bonusAliado);
    expect(p2.jogadores[0].aliados[0].cargas).toBe(1);
    expect(p2.aliadoUsadoNoTurno).toBe(true);
    // Segundo uso no mesmo turno bloqueado
    expect(agir(p2, { tipo: 'usarAliado', quem: 0, indiceAliado: 0 })).toBe(p2);

    // Força ciclo/próximo turno após dano e esgota o aliado até virar troféu
    const pPass = agir(p2, { tipo: 'passarTurno', quem: 0, descartarIndices: [] });
    const pBlock = agir(pPass, { tipo: 'bloquear', quem: 0, indicesMao: [] });
    const pExhaust = agir(pBlock, { tipo: 'usarAliado', quem: 0, indiceAliado: 0 });
    expect(pExhaust.jogadores[0].aliados).toHaveLength(0);
    expect(pExhaust.jogadores[0].trofeus).toHaveLength(1);
    expect(pExhaust.jogadores[0].pontosTrofeu).toBe(Math.floor(STATUS_FIGURA.J.trofeus / 2));
  });

  it('impede recrutar quando já há 2 aliados e permite usar aliado como escudo de +4 no bloqueio', () => {
    let p = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Comandante', classe: 'diamonds' }],
      horizonteDeck: [figura('J', 'clubs')],
      maosIniciais: [
        [
          { valor: 2, naipe: 'clubs' },
          { valor: 3, naipe: 'diamonds' },
          { valor: 4, naipe: 'hearts' },
          { valor: 5, naipe: 'spades' },
          { valor: 6, naipe: 'spades' },
        ],
      ],
      baralhoCompra: maoPadrao(),
      embaralhar: false,
    });
    // Injeta 2 aliados no jogador
    p = {
      ...p,
      fase: 'bloqueio',
      danoPendente: 6,
      jogadores: [
        {
          ...p.jogadores[0],
          aliados: [
            { figura: figura('J', 'hearts'), cargas: 1, maxCargas: 2 },
            { figura: figura('Q', 'spades'), cargas: 2, maxCargas: 2 },
          ],
        },
      ],
    };

    // Bloqueia 6 de dano usando aliado 0 (+4 escudo) + carta 2♣ = 6 bloqueado => 0 dano nos PV
    const pDepois = agir(p, { tipo: 'bloquear', quem: 0, indicesMao: [0], usarAliadoEscudo: 0 });
    expect(pDepois.jogadores[0].vida).toBe(REGRA.vidaInicial);
    // Aliado 0 tinha 1 carga, ao gastar foi para troféus
    expect(pDepois.jogadores[0].aliados).toHaveLength(1);
    expect(pDepois.jogadores[0].trofeus).toHaveLength(1);
  });

  it('no Cooperativo cura quem está mais ferido com ♥ e derrota o grupo se qualquer jogador cair', () => {
    const p0 = criarPartida({
      modo: 'coop',
      jogadores: [
        { nome: 'Ana', classe: 'hearts' },
        { nome: 'Beto', classe: 'spades' },
      ],
      horizonteDeck: [figura('K', 'spades')],
      maosIniciais: [
        [
          { valor: 6, naipe: 'hearts' }, // poder 6, cura 3 +2 do Médico
          { valor: 2, naipe: 'clubs' },
          { valor: 3, naipe: 'diamonds' },
          { valor: 4, naipe: 'spades' },
          { valor: 5, naipe: 'hearts' },
        ],
        maoPadrao(),
      ],
      baralhoCompra: Array.from({ length: 12 }, () => ({ valor: 3, naipe: 'clubs' as const })),
      embaralhar: false,
    });

    const pFerido: typeof p0 = {
      ...p0,
      jogadores: [p0.jogadores[0], { ...p0.jogadores[1], vida: 5 }],
    };

    const pCurado = agir(pFerido, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    // Beto estava mais ferido (5 PV -> 10 PV) e K♠ (com +PV por jogador extra no Coop) levou 6
    expect(pCurado.jogadores[1].vida).toBe(10);
    expect(pCurado.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.K.vida + STATUS_FIGURA.K.vidaPorJogadorExtra - 6);

    // Agora coloca Beto em 2 PV na fase de bloqueio com 7 de dano pendente -> cai -> Coop perde
    const pQuaseFim: typeof pCurado = {
      ...pCurado,
      turnoDe: 1,
      fase: 'bloqueio',
      danoPendente: 7,
      jogadores: [pCurado.jogadores[0], { ...pCurado.jogadores[1], vida: 2 }],
    };
    const pDerrota = agir(pQuaseFim, { tipo: 'bloquear', quem: 1, indicesMao: [] });
    expect(pDerrota.fase).toBe('fim');
    expect(pDerrota.resultado).toBe('derrota');
  });

  it('no Competitivo PvP impõe Trégua na Rodada 1, Fogo Cruzado (50/50) na Rodada 2+, descarte por ♣ (6+) e abate colateral', () => {
    const p0 = criarPartida({
      modo: 'pvp',
      jogadores: [
        { nome: 'Mara', classe: 'spades' },
        { nome: 'Kael', classe: 'clubs' },
      ],
      horizonteDeck: [figura('J', 'diamonds'), figura('Q', 'clubs')],
      maosIniciais: [
        [
          { valor: 10, naipe: 'clubs' }, // 0: poder 10 >= 6, força descarte 1 no rival + Fogo Cruzado (5 rival, 5-1=4 em J♦)
          { valor: 10, naipe: 'spades' }, // 1: poder 14 (10+2+2)
          { valor: 10, naipe: 'hearts' }, // 2: par 10♠+10♥ = 24 poder (12 rival, 12 Ameaça)
          { valor: 3, naipe: 'diamonds' },
          { valor: 4, naipe: 'hearts' },
        ],
        maoPadrao(),
      ],
      baralhoCompra: Array.from({ length: 15 }, () => ({ valor: 2, naipe: 'spades' as const })),
      embaralhar: false,
    });

    // Na Rodada 1 há trégua: tentar atacar o rival falha
    expect(p0.rodada).toBe(1);
    expect(agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: { rival: 1 } })).toBe(p0);

    // Rodada 1 passa para ambos os jogadores
    const r1a = agir(p0, { tipo: 'passarTurno', quem: 0, descartarIndices: [] });
    const r1b = agir(r1a, { tipo: 'bloquear', quem: 0, indicesMao: [] });
    const r1c = agir(r1b, { tipo: 'passarTurno', quem: 1, descartarIndices: [] });
    const pRodada2 = agir(r1c, { tipo: 'bloquear', quem: 1, indicesMao: [] });
    expect(pRodada2.rodada).toBe(2);
    expect(pRodada2.turnoDe).toBe(0);

    // Na Rodada 2, Mara joga 10♣ (poder 10) em Kael: Kael sofre 5 (metade p/ cima) + descarta 1 carta (tinha 6 cartas após a Rodada 1 -> fica com 5); J♦ (Blindada -1) sofre 5-1 = 4 (12 -> 8 PV)
    const p1 = agir(pRodada2, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: { rival: 1 } });
    expect(p1.jogadores[1].vida).toBe(REGRA.vidaInicial - 4 - 5); // Kael já tinha tomado 4 na Rodada 1
    expect(p1.jogadores[1].mao).toHaveLength(5);
    expect(p1.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.J.vida - 4);
    expect(p1.fase).toBe('bloqueio');

    // Mara aceita o bloqueio e Kael passa a vez
    const p2 = agir(p1, { tipo: 'bloquear', quem: 0, indicesMao: [] });
    const p3 = agir(p2, { tipo: 'passarTurno', quem: 1, descartarIndices: [] });
    const p4 = agir(p3, { tipo: 'bloquear', quem: 1, indicesMao: [] });
    expect(p4.turnoDe).toBe(0);

    // Mara joga Par de 10♠ + 10♥ (poder 24) em Kael: 12 de dano em Kael (elimina Kael!) e 12 na Ameaça
    const idx10S = p4.jogadores[0].mao.findIndex((c) => 'valor' in c && c.valor === 10 && c.naipe === 'spades');
    const idx10H = p4.jogadores[0].mao.findIndex((c) => 'valor' in c && c.valor === 10 && c.naipe === 'hearts');
    const p5 = agir(p4, { tipo: 'jogarCartas', quem: 0, indicesMao: [idx10S, idx10H], alvo: { rival: 1 } });
    expect(p5.jogadores[1].eliminado).toBe(true);
    expect(p5.fase).toBe('fim');
    expect(p5.resultado).toBe('vitoria');
    expect(p5.vencedorIdx).toBe(0);
  });

  it('no Competitivo PvP desempata por pontosDeDominio quando o Horizonte é limpo', () => {
    const p0 = criarPartida({
      modo: 'pvp',
      jogadores: [
        { nome: 'Líder', classe: 'spades' },
        { nome: 'Desafiante', classe: 'hearts' },
      ],
      horizonteDeck: [figura('J', 'clubs')],
      maosIniciais: [
        [
          { valor: 9, naipe: 'spades' }, // 9 + 2 + 1 = 12 >= 12 vida de J♣
          { valor: 2, naipe: 'clubs' },
          { valor: 3, naipe: 'diamonds' },
          { valor: 4, naipe: 'hearts' },
          { valor: 5, naipe: 'clubs' },
        ],
        maoPadrao(),
      ],
      baralhoCompra: maoPadrao(),
      embaralhar: false,
    });

    const pFinal = agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(pFinal.ameacaAtiva).toBeNull();
    expect(pFinal.fase).toBe('fim');
    expect(pFinal.resultado).toBe('vitoria');
    expect(pFinal.vencedorIdx).toBe(0);
    expect(pontosDeDominio(pFinal.jogadores[0])).toBeGreaterThan(pontosDeDominio(pFinal.jogadores[1]));
    expect(pFinal.motivoFim).toContain('venceu');
    expect(linhaDeStatus(pFinal)).toContain('Horizonte limpo');
  });

  it('respeita limite único de Aliado por turno (Passo 1 + Escudo), redução de ★ contra rival e sacrifício com 💀', () => {
    // 1. Limite de 1 uso de Aliado no turno (se usar no Passo 1, não pode usar escudo no Passo 3)
    const pBase = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Solo', classe: 'spades' }],
      horizonteDeck: [figura('K', 'spades')],
      maosIniciais: [[{ valor: 2, naipe: 'hearts' }, { valor: 3, naipe: 'hearts' }, { valor: 4, naipe: 'hearts' }, { valor: 5, naipe: 'hearts' }, { valor: 6, naipe: 'hearts' }]],
      embaralhar: false,
    });
    const comAliados = {
      ...pBase,
      jogadores: [
        {
          ...pBase.jogadores[0],
          aliados: [
            { figura: figura('J', 'hearts'), cargas: 2, maxCargas: 2 },
            { figura: figura('J', 'diamonds'), cargas: 2, maxCargas: 2 },
          ],
        },
      ],
    };
    const aposPasso1 = agir(comAliados, { tipo: 'usarAliado', quem: 0, indiceAliado: 0 });
    expect(aposPasso1.aliadoUsadoNoTurno).toBe(true);
    const emBloqueio = agir(aposPasso1, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(emBloqueio.fase).toBe('bloqueio');
    // Tentar usar Aliado como escudo após já ter ativado Aliado no Passo 1 é rejeitado
    const tentativaEscudo = agir(emBloqueio, { tipo: 'bloquear', quem: 0, indicesMao: [], usarAliadoEscudo: 1 });
    expect(tentativaEscudo).toBe(emBloqueio);

    // 2. Coringa Claro (★) contra rival no PvP reduz o ataque da Ameaça em 3; Coringa Escuro (💀) letal revela próxima Figura mesmo se o jogador cair a 0 PV no recuo
    const pvp3 = criarPartida({
      modo: 'pvp',
      jogadores: [
        { nome: 'A', classe: 'spades' },
        { nome: 'B', classe: 'hearts' },
        { nome: 'C', classe: 'clubs' },
      ],
      horizonteDeck: [figura('Q', 'spades'), figura('K', 'clubs')],
      maosIniciais: [
        [{ coringa: 'estrela' }, { valor: 2, naipe: 'clubs' }, { valor: 3, naipe: 'clubs' }, { valor: 4, naipe: 'clubs' }, { valor: 5, naipe: 'clubs' }],
        [{ coringa: 'caveira' }, { valor: 2, naipe: 'hearts' }, { valor: 3, naipe: 'hearts' }, { valor: 4, naipe: 'hearts' }, { valor: 5, naipe: 'hearts' }],
        maoPadrao(),
      ],
      embaralhar: false,
    });
    // Jogador A usa ★ no rival B (na Rodada 2, após a trégua): Q♠ (Feroz) tem ataque reduzido em 3 e sofre floor(5/2)=2 de dano
    const aposEstrelaPvp = agir({ ...pvp3, rodada: 2 }, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: { rival: 1 } });
    expect(aposEstrelaPvp.fase).toBe('bloqueio');
    expect(aposEstrelaPvp.danoPendente).toBe(STATUS_FIGURA.Q.ataque + STATUS_FIGURA.Q.ferocidade - 3);
    const vezDeB = agir(aposEstrelaPvp, { tipo: 'bloquear', quem: 0, indicesMao: [] });

    // Jogador B fica com 2 PV e a Ameaça Q♠ fica com 8 PV; B joga 💀 contra Q♠
    const bQuaseMorto = {
      ...vezDeB,
      ameacaAtiva: { ...vezDeB.ameacaAtiva!, vidaAtual: 8 },
      jogadores: vezDeB.jogadores.map((j, i) => (i === 1 ? { ...j, vida: 2 } : j)),
    };
    const aposSacrificio = agir(bQuaseMorto, { tipo: 'jogarCartas', quem: 1, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(aposSacrificio.jogadores[1].eliminado).toBe(true);
    // Q♠ foi abatida e K♣ assumiu com vida cheia para os sobreviventes A e C
    expect(aposSacrificio.ameacaAtiva?.figura).toEqual(figura('K', 'clubs'));
    expect(aposSacrificio.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.K.vida);
  });

  it('aplica os traços das Ameaças, o nível de dificuldade e mantém o turno quando um Aliado de ♠ derruba a Ameaça', () => {
    const mao: CartaAcao[] = [
      { valor: 8, naipe: 'clubs' },
      { valor: 9, naipe: 'spades' },
      { valor: 2, naipe: 'hearts' },
      { valor: 3, naipe: 'hearts' },
      { valor: 4, naipe: 'hearts' },
    ];
    const criar = (fig: FiguraHorizonte, nivel?: 'recruta' | 'lenda') =>
      criarPartida({ modo: 'solo', nivel, jogadores: [{ nome: 'S', classe: 'hearts' }], horizonteDeck: [fig, figura('Q', 'hearts')], maosIniciais: [mao], embaralhar: false });

    // Nível muda só a vida inicial
    expect(criar(figura('J', 'clubs'), 'recruta').jogadores[0].vida).toBe(NIVEIS.recruta.vida);
    expect(criar(figura('J', 'clubs'), 'lenda').jogadores[0].vidaMax).toBe(NIVEIS.lenda.vida);

    // ♣ Imune a armadilhas: o 8♣ causa dano, mas não reduz o ataque
    const imune = agir(criar(figura('J', 'clubs')), { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(imune.danoPendente).toBe(STATUS_FIGURA.J.ataque);

    // ♦ Blindada: o golpe perde a blindagem
    const blindada = agir(criar(figura('J', 'diamonds')), { tipo: 'jogarCartas', quem: 0, indicesMao: [1], alvo: 'horizonte_abater' });
    expect(blindada.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.J.vida - (9 + 2 - STATUS_FIGURA.J.blindagem));

    // ♠ Feroz: ataque já vem somado
    expect(criar(figura('J', 'spades')).ameacaAtiva?.ataqueBase).toBe(STATUS_FIGURA.J.ataque + STATUS_FIGURA.J.ferocidade);

    // Aliado de ♠ que zera a Ameaça: ela é abatida, a próxima entra e o jogador ainda faz a ação principal
    const base = criar(figura('J', 'clubs'));
    const quaseMorta = {
      ...base,
      ameacaAtiva: { ...base.ameacaAtiva!, vidaAtual: 1 },
      jogadores: [{ ...base.jogadores[0], aliados: [{ figura: figura('J', 'spades'), cargas: 2, maxCargas: 2 }] }],
    };
    const aposAliado = agir(quaseMorta, { tipo: 'usarAliado', quem: 0, indiceAliado: 0 });
    expect(aposAliado.ameacaAtiva?.figura).toEqual(figura('Q', 'hearts'));
    expect(aposAliado.fase).toBe('acao');
    expect(aposAliado.turnoDe).toBe(0);
    expect(aposAliado.aliadoUsadoNoTurno).toBe(true);
    expect(aposAliado.jogadores[0].pontosTrofeu).toBe(STATUS_FIGURA.J.trofeus);
  });

  it('só a última Figura vira o chefe do tema, com a regra própria', () => {
    const mao: CartaAcao[] = [
      { valor: 9, naipe: 'clubs' },
      { valor: 4, naipe: 'clubs' },
      { valor: 5, naipe: 'spades' },
      { valor: 6, naipe: 'diamonds' },
      { valor: 3, naipe: 'diamonds' },
    ];
    const criar = (chefe: 'firewall' | 'renasce' | 'portas' | 'colossal', horizonte = [figura('K', 'clubs')]) =>
      criarPartida({ modo: 'solo', chefe, jogadores: [{ nome: 'S', classe: 'diamonds' }], horizonteDeck: horizonte, maosIniciais: [mao], embaralhar: false });

    // Com mais de uma Figura, a primeira não é chefe
    expect(criar('colossal', [figura('J', 'clubs'), figura('K', 'clubs')]).ameacaAtiva?.chefe).toBeUndefined();

    // A Figura revelada por último ganha a regra: Colossal soma PV
    const antes = criar('colossal', [figura('J', 'clubs'), figura('K', 'clubs')]);
    const quase = { ...antes, ameacaAtiva: { ...antes.ameacaAtiva!, vidaAtual: 1 } };
    const revelou = agir(quase, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(revelou.ameacaAtiva?.chefe).toBe('colossal');
    expect(revelou.ameacaAtiva!.vidaMax).toBeGreaterThan(STATUS_FIGURA.K.vida);

    // Quando o chefe é a única Figura, ele já começa como chefe. Firewall: golpe de 4 não passa
    const firewall = agir(criar('firewall'), { tipo: 'jogarCartas', quem: 0, indicesMao: [1], alvo: 'horizonte_abater' });
    expect(firewall.ameacaAtiva?.vidaAtual).toBe(STATUS_FIGURA.K.vida);

    // Portas Seladas: bloquear com 2 cartas é recusado
    const bloqueio = agir(criar('portas'), { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    expect(bloqueio.fase).toBe('bloqueio');
    expect(agir(bloqueio, { tipo: 'bloquear', quem: 0, indicesMao: [0, 1] })).toBe(bloqueio);
    expect(agir(bloqueio, { tipo: 'bloquear', quem: 0, indicesMao: [0] })).not.toBe(bloqueio);

    // Levanta de Novo: o golpe que zera não pode recrutar e o chefe volta com metade da Vida
    const zumbi = criar('renasce');
    const quaseZumbi = { ...zumbi, ameacaAtiva: { ...zumbi.ameacaAtiva!, vidaAtual: 2 } };
    expect(agir(quaseZumbi, { tipo: 'jogarCartas', quem: 0, indicesMao: [3], alvo: 'horizonte_recrutar' })).toBe(quaseZumbi);
    const levantou = agir(quaseZumbi, { tipo: 'jogarCartas', quem: 0, indicesMao: [3], alvo: 'horizonte_abater' });
    expect(levantou.ameacaAtiva?.vidaAtual).toBe(Math.ceil(STATUS_FIGURA.K.vida / 2));
    expect(levantou.ameacaAtiva?.renasceu).toBe(true);
  });

  it('cada Especialização reforça o efeito do próprio naipe', () => {
    const mao: CartaAcao[] = [
      { valor: 6, naipe: 'spades' },
      { valor: 6, naipe: 'hearts' },
      { valor: 6, naipe: 'diamonds' },
      { valor: 6, naipe: 'clubs' },
      { valor: 2, naipe: 'clubs' },
    ];
    const previa = (classe: 'spades' | 'hearts' | 'diamonds' | 'clubs', carta: number) =>
      simularJogada(criarPartida({ modo: 'solo', jogadores: [{ nome: 'S', classe }], maosIniciais: [mao], embaralhar: false }), 0, [carta]);
    expect(previa('spades', 0).poderTotal).toBe(6 + REGRA.bonusEspadas + 2);
    expect(previa('hearts', 1).cura).toBe(3 + 2);
    expect(previa('hearts', 1).poderTotal).toBe(6);
    expect(previa('diamonds', 2).cartasComprar).toBe(1 + 1);
    expect(previa('clubs', 3).reducaoAtaque).toBe(3 + 2);
    expect(previa('spades', 3).reducaoAtaque).toBe(3);
  });

  it('pontua o Solo com Domínio, bônus de vitória e rapidez', () => {
    const p = criarPartida({ modo: 'solo', jogadores: [{ nome: 'S', classe: 'spades' }], embaralhar: false });
    const vitoria = { ...p, resultado: 'vitoria' as const, fase: 'fim' as const, rodada: 30 };
    const derrota = { ...vitoria, resultado: 'derrota' as const };
    expect(pontuacaoSolo(derrota)).toBe(pontosDeDominio(p.jogadores[0]));
    expect(pontuacaoSolo(vitoria)).toBe(pontosDeDominio(p.jogadores[0]) + 50 + (40 - 30) * 2);
    expect(pontuacaoSolo({ ...vitoria, rodada: 50 })).toBe(pontosDeDominio(p.jogadores[0]) + 50);
  });
});
