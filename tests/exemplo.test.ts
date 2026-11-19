import { describe, expect, it } from 'vitest';
import { renderExemploHtml } from '../src/components/exemplo-view';
import { getDefaultTheme } from '../src/data/index';
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

    // Turno 1 (-3 PV) e Turno 3 (-4 PV) reduzem Mara de 15 para 8 PV; Kael sofreu 6 de dano em Fogo Cruzado (9 PV) e J♣ caiu para 4 PV
    expect(encenado.final.jogadores[0].vida).toBe(8);
    expect(encenado.final.jogadores[1].vida).toBe(9);
    expect(encenado.final.jogadores[1].aliados).toHaveLength(1);
    expect(encenado.final.jogadores[1].aliados[0].cargas).toBe(1);
    expect(encenado.final.ameacaAtiva?.vidaAtual).toBe(4);
    expect(encenado.statusFinal).toContain('PVP');
  });

  it('renderiza o exemplo interativo passo a passo (0 a 6) com deltas de PV, mãos e aliado', () => {
    const wasteland = getDefaultTheme('wasteland');

    const p0 = renderExemploHtml(wasteland, 0);
    expect(p0).toContain('Passo 0 de 6');
    expect(p0).toContain('Setup Inicial');
    expect(p0).toContain('12 / 12 PV');
    expect(p0).toContain('❤ 15/15 PV');

    const p1 = renderExemploHtml(wasteland, 1);
    expect(p1).toContain('Lance 1 de 6');
    expect(p1).toContain('12 → 2 PV (-10)');
    expect(p1).toContain('Janela de Bloqueio');
    expect(p1).toContain('5 de dano');

    const p2 = renderExemploHtml(wasteland, 2);
    expect(p2).toContain('Lance 2 de 6');
    expect(p2).toContain('15 → 12 PV (-3)');
    expect(p2).toContain('+1 carta comprada no fim do turno');

    const p3 = renderExemploHtml(wasteland, 3);
    expect(p3).toContain('Lance 3 de 6');
    expect(p3).toContain('Recrutado agora!');
    expect(p3).toContain('Nova Ameaça revelada!');
    expect(p3).toContain('+1 carta comprada no fim do turno');

    const p4 = renderExemploHtml(wasteland, 4);
    expect(p4).toContain('Lance 4 de 6');
    expect(p4).toContain('15 → 9 PV (-6)');
    expect(p4).toContain('12 → 6 PV (-6)');

    const p5 = renderExemploHtml(wasteland, 5);
    expect(p5).toContain('Lance 5 de 6');
    expect(p5).toContain('12 → 8 PV (-4)');
    expect(p5).toContain('Recebeu no Corpo');

    const p6 = renderExemploHtml(wasteland, 6);
    expect(p6).toContain('Lance 6 de 6');
    expect(p6).toContain('2 → 1 uso');
    expect(p6).toContain('6 → 4 PV (-2)');
    expect(p6).toContain('Continua na vez (Passo 2)');

    // Clamp para valores fora da faixa
    expect(renderExemploHtml(wasteland, -3)).toContain('Passo 0 de 6');
    expect(renderExemploHtml(wasteland, 99)).toContain('Lance 6 de 6');
  });
});
