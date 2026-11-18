import { CLASSES, EXPLICACAO_PONTUACAO, FUNCAO_DO_NAIPE, NAIPES, NIVEIS, REGRA, REGRA_CHEFE, SIMBOLO, STATUS_FIGURA } from '../core/partida';
import type { ThemeDeck } from '../types/card';
import { escapeHtml, renderMagicCardHtml } from './card-renderer';
import { NUANCES_DO_TEMA } from './temas-view';

const PASSOS = [
  {
    titulo: 'Separe o baralho em dois montes',
    texto: 'Tire as 12 Figuras (J, Q, K) e empilhe em 3 ondas: 4 Valetes em cima, 4 Damas no meio, 4 Reis por último. Esse é o Deck de Ameaças (O Horizonte); somente a 12ª e última Figura (o último Rei) é o chefe do tema e ganha uma regra própria. Embaralhe as 42 cartas restantes (A–10 + ★ e 💀) para o Deck de Ação.',
  },
  {
    titulo: 'Compre 5 cartas e revele o Horizonte',
    texto: `Cada jogador começa com ${REGRA.vidaInicial} Pontos de Vida (PV) no nível Veterano (${NIVEIS.recruta.vida} no Recruta, ${NIVEIS.lenda.vida} no Lenda), escolhe sua Especialização de Naipe (reforça o efeito daquele naipe ao jogar) e compra ${REGRA.maoInicial} cartas (máx. ${REGRA.maoMaxima}). Vire a primeira Figura no centro: o naipe dela define o Traço passivo como Ameaça (e, se recrutada, o poder como Aliado).`,
  },
  {
    titulo: 'Ative 1 Aliado recrutado (opcional)',
    texto: `Você pode manter até ${REGRA.maxAliados} Aliados. Antes da jogada principal, pode gastar 1 uso de 1 Aliado pelo poder do naipe dele (dano, redução de ataque, compra ou cura). É no máximo 1 uso de Aliado por turno, contando o Escudo (+${REGRA.escudoAliado}) no bloqueio.`,
  },
  {
    titulo: 'Jogue 1 carta ou um Combo',
    texto: `Jogue 1 carta, ou 2–4 cartas de mesmo valor (Par/Trinca/Quadra), ou 1 carta + 1 Ás (+${REGRA.bonusAsCombo} de Combo de Comando). Você pode atacar qualquer Figura com qualquer naipe; os naipes jogados disparam seus efeitos de dano, redução, compra imediata (♦/★) ou cura.`,
  },
  {
    titulo: 'Escolha: Abater, Recrutar ou PvP',
    texto: 'Se o golpe zerar a Vida da Figura: Abater (qualquer carta) manda para Troféus e compra +1 carta (J) ou +2 (Q/K); Recrutar (exige ♥, ♦, ★ ou 💀 no golpe final) traz como Aliado com 2 ou 3 usos, sem compra extra. No PvP, você também pode atacar direto um rival.',
  },
  {
    titulo: 'Bloqueio Tático e Reposição (+1 carta)',
    texto: `Se a Ameaça sobreviver, ela contra-ataca. Você pode descartar quantas cartas quiser (inclusive a mão toda, salvo sob Portas Seladas) e cada carta bloqueia o seu VALOR NUMÉRICO (2–10 = número, A=${REGRA.valorAsSolo}, ★=${REGRA.valorEstrela}, 💀=${REGRA.valorCaveira} — não 1 ponto por carta). Depois, no fim do turno, compra apenas ${REGRA.compraFimTurno} carta (não volta para 5): cada carta gasta no bloqueio faz falta!`,
  },
];

function renderHeroSvg(deck: ThemeDeck): string {
  return `
    <svg class="hero-svg" viewBox="0 0 560 350" fill="none" role="img" aria-label="Diagrama da Zona de Conflito de HORIZONTE">
      <rect width="560" height="350" rx="14" fill="var(--surface)" stroke="var(--line)" />
      <radialGradient id="horizonteGlow" cx="50%" cy="40%" r="55%">
        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28" />
        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
      </radialGradient>
      <rect width="560" height="350" rx="14" fill="url(#horizonteGlow)" />
      <line x1="40" y1="196" x2="520" y2="196" stroke="var(--accent)" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="5 5" />
      <text x="280" y="34" text-anchor="middle" fill="var(--accent)" font-size="11" font-weight="700" letter-spacing="2.5">ZONA DE CONFLITO · ${escapeHtml(deck.name.toUpperCase())}</text>

      <!-- Carta Central do Horizonte -->
      <rect x="215" y="54" width="130" height="172" rx="10" fill="#faf9f5" stroke="var(--accent)" stroke-width="2" />
      <rect x="221" y="60" width="118" height="160" rx="7" stroke="#d9d5cb" stroke-width="1" />
      <text x="232" y="80" fill="#18181b" font-size="15" font-weight="800">K♠</text>
      <text x="328" y="80" text-anchor="end" fill="#b45309" font-size="10" font-weight="700">HORIZONTE</text>
      <circle cx="280" cy="122" r="24" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" />
      <text x="280" y="130" text-anchor="middle" font-size="24">👑</text>
      <text x="280" y="168" text-anchor="middle" fill="#18181b" font-size="10.5" font-weight="700">VIDA 20 · ATQ 7</text>
      <rect x="234" y="180" width="92" height="18" rx="4" fill="#fee2e2" />
      <text x="280" y="192" text-anchor="middle" fill="#991b1b" font-size="9" font-weight="700">ABATER · 25 PTS</text>
      <rect x="234" y="201" width="92" height="16" rx="4" fill="#fef3c7" />
      <text x="280" y="212" text-anchor="middle" fill="#92400e" font-size="8.5" font-weight="700">♥/♦ RECRUTAR (3×)</text>

      <!-- Mão Esquerda (Abater) -->
      <rect x="44" y="218" width="84" height="110" rx="8" fill="#faf9f5" stroke="#27272a" stroke-width="1.5" transform="rotate(-7 86 273)" />
      <text x="64" y="244" fill="#18181b" font-size="14" font-weight="800" transform="rotate(-7 86 273)">8♠</text>
      <text x="86" y="280" text-anchor="middle" font-size="22" transform="rotate(-7 86 273)">♠</text>
      <text x="86" y="308" text-anchor="middle" fill="#18181b" font-size="9" font-weight="700" transform="rotate(-7 86 273)">+2 DE DANO</text>

      <!-- Mão Centro-Esquerda (Combo Ás) -->
      <rect x="122" y="224" width="84" height="110" rx="8" fill="#faf9f5" stroke="#a3201c" stroke-width="1.5" transform="rotate(3 164 279)" />
      <text x="142" y="248" fill="#a3201c" font-size="14" font-weight="800" transform="rotate(3 164 279)">A♥</text>
      <text x="164" y="284" text-anchor="middle" font-size="22" transform="rotate(3 164 279)">♥</text>
      <text x="164" y="312" text-anchor="middle" fill="#a3201c" font-size="9" font-weight="700" transform="rotate(3 164 279)">+4 COMBO · CURA</text>

      <!-- Aliado Recrutado Direita -->
      <rect x="386" y="220" width="128" height="106" rx="8" fill="var(--sunken)" stroke="var(--ok)" stroke-width="1.5" />
      <text x="450" y="242" text-anchor="middle" fill="var(--ok)" font-size="9.5" font-weight="800" letter-spacing="1">ALIADO RECRUTADO</text>
      <text x="450" y="268" text-anchor="middle" fill="var(--ink)" font-size="16" font-weight="800">Q♦ Sentinela</text>
      <text x="450" y="290" text-anchor="middle" fill="var(--ink-2)" font-size="10">Cargas: ● ● (2×)</text>
      <text x="450" y="310" text-anchor="middle" fill="var(--accent)" font-size="9.5" font-weight="700">+2 cartas por uso</text>
    </svg>
  `;
}

export function renderQuickstartGuideHtml(deck: ThemeDeck): string {
  const exemploAcao = deck.cards.find((c) => c.kind === 'journey' && c.suit === 'spades' && c.rank === '7') ?? deck.cards[12];
  const exemploFigura = deck.cards.find((c) => c.kind === 'archetype_king' && c.suit === 'spades') ?? deck.cards[0];
  const trio = ['K', 'Q', 'J'].map((rank) => deck.cards.find((c) => c.suit === 'spades' && c.rank === rank)).filter(Boolean);
  const nuance = NUANCES_DO_TEMA[deck.id] ?? NUANCES_DO_TEMA.wasteland;

  const naipes = NAIPES.map(
    (n) => `
      <tr>
        <th scope="row" class="suit-${n} big-suit">${SIMBOLO[n]}</th>
        <td><strong>${FUNCAO_DO_NAIPE[n].pilar}</strong><br /><span class="muted">${escapeHtml(deck.suits[n].vocationName)}</span></td>
        <td>${FUNCAO_DO_NAIPE[n].efeito}</td>
        <td><span class="chip">${FUNCAO_DO_NAIPE[n].corTatica === 'preta' ? 'Só Abater' : 'Abater ou Recrutar'}</span></td>
      </tr>`,
  ).join('');

  const classes = NAIPES.map(
    (n) => `
      <div class="class-row">
        <span class="class-suit suit-${n}">${SIMBOLO[n]}</span>
        <div>
          <strong>${CLASSES[n].nome}</strong> <span class="muted">· Especialização em ${SIMBOLO[n]}</span>
          <p>${CLASSES[n].descricao}</p>
        </div>
      </div>`,
  ).join('');

  return `
    <div class="guide">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">HORIZONTE · ${escapeHtml(deck.name)}</span>
          <h2>O Baralho é o Campo de Batalha.</h2>
          <p class="lede">Transforme qualquer baralho convencional de 54 cartas em um card game tático completo com <strong>Solo</strong>, <strong>Cooperativo</strong> e <strong>Competitivo PvP</strong> na mesma estrutura de regras. Abata as 12 Figuras do Horizonte, recrute inimigos para lutar ao seu lado ou atire direto no seu rival.</p>
          <div class="cta-row">
            <button type="button" class="btn-primary btn-lg" data-goto-tab="playtest">Jogar na Mesa agora</button>
            <button type="button" class="btn-secondary" data-goto-tab="exemplo">Ver turno de exemplo</button>
            <button type="button" class="btn-ghost" data-goto-tab="oracle">Compêndio de mesa</button>
          </div>
        </div>
        <figure class="hero-art">${renderHeroSvg(deck)}</figure>
      </section>

      <section class="challenge-explainer" aria-label="Os 3 modos de jogo na mesma regra">
        <header class="section-head">
          <span class="eyebrow">Sistema PvPvE Modular</span>
          <h3>Mesma regra, 3 modos de jogar na hora</h3>
          <p class="lede">Você não precisa reaprender o jogo quando muda o número de pessoas na mesa. Só escolhe o objetivo antes de embaralhar:</p>
        </header>

        <div class="challenge-grid">
          <article class="challenge-card">
            <span class="eyebrow">1. Modo Solo</span>
            <h4>Sobrevivência Roguelike</h4>
            <p>Você contra as 12 Figuras do Horizonte, começando com <strong>${REGRA.vidaInicial} PV</strong>.</p>
            <ul class="challenge-list">
              <li>Derrote os 4 Valetes, depois as 4 Damas e por fim os 4 Reis.</li>
              <li>Use <strong>♦ Ouros</strong> para ciclar a mão e <strong>♥ Copas</strong> para recrutar aliados que seguram o dano dos Reis.</li>
              <li><strong>Vitória:</strong> zerar o Deck de Ameaças vivo.</li>
            </ul>
          </article>

          <article class="challenge-card">
            <span class="eyebrow">2. Modo Cooperativo (2–4 pessoas)</span>
            <h4>Aliados contra o Mundo</h4>
            <p>Todos enfrentam juntos a mesma Figura revelada no centro da mesa, alternando turnos.</p>
            <ul class="challenge-list">
              <li>Cartas de <strong>♥ Copas</strong> curam automaticamente quem estiver mais ferido na equipe.</li>
              <li>Cartas de <strong>♣ Paus</strong> reduzem o ataque da Ameaça no turno e abrem janela para o próximo aliado.</li>
              <li><strong>Vitória:</strong> limpar as 12 Figuras com todo o grupo vivo (se um cair, todos perdem).</li>
            </ul>
          </article>

          <article class="challenge-card">
            <span class="eyebrow">3. Competitivo PvP (2–4 pessoas)</span>
            <h4>Rivalidade na Zona de Conflito</h4>
            <p>As Figuras ainda atacam quem não as derrotou, mas você pode atirar direto nos outros jogadores!</p>
            <ul class="challenge-list">
              <li>Recrute Figuras (<strong>♥/♦</strong>) para ganhar cargas que disparam contra o rival ou protegem você.</li>
              <li>Atacar um rival deixa a Ameaça central viva para contra-atacar você no fim do turno!</li>
              <li><strong>Vitória:</strong> ser o último sobrevivente <strong>OU</strong> somar mais pontos de Domínio (Troféus + PV + Aliados) ao limpar o Horizonte.</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="scene">
        <div class="scene-copy">
          <span class="eyebrow">Setup & Combate · ${escapeHtml(deck.name)}</span>
          <h3>Abater (qualquer carta) vs. Recrutar (♥/♦)</h3>
          <p>${escapeHtml(nuance.oQueEOHorizonte)}</p>
          <p><strong>Abater (qualquer carta):</strong> é o resultado padrão. Quando o seu golpe zera a Vida da Figura, ela vai para o seu monte de Troféus (10/15/25 pts) e você compra <strong>+1 carta (Valete) ou +2 (Dama/Rei)</strong> na hora. Você pode atacar e abater qualquer Figura com qualquer naipe.</p>
          <p><strong>Recrutar (precisa de ♥, ♦ ou Coringa no golpe final):</strong> em vez de Abater, traz a Figura para o seu lado (máx. <strong>${REGRA.maxAliados} Aliados</strong>) com 2 ou 3 <strong>usos</strong>, sem compra de abate. No seu turno você tem <strong>1 único uso de Aliado</strong>: ou ativa o poder do naipe no início, ou usa o <strong>Escudo (+${REGRA.escudoAliado})</strong> no bloqueio.</p>
          <p class="muted"><strong>Bloqueio & Compra de Cartas:</strong> cada carta descartada bloqueia pelo <strong>valor numérico dela</strong> (2–10 = número · A=${REGRA.valorAsSolo} · ★=${REGRA.valorEstrela} · 💀=${REGRA.valorCaveira} — não 1 ponto por carta). Você pode bloquear com quantas cartas quiser (até a mão toda, salvo sob Portas Seladas), mas no fim do turno você compra <strong>apenas +${REGRA.compraFimTurno} carta</strong> (não volta a 5; máx. ${REGRA.maoMaxima}). Compras extras acontecem com <strong>♦ Ouros</strong> (+1/+2), <strong>★</strong> (+2), Aliado de <strong>♦</strong> (+1/+2/+3) ou ao <strong>Abater</strong>.</p>
        </div>
        <div class="scene-card">${renderMagicCardHtml(exemploFigura, { interactive: true })}</div>
      </section>

      <section class="steps">
        <header class="section-head">
          <span class="eyebrow">Fluxo de Turno</span>
          <h3>Como jogar em 6 passos</h3>
          <p class="lede">Turnos rápidos e diretos: ative um aliado, faça 1 jogada de cartas (simples ou combo), resolva o alvo e defenda o contra-ataque.</p>
        </header>
        <ol class="step-list">
          ${PASSOS.map((p) => `<li><h4>${p.titulo}</h4><p>${p.texto}</p></li>`).join('')}
        </ol>
        <table class="data-table">
          <thead><tr><th>Naipe</th><th>Pilar</th><th>Efeito na jogada</th><th>Finalização</th></tr></thead>
          <tbody>${naipes}</tbody>
        </table>
      </section>

      <section class="trio">
        <header class="section-head">
          <span class="eyebrow">Escala de Poder & Combos</span>
          <h3>Valetes, Damas e Reis (+ Carta de Ação)</h3>
          <p class="lede">Valetes têm ${STATUS_FIGURA.J.vida} PV / ${STATUS_FIGURA.J.ataque} Atq; Damas têm ${STATUS_FIGURA.Q.vida} PV / ${STATUS_FIGURA.Q.ataque} Atq; Reis têm ${STATUS_FIGURA.K.vida} PV / ${STATUS_FIGURA.K.ataque} Atq. Combine 2–4 cartas iguais (ex.: 6♠+6♥) ou qualquer carta com um Ás (+${REGRA.bonusAsCombo}) para explodir o dano!</p>
          <p class="lede"><strong>Como funciona o naipe nas Figuras (J · Q · K):</strong> enquanto é <strong>Ameaça</strong> no centro, o naipe dá um <strong>Traço passivo</strong> que cresce com o posto: <strong>♠ Feroz</strong> (+1/+2/+3 de Ataque já somado → bate 5/8/11) · <strong>♥ Regenera</strong> (+2/+3/+4 PV no fim do turno se sobreviver) · <strong>♦ Blindada</strong> (−1/−2/−3 de dano em todo golpe recebido) · <strong>♣ Imune a armadilhas</strong> (ignora redução de ♣, ★ e Aliado ♣). Se você <strong>Recrutar</strong> a Figura, o mesmo naipe vira o poder ativo do Aliado (♠ 2/4/6 dano · ♣ −2/−4/−6 Atq · ♦ +1/+2/+3 cartas · ♥ +2/+4/+6 PV).</p>
          <p class="lede"><strong>Chefe final de ${escapeHtml(deck.name)} (somente a 12ª e última Figura) · ${escapeHtml(REGRA_CHEFE[deck.chefe.regra].nome)}:</strong> ${escapeHtml(REGRA_CHEFE[deck.chefe.regra].descricao)} Os 3 Reis anteriores não têm regra de chefe; cada tema termina com um chefe diferente.</p>
          <p class="lede">${escapeHtml(EXPLICACAO_PONTUACAO)} Bata o seu recorde em cada nível.</p>
        </header>
        <div class="trio-cards">${[...trio, exemploAcao].map((c) => (c ? renderMagicCardHtml(c, { interactive: true }) : '')).join('')}</div>
        <div class="class-list">${classes}</div>
      </section>
    </div>
  `;
}
