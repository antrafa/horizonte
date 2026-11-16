import { FUNCAO_DO_NAIPE } from '../core/partida';
import type { GameCard, ThemeDeck } from '../types/card';
import { gerarPromptsNanoBanana } from './card-art';
import { escapeHtml, isFigure, renderMagicCardHtml } from './card-renderer';

export function filterStudioCards(deck: ThemeDeck, suitFilter: string): GameCard[] {
  if (!suitFilter || suitFilter === 'all') return deck.cards;
  if (suitFilter === 'figures') return deck.cards.filter(isFigure);
  return deck.cards.filter((c) => c.suit === suitFilter);
}

export function renderStudioGalleryHtml(
  deck: ThemeDeck,
  selectedCard: GameCard,
  suitFilter: string = 'all',
  artOnly: boolean = false,
): string {
  const filteredCards = filterStudioCards(deck, suitFilter);
  const figure = isFigure(selectedCard);

  const filterPills: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'Todas (54)' },
    { id: 'figures', label: 'Horizonte J/Q/K (12)' },
    { id: 'spades', label: `♠ ${FUNCAO_DO_NAIPE.spades.pilar.split(' ')[0]}` },
    { id: 'hearts', label: `♥ ${FUNCAO_DO_NAIPE.hearts.pilar.split(' ')[0]}` },
    { id: 'diamonds', label: `♦ ${FUNCAO_DO_NAIPE.diamonds.pilar.split(' ')[0]}` },
    { id: 'clubs', label: `♣ ${FUNCAO_DO_NAIPE.clubs.pilar.split(' ')[0]}` },
    { id: 'joker', label: '★ 💀 Coringas' },
  ];

  const filterHtml = filterPills
    .map(
      (pill) => `
      <button
        type="button"
        class="filter-pill ${suitFilter === pill.id ? 'is-active' : ''}"
        data-suit-filter="${escapeHtml(pill.id)}"
      >
        ${escapeHtml(pill.label)}
      </button>
    `,
    )
    .join('');

  const cardsGridHtml = filteredCards
    .map((card) =>
      renderMagicCardHtml(card, {
        interactive: true,
        selected: card.id === selectedCard.id,
        artOnly,
      }),
    )
    .join('');

  const dynamicFieldsHtml = figure
    ? `<p class="muted">Os atributos numéricos das Figuras (Vida 10/14/20, Ataque 3/5/7) são universais em todos os temas; aqui você edita nome, ícone, arte e ambientação.</p>`
    : `
      <div class="editor-field">
        <label for="edit-topWatcherEvent">Ambientação / Cenário da carta</label>
        <textarea id="edit-topWatcherEvent" name="topWatcherEvent" rows="3">${escapeHtml(selectedCard.topWatcherEvent ?? '')}</textarea>
      </div>
      <div class="editor-field">
        <label for="edit-bottomEchoPrompt">Nota Tática</label>
        <textarea id="edit-bottomEchoPrompt" name="bottomEchoPrompt" rows="2">${escapeHtml(selectedCard.bottomEchoPrompt ?? '')}</textarea>
      </div>
    `;

  const nano = gerarPromptsNanoBanana(deck, selectedCard);

  return `
    <div class="studio-layout">
      <div class="studio-gallery-column">
        <section class="theme-banner">
          <div>
            <span class="eyebrow">${escapeHtml(deck.subtitle)}</span>
            <h2>${escapeHtml(deck.name)}</h2>
            <p class="lede">${escapeHtml(deck.tagline)} Clique numa carta para editar; clique de novo para ampliar.</p>
          </div>
          <div class="deck-io-actions">
            <button type="button" id="btn-toggle-art-only" class="btn-secondary ${artOnly ? 'is-active' : ''}" aria-pressed="${artOnly}">
              ${artOnly ? 'Mostrar textos do jogo' : 'Baralho convencional (só arte)'}
            </button>
            <button type="button" id="btn-export-json" class="btn-secondary">Exportar JSON</button>
            <button type="button" id="btn-import-json" class="btn-secondary">Importar JSON</button>
            <input type="file" id="input-import-json" accept="application/json" style="display: none;" />
            <button type="button" id="btn-reset-theme" class="btn-ghost">Restaurar padrão</button>
          </div>
        </section>

        <nav class="studio-filter-bar" aria-label="Filtros do Baralho">
          ${filterHtml}
        </nav>

        <div class="cards-gallery-grid">
          ${cardsGridHtml}
        </div>
      </div>

      <aside class="studio-editor-sidebar">
        <div class="editor-panel">
          <header class="editor-header">
            <div>
              <h3>Editor de carta</h3>
              <span class="editor-card-code">${escapeHtml(selectedCard.playingCardCode)} · #${String(selectedCard.collectorNumber).padStart(2, '0')}</span>
            </div>
            <button type="button" class="btn-secondary btn-sm" data-zoom-card-id="${escapeHtml(selectedCard.id)}">
              Ampliar
            </button>
          </header>

          <div class="editor-preview-slot" id="editor-live-preview" data-zoom-card-id="${escapeHtml(selectedCard.id)}" title="Clique para ampliar a carta">
            ${renderMagicCardHtml(selectedCard, { interactive: true, artOnly })}
          </div>

          <form id="card-editor-form" class="editor-form" data-editing-card-id="${escapeHtml(selectedCard.id)}">
            <div class="editor-field">
              <label for="edit-title">Título</label>
              <input id="edit-title" name="title" type="text" value="${escapeHtml(selectedCard.title)}" required />
            </div>

            <div class="editor-row-2">
              <div class="editor-field">
                <label for="edit-artGlyph">Ícone / Glifo</label>
                <input id="edit-artGlyph" name="artGlyph" type="text" value="${escapeHtml(selectedCard.artGlyph)}" />
              </div>
              <div class="editor-field">
                <label for="edit-artSubtitle">Legenda da Arte</label>
                <input id="edit-artSubtitle" name="artSubtitle" type="text" value="${escapeHtml(selectedCard.artSubtitle)}" />
              </div>
            </div>

            <div class="editor-field">
              <label for="edit-artUrl">Arte / Background da Carta (URL ou caminho 63×88mm)</label>
              <input id="edit-artUrl" name="artUrl" type="text" placeholder="Ex.: /cards/expedicao/A-spades.jpg ou https://..." value="${escapeHtml(selectedCard.artUrl ?? '')}" />
            </div>

            ${dynamicFieldsHtml}

            <div class="editor-field">
              <label for="edit-flavorText">Frase de ambientação</label>
              <input id="edit-flavorText" name="flavorText" type="text" value="${escapeHtml(selectedCard.flavorText)}" />
            </div>

            <div class="editor-actions">
              <button type="submit" id="btn-save-card" class="btn-primary">Salvar carta</button>
            </div>
          </form>
        </div>

        <details class="nano-prompt-box">
          <summary>Prompt Único Nano Banana · Figuras + Conceito + Fundo (${escapeHtml(deck.name)})</summary>
          <div class="nano-prompt-body">
            <p class="muted">Ilustração nas Figuras (<code>J/Q/K</code>) + layout conceitual minimalista nas Numéricas (<code>A–10</code>) e Coringas + 1 Fundo da Carta (verso 63×88mm). Todos os temas reunidos estão na aba <strong>Temas</strong> e em <code>PROMPTS-NANO-BANANA.md</code>.</p>
            <div class="editor-field">
              <label for="nano-prompt-unico">Kit 3×3 (Ilustração J/Q/K + Conceito A–10 + 1 Fundo) · ${escapeHtml(deck.name)}</label>
              <textarea id="nano-prompt-unico" class="nano-prompt-textarea" rows="8" readonly>${escapeHtml(nano.promptUnicoTema)}</textarea>
            </div>
          </div>
        </details>
      </aside>
    </div>
  `;
}
