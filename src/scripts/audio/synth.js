/**
 * RetroAudioSynth - Sintetizador Web Audio API 8-Bits Procedural
 * Elimina latência de áudio na rede gerando ondas quadradas/triangulares em tempo real (< 2ms).
 * 
 * Desenvolvido para: Dante Dash Arcade Edition
 * Engenharia: Juliana Chaves Palm
 */
export class RetroAudioSynth {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx && typeof window !== "undefined") {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
    }

    /**
     * Efeito sonoro de acerto com pitch proporcional ao combo.
     * @param {number} combo - Multiplicador de combo atual (1..4)
     */
    playHit(combo = 1) {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Onda quadrada clássica de arcade 8-bits
        osc.type = "square";
        
        // Pitch sobe proporcionalmente ao combo acumulado
        const baseFreq = 440;
        const multiplier = Math.min(2.0, 1 + (combo - 1) * 0.18);
        osc.frequency.setValueAtTime(baseFreq * multiplier, now);
        osc.frequency.exponentialRampToValueAtTime((baseFreq * 2.2) * multiplier, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Efeito sonoro de erro (perda de vida).
     */
    playMiss() {
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Onda dente-de-serra grave para tom de aviso
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.16);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    /**
     * Efeito sonoro de avanço de nível (arpeggio arcade ascendente).
     */
    playLevelUp() {
        this.init();
        if (!this.ctx) return;

        const notes = [330, 392, 523, 659]; // E4, G4, C5, E5
        notes.forEach((freq, idx) => {
            const noteStart = this.ctx.currentTime + idx * 0.06;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "square";
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.18, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.08);
        });
    }

    /**
     * Efeito de encerramento / Game Over.
     */
    playGameOver() {
        this.init();
        if (!this.ctx) return;

        const notes = [310, 270, 220, 160];
        notes.forEach((freq, idx) => {
            const noteStart = this.ctx.currentTime + idx * 0.11;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.2, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.14);
        });
    }
}
