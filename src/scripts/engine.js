/**
 * Dante Dash - Engine de Jogo Arcade v2.1
 * Arquitetura Desacoplada: FSM, ScoreEngine, SpawnEngine e Web Audio API.
 * 
 * Desenho do Personagem: Dante Chaves Martino (aos 4 anos)
 * Trilha Sonora: Denis Martino Cota
 * Engenharia de Software: Juliana Chaves Palm
 */

import { ScoreEngine } from "./core/scoreEngine.js";
import { SpawnEngine } from "./core/spawnEngine.js";
import { GameStateManager, States } from "./core/gameState.js";

const state = {
    view: {
        squares: document.querySelectorAll(".panel__square"),
        timeLeft: document.querySelector("#time-left"),
        score: document.querySelector("#score"),
        highScore: document.querySelector("#high-score"),
        lives: document.querySelector("#lives"),
        comboDisplay: document.querySelector("#combo-display"),
        initButton: document.querySelector("#initButton"),
        musicButton: document.querySelector("#musicButton"),
        modal: document.querySelector("#game-over-modal"),
        modalTitle: document.querySelector("#modal-title"),
        modalMessage: document.querySelector("#modal-message"),
        modalDanteImg: document.querySelector("#modal-dante-img"),
        finalScore: document.querySelector("#final-score"),
        finalCombo: document.querySelector("#final-combo"),
        modalHighScore: document.querySelector("#modal-high-score"),
    },
    engines: {
        score: null,
        spawn: null,
        fsm: null,
    },
    timers: {
        spawnTimerId: null,
        clockTimerId: null,
        currentTime: 60,
        hitPosition: null,
    },
    audio: {
        bgMusic: new Audio("./src/audios/trilha-metal__denis-martino.m4a"),
        hitSound: new Audio("./src/audios/hit.m4a"),
        isMusicPlaying: false,
    }
};

// Configurações de Áudio
state.audio.bgMusic.loop = true;
state.audio.bgMusic.volume = 0.25;

function playSound(type) {
    if (type === "hit") {
        try {
            const clone = state.audio.hitSound.cloneNode();
            clone.volume = 0.35;
            clone.play().catch(() => {});
        } catch (_) {}
    }
}

function toggleMusic() {
    if (state.audio.isMusicPlaying) {
        state.audio.bgMusic.pause();
        state.audio.isMusicPlaying = false;
        state.view.musicButton.textContent = "🎵 Música: Off";
        state.view.musicButton.classList.remove("is-golden");
    } else {
        state.audio.bgMusic.play().then(() => {
            state.audio.isMusicPlaying = true;
            state.view.musicButton.textContent = "🔊 Música: On";
            state.view.musicButton.classList.add("is-golden");
        }).catch(() => {
            console.log("Autoplay bloqueado pelo navegador até interação.");
        });
    }
}

function renderLives(livesCount) {
    let hearts = "";
    for (let i = 0; i < livesCount; i++) {
        hearts += "❤️";
    }
    state.view.lives.textContent = hearts || "💀";
}

function spawnNextEnemy() {
    if (!state.engines.fsm.is(States.PLAYING)) return;

    state.view.squares.forEach((sq) => sq.classList.remove("enemy"));

    const nextPos = state.engines.spawn.getNextPosition();
    const squareElement = document.getElementById(nextPos.toString());
    if (squareElement) {
        squareElement.classList.add("enemy");
        state.timers.hitPosition = nextPos.toString();
    }
}

function rescheduleSpawn() {
    clearInterval(state.timers.spawnTimerId);
    if (!state.engines.fsm.is(States.PLAYING)) return;

    const velocity = state.engines.spawn.calculateVelocity(state.engines.score.score);
    state.timers.spawnTimerId = setInterval(spawnNextEnemy, velocity);
}

function handleSquareHit(squareId) {
    if (!state.engines.fsm.is(States.PLAYING)) return;

    const squareElement = document.getElementById(squareId);

    if (squareId === state.timers.hitPosition) {
        // Acerto!
        const hitResult = state.engines.score.registerHit(10);
        state.view.score.textContent = hitResult.score;
        state.view.highScore.textContent = hitResult.highScore;

        if (hitResult.isRecord) {
            localStorage.setItem("dante_dash_high_score", hitResult.highScore.toString());
        }

        if (hitResult.combo >= 2) {
            state.view.comboDisplay.textContent = `COMBO x${hitResult.combo}! 🔥`;
            state.view.comboDisplay.style.transform = "scale(1.2)";
            setTimeout(() => {
                state.view.comboDisplay.style.transform = "scale(1)";
            }, 120);
        }

        playSound("hit");
        squareElement.classList.add("hit-success");
        setTimeout(() => squareElement.classList.remove("hit-success"), 150);

        state.timers.hitPosition = null;
        squareElement.classList.remove("enemy");

        rescheduleSpawn();
    } else {
        // Erro!
        const missResult = state.engines.score.registerMiss();
        renderLives(missResult.livesRemaining);
        state.view.comboDisplay.textContent = "";

        if (missResult.isGameOver) {
            triggerGameOver("Sem Vidas!");
        }
    }
}

function onClockTick() {
    if (!state.engines.fsm.is(States.PLAYING)) return;

    state.timers.currentTime--;
    state.view.timeLeft.textContent = state.timers.currentTime;

    if (state.timers.currentTime <= 0) {
        triggerGameOver("Tempo Esgotado!");
    }
}

function triggerGameOver(reason) {
    if (!state.engines.fsm.canTransitionTo(States.GAME_OVER)) return;
    state.engines.fsm.transitionTo(States.GAME_OVER, { reason });

    clearInterval(state.timers.clockTimerId);
    clearInterval(state.timers.spawnTimerId);
    state.timers.hitPosition = null;

    state.view.squares.forEach((sq) => sq.classList.remove("enemy"));

    const stats = state.engines.score.getStats();
    const isRecord = stats.score >= stats.highScore && stats.score > 0;

    state.view.finalScore.textContent = stats.score;
    state.view.finalCombo.textContent = `x${stats.maxCombo}`;
    state.view.modalHighScore.textContent = stats.highScore;

    if (isRecord) {
        state.view.modalTitle.textContent = "NOVO RECORDE! 🏆";
        state.view.modalMessage.textContent = "Incrível! O Dante está dançando de tanta alegria!";
        state.view.modalDanteImg.src = "./src/img/enemy-dancing.gif";
    } else {
        state.view.modalTitle.textContent = reason || "FIM DE JOGO!";
        state.view.modalMessage.textContent = "Boa partida! Continue treinando seus reflexos com o Dante!";
        state.view.modalDanteImg.src = "./src/img/enemy-fighting.gif";
    }

    state.view.modal.classList.remove("hidden");
    state.view.initButton.disabled = false;
    state.view.initButton.textContent = "▶ Jogar Novamente";
}

function startMatch() {
    clearInterval(state.timers.clockTimerId);
    clearInterval(state.timers.spawnTimerId);

    state.engines.score.reset();
    state.engines.spawn.reset();
    state.timers.currentTime = 60;
    state.timers.hitPosition = null;

    state.engines.fsm.transitionTo(States.PLAYING);

    state.view.score.textContent = "0";
    state.view.timeLeft.textContent = "60";
    state.view.highScore.textContent = state.engines.score.highScore;
    state.view.comboDisplay.textContent = "";
    state.view.modal.classList.add("hidden");
    state.view.initButton.disabled = true;

    renderLives(state.engines.score.lives);

    spawnNextEnemy();
    rescheduleSpawn();
    state.timers.clockTimerId = setInterval(onClockTick, 1000);

    if (state.audio.isMusicPlaying) {
        state.audio.bgMusic.play().catch(() => {});
    }
}

function setupEvents() {
    // PointerDown (Touch + Mouse sem delay)
    state.view.squares.forEach((square) => {
        square.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            handleSquareHit(square.id);
        });
    });

    // Teclado
    const keyMap = {
        "1": "1", "2": "2", "3": "3",
        "4": "4", "5": "5", "6": "6",
        "7": "7", "8": "8", "9": "9",
        "q": "1", "w": "2", "e": "3",
        "a": "4", "s": "5", "d": "6",
        "z": "7", "x": "8", "c": "9"
    };

    window.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        if (keyMap[key]) {
            handleSquareHit(keyMap[key]);
        } else if (key === " " && !state.engines.fsm.is(States.PLAYING)) {
            startMatch();
        } else if (key === "m") {
            toggleMusic();
        }
    });

    // Pausa Automática ao minimizar ou trocar de aba
    window.addEventListener("blur", () => {
        if (state.engines.fsm.is(States.PLAYING)) {
            state.engines.fsm.transitionTo(States.PAUSED);
            clearInterval(state.timers.clockTimerId);
            clearInterval(state.timers.spawnTimerId);
            state.view.comboDisplay.textContent = "⏸️ Jogo Pausado";
        }
    });

    window.addEventListener("focus", () => {
        if (state.engines.fsm.is(States.PAUSED)) {
            state.engines.fsm.transitionTo(States.PLAYING);
            state.view.comboDisplay.textContent = "";
            rescheduleSpawn();
            state.timers.clockTimerId = setInterval(onClockTick, 1000);
        }
    });

    // Expor métodos globais para os botões do HTML
    window.startGame = startMatch;
    window.restartGame = () => {
        state.view.modal.classList.add("hidden");
        startMatch();
    };
    window.toggleMusic = toggleMusic;
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
}

function bootstrap() {
    const savedHighScore = parseInt(localStorage.getItem("dante_dash_high_score") || "0", 10);
    state.engines.score = new ScoreEngine(savedHighScore, 3);
    state.engines.spawn = new SpawnEngine(1000, 450, 9);
    state.engines.fsm = new GameStateManager(States.MENU);

    state.view.highScore.textContent = savedHighScore;
    renderLives(3);
    setupEvents();
    registerServiceWorker();
}

window.addEventListener("DOMContentLoaded", bootstrap);
