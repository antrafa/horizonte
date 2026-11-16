import { beforeEach, describe, expect, it } from 'vitest';
import { criarPartida } from '../src/core/partida';
import {
  exportThemeJson,
  importThemeJson,
  loadEstadoDoMundo,
  loadPartida,
  loadThemeId,
  loadThemeWithOverrides,
  resetThemeOverrides,
  saveCardOverride,
  savePartida,
  saveThemeId,
  syncEstadoDoMundo,
} from '../src/core/storage';
import { getDefaultTheme } from '../src/data/index';

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, String(value));
    },
  };
}

describe('Persistência local de HORIZONTE (storage.ts)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  });

  it('salva, carrega e limpa overrides de carta sem mutar o baralho padrão', () => {
    const base = getDefaultTheme('wasteland');
    const editada = { ...base.cards[0], title: 'Comboio Blindado Editado' };

    saveCardOverride(editada);
    const carregado = loadThemeWithOverrides('wasteland');
    expect(carregado.cards[0].title).toBe('Comboio Blindado Editado');
    expect(base.cards[0].title).not.toBe('Comboio Blindado Editado');

    resetThemeOverrides('wasteland');
    expect(loadThemeWithOverrides('wasteland').cards[0].title).toBe(base.cards[0].title);
  });

  it('restaura artUrl padrão quando override salvo está vazio ou usa caminho legado pré-naipe', () => {
    const base = getDefaultTheme('wasteland');
    const c0 = base.cards[0];
    const c1 = base.cards[1];
    const c2 = base.cards[2];

    saveCardOverride({ ...c0, artUrl: '' });
    saveCardOverride({ ...c1, artUrl: '/cards/wasteland/J.jpg' });
    saveCardOverride({ ...c2, artUrl: '/custom/arte-exclusiva.png' });

    const carregado = loadThemeWithOverrides('wasteland');
    expect(carregado.cards[0].artUrl).toBe(c0.artUrl);
    expect(carregado.cards[1].artUrl).toBe(c1.artUrl);
    expect(carregado.cards[2].artUrl).toBe('/custom/arte-exclusiva.png');
  });

  it('exporta e reimporta JSON de tema com validação de 54 cartas e tema válido', () => {
    const base = getDefaultTheme('neon');
    const json = exportThemeJson(base);
    const importado = importThemeJson(json);

    expect(importado.id).toBe('neon');
    expect(importado.cards).toHaveLength(54);
    expect(() => importThemeJson('{"id":"invalido","cards":[]}')).toThrow();
  });

  it('persiste partida ativa, tema escolhido e crônica do estado do mundo', () => {
    saveThemeId('zombies');
    expect(loadThemeId()).toBe('zombies');

    const partida = criarPartida({
      modo: 'coop',
      jogadores: [
        { nome: 'Ava', classe: 'spades' },
        { nome: 'Noah', classe: 'hearts' },
      ],
      embaralhar: false,
    });
    savePartida(partida);
    const restaurada = loadPartida();
    expect(restaurada).not.toBeNull();
    expect(restaurada?.modo).toBe('coop');
    expect(restaurada?.jogadores).toHaveLength(2);

    const estado = syncEstadoDoMundo('zombies', partida, 'Bunker reforçado');
    expect(estado.notaDoMundo).toBe('Bunker reforçado');
    expect(loadEstadoDoMundo('zombies').notaDoMundo).toBe('Bunker reforçado');
  });
});
