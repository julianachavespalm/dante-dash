import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ScoreEngine } from "../src/scripts/core/scoreEngine.js";
import { SpawnEngine, GAME_LEVELS } from "../src/scripts/core/spawnEngine.js";
import { GameStateManager, States } from "../src/scripts/core/gameState.js";

describe("ScoreEngine - Regras de Pontuação, Combo e Vidas", () => {
    it("deve inicializar com placar zerado e vidas completas", () => {
        const engine = new ScoreEngine(100, 3);
        const stats = engine.getStats();
        assert.equal(stats.score, 0);
        assert.equal(stats.lives, 3);
        assert.equal(stats.highScore, 100);
        assert.equal(stats.combo, 0);
        assert.equal(stats.isAlive, true);
    });

    it("deve aplicar multiplicador de combo acumulado em acertos contínuos", () => {
        const engine = new ScoreEngine(0, 3);

        const hit1 = engine.registerHit(10);
        assert.equal(hit1.multiplier, 1);
        assert.equal(hit1.pointsAdded, 10);
        assert.equal(hit1.score, 10);

        const hit2 = engine.registerHit(10);
        assert.equal(hit2.multiplier, 2);
        assert.equal(hit2.pointsAdded, 20);
        assert.equal(hit2.score, 30);

        const hit3 = engine.registerHit(10);
        assert.equal(hit3.multiplier, 3);
        assert.equal(hit3.pointsAdded, 30);
        assert.equal(hit3.score, 60);

        const hit4 = engine.registerHit(10);
        assert.equal(hit4.multiplier, 4);
        assert.equal(hit4.pointsAdded, 40);
        assert.equal(hit4.score, 100);

        // Limite máximo do multiplicador é x4
        const hit5 = engine.registerHit(10);
        assert.equal(hit5.multiplier, 4);
        assert.equal(hit5.pointsAdded, 40);
        assert.equal(hit5.score, 140);
    });

    it("deve zerar o combo e reduzir vidas em caso de erro", () => {
        const engine = new ScoreEngine(0, 3);
        engine.registerHit();
        engine.registerHit();
        assert.equal(engine.combo, 2);

        const miss1 = engine.registerMiss();
        assert.equal(miss1.livesRemaining, 2);
        assert.equal(miss1.isGameOver, false);
        assert.equal(engine.combo, 0);

        engine.registerMiss();
        const miss3 = engine.registerMiss();
        assert.equal(miss3.livesRemaining, 0);
        assert.equal(miss3.isGameOver, true);
    });

    it("deve detectar e atualizar novo recorde", () => {
        const engine = new ScoreEngine(50, 3);
        const hit1 = engine.registerHit(30);
        assert.equal(hit1.isRecord, false);

        const hit2 = engine.registerHit(30);
        assert.equal(hit2.isRecord, true);
        assert.equal(engine.highScore, 90);
    });
});

describe("SpawnEngine - Temporização Adaptativa em 5 Níveis e Sorteio", () => {
    it("deve iniciar calmo no Nível 1 (1400ms) e progredir até o Nível 5 (450ms)", () => {
        const spawn = new SpawnEngine();
        
        // Nível 1: Começo calmo
        const lvl1 = spawn.calculateLevel(0);
        assert.equal(lvl1.level, 1);
        assert.equal(lvl1.velocity, 1400);

        // Nível 2: 30 pontos
        const lvl2 = spawn.calculateLevel(30);
        assert.equal(lvl2.level, 2);
        assert.equal(lvl2.velocity, 1100);
        assert.equal(lvl2.isLevelUp, true);

        // Nível 3: 80 pontos
        const lvl3 = spawn.calculateLevel(80);
        assert.equal(lvl3.level, 3);
        assert.equal(lvl3.velocity, 850);
        assert.equal(lvl3.isLevelUp, true);

        // Nível 4: 150 pontos
        const lvl4 = spawn.calculateLevel(150);
        assert.equal(lvl4.level, 4);
        assert.equal(lvl4.velocity, 650);

        // Nível 5: 250 pontos
        const lvl5 = spawn.calculateLevel(250);
        assert.equal(lvl5.level, 5);
        assert.equal(lvl5.velocity, 450);
    });

    it("deve sortear posições válidas sem repetição imediata", () => {
        const spawn = new SpawnEngine();
        const positions = [];
        for (let i = 0; i < 20; i++) {
            positions.push(spawn.getNextPosition());
        }

        assert.equal(positions.length, 20);
        for (let i = 0; i < positions.length; i++) {
            assert.ok(positions[i] >= 1 && positions[i] <= 9);
            if (i > 0) {
                assert.notEqual(positions[i], positions[i - 1], "Posição consecutiva não deve se repetir");
            }
        }
    });

    it("deve reiniciar o nível e a última posição no reset", () => {
        const spawn = new SpawnEngine();
        spawn.calculateLevel(100);
        assert.equal(spawn.currentLevel, 3);
        spawn.reset();
        assert.equal(spawn.currentLevel, 1);
        assert.equal(spawn.lastPosition, null);
    });
});

describe("GameStateManager - FSM e Ciclo de Vida", () => {
    it("deve iniciar no estado MENU e permitir transição para PLAYING", () => {
        const fsm = new GameStateManager(States.MENU);
        assert.equal(fsm.getState(), States.MENU);

        fsm.transitionTo(States.PLAYING);
        assert.equal(fsm.getState(), States.PLAYING);
    });

    it("deve suportar PAUSED e retomar para PLAYING", () => {
        const fsm = new GameStateManager(States.PLAYING);
        fsm.transitionTo(States.PAUSED);
        assert.equal(fsm.is(States.PAUSED), true);

        fsm.transitionTo(States.PLAYING);
        assert.equal(fsm.is(States.PLAYING), true);
    });

    it("deve rejeitar transições inválidas lançando erro", () => {
        const fsm = new GameStateManager(States.MENU);
        assert.throws(() => {
            fsm.transitionTo(States.PAUSED);
        }, /Transição inválida/);
    });
});
