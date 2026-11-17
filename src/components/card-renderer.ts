import {
  type CartaAcao,
  ehCoringa,
  type FiguraHorizonte,
  FUNCAO_DO_NAIPE,
  type Naipe,
  type PostoFigura,
  REGRA,
  STATUS_FIGURA,
  TRACO_AMEACA,
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

const NOME_NAIPE: Record<Naipe, string> = {
  spades: 'Espadas',
  hearts: 'Copas',
  diamonds: 'Ouros',
  clubs: 'Paus',
};

function plural(qtd: number, singular: string, pluralForm: string): string {
  return `${qtd} ${qtd === 1 ? singular : pluralForm}`;
}

/** O que 1 uso do Aliado faz, com o número já calculado para o posto. */
function efeitoDoUsoDoAliado(posto: PostoFigura, naipe: Naipe): string {
  const st = STATUS_FIGURA[posto];
  switch (naipe) {
    case 'spades':
      return `causa ${st.bonusAliado} de dano na Ameaça ou num rival`;
    case 'clubs':
      return `a Ameaça perde ${st.bonusAliado} de ataque neste turno`;
    case 'diamonds': {
      const qtd = posto === 'J' ? 1 : posto === 'Q' ? 2 : 3;
      return `compre ${plural(qtd, 'carta', 'cartas')}`;
    }
    case 'hearts':
      return `cure ${st.bonusAliado} PV`;
  }
}

/** O que a carta faz ao atacar, com os números já calculados para ela jogada sozinha. */
function efeitoDeAtaque(naipe: Naipe, base: number): { rotulo: string; texto: string } {
  const metade = Math.ceil(base / 2);
  const recruta = 'Se este golpe derrotar a Ameaça, você pode recrutá-la como Aliado.';
  switch (naipe) {
    case 'spades':
      return {
        rotulo: '♠ Ataque · dano extra',
        texto: `Causa ${base + REGRA.bonusEspadas} de dano (${base} + ${REGRA.bonusEspadas} de bônus de ♠; o bônus conta 1 vez por jogada).`,
      };
    case 'hearts':
      return {
        rotulo: '♥ Ataque · cura e recruta',
        texto: `Causa ${base} de dano e você cura ${metade} PV (metade do valor jogado). ${recruta}`,
      };
    case 'diamonds': {
      const compra = base >= 7 ? 'compra 2 cartas' : 'compra 1 carta (2 se o valor jogado for 7 ou mais)';
      return {
        rotulo: '♦ Ataque · compra e recruta',
        texto: `Causa ${base} de dano e você ${compra}. ${recruta}`,
      };
    }
    case 'clubs': {
      const pvp =
        base >= REGRA.minGolpeDescartePvp
          ? 'No PvP, você também puxa às cegas 1 carta da mão do rival e a descarta.'
          : `No PvP, se a jogada causar ${REGRA.minGolpeDescartePvp}+ de dano, puxe às cegas 1 carta da mão do rival e descarte-a.`;
      return {
        rotulo: '♣ Ataque · enfraquece a Ameaça',
        texto: `Causa ${base} de dano e a Ameaça perde ${metade} de ataque neste turno (metade do valor jogado). ${pvp}`,
      };
    }
  }
}

export function regraDaCarta(card: GameCard): RegraDaCarta {
  if (isFigure(card) && card.suit !== 'joker') {
    const posto = card.rank as PostoFigura;
    const naipe = card.suit as Naipe;
    const st = STATUS_FIGURA[posto];
    return {
      tipo: `${st.rotulo} · Ameaça de ${NOME_NAIPE[naipe]}`,
      numeros: [
        { rotulo: 'Vida', valor: String(st.vida) },
        { rotulo: 'Ataque', valor: String(st.ataque + (naipe === 'spades' ? st.ferocidade : 0)) },
        { rotulo: 'Pontos', valor: String(st.trofeus) },
      ],
      blocos: [
        {
          rotulo: `Traço · ${TRACO_AMEACA[naipe].nome}`,
          texto: TRACO_AMEACA[naipe].descricao(posto),
        },
        {
          rotulo: 'Abater · golpe final com qualquer carta',
          texto: `Ela vira seu Troféu (${st.trofeus} pts) e você compra ${plural(st.saque, 'carta', 'cartas')}.`,
        },
        {
          rotulo: 'Recrutar · golpe final com ♥, ♦ ou Coringa',
          texto: `Em vez de Troféu, ela vira seu Aliado com ${st.cargas} usos. Na sua vez (1 uso de Aliado por turno, Escudo incluído), gaste 1 uso: ${efeitoDoUsoDoAliado(posto, naipe)}. Na defesa, 1 uso bloqueia ${REGRA.escudoAliado}.`,
        },
      ],
    };
  }

  if (card.kind === 'joker') {
    const estrela = card.rank === 'JOKER_LIGHT';
    const valor = estrela ? REGRA.valorEstrela : REGRA.valorCaveira;
    return {
      tipo: estrela ? 'Coringa ★ · Virada Tática' : 'Coringa 💀 · Impacto Crítico',
      numeros: [
        { rotulo: 'Dano', valor: String(valor) },
        { rotulo: 'Bloqueio', valor: String(valor) },
      ],
      blocos: [
        {
          rotulo: 'Ataque',
          texto: estrela
            ? `Causa ${valor} de dano, você cura 4 PV, compra 2 cartas e a Ameaça perde 3 de ataque neste turno.`
            : `Causa ${valor} de dano, mas você perde ${REGRA.recuoCaveira} PV.`,
        },
        {
          rotulo: 'Regras do Coringa',
          texto: `Jogue sempre sozinho, sem combo. Se este golpe derrotar a Ameaça, você pode recrutá-la como Aliado. Na defesa, bloqueia ${valor}.`,
        },
      ],
    };
  }

  const carta = cartaAcaoDoMotor(card);
  const naipe = card.suit as Naipe;
  const fn = FUNCAO_DO_NAIPE[naipe];
  const valor = carta ? valorBloqueioCarta(carta) : 0;
  const ehAs = card.rank === 'A';

  return {
    tipo: `Ação · ${fn.pilar} · Valor ${valor}`,
    blocos: [
      efeitoDeAtaque(naipe, valor),
      {
        rotulo: ehAs ? 'Ás · Combo de Comando' : 'Defesa e Combo',
        texto: ehAs
          ? `Sozinho vale ${REGRA.valorAsSolo}. Jogado com 1 carta numérica, soma +${REGRA.bonusAsCombo} a ela (ex.: 7 + Ás = 11). Na defesa, bloqueia ${valor}.`
          : `Na defesa, descarte para bloquear ${valor} de dano. No ataque, junte 2–4 cartas de valor ${card.rank} (soma tudo) ou 1 Ás (+${REGRA.bonusAsCombo}).`,
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
        <p><strong>Solo & Cooperativo:</strong> entra no centro da mesa como inimigo do Horizonte. Quando o seu golpe zera a Vida dela, você a Abate (com qualquer carta): vira Troféu e você compra cartas. Se esse golpe final tiver ♥, ♦ ou Coringa, você pode Recrutá-la: ela entra como Aliado no seu lado da mesa!</p>
        <p><strong>Competitivo PvP:</strong> além de valer pontos de Domínio no final, quando recrutada gasta seus usos para ajudar você (Aliados de ♠ podem atirar direto no oponente).</p>
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
