import {
    COLORS,
    FONT,
    HIGH_SCORE_KEY,
    PLAYER_SPEED,
    SCORE_STEP,
    SOUND_KEY,
} from "./constants.js";
import { GameComponent } from "./game-component.js";
import { ParticleSystem } from "./particles.js";
import { SoundBoard } from "./sound.js";
import { GameUi, bindUi } from "./ui.js";
import {
    clamp,
    getMaxObstaclesCount,
    getRandomBinary,
    getRandomSpeed,
    getRandomTarget,
    getRandomYPos,
    streakMultiplier,
    toDecimal,
} from "./utils.js";

export class Game {
    constructor() {
        this.ui = new GameUi(bindUi());
        this.canvas = this.ui.els.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.score = 0;
        this.highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
        this.streak = 0;
        this.target = getRandomTarget();
        this.paused = true;
        this.helpOpen = true;
        this.obstacles = [];
        this.maxObstacles = getMaxObstaclesCount(document.body.clientWidth);
        this.particles = new ParticleSystem();
        this.soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
        this.sound = new SoundBoard(this.soundEnabled);

        this.touchOriginX = null;
        this.touchStartX = null;
        this.lastFrameTime = 0;
        this.flashUntil = 0;
        this.flashColor = null;
        this.keys = { ArrowLeft: false, ArrowRight: false };

        this.player = new GameComponent({
            context: this.ctx,
            width: 50,
            height: 40,
            text: "mem",
            color: COLORS.blackColor,
            bgColor: COLORS.primaryColor,
            xPos: 0,
            xPadding: 10,
            yPos: 0,
        });
    }

    start() {
        this.ctx.font = `${FONT.large} ${FONT.family}`;
        this.ui.setTarget(this.target);
        this.ui.setScore(this.score);
        this.ui.setHighScore(this.highScore);
        this.ui.setStreak(0);
        this.ui.syncSound(this.soundEnabled);

        this.resize();
        this.player.xPos =
            (this.canvas.width - this.player.width - this.player.xPadding) / 2;
        this.clampPlayer();
        this.drawFrame(0, true);

        this.ui.els.playBtn.classList.remove("hidden");
        this.ui.els.pauseBtn.classList.add("hidden");
        this.ui.els.pauseOverlay.classList.add("hidden");

        this.bindEvents();
        requestAnimationFrame((t) => this.loop(t));
    }

    bindEvents() {
        const { playBtn, pauseBtn, helpClose, helpOpen, soundBtn, shareBtn } =
            this.ui.els;

        playBtn.addEventListener("click", () => {
            this.sound.ensure();
            this.setPaused(false);
        });
        pauseBtn.addEventListener("click", () => this.setPaused(true));
        helpClose.addEventListener("click", () => this.closeHelp());
        helpOpen.addEventListener("click", () => this.openHelp());
        soundBtn.addEventListener("click", () => this.toggleSound());
        shareBtn.addEventListener("click", () =>
            this.ui.shareScore(this.score, this.highScore)
        );
        window.addEventListener("resize", () => this.resize());

        document.addEventListener(
            "touchstart",
            (e) => {
                if (this.helpOpen) return;
                this.touchOriginX = this.player.xPos;
                this.touchStartX = e.touches[0].clientX;
            },
            { passive: true }
        );
        document.addEventListener(
            "touchmove",
            (e) => {
                if (this.touchOriginX === null || this.touchStartX === null) return;
                this.player.xPos =
                    this.touchOriginX + (e.touches[0].clientX - this.touchStartX);
                this.clampPlayer();
            },
            { passive: true }
        );
        const clearTouch = () => {
            this.touchOriginX = null;
            this.touchStartX = null;
        };
        document.addEventListener("touchend", clearTouch);
        document.addEventListener("touchcancel", clearTouch);

        window.addEventListener("keydown", (e) => this.onKeyDown(e));
        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
                this.keys[e.code] = false;
            }
        });
    }

    onKeyDown(e) {
        if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === "Escape") {
            if (this.helpOpen) this.closeHelp();
            else this.openHelp();
            return;
        }

        if (e.code === "Space" && !this.helpOpen) {
            if (this.paused) this.sound.ensure();
            this.setPaused(!this.paused);
            return;
        }

        if (e.code === "KeyM") {
            this.toggleSound();
            return;
        }

        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
            this.keys[e.code] = true;
        }
    }

    setPaused(paused) {
        this.paused = paused;
        this.ui.setPaused(paused, this.helpOpen);
    }

    openHelp() {
        this.helpOpen = true;
        this.setPaused(true);
        this.ui.openHelp();
    }

    closeHelp() {
        this.helpOpen = false;
        this.ui.closeHelp();
        this.sound.ensure();
        this.setPaused(false);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.sound.enabled = this.soundEnabled;
        this.ui.syncSound(this.soundEnabled);
        if (this.soundEnabled) {
            this.sound.ensure();
            this.sound.correct(1);
        }
    }

    clampPlayer() {
        const maxX = this.canvas.width - this.player.width - this.player.xPadding;
        this.player.xPos = clamp(this.player.xPos, 0, maxX);
        this.player.yPos = this.canvas.height - this.player.height - 10;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.maxObstacles = getMaxObstaclesCount(this.canvas.width);
        this.clampPlayer();
        this.drawFrame(0, true);
    }

    updateScore(delta) {
        this.score = Math.max(0, this.score + delta);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.ui.setHighScore(this.highScore);
        }
        this.ui.setScore(this.score);
    }

    setStreak(streak) {
        this.streak = streak;
        this.ui.setStreak(streak);
    }

    setNewTarget() {
        this.target = getRandomTarget();
        this.ui.setTarget(this.target);
    }

    speedForScore() {
        const boost = Math.min(this.score / 100, 2);
        return 1 + boost * 0.35;
    }

    randomX(width) {
        return Math.floor(
            Math.random() * Math.max(1, this.canvas.width - width)
        );
    }

    spawnObstacles() {
        const needed = this.maxObstacles - this.obstacles.length;
        for (let i = 0; i < needed; i++) {
            const binary = getRandomBinary();
            const obstacle = new GameComponent({
                context: this.ctx,
                text: binary,
                color: COLORS.primaryColor,
                bgColor: COLORS.blackColor,
                xPos: 0,
                xPadding: 8,
                yPos: getRandomYPos(),
                moveSpeed: getRandomSpeed() * this.speedForScore(),
                rounding: 5,
            });

            this.ctx.font = `${FONT.small} ${FONT.family}`;
            obstacle.width = Math.ceil(this.ctx.measureText(binary).width);
            obstacle.height = 18;
            obstacle.xPos = this.randomX(obstacle.width + obstacle.xPadding);
            this.obstacles.push(obstacle);
        }
    }

    handleCatch(obstacle) {
        const decimal = toDecimal(obstacle.text);
        const { x, y } = obstacle.center;

        if (decimal === this.target) {
            this.setStreak(this.streak + 1);
            const points = Math.round(SCORE_STEP * streakMultiplier(this.streak));
            this.updateScore(points);
            this.setNewTarget();
            this.flashColor = COLORS.hitCorrect;
            this.particles.spawn(x, y, COLORS.hitCorrect, 16);
            this.sound.correct(this.streak);
            const bonus =
                this.streak > 1
                    ? `  ·  x${streakMultiplier(this.streak).toFixed(1)} streak`
                    : "";
            this.ui.showToast(`+${points}${bonus}`, "correct");
        } else {
            this.setStreak(0);
            this.updateScore(-SCORE_STEP);
            this.flashColor = COLORS.hitWrong;
            this.particles.spawn(x, y, COLORS.hitWrong, 10);
            this.sound.wrong();
            this.ui.showToast(`${obstacle.text} = ${decimal}`, "wrong");
        }

        this.flashUntil = performance.now() + 180;
    }

    drawFrame(deltaSeconds, forceDraw = false) {
        if (this.paused && !forceDraw) return;

        const { ctx, canvas, player } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.flashUntil > performance.now()) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = 0.18;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }

        if (!this.paused) {
            if (this.keys.ArrowLeft) player.xPos -= PLAYER_SPEED * deltaSeconds;
            if (this.keys.ArrowRight) player.xPos += PLAYER_SPEED * deltaSeconds;
            this.clampPlayer();
            this.particles.update(deltaSeconds);
        }

        ctx.font = `${FONT.large} ${FONT.family}`;
        ctx.fillStyle = player.bgColor;
        player.render();

        if (!this.paused) {
            const remaining = [];
            for (const obstacle of this.obstacles) {
                if (player.doesCrash(obstacle)) {
                    this.handleCatch(obstacle);
                    continue;
                }
                remaining.push(obstacle);
            }
            this.obstacles = remaining;
            this.spawnObstacles();

            ctx.font = `${FONT.small} ${FONT.family}`;
            for (const obstacle of this.obstacles) {
                obstacle.yPos += obstacle.moveSpeed * deltaSeconds;
                obstacle.render();
            }
            this.obstacles = this.obstacles.filter(
                (o) => o.yPos < canvas.height
            );
        } else {
            ctx.font = `${FONT.small} ${FONT.family}`;
            for (const obstacle of this.obstacles) {
                obstacle.render();
            }
        }

        this.particles.draw(ctx);
    }

    loop(timestamp) {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const deltaSeconds = Math.min(
            (timestamp - this.lastFrameTime) / 1000,
            0.05
        );
        this.lastFrameTime = timestamp;
        this.drawFrame(deltaSeconds);
        requestAnimationFrame((t) => this.loop(t));
    }
}
