import { clamp } from "./utils.js";

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, color, count = 14) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
            const speed = 80 + Math.random() * 160;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                life: 0.35 + Math.random() * 0.35,
                maxLife: 0.7,
                size: 2 + Math.random() * 3,
                color,
            });
        }
    }

    update(deltaSeconds) {
        for (const p of this.particles) {
            p.life -= deltaSeconds;
            p.x += p.vx * deltaSeconds;
            p.y += p.vy * deltaSeconds;
            p.vy += 420 * deltaSeconds;
        }
        this.particles = this.particles.filter((p) => p.life > 0);
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
}
