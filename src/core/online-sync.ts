import { Peer, type DataConnection } from 'peerjs';
import { DEFAULT_THEME_ID } from '../data/index';
import type { ThemeId } from '../types/card';
import type { ModoDeJogo, Naipe, Nivel, Partida } from './partida';

export interface PreparoSala {
  modo: ModoDeJogo;
  nivel: Nivel;
  jogadores: Array<{ nome: string; classe: Naipe }>;
}

export interface MensagemP2P {
  tipo: 'sync' | 'pedirSync' | 'salaEncerrada' | 'parceiroSaiu';
  temaId: ThemeId;
  preparo: PreparoSala | null;
  partida: Partida | null;
  versao: number;
  enviadoEm: number;
}

let peerInstancia: Peer | null = null;
const conexoesAtivas: Set<DataConnection> = new Set();
let onReceberMensagemCallback: ((msg: MensagemP2P) => void) | null = null;
let onStatusConexaoCallback: ((online: boolean) => void) | null = null;

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

export function registrarCallbacksP2P(
  onMsg: (msg: MensagemP2P) => void,
  onStatus: (online: boolean) => void,
): void {
  onReceberMensagemCallback = onMsg;
  onStatusConexaoCallback = onStatus;
}

export function temParceiroConectado(): boolean {
  for (const conn of conexoesAtivas) {
    if (conn.open) return true;
  }
  return false;
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
      configurarConexao(conn, true);
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
      falhar('A sala não respondeu. Verifique se o código está correto e se o anfitrião está com a mesa aberta.');
    }, 8000);

    peerCliente.on('open', () => {
      const conn = peerCliente.connect(idPeerAlvo, { reliable: true });

      conn.on('open', () => {
        if (finalizado) return;
        finalizado = true;
        if (timeout) clearTimeout(timeout);
        configurarConexao(conn, false);
        onSucesso(limpo);
        conn.send({
          tipo: 'pedirSync',
          temaId: DEFAULT_THEME_ID,
          preparo: null,
          partida: null,
          versao: 0,
          enviadoEm: Date.now(),
        } satisfies MensagemP2P);
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

function configurarConexao(conn: DataConnection, retransmitirComoHost: boolean): void {
  conexoesAtivas.add(conn);
  onStatusConexaoCallback?.(temParceiroConectado());

  conn.on('open', () => {
    onStatusConexaoCallback?.(temParceiroConectado());
  });

  conn.on('data', (dados: unknown) => {
    if (!dados || typeof dados !== 'object') return;
    const msg = dados as MensagemP2P;

    if (retransmitirComoHost && msg.tipo === 'sync') {
      for (const outra of conexoesAtivas) {
        if (outra !== conn && outra.open) {
          try {
            outra.send(msg);
          } catch {}
        }
      }
    }

    onReceberMensagemCallback?.(msg);
  });

  conn.on('close', () => {
    conexoesAtivas.delete(conn);
    onStatusConexaoCallback?.(temParceiroConectado());
  });

  conn.on('error', () => {
    conexoesAtivas.delete(conn);
    onStatusConexaoCallback?.(temParceiroConectado());
  });
}

export function enviarEstadoParaSala(
  temaId: ThemeId,
  preparo: PreparoSala,
  partida: Partida | null,
  versao: number,
): void {
  const msg: MensagemP2P = {
    tipo: 'sync',
    temaId,
    preparo,
    partida,
    versao,
    enviadoEm: Date.now(),
  };

  for (const conn of conexoesAtivas) {
    if (conn.open) {
      try {
        conn.send(msg);
      } catch {}
    }
  }
}

export function avisarSalaEncerrada(): void {
  const msg: MensagemP2P = {
    tipo: 'salaEncerrada',
    temaId: DEFAULT_THEME_ID,
    preparo: null,
    partida: null,
    versao: 0,
    enviadoEm: Date.now(),
  };

  for (const conn of conexoesAtivas) {
    if (conn.open) {
      try {
        conn.send(msg);
      } catch {}
    }
  }
}

export function avisarSaidaDaSala(): void {
  const msg: MensagemP2P = {
    tipo: 'parceiroSaiu',
    temaId: DEFAULT_THEME_ID,
    preparo: null,
    partida: null,
    versao: 0,
    enviadoEm: Date.now(),
  };

  for (const conn of conexoesAtivas) {
    if (conn.open) {
      try {
        conn.send(msg);
      } catch {}
    }
  }
}

export function desconectarP2P(): void {
  for (const conn of conexoesAtivas) {
    try {
      conn.close();
    } catch {}
  }
  conexoesAtivas.clear();

  if (peerInstancia) {
    try {
      peerInstancia.destroy();
    } catch {}
    peerInstancia = null;
  }
  onStatusConexaoCallback?.(false);
}
