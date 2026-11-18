export type NomeProvedor = 'gemini' | 'openai';

export interface OpcoesDeGeracao {
  prompt: string;
  /** Imagem-âncora aprovada, para manter o estilo do tema coerente. */
  referencia?: Buffer;
  qualidade?: 'low' | 'medium' | 'high';
}

export interface Provedor {
  nome: NomeProvedor;
  modelo: string;
  /** Estimativa em US$, só para informar antes de rodar. Confira a tabela oficial. */
  custoEstimadoPorImagem: number;
  gerar(opcoes: OpcoesDeGeracao): Promise<Buffer>;
}

export class ErroDeApi extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }

  get temporario(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

function exigirChave(variavel: string): string {
  const chave = process.env[variavel]?.trim();
  if (!chave) throw new Error(`Defina ${variavel} no ambiente ou em .env.local.`);
  return chave;
}

async function lerErro(resp: Response): Promise<never> {
  const corpo = await resp.text();
  throw new ErroDeApi(`HTTP ${resp.status}: ${corpo.slice(0, 500)}`, resp.status);
}

function criarGemini(modelo = 'gemini-2.5-flash-image'): Provedor {
  return {
    nome: 'gemini',
    modelo,
    custoEstimadoPorImagem: 0.039,
    async gerar({ prompt, referencia }) {
      const chave = exigirChave('GEMINI_API_KEY');
      const parts: unknown[] = [{ text: prompt }];
      if (referencia) parts.push({ inline_data: { mime_type: 'image/jpeg', data: referencia.toString('base64') } });
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '3:4' } },
        }),
      });
      if (!resp.ok) await lerErro(resp);
      const json = (await resp.json()) as {
        candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
      };
      const dados = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData?.data;
      if (!dados) {
        const motivo = json.candidates?.[0]?.finishReason ?? 'sem candidatos';
        throw new ErroDeApi(`Gemini não devolveu imagem (${motivo}).`, 422);
      }
      return Buffer.from(dados, 'base64');
    },
  };
}

function criarOpenAI(modelo = 'gpt-image-1-mini', qualidadePadrao: 'low' | 'medium' | 'high' = 'medium'): Provedor {
  const custo = { low: 0.006, medium: 0.015, high: 0.052 } as const;
  return {
    nome: 'openai',
    modelo,
    custoEstimadoPorImagem: custo[qualidadePadrao],
    async gerar({ prompt, referencia, qualidade = qualidadePadrao }) {
      const chave = exigirChave('OPENAI_API_KEY');
      const comuns = { model: modelo, prompt, size: '1024x1536', quality: qualidade, output_format: 'jpeg', n: '1' };
      let resp: Response;
      if (referencia) {
        const form = new FormData();
        for (const [k, v] of Object.entries(comuns)) form.append(k, v);
        form.append('image[]', new Blob([new Uint8Array(referencia)], { type: 'image/jpeg' }), 'referencia.jpg');
        resp = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { Authorization: `Bearer ${chave}` },
          body: form,
        });
      } else {
        resp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...comuns, n: 1 }),
        });
      }
      if (!resp.ok) await lerErro(resp);
      const json = (await resp.json()) as { data?: Array<{ b64_json?: string }> };
      const dados = json.data?.[0]?.b64_json;
      if (!dados) throw new ErroDeApi('OpenAI não devolveu imagem.', 422);
      return Buffer.from(dados, 'base64');
    },
  };
}

export function criarProvedor(nome: NomeProvedor, modelo?: string, qualidade?: 'low' | 'medium' | 'high'): Provedor {
  return nome === 'openai' ? criarOpenAI(modelo, qualidade) : criarGemini(modelo);
}
