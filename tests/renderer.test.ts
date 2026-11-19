import { describe, expect, it } from 'vitest';
import {
  gerarPromptUnicoDoTema,
  gerarPromptsNanoBanana,
  renderThematicCardArtSvg,
} from '../src/components/card-art';
import {
  renderCardModalContentHtml,
  renderMagicCardHtml,
} from '../src/components/card-renderer';
import {
  configDeImpressaoPadrao,
  filterCardsForPrint,
  gerarCartasDeDinamismo,
  renderPrintSheetsHtml,
} from '../src/components/print-view';
import { cartaPeloCodigo, codigoDaCarta } from '../src/components/scanner';
import { ALL_THEME_IDS, getDefaultTheme } from '../src/data/index';

describe('Renderização de cartas, impressão 63×88mm / 57×87mm e escaneador QR', () => {
  const deck = getDefaultTheme('wasteland');

  it('renderiza frente e modal de carta Figura, carta de Ação e Coringa com HTML seguro', () => {
    const rei = deck.cards.find((c) => c.kind === 'archetype_king')!;
    const acao = deck.cards.find((c) => c.kind === 'journey' && c.suit === 'spades')!;
    const coringa = deck.cards.find((c) => c.kind === 'joker')!;

    const reiHtml = renderMagicCardHtml(rei, { interactive: true, qr: codigoDaCarta(rei) });
    expect(reiHtml).toContain('mtg-card');
    expect(reiHtml).toContain('theme-wasteland');
    expect(reiHtml).toContain('HORIZONTE');
    expect(reiHtml).toContain('Vida');
    expect(reiHtml).toContain('Ataque');
    expect(reiHtml).toContain('mtg-art-qr');
    expect(reiHtml).toContain('has-art');
    expect(reiHtml).toContain('/cards/wasteland/');
    expect(reiHtml).toContain('mtg-head-line');
    expect(reiHtml).toContain('<span class="mtg-typeline">Rei</span>');
    expect(reiHtml).not.toContain('Ameaça de');
    expect(reiHtml).not.toContain('mtg-typebar');
    expect(reiHtml).toContain('<p><span class="mtg-rule-label">Traço como Ameaça ·');

    const reiFallbackSvg = renderMagicCardHtml({ ...rei, artUrl: undefined }, { interactive: true, qr: codigoDaCarta(rei) });
    expect(reiFallbackSvg).toContain('mtg-art-illustration-svg');

    const reiComImg = renderMagicCardHtml({ ...rei, artUrl: '/figura-custom.png' });
    expect(reiComImg).toContain('has-art');
    expect(reiComImg).toContain('src="/figura-custom.png"');

    const acaoHtml = renderMagicCardHtml({ ...acao, artUrl: undefined });
    expect(acaoHtml).toContain('kind-journey');
    expect(acaoHtml).toContain('mtg-art-frame--conceptual');
    expect(acaoHtml).toContain('mtg-art-conceptual-svg');
    expect(acaoHtml).toContain(acao.playingCardCode);
    expect(acaoHtml).toContain('<span class="mtg-typeline">Ação</span>');
    expect(acaoHtml).toContain(acao.artSubtitle!);
    expect(acaoHtml).toContain('Combo de Comando:');

    // Cartas numéricas e coringas agora também aceitam artUrl full-card como background (mantendo fallback conceitual sem artUrl)
    const acaoComImg = renderMagicCardHtml({ ...acao, artUrl: '/cards/expedicao/A-spades.jpg' });
    expect(acaoComImg).toContain('has-art');
    expect(acaoComImg).toContain('src="./cards/expedicao/A-spades.jpg"');

    const coringaHtml = renderMagicCardHtml({ ...coringa, artUrl: undefined });
    expect(coringaHtml).toContain('kind-joker');
    expect(coringaHtml).toContain('mtg-art-frame--conceptual');
    expect(coringaHtml).toContain('mtg-art-conceptual-svg');
    expect(coringaHtml).toContain('<span class="mtg-typeline">Coringa ★</span>');

    // Modo baralho convencional (só arte) oculta textos do jogo e exibe índices nos cantos
    const acaoSoArte = renderMagicCardHtml(
      { ...acao, artUrl: '/cards/expedicao/A-spades.jpg' },
      { artOnly: true, qr: codigoDaCarta(acao) },
    );
    expect(acaoSoArte).toContain('is-art-only');
    expect(acaoSoArte).toContain('mtg-corner-badge--tl');
    expect(acaoSoArte).toContain('mtg-corner-badge--br');

    // Modo carta vazada / sleeve (só textos, sem imagem de fundo)
    const reiSoTexto = renderMagicCardHtml(rei, { textOnly: true });
    expect(reiSoTexto).toContain('is-text-only');
    expect(reiSoTexto).toContain('mtg-art-frame--cutout');
    expect(reiSoTexto).toContain('mtg-cutout-window');
    expect(reiSoTexto).toContain(rei.title);
    expect(reiSoTexto).toContain('Traço como Ameaça');
    expect(reiSoTexto).not.toContain('mtg-art-img');
    expect(reiSoTexto).not.toContain('has-art');
    expect(reiSoTexto).not.toContain('mtg-art-illustration-svg');

    const acaoSemArtSoTexto = renderMagicCardHtml({ ...acao, artUrl: undefined }, { textOnly: true });
    expect(acaoSemArtSoTexto).toContain('is-text-only');
    expect(acaoSemArtSoTexto).toContain('mtg-art-frame--cutout');
    expect(acaoSemArtSoTexto).toContain(acao.title);
    expect(acaoSemArtSoTexto).not.toContain('mtg-art-conceptual-svg');
    expect(acaoSemArtSoTexto).not.toContain('mtg-art-illustration-svg');

    // Todos os 12 temas com baralho gerado populam 54 URLs únicas (todos os 4 naipes + 2 Coringas)
    expect(ALL_THEME_IDS).toHaveLength(12);
    for (const themeId of ALL_THEME_IDS) {
      const deckTema = getDefaultTheme(themeId);
      const urls = deckTema.cards.map((c) => c.artUrl);
      expect(urls.every((u) => typeof u === 'string' && u.startsWith(`/cards/${themeId}/`))).toBe(true);
      expect(new Set(urls).size).toBe(54);
      expect(urls).toContain(`/cards/${themeId}/A-hearts.jpg`);
      expect(urls).toContain(`/cards/${themeId}/7-diamonds.jpg`);
      expect(urls).toContain(`/cards/${themeId}/K-clubs.jpg`);
      expect(urls).toContain(`/cards/${themeId}/joker-light.jpg`);
      expect(urls).toContain(`/cards/${themeId}/joker-dark.jpg`);
    }

    // Gradientes SVG isolados por carta para evitar colisão de IDs na mesma página
    const svgRei = renderThematicCardArtSvg(rei);
    const svgAcao = renderThematicCardArtSvg(acao);
    expect(svgRei).toContain('bg_wasteland-');
    expect(svgRei).toContain('mtg-art-illustration-svg');
    expect(svgRei).toContain('viewBox="0 0 252 352"');
    expect(svgAcao).toContain('mtg-art-conceptual-svg');
    expect(svgAcao).toContain('viewBox="0 0 252 352"');
    expect(svgAcao).toContain('href="./cards/wasteland/');
    expect(svgAcao).not.toEqual(svgRei);

    const prompts = gerarPromptsNanoBanana(deck, acao);
    expect(prompts.promptUnicoTema).toBe(gerarPromptUnicoDoTema(deck));
    expect(prompts.promptUnicoTema).toContain('ALL-IN-ONE MASTER DECK PACK');
    expect(prompts.promptUnicoTema).toContain('Fundo da Carta');
    expect(prompts.promptUnicoTema).not.toContain('Playmat');
    expect(prompts.promptCartaAtual).toContain(acao.playingCardCode);
    expect(prompts.promptCartaAtual).toContain('conceptual');
    expect(gerarPromptsNanoBanana(deck, rei).promptCartaAtual).toContain('Illustrated tabletop Figure');
    expect(prompts.promptDeckCompleto).toContain(deck.name);
    expect(prompts.promptVersoCarta).toContain('63x88mm');

    const modalHtml = renderCardModalContentHtml(rei);
    expect(modalHtml).toContain('zoom-modal-inner');
    expect(modalHtml).toContain('is-card-only');
    expect(modalHtml).toContain('zoom-card-scale');
    expect(modalHtml).toContain('data-zoom-toggle-details');
    expect(modalHtml).toContain('aria-expanded="false"');
    expect(modalHtml).toContain('class="zoom-reading-section" hidden');

    const modalComDetalhesHtml = renderCardModalContentHtml(rei, { showDetails: true, fromScanner: true });
    expect(modalComDetalhesHtml).toContain('is-with-details');
    expect(modalComDetalhesHtml).toContain('aria-expanded="true"');
    expect(modalComDetalhesHtml).toContain('Só a carta');
    expect(modalComDetalhesHtml).toContain('data-zoom-voltar-escaneador');
    expect(modalComDetalhesHtml).toContain('Carta de Ameaça / Aliado');
    expect(modalComDetalhesHtml).not.toContain('class="zoom-reading-section" hidden');
  });

  it('gera código QR HORIZONTE:<código> e reconhece prefixos HORIZONTE: e LIMIAR:', () => {
    const primeira = deck.cards[0];
    const code = codigoDaCarta(primeira);

    expect(code).toMatch(/^HORIZONTE:/);
    expect(cartaPeloCodigo(deck.cards, code)).toBe(primeira);
    expect(cartaPeloCodigo(deck.cards, code.replace('HORIZONTE:', 'LIMIAR:'))).toBe(primeira);
  });

  it('gera 9 cartas de apoio (Especializações + Referência HORIZONTE) e filtra modos de impressão', () => {
    const apoio = gerarCartasDeDinamismo(deck);
    expect(apoio).toHaveLength(9);
    expect(apoio.filter((c) => c.title.startsWith('Especialização ·'))).toHaveLength(4);

    expect(filterCardsForPrint(deck, 'figures')).toHaveLength(12);
    expect(filterCardsForPrint(deck, 'mission')).toHaveLength(42);
    expect(filterCardsForPrint(deck, 'dinamismo')).toHaveLength(9);

    const todas = filterCardsForPrint(deck, 'all');
    expect(todas).toHaveLength(63);
    expect(todas.slice(54).map((c) => c.id)).toEqual(apoio.map((c) => c.id));

    for (const cartaApoio of apoio) {
      expect(cartaApoio.artUrl).toBe('/cards/wasteland/10-clubs.jpg');
    }

    const htmlApoio = renderMagicCardHtml(apoio[0]);
    expect(htmlApoio).toContain('Carta de Apoio · Kit de Mesa');
    expect(htmlApoio).toContain('KIT 01/09');
    expect(htmlApoio).toContain(apoio[0].flavorText);
    expect(htmlApoio).toContain('has-art');
    expect(htmlApoio).toContain('src="./cards/wasteland/10-clubs.jpg"');
    expect(htmlApoio).not.toContain('mtg-art-conceptual-svg');
    expect(htmlApoio).not.toContain('Valor 8');
    expect(htmlApoio).not.toContain('55/54');
  });

  it('gera folhas A4 3×3 e Card-a-Card nos formatos Poker e Bridge', () => {
    const base = configDeImpressaoPadrao();
    const a4Html = renderPrintSheetsHtml(deck, { ...base, conjunto: 'figures', formato: 'a4' });
    expect(a4Html).toContain('print-sheet');
    expect(a4Html).toContain('tamanho-poker');

    const cardBridgeHtml = renderPrintSheetsHtml(deck, {
      ...base,
      conjunto: 'dinamismo',
      tamanho: 'bridge',
      formato: 'card-intercalado',
    });
    expect(cardBridgeHtml).toContain('folha-card-grafica--frente');
    expect(cardBridgeHtml).toContain('folha-card-grafica--verso');
    expect(cardBridgeHtml).toContain('tamanho-bridge');

    const deckExp = getDefaultTheme('expedicao');
    const convencionalHtml = renderPrintSheetsHtml(deckExp, {
      ...base,
      conjunto: 'all',
      verso: 'tema',
      apenasArte: true,
    });
    expect(convencionalHtml).toContain('63 cartas · 7 folhas');
    expect(convencionalHtml).toContain('página 14 de 14');
    expect(convencionalHtml).toContain('is-art-only');
    expect(convencionalHtml.match(/\bis-art-only\b/g)).toHaveLength(54);
    expect(convencionalHtml).toContain('KIT 01/09');
    expect(convencionalHtml).toContain('Foco letal em cada disparo.');
    expect(convencionalHtml).toContain('/cards/expedicao/back.jpg');
    expect(convencionalHtml).toContain('verso-img');

    const vazadasHtml = renderPrintSheetsHtml(deckExp, {
      ...base,
      conjunto: 'all',
      apenasTexto: true,
    });
    expect(vazadasHtml).toContain('id="print-apenas-texto" checked');
    expect(vazadasHtml.match(/\bis-text-only\b/g)).toHaveLength(63);
    expect(vazadasHtml.match(/\bmtg-cutout-window\b/g)).toHaveLength(63);
    expect(vazadasHtml).not.toContain('mtg-art-img');
    expect(vazadasHtml).not.toContain('mtg-art-illustration-svg');
    expect(vazadasHtml).not.toContain('mtg-art-conceptual-svg');
  });
});
