import { describe, expect, it } from 'vitest';
import { ROTEIRO_EXEMPLO, encenarExemplo } from '../src/data/partida-exemplo';

describe('Turno de exemplo encenado pelo motor real', () => {
  it('executa todos os passos do ROTEIRO_EXEMPLO com transições válidas de estado', () => {
    const encenado = encenarExemplo();

    expect(encenado.passos).toHaveLength(ROTEIRO_EXEMPLO.length);
    expect(encenado.passos.length).toBeGreaterThanOrEqual(5);

    for (const cena of encenado.passos) {
      expect(cena.depois).not.toBe(cena.antes);
      expect(cena.statusDepois.trim().length).toBeGreaterThan(0);
    }

    // Turno 1 (-3 PV) e Turno 3 (-4 PV) reduzem Mara de 15 para 8 PV; Kael sofreu 11 de dano (4 PV)
    expect(encenado.final.jogadores[0].vida).toBe(8);
    expect(encenado.final.jogadores[1].vida).toBe(4);
    expect(encenado.final.jogadores[1].aliados).toHaveLength(1);
    expect(encenado.final.jogadores[1].aliados[0].cargas).toBe(1);
    expect(encenado.final.ameacaAtiva?.vidaAtual).toBe(10);
    expect(encenado.statusFinal).toContain('PVP');
  });
});
