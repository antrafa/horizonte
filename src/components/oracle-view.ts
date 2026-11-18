import { CLASSES, FUNCAO_DO_NAIPE, NAIPES, REGRA, REGRA_CHEFE, SIMBOLO, STATUS_FIGURA } from '../core/partida';
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
          <td class="num">${st.trofeus} pts (+${st.saque} carta${st.saque === 1 ? '' : 's'})</td>
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
            <dt>Combos</dt><dd>1 carta · OU 2–4 cartas iguais (Par/Trinca/Quadra) · OU 1 numérica + Ás (+${REGRA.bonusAsCombo}). Qualquer naipe ataca qualquer Figura.</dd>
            <dt>Ás (A)</dt><dd>Sozinho vale ${REGRA.valorAsSolo} (de poder ou bloqueio). Em combo com outra carta adiciona +${REGRA.bonusAsCombo}.</dd>
            <dt>Abater</dt><dd>Padrão ao zerar a Vida da Figura com qualquer carta: vira Troféu (10/15/25 pts) e você compra +1 (J) ou +2 (Q/K) cartas.</dd>
            <dt>Recrutar (♥/♦)</dt><dd>Alternativa ao Abater se o golpe fatal incluir ♥, ♦ ou Coringa: vira seu Aliado (máx. ${REGRA.maxAliados}; se pegar um 3º, o mais antigo vai para Troféus pela metade dos pontos). Não dá compra de abate.</dd>
            <dt>Aliado (1 uso/turno)</dt><dd>Chega com 2 usos (J/Q) ou 3 usos (K). Por turno, você escolhe <strong>1 uso</strong>: ou ativa o poder do naipe no início do turno, ou usa o Escudo (+${REGRA.escudoAliado}) no bloqueio — nunca os dois. Sem usos, vira Troféu pela metade dos pontos (5/7/12).</dd>
            <dt>Bloqueio (Valor)</dt><dd>Cada carta descartada bloqueia pelo <strong>valor numérico dela</strong> (2–10 = número · A=${REGRA.valorAsSolo} · ★=${REGRA.valorEstrela} · 💀=${REGRA.valorCaveira} — não 1 ponto por carta). Pode bloquear até com a mão toda (exceto chefe Portas Seladas), mas cuidado: a reposição vem depois e dá só +${REGRA.compraFimTurno} carta!</dd>
            <dt>Quando comprar</dt><dd>Início: ${REGRA.maoInicial} cartas · Fim de todo turno (Passo 4): <strong>+${REGRA.compraFimTurno} carta</strong> (não volta a 5) · Bônus na hora: ♦ (+1, ou +2 se base ≥ 7; +1 se Engenheiro), ★ (+2), Aliado ♦ (+1/+2/+3) ou Abater Figura (+1/+2).</dd>
            <dt>Regra do Chefe</dt><dd>Vale <strong>só para a 12ª e última Figura</strong> (o último Rei, no fundo da 3ª onda), somando ao traço do naipe dele. Em ${escapeHtml(deck.name)}: <strong>${escapeHtml(REGRA_CHEFE[deck.chefe.regra].nome)}</strong> — ${escapeHtml(REGRA_CHEFE[deck.chefe.regra].descricao)}</dd>
          </dl>

          <h3 class="spaced">Bônus por Naipe nas Figuras (Ameaça vs. Aliado)</h3>
          <table class="data-table">
            <thead>
              <tr><th>Naipe</th><th>Como Ameaça (Traço J · Q · K)</th><th>Como Aliado (1 uso · J · Q · K)</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" class="suit-spades big-suit">♠</th><td><strong>Feroz:</strong> +1 · +2 · +3 Atq (bate 5 · 8 · 11)</td><td>Causa 2 · 4 · 6 de dano (Ameaça ou rival PvP)</td></tr>
              <tr><th scope="row" class="suit-hearts big-suit">♥</th><td><strong>Regenera:</strong> cura +2 · +3 · +4 PV no fim do turno</td><td>Cura 2 · 4 · 6 PV (no Coop, quem tem menos PV)</td></tr>
              <tr><th scope="row" class="suit-diamonds big-suit">♦</th><td><strong>Blindada:</strong> sofre −1 · −2 · −3 dano por golpe</td><td>Compra 1 · 2 · 3 cartas extras</td></tr>
              <tr><th scope="row" class="suit-clubs big-suit">♣</th><td><strong>Imune:</strong> nada reduz o ataque dela (♣/★)</td><td>Ameaça perde 2 · 4 · 6 de ataque no turno</td></tr>
            </tbody>
          </table>

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
