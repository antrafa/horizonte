import sharp from 'sharp';

/** Carta Poker com sangria: 67 × 92 mm. A 300 dpi isso pede 791 × 1087 px. */
export const PROPORCAO_COM_SANGRIA = 67 / 92;
export const MINIMO_300_DPI = { largura: 791, altura: 1087 } as const;

/** Recorta para a proporção da carta com sangria e grava em JPEG. Falha se ficar abaixo de 300 dpi. */
export async function normalizarArte(bruta: Buffer): Promise<{ jpeg: Buffer; largura: number; altura: number }> {
  const meta = await sharp(bruta).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error('Imagem inválida devolvida pela API.');

  let largura = w;
  let altura = Math.round(w / PROPORCAO_COM_SANGRIA);
  if (altura > h) {
    altura = h;
    largura = Math.round(h * PROPORCAO_COM_SANGRIA);
  }
  if (largura < MINIMO_300_DPI.largura || altura < MINIMO_300_DPI.altura) {
    throw new Error(
      `Resolução insuficiente: ${largura}×${altura} px (mínimo ${MINIMO_300_DPI.largura}×${MINIMO_300_DPI.altura} para 300 dpi).`,
    );
  }

  const jpeg = await sharp(bruta)
    .resize(largura, altura, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
  return { jpeg, largura, altura };
}
