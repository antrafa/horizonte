import { CLASSES, FUNCAO_DO_NAIPE, NAIPES, REGRA, SIMBOLO, STATUS_FIGURA } from '../core/partida';
import type { ThemeDeck } from '../types/card';
import { escapeHtml, isFigure } from './card-renderer';

const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const POSTOS = ['J', 'Q', 'K'] as const;

export function renderOracleGuideHtml(deck: ThemeDeck): string {
  const figurasRows = NAIPES.flatMap((naipe) =>
    POSTOS.map((posto) => {
      const card = deck.cards.find((c) => c.suit === naipe && c.rank === posto);
      if (!card) return '';
      const st = STATUS_FIGURA[posto];
      return `
        <tr>
          <th scope="row" class="num"><button type="button" class="btn-ghost btn-sm" data-zoom-card-id="${escapeHtml(card.id)}">${escapeHtml(card.playingCardCode)}</button></th>
          <td><strong>${escapeHtml(card.title)}</strong><br /><span class="muted">${escapeHtml(card.artSubtitle)}</span></td>
          <td class="num">${st.vida} PV / ${st.ataque} Atq</td>
          <td class="num">${st.trofeus} pts (Saque +${st.saque})</td>
          <td>${escapeHtml(card.figureSpecialOrTaboo ?? FUNCAO_DO_NAIPE[naipe].papelAliado)}</td>
        </tr>`;
    }),
  ).join('');

  const acoesPorNaipe = NAIPES.map((naipe) => {
    const cartas = VALORES.map((rank) => deck.cards.find((c) => c.kind === 'journey' && c.suit === naipe && c.rank === rank))
      .filter((c) => c !== undefined)
      .map(
        (c) => `
          <li>
            <button type="button" class="threat-row" data-zoom-card-id="${escapeHtml(c.id)}">
              <span class="num threat-row-code">${escapeHtml(c.playingCardCode)}</span>
              <span><strong>${escapeHtml(c.title)}</strong> <span class="muted">· ${escapeHtml(c.artSubtitle)}</span><br />
                <span class="threat-row-story">${escapeHtml(c.topWatcherEvent ?? '')}</span><br />
                <span class="muted">${escapeHtml(c.bottomEchoPrompt ?? '')}</span></span>
            </button>
          </li>`,
      )
      .join('');
    return `
      <details class="suit-group">
        <summary>
          <span class="suit-${naipe} big-suit">${SIMBOLO[naipe]}</span>
          <span><strong>${FUNCAO_DO_NAIPE[naipe].pilar}</strong> <span class="muted">· ${escapeHtml(deck.suits[naipe].vocationName)}</span></span>
          <span class="muted count">10 cartas</span>
        </summary>
        <ul class="threat-list">${cartas}</ul>
      </details>`;
  }).join('');

  const coringas = deck.cards.filter((c) => c.kind === 'joker');

  return `
    <div class="reference">
      <header class="section-head">
        <span class="eyebrow">Compêndio / Livreto Guia · ${escapeHtml(deck.name)}</span>
        <h2>Guia de consulta para jogar com baralho comum</h2>
        <p class="lede">Deixe esta página aberta no celular ao jogar na mesa física com um baralho normal de 54 cartas: todas as 12 Figuras (J, Q, K), os 4 Naipes e as condições de vitória nos 3 modos.</p>
      </header>

      <div class="ref-grid">
        <section class="ref-block">
          <h3>Regras de Bolso</h3>
          <dl class="glossary">
            <dt>Setup</dt><dd>12 Figuras no Horizonte (4 J em cima, 4 Q no meio, 4 K embaixo). 42 cartas no Deck de Ação.</dd>
            <dt>Mão & Vida</dt><dd>${REGRA.vidaInicial} PV iniciais · compra ${REGRA.maoInicial} cartas (máximo ${REGRA.maoMaxima}).</dd>
            <dt>Combos</dt><dd>1 carta · OU 2–4 cartas iguais (Par/Trinca/Quadra) · OU 1 numérica + Ás (+${REGRA.bonusAsCombo}).</dd>
            <dt>Ás (A)</dt><dd>Sozinho vale ${REGRA.valorAsSolo} (de poder ou bloqueio). Em combo com outra carta adiciona +${REGRA.bonusAsCombo}.</dd>
            <dt>Recrutar (♥/♦)</dt><dd>Se o golpe final zerar a Ameaça e incluir ♥, ♦ ou Coringa, ela entra como Aliado (máx. ${REGRA.maxAliados}).</dd>
            <dt>Bloqueio</dt><dd>Descarte cartas para abater o valor delas do dano recebido, ou gaste 1 carga de Aliado para bloquear ${REGRA.escudoAliado}.</dd>
          </dl>

          <h3 class="spaced">Especializações de Naipe</h3>
          <table class="data-table">
            <tbody>
              ${NAIPES.map((n) => `<tr><th scope="row" class="suit-${n} big-suit">${SIMBOLO[n]}</th><td><strong>${CLASSES[n].nome}</strong></td><td>${CLASSES[n].descricao}</td></tr>`).join('')}
            </tbody>
          </table>

          <h3 class="spaced">Coringas no Tema</h3>
          <dl class="glossary">
            ${coringas
              .map(
                (j) =>
                  `<dt>${escapeHtml(j.playingCardCode)}</dt><dd><strong>${escapeHtml(j.title)}:</strong> ${escapeHtml(j.bottomEchoPrompt ?? j.topWatcherEvent ?? '')}</dd>`,
              )
              .join('')}
          </dl>
        </section>

        <section class="ref-block">
          <h3>As 12 Figuras do Horizonte (${escapeHtml(deck.name)})</h3>
          <p class="muted">Clique no código (ex.: K♠) para abrir a carta completa com arte e detalhes.</p>
          <table class="data-table">
            <thead>
              <tr><th>Carta</th><th>Inimigo / Facção</th><th class="num">Ameaça</th><th class="num">Abater</th><th>Se Recrutado (♥/♦)</th></tr>
            </thead>
            <tbody>${figurasRows}</tbody>
          </table>
        </section>
      </div>

      <section class="ref-block">
        <h3>Catálogo das 40 Cartas de Ação (${deck.cards.filter((c) => !isFigure(c) && c.kind !== 'joker').length} cartas)</h3>
        <p class="muted">Todas seguem a regra fixa do naipe + valor numérico. Abra um naipe para ver os nomes temáticos.</p>
        ${acoesPorNaipe}
      </section>
    </div>
  `;
}
