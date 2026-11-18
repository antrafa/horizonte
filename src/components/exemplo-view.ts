import {
  ataqueEfetivoAmeaca,
  type CartaAcao,
  CLASSES,
  codigoCarta,
  codigoFigura,
  ehCoringa,
  FUNCAO_DO_NAIPE,
  type Partida,
  pontosDeDominio,
  REGRA,
  REGRA_CHEFE,
  SIMBOLO,
  STATUS_FIGURA,
  TRACO_AMEACA,
  valorBloqueioCarta,
} from '../core/partida';
import { type CenaExemploRenderizada, encenarExemplo, type ExemploEncenado } from '../data/partida-exemplo';
import type { ThemeDeck } from '../types/card';
import { cartaDoTemaPorAcao, cartaDoTemaPorFigura, escapeHtml, renderMagicCardHtml } from './card-renderer';

interface Minuto {
  titulo: string;
  faca: string;
  pronto: string;
}

let exemploEmCache: ExemploEncenado | null = null;

function obterExemploEncenado(): ExemploEncenado {
  if (!exemploEmCache) {
    exemploEmCache = encenarExemplo();
  }
  return exemploEmCache;
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
      faca: 'Embaralhe os 4 Reis embaixo, as 4 Damas no meio e os 4 Valetes no topo. Só a 12ª e última carta (o último Rei) vira o Chefe. Abra a 1ª Figura no centro.',
      pronto: `uma Ameaça inicial revelada (${STATUS_FIGURA.J.vida} PV · ${STATUS_FIGURA.J.ataque} Atq base + traço do naipe).`,
    },
    {
      titulo: 'Prepare sua Zona',
      faca: `Escolha o modo (Solo, Coop ou PvP), escolha 1 naipe de Especialização (ela reforça o efeito daquele naipe ao jogar), marque ${REGRA.vidaInicial} PV e compre ${REGRA.maoInicial} cartas.`,
      pronto: `${REGRA.maoInicial} cartas na mão (máx. ${REGRA.maoMaxima}) e ${REGRA.vidaInicial} PV marcados.`,
    },
    {
      titulo: 'Jogue e Combine',
      faca: `Antes da jogada, pode gastar 1 uso de Aliado. Depois jogue 1 carta, 2–4 iguais ou Carta + Ás (+${REGRA.bonusAsCombo}). Qualquer naipe ataca qualquer Figura; ♥/♦/Coringa no golpe final permitem Recrutar.`,
      pronto: 'os efeitos dos naipes entram na hora.',
    },
    {
      titulo: 'Bloqueie pelo Valor e Compre +1',
      faca: `Se a Figura central sobreviveu, ela contra-ataca. Descarte quantas cartas quiser para bloquear pelo VALOR NUMÉRICO delas (não 1 ponto por carta). No fim do turno, compre só +${REGRA.compraFimTurno} carta (não volta a 5).`,
      pronto: `vez do próximo jogador — até o chefe ${escapeHtml(deck.chefe.nome)} cair!`,
    },
  ];
}

function renderGuiasRapidosHtml(deck: ThemeDeck): string {
  const chefeRegra = REGRA_CHEFE[deck.chefe.regra];
  return `
    <div class="quick-guide-grid" aria-label="Cards de guia rápido para não esquecer na partida">
      <article class="quick-guide-card">
        <header class="quick-guide-head">
          <span class="eyebrow">Card de Guia Rápido 1</span>
          <h3>Bloqueio &amp; Quando Comprar Cartas</h3>
        </header>
        <dl class="glossary quick-guide-list">
          <dt>Valor no bloqueio</dt>
          <dd><strong>Vale o número da carta, não 1 ponto por carta:</strong> <code>2</code>–<code>10</code> bloqueiam o próprio número; <code>A</code> = ${REGRA.valorAsSolo}; <code>★</code> = ${REGRA.valorEstrela}; <code>💀</code> = ${REGRA.valorCaveira}. Descartar um <code>7♠</code> bloqueia 7 de dano.</dd>

          <dt>Bloquear c/ mão toda?</dt>
          <dd><strong>Sim, pode</strong> descartar quantas cartas quiser — até a mão inteira (salvo contra o chefe <em>Portas Seladas</em>, que limita a 1 carta). <strong>Mas atenção:</strong> a compra vem <em>depois</em> e dá <strong>só +${REGRA.compraFimTurno} carta</strong>. Torrar a mão deixa você com 1 carta no turno seguinte.</dd>

          <dt>Quando compro?</dt>
          <dd>
            <ul class="quick-guide-bullets">
              <li><strong>Preparação:</strong> ${REGRA.maoInicial} cartas iniciais (limite na mão: <strong>${REGRA.maoMaxima} cartas</strong>, ou 3 na <em>Detenção</em>).</li>
              <li><strong>Fim do seu turno (Passo 4):</strong> compra fixa de <strong>+${REGRA.compraFimTurno} carta</strong> — sempre, tenha derrotado ou bloqueado a Ameaça.</li>
              <li><strong>Bônus na hora:</strong> jogar <code>♦</code> (+1, ou +2 se valor base ≥ 7; +1 se Engenheiro), <code>★</code> (+2), usar Aliado <code>♦</code> (+1/+2/+3) ou <strong>Abater</strong> Figura (+1 no J, +2 na Q/K — <em>Recrutar não dá compra de abate</em>).</li>
            </ul>
          </dd>
        </dl>
      </article>

      <article class="quick-guide-card">
        <header class="quick-guide-head">
          <span class="eyebrow">Card de Guia Rápido 2</span>
          <h3>Naipe nas Figuras, Aliados &amp; Chefe</h3>
        </header>
        <dl class="glossary quick-guide-list">
          <dt>Como Ameaça (Traço)</dt>
          <dd>
            O naipe da Figura dá um <strong>traço passivo</strong> que cresce em <strong>J · Q · K</strong> (qualquer naipe pode atacá-la e abater; só <em>Recrutar</em> exige ♥/♦/★/💀):
            <ul class="quick-guide-bullets">
              <li><strong>♠ Feroz:</strong> +${STATUS_FIGURA.J.ferocidade}/+${STATUS_FIGURA.Q.ferocidade}/+${STATUS_FIGURA.K.ferocidade} Atq já somado (bate com 5 · 8 · 11).</li>
              <li><strong>♥ Regenera:</strong> cura +${STATUS_FIGURA.J.regeneracao}/+${STATUS_FIGURA.Q.regeneracao}/+${STATUS_FIGURA.K.regeneracao} PV no fim do turno se sobreviver.</li>
              <li><strong>♦ Blindada:</strong> todo golpe nela causa −${STATUS_FIGURA.J.blindagem}/−${STATUS_FIGURA.Q.blindagem}/−${STATUS_FIGURA.K.blindagem} de dano (também Aliado).</li>
              <li><strong>♣ Imune:</strong> nada reduz o ataque dela (♣, ★ e Aliado ♣ falham).</li>
            </ul>
          </dd>

          <dt>Como Aliado</dt>
          <dd>Entra com <strong>2 usos (J/Q)</strong> ou <strong>3 usos (K)</strong>; máx. <strong>${REGRA.maxAliados} Aliados</strong> (o 3º manda o mais antigo para Troféus pela metade dos pontos: 5/7/12). É <strong>1 uso de Aliado por turno</strong>: ative o poder do naipe no Passo 1 (<code>♠</code> 2/4/6 dano · <code>♣</code> −2/−4/−6 Atq · <code>♦</code> +1/+2/+3 cartas · <code>♥</code> +2/+4/+6 PV) <strong>OU</strong> gaste no Passo 3 como <strong>Escudo (+${REGRA.escudoAliado})</strong>. Ao zerar os usos, vira Troféu pela metade.</dd>

          <dt>Regra do Chefe</dt>
          <dd>Vale <strong>só para a 12ª e última Figura</strong> (o último Rei, no fundo da 3ª onda), somando ao traço do naipe dele. Em ${escapeHtml(deck.name)}: <strong>${escapeHtml(chefeRegra.nome)}</strong> — ${escapeHtml(chefeRegra.descricao)}</dd>
        </dl>
      </article>
    </div>`;
}

function renderCartaMiniExemplo(deck: ThemeDeck, carta: CartaAcao, nova = false): string {
  const coringa = ehCoringa(carta);
  const vermelha = !coringa && (carta.naipe === 'hearts' || carta.naipe === 'diamonds');
  const valor = valorBloqueioCarta(carta);
  const cartaTema = cartaDoTemaPorAcao(deck.cards, carta);
  const rotulo = coringa
    ? carta.coringa === 'estrela'
      ? 'Virada ★'
      : 'Crítico 💀'
    : FUNCAO_DO_NAIPE[carta.naipe].pilar.split(' ')[0];

  const conteudo = `
    <span class="pcard-corner num">${escapeHtml(codigoCarta(carta))}</span>
    <span class="pcard-pip">${coringa ? (carta.coringa === 'estrela' ? '★' : '💀') : SIMBOLO[carta.naipe]}</span>
    <span class="pcard-meta">${escapeHtml(rotulo)} · ${valor}</span>
    ${nova ? '<span class="exemplo-card-badge">NOVA</span>' : ''}`;

  const classes = `pcard exemplo-pcard ${vermelha ? 'is-red' : ''} ${coringa ? 'is-joker' : ''} ${nova ? 'is-drawn' : ''}`;

  if (cartaTema) {
    return `
      <button type="button" class="${classes}" data-zoom-card-id="${escapeHtml(cartaTema.id)}" title="Clique para ampliar ${escapeHtml(cartaTema.title)}">
        ${conteudo}
      </button>`;
  }

  return `<div class="${classes}">${conteudo}</div>`;
}

function cartasMovidasNoPasso(cena: CenaExemploRenderizada): { cartas: CartaAcao[]; rotulo: string } {
  const acao = cena.passo.acao;
  const jogadorAntes = cena.antes.jogadores[acao.quem];
  if (acao.tipo === 'jogarCartas') {
    return {
      cartas: acao.indicesMao.map((idx) => jogadorAntes.mao[idx]).filter(Boolean),
      rotulo: 'Cartas jogadas neste lance',
    };
  }
  if (acao.tipo === 'bloquear') {
    const cartas = acao.indicesMao.map((idx) => jogadorAntes.mao[idx]).filter(Boolean);
    return {
      cartas,
      rotulo: cartas.length > 0 ? 'Carta descartada no bloqueio' : 'Bloqueio escolhido',
    };
  }
  return { cartas: [], rotulo: 'Habilidade de Aliado ativada' };
}

function renderSpotlightHtml(deck: ThemeDeck, encenado: ExemploEncenado, passoAtual: number): string {
  const totalPassos = encenado.passos.length;
  if (passoAtual === 0) {
    const ameaca = encenado.inicial.ameacaAtiva;
    const cod = ameaca ? codigoFigura(ameaca.figura) : 'J♠';
    return `
      <article class="exemplo-spotlight">
        <div class="exemplo-spotlight-head">
          <div>
            <span class="eyebrow">Setup Inicial · Mesa Pronta para o Turno 1</span>
            <h3>Mara e Kael entram na Zona de Conflito (PvPvE)</h3>
          </div>
          <span class="chip chip-strong num">Passo 0 de ${totalPassos}</span>
        </div>
        <p>Cada sobrevivente começa com <strong>${REGRA.vidaInicial} PV</strong>, <strong>${REGRA.maoInicial} cartas</strong> na mão e uma Especialização de naipe (Mara = <strong>♠ Atirador</strong>; Kael = <strong>♥ Médico</strong>). No centro, o Horizonte revela <strong>${escapeHtml(cod)}</strong> com 12 PV e 5 de Ataque (4 base + 1 do traço passivo <em>♠ Feroz</em>).</p>
        <div class="exemplo-xray">
          <strong>Como navegar:</strong> clique em <strong>Próximo lance →</strong> (ou em qualquer etapa acima/abaixo) para ver na mesa as mãos, os PV, a vida da Ameaça e o Aliado mudando a cada decisão.
        </div>
      </article>`;
  }

  const cena = encenado.passos[passoAtual - 1];
  const movidas = cartasMovidasNoPasso(cena);
  const novosRegistros = cena.depois.diario.slice(cena.antes.diario.length);

  let visualAcaoHtml = '';
  if (movidas.cartas.length > 0) {
    visualAcaoHtml = `
      <div class="exemplo-played-cards">
        <span class="field-label">${escapeHtml(movidas.rotulo)}</span>
        <div class="exemplo-mini-hand">${movidas.cartas.map((c) => renderCartaMiniExemplo(deck, c)).join('')}</div>
      </div>`;
  } else if (cena.passo.acao.tipo === 'bloquear') {
    visualAcaoHtml = `
      <div class="exemplo-played-cards">
        <span class="field-label">${escapeHtml(movidas.rotulo)}</span>
        <span class="chip chip-warn">💥 Recebeu no Corpo (0 cartas descartadas)</span>
      </div>`;
  } else if (cena.passo.acao.tipo === 'usarAliado') {
    const aliado = cena.antes.jogadores[cena.passo.acao.quem].aliados[cena.passo.acao.indiceAliado];
    visualAcaoHtml = `
      <div class="exemplo-played-cards">
        <span class="field-label">${escapeHtml(movidas.rotulo)}</span>
        <span class="chip chip-ok">⚡ ${aliado ? escapeHtml(codigoFigura(aliado.figura)) : 'Aliado'} ativado no Passo 1 (2 → 1 uso)</span>
      </div>`;
  }

  return `
    <article class="exemplo-spotlight">
      <div class="exemplo-spotlight-head">
        <div>
          <span class="eyebrow">${escapeHtml(cena.passo.hora)} · Vez de ${escapeHtml(cena.passo.quem)}</span>
          <h3>${escapeHtml(cena.passo.titulo)}</h3>
        </div>
        <span class="chip chip-strong num">Lance ${passoAtual} de ${totalPassos}</span>
      </div>
      <div class="exemplo-spotlight-body">
        <div class="exemplo-spotlight-copy">
          <p>${escapeHtml(cena.passo.narrativa)}</p>
          <div class="exemplo-xray">
            <strong>Por que funciona assim:</strong> ${escapeHtml(cena.passo.notaMecanica)}
          </div>
          ${
            novosRegistros.length > 0
              ? `<ul class="exemplo-log-delta">${novosRegistros.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
              : ''
          }
        </div>
        ${visualAcaoHtml}
      </div>
    </article>`;
}

function renderAmeacaExemploHtml(deck: ThemeDeck, antes: Partida, depois: Partida, emPasso: boolean): string {
  const ameaca = depois.ameacaAtiva;
  if (!ameaca) return '';

  const cartaTema = cartaDoTemaPorFigura(deck.cards, ameaca.figura);
  const st = STATUS_FIGURA[ameaca.figura.posto];
  const ondaLabel = ameaca.figura.posto === 'J' ? 'Onda 1' : ameaca.figura.posto === 'Q' ? 'Onda 2' : 'Onda 3';
  const ataqueEfetivo = ataqueEfetivoAmeaca(ameaca);
  const pctVida = Math.max(0, Math.min(100, Math.round((ameaca.vidaAtual / ameaca.vidaMax) * 100)));

  const ameacaAntes = antes.ameacaAtiva;
  const mesmaFigura =
    emPasso &&
    ameacaAntes &&
    ameacaAntes.figura.posto === ameaca.figura.posto &&
    ameacaAntes.figura.naipe === ameaca.figura.naipe;

  let deltaVidaChip = '';
  if (emPasso && mesmaFigura && ameacaAntes && ameaca.vidaAtual !== ameacaAntes.vidaAtual) {
    const diff = ameaca.vidaAtual - ameacaAntes.vidaAtual;
    deltaVidaChip = `<span class="chip chip-warn exemplo-delta num">${ameacaAntes.vidaAtual} → ${ameaca.vidaAtual} PV (${diff})</span>`;
  } else if (emPasso && (!ameacaAntes || !mesmaFigura)) {
    deltaVidaChip = `<span class="chip chip-ok exemplo-delta">Nova Ameaça revelada!</span>`;
  }

  return `
    <section class="horizon-panel exemplo-horizon" aria-label="Ameaça Central neste momento">
      <div class="horizon-card-slot">
        ${
          cartaTema
            ? renderMagicCardHtml(cartaTema, { interactive: true })
            : `<div class="threat-card"><strong>${escapeHtml(codigoFigura(ameaca.figura))}</strong></div>`
        }
      </div>
      <div class="horizon-stats">
        <div class="horizon-head">
          <span class="chip chip-strong">${ondaLabel} · ${st.rotulo}</span>
          <span class="chip">Horizonte: ${depois.horizonteDeck.length + 1}/4 do exemplo</span>
          ${cartaTema ? `<button type="button" class="btn-ghost btn-sm" data-zoom-card-id="${escapeHtml(cartaTema.id)}">Ampliar ${escapeHtml(cartaTema.playingCardCode)}</button>` : ''}
        </div>
        <h3>${escapeHtml(cartaTema?.title ?? codigoFigura(ameaca.figura))} <span class="muted">${escapeHtml(codigoFigura(ameaca.figura))}</span></h3>
        <p><span class="chip chip-strong">Traço ${TRACO_AMEACA[ameaca.figura.naipe].nome}</span> ${escapeHtml(TRACO_AMEACA[ameaca.figura.naipe].descricao(ameaca.figura.posto))}</p>

        <div class="horizon-bars">
          <div class="horizon-vital">
            <div class="horizon-vital-row">
              <span>Vida da Ameaça</span>
              <span class="inline wrap">
                ${deltaVidaChip}
                <strong class="num">${ameaca.vidaAtual} / ${ameaca.vidaMax} PV</strong>
              </span>
            </div>
            <div class="meter is-danger"><span style="width:${pctVida}%"></span></div>
          </div>
          <div class="horizon-atk-box">
            <span class="field-label">Contra-ataque</span>
            <strong class="num horizon-atk-num">${ataqueEfetivo}</strong>
            <span class="muted">Base ${st.ataque}${ameaca.figura.naipe === 'spades' ? ` + ${st.ferocidade} Feroz` : ''}</span>
          </div>
        </div>

        ${
          depois.fase === 'bloqueio' && depois.danoPendente > 0
            ? `<div class="exemplo-pending-alert">⚠️ <strong>Janela de Bloqueio:</strong> ${escapeHtml(depois.jogadores[depois.turnoDe].nome)} precisa defender <strong>${depois.danoPendente} de dano</strong> antes da compra de fim de turno.</div>`
            : ''
        }

        <div class="horizon-recruit-info">
          <span><strong>Próximas no Horizonte:</strong> ${depois.horizonteDeck.map(codigoFigura).join(' → ')} · <strong>Deck de Ação:</strong> ${depois.baralhoCompra.length} na compra · ${depois.descarte.length} no descarte</span>
        </div>
      </div>
    </section>`;
}

function renderJogadoresExemploHtml(
  deck: ThemeDeck,
  antes: Partida,
  depois: Partida,
  cenaAtual: CenaExemploRenderizada | null,
): string {
  const comprouAlguem = cenaAtual !== null && depois.baralhoCompra.length < antes.baralhoCompra.length;

  const cards = depois.jogadores
    .map((j, idx) => {
      const jAntes = antes.jogadores[idx];
      const ehProximo = idx === depois.turnoDe;
      const agiuAgora = cenaAtual !== null && cenaAtual.passo.acao.quem === idx;
      const pctVida = Math.max(0, Math.min(100, Math.round((j.vida / j.vidaMax) * 100)));

      const diffVida = cenaAtual ? j.vida - jAntes.vida : 0;
      const deltaVidaChip =
        diffVida !== 0 ? `<span class="chip chip-warn exemplo-delta num">${jAntes.vida} → ${j.vida} PV (${diffVida})</span>` : '';

      const comprouAqui = comprouAlguem && agiuAgora;
      const aguardaBloqueio = agiuAgora && depois.fase === 'bloqueio';

      const aliadosHtml =
        j.aliados.length === 0
          ? `<span class="muted">Nenhum aliado recrutado</span>`
          : j.aliados
              .map((a, aIdx) => {
                const cartaAliado = cartaDoTemaPorFigura(deck.cards, a.figura);
                const fn = FUNCAO_DO_NAIPE[a.figura.naipe];
                const st = STATUS_FIGURA[a.figura.posto];
                const cargasBolinhas = '●'.repeat(a.cargas) + '○'.repeat(Math.max(0, a.maxCargas - a.cargas));
                const aAntes = jAntes.aliados[aIdx];
                let deltaAliado = '';
                if (cenaAtual && !aAntes) {
                  deltaAliado = '<span class="chip chip-ok">Recrutado agora!</span>';
                } else if (cenaAtual && aAntes && a.cargas !== aAntes.cargas) {
                  deltaAliado = `<span class="chip chip-warn num">${aAntes.cargas} → ${a.cargas} uso</span>`;
                }
                return `
                  <div class="ally-badge">
                    <div class="ally-head">
                      <strong class="suit-${a.figura.naipe}">${escapeHtml(codigoFigura(a.figura))} ${escapeHtml(cartaAliado?.title ?? '')}</strong>
                      <span class="inline wrap">
                        ${deltaAliado}
                        <span class="num chip">${cargasBolinhas} (${a.cargas}/${a.maxCargas} usos)</span>
                      </span>
                    </div>
                    <span class="muted">${fn.papelAliado} (${st.bonusAliado} por uso · ou Escudo +${REGRA.escudoAliado})</span>
                  </div>`;
              })
              .join('');

      const maoHtml =
        j.mao.length === 0
          ? `<span class="muted">Mão vazia</span>`
          : `<div class="exemplo-mini-hand">
              ${j.mao.map((c, cIdx) => renderCartaMiniExemplo(deck, c, comprouAqui && cIdx === j.mao.length - 1)).join('')}
            </div>`;

      return `
        <article class="front ${ehProximo ? 'has-threat' : ''}">
          <header class="front-head">
            <div>
              <h3>
                ${escapeHtml(j.nome)}
                ${
                  ehProximo
                    ? `<span class="chip chip-ok">${
                        depois.fase === 'bloqueio'
                          ? 'Vai bloquear'
                          : agiuAgora
                            ? 'Continua na vez (Passo 2)'
                            : 'Próximo turno'
                      }</span>`
                    : ''
                }
                ${agiuAgora && !ehProximo ? '<span class="chip">Agiu neste lance</span>' : ''}
              </h3>
              <span class="front-class suit-${j.classe}">${SIMBOLO[j.classe]} ${CLASSES[j.classe].nome} · ${CLASSES[j.classe].descricao}</span>
            </div>
            <div class="chips">
              ${deltaVidaChip}
              <span class="chip num">❤ ${j.vida}/${j.vidaMax} PV</span>
              <span class="chip num">🏆 ${j.pontosTrofeu} pts</span>
              <span class="chip num">Domínio ${pontosDeDominio(j)}</span>
            </div>
          </header>
          <div class="meter ${j.vida <= 8 ? 'is-danger' : ''}"><span style="width:${pctVida}%"></span></div>
          <div class="exemplo-hand-box">
            <div class="exemplo-hand-head">
              <span class="field-label">Mão (${j.mao.length} cartas)</span>
              ${comprouAqui ? '<span class="chip chip-ok">+1 carta comprada no fim do turno</span>' : ''}
              ${aguardaBloqueio ? '<span class="chip chip-warn">Compra +1 só após bloquear</span>' : ''}
            </div>
            ${maoHtml}
          </div>
          <div class="ally-list">${aliadosHtml}</div>
        </article>`;
    })
    .join('');

  return `<section class="fronts fronts-2" aria-label="Estado de Mara e Kael">${cards}</section>`;
}

function renderTimelineExemploHtml(deck: ThemeDeck, encenado: ExemploEncenado, passoAtual: number): string {
  const passosHtml = encenado.passos
    .map((item, idx) => {
      const numPasso = idx + 1;
      const figAtiva = item.depois.ameacaAtiva?.figura ?? item.antes.ameacaAtiva?.figura;
      const cartaTema = figAtiva ? cartaDoTemaPorFigura(deck.cards, figAtiva) : undefined;
      const maosResumo = item.depois.jogadores
        .map((j) => `${escapeHtml(j.nome)}: ${j.vida} PV · ${j.aliados.length} aliado(s) · mão [${j.mao.map(codigoCarta).join(' ')}]`)
        .join(' | ');
      const estadoClasse = numPasso === passoAtual ? 'is-active' : numPasso < passoAtual ? 'is-done' : 'is-future';

      return `
        <li class="msg exemplo-timeline-item ${estadoClasse}">
          <button type="button" class="msg-time-btn num" data-exemplo-step="${numPasso}" aria-current="${numPasso === passoAtual ? 'step' : 'false'}">
            <span class="exemplo-step-num">${numPasso}</span>
            <span>${escapeHtml(item.passo.hora)}</span>
          </button>
          <div class="msg-body">
            <div class="msg-title-row">
              <button type="button" class="msg-title-btn" data-exemplo-step="${numPasso}">
                <strong>${escapeHtml(item.passo.titulo)}</strong>
              </button>
              <div class="inline wrap">
                ${cartaTema ? `<button type="button" class="btn-ghost btn-sm" data-zoom-card-id="${escapeHtml(cartaTema.id)}">Ver ${escapeHtml(cartaTema.playingCardCode)}</button>` : ''}
                <button type="button" class="btn-secondary btn-sm" data-exemplo-step="${numPasso}">
                  ${numPasso === passoAtual ? 'Vendo agora' : 'Ver mesa'}
                </button>
              </div>
            </div>
            <p>${escapeHtml(item.passo.narrativa)}</p>
            <p class="msg-note">${escapeHtml(item.passo.notaMecanica)}</p>
            <p class="muted num">${maosResumo}</p>
          </div>
        </li>`;
    })
    .join('');

  return `
    <div class="exemplo-timeline-wrap">
      <div class="exemplo-timeline-head">
        <h3>Linha do tempo completa (clique em qualquer lance para saltar)</h3>
        <span class="muted">Cada carta da mão ou Figura pode ser clicada para ver os detalhes do tema.</span>
      </div>
      <ul class="msgs exemplo-timeline">${passosHtml}</ul>
    </div>`;
}

export function renderExemploHtml(deck: ThemeDeck, passoAtivo = 0): string {
  const encenado = obterExemploEncenado();
  const totalPassos = encenado.passos.length;
  const passoAtual = Math.max(0, Math.min(totalPassos, Math.trunc(passoAtivo)));
  const cenaAtual = passoAtual > 0 ? encenado.passos[passoAtual - 1] : null;
  const antes = cenaAtual ? cenaAtual.antes : encenado.inicial;
  const depois = cenaAtual ? cenaAtual.depois : encenado.inicial;

  const pilulas = [
    `<button type="button" class="filter-pill ${passoAtual === 0 ? 'is-active' : 'is-done'}" data-exemplo-step="0">0. Início</button>`,
    ...encenado.passos.map((item, idx) => {
      const n = idx + 1;
      const cls = n === passoAtual ? 'is-active' : n < passoAtual ? 'is-done' : '';
      return `<button type="button" class="filter-pill ${cls}" data-exemplo-step="${n}">${n}. ${escapeHtml(item.passo.hora)}</button>`;
    }),
  ].join('');

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
        ${renderGuiasRapidosHtml(deck)}
      </section>

      <section class="example">
        <header class="section-head">
          <span class="eyebrow">Simulação Interativa Validada no Motor</span>
          <h2>Exemplo real de combate PvPvE (Mara vs. Kael)</h2>
          <p class="lede">Clique passo a passo para ver na mesa o bloqueio pelo valor da carta, a compra de +1 carta no fim do turno, o traço da Figura, o recrutamento com ♥ e o uso do Aliado.</p>
        </header>

        <div class="exemplo-player">
          <nav class="exemplo-nav" aria-label="Controles do exemplo interativo">
            <div class="exemplo-nav-buttons">
              <button type="button" class="btn-ghost btn-sm" data-exemplo-step="0" ${passoAtual === 0 ? 'disabled' : ''}>⏮ Início</button>
              <button type="button" class="btn-secondary btn-sm" data-exemplo-step="${Math.max(0, passoAtual - 1)}" ${passoAtual === 0 ? 'disabled' : ''}>← Passo anterior</button>
              <span class="chip chip-strong num">Lance ${passoAtual} de ${totalPassos}</span>
              <button type="button" class="btn-primary btn-sm" data-exemplo-step="${Math.min(totalPassos, passoAtual + 1)}" ${passoAtual === totalPassos ? 'disabled' : ''}>
                ${passoAtual === 0 ? 'Começar combate →' : passoAtual === totalPassos ? 'Fim da demonstração' : 'Próximo lance →'}
              </button>
            </div>
            <div class="exemplo-step-pills" role="group" aria-label="Saltar para um lance específico">${pilulas}</div>
          </nav>

          ${renderSpotlightHtml(deck, encenado, passoAtual)}
          <div class="exemplo-live-table">
            ${renderAmeacaExemploHtml(deck, antes, depois, passoAtual > 0)}
            ${renderJogadoresExemploHtml(deck, antes, depois, cenaAtual)}
          </div>
        </div>

        ${renderTimelineExemploHtml(deck, encenado, passoAtual)}

        <div class="example-end">
          <strong>Status final da demonstração:</strong>
          <code class="status-code">${escapeHtml(encenado.statusFinal)}</code>
          <button type="button" class="btn-primary" data-goto-tab="playtest">Abrir Mesa Interativa</button>
        </div>
      </section>
    </div>
  `;
}
