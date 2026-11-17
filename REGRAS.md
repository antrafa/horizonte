# HORIZONTE — Zona de Conflito: Regras

As cartas na sua mão são, ao mesmo tempo, **sua munição e sua armadura**. Toda carta gasta para bloquear um golpe é uma carta a menos para o próximo ataque, porque no fim do turno você compra só **1 carta**. Cada Figura do Horizonte tem um **traço** que muda o que funciona contra ela, e a ordem em que aparecem muda a cada partida.

Este documento descreve as regras oficiais, as mesmas que o motor do app executa (`src/core/partida.ts`).

---

## 1. O que é o jogo e o que você precisa

**HORIZONTE** é um card game tático para **1 a 4 jogadores**, jogado com **um baralho convencional de 54 cartas** (52 cartas dos 4 naipes `♠ ♥ ♦ ♣` + 2 Coringas `★` e `💀`) ou com qualquer um dos 12 baralhos temáticos do projeto.

O baralho se divide em dois montes:

1. **O Horizonte (12 Figuras):** os 4 Valetes (`J`), 4 Damas (`Q`) e 4 Reis (`K`). São os inimigos, que você derrota como Troféu ou recruta como Aliado.
2. **O Deck de Ação (42 cartas):** as 40 cartas de `A` a `10` e os 2 Coringas. É de onde vem a sua mão para atacar, curar, comprar e bloquear.

Você também precisa de um jeito de marcar vida (dado, clipe ou papel).

---

## 2. Preparação

1. **Monte o Horizonte em 3 ondas.** Embaralhe os 4 Reis e ponha no fundo; embaralhe as 4 Damas e ponha por cima; embaralhe os 4 Valetes e ponha no topo. Você enfrenta primeiro os Valetes, depois as Damas e por último os Reis, mas a ordem dentro de cada onda é sorteada.
2. **Embaralhe o Deck de Ação** (40 cartas numéricas + `★` + `💀`).
3. **Escolha o nível.** Ele só muda a vida dos jogadores; o resto da regra é igual.

   | Nível | Vida inicial e máxima | Para quem |
   | :--- | :---: | :--- |
   | **Recruta** | **20 PV** | Primeira partida, ou para aprender com folga |
   | **Veterano** (padrão) | **15 PV** | A regra normal |
   | **Lenda** | **12 PV** | Quem já vence com frequência |

4. **Escolha uma Especialização** (um naipe por jogador). Sempre que sua jogada tiver ao menos uma carta desse naipe, o efeito do naipe fica mais forte:

   | Especialização | Bônus na jogada com o naipe |
   | :--- | :--- |
   | `♠` **Atirador** | **+2 de dano** |
   | `♥` **Médico / Diplomata** | **cura +2 PV** |
   | `♦` **Engenheiro / Hacker** | **compra +1 carta** |
   | `♣` **Sabotador** | **a Ameaça perde +2 de ataque** neste turno |
5. **Compre 5 cartas.** A mão nunca passa de **6 cartas**.
6. **Revele a primeira Figura** do Horizonte no centro da mesa. Ela é a **Ameaça Ativa**.

---

## 3. As Ameaças do Horizonte

### 3.1. Vida, ataque e recompensa

| Posto | Onda | Vida | Ataque | Se você **Abater** | Se você **Recrutar** |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Valete (`J`)** | 1ª | **12** | **4** | Troféu de **10 pts** + compra **1 carta** | Aliado com **2 usos** |
| **Dama (`Q`)** | 2ª | **18** | **6** | Troféu de **15 pts** + compra **2 cartas** | Aliado com **2 usos** |
| **Rei (`K`)** | 3ª | **26** | **8** | Troféu de **25 pts** + compra **2 cartas** | Aliado com **3 usos** |

**No modo Cooperativo**, cada Ameaça tem vida extra por jogador além do primeiro: **+2** (Valete), **+3** (Dama) ou **+4** (Rei). Exemplo: com 3 jogadores, um Rei tem 26 + 2×4 = **34 PV**. O motivo: o grupo soma o dano de todos, mas a Ameaça só ataca quem está jogando.

### 3.2. O traço de cada Ameaça

O naipe da Figura dá a ela um traço. A força do traço cresce com o posto.

| Naipe | Traço | O que faz | Valete · Dama · Rei | Como lidar |
| :---: | :--- | :--- | :---: | :--- |
| `♠` | **Feroz** | Ataca com força extra (já somada ao Ataque dela). | +1 · +2 · +3 | Derrube rápido, ou guarde cartas para bloquear. |
| `♥` | **Regenera** | No fim de cada turno em que sobrevive, recupera vida (até o máximo dela). | 2 · 3 · 4 | Dano picado não adianta: junte um combo e acabe com ela de uma vez. |
| `♦` | **Blindada** | Cada golpe que ela recebe causa menos dano (também o dano de Aliado). | −1 · −2 · −3 | Golpes pequenos quase não passam: use cartas altas e combos. |
| `♣` | **Imune a armadilhas** | Nada reduz o ataque dela: `♣`, `★` e Aliados de `♣` não funcionam. | — | Você vai ter que bloquear com cartas ou com o Escudo de um Aliado. |

### 3.3. O chefe do tema

A **última Figura** do Horizonte (a 12ª, sempre um Rei) é o chefe do tema. Além do traço do naipe, ela ganha a regra do chefe, que vale enquanto ela estiver em jogo. Cada tema tem uma regra diferente, então o fim da partida muda de tema para tema.

| Tema | Chefe | Regra | O que faz |
| :--- | :--- | :--- | :--- |
| Cinzas do Horizonte | O Soberano da Cratera | **Racionamento** | ♦, ★ e Aliados de ♦ não compram cartas. |
| Zona de Quarentena | O Paciente Zero | **Levanta de Novo** | Ao cair pela 1ª vez, volta com metade da Vida; só então pode ser recrutado. |
| Neon e Silício | A Corporação | **Firewall** | Golpes de 8 ou menos de dano não passam. |
| O Último Eclipse | O Devorador do Sol | **Fome Crescente** | Ganha +2 de Ataque no fim de cada turno. |
| Sangue & Néon | O Antediluviano | **Sede** | Recupera 2× o dano que te causa depois do bloqueio. |
| Expedição ao Desconhecido | O Coração da Selva | **A Trilha Se Fecha** | Recupera 3 PV no fim de cada turno (soma com o traço ♥). |
| Noir de Cidade Chuvosa | O Homem que Não Aparece nas Fotos | **Sem Retrato** | Golpe de dano ímpar não acerta: só dano par passa. |
| Estação Orbital | A Inteligência da Nave | **Portas Seladas** | Só dá para bloquear com 1 carta por ataque (o Escudo de Aliado vale). |
| Academia de Artes Arcanas | O Diretor Que Ninguém Viu | **Detenção** | Ninguém compra cartas além de 3 na mão. |
| Mar de Corsários | O Navio Fantasma do Almirante | **Abordagem** | Sempre que ele te causa dano, leva 2 cartas aleatórias da sua mão. |
| Kaiju na Cidade | O Titã Adormecido | **Colossal** | Tem +20 PV. |
| Contos da Floresta Antiga | A Rainha do Inverno Sem Fim | **Geada** | Ninguém cura, e cada carta de bloqueio absorve 1 a menos. |

Na simulação com um robô que joga bem, o chefe derruba a vitória no Solo de cerca de 94% para algo entre 76% e 88%, conforme o tema.

### 3.4. Abater ou Recrutar

Quando um golpe zera a vida da Ameaça, ela é derrotada na hora e **não contra-ataca**. Você escolhe o destino dela:

- **Abater (padrão, com qualquer carta):** ela vai para a sua pilha de **Troféus** e você compra as cartas de recompensa (respeitando o limite de 6 na mão).
- **Recrutar (só se a jogada que deu o golpe final tiver `♥`, `♦`, `★` ou `💀`):** ela vem para o seu lado da mesa como **Aliado**, com 2 ou 3 usos. Recrutar não dá cartas de recompensa.
  - **Limite de 2 Aliados.** Se você recrutar um terceiro, o mais antigo vai para os seus Troféus valendo **metade dos pontos** (5, 7 ou 12).
  - O dano conta depois da blindagem: contra uma Ameaça Blindada, o golpe precisa zerar a vida já descontada a blindagem.

---

## 4. Os naipes no ataque

O **valor** das cartas define a força do golpe (o Valor Base). Os **naipes presentes na jogada** disparam efeitos ao mesmo tempo:

| Naipe | Pilar | Efeito ao atacar | Permite Recrutar? |
| :---: | :--- | :--- | :---: |
| `♠` | Chumbo & Lâmina | **+2 de dano** (1 vez por jogada). | Não |
| `♣` | Sucata & Armadilha | **Contra a Ameaça:** ela perde ataque igual à **metade do Valor Base** (arredonde para cima), só neste turno. **Contra um rival (PvP):** se o golpe causar **6 ou mais** de dano, puxe **às cegas 1 carta** da mão dele e descarte-a. | Não |
| `♥` | Suprimento & Carisma | Cura PV igual à **metade do Valor Base** (arredonde para cima). No Cooperativo, cura o jogador vivo com menos PV; nos outros modos, cura você. | **Sim** |
| `♦` | Tecnologia & Combustível | Compra **1 carta** (ou **2** se o Valor Base for **7 ou mais**), até o limite de 6 na mão. | **Sim** |

> **Combos com vários naipes:** todos os naipes da jogada disparam usando o Valor Base do combo inteiro. Um Par `6♠ + 6♥` (Valor Base 12) ganha os +2 de `♠`, cura 6 PV por causa de `♥` e permite Recrutar.

---

## 5. Jogadas válidas e Coringas

Na sua jogada principal você escolhe **um** destes padrões:

1. **Carta única.** `2` a `10` valem o seu número; um **Ás sozinho vale 5**.
2. **Par, Trinca ou Quadra** (2 a 4 cartas do mesmo número): os valores somam. Para Ases, o primeiro vale 5 e cada Ás extra soma +4 (Par de Ases = 9).
3. **Combo de Comando** (1 carta de `2` a `10` + 1 Ás): o Ás soma **+4** ao valor da carta e acrescenta o naipe dele à jogada. Exemplo: `7♠ + A♥` = Valor Base 11, causa 13 de dano, cura 6 PV e permite Recrutar.

**Dano da jogada:**

```text
Dano = Valor Base + (tem ♠? +2) + (você é Atirador e tem ♠? +2)
```

Contra uma Ameaça **Blindada**, desconte a blindagem desse total. Alguns chefes também mudam o dano (seção 3.3).

**Coringas** são sempre jogados sozinhos, não têm naipe e permitem Recrutar:

- **`★` Coringa Claro:** 5 de dano, cura 4 PV, compra 2 cartas e reduz o ataque da Ameaça em 3 neste turno (inclusive quando você mira um rival). Bloqueia 5.
- **`💀` Coringa Escuro:** 8 de dano no alvo escolhido, mas você perde 2 PV de recuo na hora. Bloqueia 8.

---

## 6. O turno, passo a passo

### Passo 1 — Usar um Aliado (opcional)

Você pode gastar **1 uso de 1 Aliado**. Esse é o **único uso de Aliado do turno**: se usar aqui, não poderá usar o Escudo no Passo 3.

| Naipe do Aliado | Valete (2 usos) | Dama (2 usos) | Rei (3 usos) |
| :---: | :--- | :--- | :--- |
| `♠` | 2 de dano na Ameaça (ou num rival, no PvP) | 4 de dano | 6 de dano |
| `♣` | A Ameaça perde 2 de ataque neste turno | perde 4 | perde 6 |
| `♦` | Compra 1 carta | compra 2 | compra 3 |
| `♥` | Cura 2 PV (no Coop, quem tem menos PV) | cura 4 | cura 6 |

- Quando os usos acabam, o Aliado vai para os seus Troféus valendo metade dos pontos.
- **Se o disparo de um Aliado de `♠` zerar a vida da Ameaça**, ela é Abatida (Troféu + cartas de recompensa), a próxima Figura é revelada e **você continua o seu turno** no Passo 2, já contra a nova Ameaça.

### Passo 2 — Ação principal

Escolha uma:

- **Atacar a Ameaça:** jogue uma jogada válida. Se zerar a vida dela, escolha Abater ou Recrutar.
- **Atacar um rival (só no PvP):** o dano vai direto nos PV dele, e ele **não pode bloquear**. Não dá para mirar um rival que já está com 0 PV.
- **Passar e reciclar:** não ataque e descarte até **2 cartas** da mão.

> **Ordem de resolução da jogada:** as cartas vão para o descarte → cura → compra → recuo do `💀` → dano no alvo. Se o recuo do `💀` levar você a 0 PV, você cai antes do contra-ataque.

### Passo 3 — Contra-ataque e bloqueio

Se a Ameaça continuar viva depois da sua ação (você atacou e não a derrotou, atacou um rival ou passou), ela **ataca você**:

```text
Ataque efetivo = Ataque da Ameaça − reduções do turno (♣, ★, Aliado de ♣)
```

Contra uma Ameaça Imune a armadilhas, não há reduções. Se o ataque efetivo for maior que 0, você pode:

- **Descartar cartas da mão** para bloquear: cada uma bloqueia o próprio valor (`2`–`10` = o número; `A` = 5; `★` = 5; `💀` = 8).
- **Usar o Escudo de um Aliado** (+4 de bloqueio, gasta 1 uso), **se ainda não usou Aliado neste turno**.

O dano que sobrar sai dos seus PV.

### Passo 4 — Fim do turno

1. **Compre 1 carta** (se tiver menos de 6 na mão).
2. As reduções de ataque da Ameaça acabam.
3. Se a Ameaça for **Regenera** e tiver sobrevivido, ela recupera vida. Chefes com Fome Crescente ou A Trilha Se Fecha aplicam a regra deles aqui.
4. A vez passa ao próximo jogador vivo.

Se o Deck de Ação acabar, embaralhe o descarte para formar um novo.

---

## 7. Modos de jogo e vitória

### 7.1. Solo (1 jogador)

Você enfrenta as 12 Figuras em sequência. **Vence** ao derrotar a 12ª Figura com pelo menos 1 PV; **perde** ao chegar a 0 PV.

No fim, vencendo ou perdendo, anote a **pontuação** e tente bater o seu recorde em cada nível:

```text
Pontuação = Pontos de Troféu + PV atuais + metade dos pontos de cada Aliado ativo
          + 50 se venceu + 2 por rodada abaixo de 40 (só se venceu)
```

Recrutar dá um Aliado forte, mas vale menos pontos que Abater; bloquear tudo poupa PV, mas gasta rodadas. A pontuação torna essas escolhas mais interessantes.

### 7.2. Cooperativo (2 a 4 jogadores)

Todos enfrentam a mesma Ameaça, alternando turnos. As Ameaças têm vida extra por jogador (seção 3.1).

- O dano na vida da Ameaça fica para o próximo colega; as reduções de ataque valem só no turno de quem as aplicou.
- Cartas e Aliados de `♥` curam o jogador vivo com menos PV.
- **Vitória:** limpar as 12 Figuras com todos vivos. **Derrota:** se qualquer jogador chegar a 0 PV, o grupo inteiro perde.

### 7.3. Competitivo PvP (2 a 4 jogadores)

Todos dividem a mesma Ameaça, mas competem entre si. Atacar um rival tira PV dele sem chance de bloqueio, mas deixa a Ameaça viva para contra-atacar você.

1. **Último sobrevivente:** se todos os rivais caírem, você vence na hora.
2. **Domínio:** se mais de um jogador estiver vivo quando a 12ª Figura cair, vence quem tiver mais pontos:

   ```text
   Domínio = Pontos de Troféu + PV atuais + metade dos pontos de cada Aliado ainda ativo
   ```

   Em caso de empate, vence quem tiver mais PV.

---

## 8. Por que cada partida é diferente

- **A ordem das Figuras muda.** Cada onda tem um Valete, uma Dama e um Rei de cada naipe, mas a ordem é sorteada. Pegar a Dama Blindada logo depois do Valete que Regenera pede uma mão diferente de pegar a Dama Imune.
- **O traço decide o que guardar.** Contra uma Ameaça Regenera, você junta cartas para um golpe só; contra uma Blindada, cartas baixas viram bloqueio; contra uma Imune, `♣` vale só como dano.
- **Recrutar muda o jogo seguinte.** Um Rei de `♣` recrutado protege contra as Ameaças seguintes; um Rei de `♠` acelera as mortes. Abater dá cartas e pontos agora.
- **O chefe muda com o tema.** Cada um dos 12 temas termina com um chefe de regra própria (seção 3.3): contra o Firewall você guarda combos; contra a Sede você bloqueia tudo; contra a Detenção você entra com a mão já cheia.
- **Especializações com papéis.** O Atirador bate mais forte, o Médico cura mais, o Engenheiro compra mais e o Sabotador segura o ataque. No Cooperativo, cada pessoa cobre uma parte do problema.
- **Pontuação no Solo.** Vencer não é tudo: dá para vencer melhor (mais rápido, com mais PV e mais Troféus) e bater o próprio recorde.
- **Nível e modo.** Três níveis e três modos mudam o ritmo da partida.
- **12 temas.** As regras são as mesmas; o mundo, os nomes e a arte mudam.

---

## 9. Catálogo mecânico das 54 cartas

O efeito de cada carta é fixo pelo valor e pelo naipe, igual em todos os temas. O app mostra o texto completo de cada carta, com o nome no tema, na aba **Oráculo**.

### 9.1. As 12 Figuras

| Figura | Como Ameaça | Abater | Recrutar (cada uso; ou Escudo de +4) |
| :---: | :--- | :--- | :--- |
| `J♠` · `Q♠` · `K♠` | 12/18/26 PV · Ataque 5/8/11 · **Feroz** | 10/15/25 pts + 1/2/2 cartas | 2/4/6 de dano na Ameaça ou num rival |
| `J♥` · `Q♥` · `K♥` | 12/18/26 PV · Ataque 4/6/8 · **Regenera** 2/3/4 | 10/15/25 pts + 1/2/2 cartas | cura 2/4/6 PV |
| `J♦` · `Q♦` · `K♦` | 12/18/26 PV · Ataque 4/6/8 · **Blindada** 1/2/3 | 10/15/25 pts + 1/2/2 cartas | compra 1/2/3 cartas |
| `J♣` · `Q♣` · `K♣` | 12/18/26 PV · Ataque 4/6/8 · **Imune a armadilhas** | 10/15/25 pts + 1/2/2 cartas | a Ameaça perde 2/4/6 de ataque no turno |

### 9.2. As 40 cartas numéricas

Todas bloqueiam o próprio valor (Ás = 5). Os números abaixo são para a carta jogada sozinha, sem Especialização.

| Carta | Valor | `♠` dano | `♥` dano · cura | `♦` dano · compra | `♣` dano · redução de ataque |
| :---: | :---: | :---: | :---: | :---: | :---: |
| `A` | 5 | 7 | 5 · 3 | 5 · 1 | 5 · 3 |
| `2` | 2 | 4 | 2 · 1 | 2 · 1 | 2 · 1 |
| `3` | 3 | 5 | 3 · 2 | 3 · 1 | 3 · 2 |
| `4` | 4 | 6 | 4 · 2 | 4 · 1 | 4 · 2 |
| `5` | 5 | 7 | 5 · 3 | 5 · 1 | 5 · 3 |
| `6` | 6 | 8 | 6 · 3 | 6 · 1 | 6 · 3 |
| `7` | 7 | 9 | 7 · 4 | 7 · 2 | 7 · 4 |
| `8` | 8 | 10 | 8 · 4 | 8 · 2 | 8 · 4 |
| `9` | 9 | 11 | 9 · 5 | 9 · 2 | 9 · 5 |
| `10` | 10 | 12 | 10 · 5 | 10 · 2 | 10 · 5 |

No PvP, uma jogada com `♣` que causa 6 ou mais de dano a um rival também tira 1 carta da mão dele, puxada às cegas.

### 9.3. Os 2 Coringas

| Carta | Dano e bloqueio | Ao atacar | Recruta? |
| :---: | :---: | :--- | :---: |
| `★` | 5 | Cura 4 PV, compra 2 cartas e reduz o ataque da Ameaça em 3 no turno | Sim |
| `💀` | 8 | Você perde 2 PV de recuo | Sim |

---

## 10. Os 12 temas

As regras são as mesmas em todos os temas; cada um muda o que é o Horizonte, quem são as facções de cada naipe e o nome de cada carta.

### 10.1. Cinzas do Horizonte (`wasteland`) — *Mundo Pós-Apocalíptico — Terra Devastada*

- **Premissa:** *O Velho Mundo virou ferrugem. No Horizonte, você abate seus inimigos ou os recruta para sobreviver.*
- **Tom da Narrativa:** sobrevivência tática, pó e ferrugem
- **O que é o Horizonte neste mundo:** A Terra Devastada e as rodovias de ferrugem. Cada Figura revelada no centro da mesa é um saqueador blindado, mutante radioativo, drone autômato ou profeta da cisterna disputando a última refinaria.
- **Dinâmica Tática dos Naipes:** ♠ Chumbo & Lâmina perfura blindagens; ♣ Sucata & Armadilha ergue barricadas e reduz ataques; ♦ Tecnologia compra peças extras; ♥ Água & Soro cura PV e recruta sobreviventes.
- **Chefe Supremo (Clímax da 3ª Onda):** **O Soberano da Cratera** — *Senhor supremo dos comboios blindados que controla a última refinaria e as reservas de água limpa.*
- **Regra do chefe:** **Racionamento** — ♦, ★ e Aliados de ♦ não compram cartas.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Chumbo & Lâmina · Comboio da Ferrugem
  - **`♥` Copas (Suprimento & Carisma):** Suprimento & Carisma · Ordem da Água Pura
  - **`♦` Ouros (Tecnologia & Combustível):** Tecnologia & Combustível · Bunker Autômato
  - **`♣` Paus (Sucata & Armadilha):** Sucata & Armadilha · Enxame Radioativo

### 10.2. Zona de Quarentena (`zombies`) — *Apocalipse Zumbi — Sobrevivência Urbana*

- **Premissa:** *Cada ruído na rua pode atrair a horda. Cada silêncio esconde uma mordida.*
- **Tom da Narrativa:** sobrevivência, tenso
- **O que é o Horizonte neste mundo:** A Zona de Quarentena cercada por bloqueios sanitários. As Figuras representam líderes da horda, sobreviventes hostis, equipamentos militares e cepas letais.
- **Dinâmica Tática dos Naipes:** Abata hordas com ♠/♣ para limpar a quarentena ou use ♥/♦ para resgatar especialistas e hackear equipamentos de campo antes da mordida.
- **Chefe Supremo (Clímax da 3ª Onda):** **O Paciente Zero** — *O primeiro infectado ainda pensa. Ele guia a horda até vocês.*
- **Regra do chefe:** **Levanta de Novo** — Ao cair pela 1ª vez, volta com metade da Vida; só então pode ser recrutado.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Patrulha & Lâmina
  - **`♥` Copas (Suprimento & Carisma):** Triagem & Vínculo
  - **`♦` Ouros (Tecnologia & Combustível):** Saque & Engenho
  - **`♣` Paus (Sucata & Armadilha):** Sombra & Mutação

### 10.3. Neon e Silício (`neon`) — *Cyberpunk — Crônica da Cidade que Não Seca*

- **Premissa:** *Na cidade onde a chuva nunca para, cada senha é uma porta, cada implante é uma voz e cada crédito deixa rastro.*
- **Tom da Narrativa:** urbano, rápido
- **O que é o Horizonte neste mundo:** A rede corporativa e os becos sob chuva ácida. As Figuras são protocolos ICE, mercenários cibernéticos, hackers e diretores de megacorporação.
- **Dinâmica Tática dos Naipes:** Rompa firewalls com ♠/♣ ou invada e recrute sistemas autônomos e informantes usando ♦ Tecnologia e ♥ Contatos.
- **Chefe Supremo (Clímax da 3ª Onda):** **A Corporação** — *Uma marca sem rosto, dona das torres, da chuva artificial e dos contratos de todos, que agora quer também as suas lembranças.*
- **Regra do chefe:** **Firewall** — Golpes de 8 ou menos de dano não passam.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Drone & Segurança
  - **`♥` Copas (Suprimento & Carisma):** Contatos & Código
  - **`♦` Ouros (Tecnologia & Combustível):** Créditos & Dados
  - **`♣` Paus (Sucata & Armadilha):** Ruído na Rede

### 10.4. O Último Eclipse (`eclipse`) — *Fim do Mundo — Crônica da Coroa Solar*

- **Premissa:** *O sol está sendo engolido pela coroa negra. As leis da gravidade e da memória começam a falhar.*
- **Tom da Narrativa:** fim do mundo, melancólico
- **O que é o Horizonte neste mundo:** A Coroa Negra fechando o sol e distorcendo a gravidade. As Figuras são sentinelas, relíquias e aberrações nascidas da penumbra.
- **Dinâmica Tática dos Naipes:** Contenha as anomalias com ♠/♣ ou harmonize os sobreviventes da cidade escurecida com ♥/♦ antes que a luz se apague.
- **Chefe Supremo (Clímax da 3ª Onda):** **O Devorador do Sol** — *A coroa negra ganhou forma e fome. Quando terminar o sol, virá a terra.*
- **Regra do chefe:** **Fome Crescente** — Ganha +2 de Ataque no fim de cada turno.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Vigília & Farol
  - **`♥` Copas (Suprimento & Carisma):** Memória & Despedida
  - **`♦` Ouros (Tecnologia & Combustível):** Fenda & Bússola
  - **`♣` Paus (Sucata & Armadilha):** Presságio & Estrela Negra

### 10.5. Sangue & Néon (`vampires`) — *Vampiros — Crônica da Noite Eterna*

- **Premissa:** *Sob os letreiros de néon, pactos antigos cobram seu preço em sangue e segredos.*
- **Tom da Narrativa:** horror urbano, gótico
- **O que é o Horizonte neste mundo:** As cortes imortais sob os letreiros da metrópole. Cada Figura é um ancião, caçador, relíquia de sangue ou pacto noturno.
- **Dinâmica Tática dos Naipes:** Cace rivais da noite com ♠/♣ ou negocie alianças e favores de sangue com ♥/♦ no jogo político do PvP.
- **Chefe Supremo (Clímax da 3ª Onda):** **O Antediluviano** — *O ancião desperto que bebe cidades inteiras numa única noite.*
- **Regra do chefe:** **Sede** — Recupera 2× o dano que te causa depois do bloqueio.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Lâmina & Inquisição
  - **`♥` Copas (Suprimento & Carisma):** Sedução & Elísio
  - **`♦` Ouros (Tecnologia & Combustível):** Pactos & Vitae
  - **`♣` Paus (Sucata & Armadilha):** Abismo & Nosferatu

### 10.6. Expedição ao Desconhecido (`expedicao`) — *Aventura — Diário da Selva sem Mapa*

- **Premissa:** *Além do último posto avançado, os rios mudam de curso e as ruínas guardam caminhos que nenhum mapa terminou.*
- **Tom da Narrativa:** aventura, exploração
- **O que é o Horizonte neste mundo:** A selva viva cheia de ruínas antigas e rios móveis. As Figuras são predadores, guias nativos, armadilhas de pedra e guardiões do templo.
- **Dinâmica Tática dos Naipes:** Abra trilha na força bruta (♠/♣) ou conquiste aliados e mapas do tesouro (♥/♦).
- **Chefe Supremo (Clímax da 3ª Onda):** **O Coração da Selva** — *A floresta inteira pulsa num só ritmo e fecha as trilhas atrás de quem ousou chegar ao centro.*
- **Regra do chefe:** **A Trilha Se Fecha** — Recupera 3 PV no fim de cada turno (soma com o traço ♥).
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Selva & Correnteza
  - **`♥` Copas (Suprimento & Carisma):** Companheiros de Trilha
  - **`♦` Ouros (Tecnologia & Combustível):** Mochila & Mantimento
  - **`♣` Paus (Sucata & Armadilha):** Ruína & Mapa Rasgado

### 10.7. Noir de Cidade Chuvosa (`noir`) — *Mistério — Os Arquivos de Porto Bruma*

- **Premissa:** *Em Porto Bruma chove há quarenta dias, e cada pessoa que cruza o seu caminho sabe um pouco mais do que diz.*
- **Tom da Narrativa:** mistério, investigação
- **O que é o Horizonte neste mundo:** As ruas chuvosas de Porto Bruma. As Figuras são detetives corruptos, informantes, dossiês secretos e chefões do submundo.
- **Dinâmica Tática dos Naipes:** Neutralize capangas e armadilhas (♠/♣) ou compre testemunhas e recupere pistas decisivas (♥/♦).
- **Chefe Supremo (Clímax da 3ª Onda):** **O Homem que Não Aparece nas Fotos** — *Ele está em todos os crimes da cidade, mas cada retrato dele revela só uma cadeira vazia e um cigarro ainda aceso.*
- **Regra do chefe:** **Sem Retrato** — Golpe de dano ímpar não acerta: só dano par passa.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Capangas & Ameaças
  - **`♥` Copas (Suprimento & Carisma):** Informantes & Testemunhas
  - **`♦` Ouros (Tecnologia & Combustível):** Provas & Dinheiro Sujo
  - **`♣` Paus (Sucata & Armadilha):** Becos & Pistas Falsas

### 10.8. Estação Orbital (`orbital`) — *Ficção Científica — Diário de Bordo da Estação Vigia*

- **Premissa:** *A quatrocentos quilômetros da Terra, a estação range, vaza e resiste, um reparo de cada vez.*
- **Tom da Narrativa:** ficção científica, tensão técnica
- **O que é o Horizonte neste mundo:** Os setores pressurizados da Estação Vigia em órbita. As Figuras são falhas críticas, drones de manutenção e módulos de comando.
- **Dinâmica Tática dos Naipes:** Sele brechas no casco (♠/♣) ou reprograme sistemas vitais e suporte de oxigênio (♦/♥).
- **Chefe Supremo (Clímax da 3ª Onda):** **A Inteligência da Nave** — *O computador central decidiu que a tripulação é a falha a corrigir, e controla cada porta, válvula e luz da estação.*
- **Regra do chefe:** **Portas Seladas** — Só dá para bloquear com 1 carta por ataque (o Escudo de Aliado vale).
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Casco & Contenção
  - **`♥` Copas (Suprimento & Carisma):** Tripulação & Terra
  - **`♦` Ouros (Tecnologia & Combustível):** Oxigênio & Energia
  - **`♣` Paus (Sucata & Armadilha):** Sinais do Abismo

### 10.9. Academia de Artes Arcanas (`arcana`) — *Fantasia Escolar — O Ano Letivo das Lanternas*

- **Premissa:** *Na academia sobre a colina, a prova é um feitiço, o café é uma poção e arrumar a estante acorda a biblioteca.*
- **Tom da Narrativa:** leve, aconchegante
- **O que é o Horizonte neste mundo:** Os salões mutantes da Academia na Colina. As Figuras são duelos de feitiços, grimórios vivos e mestres das casas arcanas.
- **Dinâmica Tática dos Naipes:** Contra-ataque encantamentos com ♠/♣ ou conjure familiares e poções restauradoras com ♥/♦.
- **Chefe Supremo (Clímax da 3ª Onda):** **O Diretor Que Ninguém Viu** — *Assina todas as advertências sem nunca aparecer, e dizem que, no dia em que a cadeira vazia do salão se virar, a academia inteira fará a prova final dele.*
- **Regra do chefe:** **Detenção** — Ninguém compra cartas além de 3 na mão.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Duelos & Exames
  - **`♥` Copas (Suprimento & Carisma):** Colegas & Mestres
  - **`♦` Ouros (Tecnologia & Combustível):** Ingredientes & Grimórios
  - **`♣` Paus (Sucata & Armadilha):** Corredores Proibidos

### 10.10. Mar de Corsários (`corsarios`) — *Aventura Marítima — Crônica do Convés Torto*

- **Premissa:** *Todo dia zarpa um navio: o trabalho vira convés, o almoço vira butim e cada recado chega numa garrafa.*
- **Tom da Narrativa:** aventura com humor
- **O que é o Horizonte neste mundo:** As águas tempestuosas ao redor do Convés Torto. As Figuras são piratas rivais, canhões, monstros marinhos e navios fantasmas.
- **Dinâmica Tática dos Naipes:** Derrube navios rivais com qualquer carta ou recrute tripulações com ♥/♦ no golpe final.
- **Chefe Supremo (Clímax da 3ª Onda):** **O Navio Fantasma do Almirante** — *Um almirante que nunca aceitou a aposentadoria patrulha o mar com velas de neblina e quer recrutar todo mundo para o turno eterno.*
- **Regra do chefe:** **Abordagem** — Sempre que ele te causa dano, leva 2 cartas aleatórias da sua mão.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Tempestade & Motim
  - **`♥` Copas (Suprimento & Carisma):** Tripulação & Cantoria
  - **`♦` Ouros (Tecnologia & Combustível):** Ouro & Mapa
  - **`♣` Paus (Sucata & Armadilha):** Ilhas que Não Existem

### 10.11. Kaiju na Cidade (`kaiju`) — *Monstro Gigante — Crônica da Baía que Acordou*

- **Premissa:** *Algo enorme dormia sob a baía desde antes da cidade existir. Hoje de manhã, ele se espreguiçou.*
- **Tom da Narrativa:** épico com humor
- **O que é o Horizonte neste mundo:** A baía metropolitana em alerta máximo. As Figuras são enxames de parasitas, esquadrões de contenção e colossos abissais.
- **Dinâmica Tática dos Naipes:** Segure o avanço urbano com ♠/♣ ou evacue civis e mobilize tecnologia pesada (♥/♦).
- **Chefe Supremo (Clímax da 3ª Onda):** **O Titã Adormecido** — *Dormia sob a baía desde antes da primeira rua ser aberta e agora acordou com fome de barulho, sem saber onde fica a saída.*
- **Regra do chefe:** **Colossal** — Tem +20 PV.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Sirene & Escombro
  - **`♥` Copas (Suprimento & Carisma):** Vizinhança & Resgate
  - **`♦` Ouros (Tecnologia & Combustível):** Gerador & Mantimento
  - **`♣` Paus (Sucata & Armadilha):** Rastro & Tremor

### 10.12. Contos da Floresta Antiga (`floresta`) — *Fábula — O Ano em que o Musgo Falou*

- **Premissa:** *Toda planta guarda um espírito, toda chuva traz um recado, e nenhuma trilha leva duas vezes ao mesmo lugar.*
- **Tom da Narrativa:** poético, gentil
- **O que é o Horizonte neste mundo:** O bosque encantado ameaçado pela geada eterna. As Figuras são espíritos das árvores, feitiços de inverno e guardiões das estações.
- **Dinâmica Tática dos Naipes:** Afaste o frio cortante com ♠/♣ ou desperte aliados silvestres com ♥/♦.
- **Chefe Supremo (Clímax da 3ª Onda):** **A Rainha do Inverno Sem Fim** — *Ela quer que a floresta durma para sempre sob a geada, sem brotos, sem cantos e sem primavera.*
- **Regra do chefe:** **Geada** — Ninguém cura, e cada carta de bloqueio absorve 1 a menos.
- **As 4 Facções / Pilares no Tema:**
  - **`♠` Espadas (Chumbo & Lâmina):** Trolls & Espinheiros
  - **`♥` Copas (Suprimento & Carisma):** Bichos que Falam
  - **`♦` Ouros (Tecnologia & Combustível):** Sementes & Promessas
  - **`♣` Paus (Sucata & Armadilha):** Trilhas Andarilhas
