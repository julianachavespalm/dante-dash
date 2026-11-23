# ⚡ Dante Dash — Arcade Edition (v2.1)

> Jogo arcade de reflexo e agilidade desenvolvido em JavaScript ES6 nativo com arquitetura modular desacoplada (**FSM**, **ScoreEngine** puro, **PWA Offline-First** e **suíte de testes nativa com `node --test`**), preservando a arte autoral desenhada pelo Dante aos 4 anos e a trilha de heavy metal do Denis Martino.

[![CI - Dante Dash Tests](https://img.shields.io/github/actions/workflow/status/julianachavespalm/dante-dash/ci.yml?branch=main&label=CI%20%2F%20Tests)](https://github.com/julianachavespalm/dante-dash/actions)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20First-brightgreen.svg)](#suporte-pwa-e-offline-first)
[![Zero Dependencies](https://img.shields.io/badge/Runtime-Zero%20Dependencies%20(Vanilla%20ES6)-blue.svg)](#arquitetura-e-estrutura)
[![Tests](https://img.shields.io/badge/Tests-node%3Atest%20(100%25%20Passing)-success.svg)](#testes-automatizados)
[![Gameplay](https://img.shields.io/badge/Jogar%20Online-GitHub%20Pages-orange.svg)](https://julianachavespalm.github.io/dante-dash/)
[![License: MIT](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## 💛 A História por trás do Jogo

O **Dante Dash** é o projeto mais afetivo e especial deste ecossistema. Ele nasceu de uma colaboração familiar e artística:

* **Concepção Visual e Desenho do Herói:** Criado e desenhado originalmente por **Dante Chaves Martino** aos **4 anos de idade**. O herói e os inimigos animados preservam com fidelidade absoluta o traço autoral e a imaginação infantil do Dante.
* **Trilha Sonora Original:** Composta e gravada em guitarra heavy metal pelo professor e músico **Denis Martino Cota**.
* **Engenharia de Software e Game Architecture:** Arquitetura desacoplada, máquina de estados finitos (FSM), PWA e suíte de testes desenvolvidos por **Juliana Chaves Palm**.

---

## 🏛️ Arquitetura e Decisões de Engenharia

O jogo foi refatorado para seguir uma **Clean Game Architecture** sem frameworks externos, onde as regras de negócio de pontuação e ciclo de vida são 100% isoladas da camada de apresentação:

```mermaid
flowchart TD
    subgraph INPUT["1. Entrada & Adapters"]
        Pointer["PointerDown Adapter<br/>(Touch & Mouse sem lag)"]
        Keyboard["Keyboard Adapter<br/>(Teclas 1..9 e QWE/ASD/ZXC)"]
    end

    subgraph CORE["2. Núcleo Puro de Domínio (src/scripts/core/)"]
        FSM["GameStateManager (FSM)<br/>MENU · PLAYING · PAUSED · GAME_OVER"]
        Score["ScoreEngine<br/>Regras de Pontos, Combos x1..x4 e Vidas"]
        Spawn["SpawnEngine<br/>Velocidade Adaptativa & Sorteio sem Repetição"]
    end

    subgraph PRESENTATION["3. Apresentação & Feedback"]
        DOM["DOM Engine<br/>Grid 3x3, Animações e Shakes"]
        Modal["Modal Arcade de Game Over<br/>Celebração do Recorde"]
        AudioEng["Audio Controller<br/>Trilha Metal Denis Martino + Som Hit"]
    end

    INPUT --> FSM
    FSM --> Score
    FSM --> Spawn
    FSM --> DOM
    FSM --> Modal
    Score -.evento hit.-> AudioEng
```

### Máquina de Estados Finitos (FSM)

```mermaid
stateDiagram-v2
    [*] --> MENU
    MENU --> PLAYING: Iniciar Partida (Botão ou Espaço)
    PLAYING --> PAUSED: Janela perde o foco (blur)
    PAUSED --> PLAYING: Janela recupera o foco (focus)
    PLAYING --> GAME_OVER: Vidas = 0 ou Tempo = 0
    GAME_OVER --> PLAYING: Jogar Novamente
```

---

## 🕹️ Funcionalidades da Arcade Edition

1. **Velocidade Dinâmica Adaptativa:** O `SpawnEngine` acelera a frequência de aparição do herói/vilão conforme o placar aumenta, variando de 1000ms até 450ms.
2. **Sistema de Combos & Multiplicadores:** Acertos em sequência acumulam multiplicadores (`x2`, `x3`, `x4`!), maximizando a pontuação.
3. **Sistema de Vidas (3 Corações ❤️❤️❤️):** Erros de clique penalizam vidas. O jogo encerra se as 3 vidas acabarem ou se o cronômetro zerar.
4. **Pausa Automática Inteligente:** Se o jogador minimizar a janela ou receber uma notificação no celular, a FSM transiciona para `PAUSED` sem queimar o tempo de jogo.
5. **Multiplataforma Touch-First e Teclado:**
   - **No Smartphone:** Resposta tátil imediata via `pointerdown` (elimina o delay de 300ms do mobile).
   - **No Teclado do Desktop:** Mapeamento instantâneo das teclas numéricas `1` a `9` ou das teclas `Q, W, E / A, S, D / Z, X, C` correspondentes ao grid.
6. **Suporte PWA e Offline-First:**
   - Através de `manifest.json` e `sw.js` (Service Worker com cache inteligente), o jogo pode ser "instalado" no smartphone e jogado mesmo sem conexão com a internet.

---

## 🧪 Testes Automatizados

Suíte de testes unitários determinísticos executados com o test runner nativo do Node.js (`node:test` e `node:assert/strict`):

```bash
# Executar a suíte de testes
npm test

# Executar com relatório de cobertura
npm run test:coverage
```

**Cenários testados (9 testes unitários — 100% de sucesso em ~200ms):**
- **ScoreEngine:** Inicialização de estado, progressão de multiplicador de combos (`x1` a `x4`), limite máximo, penalização de vidas e salvamento de recorde histórico.
- **SpawnEngine:** Cálculo de aceleração em curva assintótica e sorteio pseudo-aleatório garantindo zero repetição consecutiva de casas.
- **GameStateManager:** Validação do grafo de transições válidas, prevenção de saltos de estado proibidos e hooks de ciclo de vida.

---

## 🎮 Como Jogar

Acesse a versão ao vivo: **[https://julianachavespalm.github.io/dante-dash/](https://julianachavespalm.github.io/dante-dash/)**

| Dispositivo | Ação | Como Acertar |
| :--- | :--- | :--- |
| **📱 Smartphone / Tablet** | Toque na tela | Toque diretamente sobre o quadrado onde o herói surgir. |
| **💻 Computador (Mouse)** | Clique esquerdo | Clique sobre o quadrado ativo com o cursor do mouse. |
| **⌨️ Teclado (Desktop)** | Teclas numéricas | Pressione `1` a `9` (ou `Q/W/E`, `A/S/D`, `Z/X/C`) conforme o grid. |

---

## 🛠️ Estrutura de Pastas

```text
dante-dash/
├── .github/workflows/
│   └── ci.yml                  # Esteira de CI multi-versão do Node.js (18, 20, 22)
├── manifest.json               # Configuração PWA para instalação no celular/desktop
├── sw.js                       # Service Worker com estratégia de Cache-First offline
├── index.html                  # Casca semântica, scoreboard arcade e modal de game over
├── package.json                # Configuração do pacote ES6 e scripts de teste
├── src/
│   ├── audios/
│   │   ├── hit.m4a             # Som de impacto
│   │   └── trilha-metal...m4a  # Trilha sonora original em heavy metal (Denis Martino)
│   ├── img/
│   │   ├── player.png          # Arte do herói desenhada pelo Dante aos 4 anos
│   │   ├── enemy-fighting.gif  # Animação do herói em ação no grid
│   │   ├── enemy-dancing.gif   # Animação do herói comemorando novo recorde
│   │   └── wall.png            # Textura de fundo da arena
│   ├── scripts/
│   │   ├── core/               # Domínio Puro (Zero DOM / 100% Testável)
│   │   │   ├── gameState.js    # FSM com transições de ciclo de vida
│   │   │   ├── scoreEngine.js  # Regras de pontuação, combos e vidas
│   │   │   └── spawnEngine.js  # Curva de velocidade adaptativa e sorteio
│   │   └── engine.js           # Orquestração do DOM, inputs, áudio e Service Worker
│   └── styles/
│       ├── reset.css           # Normalização de estilos
│       └── main.css            # Tipografia retrô 8-bit, grid responsivo e modal
└── tests/
    └── core.test.js            # Suíte nativa com node:test
```

---

## 💛 Créditos e Autoria

* **Direção de Arte do Personagem:** Dante Chaves Martino (aos 4 anos)
* **Trilha Sonora Original:** Denis Martino Cota
* **Desenvolvimento e Engenharia:** [Juliana Chaves Palm](https://github.com/julianachavespalm)

[![LinkedIn](https://img.shields.io/badge/LinkedIn-julianachavespalm-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/julianachavespalm)
[![GitHub](https://img.shields.io/badge/GitHub-julianachavespalm-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/julianachavespalm)
