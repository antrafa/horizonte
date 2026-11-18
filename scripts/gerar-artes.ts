/**
 * Gera ou regera as artes de um tema em alta resolução (1 imagem por carta).
 *
 *   npm run artes                                      # Menu interativo (escolhe provedor, tema e ação)
 *   npm run artes -- --tema vampires --provedor openai # Direto por linha de comando
 *   npm run artes -- --tema vampires --simular         # Só grava os prompts, sem custo
 *   npm run artes -- --tema vampires --aplicar         # Copia as artes prontas para o jogo
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ALL_THEME_IDS, THEMES } from '../src/data/index';
import type { ThemeDeck, ThemeId } from '../src/types/card';
import { normalizarArte } from './artes/imagem';
import { ARQUIVO_ANCORA, listarAlvos, promptDaCarta, promptDoVerso, type AlvoDeArte } from './artes/prompts';
import { criarProvedor, ErroDeApi, type NomeProvedor, type Provedor } from './artes/provedores';
import {
  formatarLinhaDeStatusDoTema,
  inspecionarStatusDoTema,
  inspecionarStatusPorProvedor,
  resolverAlvosParaRegerar,
  todosOsAlvosDoTema,
} from './artes/status';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

for (const arquivo of ['.env.local', '.env']) {
  const caminho = path.join(RAIZ, arquivo);
  if (existsSync(caminho)) process.loadEnvFile(caminho);
}

interface Estado {
  ancoraAprovada: boolean;
  ajustes: string;
}

const { values: args } = parseArgs({
  options: {
    tema: { type: 'string' },
    provedor: { type: 'string' },
    modelo: { type: 'string' },
    qualidade: { type: 'string', default: 'medium' },
    paralelo: { type: 'string', default: '2' },
    simular: { type: 'boolean', default: false },
    aplicar: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const rl = createInterface({ input: process.stdin, output: process.stdout });

function abrirImagem(caminho: string): void {
  const comando = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer' : 'xdg-open';
  spawn(comando, [caminho], { detached: true, stdio: 'ignore' }).on('error', () => {}).unref();
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function escolherProvedorInterativo(): Promise<NomeProvedor> {
  if (args.provedor === 'gemini' || args.provedor === 'openai') {
    return args.provedor;
  }
  if (args.provedor) {
    console.error('--provedor deve ser gemini ou openai.');
    process.exit(1);
  }
  if (!process.stdin.isTTY) return 'gemini';

  console.log('\n=== PROVEDOR DE IMAGEM ===');
  console.log('  1) openai  — gpt-image-1-mini (1024×1406 px · ~US$ 0,015/carta) [padrão]');
  console.log('  2) gemini  — gemini-2.5-flash-image (862×1184 px · ~US$ 0,039/carta)');
  const resp = (await rl.question('Escolha o provedor [1/2 ou Enter=openai]: ')).trim().toLowerCase();
  if (resp === '2' || resp === 'gemini' || resp === 'g') return 'gemini';
  return 'openai';
}

async function escolherTemaInterativo(provedorAtivo: NomeProvedor): Promise<ThemeId> {
  if (args.tema) {
    if (!ALL_THEME_IDS.includes(args.tema as ThemeId)) {
      console.error(`Informe --tema com um destes: ${ALL_THEME_IDS.join(', ')}`);
      process.exit(1);
    }
    return args.tema as ThemeId;
  }
  if (!process.stdin.isTTY) {
    console.error(`Informe --tema com um destes: ${ALL_THEME_IDS.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n=== TEMAS DE HORIZONTE (provedor selecionado: ${provedorAtivo}) ===`);
  ALL_THEME_IDS.forEach((id, idx) => {
    const st = inspecionarStatusDoTema(RAIZ, id);
    console.log(formatarLinhaDeStatusDoTema(idx + 1, st, provedorAtivo));
  });

  for (;;) {
    const resp = (await rl.question('\nDigite o número (1–12) ou o ID do tema (ou [s] para sair): ')).trim().toLowerCase();
    if (resp === 's' || resp === 'sair') {
      rl.close();
      process.exit(0);
    }
    const num = Number(resp);
    if (Number.isInteger(num) && num >= 1 && num <= ALL_THEME_IDS.length) {
      return ALL_THEME_IDS[num - 1];
    }
    if (ALL_THEME_IDS.includes(resp as ThemeId)) {
      return resp as ThemeId;
    }
    console.log('Opção inválida. Digite um número de 1 a 12 ou o identificador do tema.');
  }
}

function imprimirGradeDeCartasDoTema(deck: ThemeDeck, pastaSaida: string, ajustes?: string): void {
  const alvos = todosOsAlvosDoTema(deck, ajustes);
  console.log('\nCartas do tema (✓ = já gerada nesta pasta | · = pendente):');
  for (let i = 0; i < alvos.length; i++) {
    const a = alvos[i];
    const existe = existsSync(path.join(pastaSaida, a.arquivo));
    const num = String(i + 1).padStart(2, ' ');
    const status = existe ? '✓' : '·';
    console.log(`  ${num}) [${status}] ${a.arquivo.padEnd(16, ' ')} — ${a.rotulo}`);
  }
}

async function sincronizarArtesLimpasNoDisco(novoTema: ThemeId): Promise<void> {
  const arquivoTs = path.join(RAIZ, 'src', 'data', 'artes-limpas.ts');
  const fonte = await readFile(arquivoTs, 'utf8');
  const atuais = Array.from(fonte.matchAll(/'([a-z]+)'/g), (m) => m[1] as ThemeId);
  const conjunto = new Set<ThemeId>(atuais.filter((t) => ALL_THEME_IDS.includes(t)));
  conjunto.add(novoTema);
  for (const id of ALL_THEME_IDS) {
    if (existsSync(path.join(RAIZ, 'artes-geradas', id, '_original'))) {
      conjunto.add(id);
    }
  }
  const ordenados = [...conjunto].sort();
  const lista = ordenados.map((t) => `'${t}'`).join(', ');
  await writeFile(arquivoTs, fonte.replace(/= \[[\s\S]*?\];/, `= [${lista}];`));
}

async function main(): Promise<void> {
  const nomeProvedor = await escolherProvedorInterativo();
  const tema = await escolherTemaInterativo(nomeProvedor);
  const qualidade = args.qualidade as 'low' | 'medium' | 'high';
  const provedor = criarProvedor(nomeProvedor, args.modelo, qualidade);
  const deck = THEMES[tema];
  const pastaSaida = path.join(RAIZ, 'artes-geradas', tema, nomeProvedor);
  const arquivoEstado = path.join(pastaSaida, 'estado.json');

  await mkdir(pastaSaida, { recursive: true });
  console.log(`\nTema: ${deck.name} (${tema}) · ${provedor.nome}/${provedor.modelo}`);

  async function lerEstado(): Promise<Estado> {
    if (!existsSync(arquivoEstado)) return { ancoraAprovada: false, ajustes: '' };
    return JSON.parse(await readFile(arquivoEstado, 'utf8')) as Estado;
  }

  async function salvarEstado(estado: Estado): Promise<void> {
    await writeFile(arquivoEstado, JSON.stringify(estado, null, 2));
  }

  async function gerarComRetentativa(p: Provedor, alvo: AlvoDeArte, referencia?: Buffer): Promise<Buffer> {
    const esperas = [5_000, 20_000, 60_000];
    for (let tentativa = 0; ; tentativa++) {
      try {
        const bruta = await p.gerar({ prompt: alvo.prompt, referencia, qualidade });
        const { jpeg } = await normalizarArte(bruta);
        return jpeg;
      } catch (erro) {
        const repetivel = erro instanceof ErroDeApi ? erro.temporario || erro.status === 422 : false;
        if (!repetivel || tentativa >= esperas.length) throw erro;
        console.warn(`  ↻ ${alvo.rotulo}: ${(erro as Error).message.slice(0, 120)} — nova tentativa em ${esperas[tentativa] / 1000}s`);
        await esperar(esperas[tentativa]);
      }
    }
  }

  async function simular(): Promise<void> {
    const estado = await lerEstado();
    const { ancora, demais } = listarAlvos(deck, estado.ajustes);
    const destino = path.join(pastaSaida, 'prompts.md');
    const corpo = [ancora, ...demais].map((a) => `## ${a.arquivo} — ${a.rotulo}\n\n\`\`\`\n${a.prompt}\n\`\`\`\n`).join('\n');
    await writeFile(destino, `# Prompts · ${deck.name} · ${provedor.nome}/${provedor.modelo}\n\n${corpo}`);
    console.log(`${demais.length + 1} prompts gravados em ${path.relative(RAIZ, destino)} (nenhuma chamada à API).`);
  }

  async function aprovarAncora(estado: Estado, forcarRegeracao = false): Promise<Estado> {
    const caminho = path.join(pastaSaida, ARQUIVO_ANCORA);
    let precisaGerar = forcarRegeracao || !existsSync(caminho);
    for (;;) {
      if (precisaGerar) {
        const { ancora } = listarAlvos(deck, estado.ajustes);
        console.log(`Gerando a carta-âncora ${ancora.rotulo}...`);
        await writeFile(caminho, await gerarComRetentativa(provedor, ancora));
      }
      console.log(`\nÂncora: ${caminho}`);
      abrirImagem(caminho);
      const resposta = (
        await rl.question(
          'Ela define o estilo das outras 54 imagens.\n  [Enter] aprovar · [r] regerar · [s] sair · ou digite um ajuste (ex.: "mais escuro, traço de HQ")\n> ',
        )
      ).trim();
      if (resposta === '' || resposta.toLowerCase() === 'a') {
        const aprovado = { ...estado, ancoraAprovada: true };
        await salvarEstado(aprovado);
        return aprovado;
      }
      if (resposta.toLowerCase() === 's') {
        rl.close();
        process.exit(0);
      }
      if (resposta.toLowerCase() !== 'r') {
        estado = { ...estado, ajustes: [estado.ajustes, resposta].filter(Boolean).join('; ') };
        console.log(`Ajustes acumulados do tema: ${estado.ajustes}`);
      }
      await salvarEstado(estado);
      precisaGerar = true;
    }
  }

  async function gerarDeck(estado: Estado): Promise<string[]> {
    const referencia = await readFile(path.join(pastaSaida, ARQUIVO_ANCORA));
    const { demais } = listarAlvos(deck, estado.ajustes);
    const pendentes = demais.filter((a) => !existsSync(path.join(pastaSaida, a.arquivo)));
    if (pendentes.length === 0) return [];

    const custo = (pendentes.length * provedor.custoEstimadoPorImagem).toFixed(2);
    const ok = await rl.question(
      `\n${pendentes.length} imagens pendentes com ${provedor.modelo} — custo estimado ~US$ ${custo}. Continuar? [S/n] `,
    );
    if (ok.trim().toLowerCase() === 'n') return pendentes.map((a) => a.arquivo);

    const falhas: string[] = [];
    let feitas = 0;
    const fila = [...pendentes];
    const trabalhador = async () => {
      for (let alvo = fila.shift(); alvo; alvo = fila.shift()) {
        try {
          await writeFile(path.join(pastaSaida, alvo.arquivo), await gerarComRetentativa(provedor, alvo, referencia));
          console.log(`  ✓ [${++feitas}/${pendentes.length}] ${alvo.arquivo} · ${alvo.rotulo}`);
        } catch (erro) {
          falhas.push(alvo.arquivo);
          console.error(`  ✗ ${alvo.arquivo}: ${(erro as Error).message.slice(0, 200)}`);
        }
      }
    };
    const paralelo = Math.max(1, Number(args.paralelo) || 1);
    await Promise.all(Array.from({ length: paralelo }, trabalhador));
    return falhas;
  }

  async function aplicar(arquivosEspecificos?: string[]): Promise<void> {
    const { ancora, demais } = listarAlvos(deck);
    const arquivos = arquivosEspecificos ?? [ancora, ...demais].map((a) => a.arquivo);
    const faltando = arquivos.filter((a) => !existsSync(path.join(pastaSaida, a)));
    if (faltando.length > 0) {
      console.error(`Ainda faltam ${faltando.length} imagens (${faltando.slice(0, 5).join(', ')}...). Rode sem --aplicar para gerar.`);
      return;
    }

    const pastaJogo = path.join(RAIZ, 'public', 'cards', tema);
    const backup = path.join(RAIZ, 'artes-geradas', tema, '_original');
    if (!existsSync(backup) && existsSync(pastaJogo)) {
      await mkdir(backup, { recursive: true });
      for (const f of await readdir(pastaJogo)) await copyFile(path.join(pastaJogo, f), path.join(backup, f));
      console.log(`Backup das artes antigas em ${path.relative(RAIZ, backup)}`);
    }
    await mkdir(pastaJogo, { recursive: true });
    for (const f of arquivos) await copyFile(path.join(pastaSaida, f), path.join(pastaJogo, f));

    await sincronizarArtesLimpasNoDisco(tema);
    console.log(`${arquivos.length} arte(s) aplicada(s) em public/cards/${tema}/. Rode "npm run dev" para conferir.`);
  }

  async function regerarCartasInterativo(estado: Estado): Promise<void> {
    imprimirGradeDeCartasDoTema(deck, pastaSaida, estado.ajustes);
    for (;;) {
      const entrada = (
        await rl.question(
          '\nQuais cartas deseja regerar?\n  Digite números (ex.: 1, 14, 55), códigos (ex.: 9♦, A♠, K♣, ★, 💀, verso) ou arquivos (ex.: 9-diamonds.jpg)\n  [Enter para voltar]: ',
        )
      ).trim();
      if (!entrada) return;

      const { selecionados, invalidos } = resolverAlvosParaRegerar(deck, entrada, estado.ajustes);
      if (invalidos.length > 0) {
        console.log(`Não reconhecido: ${invalidos.join(', ')}`);
      }
      if (selecionados.length === 0) continue;

      console.log(`Selecionadas (${selecionados.length}): ${selecionados.map((s) => `${s.arquivo} (${s.rotulo})`).join(', ')}`);
      const notaExtra = (
        await rl.question('Algum ajuste específico para esta(s) carta(s)? [Enter = usar prompt padrão do tema]: ')
      ).trim();

      const ajustesFinais = [estado.ajustes, notaExtra].filter(Boolean).join('; ');
      const caminhoAncora = path.join(pastaSaida, ARQUIVO_ANCORA);
      const temAncora = existsSync(caminhoAncora);
      const referencia = temAncora ? await readFile(caminhoAncora) : undefined;

      const regeradas: string[] = [];
      for (const item of selecionados) {
        let prompt = item.prompt;
        if (notaExtra) {
          if (item.arquivo === 'back.jpg') {
            prompt = promptDoVerso(deck, temAncora, ajustesFinais);
          } else {
            const card = deck.cards.find((c) => item.rotulo.startsWith(c.playingCardCode) && item.rotulo.includes(c.title));
            if (card) prompt = promptDaCarta(deck, card, item.arquivo !== ARQUIVO_ANCORA && temAncora, ajustesFinais);
          }
        }
        const refParaEsta = item.arquivo === ARQUIVO_ANCORA ? undefined : referencia;
        console.log(`  ↻ Regerando ${item.arquivo} (${item.rotulo})...`);
        const jpeg = await gerarComRetentativa(provedor, { ...item, prompt }, refParaEsta);
        const destino = path.join(pastaSaida, item.arquivo);
        await writeFile(destino, jpeg);
        regeradas.push(item.arquivo);
        console.log(`  ✓ Salva em ${path.relative(RAIZ, destino)}`);
        if (selecionados.length <= 3) abrirImagem(destino);
      }

      const respAplicar = (
        await rl.question(`Aplicar esta(s) ${regeradas.length} carta(s) regerada(s) em public/cards/${tema}/ agora? [S/n] `)
      )
        .trim()
        .toLowerCase();
      if (respAplicar !== 'n') {
        await aplicar(regeradas);
      }

      const outra = (await rl.question('Deseja regerar mais alguma carta deste tema? [s/N] ')).trim().toLowerCase();
      if (outra !== 's') return;
    }
  }

  if (args.simular) return simular();
  if (args.aplicar) return aplicar();

  let estado = await lerEstado();
  const statusAtual = inspecionarStatusPorProvedor(RAIZ, deck, nomeProvedor, estado.ajustes);

  if (statusAtual.gerados.length > 0 && process.stdin.isTTY) {
    console.log(
      `\nEncontradas ${statusAtual.gerados.length}/${statusAtual.totalEsperado} cartas já geradas em ${path.relative(RAIZ, pastaSaida)}/.`,
    );
    if (statusAtual.pendentes.length === 0) {
      const acao = (
        await rl.question(
          'O que você quer fazer neste tema?\n  [r] Escolher carta(s) específica(s) para regerar\n  [p] Aplicar todas as 55 artes ao jogo (public/cards/' +
            tema +
            '/)\n  [a] Regerar a carta-âncora (K♣)\n  [s] Sair\n> ',
        )
      )
        .trim()
        .toLowerCase();

      if (acao === 's' || acao === 'sair') return;
      if (acao === 'p') return aplicar();
      if (acao === 'a') {
        estado = await aprovarAncora(estado, true);
        return;
      }
      if (acao === 'r' || acao === '') {
        await regerarCartasInterativo(estado);
        return;
      }
    } else {
      const acao = (
        await rl.question(
          `Há ${statusAtual.pendentes.length} cartas pendentes e ${statusAtual.gerados.length} já geradas.\n  [Enter / c] Continuar gerando as ${statusAtual.pendentes.length} pendentes\n  [r] Escolher carta(s) já gerada(s) para regerar\n  [a] Regerar a carta-âncora (K♣)\n  [s] Sair\n> `,
        )
      )
        .trim()
        .toLowerCase();

      if (acao === 's' || acao === 'sair') return;
      if (acao === 'r') {
        await regerarCartasInterativo(estado);
        return;
      }
      if (acao === 'a') {
        estado = await aprovarAncora(estado, true);
      }
    }
  }

  if (!estado.ancoraAprovada || !existsSync(path.join(pastaSaida, ARQUIVO_ANCORA))) {
    estado = await aprovarAncora(estado);
  } else {
    console.log('Âncora já aprovada.');
  }

  const falhas = await gerarDeck(estado);
  if (falhas.length > 0) {
    console.log(`\n${falhas.length} imagens não foram geradas. Rode o comando novamente para continuar só com elas.`);
    return;
  }
  console.log(`\nAs 55 artes estão em ${path.relative(RAIZ, pastaSaida)}/`);
  abrirImagem(pastaSaida);
  const resposta = await rl.question('Aplicar ao jogo agora? (faz backup das artes antigas) [s/N] ');
  if (resposta.trim().toLowerCase() === 's') await aplicar();
  else console.log(`Quando quiser: npm run artes -- --tema ${tema} --provedor ${nomeProvedor} --aplicar`);
}

main()
  .catch((erro) => {
    console.error(`\nErro: ${(erro as Error).message}`);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
