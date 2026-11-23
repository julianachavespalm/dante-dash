/**
 * SpawnEngine - Gerenciador desacoplado de temporização progressiva, níveis e sorteio de alvos.
 * Domínio puro: zero dependência de DOM.
 * 
 * Desenvolvido para: Dante Dash Arcade Edition
 * Engenharia: Juliana Chaves Palm
 */

export const GAME_LEVELS = [
    { level: 1, minScore: 0, velocity: 1400, story: "Dante acorda seu robô para brincar no castelo!" },
    { level: 2, minScore: 30, velocity: 1100, story: "O ritmo acelerou! Os monstrinhos do caderno ganharam vida!" },
    { level: 3, minScore: 80, velocity: 850, story: "Solo de guitarra do Denis Martino esquentando a arena!" },
    { level: 4, minScore: 150, velocity: 650, story: "Super velocidade ativada! Dante está com turbo total!" },
    { level: 5, minScore: 230, velocity: 450, story: "Modo Lendário! Reflexos ninja no castelo do Dante!" }
];

export class SpawnEngine {
    constructor(baseVelocity = 1400, minVelocity = 450, totalSquares = 9, levels = GAME_LEVELS) {
        this.baseVelocity = baseVelocity;
        this.minVelocity = minVelocity;
        this.totalSquares = totalSquares;
        this.levels = levels;
        this.lastPosition = null;
        this.currentLevel = 1;
    }

    /**
     * Retorna a fase e velocidade calculadas com base na pontuação atual.
     * @param {number} currentScore
     * @returns {{ level: number, velocity: number, story: string, isLevelUp: boolean }}
     */
    calculateLevel(currentScore) {
        let activeLevel = this.levels[0];
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (currentScore >= this.levels[i].minScore) {
                activeLevel = this.levels[i];
                break;
            }
        }

        const isLevelUp = activeLevel.level > this.currentLevel;
        if (isLevelUp) {
            this.currentLevel = activeLevel.level;
        }

        return {
            level: activeLevel.level,
            velocity: activeLevel.velocity,
            story: activeLevel.story,
            isLevelUp
        };
    }

    calculateVelocity(currentScore) {
        return this.calculateLevel(currentScore).velocity;
    }

    getNextPosition(randomGenerator = Math.random) {
        let nextPos;
        // Evita repetir a mesma posição consecutiva se houver mais de 1 quadrado
        do {
            nextPos = Math.floor(randomGenerator() * this.totalSquares) + 1;
        } while (nextPos === this.lastPosition && this.totalSquares > 1);

        this.lastPosition = nextPos;
        return nextPos;
    }

    reset() {
        this.lastPosition = null;
        this.currentLevel = 1;
    }
}
