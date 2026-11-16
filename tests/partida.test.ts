import { describe, expect, it } from 'vitest';
import {
  REGRA,
  STATUS_FIGURA,
  agir,
  ataqueEfetivoAmeaca,
  criarBaralhoAcao,
  criarHorizonteDeck,
  criarPartida,
  linhaDeStatus,
  pontosDeDominio,
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
          { valor: 6, naipe: 'spades' }, // 0: +2 ♠ +1 classe = 9
          { valor: 6, naipe: 'clubs' }, // 1: Par de 6 (base 12, -6 atq, +2 ♠ +1 afin = 15)
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
    expect(s0.bonusAfinidade).toBe(1);
    expect(s0.poderTotal).toBe(9);
    expect(s0.habilitaAbater).toBe(true);
    expect(s0.habilitaRecrutar).toBe(false);

    const par = simularJogada(p, 0, [0, 1]);
    expect(par.valida).toBe(true);
    expect(par.tipoCombo).toContain('Par');
    expect(par.valorBase).toBe(12);
    expect(par.reducaoAtaque).toBe(6);
    expect(par.poderTotal).toBe(15);

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
    expect(estrela.habilitaAbater).toBe(true);
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

  it('aplica efeitos de ataque, bloqueio tático com descarte/aliado e compra até 5 cartas ao fim do turno', () => {
    const p0 = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Solo', classe: 'clubs' }],
      horizonteDeck: [figura('J', 'spades'), figura('K', 'hearts')],
      maosIniciais: [
        [
          { valor: 4, naipe: 'clubs' }, // 0: poder 4+1(afinidade)=5, -2 ataque J♠ (3->1)
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
    expect(p1.ameacaAtiva?.vidaAtual).toBe(5);
    expect(ataqueEfetivoAmeaca(p1.ameacaAtiva)).toBe(1);
    expect(p1.fase).toBe('bloqueio');
    expect(p1.danoPendente).toBe(1);

    // Bloqueia com a carta 2♥ (index 0 agora porque index 0 anterior foi descartada -> index 0 é 2♥)
    const p2 = agir(p1, { tipo: 'bloquear', quem: 0, indicesMao: [0] });
    expect(p2.fase).toBe('acao');
    expect(p2.danoPendente).toBe(0);
    expect(p2.jogadores[0].vida).toBe(REGRA.vidaInicial);
    // Tinha 3 cartas na mão após descartar 2 -> compra 2 para voltar a 5
    expect(p2.jogadores[0].mao).toHaveLength(REGRA.maoInicial);
  });

  it('diferencia Abater (♠/♣) e Recrutar (♥/♦/Coringa), respeitando limite de 2 aliados e uso com cargas', () => {
    const p0 = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Recrutador', classe: 'hearts' }],
      horizonteDeck: [figura('J', 'spades'), figura('Q', 'diamonds'), figura('K', 'clubs')],
      maosIniciais: [
        [
          { valor: 9, naipe: 'hearts' }, // 0: poder 9+1=10 -> mata J (10 vida)
          { valor: 10, naipe: 'spades' }, // 1: poder 10+2=12 (não mata Q=14)
          { valor: 9, naipe: 'clubs' }, // 2: só preta
          { valor: 2, naipe: 'diamonds' }, // 3
          { valor: 3, naipe: 'spades' }, // 4
        ],
      ],
      baralhoCompra: Array.from({ length: 12 }, () => ({ valor: 5, naipe: 'spades' as const })),
      embaralhar: false,
    });

    // Tentar recrutar com carta preta pura falha
    expect(agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [2], alvo: 'horizonte_recrutar' })).toBe(p0);

    // Recrutar J♠ com 9♥ (poder 10 >= 10 vida do J)
    const p1 = agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_recrutar' });
    expect(p1.jogadores[0].aliados).toHaveLength(1);
    expect(p1.jogadores[0].aliados[0].cargas).toBe(STATUS_FIGURA.J.cargas);
    // Avançou para a segunda figura (Q♦)
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
          { valor: 6, naipe: 'hearts' }, // poder 7, cura 3
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
    // Beto estava mais ferido (5 PV -> 8 PV) e K♠ caiu de 20 para 13 PV
    expect(pCurado.jogadores[1].vida).toBe(8);
    expect(pCurado.ameacaAtiva?.vidaAtual).toBe(13);

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

  it('no Competitivo PvP permite tiro direto no rival, descarte forçado por ♣ (6+) e vitória por eliminação', () => {
    const p0 = criarPartida({
      modo: 'pvp',
      jogadores: [
        { nome: 'Mara', classe: 'spades' },
        { nome: 'Kael', classe: 'clubs' },
      ],
      horizonteDeck: [figura('J', 'diamonds')],
      maosIniciais: [
        [
          { valor: 10, naipe: 'clubs' }, // 0: poder 10 >= 6, força descarte 1 no rival + 10 dano no rival
          { valor: 10, naipe: 'spades' }, // 1: poder 10 + 2 + 1 = 13 -> finaliza rival
          { valor: 2, naipe: 'hearts' },
          { valor: 3, naipe: 'diamonds' },
          { valor: 4, naipe: 'hearts' },
        ],
        maoPadrao(),
      ],
      baralhoCompra: Array.from({ length: 15 }, () => ({ valor: 2, naipe: 'spades' as const })),
      embaralhar: false,
    });

    const p1 = agir(p0, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: { rival: 1 } });
    // Rival levou 10 dano + descartou 1 carta, mas como é PvP o Horizonte ainda contra-ataca Mara
    expect(p1.jogadores[1].vida).toBe(10);
    expect(p1.jogadores[1].mao).toHaveLength(4);
    expect(p1.fase).toBe('bloqueio');

    // Mara aceita o bloqueio (dano 3) e passa a vez para Kael
    const p2 = agir(p1, { tipo: 'bloquear', quem: 0, indicesMao: [] });
    expect(p2.turnoDe).toBe(1);

    // Kael passa e bloqueia para voltar para Mara
    const p3 = agir(p2, { tipo: 'passarTurno', quem: 1, descartarIndices: [] });
    const p4 = agir(p3, { tipo: 'bloquear', quem: 1, indicesMao: [] });
    expect(p4.turnoDe).toBe(0);

    // Mara atira 10♠ no rival (poder 13 >= 10 PV restantes de Kael) -> vitória imediata!
    const idxEspadas = p4.jogadores[0].mao.findIndex((c) => 'valor' in c && c.valor === 10 && c.naipe === 'spades');
    const p5 = agir(p4, { tipo: 'jogarCartas', quem: 0, indicesMao: [idxEspadas], alvo: { rival: 1 } });
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
          { valor: 9, naipe: 'spades' }, // 9 + 2 + 1 = 12 >= 10 vida de J♣
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
});
