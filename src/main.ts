import './styles/main.css';
import './styles/card-magic.css';
import './styles/print.css';

import { escapeHtml, isFigure, renderCardModalContentHtml, renderMagicCardHtml } from './components/card-renderer';
import { renderExemploHtml } from './components/exemplo-view';
import { renderOracleGuideHtml } from './components/oracle-view';
import { type PreparacaoMesa, preparacaoPadrao, renderPlaytestTableHtml } from './components/playtest-view';
import {
  type ConfigDeImpressao,
  configDeImpressaoPadrao,
  type EstampaDoVerso,
  type FormatoDeImpressao,
  type PrintFilterMode,
  renderPrintSheetsHtml,
  type TamanhoDaCarta,
} from './components/print-view';
import { renderQuickstartGuideHtml } from './components/quickstart-view';
import { cartaPeloCodigo, iniciarEscaneador, renderEscaneadorHtml } from './components/scanner';
import { renderStudioGalleryHtml } from './components/studio-view';
import { renderTemasHtml } from './components/temas-view';
import {
  avisarSaidaDaSala,
  avisarSalaEncerrada,
  criarSalaHost,
  desconectarP2P,
  entrarSalaCliente,
  enviarEstadoParaSala,
  gerarCodigoSalaAleatorio,
  registrarCallbacksP2P,
} from './core/online-sync';
import {
  type Acao,
  agir,
  type AlvoJogada,
  criarPartida,
  linhaDeStatus,
  type ModoDeJogo,
  type Nivel,
  NAIPES,
  type Naipe,
  type Partida,
  pontuacaoSolo,
  REGRA,
} from './core/partida';
import {
  exportThemeJson,
  importThemeJson,
  loadPartida,
  loadThemeId,
  loadThemeWithOverrides,
  registrarRecordeSolo,
  resetThemeOverrides,
  saveCardOverride,
  savePartida,
  saveSalaOnlineId,
  saveThemeId,
  syncEstadoDoMundo,
} from './core/storage';
import { ALL_THEME_IDS, DEFAULT_THEME_ID, THEMES } from './data/index';
import type { GameCard, ThemeDeck, ThemeId } from './types/card';

export type StudioTab = 'quickstart' | 'exemplo' | 'temas' | 'studio' | 'playtest' | 'print' | 'oracle';

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: 'quickstart', label: 'Como jogar' },
  { id: 'exemplo', label: 'Primeira partida' },
  { id: 'temas', label: 'Temas' },
  { id: 'playtest', label: 'Mesa de jogo' },
  { id: 'oracle', label: 'Compêndio' },
  { id: 'studio', label: 'Cartas e editor' },
  { id: 'print', label: 'Imprimir' },
];

interface AppState {
  activeTab: StudioTab;
  activeThemeId: ThemeId;
  suitFilter: string;
  studioArtOnly: boolean;
  impressao: ConfigDeImpressao;
  selectedCardId: string;
  selectedHandIndices: number[];
  partida: Partida | null;
  preparo: PreparacaoMesa;
  toastMessage: string | null;
  salaOnlineId: string | null;
  conectandoOnline: boolean;
  parceiroOnline: boolean;
  ehHostDaSala: boolean;
  versaoSala: number;
  exemploPasso: number;
}

export function mountHorizonteApp(root: HTMLElement): void {
  const savedTheme = loadThemeId();
  const initialThemeId: ThemeId = savedTheme && ALL_THEME_IDS.includes(savedTheme) ? savedTheme : DEFAULT_THEME_ID;
  const paramsIniciais = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlSalaId = paramsIniciais.get('sala');
  saveSalaOnlineId(null);

  const state: AppState = {
    activeTab: urlSalaId ? 'playtest' : 'quickstart',
    activeThemeId: initialThemeId,
    suitFilter: 'all',
    studioArtOnly: false,
    impressao: configDeImpressaoPadrao(),
    selectedCardId: loadThemeWithOverrides(initialThemeId).cards[0].id,
    selectedHandIndices: [],
    partida: urlSalaId ? null : loadPartida(),
    preparo: preparacaoPadrao(),
    toastMessage: null,
    salaOnlineId: null,
    conectandoOnline: false,
    parceiroOnline: false,
    ehHostDaSala: false,
    versaoSala: 0,
    exemploPasso: 0,
  };

  function sincronizarSala(): void {
    if (!state.salaOnlineId) return;
    state.versaoSala += 1;
    enviarEstadoParaSala(state.activeThemeId, state.preparo, state.partida, state.versaoSala);
  }

  registrarCallbacksP2P(
    (msg) => {
      if (msg.tipo === 'pedirSync') {
        if (state.salaOnlineId) {
          enviarEstadoParaSala(state.activeThemeId, state.preparo, state.partida, state.versaoSala);
        }
        return;
      }
      if (msg.tipo === 'salaEncerrada') {
        desconectarP2P();
        state.salaOnlineId = null;
        state.ehHostDaSala = false;
        state.parceiroOnline = false;
        state.versaoSala = 0;
        saveSalaOnlineId(null);
        limparParametroUrlSala();
        setPartida(null, false);
        showToast('A sala foi encerrada pelo anfitrião.');
        return;
      }
      if (msg.tipo === 'parceiroSaiu') {
        state.parceiroOnline = false;
        showToast('O parceiro saiu da sala.');
        render();
        return;
      }
      if (msg.tipo === 'sync') {
        if (typeof msg.versao === 'number' && msg.versao < state.versaoSala) return;
        const partidaAnterior = state.partida;
        state.versaoSala = Math.max(state.versaoSala, msg.versao ?? 0);
        if (msg.temaId && ALL_THEME_IDS.includes(msg.temaId)) {
          state.activeThemeId = msg.temaId;
          saveThemeId(msg.temaId);
        }
        if (msg.preparo && Array.isArray(msg.preparo.jogadores) && msg.preparo.jogadores.length > 0) {
          state.preparo = {
            modo: msg.preparo.modo ?? 'coop',
            nivel: msg.preparo.nivel ?? 'veterano',
            jogadores: msg.preparo.jogadores.map((j) => ({ nome: j.nome, classe: j.classe })),
          };
        }
        state.selectedHandIndices = [];
        setPartida(msg.partida ?? null, false);
        if (!partidaAnterior && msg.partida) {
          showToast('Partida iniciada na sala!');
        } else if (partidaAnterior && !msg.partida) {
          showToast('A mesa voltou para a preparação.');
        }
      }
    },
    (online) => {
      state.parceiroOnline = online;
      render();
    },
  );

  verificarParametrosDaUrl();

  function limparParametroUrlSala(): void {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has('sala')) {
      url.searchParams.delete('sala');
      window.history.replaceState({}, '', `${url.pathname}${url.hash || '#playtest'}`);
    }
  }

  function verificarParametrosDaUrl(): void {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const salaId = params.get('sala');
    if (salaId) entrarNaSalaComoCliente(salaId);
  }

  function criarNovaSala(codigoSugerido: string): void {
    state.conectandoOnline = true;
    render();
    criarSalaHost(
      codigoSugerido,
      (codigoExibicao) => {
        state.salaOnlineId = codigoExibicao;
        state.ehHostDaSala = true;
        state.versaoSala = 1;
        state.partida = null;
        state.selectedHandIndices = [];
        savePartida(null);
        saveSalaOnlineId(codigoExibicao);
        state.conectandoOnline = false;
        state.activeTab = 'playtest';
        showToast(`Sala online ${codigoExibicao} criada!`);
        render();
      },
      (erro) => {
        state.conectandoOnline = false;
        showToast(erro);
        render();
      },
    );
  }

  function entrarNaSalaComoCliente(codigo: string): void {
    state.conectandoOnline = true;
    state.activeTab = 'playtest';
    render();
    entrarSalaCliente(
      codigo,
      (codigoExibicao) => {
        state.salaOnlineId = codigoExibicao;
        state.ehHostDaSala = false;
        state.versaoSala = 0;
        saveSalaOnlineId(codigoExibicao);
        state.conectandoOnline = false;
        state.activeTab = 'playtest';
        showToast(`Conectado à sala ${codigoExibicao}!`);
        render();
      },
      (erro) => {
        state.conectandoOnline = false;
        limparParametroUrlSala();
        showToast(erro);
        render();
      },
    );
  }

  function showToast(msg: string): void {
    state.toastMessage = msg;
    render();
    setTimeout(() => {
      if (state.toastMessage !== msg) return;
      state.toastMessage = null;
      root.querySelector('.toast')?.remove();
    }, 2600);
  }

  function setPartida(next: Partida | null, enviarRemoto = true): void {
    state.partida = next;
    state.selectedHandIndices = [];
    savePartida(next);
    if (next) syncEstadoDoMundo(state.activeThemeId, next);
    if (enviarRemoto && state.salaOnlineId) {
      sincronizarSala();
    }
    render();
  }

  function buildEditedCardFromForm(form: HTMLFormElement, baseCard: GameCard): GameCard {
    const data = new FormData(form);
    const campo = (nome: string, atual: string | undefined): string => String(data.get(nome) ?? atual ?? '');
    const updated: GameCard = {
      ...baseCard,
      title: campo('title', baseCard.title),
      artGlyph: campo('artGlyph', baseCard.artGlyph),
      artSubtitle: campo('artSubtitle', baseCard.artSubtitle),
      artUrl: campo('artUrl', baseCard.artUrl).trim() || undefined,
      flavorText: campo('flavorText', baseCard.flavorText),
    };
    if (!isFigure(baseCard)) {
      updated.topWatcherEvent = campo('topWatcherEvent', baseCard.topWatcherEvent);
      updated.bottomEchoPrompt = campo('bottomEchoPrompt', baseCard.bottomEchoPrompt);
    }
    return updated;
  }

  function renderTab(deck: ThemeDeck, selectedCard: GameCard): string {
    switch (state.activeTab) {
      case 'quickstart':
        return renderQuickstartGuideHtml(deck);
      case 'exemplo':
        return renderExemploHtml(deck, state.exemploPasso);
      case 'temas':
        return renderTemasHtml(ALL_THEME_IDS.map((id) => loadThemeWithOverrides(id)), state.activeThemeId);
      case 'studio':
        return renderStudioGalleryHtml(deck, selectedCard, state.suitFilter, state.studioArtOnly);
      case 'playtest':
        return renderPlaytestTableHtml(
          deck,
          state.partida,
          state.preparo,
          state.selectedHandIndices,
          state.salaOnlineId,
          state.conectandoOnline,
          state.parceiroOnline,
        );
      case 'print':
        return renderPrintSheetsHtml(deck, state.impressao);
      default:
        return renderOracleGuideHtml(deck);
    }
  }

  function render(): void {
    const deck = loadThemeWithOverrides(state.activeThemeId);
    const selectedCard = deck.cards.find((c) => c.id === state.selectedCardId) ?? deck.cards[0];
    state.selectedCardId = selectedCard.id;

    const temaOptions = ALL_THEME_IDS.map(
      (id) =>
        `<option value="${escapeHtml(id)}" ${id === state.activeThemeId ? 'selected' : ''}>${escapeHtml(THEMES[id].name)}</option>`,
    ).join('');

    const temaAtual = `
      <div class="theme-current">
        <label for="topbar-theme-select" class="muted">Tema</label>
        <select id="topbar-theme-select" class="theme-current-select" aria-label="Selecionar tema">${temaOptions}</select>
        <button type="button" class="btn-ghost btn-sm" data-goto-tab="temas">Ver temas</button>
        <button type="button" class="btn-secondary btn-sm" data-abrir-escaneador>Escanear carta</button>
      </div>`;

    const tabs = TABS.map(
      (t) => `
        <button type="button" class="tab ${state.activeTab === t.id ? 'is-active' : ''}" data-tab="${t.id}" ${state.activeTab === t.id ? 'aria-current="page"' : ''}>
          ${t.label}${t.id === 'playtest' && state.partida && !state.partida.resultado ? ' <span class="tab-dot" aria-label="partida em andamento"></span>' : ''}
        </button>`,
    ).join('');

    if (typeof document !== 'undefined') {
      document.body.dataset.theme = state.activeThemeId;
    }

    root.innerHTML = `
      <div class="app" data-theme="${escapeHtml(state.activeThemeId)}">
        <header class="topbar no-print">
          <div class="brand">
            <span class="brand-mark" aria-hidden="true">
              <svg class="brand-emblem" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="16" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2" />
                <path d="M6 26h36" stroke="currentColor" stroke-width="1.5" />
                <path d="M13 26a11 11 0 0 1 22 0" fill="currentColor" fill-opacity="0.85" />
                <path d="M24 10v6m-9 2 3 4m15-4-3 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                <path d="M15 33h18l-9 6-9-6Z" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.2" />
              </svg>
            </span>
            <div class="brand-lockup">
              <div class="brand-wordmark">
                <h1 class="brand-title">HOR<span class="brand-blade">I</span>ZONTE</h1>
              </div>
              <span class="brand-sub">Zona de Conflito · Solo, Cooperativo & PvP em baralho de 54 cartas</span>
            </div>
          </div>
          ${temaAtual}
        </header>
        <nav class="tabs no-print" aria-label="Seções">${tabs}</nav>
        <main class="content">${renderTab(deck, selectedCard)}</main>
        <dialog id="card-zoom-dialog" class="card-zoom-dialog no-print" closedby="any" aria-labelledby="zoom-dialog-title"></dialog>
        ${state.toastMessage ? `<div class="toast no-print" role="status">${escapeHtml(state.toastMessage)}</div>` : ''}
      </div>
    `;

    bindEvents(deck, selectedCard);
  }

  let pararEscaneador: (() => void) | null = null;

  function openCardZoomModal(card: GameCard): void {
    const dialog = root.querySelector<HTMLDialogElement>('#card-zoom-dialog');
    if (!dialog) return;
    pararEscaneador?.();
    dialog.innerHTML = renderCardModalContentHtml(card);
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
  }

  function abrirEscaneador(deck: ThemeDeck): void {
    const dialog = root.querySelector<HTMLDialogElement>('#card-zoom-dialog');
    if (!dialog) return;
    dialog.innerHTML = renderEscaneadorHtml(deck.name);
    if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal();
    const abrirPeloCodigo = (texto: string): void => {
      const carta = cartaPeloCodigo(deck.cards, texto);
      if (carta) openCardZoomModal(carta);
    };
    pararEscaneador = iniciarEscaneador(dialog, abrirPeloCodigo);
    dialog.addEventListener('close', () => pararEscaneador?.(), { once: true });

    let valor = '';
    dialog.querySelectorAll<HTMLButtonElement>('[data-scan-valor]').forEach((btn) =>
      btn.addEventListener('click', () => {
        valor = btn.dataset.scanValor ?? '';
        dialog.querySelectorAll('[data-scan-valor]').forEach((b) => b.classList.toggle('is-active', b === btn));
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>('[data-scan-naipe]').forEach((btn) =>
      btn.addEventListener('click', () => {
        if (valor) abrirPeloCodigo(`HORIZONTE:${valor}${btn.dataset.scanNaipe}`);
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>('[data-scan-codigo]').forEach((btn) =>
      btn.addEventListener('click', () => abrirPeloCodigo(`HORIZONTE:${btn.dataset.scanCodigo}`)),
    );
  }

  function switchTheme(next: ThemeId, keepTemasTabToast = false): void {
    if (!next || !ALL_THEME_IDS.includes(next) || next === state.activeThemeId) return;
    state.activeThemeId = next;
    saveThemeId(next);
    state.selectedCardId = loadThemeWithOverrides(next).cards[0].id;
    sincronizarSala();
    if (keepTemasTabToast && state.activeTab === 'temas') showToast(`Tema escolhido: ${THEMES[next].name}.`);
    else render();
  }

  function bindEvents(deck: ThemeDeck, selectedCard: GameCard): void {
    const topSelect = root.querySelector<HTMLSelectElement>('#topbar-theme-select');
    topSelect?.addEventListener('change', () => {
      switchTheme(topSelect.value as ThemeId);
    });

    root.querySelectorAll<HTMLButtonElement>('[data-switch-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        switchTheme(btn.dataset.switchTheme as ThemeId, !btn.dataset.gotoTab);
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-tab], [data-goto-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn.dataset.tab ?? btn.dataset.gotoTab) as StudioTab;
        if (!tab) return;
        state.activeTab = tab;
        render();
        if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0 });
      });
    });

    bindDialogFallback();

    root.querySelector('[data-abrir-escaneador]')?.addEventListener('click', () => abrirEscaneador(deck));

    root.querySelectorAll<HTMLElement>('[data-zoom-card-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const found = deck.cards.find((c) => c.id === el.dataset.zoomCardId);
        if (found) openCardZoomModal(found);
      });
    });

    if (state.activeTab === 'quickstart' || state.activeTab === 'oracle' || state.activeTab === 'exemplo' || state.activeTab === 'playtest') {
      root.querySelectorAll<HTMLElement>('.mtg-card[data-card-id]').forEach((el) => {
        el.addEventListener('click', () => {
          const found = deck.cards.find((c) => c.id === el.dataset.cardId);
          if (found) openCardZoomModal(found);
        });
      });
    }

    if (state.activeTab === 'exemplo') {
      root.querySelectorAll<HTMLElement>('[data-exemplo-step]').forEach((el) => {
        el.addEventListener('click', () => {
          const passo = Number(el.dataset.exemploStep);
          if (!Number.isInteger(passo)) return;
          state.exemploPasso = passo;
          render();
        });
      });
    }

    if (state.activeTab === 'studio') bindStudio(deck, selectedCard);
    if (state.activeTab === 'playtest') bindMesa();
    if (state.activeTab === 'print') bindPrint();
  }

  function bindDialogFallback(): void {
    const dialog = root.querySelector<HTMLDialogElement>('#card-zoom-dialog');
    if (!dialog || typeof HTMLDialogElement === 'undefined' || 'closedBy' in HTMLDialogElement.prototype) return;
    const isOutside = (e: PointerEvent): boolean => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', (e) => {
      pressedOutside = isOutside(e);
    });
    dialog.addEventListener('pointerup', (e) => {
      if (pressedOutside && isOutside(e)) dialog.close();
    });
  }

  function bindStudio(deck: ThemeDeck, selectedCard: GameCard): void {
    root.querySelector('#btn-toggle-art-only')?.addEventListener('click', () => {
      state.studioArtOnly = !state.studioArtOnly;
      render();
    });

    root.querySelectorAll<HTMLButtonElement>('[data-suit-filter]').forEach((pill) => {
      pill.addEventListener('click', () => {
        state.suitFilter = pill.dataset.suitFilter ?? 'all';
        render();
      });
    });

    root.querySelectorAll<HTMLElement>('.cards-gallery-grid .mtg-card[data-card-id]').forEach((el) => {
      el.addEventListener('click', () => {
        const cardId = el.dataset.cardId;
        if (!cardId) return;
        if (cardId !== state.selectedCardId) {
          state.selectedCardId = cardId;
          render();
          return;
        }
        const found = deck.cards.find((c) => c.id === cardId);
        if (found) openCardZoomModal(found);
      });
    });

    const form = root.querySelector<HTMLFormElement>('#card-editor-form');
    const preview = root.querySelector<HTMLElement>('#editor-live-preview');
    form?.addEventListener('input', () => {
      if (preview) {
        preview.innerHTML = renderMagicCardHtml(buildEditedCardFromForm(form, selectedCard), {
          interactive: true,
          artOnly: state.studioArtOnly,
        });
      }
    });
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = buildEditedCardFromForm(form, selectedCard);
      saveCardOverride(updated);
      showToast(`Carta "${updated.title}" salva neste navegador.`);
    });

    root.querySelector('#btn-reset-theme')?.addEventListener('click', () => {
      resetThemeOverrides(state.activeThemeId);
      showToast('Cartas do tema restauradas.');
    });

    root.querySelector('#btn-export-json')?.addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([exportThemeJson(deck)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `horizonte-${deck.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Arquivo JSON exportado.');
    });

    const inputImport = root.querySelector<HTMLInputElement>('#input-import-json');
    root.querySelector('#btn-import-json')?.addEventListener('click', () => inputImport?.click());
    inputImport?.addEventListener('change', async () => {
      const file = inputImport.files?.[0];
      if (!file) return;
      try {
        const imported = importThemeJson(await file.text());
        if (ALL_THEME_IDS.includes(imported.id)) state.activeThemeId = imported.id;
        showToast(`Tema "${imported.name}" importado.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Não foi possível importar o arquivo.');
      }
    });
  }

  function bindMesa(): void {
    root.querySelectorAll<HTMLButtonElement>('[data-nivel-mesa]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nivel = btn.dataset.nivelMesa as Nivel;
        if (!nivel || nivel === state.preparo.nivel) return;
        state.preparo.nivel = nivel;
        sincronizarSala();
        render();
      });
    });
    root.querySelectorAll<HTMLButtonElement>('[data-modo-mesa]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modo = btn.dataset.modoMesa as ModoDeJogo;
        if (!modo || modo === state.preparo.modo) return;
        state.preparo.modo = modo;
        if (modo === 'solo') {
          state.preparo.jogadores = [state.preparo.jogadores[0] ?? { nome: 'Sobrevivente 1', classe: 'spades' }];
        } else if (state.preparo.jogadores.length < 2) {
          const usada = state.preparo.jogadores[0]?.classe ?? 'spades';
          const proxClasse = NAIPES.find((n) => n !== usada) ?? 'hearts';
          state.preparo.jogadores.push({ nome: 'Sobrevivente 2', classe: proxClasse });
        }
        sincronizarSala();
        render();
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-classe]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const jogador = state.preparo.jogadores[Number(btn.dataset.jogador)];
        if (!jogador) return;
        jogador.classe = btn.dataset.classe as Naipe;
        sincronizarSala();
        render();
      });
    });

    root.querySelectorAll<HTMLInputElement>('[data-nome-jogador]').forEach((input) => {
      input.addEventListener('input', () => {
        const jogador = state.preparo.jogadores[Number(input.dataset.nomeJogador)];
        if (jogador) jogador.nome = input.value;
      });
      input.addEventListener('change', () => {
        sincronizarSala();
      });
    });

    root.querySelector<HTMLInputElement>('[data-campo-sala]')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void acaoOnline('entrar');
      }
    });

    root.querySelectorAll<HTMLButtonElement>('[data-acao-mesa]').forEach((btn) => {
      btn.addEventListener('click', () => acaoDeMesa(btn.dataset.acaoMesa ?? ''));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-acao-online]').forEach((btn) => {
      btn.addEventListener('click', () => void acaoOnline(btn.dataset.acaoOnline ?? ''));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-selecionar-carta]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.selecionarCarta);
        if (!Number.isInteger(idx)) return;
        if (state.selectedHandIndices.includes(idx)) {
          state.selectedHandIndices = state.selectedHandIndices.filter((i) => i !== idx);
        } else {
          state.selectedHandIndices = [...state.selectedHandIndices, idx].sort((a, b) => a - b);
        }
        render();
      });
    });

    root.querySelector('[data-limpar-selecao]')?.addEventListener('click', () => {
      state.selectedHandIndices = [];
      render();
    });

    root.querySelectorAll<HTMLButtonElement>('[data-acao]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const acao = acaoDoBotao(btn);
        if (!acao || !state.partida) return;
        const proxima = agir(state.partida, acao);
        if (proxima === state.partida) {
          showToast('Jogada inválida para este momento ou seleção.');
          return;
        }
        if (proxima.modo === 'solo' && proxima.resultado !== null) {
          registrarRecordeSolo(proxima.nivel ?? 'veterano', pontuacaoSolo(proxima));
        }
        setPartida(proxima);
      });
    });
  }

  function acaoDeMesa(nome: string): void {
    const jogadores = state.preparo.jogadores;
    if (nome === 'maisPessoa' && jogadores.length < REGRA.maxPessoas) {
      const usadas = new Set(jogadores.map((j) => j.classe));
      const classe = NAIPES.find((n) => !usadas.has(n)) ?? 'spades';
      jogadores.push({ nome: `Sobrevivente ${jogadores.length + 1}`, classe });
      sincronizarSala();
      render();
      return;
    }
    if (nome === 'menosPessoa' && jogadores.length > 2) {
      jogadores.pop();
      sincronizarSala();
      render();
      return;
    }
    if (nome === 'comecar' || nome === 'novaMesa') {
      const nomeados = jogadores.map((j, i) => ({ ...j, nome: j.nome.trim() || `Sobrevivente ${i + 1}` }));
      state.preparo = { ...state.preparo, jogadores: nomeados };
      setPartida(criarPartida({ modo: state.preparo.modo, nivel: state.preparo.nivel, jogadores: nomeados, chefe: THEMES[state.activeThemeId].chefe.regra }), true);
      if (nome === 'novaMesa') showToast('Nova partida iniciada!');
      return;
    }
    if (nome === 'encerrarMesa') {
      setPartida(null, true);
      showToast('Mesa encerrada.');
      return;
    }
    if (nome === 'copiar' && state.partida) {
      const linha = linhaDeStatus(state.partida);
      navigator.clipboard
        ?.writeText(linha)
        .then(() => showToast('Status copiado para a área de transferência!'))
        .catch(() => showToast('Não foi possível copiar automaticamente.'));
    }
  }

  async function acaoOnline(acao: string): Promise<void> {
    if (acao === 'desconectar') {
      if (state.ehHostDaSala) avisarSalaEncerrada();
      else avisarSaidaDaSala();
      desconectarP2P();
      state.salaOnlineId = null;
      state.ehHostDaSala = false;
      state.parceiroOnline = false;
      state.versaoSala = 0;
      saveSalaOnlineId(null);
      limparParametroUrlSala();
      setPartida(null, false);
      showToast('Você saiu da sala.');
      return;
    }

    if (acao === 'copiarLink') {
      if (!state.salaOnlineId) return;
      const urlBase = `${window.location.origin}${window.location.pathname}`;
      const link = `${urlBase}?sala=${encodeURIComponent(state.salaOnlineId)}#playtest`;
      try {
        await navigator.clipboard.writeText(link);
        showToast(`Link da sala ${state.salaOnlineId} copiado!`);
      } catch {
        showToast('Não foi possível copiar automaticamente.');
      }
      return;
    }

    if (acao === 'criar') {
      criarNovaSala(gerarCodigoSalaAleatorio());
      return;
    }

    if (acao === 'entrar') {
      const input = root.querySelector<HTMLInputElement>('[data-campo-sala]');
      const raw = input?.value.trim() ?? '';
      if (!raw) {
        showToast('Digite ou cole o código da sala.');
        return;
      }
      let id = raw;
      if (raw.includes('sala=')) {
        try {
          const u = new URL(raw, window.location.href);
          id = u.searchParams.get('sala') ?? raw;
        } catch {}
      }
      entrarNaSalaComoCliente(id);
    }
  }

  function acaoDoBotao(btn: HTMLButtonElement): Acao | null {
    const d = btn.dataset;
    const quem = Number(d.quem ?? 0);
    switch (d.acao) {
      case 'jogarCartas': {
        let alvo: AlvoJogada = 'horizonte_abater';
        if (d.alvoRival !== undefined) {
          alvo = { rival: Number(d.alvoRival) };
        } else if (d.alvo === 'horizonte_recrutar') {
          alvo = 'horizonte_recrutar';
        }
        return { tipo: 'jogarCartas', quem, indicesMao: [...state.selectedHandIndices], alvo };
      }
      case 'usarAliado':
        return {
          tipo: 'usarAliado',
          quem,
          indiceAliado: Number(d.indiceAliado ?? 0),
          alvoRival: d.alvoRival !== undefined ? Number(d.alvoRival) : undefined,
        };
      case 'bloquear':
        return {
          tipo: 'bloquear',
          quem,
          indicesMao: d.escudoAliado !== undefined ? [] : [...state.selectedHandIndices],
          usarAliadoEscudo: d.escudoAliado !== undefined ? Number(d.escudoAliado) : undefined,
        };
      case 'passarTurno':
        return {
          tipo: 'passarTurno',
          quem,
          descartarIndices: state.selectedHandIndices.length > 0 ? [...state.selectedHandIndices] : undefined,
        };
      default:
        return null;
    }
  }

  function bindPrint(): void {
    const mudar = (parcial: Partial<ConfigDeImpressao>): void => {
      state.impressao = { ...state.impressao, ...parcial };
      render();
    };
    const conjunto = root.querySelector<HTMLSelectElement>('#print-filter-select');
    conjunto?.addEventListener('change', () => mudar({ conjunto: (conjunto.value as PrintFilterMode) || 'mission' }));
    const tamanho = root.querySelector<HTMLSelectElement>('#print-tamanho-select');
    tamanho?.addEventListener('change', () => mudar({ tamanho: (tamanho.value as TamanhoDaCarta) || 'poker' }));
    const formato = root.querySelector<HTMLSelectElement>('#print-formato-select');
    formato?.addEventListener('change', () => mudar({ formato: (formato.value as FormatoDeImpressao) || 'a4' }));
    const escala = root.querySelector<HTMLSelectElement>('#print-escala-select');
    escala?.addEventListener('change', () => mudar({ escala: Number(escala.value) || 1 }));
    const codigo = root.querySelector<HTMLInputElement>('#print-codigo');
    codigo?.addEventListener('change', () => mudar({ codigo: codigo.checked }));
    const apenasArte = root.querySelector<HTMLInputElement>('#print-apenas-arte');
    apenasArte?.addEventListener('change', () => mudar({ apenasArte: apenasArte.checked }));
    const duplex = root.querySelector<HTMLInputElement>('#print-duplex');
    duplex?.addEventListener('change', () => mudar({ frenteEVerso: duplex.checked }));
    root.querySelectorAll<HTMLButtonElement>('[data-print-verso]').forEach((btn) => {
      btn.addEventListener('click', () => mudar({ verso: btn.dataset.printVerso as EstampaDoVerso }));
    });
    root.querySelector('#btn-trigger-print')?.addEventListener('click', () => window.print());
  }

  render();
}

if (typeof document !== 'undefined') {
  const appRoot = document.getElementById('app');
  if (appRoot) mountHorizonteApp(appRoot);
}
