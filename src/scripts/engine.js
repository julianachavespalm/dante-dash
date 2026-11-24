/**
 * Dante Dash - Engine de Jogo Arcade Neon Edition
 * Arquitetura Desacoplada: FSM, ScoreEngine, SpawnEngine e Web Audio API Synth.
 * Ícones: FontAwesome 6 + Google Material Symbols
 * 
 * Personagem Herói Original: Dante Chaves Martino (aos 4 anos)
 * Trilha Sonora: Denis Martino
 * Engenharia de Software: Juliana Chaves Palm
 */

import { ScoreEngine } from "./core/scoreEngine.js";
import { SpawnEngine, GAME_LEVELS } from "./core/spawnEngine.js";
import { GameStateManager, States } from "./core/gameState.js";
import { RetroAudioSynth } from "./audio/synth.js";

const state = {
    view: {
        cells: document.querySelectorAll(".cell"),
        timeLeft: document.querySelector("#time-left"),
        score: document.querySelector("#score"),
        level: document.querySelector("#level"),
        highScore: document.querySelector("#high-score"),
        lives: document.querySelector("#lives"),
        comboBanner: document.querySelector("#combo-banner"),
        btnPlay: document.querySelector("#btn-play"),
        btnSound: document.querySelector("#btn-sound"),
        btnMusic: document.querySelector("#btn-music"),
        btnRestart: document.querySelector("#btn-restart"),
        btnHelp: document.querySelector("#btn-help"),
        btnCredits: document.querySelector("#btn-credits"),

        // Modais
        modalHelp: document.querySelector("#modal-help"),
        modalCredits: document.querySelector("#modal-credits"),
        modalGameOver: document.querySelector("#modal-game-over"),
        modalVictory: document.querySelector("#modal-victory"),

        // Botões de fechar canônicos
        btnCloseHelp: document.querySelector("#btn-close-help"),
        btnCloseCredits: document.querySelector("#btn-close-credits"),
        btnCloseGameOver: document.querySelector("#btn-close-game-over"),
        btnCloseVictory: document.querySelector("#btn-close-victory"),

        // Ações de reinício dentro dos modais
        btnRestartGameOver: document.querySelector("#btn-restart-game-over"),
        btnRestartVictory: document.querySelector("#btn-restart-victory"),

        // Campos do Game Over
        goTitle: document.querySelector("#game-over-title"),
        goMsg: document.querySelector("#game-over-msg"),
        goScore: document.querySelector("#go-score"),
        goRecord: document.querySelector("#go-record"),
        goLevel: document.querySelector("#go-level"),
        goCombo: document.querySelector("#go-combo"),

        // Campos de Vitória
        vicTitle: document.querySelector("#victory-title"),
        vicMsg: document.querySelector("#victory-msg"),
        vicScore: document.querySelector("#vic-score"),
        vicRecord: document.querySelector("#vic-record"),
        vicLevel: document.querySelector("#vic-level"),
        vicCombo: document.querySelector("#vic-combo"),
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
 * Pré-carregamento assíncrono do herói Dante.
 */
async function preloadHero() {
    const img = new Image();
    img.src = "./src/img/player.png";
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
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
    const btn = state.view.btnSound;
    if (!btn) return;

    if (state.audio.isSoundEnabled) {
        btn.classList.remove("muted");
        state.engines.synth.init();
        state.engines.synth.playHit(1);
    } else {
        btn.classList.add("muted");
    }
}

function toggleMusic() {
    state.engines.synth.init();
    const btn = state.view.btnMusic;
    if (!btn) return;

    if (state.audio.isMusicPlaying) {
        state.audio.bgMusic.pause();
        state.audio.isMusicPlaying = false;
        btn.classList.add("muted");
    } else {
        state.audio.bgMusic.play().then(() => {
            state.audio.isMusicPlaying = true;
            btn.classList.remove("muted");
        }).catch(() => {
            console.log("Autoplay de música aguardando interação do usuário.");
        });
    }
}

function renderLives(livesCount) {
    if (!state.view.lives) return;
    const hearts = ["🖤🖤🖤", "❤️🖤🖤", "❤️❤️🖤", "❤️❤️❤️"];
    const clamped = Math.max(0, Math.min(3, livesCount));
    state.view.lives.textContent = hearts[clamped];
}

function showComboBanner(comboCount) {
    const banner = state.view.comboBanner;
    if (!banner) return;
    banner.textContent = `COMBO x${comboCount}!`;
    banner.classList.add("active");
    setTimeout(() => {
        banner.classList.remove("active");
    }, 700);
}

function spawnNextTarget() {
    if (!state.engines.fsm.is(States.PLAYING)) return;

    state.view.cells.forEach((cell) => cell.classList.remove("enemy"));

    const nextPos = state.engines.spawn.getNextPosition();
    const cellElement = document.getElementById(nextPos.toString());
    if (cellElement) {
        cellElement.classList.add("enemy");
        state.timers.hitPosition = nextPos.toString();
    }
}

function rescheduleSpawn() {
    clearInterval(state.timers.spawnTimerId);
    if (!state.engines.fsm.is(States.PLAYING)) return;

    const levelData = state.engines.spawn.calculateLevel(state.engines.score.score);
    if (state.view.level) {
        state.view.level.textContent = levelData.level;
    }

    if (levelData.isLevelUp) {
        playSound("levelUp");
        showComboBanner(`NÍVEL ${levelData.level}!`);
    }

    state.timers.spawnTimerId = setInterval(spawnNextTarget, levelData.velocity);
}

function handleCellPress(cellId) {
    if (!state.engines.fsm.is(States.PLAYING)) return;
    // Se o herói já foi acertado e o próximo ainda não apareceu, ignora toque para evitar erro fantasma
    if (!state.timers.hitPosition) return;

    const cellElement = document.getElementById(cellId);
    if (!cellElement) return;

    if (cellId === state.timers.hitPosition) {
        // Acerto! Feedback tátil verde neon
        const hitResult = state.engines.score.registerHit(10);
        state.view.score.textContent = hitResult.score;
        state.view.highScore.textContent = hitResult.highScore;

        if (hitResult.isRecord) {
            localStorage.setItem("dante_dash_high_score", hitResult.highScore.toString());
        }

        if (hitResult.combo >= 2) {
            showComboBanner(hitResult.combo);
        }

        playSound("hit", hitResult.combo);

        cellElement.classList.remove("enemy");
        cellElement.classList.add("correct");
        setTimeout(() => cellElement.classList.remove("correct"), 160);

        state.timers.hitPosition = null;
        rescheduleSpawn();
    } else {
        // Erro! Feedback tátil vermelho neon
        cellElement.classList.add("wrong");
        setTimeout(() => cellElement.classList.remove("wrong"), 160);

        playSound("miss");
        const missResult = state.engines.score.registerMiss();
        renderLives(missResult.livesRemaining);

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
        if (state.engines.score.lives > 0) {
            triggerVictory();
        } else {
            triggerGameOver("Tempo Esgotado!");
        }
    }
}

function updatePlayButtonIcon(isPlaying) {
    const icon = state.view.btnPlay ? state.view.btnPlay.querySelector("i") : null;
    if (!icon) return;
    if (isPlaying) {
        icon.className = "fas fa-pause";
    } else {
        icon.className = "fas fa-play";
    }
}

function triggerGameOver(reason = "Sem Vidas!") {
    if (!state.engines.fsm.canTransitionTo(States.GAME_OVER)) return;
    state.engines.fsm.transitionTo(States.GAME_OVER, { reason });

    clearInterval(state.timers.clockTimerId);
    clearInterval(state.timers.spawnTimerId);
    state.timers.hitPosition = null;

    state.view.cells.forEach((c) => c.classList.remove("enemy", "correct", "wrong"));
    updatePlayButtonIcon(false);

    playSound("gameOver");

    const stats = state.engines.score.getStats();

    if (state.view.goTitle) state.view.goTitle.textContent = reason;
    if (state.view.goScore) state.view.goScore.textContent = stats.score;
    if (state.view.goRecord) state.view.goRecord.textContent = stats.highScore;
    if (state.view.goLevel) state.view.goLevel.textContent = state.engines.spawn.currentLevel;
    if (state.view.goCombo) state.view.goCombo.textContent = `x${stats.maxCombo}`;

    if (state.view.modalGameOver) {
        state.view.modalGameOver.classList.add("active");
    }
}

function triggerVictory() {
    if (!state.engines.fsm.canTransitionTo(States.GAME_OVER)) return;
    state.engines.fsm.transitionTo(States.GAME_OVER, { victory: true });

    clearInterval(state.timers.clockTimerId);
    clearInterval(state.timers.spawnTimerId);
    state.timers.hitPosition = null;

    state.view.cells.forEach((c) => c.classList.remove("enemy", "correct", "wrong"));
    updatePlayButtonIcon(false);

    playSound("levelUp");

    const stats = state.engines.score.getStats();
    const isRecord = stats.score >= stats.highScore && stats.score > 0;

    if (isRecord) {
        if (state.view.vicTitle) state.view.vicTitle.textContent = "NOVO RECORDE!";
        if (state.view.vicMsg) state.view.vicMsg.textContent = `Incrível! Você fez ${stats.score} pontos e superou o recorde geral!`;
    } else {
        if (state.view.vicTitle) state.view.vicTitle.textContent = "Missão Cumprida!";
        if (state.view.vicMsg) state.view.vicMsg.textContent = `Incrível! Você sobreviveu aos 60 segundos com ${stats.score} pontos!`;
    }

    if (state.view.vicScore) state.view.vicScore.textContent = stats.score;
    if (state.view.vicRecord) state.view.vicRecord.textContent = stats.highScore;
    if (state.view.vicLevel) state.view.vicLevel.textContent = state.engines.spawn.currentLevel;
    if (state.view.vicCombo) state.view.vicCombo.textContent = `x${stats.maxCombo}`;

    if (state.view.modalVictory) {
        state.view.modalVictory.classList.add("active");
    }
}

function closeAllModals() {
    const modals = [
        state.view.modalHelp,
        state.view.modalCredits,
        state.view.modalGameOver,
        state.view.modalVictory
    ];
    modals.forEach((m) => {
        if (m) m.classList.remove("active");
    });
}

function togglePlayPause() {
    state.engines.synth.init();

    if (state.engines.fsm.is(States.PLAYING)) {
        // Pausar
        state.engines.fsm.transitionTo(States.PAUSED);
        clearInterval(state.timers.clockTimerId);
        clearInterval(state.timers.spawnTimerId);
        updatePlayButtonIcon(false);
    } else if (state.engines.fsm.is(States.PAUSED)) {
        // Retomar
        state.engines.fsm.transitionTo(States.PLAYING);
        updatePlayButtonIcon(true);
        state.timers.clockTimerId = setInterval(onClockTick, 1000);
        rescheduleSpawn();
    } else {
        // Novo Jogo (de MENU ou GAME_OVER)
        startMatch();
    }
}

function startMatch() {
    state.engines.synth.init();
    closeAllModals();

    clearInterval(state.timers.clockTimerId);
    clearInterval(state.timers.spawnTimerId);

    state.engines.score.reset();
    state.engines.spawn.reset();
    state.timers.currentTime = 60;
    state.timers.hitPosition = null;

    if (state.engines.fsm.is(States.PAUSED)) {
        state.engines.fsm.transitionTo(States.PLAYING);
    } else if (state.engines.fsm.canTransitionTo(States.PLAYING)) {
        state.engines.fsm.transitionTo(States.PLAYING);
    } else {
        state.engines.fsm.currentState = States.PLAYING;
    }

    state.view.score.textContent = "0";
    state.view.timeLeft.textContent = "60";
    if (state.view.level) state.view.level.textContent = "1";
    state.view.highScore.textContent = state.engines.score.highScore;
    renderLives(state.engines.score.lives);

    updatePlayButtonIcon(true);

    spawnNextTarget();
    rescheduleSpawn();
    state.timers.clockTimerId = setInterval(onClockTick, 1000);

    if (state.audio.isMusicPlaying) {
        state.audio.bgMusic.play().catch(() => {});
    }
}

function setupEvents() {
    // Interação com o tabuleiro (PointerDown para resposta instantânea em touch e mouse)
    state.view.cells.forEach((cell) => {
        cell.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            handleCellPress(cell.id);
        });
    });

    // Controles do Joystick
    if (state.view.btnPlay) {
        state.view.btnPlay.addEventListener("click", togglePlayPause);
    }
    if (state.view.btnSound) {
        state.view.btnSound.addEventListener("click", toggleSound);
    }
    if (state.view.btnMusic) {
        state.view.btnMusic.addEventListener("click", toggleMusic);
    }
    if (state.view.btnRestart) {
        state.view.btnRestart.addEventListener("click", startMatch);
    }

    // Abertura de Modais
    if (state.view.btnHelp) {
        state.view.btnHelp.addEventListener("click", () => {
            closeAllModals();
            if (state.view.modalHelp) state.view.modalHelp.classList.add("active");
        });
    }
    if (state.view.btnCredits) {
        state.view.btnCredits.addEventListener("click", () => {
            closeAllModals();
            if (state.view.modalCredits) state.view.modalCredits.classList.add("active");
        });
    }

    // Fechamento de Modais Canônicos
    if (state.view.btnCloseHelp) {
        state.view.btnCloseHelp.addEventListener("click", () => {
            if (state.view.modalHelp) state.view.modalHelp.classList.remove("active");
        });
    }
    if (state.view.btnCloseCredits) {
        state.view.btnCloseCredits.addEventListener("click", () => {
            if (state.view.modalCredits) state.view.modalCredits.classList.remove("active");
        });
    }
    if (state.view.btnCloseGameOver) {
        state.view.btnCloseGameOver.addEventListener("click", () => {
            if (state.view.modalGameOver) state.view.modalGameOver.classList.remove("active");
        });
    }
    if (state.view.btnCloseVictory) {
        state.view.btnCloseVictory.addEventListener("click", () => {
            if (state.view.modalVictory) state.view.modalVictory.classList.remove("active");
        });
    }

    // Reinício a partir dos modais
    if (state.view.btnRestartGameOver) {
        state.view.btnRestartGameOver.addEventListener("click", startMatch);
    }
    if (state.view.btnRestartVictory) {
        state.view.btnRestartVictory.addEventListener("click", startMatch);
    }

    // Teclado (1 a 9 e QWE/ASD/ZXC)
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
            handleCellPress(keyMap[key]);
        } else if (key === " ") {
            togglePlayPause();
        } else if (key === "m") {
            toggleMusic();
        } else if (key === "s") {
            toggleSound();
        } else if (key === "h" || key === "?") {
            closeAllModals();
            if (state.view.modalHelp) state.view.modalHelp.classList.add("active");
        } else if (key === "c") {
            closeAllModals();
            if (state.view.modalCredits) state.view.modalCredits.classList.add("active");
        } else if (key === "escape") {
            closeAllModals();
        }
    });

    // Exposição no escopo global para compatibilidade
    window.startGame = startMatch;
    window.restartGame = startMatch;
    window.toggleMusic = toggleMusic;
    window.toggleSound = toggleSound;
}

function initGame() {
    preloadHero();

    const savedHighScore = parseInt(localStorage.getItem("dante_dash_high_score") || "0", 10);
    state.engines.score = new ScoreEngine(savedHighScore, 3);
    state.engines.spawn = new SpawnEngine(1540, 495, 9);
    state.engines.fsm = new GameStateManager(States.MENU);

    if (state.view.highScore) state.view.highScore.textContent = savedHighScore;
    renderLives(3);

    setupEvents();
}

window.addEventListener("DOMContentLoaded", initGame);
