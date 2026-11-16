import { codigoCarta, REGRA, STATUS_FIGURA } from '../core/partida';
import { encenarExemplo } from '../data/partida-exemplo';
import type { ThemeDeck } from '../types/card';
import { cartaDoTemaPorFigura, escapeHtml } from './card-renderer';

interface Minuto {
  titulo: string;
  faca: string;
  pronto: string;
}

function minutos(deck: ThemeDeck): Minuto[] {
  return [
    {
      titulo: 'Divida as 54 cartas',
      faca: 'Separe as 12 Figuras (J, Q, K) das outras 42 cartas (A–10 + 2 Coringas). Em uma mesa comum, basta 1 baralho para até 4 jogadores.',
      pronto: 'dois montes separados no centro.',
    },
    {
      titulo: 'Monte o Horizonte (3 Ondas)',
      faca: 'Embaralhe os 4 Reis embaixo, as 4 Damas no meio e os 4 Valetes no topo. Vire a primeira Figura aberta no centro da mesa.',
      pronto: `uma Ameaça inicial revelada (${STATUS_FIGURA.J.vida} PV · ${STATUS_FIGURA.J.ataque} Atq).`,
    },
    {
      titulo: 'Prepare sua Zona',
      faca: `Cada pessoa escolhe o modo (Solo, Coop ou PvP), escolhe 1 naipe de Especialização (+1 de força nele), marca ${REGRA.vidaInicial} PV e compra ${REGRA.maoInicial} cartas.`,
      pronto: `${REGRA.maoInicial} cartas na mão e ${REGRA.vidaInicial} PV marcados.`,
    },
    {
      titulo: 'Jogue e Combine',
      faca: `Na sua vez, jogue 1 carta, 2–4 cartas de mesmo valor ou 1 carta + Ás (+${REGRA.bonusAsCombo}). Escolha bater no Horizonte, recrutar com ♥/♦ ou atirar no rival (PvP).`,
      pronto: 'os efeitos dos naipes entram na hora.',
    },
    {
      titulo: 'Bloqueie e Reponha',
      faca: `Se a Figura central sobreviveu, ela contra-ataca. Descarte cartas da mão pelo valor delas para bloquear ou receba o dano nos PV. Depois compre até ter ${REGRA.maoInicial} cartas.`,
      pronto: `hora do próximo jogador — até o último de ${escapeHtml(deck.chefe.nome)} cair!`,
    },
  ];
}

const COLA: Array<[string, string]> = [
  ['Valores', `2–10 = face · Ás = ${REGRA.valorAsSolo} sozinho (+${REGRA.bonusAsCombo} em combo) · ★ = ${REGRA.valorEstrela} · 💀 = ${REGRA.valorCaveira} (-2 PV recuo)`],
  ['Naipes', `♠ +${REGRA.bonusEspadas} dano · ♣ reduz ataque da Ameaça (½ valor) · ♦ compra +1/+2 · ♥ cura PV (½ valor)`],
  ['Finalizar', 'Abater (qualquer / ♠♣): vai p/ Troféus + compra Saque · Recrutar (com ♥♦★💀): vira seu Aliado!'],
  ['Escala J/Q/K', `Valete: ${STATUS_FIGURA.J.vida}PV/${STATUS_FIGURA.J.ataque}Atq · Dama: ${STATUS_FIGURA.Q.vida}PV/${STATUS_FIGURA.Q.ataque}Atq · Rei: ${STATUS_FIGURA.K.vida}PV/${STATUS_FIGURA.K.ataque}Atq`],
  ['Bloqueio', `Descarte cartas da mão para somar bloqueio = valor da carta (ou 1 carga de Aliado = ${REGRA.escudoAliado} bloqueio).`],
];

export function renderExemploHtml(deck: ThemeDeck): string {
  const encenado = encenarExemplo();
  const passosHtml = encenado.passos
    .map((item) => {
      const figAtiva = item.depois.ameacaAtiva?.figura ?? item.antes.ameacaAtiva?.figura;
      const cartaTema = figAtiva ? cartaDoTemaPorFigura(deck.cards, figAtiva) : undefined;
      const maosResumo = item.depois.jogadores
        .map((j) => `${escapeHtml(j.nome)}: ${j.vida} PV · ${j.aliados.length} aliado(s) · mão [${j.mao.map(codigoCarta).join(' ')}]`)
        .join(' | ');

      return `
        <li class="msg">
          <span class="msg-time num">${escapeHtml(item.passo.hora)}</span>
          <div class="msg-body">
            <p><strong>${escapeHtml(item.passo.titulo)}</strong> ${cartaTema ? `<button type="button" class="btn-ghost btn-sm" data-zoom-card-id="${escapeHtml(cartaTema.id)}">Ver ${escapeHtml(cartaTema.playingCardCode)}</button>` : ''}</p>
            <p>${escapeHtml(item.passo.narrativa)}</p>
            <p class="msg-note">${escapeHtml(item.passo.notaMecanica)}</p>
            <p class="muted num">${maosResumo}</p>
          </div>
        </li>`;
    })
    .join('');

  return `
    <div class="first-game">
      <section class="tutorial">
        <header class="section-head">
          <span class="eyebrow">Setup Físico em 5 Minutos · ${escapeHtml(deck.name)}</span>
          <h2>Da caixinha para a mesa em 5 passos.</h2>
          <p class="lede">Pegue um baralho normal de 54 cartas (ou imprima um deck na aba Imprimir) e siga esta sequência.</p>
        </header>
        <ol class="minute-list">
          ${minutos(deck)
            .map(
              (m, i) => `
              <li class="minute">
                <span class="minute-tag">Passo ${i + 1}</span>
                <h4>${m.titulo}</h4>
                <p>${m.faca}</p>
                <p class="minute-done"><strong>Pronto quando:</strong> ${m.pronto}</p>
              </li>`,
            )
            .join('')}
        </ol>
        <div class="cheat">
          <h3>Cola rápida de mesa</h3>
          <dl class="glossary">${COLA.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl>
        </div>
      </section>

      <section class="example">
        <header class="section-head">
          <span class="eyebrow">Simulação Validada no Motor</span>
          <h2>Exemplo real de combate PvPvE (Mara vs. Kael)</h2>
          <p class="lede">Veja na prática como dano, bloqueio tático, recrutamento com ♥ Copas, ataque direto no rival e ativação de Aliado funcionam em sequência.</p>
        </header>
        <ul class="msgs">${passosHtml}</ul>
        <div class="example-end">
          <strong>Status final da demonstração:</strong>
          <code class="status-code">${escapeHtml(encenado.statusFinal)}</code>
          <button type="button" class="btn-primary" data-goto-tab="playtest">Abrir Mesa Interativa</button>
        </div>
      </section>
    </div>
  `;
}
