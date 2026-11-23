/**
 * SpawnEngine - Gerenciador desacoplado de temporização adaptativa e sorteio de alvos.
 * Domínio puro: zero dependência de DOM.
 */
export class SpawnEngine {
    constructor(baseVelocity = 1000, minVelocity = 450, totalSquares = 9) {
        this.baseVelocity = baseVelocity;
        this.minVelocity = minVelocity;
        this.totalSquares = totalSquares;
        this.lastPosition = null;
    }

    calculateVelocity(currentScore) {
        // Acelera gradualmente: a cada ponto reduz tempo em ms até o limite inferior
        const reduction = Math.floor(currentScore * 1.5);
        return Math.max(this.minVelocity, this.baseVelocity - reduction);
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
    }
}
