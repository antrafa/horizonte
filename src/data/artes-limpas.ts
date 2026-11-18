import type { ThemeId } from '../types/card';

/**
 * Temas cujas artes foram regeradas sem índices de canto desenhados na imagem
 * (via `npm run artes`). Nesses temas, o modo "só arte" mostra os
 * índices do próprio app. Arquivo atualizado automaticamente pelo script ao aplicar.
 */
export const TEMAS_COM_ARTE_LIMPA: readonly ThemeId[] = [
  'arcana',
  'corsarios',
  'eclipse',
  'expedicao',
  'floresta',
  'kaiju',
  'neon',
  'noir',
  'orbital',
  'vampires',
  'wasteland',
  'zombies',
];
