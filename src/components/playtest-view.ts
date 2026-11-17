import {
  ataqueEfetivoAmeaca,
  CLASSES,
  codigoCarta,
  codigoFigura,
  ehCoringa,
  FUNCAO_DO_NAIPE,
  linhaDeStatus,
  type ModoDeJogo,
  NIVEIS,
  type Nivel,
  danoNaAmeaca,
  TRACO_AMEACA,
  NAIPES,
  type Naipe,
  type Partida,
  type PostoFigura,
  pontosDeDominio,
  REGRA,
  SIMBOLO,
  simularJogada,
  STATUS_FIGURA,
  valorBloqueioCarta,
} from '../core/partida';
import type { PreparoSala } from '../core/online-sync';
import { syncEstadoDoMundo } from '../core/storage';
import type { ThemeDeck } from '../types/card';
import { cartaDoTemaPorAcao, cartaDoTemaPorFigura, escapeHtml, renderMagicCardHtml } from './card-renderer';
import { NUANCES_DO_TEMA } from './temas-view';

export type PreparacaoMesa = PreparoSala;

export function preparacaoPadrao(): PreparacaoMesa {
  return {
    modo: 'solo',
    nivel: 'veterano',
    jogadores: [{ nome: 'Sobrevivente 1', classe: 'spades' }],
  };
}

const MODOS: Array<{ id: ModoDeJogo; titulo: string; resumo: string }> = [
  {
    id: 'solo',
    titulo: 'Solo · Sobrevivência',
    resumo: '1 jogador contra as 12 Figuras do Horizonte. Vença limpando a última onda vivo.',
  },
  {
    id: 'coop',
    titulo: 'Cooperativo · Aliados',
    resumo: '2 a 4 jogadores contra o Horizonte. ♥ cura quem mais precisa; se um cair, todos perdem.',
  },
  {
    id: 'pvp',
    titulo: 'Competitivo · PvP',
    resumo: '2 a 4 rivais no caos. Recrute aliados, atire nos oponentes e vença por eliminação ou Domínio.',
  },
];

export function renderPlaytestTableHtml(
  deck: ThemeDeck,
  partida: Partida | null,
  preparo: PreparacaoMesa,
  selectedIndices: number[] = [],
  salaOnlineId: string | null = null,
  conectandoOnline: boolean = false,
  parceiroOnline: boolean = false,
): string {
  if (partida) {
    return renderPartida(deck, partida, selectedIndices, salaOnlineId, parceiroOnline);
  }
  return renderPreparacao(deck, preparo, salaOnlineId, conectandoOnline, parceiroOnline);
}

// ---------- Barra Online Opcional ----------

function renderBarraOnline(
  salaOnlineId: string | null,
  conectandoOnline: boolean,
  parceiroOnline: boolean,
): string {
  if (salaOnlineId) {
    return `
      <div class="online-sync-bar">
        <span class="chip chip-ok">● Sala online ativa</span>
        <span>Código: <strong>${escapeHtml(salaOnlineId)}</strong></span>
        <span class="chip ${parceiroOnline ? 'chip-ok' : 'chip-warn'}">${parceiroOnline ? '● Parceiro conectado' : '○ Aguardando conexão...'}</span>
        <button type="button" class="btn-secondary btn-sm" data-acao-online="copiarLink">Copiar link da mesa</button>
        <button type="button" class="btn-ghost btn-sm danger" data-acao-online="desconectar">Sair da sala</button>
      </div>`;
  }

  return `
    <details class="online-room-card">
      <summary class="online-room-head">
        <span class="chip">Mesa local pronta</span>
        <strong>Jogue direto aqui no navegador — ou abra uma Sala Online P2P (opcional)</strong>
      </summary>
      <div class="room-gate-grid spaced-sm">
        <div class="inline wrap">
          <button type="button" class="btn-secondary btn-sm" data-acao-online="criar" ${conectandoOnline ? 'disabled' : ''}>
            ${conectandoOnline ? 'Criando sala...' : 'Criar sala online P2P'}
          </button>
        </div>
        <div class="inline wrap">
          <input type="text" maxlength="120" placeholder="Código ou link da sala" data-campo-sala aria-label="Código ou link da sala" ${conectandoOnline ? 'disabled' : ''} />
          <button type="button" class="btn-secondary btn-sm" data-acao-online="entrar" ${conectandoOnline ? 'disabled' : ''}>
            ${conectandoOnline ? 'Conectando...' : 'Entrar em sala'}
          </button>
        </div>
      </div>
    </details>`;
}

// ---------- Preparação ----------

function renderEscolhaDeJogador(j: { nome: string; classe: Naipe }, i: number): string {
  const tiles = NAIPES.map(
    (n) => `
      <button type="button" class="class-tile suit-${n} ${j.classe === n ? 'is-active' : ''}" data-classe="${n}" data-jogador="${i}">
        <span class="class-suit">${SIMBOLO[n]}</span>
        <span class="class-name">${CLASSES[n].nome}</span>
        <span class="class-vocation">${FUNCAO_DO_NAIPE[n].pilar}</span>
        <span class="class-power">${CLASSES[n].descricao}</span>
      </button>`,
  ).join('');

  return `
    <div class="setup-player">
      <label class="field">
        <span class="field-label">Jogador ${i + 1}</span>
        <input type="text" maxlength="28" value="${escapeHtml(j.nome)}" data-nome-jogador="${i}" placeholder="Nome do sobrevivente" />
      </label>
      <div class="class-grid">${tiles}</div>
    </div>`;
}

function renderPreparacao(
  deck: ThemeDeck,
  preparo: PreparacaoMesa,
  salaOnlineId: string | null,
  conectandoOnline: boolean,
  parceiroOnline: boolean,
): string {
  const nuance = NUANCES_DO_TEMA[deck.id] ?? NUANCES_DO_TEMA.wasteland;
  const estadoSalvo = syncEstadoDoMundo(deck.id, null);
  const jogadoresHtml = preparo.jogadores.map((j, i) => renderEscolhaDeJogador(j, i)).join('');
  const modosHtml = MODOS.map(
    (m) => `
      <button type="button" class="mode-tile ${preparo.modo === m.id ? 'is-active' : ''}" data-modo-mesa="${m.id}">
        <strong>${m.titulo}</strong>
        <span class="muted">${m.resumo}</span>
      </button>`,
  ).join('');

  return `
    <section class="setup">
      ${renderBarraOnline(salaOnlineId, conectandoOnline, parceiroOnline)}

      <header class="section-head">
        <span class="eyebrow">Preparar Mesa · ${escapeHtml(deck.name)}</span>
        <h2>Escolha o modo e os sobreviventes</h2>
        <p class="lede">Cada jogador começa com <strong>${NIVEIS[preparo.nivel].vida} PV</strong> e <strong>${REGRA.maoInicial} cartas</strong>. As 12 Figuras (4 Valetes, 4 Damas, 4 Reis) formam o Deck do Horizonte.</p>
      </header>

      <div class="setup-theme-brief">
        <div>
          <span class="field-label">O Horizonte em ${escapeHtml(deck.name)}</span>
          <p>${escapeHtml(nuance.oQueEOHorizonte)}</p>
        </div>
        <div>
          <span class="field-label">Onda Final · ${escapeHtml(deck.chefe.nome)}</span>
          <p>${escapeHtml(deck.chefe.descricao)} ${escapeHtml(nuance.chefeFinal)}</p>
        </div>
      </div>

      <div class="mode-grid" role="group" aria-label="Modo de jogo">
        ${modosHtml}
      </div>

      <div class="mode-grid" role="group" aria-label="Nível de dificuldade">
        ${(Object.keys(NIVEIS) as Nivel[])
          .map(
            (n) => `
          <button type="button" class="mode-tile ${preparo.nivel === n ? 'is-active' : ''}" data-nivel-mesa="${n}">
            <strong>${NIVEIS[n].nome} · ${NIVEIS[n].vida} PV</strong>
            <span class="muted">${NIVEIS[n].resumo}</span>
          </button>`,
          )
          .join('')}
      </div>

      ${
        preparo.modo !== 'solo'
          ? `
          <div class="setup-controls-bar">
            <div class="setup-count">
              <span>Jogadores na mesa: <strong class="num">${preparo.jogadores.length}</strong></span>
              <button type="button" class="btn-ghost btn-sm" data-acao-mesa="menosPessoa" ${preparo.jogadores.length <= 2 ? 'disabled' : ''}>Remover</button>
              <button type="button" class="btn-secondary btn-sm" data-acao-mesa="maisPessoa" ${preparo.jogadores.length >= REGRA.maxPessoas ? 'disabled' : ''}>+ Adicionar jogador</button>
            </div>
          </div>`
          : ''
      }

      ${
        estadoSalvo.notaDoMundo || estadoSalvo.rodada > 0
          ? `<div class="world-memory-banner">
              <span class="field-label">Último registro em ${escapeHtml(deck.name)}</span>
              <p class="muted">${escapeHtml(estadoSalvo.ultimoEvento)}${estadoSalvo.notaDoMundo ? ` · Nota: “${escapeHtml(estadoSalvo.notaDoMundo)}”` : ''}</p>
            </div>`
          : ''
      }

      <div class="setup-players">${jogadoresHtml}</div>

      <div class="setup-actions">
        <button type="button" class="btn-primary btn-lg" data-acao-mesa="comecar">Embaralhar e começar partida</button>
      </div>
    </section>
  `;
}

// ---------- Mesa Ativa ----------

function nomeOnda(posto: 'J' | 'Q' | 'K'): string {
  if (posto === 'J') return 'Onda 1 · Valetes';
  if (posto === 'Q') return 'Onda 2 · Damas';
  return 'Onda 3 · Reis';
}

function renderPainelHorizonte(deck: ThemeDeck, partida: Partida): string {
  const ameaca = partida.ameacaAtiva;
  const restantes = partida.horizonteDeck.length + (ameaca ? 1 : 0);

  if (!ameaca) {
    return `
      <section class="horizon-panel is-cleared">
        <span class="eyebrow">O Horizonte · Limpo</span>
        <h3>Todas as 12 Ameaças foram derrotadas!</h3>
        <p class="muted">Não restam inimigos no centro da mesa.</p>
      </section>`;
  }

  const cartaTema = cartaDoTemaPorFigura(deck.cards, ameaca.figura);
  const ataqueEfetivo = ataqueEfetivoAmeaca(ameaca);
  const pctVida = Math.max(0, Math.min(100, Math.round((ameaca.vidaAtual / ameaca.vidaMax) * 100)));
  const st = STATUS_FIGURA[ameaca.figura.posto];

  return `
    <section class="horizon-panel" aria-label="Ameaça Central no Horizonte">
      <div class="horizon-card-slot">
        ${
          cartaTema
            ? renderMagicCardHtml(cartaTema, { interactive: true })
            : `<div class="threat-card"><strong>${escapeHtml(codigoFigura(ameaca.figura))}</strong></div>`
        }
      </div>
      <div class="horizon-stats">
        <div class="horizon-head">
          <span class="chip chip-strong">${nomeOnda(ameaca.figura.posto)}</span>
          <span class="chip">Restam ${restantes}/12 Figuras</span>
          <span class="chip">${st.trofeus} pts · Saque +${st.saque}</span>
        </div>
        <h3>${escapeHtml(cartaTema?.title ?? codigoFigura(ameaca.figura))} <span class="muted">${escapeHtml(codigoFigura(ameaca.figura))}</span></h3>
        <p class="muted">${escapeHtml(cartaTema?.artSubtitle ?? '')}</p>
        <p><span class="chip chip-strong">${TRACO_AMEACA[ameaca.figura.naipe].nome}</span> ${escapeHtml(TRACO_AMEACA[ameaca.figura.naipe].descricao(ameaca.figura.posto))}</p>

        <div class="horizon-bars">
          <div class="horizon-vital">
            <div class="horizon-vital-row">
              <span>Vida da Ameaça</span>
              <strong class="num">${ameaca.vidaAtual} / ${ameaca.vidaMax}</strong>
            </div>
            <div class="meter is-danger"><span style="width:${pctVida}%"></span></div>
          </div>

          <div class="horizon-atk-box">
            <span class="field-label">Contra-ataque</span>
            <strong class="num horizon-atk-num">${ataqueEfetivo}</strong>
            ${
              ameaca.reducaoAtaqueTurno > 0
                ? `<span class="chip chip-ok">-${ameaca.reducaoAtaqueTurno} por ♣ neste turno</span>`
                : `<span class="muted">Base ${ameaca.ataqueBase}</span>`
            }
          </div>
        </div>

        <div class="horizon-recruit-info">
          <strong>Ao finalizar:</strong>
          <span>Abater (qualquer carta) → vira Troféu de ${st.trofeus} pts e você compra ${st.saque}.</span>
          <span>Recrutar (golpe final com ♥/♦/Coringa) → vira seu Aliado com ${st.cargas} usos.</span>
        </div>
      </div>
    </section>
  `;
}

function rotuloUsoAliado(posto: PostoFigura, naipe: Naipe): string {
  const st = STATUS_FIGURA[posto];
  switch (naipe) {
    case 'spades':
      return `Gastar 1 uso (${st.bonusAliado} dano no Horizonte)`;
    case 'clubs':
      return `Gastar 1 uso (-${st.bonusAliado} Atq na Ameaça)`;
    case 'diamonds': {
      const qtd = posto === 'J' ? 1 : posto === 'Q' ? 2 : 3;
      return `Gastar 1 uso (+${qtd} carta${qtd === 1 ? '' : 's'})`;
    }
    case 'hearts':
      return `Gastar 1 uso (+${st.bonusAliado} PV)`;
  }
}

function renderPainelJogadores(deck: ThemeDeck, partida: Partida): string {
  const podeUsarAliado = partida.fase === 'acao' && !partida.aliadoUsadoNoTurno && partida.resultado === null;

  const cards = partida.jogadores
    .map((j, idx) => {
      const ativo = idx === partida.turnoDe && partida.resultado === null;
      const pctVida = Math.max(0, Math.min(100, Math.round((j.vida / j.vidaMax) * 100)));
      const aliadosHtml =
        j.aliados.length === 0
          ? `<span class="muted">Nenhum aliado recrutado</span>`
          : j.aliados
              .map((a, aIdx) => {
                const cartaAliado = cartaDoTemaPorFigura(deck.cards, a.figura);
                const st = STATUS_FIGURA[a.figura.posto];
                const fn = FUNCAO_DO_NAIPE[a.figura.naipe];
                const cargasBolinhas = '●'.repeat(a.cargas) + '○'.repeat(Math.max(0, a.maxCargas - a.cargas));
                let acoesAliado = '';
                if (ativo && podeUsarAliado && a.cargas > 0) {
                  if (a.figura.naipe === 'spades' && partida.modo === 'pvp') {
                    const rivais = partida.jogadores
                      .map((r, rIdx) => ({ r, rIdx }))
                      .filter((x) => x.rIdx !== idx && !x.r.eliminado);
                    acoesAliado = `
                      <div class="inline wrap">
                        <button type="button" class="btn-secondary btn-sm" data-acao="usarAliado" data-quem="${idx}" data-indice-aliado="${aIdx}">Gastar 1 uso (${st.bonusAliado} dano no Horizonte)</button>
                        ${rivais
                          .map(
                            (x) =>
                              `<button type="button" class="btn-ghost btn-sm" data-acao="usarAliado" data-quem="${idx}" data-indice-aliado="${aIdx}" data-alvo-rival="${x.rIdx}">Atirar em ${escapeHtml(x.r.nome)} (${st.bonusAliado} dano)</button>`,
                          )
                          .join('')}
                      </div>`;
                  } else {
                    acoesAliado = `<button type="button" class="btn-secondary btn-sm" data-acao="usarAliado" data-quem="${idx}" data-indice-aliado="${aIdx}">${rotuloUsoAliado(a.figura.posto, a.figura.naipe)}</button>`;
                  }
                }
                return `
                  <div class="ally-badge">
                    <div class="ally-head">
                      <strong class="suit-${a.figura.naipe}">${escapeHtml(codigoFigura(a.figura))} ${escapeHtml(cartaAliado?.title ?? '')}</strong>
                      <span class="num chip">${cargasBolinhas} (${a.cargas}/${a.maxCargas})</span>
                    </div>
                    <span class="muted">${fn.papelAliado}</span>
                    ${acoesAliado}
                  </div>`;
              })
              .join('');

      return `
        <article class="front ${ativo ? 'has-threat' : ''} ${j.eliminado ? 'is-down' : ''}">
          <header class="front-head">
            <div>
              <h3>${escapeHtml(j.nome)} ${ativo ? '<span class="chip chip-ok">Sua vez</span>' : ''} ${j.eliminado ? '<span class="chip chip-off">Eliminado</span>' : ''}</h3>
              <span class="front-class suit-${j.classe}">${SIMBOLO[j.classe]} ${CLASSES[j.classe].nome}</span>
            </div>
            <div class="chips">
              <span class="chip num">❤ ${j.vida}/${j.vidaMax} PV</span>
              <span class="chip num">🏆 ${j.pontosTrofeu} pts</span>
              ${partida.modo === 'pvp' ? `<span class="chip num">Domínio ${pontosDeDominio(j)}</span>` : ''}
            </div>
          </header>
          <div class="meter ${j.vida <= 6 ? 'is-danger' : ''}"><span style="width:${pctVida}%"></span></div>
          <div class="front-counts">
            <span>Mão: <strong class="num">${j.mao.length}</strong> cartas</span>
            <span>Troféus: <strong class="num">${j.trofeus.length}</strong></span>
            <span>Aliados: <strong class="num">${j.aliados.length}/${REGRA.maxAliados}</strong></span>
          </div>
          <div class="ally-list">${aliadosHtml}</div>
        </article>`;
    })
    .join('');

  const colsClass = partida.jogadores.length > 1 ? 'fronts-2' : 'fronts-1';
  return `<section class="fronts ${colsClass}">${cards}</section>`;
}

function renderCartaNaMao(
  deck: ThemeDeck,
  carta: Partida['jogadores'][number]['mao'][number],
  idx: number,
  selecionada: boolean,
): string {
  const coringa = ehCoringa(carta);
  const vermelha = !coringa && (carta.naipe === 'hearts' || carta.naipe === 'diamonds');
  const valor = valorBloqueioCarta(carta);
  const cartaTema = cartaDoTemaPorAcao(deck.cards, carta);
  const rotulo = coringa
    ? carta.coringa === 'estrela'
      ? 'Virada ★'
      : 'Crítico 💀'
    : FUNCAO_DO_NAIPE[carta.naipe].pilar.split(' ')[0];

  return `
    <div class="pcard-wrap ${selecionada ? 'is-selected' : ''}">
      <button type="button" class="pcard ${vermelha ? 'is-red' : ''} ${coringa ? 'is-joker' : ''} ${selecionada ? 'wins' : ''}" data-selecionar-carta="${idx}" aria-pressed="${selecionada}">
        <span class="pcard-corner num">${escapeHtml(codigoCarta(carta))}</span>
        <span class="pcard-pip">${coringa ? (carta.coringa === 'estrela' ? '★' : '💀') : SIMBOLO[carta.naipe]}</span>
        <span class="pcard-meta">${escapeHtml(rotulo)} · ${valor}</span>
      </button>
      ${
        cartaTema
          ? `<button type="button" class="pcard-zoom-btn" data-zoom-card-id="${escapeHtml(cartaTema.id)}" title="Ver detalhes da carta">?</button>`
          : ''
      }
    </div>`;
}

function renderAreaDeAcao(deck: ThemeDeck, partida: Partida, selectedIndices: number[]): string {
  if (partida.resultado !== null) return '';

  const quem = partida.turnoDe;
  const jogador = partida.jogadores[quem];
  if (!jogador || jogador.eliminado) return '';

  const maoHtml =
    jogador.mao.length === 0
      ? `<p class="muted">Sua mão está vazia.</p>`
      : `<div class="hand">${jogador.mao.map((c, idx) => renderCartaNaMao(deck, c, idx, selectedIndices.includes(idx))).join('')}</div>`;

  if (partida.fase === 'bloqueio') {
    const bloqueioCartas = selectedIndices
      .filter((i) => i >= 0 && i < jogador.mao.length)
      .reduce((acc, i) => acc + valorBloqueioCarta(jogador.mao[i]), 0);
    const danoFinal = Math.max(0, partida.danoPendente - bloqueioCartas);

    const escudosAliados = partida.aliadoUsadoNoTurno
      ? ''
      : jogador.aliados
          .map((a, aIdx) =>
            a.cargas > 0
              ? `<button type="button" class="btn-secondary" data-acao="bloquear" data-quem="${quem}" data-escudo-aliado="${aIdx}">🛡️ Bloquear c/ Aliado ${escapeHtml(codigoFigura(a.figura))} (+${REGRA.escudoAliado})</button>`
              : '',
          )
          .join('');

    return `
      <section class="action-zone is-blocking" aria-label="Janela de Bloqueio Tático">
        <header class="action-zone-head">
          <div>
            <span class="eyebrow">Contra-ataque da Ameaça</span>
            <h3>${escapeHtml(jogador.nome)}: defenda ${partida.danoPendente} de dano</h3>
          </div>
          <span class="chip chip-warn num">Pendente: ${partida.danoPendente} · Bloqueado: ${bloqueioCartas} · Vai perder: ${danoFinal} PV</span>
        </header>
        <p class="muted">Clique nas cartas abaixo para descartar como bloqueio (cada carta reduz o dano pelo seu valor) ou confirme sem cartas para receber o golpe nos PV.</p>
        ${maoHtml}
        <div class="threat-actions">
          <button type="button" class="btn-primary" data-acao="bloquear" data-quem="${quem}">
            ${bloqueioCartas > 0 ? `🛡️ Confirmar Bloqueio (-${danoFinal} PV)` : `💥 Receber no Corpo (-${danoFinal} PV)`}
          </button>
          ${escudosAliados}
        </div>
      </section>`;
  }

  // Fase de Ação
  const previa = simularJogada(partida, quem, selectedIndices);
  const ameaca = partida.ameacaAtiva;
  const podeAbater = previa.valida && !!ameaca;
  const danoNoHorizonte = ameaca ? danoNaAmeaca(ameaca, previa.poderTotal) : 0;
  const podeRecrutar = previa.valida && !!ameaca && previa.habilitaRecrutar && danoNoHorizonte >= ameaca.vidaAtual;
  const podeCiclar = selectedIndices.length <= REGRA.maxDescarteCiclo;

  const efeitos: string[] = [];
  if (previa.valida) {
    efeitos.push(`Poder ${previa.poderTotal} (${previa.valorBase} base${previa.bonusEspadas ? ` +${previa.bonusEspadas} ♠` : ''}${previa.bonusAfinidade ? ` +${previa.bonusAfinidade} classe` : ''})`);
    if (previa.reducaoAtaque > 0) efeitos.push(`-${previa.reducaoAtaque} Atq Ameaça (♣)`);
    if (previa.cartasComprar > 0) efeitos.push(`+${previa.cartasComprar} carta(s) (♦)`);
    if (previa.cura > 0) efeitos.push(`+${previa.cura} PV (♥)`);
    if (previa.danoRecuo > 0) efeitos.push(`-${previa.danoRecuo} PV recuo (💀)`);
  }

  const botoesPvp =
    partida.modo === 'pvp'
      ? partida.jogadores
          .map((r, rIdx) => {
            if (rIdx === quem || r.eliminado) return '';
            return `<button type="button" class="btn-secondary" data-acao="jogarCartas" data-quem="${quem}" data-alvo-rival="${rIdx}" ${previa.valida ? '' : 'disabled'}>🎯 Atacar ${escapeHtml(r.nome)} (${previa.valida ? previa.poderTotal : 0} dano)</button>`;
          })
          .join('')
      : '';

  return `
    <section class="action-zone" aria-label="Mão e Jogada do Turno">
      <header class="action-zone-head">
        <div>
          <span class="eyebrow">Fase de Ação · Turno de ${escapeHtml(jogador.nome)}</span>
          <h3>Selecione 1 carta, 2–4 iguais ou Carta + Ás</h3>
        </div>
        <button type="button" class="btn-ghost btn-sm" data-limpar-selecao ${selectedIndices.length === 0 ? 'disabled' : ''}>Limpar seleção</button>
      </header>

      ${maoHtml}

      <div class="play-preview ${previa.valida ? 'is-valid' : ''}">
        ${
          selectedIndices.length === 0
            ? `<span class="muted">Selecione cartas da sua mão para ver a prévia de poder e efeitos.</span>`
            : previa.valida
              ? `<strong>${escapeHtml(previa.tipoCombo)}</strong> · <span>${escapeHtml(efeitos.join(' · '))}</span>`
              : `<span class="outcome-derrota">${escapeHtml(previa.motivoInvalida ?? 'Combinação inválida.')}</span>`
        }
      </div>

      <div class="threat-actions">
        <button type="button" class="btn-primary" data-acao="jogarCartas" data-quem="${quem}" data-alvo="horizonte_abater" ${podeAbater ? '' : 'disabled'}>
          ⚔ Abater no Horizonte ${previa.valida ? `(${danoNoHorizonte} dano${danoNoHorizonte < previa.poderTotal ? ', blindada' : ''})` : ''}
        </button>
        <button type="button" class="btn-secondary" data-acao="jogarCartas" data-quem="${quem}" data-alvo="horizonte_recrutar" ${podeRecrutar ? '' : 'disabled'}>
          🤝 Recrutar ${podeRecrutar ? '' : '(precisa zerar a Vida e ter ♥/♦/Coringa)'}
        </button>
        ${botoesPvp}
        <button type="button" class="btn-ghost" data-acao="passarTurno" data-quem="${quem}" ${podeCiclar ? '' : 'disabled'}>
          ⏭ ${selectedIndices.length > 0 && podeCiclar ? `Reciclar ${selectedIndices.length} carta(s) e passar` : 'Passar turno'}
        </button>
      </div>
    </section>`;
}

function renderPartida(
  deck: ThemeDeck,
  partida: Partida,
  selectedIndices: number[],
  salaOnlineId: string | null,
  parceiroOnline: boolean,
): string {
  const modoLabel = partida.modo === 'solo' ? 'Solo' : partida.modo === 'coop' ? 'Cooperativo' : 'Competitivo PvP';
  const jogadorDaVez = partida.jogadores[partida.turnoDe];
  const figurasRestantes = partida.horizonteDeck.length + (partida.ameacaAtiva ? 1 : 0);
  const statusLinha = linhaDeStatus(partida);

  const bannerFim =
    partida.resultado !== null
      ? `
      <div class="result ${partida.resultado === 'vitoria' ? 'is-win' : 'is-loss'}">
        <span class="eyebrow">${partida.resultado === 'vitoria' ? 'Vitória na Zona de Conflito' : 'Derrota no Horizonte'}</span>
        <h2>${escapeHtml(partida.motivoFim)}</h2>
        <div class="inline wrap">
          <button type="button" class="btn-primary" data-acao-mesa="novaMesa">Jogar novamente</button>
          <button type="button" class="btn-secondary" data-acao-mesa="encerrarMesa">Voltar à preparação</button>
        </div>
      </div>`
      : '';

  return `
    <div class="table">
      ${salaOnlineId ? renderBarraOnline(salaOnlineId, false, parceiroOnline) : ''}

      <section class="scoreboard">
        <div>
          <span class="eyebrow">${escapeHtml(deck.name)} · Modo ${modoLabel}</span>
          <div class="score-line">
            <span class="score-big num">${12 - figurasRestantes}/12</span>
            <span class="score-of">Figuras superadas · Rodada ${partida.rodada}</span>
          </div>
          <div class="meter"><span style="width:${Math.round(((12 - figurasRestantes) / 12) * 100)}%"></span></div>
        </div>
        <div class="score-side">
          <div>Turno: <strong>${escapeHtml(jogadorDaVez?.nome ?? '—')}</strong> (${partida.fase === 'bloqueio' ? 'Bloqueio' : partida.fase === 'fim' ? 'Fim' : 'Ação'})</div>
          <div>Deck de Ação: <strong class="num">${partida.baralhoCompra.length}</strong> compra · <strong class="num">${partida.descarte.length}</strong> descarte</div>
          <div class="inline wrap">
            <button type="button" class="btn-ghost btn-sm" data-acao-mesa="copiar">Copiar status</button>
            <button type="button" class="btn-ghost btn-sm danger" data-acao-mesa="encerrarMesa">Encerrar mesa</button>
          </div>
        </div>
      </section>

      ${bannerFim}
      ${renderPainelHorizonte(deck, partida)}
      ${renderAreaDeAcao(deck, partida, selectedIndices)}
      ${renderPainelJogadores(deck, partida)}

      <div class="status-line">
        <span class="field-label">Resumo</span>
        <code>${escapeHtml(statusLinha)}</code>
      </div>

      <details class="log" open>
        <summary>Diário de Combate (${partida.diario.length} registros)</summary>
        <ol>${[...partida.diario].reverse().map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ol>
      </details>
    </div>
  `;
}
