import { describe, expect, it } from 'vitest';
import { renderCardModalContentHtml } from '../src/components/card-renderer';
import { preparacaoPadrao, renderPlaytestTableHtml } from '../src/components/playtest-view';
import { ehCartaOculta, mascararPartidaParaJogador } from '../src/core/online-sync';
import { criarPartida } from '../src/core/partida';
import { getDefaultTheme } from '../src/data/index';

describe('Sala online P2P autoritativa (mão privada, assentos e trava de turno)', () => {
  const wasteland = getDefaultTheme('wasteland');

  it('mascara baralho de compra, deck do Horizonte e mão de outros jogadores sem alterar as contagens', () => {
    const partida = criarPartida({
      modo: 'pvp',
      jogadores: [
        { nome: 'Alfa', classe: 'spades' },
        { nome: 'Beta', classe: 'hearts' },
      ],
      embaralhar: false,
    });

    const visaoBeta = mascararPartidaParaJogador(partida, 1);

    expect(visaoBeta.baralhoCompra).toHaveLength(partida.baralhoCompra.length);
    expect(visaoBeta.baralhoCompra.every(ehCartaOculta)).toBe(true);
    expect(visaoBeta.horizonteDeck).toHaveLength(partida.horizonteDeck.length);

    expect(visaoBeta.jogadores[0].mao).toHaveLength(partida.jogadores[0].mao.length);
    expect(visaoBeta.jogadores[0].mao.every(ehCartaOculta)).toBe(true);

    expect(visaoBeta.jogadores[1].mao).toEqual(partida.jogadores[1].mao);
    expect(visaoBeta.jogadores[1].mao.some(ehCartaOculta)).toBe(false);
  });

  it('renderiza lobby online com assentos, controle restrito ao anfitrião e trava de turno na partida', () => {
    const preparo = {
      ...preparacaoPadrao(),
      modo: 'pvp' as const,
      jogadores: [
        { nome: 'Alfa', classe: 'spades' as const },
        { nome: 'Beta', classe: 'hearts' as const },
      ],
    };

    const lobbyConvidado = renderPlaytestTableHtml(wasteland, null, preparo, [], {
      salaId: 'ABC123',
      conectando: false,
      ehHost: false,
      meuAssento: 1,
      assentosConectados: [true, true],
      totalConectados: 2,
    });

    expect(lobbyConvidado).toContain('Sala online · Convidado');
    expect(lobbyConvidado).toContain('2/2 conectados');
    expect(lobbyConvidado).toContain('Aguardando o anfitrião iniciar a partida');
    expect(lobbyConvidado).not.toContain('Embaralhar e começar partida');

    const partida = criarPartida({
      modo: 'pvp',
      jogadores: preparo.jogadores,
      embaralhar: false,
    });
    const visaoBeta = mascararPartidaParaJogador(partida, 1);

    // Turno é de Alfa (0), mas Beta (1) vê a própria mão e fica bloqueado de agir
    const mesaBetaEsperando = renderPlaytestTableHtml(wasteland, visaoBeta, preparo, [], {
      salaId: 'ABC123',
      conectando: false,
      ehHost: false,
      meuAssento: 1,
      assentosConectados: [true, true],
      totalConectados: 2,
    });

    expect(mesaBetaEsperando).toContain('Sua mão privada');
    expect(mesaBetaEsperando).toContain('Aguardando turno de Alfa');
    expect(mesaBetaEsperando).not.toContain('data-selecionar-carta=');
    expect(mesaBetaEsperando).not.toContain('Abater no Horizonte');
  });

  it('exibe botão de selecionar/desmarcar dentro do modal de zoom quando aberto da mão ativa', () => {
    const carta = wasteland.cards.find((c) => c.kind === 'journey')!;

    const htmlSelecionar = renderCardModalContentHtml(carta, {
      handSelect: { selecionada: false, podeSelecionar: true },
    });
    expect(htmlSelecionar).toContain('data-zoom-toggle-select');
    expect(htmlSelecionar).toContain('Selecionar carta');

    const htmlDesmarcar = renderCardModalContentHtml(carta, {
      handSelect: { selecionada: true, podeSelecionar: true },
    });
    expect(htmlDesmarcar).toContain('Desmarcar carta');

    const htmlForaDeTurno = renderCardModalContentHtml(carta, {
      handSelect: { selecionada: false, podeSelecionar: false },
    });
    expect(htmlForaDeTurno).not.toContain('data-zoom-toggle-select');
  });
});
