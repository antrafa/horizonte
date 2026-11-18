# HORIZONTE — Zona de Conflito

**HORIZONTE** é um card game tático PvPvE jogado com um baralho convencional de **54 cartas** (52 cartas nos 4 naipes `♠ ♥ ♦ ♣` + 2 Coringas `★` / `💀`). Pode ser jogado **Solo**, em modo **Cooperativo**, ou **Competitivo PvP** — localmente na mesma mesa ou em **Mesa Online sincronizada via PeerJS P2P** — além de gerar baralhos completos em **63×88 mm** prontos para impressão.

## Principais Recursos

- **3 Modos de Jogo:** Solo, Cooperativo contra o Deck de Ameaças (12 Figuras `J`, `Q`, `K`) e Competitivo PvP.
- **Mesa de Jogo & Online P2P:** partida completa passo a passo com sala compartilhável via link direto em WebRTC (`PeerJS`).
- **12 Temas Completos com Arte Própria em Alta Resolução (660 cartas):** todos os 12 cenários possuem 54 cartas únicas ilustradas em proporção de sangria (`1024×1406 px`, >300 dpi) + verso simétrico exclusivo:
  - **Cinzas do Horizonte** (`wasteland`)
  - **Zona de Quarentena** (`zombies`)
  - **Neon e Silício** (`neon`)
  - **Estação Orbital** (`orbital`)
  - **O Último Eclipse** (`eclipse`)
  - **Sangue & Néon** (`vampires`)
  - **Expedição ao Desconhecido** (`expedicao`)
  - **Noir de Cidade Chuvosa** (`noir`)
  - **Academia de Artes Arcanas** (`arcana`)
  - **Mar de Corsários** (`corsarios`)
  - **Kaiju na Cidade** (`kaiju`)
  - **Contos da Floresta Antiga** (`floresta`)
- **Seletor Rápido de Tema & Estúdio de Cartas:** troque de tema diretamente pelo cabeçalho, alterne entre cartas completas com regras e o modo **Baralho Convencional (só arte)**, ou personalize cartas individualmente com salvamento local e exportação/importação JSON.
- **Impressão Profissional (63×88 mm Poker & 57×87 mm Bridge):** folhas A4 (grade 3×3 com ou sem sangria), exportação Card-a-Card para gráfica, versos temáticos espelhados e opção de imprimir apenas a arte para usar como baralho convencional físico.
- **Escaneador QR:** lê códigos das cartas impressas direto na câmera ou via teclado de valor/naipe.

## Desenvolvimento

### Pré-requisitos
- Node.js 18+ e npm

### Comandos

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Vite)
npm run dev

# Executar suíte de testes automatizados (Vitest)
npm test

# Gerar build de produção (TypeScript + Vite)
npm run build

# Publicar build de produção na branch gh-pages (GitHub Pages)
npm run deploy
```
