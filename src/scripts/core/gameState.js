/**
 * GameState - Máquina de Estados Finitos (FSM) para ciclo de vida do jogo.
 * Domínio puro: zero dependência de DOM.
 */
export const States = Object.freeze({
    MENU: "MENU",
    COUNTDOWN: "COUNTDOWN",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAME_OVER: "GAME_OVER"
});

export class GameStateManager {
    constructor(initialState = States.MENU, onStateChange = null) {
        this.currentState = initialState;
        this.onStateChange = onStateChange;

        // Grafo de transições válidas
        this.validTransitions = {
            [States.MENU]: [States.COUNTDOWN, States.PLAYING],
            [States.COUNTDOWN]: [States.PLAYING, States.MENU],
            [States.PLAYING]: [States.PAUSED, States.GAME_OVER, States.MENU],
            [States.PAUSED]: [States.PLAYING, States.MENU, States.GAME_OVER],
            [States.GAME_OVER]: [States.MENU, States.COUNTDOWN, States.PLAYING]
        };
    }

    canTransitionTo(newState) {
        const allowed = this.validTransitions[this.currentState] || [];
        return allowed.includes(newState);
    }

    transitionTo(newState, payload = {}) {
        if (!this.canTransitionTo(newState)) {
            throw new Error(`Transição inválida de ${this.currentState} para ${newState}`);
        }

        const previousState = this.currentState;
        this.currentState = newState;

        if (typeof this.onStateChange === "function") {
            this.onStateChange(previousState, newState, payload);
        }

        return this.currentState;
    }

    is(state) {
        return this.currentState === state;
    }

    getState() {
        return this.currentState;
    }
}
