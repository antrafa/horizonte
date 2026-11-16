import {
  type CartaAcao,
  ehCoringa,
  type FiguraHorizonte,
  FUNCAO_DO_NAIPE,
  type Naipe,
  type PostoFigura,
  REGRA,
  SIMBOLO,
  STATUS_FIGURA,
  valorBloqueioCarta,
} from '../core/partida';
import type { GameCard } from '../types/card';
import { renderThematicCardArtSvg } from './card-art';

export interface RenderCardOptions {
  interactive?: boolean;
  tapped?: boolean;
  selected?: boolean;
  qr?: string;
  artOnly?: boolean;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isFigure(card: GameCard): boolean {
  return card.kind === 'archetype_king' || card.kind === 'trump_queen' || card.kind === 'scar_jack';
}

export function cartaAcaoDoMotor(card: GameCard): CartaAcao | null {
  if (card.kind === 'joker') {
    return { coringa: card.rank === 'JOKER_LIGHT' ? 'estrela' : 'caveira' };
  }
  if (card.kind !== 'journey' || card.suit === 'joker') return null;
  const valor = card.rank === 'A' ? 1 : Number(card.rank);
  return Number.isFinite(valor) ? { valor, naipe: card.suit } : null;
}

export function cartaDoTemaPorAcao(cards: GameCard[], carta: CartaAcao): GameCard | undefined {
  if (ehCoringa(carta)) {
    const rank = carta.coringa === 'estrela' ? 'JOKER_LIGHT' : 'JOKER_DARK';
    return cards.find((c) => c.kind === 'joker' && c.rank === rank);
  }
  const rank = carta.valor === 1 ? 'A' : String(carta.valor);
  return cards.find((c) => c.kind === 'journey' && c.suit === carta.naipe && c.rank === rank);
}

export function cartaDoTemaPorFigura(cards: GameCard[], figura: FiguraHorizonte): GameCard | undefined {
  return cards.find((c) => c.suit === figura.naipe && c.rank === figura.posto);
}

interface RegraDaCarta {
  tipo: string;
  blocos: Array<{ rotulo: string; texto: string }>;
  numeros?: Array<{ rotulo: string; valor: string }>;
}

function efeitoAliadoTexto(posto: PostoFigura, naipe: Naipe): string {
  const st = STATUS_FIGURA[posto];
  switch (naipe) {
    case 'spades':
      return `+${st.bonusAliado} de dano direto na Ameaça ou rival (${st.cargas} cargas).`;
    case 'clubs':
      return `-${st.bonusAliado} no ataque da Ameaça neste turno (${st.cargas} cargas).`;
    case 'diamonds': {
      const qtd = posto === 'J' ? 1 : posto === 'Q' ? 2 : 3;
      return `Compra +${qtd} carta(s) do baralho (${st.cargas} cargas).`;
    }
    case 'hearts':
      return `Cura +${st.bonusAliado} PV imediatamente (${st.cargas} cargas).`;
  }
}

export function regraDaCarta(card: GameCard): RegraDaCarta {
  if (isFigure(card) && card.suit !== 'joker') {
    const posto = card.rank as PostoFigura;
    const naipe = card.suit as Naipe;
    const st = STATUS_FIGURA[posto];
    const fn = FUNCAO_DO_NAIPE[naipe];
    return {
      tipo: `${st.rotulo} · ${fn.pilar}`,
      numeros: [
        { rotulo: 'Vida', valor: String(st.vida) },
        { rotulo: 'Ataque', valor: String(st.ataque) },
        { rotulo: 'Troféus', valor: String(st.trofeus) },
      ],
      blocos: [
        {
          rotulo: `Abater (♠/♣) · Saque +${st.saque}`,
          texto: `Dá ${st.trofeus} pts de Troféu e compra +${st.saque} carta(s) ao zerar a Vida.`,
        },
        {
          rotulo: `Recrutar (♥/♦) · ${st.cargas} cargas`,
          texto: efeitoAliadoTexto(posto, naipe),
        },
      ],
    };
  }

  if (card.kind === 'joker') {
    const estrela = card.rank === 'JOKER_LIGHT';
    return {
      tipo: estrela ? 'Coringa · ★ Virada Tática' : 'Coringa · 💀 Impacto Crítico',
      numeros: [
        { rotulo: 'Força', valor: String(estrela ? REGRA.valorEstrela : REGRA.valorCaveira) },
        { rotulo: 'Bloqueio', valor: String(estrela ? REGRA.valorEstrela : REGRA.valorCaveira) },
        { rotulo: 'Cor', valor: '♠♥' },
      ],
      blocos: [
        {
          rotulo: 'Efeito imediato',
          texto: estrela
            ? `Cura +4 PV, compra +2 cartas e reduz o ataque da Ameaça em 3.`
            : `Explode com força ${REGRA.valorCaveira}, mas causa ${REGRA.recuoCaveira} PV de recuo em quem jogou.`,
        },
        {
          rotulo: 'Versatilidade total',
          texto: 'Habilita tanto Abater quanto Recrutar/Dominar ao finalizar uma Ameaça.',
        },
      ],
    };
  }

  const carta = cartaAcaoDoMotor(card);
  const naipe = card.suit as Naipe;
  const fn = FUNCAO_DO_NAIPE[naipe];
  const forca = carta ? valorBloqueioCarta(carta) : 0;
  const ehAs = card.rank === 'A';
  const corRotulo = fn.corTatica === 'preta' ? 'Abater' : 'Recrutar';

  return {
    tipo: `Ação · ${fn.pilar} · Força ${forca}${ehAs ? ` (+${REGRA.bonusAsCombo} combo)` : ''}`,
    blocos: [
      {
        rotulo: `${SIMBOLO[naipe]} ${fn.pilar} · ${corRotulo}`,
        texto: fn.efeito,
      },
      {
        rotulo: ehAs ? 'Combo de Comando' : 'Bloqueio & Par',
        texto: ehAs
          ? `Sozinho vale ${REGRA.valorAsSolo}. Com 1 carta numérica, soma +${REGRA.bonusAsCombo} de poder.`
          : `Bloqueia ${forca} de dano na defesa. Combine 2–4 cartas de valor ${card.rank} no ataque.`,
      },
    ],
  };
}

export function sanitizeArtUrl(url?: string): string {
  const trimmed = (url ?? '').trim();
  if (!trimmed) return '';
  const normalized = trimmed.startsWith('/cards/') ? `.${trimmed}` : trimmed;
  if (/^(https?:\/\/|\/|\.\.?\/|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,)/i.test(normalized)) {
    return escapeHtml(normalized);
  }
  return '';
}

function buildSeal(qr?: string): string {
  if (!qr) return '';
  return `<span class="mtg-art-qr" aria-label="Código da carta">${qr}</span>`;
}

function buildArtFrame(card: GameCard): string {
  const figure = isFigure(card);
  const safeUrl = sanitizeArtUrl(card.artUrl);
  const modifier = figure ? 'mtg-art-frame--figure' : 'mtg-art-frame--scene mtg-art-frame--conceptual';
  if (safeUrl) {
    return `<div class="mtg-art-frame ${modifier}"><img src="${safeUrl}" alt="${escapeHtml(card.title)}" class="mtg-art-img" loading="lazy" /></div>`;
  }
  return `
    <div class="mtg-art-frame ${modifier} mtg-art-frame--engraved" aria-hidden="true">
      ${renderThematicCardArtSvg(card)}
    </div>`;
}

function buildArtSection(card: GameCard, tipo: string): string {
  const quadro = buildArtFrame(card);
  const subtitulo = card.artSubtitle
    ? `<span class="mtg-art-subtitle">${escapeHtml(card.artSubtitle)}</span>`
    : '';
  return `
    ${quadro}
    <div class="mtg-art-box mtg-typebar">
      <div class="mtg-typeline">${escapeHtml(tipo)}</div>
      ${subtitulo}
    </div>`;
}

function numerosHtml(regra: RegraDaCarta): string {
  if (!regra.numeros) return '';
  return `
    <dl class="mtg-stats">
      ${regra.numeros.map((n) => `<div><dt>${escapeHtml(n.rotulo)}</dt><dd>${escapeHtml(n.valor)}</dd></div>`).join('')}
    </dl>
  `;
}

export function renderMagicCardHtml(card: GameCard, options: RenderCardOptions = {}): string {
  const safeUrl = sanitizeArtUrl(card.artUrl);
  const classes = [
    'mtg-card',
    `suit-${card.suit}`,
    `kind-${card.kind}`,
    `theme-${card.themeId}`,
    safeUrl ? 'has-art' : '',
    options.artOnly ? 'is-art-only' : '',
    options.interactive ? 'is-interactive' : '',
    options.tapped ? 'is-tapped' : '',
    options.selected ? 'is-selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const regra = regraDaCarta(card);
  const narracao =
    !isFigure(card) && card.topWatcherEvent
      ? `<p class="mtg-narration"><strong>Cenário</strong> ${escapeHtml(card.topWatcherEvent)}</p>`
      : '';
  const blocos = regra.blocos
    .map(
      (b) => `
        <div class="mtg-rule">
          <div class="mtg-rule-label">${escapeHtml(b.rotulo)}</div>
          <p>${escapeHtml(b.texto)}</p>
        </div>`,
    )
    .join('');

  return `
    <article class="${classes}" data-card-id="${escapeHtml(card.id)}" title="Clique para ampliar">
      <span class="mtg-corner-badge mtg-corner-badge--tl" aria-hidden="true">${escapeHtml(card.playingCardCode)}</span>
      <span class="mtg-corner-badge mtg-corner-badge--br" aria-hidden="true">${escapeHtml(card.playingCardCode)}${options.qr ? `<span class="mtg-corner-qr">${options.qr}</span>` : ''}</span>
      <header class="mtg-titlebar">
        <span class="mtg-mana-pip">${escapeHtml(card.playingCardCode)}</span>
        <div class="mtg-heading">
          <span class="mtg-card-title">${escapeHtml(card.title)}</span>
        </div>
        ${buildSeal(options.qr)}
      </header>
      ${buildArtSection(card, regra.tipo)}
      <div class="mtg-textbox">
        ${numerosHtml(regra)}
        ${narracao}
        <div class="mtg-rules">${blocos}</div>
        ${card.kind === 'journey' ? '' : `<div class="mtg-flavor">${escapeHtml(card.flavorText)}</div>`}
      </div>
      <footer class="mtg-collector-bar">
        <span>HORIZONTE</span>
        <span>${String(card.collectorNumber).padStart(2, '0')}/54</span>
      </footer>
    </article>
  `;
}

export function renderCardModalContentHtml(card: GameCard): string {
  const regra = regraDaCarta(card);
  const figure = isFigure(card);

  const contexto = figure
    ? `
      <div class="zoom-detail-box">
        <div class="zoom-detail-head">
          <h4>Como funciona nos 3 modos</h4>
          <span class="chip">Carta de Ameaça / Aliado</span>
        </div>
        <p><strong>Solo & Cooperativo:</strong> entra no centro da mesa como inimigo do Horizonte. Se for abatida com ♠/♣, gera Troféus e Saque; se for finalizada com ♥/♦ (ou Coringa), entra como Aliado no seu lado da mesa!</p>
        <p><strong>Competitivo PvP:</strong> além de valer pontos de Domínio no final, quando recrutada dispara suas cargas de apoio contra o Horizonte ou direto no seu oponente.</p>
      </div>`
    : `
      <div class="zoom-detail-box">
        <div class="zoom-detail-head">
          <h4>Ambientação & Uso Tático</h4>
          <span class="chip">Deck de Ação (42 cartas)</span>
        </div>
        ${card.topWatcherEvent ? `<p>${escapeHtml(card.topWatcherEvent)}</p>` : ''}
        <p class="zoom-usage-hint muted">
          <strong>Na mesa:</strong> jogue esta carta pelo valor numérico contra o Horizonte ou contra um rival (no PvP), combine-a em Pares/Trincas ou com um Ás (+${REGRA.bonusAsCombo}), ou descarte-a durante o Bloqueio Tático para absorver dano.
        </p>
      </div>`;

  const blocos = regra.blocos
    .map((b) => `<div class="zoom-detail-box"><h4>${escapeHtml(b.rotulo)}</h4><p>${escapeHtml(b.texto)}</p></div>`)
    .join('');

  return `
    <div class="zoom-modal-inner">
      <header class="zoom-modal-header">
        <div>
          <span class="eyebrow">${escapeHtml(card.playingCardCode)} · ${escapeHtml(regra.tipo)}</span>
          <h2 id="zoom-dialog-title">${escapeHtml(card.title)}</h2>
        </div>
        <form method="dialog">
          <button type="submit" class="btn-secondary" autofocus>Fechar</button>
        </form>
      </header>
      <div class="zoom-modal-body">
        <div class="zoom-card-visual">${renderMagicCardHtml(card)}</div>
        <div class="zoom-reading-section">
          ${numerosHtml(regra)}
          ${contexto}
          ${blocos}
          <blockquote class="zoom-flavor">${escapeHtml(card.flavorText)}</blockquote>
        </div>
      </div>
    </div>
  `;
}
