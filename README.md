# Dante Dash — Arcade Edition

> Jogo arcade de reflexo e agilidade desenvolvido em JavaScript ES6 nativo com estética retrô 8-bit, velocidade dinâmica adaptativa, sistema de combos, atalhos de teclado, áudio acústico/metal e controle responsivo touch-first.

[![Status](https://img.shields.io/badge/Status-Arcade%20Edition%20v2.0-brightgreen.svg)](#novidades-da-arcade-edition)
[![Zero Dependencies](https://img.shields.io/badge/Runtime-Zero%20Dependencies%20(Vanilla%20JS)-blue.svg)](#arquitetura-e-estrutura)
[![Gameplay](https://img.shields.io/badge/Jogar%20Online-julianachavespalm.live-orange.svg)](https://julianachavespalm.live/dante-dash/)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 💛 A História por trás do Jogo

O **Dante Dash** é o projeto mais afetivo e especial deste ecossistema. Ele nasceu de uma colaboração familiar e artística:

* **Concepção Visual e Desenho do Herói:** Criado e desenhado originalmente por **Dante Chaves Martino** aos **4 anos de idade**. O herói e os inimigos animados preservam com fidelidade absoluta o traço autoral e a imaginação infantil do Dante.
* **Trilha Sonora Original:** Composta e gravada em guitarra heavy metal pelo professor e músico **Denis Martino Cota**.
* **Engenharia de Software e Game Engine:** Arquitetura web, loop de temporização, controle de estados e responsividade desenvolvidos por **Juliana Chaves Palm**.

---

## 🕹️ Novidades da Arcade Edition

A versão **Arcade Edition** transforma o clássico formato *Whack-a-Mole* em uma experiência eletrizante:

1. **Velocidade Adaptativa:** O jogo começa em ritmo moderado (1000ms) e acelera gradualmente conforme a pontuação sobe (atingindo até 450ms), exigindo reflexos cada vez mais afiados.
2. **Sistema de Combos e Multiplicadores:** Acertos consecutivos ativam bônus de pontuação (`x2`, `x3`, `x4`!), celebrados com efeitos visuais na tela.
3. **Sistema de Vidas (3 Corações ❤️❤️❤️):** Erros de clique penalizam vidas. O jogo encerra se as vidas esgotarem ou se o cronômetro de 60 segundos zerar.
4. **Recorde Persistido (High Score):** Salva a maior pontuação histórica no `localStorage` do navegador. Se bater o recorde, o herói comemora dançando na tela final!
5. **Multiplataforma (PC & Mobile Touch-First):**
   - **No Smartphone:** Utilização de `pointerdown` sem delay de toque de 300ms.
   - **No Teclado do Desktop:** Mapeamento instantâneo das teclas numéricas `1` a `9` ou das teclas `Q, W, E / A, S, D / Z, X, C` correspondentes ao grid 3x3.
   - **Atalhos Rápidos:** Barra de Espaço inicia a partida; tecla `M` alterna a trilha sonora.
6. **Trilha Sonora de Metal Integrada:** Controle de áudio dedicado com a música original do Denis Martino tocando em loop arcade.

---

## 🎮 Como Jogar

Acesse a versão ao vivo: **[https://julianachavespalm.live/dante-dash/](https://julianachavespalm.live/dante-dash/)**

| Dispositivo | Ação | Como Acertar |
| :--- | :--- | :--- |
| **📱 Smartphone / Tablet** | Toque na tela | Toque diretamente sobre o quadrado onde o herói/vilão surgir. |
| **💻 Computador (Mouse)** | Clique esquerdo | Clique sobre o quadrado ativo com o cursor do mouse. |
| **⌨️ Teclado (Desktop)** | Teclas numéricas | Pressione `1` a `9` (ou `Q/W/E`, `A/S/D`, `Z/X/C`) conforme o grid. |

---

## 🛠️ Arquitetura e Estrutura

Construído sem nenhum framework ou biblioteca externa de runtime — apenas a tríade web nativa com alto desempenho:

```text
dante-dash/
├── index.html                  # Casca semântica, scoreboard arcade e modal de game over
├── src/
│   ├── audios/
│   │   ├── hit.m4a             # Efeito sonoro de impacto
│   │   └── trilha-metal...m4a  # Trilha sonora original em heavy metal (Denis Martino)
│   ├── img/
│   │   ├── player.png          # Arte original do herói (desenhada pelo Dante aos 4 anos)
│   │   ├── enemy-fighting.gif  # Animação do herói em ação no grid
│   │   ├── enemy-dancing.gif   # Animação do herói comemorando o recorde
│   │   └── wall.png            # Textura de fundo da arena
│   ├── scripts/
│   │   └── engine.js           # Game Loop, aceleração, combos, vidas e eventos pointer
│   └── styles/
│       ├── reset.css           # Normalização de estilos
│       └── main.css            # Tipografia retrô 8-bit, paleta arcade e modal responsivo
└── README.md                   # História, regras e documentação
```

---

## 💛 Créditos e Autoria

* **Direção de Arte do Personagem:** Dante Chaves Martino
* **Trilha Sonora Original:** Denis Martino Cota
* **Desenvolvimento e Engenharia:** [Juliana Chaves Palm](https://github.com/julianachavespalm)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-julianachavespalm-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/julianachavespalm)
[![GitHub](https://img.shields.io/badge/GitHub-julianachavespalm-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/julianachavespalm)
