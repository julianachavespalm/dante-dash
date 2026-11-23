/**
 * ScoreEngine - Gerenciador desacoplado de regras de pontuação, combos e vidas.
 * Domínio puro: zero dependência de DOM ou APIs de navegador.
 */
export class ScoreEngine {
    constructor(initialHighScore = 0, initialLives = 3) {
        this.highScore = Number(initialHighScore) || 0;
        this.maxLives = initialLives;
        this.reset();
    }

    reset() {
        this.score = 0;
        this.lives = this.maxLives;
        this.combo = 0;
        this.maxCombo = 0;
    }

    registerHit(basePoints = 10) {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        const multiplier = Math.min(this.combo, 4);
        const pointsAdded = basePoints * multiplier;
        this.score += pointsAdded;

        const isRecord = this.score > this.highScore;
        if (isRecord) {
            this.highScore = this.score;
        }

        return {
            pointsAdded,
            multiplier,
            score: this.score,
            highScore: this.highScore,
            isRecord,
            combo: this.combo
        };
    }

    registerMiss() {
        this.combo = 0;
        this.lives = Math.max(0, this.lives - 1);
        const isGameOver = this.lives === 0;

        return {
            livesRemaining: this.lives,
            isGameOver
        };
    }

    getStats() {
        return {
            score: this.score,
            highScore: this.highScore,
            lives: this.lives,
            combo: this.combo,
            maxCombo: this.maxCombo,
            isAlive: this.lives > 0
        };
    }
}
