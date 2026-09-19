export class SoundBoard {
    constructor(enabled) {
        this.enabled = enabled;
        this.ctx = null;
    }

    ensure() {
        if (!this.enabled) return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        return this.ctx;
    }

    tone(freq, duration, type = "sine", gain = 0.05) {
        const ctx = this.ensure();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const amp = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        amp.gain.value = gain;
        amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(amp);
        amp.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    correct(streak = 1) {
        const bump = Math.min(streak, 6) * 30;
        this.tone(520 + bump, 0.08, "triangle", 0.045);
        setTimeout(() => this.tone(780 + bump, 0.1, "triangle", 0.035), 55);
    }

    wrong() {
        this.tone(180, 0.14, "sawtooth", 0.035);
        setTimeout(() => this.tone(120, 0.16, "sawtooth", 0.025), 70);
    }
}
