import { describe, expect, it } from 'vitest';
import { agir, criarPartida } from '../src/core/partida';
import { escapeHtml } from '../src/components/card-renderer';
import { renderExemploHtml } from '../src/components/exemplo-view';
import { renderOracleGuideHtml } from '../src/components/oracle-view';
import { preparacaoPadrao, renderPlaytestTableHtml } from '../src/components/playtest-view';
import { renderQuickstartGuideHtml } from '../src/components/quickstart-view';
import { renderStudioGalleryHtml } from '../src/components/studio-view';
import { renderTemasHtml } from '../src/components/temas-view';
import { ALL_THEME_IDS, THEMES, getDefaultTheme } from '../src/data/index';

describe('Integração das views HTML de HORIZONTE', () => {
  const wasteland = getDefaultTheme('wasteland');

  it('renderiza Quickstart, Exemplo, Compêndio, Estúdio e Catálogo de 12 Temas', () => {
    const qs = renderQuickstartGuideHtml(wasteland);
    expect(qs).toContain('Cinzas do Horizonte');
    expect(qs).toContain('Solo');
    expect(qs).toContain('Cooperativo');
    expect(qs).toContain('Competitivo PvP');

    const ex = renderExemploHtml(wasteland);
    expect(ex).toContain('Divida as 54 cartas');
    expect(ex).toContain('Mara');
    expect(ex).toContain('Kael');

    const oracle = renderOracleGuideHtml(wasteland);
    expect(oracle).toContain('Compêndio / Livreto Guia');
    expect(oracle).toContain('Regras de Bolso');
    expect(oracle).toContain('Combos');

    const studio = renderStudioGalleryHtml(wasteland, wasteland.cards[0], 'all');
    expect(studio).toContain('Todas (54)');
    expect(studio).toContain('Horizonte J/Q/K (12)');

    const todosTemas = ALL_THEME_IDS.map((id) => THEMES[id]);
    const temasHtml = renderTemasHtml(todosTemas, 'wasteland');
    for (const t of todosTemas) {
      expect(temasHtml).toContain(escapeHtml(t.name));
    }
  });

  it('renderiza a Mesa de Jogo na fase de preparação offline e nos 3 modos ativos (inclusive bloqueio)', () => {
    const preparo = preparacaoPadrao();
    const prepHtml = renderPlaytestTableHtml(wasteland, null, preparo);
    expect(prepHtml).toContain('Mesa local pronta');
    expect(prepHtml).toContain('data-modo-mesa="solo"');
    expect(prepHtml).toContain('data-modo-mesa="coop"');
    expect(prepHtml).toContain('data-modo-mesa="pvp"');

    const partidaSolo = criarPartida({
      modo: 'solo',
      jogadores: [{ nome: 'Solo', classe: 'spades' }],
      embaralhar: false,
    });
    const soloHtml = renderPlaytestTableHtml(wasteland, partidaSolo, preparo, [0]);
    expect(soloHtml).toContain('Modo Solo');
    expect(soloHtml).toContain('Abater no Horizonte');
    expect(soloHtml).toContain('Recrutar / Dominar');

    // Avança para janela de bloqueio jogando carta baixa na Ameaça
    const pBloqueio = agir(partidaSolo, { tipo: 'jogarCartas', quem: 0, indicesMao: [0], alvo: 'horizonte_abater' });
    if (pBloqueio.fase === 'bloqueio') {
      const blockHtml = renderPlaytestTableHtml(wasteland, pBloqueio, preparo, []);
      expect(blockHtml).toContain('Contra-ataque da Ameaça');
      expect(blockHtml).toContain('is-blocking');
    }

    const partidaPvp = criarPartida({
      modo: 'pvp',
      jogadores: [
        { nome: 'Alfa', classe: 'spades' },
        { nome: 'Beta', classe: 'hearts' },
      ],
      embaralhar: false,
    });
    const pvpHtml = renderPlaytestTableHtml(wasteland, partidaPvp, { ...preparo, modo: 'pvp' }, [0]);
    expect(pvpHtml).toContain('Competitivo PvP');
    expect(pvpHtml).toContain('Atacar Beta');
    expect(pvpHtml).toContain('Domínio');
  });
});
