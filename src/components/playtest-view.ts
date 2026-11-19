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
  golpeDerruba,
  pontuacaoSolo,
  REGRA_CHEFE,
  EXPLICACAO_PONTUACAO,
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
import { ehCartaOculta, type PreparoSala } from '../core/online-sync';
import { lerRecordeSolo, syncEstadoDoMundo } from '../core/storage';
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

export interface ContextoOnlineMesa {
  salaId: string | null;
  conectando: boolean;
  ehHost: boolean;
  meuAssento: number | null;
  assentosConectados: boolean[];
  totalConectados: number;
}

const CONTEXTO_OFFLINE: ContextoOnlineMesa = {
  salaId: null,
  conectando: false,
  ehHost: false,
  meuAssento: null,
  assentosConectados: [],
  totalConectados: 0,
};

export function renderPlaytestTableHtml(
  deck: ThemeDeck,
  partida: Partida | null,
  preparo: PreparacaoMesa,
  selectedIndices: number[] = [],
  online: ContextoOnlineMesa = CONTEXTO_OFFLINE,
): string {
  if (partida) {
    return renderPartida(deck, partida, selectedIndices, online);
  }
  return renderPreparacao(deck, preparo, online);
}

// ---------- Barra Online ----------

function renderBarraOnline(online: ContextoOnlineMesa, totalAssentos: number): string {
  if (online.salaId) {
    const papel = online.ehHost ? 'Anfitrião' : 'Convidado';
    const prontos = online.totalConectados >= 2;
    return `
      <div class="online-sync-bar">
        <span class="chip chip-ok">● Sala online · ${papel}</span>
        <span>Código: <strong class="num">${escapeHtml(online.salaId)}</strong></span>
        <span class="chip ${prontos ? 'chip-ok' : 'chip-warn'}">${online.totalConectados}/${totalAssentos} conectado${online.totalConectados === 1 ? '' : 's'}</span>
        <button type="button" class="btn-secondary btn-sm" data-acao-online="copiarLink">Copiar link da mesa</button>
        <button type="button" class="btn-ghost btn-sm danger" data-acao-online="desconectar">Sair da sala</button>
      </div>`;
  }

  return `
    <section class="online-room-card" aria-label="Modo local ou sala online">
      <div class="online-room-head">
        <span class="chip">Mesa local pronta</span>
        <strong>Jogue aqui no navegador ou crie uma Sala Online P2P com mão privada</strong>
      </div>
      <div class="room-gate-grid spaced-sm">
        <div class="inline wrap">
          <button type="button" class="btn-secondary btn-sm" data-acao-online="criar" ${online.conectando ? 'disabled' : ''}>
            ${online.conectando ? 'Criando sala...' : 'Criar sala online P2P'}
          </button>
        </div>
        <div class="inline wrap">
          <input type="text" maxlength="120" placeholder="Código ou link da sala" data-campo-sala aria-label="Código ou link da sala" ${online.conectando ? 'disabled' : ''} />
          <button type="button" class="btn-secondary btn-sm" data-acao-online="entrar" ${online.conectando ? 'disabled' : ''}>
            ${online.conectando ? 'Conectando...' : 'Entrar em sala'}
          </button>
        </div>
      </div>
    </section>`;
}

// ---------- Preparação ----------

function renderEscolhaDeJogador(
  j: { nome: string; classe: Naipe },
  i: number,
  online: ContextoOnlineMesa,
): string {
  const emSala = Boolean(online.salaId);
  const ehMeu = emSala && online.meuAssento === i;
  const ocupado = emSala && Boolean(online.assentosConectados[i]);
  const podeEditar = !emSala || ehMeu || (online.ehHost && !ocupado);
  const podeAssumir = emSala && !online.ehHost && !ehMeu && !ocupado;

  const badgeAssento = !emSala
    ? ''
    : ehMeu
      ? `<span class="chip chip-ok">${online.ehHost ? 'Você · Anfitrião' : 'Você'}</span>`
      : ocupado
        ? `<span class="chip chip-ok">● Conectado</span>`
        : `<span class="chip">Vaga livre</span>`;

  const tiles = NAIPES.map(
    (n) => `
      <button type="button" class="class-tile suit-${n} ${j.classe === n ? 'is-active' : ''}" data-classe="${n}" data-jogador="${i}" ${podeEditar ? '' : 'disabled'}>
        <span class="class-suit">${SIMBOLO[n]}</span>
        <span class="class-name">${CLASSES[n].nome}</span>
        <span class="class-vocation">${FUNCAO_DO_NAIPE[n].pilar}</span>
        <span class="class-power">${CLASSES[n].descricao}</span>
      </button>`,
  ).join('');

  return `
    <div class="setup-player ${ehMeu ? 'is-my-seat' : ''}">
      <div class="setup-player-head">
        <span class="field-label">Jogador ${i + 1}</span>
        <div class="inline wrap">
          ${badgeAssento}
          ${podeAssumir ? `<button type="button" class="btn-secondary btn-sm" data-ocupar-assento="${i}">Assumir vaga</button>` : ''}
        </div>
      </div>
      <label class="field">
        <input type="text" maxlength="28" value="${escapeHtml(j.nome)}" data-nome-jogador="${i}" placeholder="Nome do sobrevivente" ${podeEditar ? '' : 'disabled'} />
      </label>
      <div class="class-grid">${tiles}</div>
    </div>`;
}

function renderPreparacao(deck: ThemeDeck, preparo: PreparacaoMesa, online: ContextoOnlineMesa): string {
  const nuance = NUANCES_DO_TEMA[deck.id] ?? NUANCES_DO_TEMA.wasteland;
  const estadoSalvo = syncEstadoDoMundo(deck.id, null);
  const emSala = Boolean(online.salaId);
  const podeControlarSala = !emSala || online.ehHost;
  const jogadoresHtml = preparo.jogadores.map((j, i) => renderEscolhaDeJogador(j, i, online)).join('');
  const modosHtml = MODOS.map(
    (m) => `
      <button type="button" class="mode-tile ${preparo.modo === m.id ? 'is-active' : ''}" data-modo-mesa="${m.id}" ${podeControlarSala && !(emSala && m.id === 'solo') ? '' : 'disabled'}>
        <strong>${m.titulo}</strong>
        <span class="muted">${m.resumo}</span>
      </button>`,
  ).join('');

  return `
    <section class="setup">
      ${renderBarraOnline(online, preparo.jogadores.length)}

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
          <p><strong>Regra do chefe · ${escapeHtml(REGRA_CHEFE[deck.chefe.regra].nome)}:</strong> a última Figura do Horizonte ganha esta regra. ${escapeHtml(REGRA_CHEFE[deck.chefe.regra].descricao)}</p>
        </div>
      </div>

      <div class="mode-grid" role="group" aria-label="Modo de jogo">
        ${modosHtml}
      </div>

      <div class="mode-grid" role="group" aria-label="Nível de dificuldade">
        ${(Object.keys(NIVEIS) as Nivel[])
          .map(
            (n) => `
          <button type="button" class="mode-tile ${preparo.nivel === n ? 'is-active' : ''}" data-nivel-mesa="${n}" ${podeControlarSala ? '' : 'disabled'}>
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
              <button type="button" class="btn-ghost btn-sm" data-acao-mesa="menosPessoa" ${!podeControlarSala || preparo.jogadores.length <= 2 ? 'disabled' : ''}>Remover</button>
              <button type="button" class="btn-secondary btn-sm" data-acao-mesa="maisPessoa" ${!podeControlarSala || preparo.jogadores.length >= REGRA.maxPessoas ? 'disabled' : ''}>+ Adicionar jogador</button>
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
        ${
          podeControlarSala
            ? `<button type="button" class="btn-primary btn-lg" data-acao-mesa="comecar">Embaralhar e começar partida</button>`
            : `<p class="muted">Escolha seu nome e classe acima. Aguardando o anfitrião iniciar a partida...</p>`
        }
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
        ${
          ameaca.chefe
            ? `<p><span class="chip chip-strong">Chefe · ${escapeHtml(REGRA_CHEFE[ameaca.chefe].nome)}</span> ${escapeHtml(REGRA_CHEFE[ameaca.chefe].descricao)}</p>`
            : ''
        }

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

function renderPainelJogadores(deck: ThemeDeck, partida: Partida, online: ContextoOnlineMesa): string {
  const emSala = Boolean(online.salaId);
  const podeUsarAliado = partida.fase === 'acao' && !partida.aliadoUsadoNoTurno && partida.resultado === null;

  const cards = partida.jogadores
    .map((j, idx) => {
      const ativo = idx === partida.turnoDe && partida.resultado === null;
      const ehMeu = emSala && online.meuAssento === idx;
      const podeControlar = ativo && (!emSala || ehMeu);
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
                if (podeControlar && podeUsarAliado && a.cargas > 0) {
                  if (a.figura.naipe === 'spades' && partida.modo === 'pvp' && partida.rodada >= 2) {
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
              <h3>
                ${escapeHtml(j.nome)}
                ${ehMeu ? '<span class="chip">Você</span>' : ''}
                ${ativo ? `<span class="chip chip-ok">${ehMeu || !emSala ? 'Sua vez' : 'Jogando'}</span>` : ''}
                ${j.eliminado ? '<span class="chip chip-off">Eliminado</span>' : ''}
              </h3>
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
  podeSelecionar: boolean,
): string {
  if (ehCartaOculta(carta)) {
    return `<div class="hand-card-wrap is-hidden"><div class="hand-card-back" aria-label="Carta oculta">HORIZONTE</div></div>`;
  }

  const cartaTema = cartaDoTemaPorAcao(deck.cards, carta);
  const codigo = codigoCarta(carta);

  if (cartaTema) {
    return `
      <div class="hand-card-wrap ${selecionada ? 'is-selected' : ''} ${podeSelecionar ? '' : 'is-locked'}">
        <div
          class="hand-card-trigger"
          role="button"
          tabindex="0"
          ${podeSelecionar ? `data-selecionar-carta="${idx}"` : `data-zoom-card-id="${escapeHtml(cartaTema.id)}"`}
          data-hand-card-id="${escapeHtml(cartaTema.id)}"
          data-hand-idx="${idx}"
          aria-pressed="${selecionada}"
          aria-label="${podeSelecionar ? 'Selecionar' : 'Ampliar'} ${escapeHtml(cartaTema.title)} (${escapeHtml(codigo)})"
        >
          ${renderMagicCardHtml(cartaTema, {
            interactive: true,
            selected: selecionada,
            title: podeSelecionar
              ? selecionada
                ? 'Clique para desmarcar (ou segure para ampliar)'
                : 'Clique para selecionar (ou segure para ampliar)'
              : 'Clique para ampliar',
          })}
        </div>
        <button
          type="button"
          class="hand-card-zoom"
          data-zoom-card-id="${escapeHtml(cartaTema.id)}"
          data-zoom-hand-idx="${idx}"
          title="Ampliar carta"
          aria-label="Ampliar ${escapeHtml(cartaTema.title)}"
        >?</button>
      </div>`;
  }

  const coringa = ehCoringa(carta);
  const vermelha = !coringa && (carta.naipe === 'hearts' || carta.naipe === 'diamonds');
  const valor = valorBloqueioCarta(carta);
  const rotulo = coringa
    ? carta.coringa === 'estrela'
      ? 'Virada ★'
      : 'Crítico 💀'
    : FUNCAO_DO_NAIPE[carta.naipe].pilar.split(' ')[0];

  return `
    <div class="pcard-wrap ${selecionada ? 'is-selected' : ''}">
      <button type="button" class="pcard ${vermelha ? 'is-red' : ''} ${coringa ? 'is-joker' : ''} ${selecionada ? 'wins' : ''}" data-selecionar-carta="${idx}" aria-pressed="${selecionada}" ${podeSelecionar ? '' : 'disabled'}>
        <span class="pcard-corner num">${escapeHtml(codigo)}</span>
        <span class="pcard-pip">${coringa ? (carta.coringa === 'estrela' ? '★' : '💀') : SIMBOLO[carta.naipe]}</span>
        <span class="pcard-meta">${escapeHtml(rotulo)} · ${valor}</span>
      </button>
    </div>`;
}

function renderAreaDeAcao(
  deck: ThemeDeck,
  partida: Partida,
  selectedIndices: number[],
  online: ContextoOnlineMesa,
): string {
  if (partida.resultado !== null) return '';

  const emSala = Boolean(online.salaId);
  const jogadorDaVez = partida.jogadores[partida.turnoDe];
  if (emSala && online.meuAssento === null) {
    return `
      <section class="action-zone is-waiting" aria-label="Modo espectador">
        <span class="eyebrow">Sala online · Espectador</span>
        <h3>Acompanhando o turno de ${escapeHtml(jogadorDaVez?.nome ?? '—')}</h3>
        <p class="muted">As mãos ficam ocultas para espectadores. Aguarde a próxima partida para assumir uma vaga.</p>
      </section>`;
  }

  const quemMao = emSala && online.meuAssento !== null ? online.meuAssento : partida.turnoDe;
  const ehMinhaVez = !emSala || online.meuAssento === partida.turnoDe;
  const jogador = partida.jogadores[quemMao];
  if (!jogador || jogador.eliminado) {
    return emSala
      ? `<section class="action-zone is-waiting"><span class="eyebrow">Eliminado</span><h3>Você foi eliminado · Turno de ${escapeHtml(jogadorDaVez?.nome ?? '—')}</h3></section>`
      : '';
  }

  const indicesAtivos = ehMinhaVez ? selectedIndices : [];
  const maoHtml =
    jogador.mao.length === 0
      ? `<p class="muted">Sua mão está vazia.</p>`
      : `<div class="hand">${jogador.mao.map((c, idx) => renderCartaNaMao(deck, c, idx, indicesAtivos.includes(idx), ehMinhaVez)).join('')}</div>`;

  if (!ehMinhaVez) {
    return `
      <section class="action-zone is-waiting" aria-label="Sua mão (aguardando turno)">
        <header class="action-zone-head">
          <div>
            <span class="eyebrow">Sua mão privada · Aguardando ${escapeHtml(jogadorDaVez?.nome ?? 'outro jogador')}</span>
            <h3>${partida.fase === 'bloqueio' ? `${escapeHtml(jogadorDaVez?.nome ?? '')} está defendendo ${partida.danoPendente} de dano` : `Aguardando turno de ${escapeHtml(jogadorDaVez?.nome ?? '')}...`}</h3>
          </div>
          <span class="chip">Toque em uma carta para ler</span>
        </header>
        ${maoHtml}
      </section>`;
  }

  const quem = partida.turnoDe;

  if (partida.fase === 'bloqueio') {
    const bloqueioCartas = indicesAtivos
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
        <p class="muted">Toque nas cartas para descartar como bloqueio (ou em <strong>?</strong> / segure para ampliar).</p>
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
  const previa = simularJogada(partida, quem, indicesAtivos);
  const ameaca = partida.ameacaAtiva;
  const podeAbater = previa.valida && !!ameaca;
  const danoNoHorizonte = ameaca ? danoNaAmeaca(ameaca, previa.poderTotal) : 0;
  const podeRecrutar = previa.valida && !!ameaca && previa.habilitaRecrutar && golpeDerruba(ameaca, previa.poderTotal);
  const podeCiclar = indicesAtivos.length <= REGRA.maxDescarteCiclo;

  const efeitos: string[] = [];
  if (previa.valida) {
    efeitos.push(`Poder ${previa.poderTotal} (${previa.valorBase} base${previa.bonusEspadas ? ` +${previa.bonusEspadas} ♠` : ''}${previa.bonusAfinidade ? ` +${previa.bonusAfinidade} classe` : ''})`);
    if (previa.reducaoAtaque > 0) efeitos.push(`-${previa.reducaoAtaque} Atq Ameaça (♣)`);
    if (previa.cartasComprar > 0) efeitos.push(`+${previa.cartasComprar} carta(s) (♦)`);
    if (previa.cura > 0) efeitos.push(`+${previa.cura} PV (♥)`);
    if (previa.danoRecuo > 0) efeitos.push(`-${previa.danoRecuo} PV recuo (💀)`);
  }

  const treguaPvp = partida.modo === 'pvp' && partida.rodada < 2;
  const danoRivalPvp = previa.valida ? Math.ceil(previa.poderTotal / 2) : 0;
  const danoAmeacaPvp = previa.valida && ameaca ? danoNaAmeaca(ameaca, Math.floor(previa.poderTotal / 2)) : 0;
  const botoesPvp =
    partida.modo === 'pvp'
      ? partida.jogadores
          .map((r, rIdx) => {
            if (rIdx === quem || r.eliminado) return '';
            if (treguaPvp) {
              return `<button type="button" class="btn-secondary" data-acao="jogarCartas" data-quem="${quem}" data-alvo-rival="${rIdx}" disabled title="Trégua na Rodada 1: ataques a rivais liberam na Rodada 2">🕊️ Atacar ${escapeHtml(r.nome)} (Trégua na Rodada 1)</button>`;
            }
            return `<button type="button" class="btn-secondary" data-acao="jogarCartas" data-quem="${quem}" data-alvo-rival="${rIdx}" ${previa.valida ? '' : 'disabled'}>🎯 Atacar ${escapeHtml(r.nome)} (${danoRivalPvp} rival + ${danoAmeacaPvp} Ameaça)</button>`;
          })
          .join('')
      : '';

  return `
    <section class="action-zone" aria-label="Mão e Jogada do Turno">
      <header class="action-zone-head">
        <div>
          <span class="eyebrow">Fase de Ação · ${emSala ? 'Sua vez' : `Turno de ${escapeHtml(jogador.nome)}`}</span>
          <h3>Selecione 1 carta, 2–4 iguais ou Carta + Ás</h3>
        </div>
        <button type="button" class="btn-ghost btn-sm" data-limpar-selecao ${indicesAtivos.length === 0 ? 'disabled' : ''}>Limpar seleção</button>
      </header>

      ${maoHtml}

      <div class="play-preview ${previa.valida ? 'is-valid' : ''}">
        ${
          indicesAtivos.length === 0
            ? `<span class="muted">Toque nas cartas para selecionar · toque em <strong>?</strong> ou segure para ampliar.</span>`
            : previa.valida
              ? `<strong>${escapeHtml(previa.tipoCombo)}</strong> · <span>${escapeHtml(efeitos.join(' · '))}</span>`
              : `<span class="outcome-derrota">${escapeHtml(previa.motivoInvalida ?? 'Combinação inválida.')}</span>`
        }
      </div>

      <div class="threat-actions">
        <button type="button" class="btn-primary" data-acao="jogarCartas" data-quem="${quem}" data-alvo="horizonte_abater" ${podeAbater ? '' : 'disabled'}>
          ⚔ Abater no Horizonte ${previa.valida ? `(${danoNoHorizonte} dano${danoNoHorizonte < previa.poderTotal ? ', reduzido' : ''})` : ''}
        </button>
        <button type="button" class="btn-secondary" data-acao="jogarCartas" data-quem="${quem}" data-alvo="horizonte_recrutar" ${podeRecrutar ? '' : 'disabled'}>
          🤝 Recrutar ${podeRecrutar ? '' : '(precisa zerar a Vida e ter ♥/♦/Coringa)'}
        </button>
        ${botoesPvp}
        <button type="button" class="btn-ghost" data-acao="passarTurno" data-quem="${quem}" ${podeCiclar ? '' : 'disabled'}>
          ⏭ ${indicesAtivos.length > 0 && podeCiclar ? `Reciclar ${indicesAtivos.length} carta(s) e passar` : 'Passar turno'}
        </button>
      </div>
    </section>`;
}

function renderRecordeSolo(partida: Partida): string {
  const nivel = partida.nivel ?? 'veterano';
  const pontos = pontuacaoSolo(partida);
  const recorde = lerRecordeSolo(nivel);
  const frase = recorde === null || pontos >= recorde ? 'Novo recorde!' : `Recorde: ${recorde}.`;
  return `<p>Nível ${NIVEIS[nivel].nome} · ${frase} ${escapeHtml(EXPLICACAO_PONTUACAO)}</p>`;
}

function renderPartida(
  deck: ThemeDeck,
  partida: Partida,
  selectedIndices: number[],
  online: ContextoOnlineMesa,
): string {
  const emSala = Boolean(online.salaId);
  const podeControlarSala = !emSala || online.ehHost;
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
        ${partida.modo === 'solo' ? renderRecordeSolo(partida) : ''}
        <div class="inline wrap">
          ${podeControlarSala ? `<button type="button" class="btn-primary" data-acao-mesa="novaMesa">Jogar novamente</button>` : ''}
          ${podeControlarSala ? `<button type="button" class="btn-secondary" data-acao-mesa="encerrarMesa">Voltar à preparação</button>` : '<span class="muted">Aguardando o anfitrião iniciar uma nova partida...</span>'}
        </div>
      </div>`
      : '';

  return `
    <div class="table">
      ${emSala ? renderBarraOnline(online, partida.jogadores.length) : ''}

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
            ${podeControlarSala ? `<button type="button" class="btn-ghost btn-sm danger" data-acao-mesa="encerrarMesa">Encerrar mesa</button>` : ''}
          </div>
        </div>
      </section>

      ${bannerFim}
      ${renderPainelHorizonte(deck, partida)}
      ${renderAreaDeAcao(deck, partida, selectedIndices, online)}
      ${renderPainelJogadores(deck, partida, online)}

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
