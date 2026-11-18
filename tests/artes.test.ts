import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { MINIMO_300_DPI, normalizarArte } from '../scripts/artes/imagem';
import { ARQUIVO_ANCORA, listarAlvos, promptDaCarta } from '../scripts/artes/prompts';
import { formatarLinhaDeStatusDoTema, resolverAlvosParaRegerar, todosOsAlvosDoTema } from '../scripts/artes/status';
import { renderMagicCardHtml } from '../src/components/card-renderer';
import { ALL_THEME_IDS, getDefaultTheme } from '../src/data/index';

const imagem = (largura: number, altura: number) =>
  sharp({ create: { width: largura, height: altura, channels: 3, background: '#336699' } }).png().toBuffer();

describe('Gerador automático de artes (scripts/artes)', () => {
  it('lista âncora K♣ + 54 alvos (53 cartas + verso) com os nomes de arquivo do jogo, para todos os temas', () => {
    for (const id of ALL_THEME_IDS) {
      const deck = getDefaultTheme(id);
      const { ancora, demais } = listarAlvos(deck);
      expect(ancora.arquivo).toBe(ARQUIVO_ANCORA);
      expect(demais).toHaveLength(54);
      const arquivos = new Set([ancora.arquivo, ...demais.map((a) => a.arquivo)]);
      expect(arquivos.size).toBe(55);
      for (const c of deck.cards) {
        expect(c.artUrl && arquivos.has(c.artUrl.split('/').pop()!)).toBe(true);
      }
      expect(arquivos.has('back.jpg')).toBe(true);
    }
  });

  it('pede arte sem texto/índices, usa referência só fora da âncora e respeita restrições do tema', () => {
    const corsarios = getDefaultTheme('corsarios');
    const { ancora, demais } = listarAlvos(corsarios, 'traço de HQ');
    expect(ancora.prompt).toContain('STRICTLY NO text');
    expect(ancora.prompt).not.toContain('attached reference image');
    expect(demais[0].prompt).toContain('attached reference image');
    expect(ancora.prompt).toContain('AVOID: airships');
    expect(ancora.prompt).toContain('ART DIRECTOR NOTES: traço de HQ');
    expect(ancora.prompt).not.toMatch(/corner indices,|ornate border/);

    const wasteland = getDefaultTheme('wasteland');
    const sete = wasteland.cards.find((c) => c.rank === '7' && c.suit === 'spades')!;
    expect(promptDaCarta(wasteland, sete, true)).toContain(sete.title);
  });

  it('normaliza para a proporção 67×92 em JPEG e recusa imagens abaixo de 300 dpi', async () => {
    const gemini = await normalizarArte(await imagem(864, 1184));
    expect(gemini.altura).toBe(1184);
    expect(gemini.largura).toBe(862);
    expect((await sharp(gemini.jpeg).metadata()).format).toBe('jpeg');

    const openai = await normalizarArte(await imagem(1024, 1536));
    expect(openai.largura).toBe(1024);
    expect(openai.altura).toBe(1406);

    await expect(normalizarArte(await imagem(276, 384))).rejects.toThrow(String(MINIMO_300_DPI.largura));
  });

  it('modo só arte marca has-clean-art nos 12 temas regerados e renderiza índice vertical de valor + naipe', () => {
    for (const id of ALL_THEME_IDS) {
      const carta = getDefaultTheme(id).cards[0];
      expect(renderMagicCardHtml(carta, { artOnly: true })).toContain('has-clean-art');
    }

    const noveOurosZombies = getDefaultTheme('zombies').cards.find((c) => c.rank === '9' && c.suit === 'diamonds')!;
    const htmlZombies = renderMagicCardHtml(noveOurosZombies, { artOnly: true });
    expect(htmlZombies).toContain('has-clean-art');
    expect(htmlZombies).toContain('<span class="mtg-corner-rank">9</span><span class="mtg-corner-suit">♦</span>');
  });

  it('resolve seleção de cartas para regerar por número, código (9♦/9D/★/verso) e arquivo, e formata status do menu', () => {
    const zombies = getDefaultTheme('zombies');
    const todos = todosOsAlvosDoTema(zombies);
    expect(todos).toHaveLength(55);

    const r = resolverAlvosParaRegerar(zombies, '1, 9♦, AS, ★, 💀, verso, 10-hearts.jpg, invalido');
    expect(r.selecionados.map((a) => a.arquivo)).toEqual([
      'K-clubs.jpg',
      '9-diamonds.jpg',
      'A-spades.jpg',
      'joker-light.jpg',
      'joker-dark.jpg',
      'back.jpg',
      '10-hearts.jpg',
    ]);
    expect(r.invalidos).toEqual(['invalido']);

    const linha = formatarLinhaDeStatusDoTema(
      2,
      {
        temaId: 'zombies',
        nome: 'Protocolo Zumbi',
        aplicadoNoJogo: true,
        porProvedor: {
          openai: { gerados: todos, pendentes: [], totalEsperado: 55 },
          gemini: { gerados: [], pendentes: todos, totalEsperado: 55 },
        },
      },
      'openai',
    );
    expect(linha).toContain('✓ 55/55 openai');
    expect(linha).toContain('·  0/55 gemini');
    expect(linha).toContain('✓ APLICADO');
    expect(linha).toContain('zombies');
  });
});
