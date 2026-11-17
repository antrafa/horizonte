import { FUNCAO_DO_NAIPE, NAIPES, REGRA, SIMBOLO, STATUS_FIGURA } from '../core/partida';
import type { ThemeDeck, ThemeId } from '../types/card';
import { THEME_VISUALS, gerarPromptUnicoDoTema } from './card-art';
import { escapeHtml } from './card-renderer';

export interface NuanceDoTema {
  oQueEOHorizonte: string;
  dinamicaDeCombate: string;
  chefeFinal: string;
}

export const NUANCES_DO_TEMA: Record<ThemeId, NuanceDoTema> = {
  wasteland: {
    oQueEOHorizonte:
      'A Terra Devastada e as rodovias de ferrugem. Cada Figura revelada no centro da mesa é um saqueador blindado, mutante radioativo, drone autômato ou profeta da cisterna disputando a última refinaria.',
    dinamicaDeCombate:
      '♠ Chumbo & Lâmina perfura blindagens; ♣ Sucata & Armadilha ergue barricadas e reduz ataques; ♦ Tecnologia compra peças extras; ♥ Água & Soro cura PV e recruta sobreviventes.',
    chefeFinal:
      'Na terceira onda surgem os 4 Reis da Terra Devastada (Imperador V8, Profeta da Cisterna, Núcleo Aegis-9 e Colosso da Cratera), culminando no domínio de O Soberano da Cratera.',
  },
  zombies: {
    oQueEOHorizonte:
      'A Zona de Quarentena cercada por bloqueios sanitários. As Figuras representam líderes da horda, sobreviventes hostis, equipamentos militares e cepas letais.',
    dinamicaDeCombate:
      'Abata hordas com ♠/♣ para limpar a quarentena ou use ♥/♦ para resgatar especialistas e hackear equipamentos de campo antes da mordida.',
    chefeFinal:
      'Os 4 Reis lideram o cerco final sob o comando de O Paciente Zero.',
  },
  neon: {
    oQueEOHorizonte:
      'A rede corporativa e os becos sob chuva ácida. As Figuras são protocolos ICE, mercenários cibernéticos, hackers e diretores de megacorporação.',
    dinamicaDeCombate:
      'Rompa firewalls com ♠/♣ ou invada e recrute sistemas autônomos e informantes usando ♦ Tecnologia e ♥ Contatos.',
    chefeFinal:
      'A onda final traz os núcleos centrais de A Corporação (Valor/Vida 20).',
  },
  eclipse: {
    oQueEOHorizonte:
      'A Coroa Negra fechando o sol e distorcendo a gravidade. As Figuras são sentinelas, relíquias e aberrações nascidas da penumbra.',
    dinamicaDeCombate:
      'Contenha as anomalias com ♠/♣ ou harmonize os sobreviventes da cidade escurecida com ♥/♦ antes que a luz se apague.',
    chefeFinal:
      'Os 4 Reis encarnam a chegada de O Devorador do Sol.',
  },
  vampires: {
    oQueEOHorizonte:
      'As cortes imortais sob os letreiros da metrópole. Cada Figura é um ancião, caçador, relíquia de sangue ou pacto noturno.',
    dinamicaDeCombate:
      'Cace rivais da noite com ♠/♣ ou negocie alianças e favores de sangue com ♥/♦ no jogo político do PvP.',
    chefeFinal:
      'A quarta onda desperta os senhores de O Antediluviano.',
  },
  expedicao: {
    oQueEOHorizonte:
      'A selva viva cheia de ruínas antigas e rios móveis. As Figuras são predadores, guias nativos, armadilhas de pedra e guardiões do templo.',
    dinamicaDeCombate:
      'Abra trilha na força bruta (♠/♣) ou conquiste aliados e mapas do tesouro (♥/♦).',
    chefeFinal:
      'No centro da mata aguarda o poder ancestral de O Coração da Selva.',
  },
  noir: {
    oQueEOHorizonte:
      'As ruas chuvosas de Porto Bruma. As Figuras são detetives corruptos, informantes, dossiês secretos e chefões do submundo.',
    dinamicaDeCombate:
      'Neutralize capangas e armadilhas (♠/♣) ou compre testemunhas e recupere pistas decisivas (♥/♦).',
    chefeFinal:
      'A conspiração fecha cerco em torno de O Homem que Não Aparece nas Fotos.',
  },
  orbital: {
    oQueEOHorizonte:
      'Os setores pressurizados da Estação Vigia em órbita. As Figuras são falhas críticas, drones de manutenção e módulos de comando.',
    dinamicaDeCombate:
      'Sele brechas no casco (♠/♣) ou reprograme sistemas vitais e suporte de oxigênio (♦/♥).',
    chefeFinal:
      'Na última onda assume o núcleo rebelde de A Inteligência da Nave.',
  },
  arcana: {
    oQueEOHorizonte:
      'Os salões mutantes da Academia na Colina. As Figuras são duelos de feitiços, grimórios vivos e mestres das casas arcanas.',
    dinamicaDeCombate:
      'Contra-ataque encantamentos com ♠/♣ ou conjure familiares e poções restauradoras com ♥/♦.',
    chefeFinal:
      'O exame definitivo é aplicado pelos arquimagos de O Diretor Que Ninguém Viu.',
  },
  corsarios: {
    oQueEOHorizonte:
      'As águas tempestuosas ao redor do Convés Torto. As Figuras são piratas rivais, canhões, monstros marinhos e navios fantasmas.',
    dinamicaDeCombate:
      'Derrube navios rivais com qualquer carta ou recrute tripulações com ♥/♦ no golpe final.',
    chefeFinal:
      'Das brumas emerge a esquadra de O Navio Fantasma do Almirante.',
  },
  kaiju: {
    oQueEOHorizonte:
      'A baía metropolitana em alerta máximo. As Figuras são enxames de parasitas, esquadrões de contenção e colossos abissais.',
    dinamicaDeCombate:
      'Segure o avanço urbano com ♠/♣ ou evacue civis e mobilize tecnologia pesada (♥/♦).',
    chefeFinal:
      'A última onda coloca na avenida os gigantes de O Titã Adormecido.',
  },
  floresta: {
    oQueEOHorizonte:
      'O bosque encantado ameaçado pela geada eterna. As Figuras são espíritos das árvores, feitiços de inverno e guardiões das estações.',
    dinamicaDeCombate:
      'Afaste o frio cortante com ♠/♣ ou desperte aliados silvestres com ♥/♦.',
    chefeFinal:
      'A primavera é disputada contra a corte de A Rainha do Inverno Sem Fim.',
  },
};

function cartaDeAmostra(deck: ThemeDeck) {
  return deck.cards.find((c) => c.kind === 'archetype_king' && c.suit === 'spades') ?? deck.cards[0];
}

function renderTema(deck: ThemeDeck, ativo: boolean): string {
  const amostra = cartaDeAmostra(deck);
  const nuance = NUANCES_DO_TEMA[deck.id] ?? NUANCES_DO_TEMA.wasteland;
  const naipes = NAIPES.map(
    (n) =>
      `<li><span class="suit-${n}">${SIMBOLO[n]}</span> <span class="muted">${FUNCAO_DO_NAIPE[n].pilar}:</span> ${escapeHtml(deck.suits[n].vocationName)}</li>`,
  ).join('');

  return `
    <article class="theme-tile ${ativo ? 'is-active' : ''}" style="--tema: ${escapeHtml(deck.accentColor)}">
      <header class="theme-card-head">
        <div class="theme-card-meta">
          <span class="chip">${escapeHtml(deck.tom)}</span>
          ${ativo ? '<span class="chip chip-ok">Tema ativo</span>' : ''}
        </div>
        <h3>${escapeHtml(deck.name)}</h3>
        <p class="theme-subtitle muted">${escapeHtml(deck.subtitle)}</p>
        <p class="theme-tagline">${escapeHtml(deck.tagline)}</p>
      </header>

      <dl class="theme-dossier">
        <div class="theme-dossier-row">
          <dt>O Horizonte</dt>
          <dd>${escapeHtml(nuance.oQueEOHorizonte)}</dd>
        </div>
        <div class="theme-dossier-row">
          <dt>Tática dos Naipes</dt>
          <dd>${escapeHtml(nuance.dinamicaDeCombate)}</dd>
        </div>
        <div class="theme-dossier-row theme-dossier-boss">
          <dt>Onda Final (4 Reis)</dt>
          <dd>
            <div class="theme-boss-title">
              <strong>${escapeHtml(deck.chefe.nome)}</strong>
              <span class="chip">Vida ${STATUS_FIGURA.K.vida} · Atq ${STATUS_FIGURA.K.ataque}</span>
            </div>
            <p>${escapeHtml(deck.chefe.descricao)} ${escapeHtml(nuance.chefeFinal)}</p>
          </dd>
        </div>
        <div class="theme-dossier-row">
          <dt>4 Facções</dt>
          <dd><ul class="theme-suits">${naipes}</ul></dd>
        </div>
      </dl>

      ${
        amostra
          ? `<details class="theme-sample">
              <summary>Ver Figura de exemplo (${escapeHtml(amostra.playingCardCode)} · ${escapeHtml(amostra.title)})</summary>
              <div class="theme-sample-body">
                <p><strong>${escapeHtml(amostra.artSubtitle)}</strong></p>
                <p class="muted">${escapeHtml(amostra.flavorText)}</p>
              </div>
            </details>`
          : ''
      }

      <footer class="theme-card-foot">
        ${
          ativo
            ? '<span class="theme-active-status muted">Em uso na mesa atual</span>'
            : `<button type="button" class="btn-primary btn-sm" data-switch-theme="${escapeHtml(deck.id)}">Jogar com este tema</button>`
        }
        <button type="button" class="btn-ghost btn-sm" data-switch-theme="${escapeHtml(deck.id)}" data-goto-tab="studio">Ver as 54 cartas</button>
      </footer>
    </article>`;
}

function renderCentralPrompts(temas: ThemeDeck[]): string {
  const grupos = [
    {
      titulo: 'Mega-Prompt 1/3 · Sobrevivência & Sci-Fi (Cinzas, Zumbi, Neon, Orbital)',
      ids: ['wasteland', 'zombies', 'neon', 'orbital'],
    },
    {
      titulo: 'Mega-Prompt 2/3 · Sombrio, Arcano & Colossal (Eclipse, Vampiros, Arcana, Kaiju)',
      ids: ['eclipse', 'vampires', 'arcana', 'kaiju'],
    },
    {
      titulo: 'Mega-Prompt 3/3 · Expedição, Noir, Céus & Floresta (Expedição, Noir, Corsários, Floresta)',
      ids: ['expedicao', 'noir', 'corsarios', 'floresta'],
    },
  ];

  const megaHtml = grupos
    .map((g, idx) => {
      const lista = g.ids
        .map((id) => temas.find((t) => t.id === id))
        .filter((t): t is ThemeDeck => Boolean(t));
      const texto = [
        `Create a clean 4-row x 4-column modular deck-art sheet (1 row per theme, cleanly divided with dark gutters, ZERO headers, ZERO gibberish text, ZERO watermarks) covering ALL 4 SUITS (♠ ♥ ♦ ♣) across ranks A, 2–10, J, Q, K + ★/💀 Jokers + 1 Card Back per theme. EVERY panel contains complete full-bleed 63x88mm vertical playing cards (5:7 aspect ratio, ornate full-card borders, crisp top-left & inverted bottom-right corner indices, NO rule text boxes) so each card works both as the full-card background in-game and as a standalone conventional deck:`,
        `All 12 Figure cards (J, Q, K in ♠ ♥ ♦ ♣) receive full illustrated character/threat portraits holding a tilted playing card; all 4 Aces (A♠ A♥ A♦ A♣), 36 numerals (2–10 across ♠ ♥ ♦ ♣), and 2 Jokers (★/💀) receive full-card artistic conceptual tarot/engraving compositions (esoteric mandalas, constellation ley-lines linking the exact N suit pips, NO character portraits). End each row with 1 symmetrical 63x88mm Card Back (O Fundo da Carta):`,
        ...lista.map((t, i) => {
          const vis = THEME_VISUALS[t.id] ?? THEME_VISUALS.eclipse;
          return `ROW ${i + 1} — "${t.name}": ${vis.estetica}. Palette ${vis.skyTop} / ${vis.skyMid} / ${vis.accent}. Columns: [1: Illustrated 63x88mm Valete J & Dama Q cards across ♠ ♥ ♦ ♣] | [2: Illustrated 63x88mm Rei K (♠ ♥ ♦) & Boss "${t.chefe.nome}" K♣ cards] | [3: Artistic Conceptual Cards across all 4 suits (A♠ A♥ A♦ A♣ mandalas, 2–10 ♠ ♥ ♦ ♣ constellation ley-line cards & ★/💀 dual-totem Joker cards, NO character portraits)] | [4: One Symmetrical 63x88mm Card Back (Fundo da Carta)].`;
        }),
      ].join('\n');

      return `
        <div class="editor-field">
          <label for="mega-prompt-${idx}">${escapeHtml(g.titulo)}</label>
          <textarea id="mega-prompt-${idx}" class="nano-prompt-textarea" rows="5" readonly>${escapeHtml(texto)}</textarea>
        </div>`;
    })
    .join('');

  const porTemaHtml = temas
    .map(
      (t) => `
      <div class="editor-field">
        <label for="unico-prompt-${escapeHtml(t.id)}">${escapeHtml(t.name)} (1 Prompt = Figuras Ilustradas J/Q/K + Conceito A–10/★💀 + 1 Fundo 63×88mm)</label>
        <textarea id="unico-prompt-${escapeHtml(t.id)}" class="nano-prompt-textarea" rows="6" readonly>${escapeHtml(gerarPromptUnicoDoTema(t))}</textarea>
      </div>`,
    )
    .join('');

  return `
    <details class="nano-prompt-box" open>
      <summary>Central Única de Prompts Nano Banana (Ilustração apenas nas Figuras J/Q/K + Conceito + 1 Fundo · ${temas.length} Temas)</summary>
      <div class="nano-prompt-body">
        <p class="muted">Tudo em um só lugar: use <strong>apenas 3 Mega-Prompts</strong> para gerar as <strong>ilustrações exclusivas das Figuras (J/Q/K)</strong>, o sistema gráfico conceitual das numéricas (A–10 e Coringas, sem imagem) e <strong>1 Fundo da Carta (63×88mm)</strong> dos ${temas.length} mundos em lote, ou copie <strong>1 Prompt Único por tema</strong>.</p>
        ${megaHtml}
        <details class="theme-sample">
          <summary>Ver 1 Prompt Único agrupado para cada tema (${temas.length} prompts)</summary>
          <div class="nano-prompt-body">${porTemaHtml}</div>
        </details>
      </div>
    </details>`;
}

export function renderTemasHtml(temas: ThemeDeck[], ativo: ThemeId): string {
  return `
    <div class="themes-page">
      <header class="section-head">
        <span class="eyebrow">Compêndio de Mundos · ${temas.length} Cenários</span>
        <h2>Um motor único, ${temas.length} mundos diferentes.</h2>
        <p class="lede">Todas as partidas usam as mesmas 54 cartas (12 Figuras no Horizonte + 42 cartas de Ação) e o mesmo sistema de Combate, Bloqueio (${REGRA.vidaInicial} PV) e Abater vs. Recrutar. Troque o tema para mudar facções, chefes e atmosfera instantaneamente.</p>
      </header>

      <section class="themes-intro" aria-label="Como o motor se adapta aos temas">
        <div class="themes-intro-item">
          <h3>Cartucho de regras universal</h3>
          <p>O <strong>Horizonte</strong> sempre empilha 4 Valetes (Vida ${STATUS_FIGURA.J.vida}), 4 Damas (Vida ${STATUS_FIGURA.Q.vida}) e 4 Reis (Vida ${STATUS_FIGURA.K.vida}). Só o rosto das ameaças muda conforme o tema.</p>
        </div>
        <div class="themes-intro-item">
          <h3>Baralho convencional na mesa</h3>
          <p>Você pode imprimir as cartas customizadas de qualquer tema na aba <strong>Imprimir</strong> ou jogar hoje mesmo com um baralho comum consultando o <strong>Compêndio</strong>.</p>
        </div>
        <div class="themes-intro-item">
          <h3>Solo, Coop ou PvP sem mudar regra</h3>
          <p>No <strong>Solo</strong> e <strong>Coop</strong> vocês limpam as 12 Figuras juntos. No <strong>PvP</strong>, recrutam Figuras e atiram direto nos rivais pelo maior placar de Domínio.</p>
        </div>
      </section>

      <div class="theme-grid">${temas.map((t) => renderTema(t, t.id === ativo)).join('')}</div>

      ${renderCentralPrompts(temas)}
    </div>`;
}
