/**
 * Dante Dash - Engine de Jogo Arcade
 * 
 * Desenho do Personagem: Dante Chaves Martino (aos 4 anos)
 * Trilha Sonora: Denis Martino
 * Engenharia: Juliana Chaves Palm
 */

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
    values: {
        gameVelocity: 1000,
        minVelocity: 450,
        hitPosition: null,
        score: 0,
        highScore: parseInt(localStorage.getItem("dante_dash_high_score") || "0", 10),
        currentTime: 60,
        lives: 3,
        combo: 0,
        maxCombo: 0,
    },
    actions: {
        timerId: null,
        countDownTimerId: null,
        gameStarted: false,
        isMusicPlaying: false,
    },
    audio: {
        bgMusic: new Audio("./src/audios/trilha-metal__denis-martino.m4a"),
        hitSound: new Audio("./src/audios/hit.m4a"),
    }
};

// Configurações de Áudio
state.audio.bgMusic.loop = true;
state.audio.bgMusic.volume = 0.25;
state.audio.hitSound.volume = 0.4;

function playSound(audioName) {
    try {
        if (audioName === "hit") {
            const soundClone = state.audio.hitSound.cloneNode();
            soundClone.volume = 0.35;
            soundClone.play().catch(() => {});
        }
    } catch (e) {
        // Silencia erros de autoplay do navegador
    }
}

function toggleMusic() {
    if (state.actions.isMusicPlaying) {
        state.audio.bgMusic.pause();
        state.actions.isMusicPlaying = false;
        state.view.musicButton.textContent = "🎵 Música: Off";
        state.view.musicButton.classList.remove("is-golden");
    } else {
        state.audio.bgMusic.play().then(() => {
            state.actions.isMusicPlaying = true;
            state.view.musicButton.textContent = "🔊 Música: On";
            state.view.musicButton.classList.add("is-golden");
        }).catch(() => {
            console.log("Autoplay bloqueado pelo navegador até interação.");
        });
    }
}

function renderLives() {
    let hearts = "";
    for (let i = 0; i < state.values.lives; i++) {
        hearts += "❤️";
    }
    state.view.lives.textContent = hearts || "💀";
}

function updateScore(points) {
    state.values.score += points;
    state.view.score.textContent = state.values.score;

    if (state.values.score > state.values.highScore) {
        state.values.highScore = state.values.score;
        localStorage.setItem("dante_dash_high_score", state.values.highScore.toString());
        state.view.highScore.textContent = state.values.highScore;
    }
}

function updateCombo(isHit) {
    if (isHit) {
        state.values.combo++;
        if (state.values.combo > state.values.maxCombo) {
            state.values.maxCombo = state.values.combo;
        }

        if (state.values.combo >= 2) {
            state.view.comboDisplay.textContent = `COMBO x${state.values.combo}! 🔥`;
            state.view.comboDisplay.style.transform = "scale(1.2)";
            setTimeout(() => {
                state.view.comboDisplay.style.transform = "scale(1)";
            }, 150);
        }
    } else {
        state.values.combo = 0;
        state.view.comboDisplay.textContent = "";
    }
}

function randomSquare() {
    state.view.squares.forEach((square) => {
        square.classList.remove("enemy");
    });

    let randomNumber = Math.floor(Math.random() * state.view.squares.length);
    let randomSquare = state.view.squares[randomNumber];
    randomSquare.classList.add("enemy");
    state.values.hitPosition = randomSquare.id;
}

function speedUpGame() {
    // Acelera gradualmente o jogo conforme a pontuação sobe
    const newVelocity = Math.max(state.values.minVelocity, 1000 - (state.values.score * 15));
    if (newVelocity !== state.values.gameVelocity) {
        state.values.gameVelocity = newVelocity;
        clearInterval(state.actions.timerId);
        state.actions.timerId = setInterval(randomSquare, state.values.gameVelocity);
    }
}

function hitSquare(squareId) {
    if (!state.actions.gameStarted) return;

    const squareElement = document.getElementById(squareId);

    if (squareId === state.values.hitPosition) {
        // Acerto!
        updateCombo(true);
        const multiplier = Math.min(state.values.combo, 4);
        const pointsAwarded = 10 * multiplier;
        updateScore(pointsAwarded);

        squareElement.classList.add("hit-success");
        setTimeout(() => squareElement.classList.remove("hit-success"), 150);

        playSound("hit");
        state.values.hitPosition = null;
        squareElement.classList.remove("enemy");

        speedUpGame();
    } else {
        // Erro
        updateCombo(false);
        state.values.lives--;
        renderLives();

        if (state.values.lives <= 0) {
            endGame("Sem Vidas!");
        }
    }
}

function countDown() {
    state.values.currentTime--;
    state.view.timeLeft.textContent = state.values.currentTime;

    if (state.values.currentTime <= 0) {
        endGame("Tempo Esgotado!");
    }
}

function endGame(reason) {
    clearInterval(state.actions.countDownTimerId);
    clearInterval(state.actions.timerId);
    state.actions.gameStarted = false;
    state.values.hitPosition = null;

    state.view.squares.forEach((square) => {
        square.classList.remove("enemy");
    });

    const isNewRecord = state.values.score >= state.values.highScore && state.values.score > 0;

    state.view.finalScore.textContent = state.values.score;
    state.view.finalCombo.textContent = `x${state.values.maxCombo}`;
    state.view.modalHighScore.textContent = state.values.highScore;

    if (isNewRecord) {
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

function restartGame() {
    state.view.modal.classList.add("hidden");
    startGame();
}

function startGame() {
    // Reseta estado
    clearInterval(state.actions.countDownTimerId);
    clearInterval(state.actions.timerId);

    state.values.score = 0;
    state.values.currentTime = 60;
    state.values.lives = 3;
    state.values.combo = 0;
    state.values.maxCombo = 0;
    state.values.gameVelocity = 1000;
    state.values.hitPosition = null;
    state.actions.gameStarted = true;

    state.view.score.textContent = "0";
    state.view.timeLeft.textContent = "60";
    state.view.highScore.textContent = state.values.highScore;
    state.view.comboDisplay.textContent = "";
    state.view.modal.classList.add("hidden");
    state.view.initButton.disabled = true;

    renderLives();

    // Inicia timers
    randomSquare();
    state.actions.timerId = setInterval(randomSquare, state.values.gameVelocity);
    state.actions.countDownTimerId = setInterval(countDown, 1000);

    // Se a música estiver habilitada, garante reprodução
    if (state.actions.isMusicPlaying) {
        state.audio.bgMusic.play().catch(() => {});
    }
}

function setupListeners() {
    // Touch e Mouse nos Quadrados (PointerDown para zero lag no celular)
    state.view.squares.forEach((square) => {
        square.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            hitSquare(square.id);
        });
    });

    // Mapeamento de Teclado no Desktop (1..9 e QWE/ASD/ZXC)
    const keyMap = {
        "1": "1", "2": "2", "3": "3",
        "4": "4", "5": "5", "6": "6",
        "7": "7", "8": "8", "9": "9",
        "q": "1", "w": "2", "e": "3",
        "a": "4", "s": "5", "d": "6",
        "z": "7", "x": "8", "c": "9",
    };

    window.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase();
        if (keyMap[key]) {
            hitSquare(keyMap[key]);
        } else if (key === " " && !state.actions.gameStarted) {
            startGame();
        } else if (key === "m") {
            toggleMusic();
        }
    });
}

function init() {
    state.view.highScore.textContent = state.values.highScore;
    renderLives();
    setupListeners();
}

window.addEventListener("DOMContentLoaded", init);
