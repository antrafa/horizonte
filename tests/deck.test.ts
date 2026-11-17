import { describe, expect, it } from 'vitest';
import { splitPocketAndWorld } from '../src/data/engine-deck';
import { ALL_THEME_IDS, DEFAULT_THEME_ID, THEMES, getDefaultTheme } from '../src/data/index';

describe('Catálogo de temas e baralho de 54 cartas (HORIZONTE)', () => {
  it('define wasteland (Cinzas do Horizonte) como tema padrão e lista todos os 12 temas', () => {
    expect(DEFAULT_THEME_ID).toBe('wasteland');
    expect(ALL_THEME_IDS).toHaveLength(12);
    expect(ALL_THEME_IDS[0]).toBe('wasteland');
    expect(ALL_THEME_IDS).toEqual(
      expect.arrayContaining([
        'wasteland',
        'zombies',
        'neon',
        'eclipse',
        'vampires',
        'expedicao',
        'noir',
        'orbital',
        'arcana',
        'corsarios',
        'kaiju',
        'floresta',
      ]),
    );
  });

  it('garante que todos os 12 temas possuem 54 cartas válidas e únicas (12 Figuras + 40 A–10 + 2 Coringas)', () => {
    for (const id of ALL_THEME_IDS) {
      const deck = getDefaultTheme(id);
      expect(THEMES[id]).toEqual(deck);
      expect(deck.cards).toHaveLength(54);

      const figuresOnly = deck.cards.filter(
        (c) => c.kind === 'scar_jack' || c.kind === 'trump_queen' || c.kind === 'archetype_king',
      );
      const journeys = deck.cards.filter((c) => c.kind === 'journey');
      const jokers = deck.cards.filter((c) => c.kind === 'joker');

      expect(figuresOnly).toHaveLength(12);
      expect(journeys).toHaveLength(40);
      expect(jokers).toHaveLength(2);

      const { figures, worldDeck } = splitPocketAndWorld(deck);
      expect(figures).toHaveLength(12);
      expect(worldDeck).toHaveLength(42);

      const collectorNums = new Set(deck.cards.map((c) => c.collectorNumber));
      expect(collectorNums.size).toBe(54);
      for (let i = 1; i <= 54; i++) {
        expect(collectorNums.has(i)).toBe(true);
      }

      const cardCodes = new Set(deck.cards.map((c) => c.playingCardCode));
      expect(cardCodes.size).toBe(54);

      for (const c of deck.cards) {
        expect(c.themeId).toBe(id);
        expect(c.title.trim().length).toBeGreaterThan(0);
        expect(c.flavorText.trim().length).toBeGreaterThan(0);

        const camposMecanicos = [
          c.figurePassiveOrRule ?? '',
          c.figureSpecialOrTaboo ?? '',
          c.topWatcherTrigger ?? '',
          c.bottomEchoPrompt ?? '',
          c.bottomEchoEffect ?? '',
          c.dailyIdea ?? '',
        ].join(' ');

        expect(camposMecanicos).not.toMatch(
          /voz alta|por escrito|Tabu na Vida Real|Passiva na Vida Real|Untap|Gatilho de Entrada|Habilita Abater|dano perfurante/i,
        );

        if (c.kind === 'journey' || c.kind === 'joker') {
          expect((c.bottomEchoPrompt ?? '').trim().length).toBeGreaterThan(0);
        } else {
          expect(c.figureSpecialOrTaboo).toMatch(/Recrutad.*por uso/);
        }
      }
    }
  });
});
