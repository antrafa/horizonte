import { Peer, type DataConnection } from 'peerjs';
import { DEFAULT_THEME_ID } from '../data/index';
import type { ThemeId } from '../types/card';
import type { Acao, CartaAcao, FiguraHorizonte, ModoDeJogo, Naipe, Nivel, Partida } from './partida';

export interface PreparoSala {
  modo: ModoDeJogo;
  nivel: Nivel;
  jogadores: Array<{ nome: string; classe: Naipe }>;
}

export interface EstadoSalaRecebido {
  temaId: ThemeId;
  preparo: PreparoSala;
  partida: Partida | null;
  meuAssento: number | null;
  assentosConectados: boolean[];
  totalConectados: number;
  versao: number;
  aviso?: string;
}

export type MensagemClienteParaHost =
  | { tipo: 'pedirSync' }
  | { tipo: 'ocuparAssento'; assento: number }
  | { tipo: 'atualizarJogador'; assento: number; nome?: string; classe?: Naipe }
  | { tipo: 'acao'; acao: Acao }
  | { tipo: 'parceiroSaiu' };

export type MensagemHostParaCliente =
  | ({ tipo: 'estado' } & EstadoSalaRecebido)
  | { tipo: 'salaEncerrada' };

export interface CallbacksP2P {
  onEstadoRecebido: (estado: EstadoSalaRecebido) => void;
  onSalaEncerrada: () => void;
  onMensagemClienteNoHost: (peerId: string, msg: MensagemClienteParaHost) => void;
  onPeersMudaram: (peerIdsConectados: string[]) => void;
  onStatusConexao: (online: boolean) => void;
}

const CARTA_OCULTA: CartaAcao = { valor: 0, naipe: 'spades' };
const FIGURA_OCULTA: FiguraHorizonte = { posto: 'J', naipe: 'spades' };

export function ehCartaOculta(carta: CartaAcao): boolean {
  return 'valor' in carta && carta.valor === 0;
}

/**
 * Projeta a partida para a visão de um jogador específico na sala online.
 * Nunca vaza a ordem do baralho de compra, do deck do Horizonte nem a mão de outros jogadores.
 */
export function mascararPartidaParaJogador(partida: Partida, meuAssento: number | null): Partida {
  return {
    ...partida,
    baralhoCompra: partida.baralhoCompra.map(() => CARTA_OCULTA),
    horizonteDeck: partida.horizonteDeck.map(() => FIGURA_OCULTA),
    jogadores: partida.jogadores.map((j, idx) => {
      if (meuAssento !== null && idx === meuAssento) return j;
      return {
        ...j,
        mao: j.mao.map(() => CARTA_OCULTA),
      };
    }),
  };
}

let peerInstancia: Peer | null = null;
const conexoesPorPeer: Map<string, DataConnection> = new Map();
let conexaoParaHost: DataConnection | null = null;
let callbacks: CallbacksP2P | null = null;

function gerarPrefixoSala(codigo: string): string {
  const limpo = codigo.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `horizonte-sala-${limpo}`;
}

export function gerarCodigoSalaAleatorio(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export function registrarCallbacksP2P(cb: CallbacksP2P): void {
  callbacks = cb;
}

export function listarPeersConectados(): string[] {
  const abertos: string[] = [];
  for (const [peerId, conn] of conexoesPorPeer.entries()) {
    if (conn.open) abertos.push(peerId);
  }
  return abertos;
}

export function temParceiroConectado(): boolean {
  if (conexaoParaHost?.open) return true;
  return listarPeersConectados().length > 0;
}

function notificarMudancaDePeers(): void {
  callbacks?.onPeersMudaram(listarPeersConectados());
  callbacks?.onStatusConexao(temParceiroConectado());
}

export function criarSalaHost(
  codigoSala: string,
  onSucesso: (codigoExibicao: string) => void,
  onErro: (err: string) => void,
): void {
  desconectarP2P();

  const idPeerAlvo = gerarPrefixoSala(codigoSala);
  let aberto = false;

  try {
    const peer = new Peer(idPeerAlvo);
    peerInstancia = peer;

    peer.on('open', () => {
      aberto = true;
      onSucesso(codigoSala.toUpperCase());
    });

    peer.on('connection', (conn) => {
      configurarConexaoNoHost(conn);
    });

    peer.on('error', (err: { type?: string; message?: string }) => {
      if (!aberto) desconectarP2P();
      const msg =
        err?.type === 'unavailable-id'
          ? 'Esse código de sala já está em uso. Tente criar novamente.'
          : err?.message || 'Não foi possível criar a sala.';
      onErro(msg);
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Falha ao iniciar Peer.';
    onErro(message);
  }
}

export function entrarSalaCliente(
  codigoSala: string,
  onSucesso: (codigoExibicao: string) => void,
  onErro: (err: string) => void,
): void {
  desconectarP2P();

  const limpo = codigoSala.trim().toUpperCase();
  if (!limpo) {
    onErro('Digite um código de sala válido.');
    return;
  }

  const idPeerAlvo = gerarPrefixoSala(limpo);
  let finalizado = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const falhar = (mensagem: string): void => {
    if (finalizado) return;
    finalizado = true;
    if (timeout) clearTimeout(timeout);
    desconectarP2P();
    onErro(mensagem);
  };

  try {
    const peerCliente = new Peer();
    peerInstancia = peerCliente;

    timeout = setTimeout(() => {
      falhar('A sala não respondeu. Verifique o código, se o anfitrião está com a mesa aberta ou teste no Wi-Fi.');
    }, 9000);

    peerCliente.on('open', () => {
      const conn = peerCliente.connect(idPeerAlvo, { reliable: true });

      conn.on('open', () => {
        if (finalizado) return;
        finalizado = true;
        if (timeout) clearTimeout(timeout);
        conexaoParaHost = conn;
        configurarConexaoNoCliente(conn);
        onSucesso(limpo);
        enviarParaHost({ tipo: 'pedirSync' });
      });

      conn.on('error', () => {
        falhar('Falha na conexão com a sala.');
      });
    });

    peerCliente.on('error', (err: { type?: string; message?: string }) => {
      const msg =
        err?.type === 'peer-unavailable'
          ? 'Sala não encontrada. Confira o código e se o anfitrião está com a mesa aberta.'
          : err?.message || 'Erro ao conectar à rede P2P.';
      falhar(msg);
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Falha ao iniciar cliente P2P.';
    falhar(message);
  }
}

function configurarConexaoNoHost(conn: DataConnection): void {
  const peerId = conn.peer;
  conexoesPorPeer.set(peerId, conn);

  conn.on('open', () => {
    notificarMudancaDePeers();
  });

  conn.on('data', (dados: unknown) => {
    if (!dados || typeof dados !== 'object') return;
    const msg = dados as MensagemClienteParaHost;
    callbacks?.onMensagemClienteNoHost(peerId, msg);
  });

  const remover = (): void => {
    if (conexoesPorPeer.get(peerId) === conn) {
      conexoesPorPeer.delete(peerId);
    }
    notificarMudancaDePeers();
  };

  conn.on('close', remover);
  conn.on('error', remover);
}

function configurarConexaoNoCliente(conn: DataConnection): void {
  callbacks?.onStatusConexao(true);

  conn.on('data', (dados: unknown) => {
    if (!dados || typeof dados !== 'object') return;
    const msg = dados as MensagemHostParaCliente;
    if (msg.tipo === 'salaEncerrada') {
      callbacks?.onSalaEncerrada();
      return;
    }
    if (msg.tipo === 'estado') {
      callbacks?.onEstadoRecebido({
        temaId: msg.temaId ?? DEFAULT_THEME_ID,
        preparo: msg.preparo,
        partida: msg.partida,
        meuAssento: msg.meuAssento ?? null,
        assentosConectados: Array.isArray(msg.assentosConectados) ? msg.assentosConectados : [],
        totalConectados: msg.totalConectados ?? 1,
        versao: msg.versao ?? 0,
        aviso: msg.aviso,
      });
    }
  });

  const aoFechar = (): void => {
    if (conexaoParaHost === conn) {
      conexaoParaHost = null;
    }
    callbacks?.onStatusConexao(false);
  };

  conn.on('close', aoFechar);
  conn.on('error', aoFechar);
}

export function enviarParaHost(msg: MensagemClienteParaHost): boolean {
  if (!conexaoParaHost?.open) return false;
  try {
    conexaoParaHost.send(msg);
    return true;
  } catch {
    return false;
  }
}

export function enviarEstadoParaPeer(peerId: string, estado: EstadoSalaRecebido): void {
  const conn = conexoesPorPeer.get(peerId);
  if (!conn?.open) return;
  const msg: MensagemHostParaCliente = { tipo: 'estado', ...estado };
  try {
    conn.send(msg);
  } catch {}
}

export function avisarSalaEncerrada(): void {
  const msg: MensagemHostParaCliente = { tipo: 'salaEncerrada' };
  for (const conn of conexoesPorPeer.values()) {
    if (conn.open) {
      try {
        conn.send(msg);
      } catch {}
    }
  }
}

export function avisarSaidaDaSala(): void {
  enviarParaHost({ tipo: 'parceiroSaiu' });
}

export function desconectarP2P(): void {
  for (const conn of conexoesPorPeer.values()) {
    try {
      conn.close();
    } catch {}
  }
  conexoesPorPeer.clear();

  if (conexaoParaHost) {
    try {
      conexaoParaHost.close();
    } catch {}
    conexaoParaHost = null;
  }

  if (peerInstancia) {
    try {
      peerInstancia.destroy();
    } catch {}
    peerInstancia = null;
  }
  callbacks?.onStatusConexao(false);
}
