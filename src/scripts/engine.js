/**
 * Dante Dash - Engine de Jogo Arcade v2.3
 * Arquitetura Desacoplada: FSM, ScoreEngine, SpawnEngine e Web Audio API Synth.
 * Ícones Oficiais do Google Fonts (Material Symbols Outlined) - Zero emojis.
 * Sprites com Fundo Transparente para Integração Perfeita com a Arena.
 * 
 * Desenho do Personagem: Dante Chaves Martino (aos 4 anos)
 * Trilha Sonora: Denis Martino
 * Engenharia de Software: Juliana Chaves Palm
 */

import { ScoreEngine } from "./core/scoreEngine.js";
import { SpawnEngine, GAME_LEVELS } from "./core/spawnEngine.js";
import { GameStateManager, States } from "./core/gameState.js";
import { RetroAudioSynth } from "./audio/synth.js";

const state = {
    view: {
        squares: document.querySelectorAll(".panel__square"),
        timeLeft: document.querySelector("#time-left"),
        score: document.querySelector("#score"),
        level: document.querySelector("#level"),
        highScore: document.querySelector("#high-score"),
        lives: document.querySelector("#lives"),
        comboDisplay: document.querySelector("#combo-display"),
        loreTag: document.querySelector("#lore-tag"),
        loreText: document.querySelector("#lore-text"),
        initButton: document.querySelector("#initButton"),
        soundButton: document.querySelector("#soundButton"),
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
        synth: new RetroAudioSynth(),
    },
    timers: {
        spawnTimerId: null,
        clockTimerId: null,
        currentTime: 60,
        hitPosition: null,
    },
    audio: {
        bgMusic: new Audio("./src/audios/trilha-metal__denis-martino.m4a"),
        isMusicPlaying: false,
        isSoundEnabled: true,
    }
};

// Configurações da Trilha Sonora
state.audio.bgMusic.loop = true;
state.audio.bgMusic.volume = 0.28;

/**
 * Pré-carregamento assíncrono e decodificação na GPU para eliminar lag de exibição dos sprites.
 */
async function preloadAssets() {
    const assets = [
        "./src/img/player.png",
        "./src/img/enemy-fighting.gif",
        "./src/img/enemy-dancing.gif",
        "./src/img/wall.png"
    ];
    return Promise.all(assets.map(src => {
        const img = new Image();
        img.src = src;
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    }));
}

function playSound(type, combo = 1) {
    if (!state.audio.isSoundEnabled) return;

    if (type === "hit") {
        state.engines.synth.playHit(combo);
    } else if (type === "miss") {
        state.engines.synth.playMiss();
    } else if (type === "levelUp") {
        state.engines.synth.playLevelUp();
    } else if (type === "gameOver") {
        state.engines.synth.playGameOver();
    }
}

function toggleSound() {
    state.audio.isSoundEnabled = !state.audio.isSoundEnabled;
    const btn = state.view.soundButton || document.getElementById("soundButton");
    if (!btn) return;

    if (state.audio.isSoundEnabled) {
        btn.innerHTML = `
            <span class="material-symbols-outlined">volume_up</span>
            <span>SOM: ON</span>
        `;
        btn.classList.remove("is-muted");
        state.engines.synth.init();
        state.engines.synth.playHit(1);
    } else {
        btn.innerHTML = `
            <span class="material-symbols-outlined">volume_off</span>
            <span>SOM: OFF</span>
        `;
        btn.classList.add("is-muted");
    }
}

function toggleMusic() {
    state.engines.synth.init();
    if (state.audio.isMusicPlaying) {
        state.audio.bgMusic.pause();
        state.audio.isMusicPlaying = false;
        state.view.musicButton.innerHTML = `
            <span class="material-symbols-outlined">music_note</span>
            <span>MÚSICA: OFF</span>
        `;
        state.view.musicButton.classList.remove("is-playing");
    } else {
        state.audio.bgMusic.play().then(() => {
            state.audio.isMusicPlaying = true;
            state.view.musicButton.innerHTML = `
                <span class="material-symbols-outlined">music_note</span>
                <span>MÚSICA: ON</span>
            `;
            state.view.musicButton.classList.add("is-playing");
        }).catch(() => {
            console.log("Autoplay bloqueado pelo navegador até interação.");
        });
    }
}

function renderLives(livesCount) {
    let html = '<div class="heart-container">';
    for (let i = 0; i < 3; i++) {
        if (i < livesCount) {
            html += '<span class="material-symbols-outlined heart-icon filled">favorite</span>';
        } else {
            html += '<span class="material-symbols-outlined heart-icon empty">favorite_border</span>';
        }
    }
    html += '</div>';
    state.view.lives.innerHTML = html;
}

function updateLoreDisplay(levelData) {
    if (state.view.level) {
        state.view.level.textContent = levelData.level;
    }
    if (state.view.loreTag) {
        state.view.loreTag.textContent = `FASE ${levelData.level}`;
    }
    if (state.view.loreText) {
        state.view.loreText.textContent = levelData.story;
    }
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

    const levelData = state.engines.spawn.calculateLevel(state.engines.score.score);
    updateLoreDisplay(levelData);

    if (levelData.isLevelUp) {
        playSound("levelUp");
        state.view.comboDisplay.innerHTML = `
            <span class="material-symbols-outlined">military_tech</span>
            <span>NÍVEL ${levelData.level}!</span>
        `;
        state.view.comboDisplay.classList.add("level-up-pulse");
        setTimeout(() => state.view.comboDisplay.classList.remove("level-up-pulse"), 1200);
    }

    state.timers.spawnTimerId = setInterval(spawnNextEnemy, levelData.velocity);
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
            state.view.comboDisplay.innerHTML = `
                <span class="material-symbols-outlined">local_fire_department</span>
                <span>COMBO x${hitResult.combo}!</span>
            `;
            state.view.comboDisplay.style.transform = "scale(1.15)";
            setTimeout(() => {
                state.view.comboDisplay.style.transform = "scale(1)";
            }, 120);
        }

        playSound("hit", hitResult.combo);
        squareElement.classList.add("hit-success");
        setTimeout(() => squareElement.classList.remove("hit-success"), 140);

        state.timers.hitPosition = null;
        squareElement.classList.remove("enemy");

        rescheduleSpawn();
    } else {
        // Erro!
        playSound("miss");
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

    playSound("gameOver");

    const stats = state.engines.score.getStats();
    const isRecord = stats.score >= stats.highScore && stats.score > 0;

    state.view.finalScore.textContent = stats.score;
    state.view.finalCombo.textContent = `x${stats.maxCombo}`;
    state.view.modalHighScore.textContent = stats.highScore;

    if (isRecord) {
        state.view.modalTitle.innerHTML = `
            <span class="material-symbols-outlined">trophy</span>
            <span>NOVO RECORDE!</span>
        `;
        state.view.modalMessage.textContent = "Incrível! O Dante está dançando de tanta alegria!";
        state.view.modalDanteImg.src = "./src/img/enemy-dancing.gif";
    } else {
        state.view.modalTitle.textContent = reason || "FIM DE JOGO!";
        state.view.modalMessage.textContent = "Boa partida! Continue treinando seus reflexos com o Dante!";
        state.view.modalDanteImg.src = "./src/img/enemy-fighting.gif";
    }

    state.view.modal.classList.remove("hidden");
    state.view.initButton.disabled = false;
    state.view.initButton.innerHTML = `
        <span class="material-symbols-outlined">replay</span>
        <span>REINICIAR</span>
    `;
}

function startMatch() {
    state.engines.synth.init();

    clearInterval(state.timers.clockTimerId);
    clearInterval(state.timers.spawnTimerId);

    state.engines.score.reset();
    state.engines.spawn.reset();
    state.timers.currentTime = 60;
    state.timers.hitPosition = null;

    state.engines.fsm.transitionTo(States.PLAYING);

    state.view.score.textContent = "0";
    state.view.timeLeft.textContent = "60";
    if (state.view.level) state.view.level.textContent = "1";
    state.view.highScore.textContent = state.engines.score.highScore;
    state.view.comboDisplay.textContent = "";
    state.view.modal.classList.add("hidden");
    state.view.initButton.disabled = true;
    state.view.initButton.innerHTML = `
        <span class="material-symbols-outlined">play_arrow</span>
        <span>JOGANDO...</span>
    `;

    updateLoreDisplay(GAME_LEVELS[0]);
    renderLives(state.engines.score.lives);

    spawnNextEnemy();
    rescheduleSpawn();
    state.timers.clockTimerId = setInterval(onClockTick, 1000);

    if (state.audio.isMusicPlaying) {
        state.audio.bgMusic.play().catch(() => {});
    }
}

function setupEvents() {
    // PointerDown (Touch + Mouse instantâneo)
    state.view.squares.forEach((square) => {
        square.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            handleSquareHit(square.id);
        });
    });

    // Teclado (1 2 3 topo, 4 5 6 meio, 7 8 9 base) e QWE/ASD/ZXC
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
        } else if (key === "s") {
            toggleSound();
        } else if (key === "h" || key === "?") {
            toggleHowToPlay();
        } else if (key === "escape") {
            const infoModal = document.getElementById("how-to-play-modal");
            if (infoModal && !infoModal.classList.contains("hidden")) {
                infoModal.classList.add("hidden");
            }
        }
    });

    window.startGame = startMatch;
    window.restartGame = startMatch;
    window.toggleMusic = toggleMusic;
    window.toggleSound = toggleSound;
    window.toggleHowToPlay = toggleHowToPlay;
}

function toggleHowToPlay() {
    state.engines.synth.init();
    const modal = document.getElementById("how-to-play-modal");
    if (modal) {
        modal.classList.toggle("hidden");
    }
}

function initGame() {
    preloadAssets();

    const savedHighScore = parseInt(localStorage.getItem("dante_dash_high_score") || "0", 10);
    state.engines.score = new ScoreEngine(savedHighScore, 3);
    state.engines.spawn = new SpawnEngine(1400, 450, 9);
    state.engines.fsm = new GameStateManager(States.MENU);

    state.view.highScore.textContent = savedHighScore;
    renderLives(3);
    updateLoreDisplay(GAME_LEVELS[0]);

    setupEvents();
}

window.addEventListener("DOMContentLoaded", initGame);
