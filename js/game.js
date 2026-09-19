import {
    COLORS,
    FONT,
    PLAYER_SPEED,
    SCORE_STEP,
    SOUND_KEY,
} from "./constants.js";
import {
    BLOCK_LOOKS,
    BLOCK_SIZES,
    loadBlockLook,
    loadBlockSize,
} from "./appearance.js";
import { GameComponent } from "./game-component.js";
import {
    DIFFICULTIES,
    loadCheats,
    loadDifficulty,
    loadOnScreenControls,
    loadPlayMode,
} from "./modes.js";
import { ParticleSystem } from "./particles.js";
import { SoundBoard } from "./sound.js";
import { GameUi, bindUi, syncHeaderOffset } from "./ui.js";
import {
    clamp,
    getMaxObstaclesCount,
    getRandomSpeed,
    getRandomTarget,
    getRandomYPos,
    quizOptions,
    streakMultiplier,
    toBinary,
    toDecimal,
} from "./utils.js";

export class Game {
    constructor() {
        this.ui = new GameUi(bindUi());
        this.canvas = this.ui.els.canvas;
        this.ctx = this.canvas.getContext("2d");

        this.modeId = loadPlayMode();
        this.difficultyId = loadDifficulty();
        this.difficulty = DIFFICULTIES[this.difficultyId];
        this.cheatsEnabled = loadCheats();
        this.onScreenControls = loadOnScreenControls();
        this.blockSizeId = loadBlockSize();
        this.blockLookId = loadBlockLook();

        this.score = 0;
        this.highScore = this.ui.loadHighScore(this.modeId, this.difficultyId);
        this.streak = 0;
        this.target = getRandomTarget();
        this.paused = true;
        this.helpOpen = true;
        this.hasStarted = false;
        this.obstacles = [];
        this.maxObstacles = 0;
        this.particles = new ParticleSystem();
        this.soundEnabled = localStorage.getItem(SOUND_KEY) !== "off";
        this.sound = new SoundBoard(this.soundEnabled);

        this.touchOriginX = null;
        this.touchStartX = null;
        this.lastFrameTime = 0;
        this.flashUntil = 0;
        this.flashColor = null;
        this.keys = { ArrowLeft: false, ArrowRight: false };

        this.quizLocked = false;
        this.quizTimerId = null;
        this.quizDeadline = null;
        this.quizRemainingMs = null;

        this.player = new GameComponent({
            context: this.ctx,
            text: "mem",
            xPos: 0,
            yPos: 0,
        });
        this.applyBlockStyle(this.player, "player");
    }

    get blockSize() {
        return BLOCK_SIZES[this.blockSizeId] || BLOCK_SIZES.compact;
    }

    get blockLook() {
        return BLOCK_LOOKS[this.blockLookId] || BLOCK_LOOKS.classic;
    }

    get isQuiz() {
        return this.modeId === "quiz";
    }

    get isReverse() {
        return this.modeId === "reverse";
    }

    applyBlockStyle(component, role) {
        const size = this.blockSize;
        const look = this.blockLook[role];
        component.color = look.text;
        component.bgColor = look.fill;
        component.borderColor = look.border;
        component.borderWidth = look.borderWidth;
        component.shadow = look.shadow;
        const sizeRounding =
            role === "player" ? size.playerRounding : size.dropRounding;
        component.rounding =
            look.rounding != null ? look.rounding : sizeRounding;
        if (role === "player") {
            component.padX = size.playerPadX;
            component.padY = size.playerPadY;
        } else {
            component.padX = size.dropPadX;
            component.padY = size.dropPadY;
        }
    }

    playerFont() {
        return `${this.blockSize.playerFont}px ${FONT.family}`;
    }

    dropFont() {
        return `${this.blockSize.dropFont}px ${FONT.family}`;
    }

    settingsPayload() {
        return {
            modeId: this.modeId,
            difficultyId: this.difficultyId,
            cheatsEnabled: this.cheatsEnabled,
            onScreenControls: this.onScreenControls,
            blockSizeId: this.blockSizeId,
            blockLookId: this.blockLookId,
        };
    }

    start() {
        this.ui.syncSettingsForm(this.settingsPayload());
        this.ui.syncSessionActions(false);
        this.applyPresentation();
        this.ui.setScore(this.score);
        this.ui.setHighScore(this.highScore, this.modeId, this.difficultyId);
        this.ui.setStreak(0);
        this.ui.syncSound(this.soundEnabled);

        this.resize();
        this.ctx.font = this.playerFont();
        this.player.measure();
        this.player.xPos = (this.canvas.width - this.player.width) / 2;
        this.clampPlayer();
        this.drawFrame(0, true);

        this.ui.els.playBtn.classList.remove("hidden");
        this.ui.els.pauseBtn.classList.add("hidden");
        this.ui.els.pauseOverlay.classList.add("hidden");

        this.bindEvents();
        requestAnimationFrame((t) => this.loop(t));
    }

    applyPresentation() {
        this.ui.setModeBadge(this.modeId, this.difficultyId);
        this.ui.setTargetDisplay(this.target, this.modeId, this.cheatsEnabled);
        this.ui.setQuizVisible(this.isQuiz);
        this.ui.setMoveControlsVisible(!this.isQuiz && this.onScreenControls);
        this.refreshObstacleCap();
        document.body.classList.toggle("mode-quiz", this.isQuiz);
    }

    refreshObstacleCap() {
        this.maxObstacles = getMaxObstaclesCount(
            this.canvas.width || window.innerWidth,
            this.difficulty.obstacleScale
        );
    }

    bindEvents() {
        const { playBtn, pauseBtn, helpClose, helpOpen, soundBtn, shareBtn } =
            this.ui.els;

        playBtn.addEventListener("click", () => {
            this.sound.ensure();
            this.setPaused(false);
        });
        pauseBtn.addEventListener("click", () => this.setPaused(true));
        this.ui.els.newGameBtn.addEventListener("click", () =>
            this.ui.showNewGameConfirm()
        );
        this.ui.els.newGameCancel.addEventListener("click", () =>
            this.ui.hideNewGameConfirm()
        );
        this.ui.els.newGameConfirm.addEventListener("click", () =>
            this.startNewGame()
        );
        this.ui.els.settingsNewGameBtn.addEventListener("click", () =>
            this.ui.showSettingsNewGameConfirm()
        );
        this.ui.els.settingsNewGameCancel.addEventListener("click", () =>
            this.ui.hideSettingsNewGameConfirm()
        );
        this.ui.els.settingsNewGameConfirm.addEventListener("click", () =>
            this.startNewGame()
        );
        helpClose.addEventListener("click", () => this.closeHelp(true));
        helpOpen.addEventListener("click", () => this.openHelp());
        this.ui.els.howtoOpen.addEventListener("click", () => this.ui.showHowtoPanel());
        this.ui.els.howtoBack.addEventListener("click", () => this.ui.showSettingsPanel());
        soundBtn.addEventListener("click", () => this.toggleSound());
        shareBtn.addEventListener("click", () =>
            this.ui.shareScore(
                this.score,
                this.highScore,
                this.modeId,
                this.difficultyId
            )
        );

        for (const input of this.ui.els.modeInputs) {
            input.addEventListener("change", () => {
                this.ui.updateModeHint(this.ui.getSelectedMode());
            });
        }

        window.addEventListener("resize", () => this.resize());
        window.visualViewport?.addEventListener("resize", () => this.resize());

        this.bindMoveControls();
        this.bindCanvasTouch();

        window.addEventListener("keydown", (e) => this.onKeyDown(e));
        window.addEventListener("keyup", (e) => {
            if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
                this.keys[e.code] = false;
            }
        });
    }

    bindMoveControls() {
        const bindHold = (button, key) => {
            const press = (e) => {
                e.preventDefault();
                if (this.paused || this.helpOpen || this.isQuiz) return;
                this.keys[key] = true;
                button.classList.add("active");
            };
            const release = () => {
                this.keys[key] = false;
                button.classList.remove("active");
            };

            button.addEventListener("pointerdown", press);
            button.addEventListener("pointerup", release);
            button.addEventListener("pointerleave", release);
            button.addEventListener("pointercancel", release);
            button.addEventListener("contextmenu", (e) => e.preventDefault());
        };

        bindHold(this.ui.els.moveLeft, "ArrowLeft");
        bindHold(this.ui.els.moveRight, "ArrowRight");
    }

    bindCanvasTouch() {
        const canvas = this.canvas;

        canvas.addEventListener(
            "touchstart",
            (e) => {
                if (this.helpOpen || this.isQuiz || this.paused) return;
                this.touchOriginX = this.player.xPos;
                this.touchStartX = e.touches[0].clientX;
            },
            { passive: true }
        );
        canvas.addEventListener(
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
        canvas.addEventListener("touchend", clearTouch);
        canvas.addEventListener("touchcancel", clearTouch);
    }

    onKeyDown(e) {
        if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === "Escape") {
            if (this.helpOpen) this.closeHelp(true);
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

        if (
            !this.isQuiz &&
            (e.code === "ArrowLeft" || e.code === "ArrowRight")
        ) {
            this.keys[e.code] = true;
        }
    }

    setPaused(paused) {
        this.paused = paused;
        this.ui.setPaused(paused, this.helpOpen);
        if (paused) {
            this.keys.ArrowLeft = false;
            this.keys.ArrowRight = false;
            this.ui.els.moveLeft.classList.remove("active");
            this.ui.els.moveRight.classList.remove("active");
        }

        if (this.isQuiz) {
            if (paused) this.pauseQuizTimer();
            else if (!this.helpOpen) {
                this.resumeQuizTimer();
                this.ensureQuizRound();
            }
        }
    }

    openHelp() {
        this.helpOpen = true;
        this.clearQuizTimer();
        this.setPaused(true);
        this.ui.syncSettingsForm(this.settingsPayload());
        this.ui.syncSessionActions(this.hasStarted);
        this.ui.openHelp();
    }

    closeHelp(applySettings) {
        this.helpOpen = false;
        this.ui.closeHelp();
        this.sound.ensure();

        if (applySettings) {
            const nextMode = this.ui.getSelectedMode();
            const nextDifficulty = this.ui.getSelectedDifficulty();
            const nextCheats = this.ui.getSelectedCheats();
            const nextControls = this.ui.getSelectedOnScreenControls();
            const nextSize = this.ui.getSelectedBlockSize();
            const nextLook = this.ui.getSelectedBlockLook();
            const modeChanged =
                nextMode !== this.modeId || nextDifficulty !== this.difficultyId;
            const appearanceChanged =
                nextSize !== this.blockSizeId || nextLook !== this.blockLookId;

            this.modeId = nextMode;
            this.difficultyId = nextDifficulty;
            this.difficulty = DIFFICULTIES[this.difficultyId];
            this.cheatsEnabled = nextCheats;
            this.onScreenControls = nextControls;
            this.blockSizeId = nextSize;
            this.blockLookId = nextLook;
            this.ui.persistSettings(this.settingsPayload());

            if (appearanceChanged) {
                this.applyBlockStyle(this.player, "player");
                this.obstacles = [];
                this.clampPlayer();
            }

            if (modeChanged) {
                this.resetRun();
            } else {
                this.applyPresentation();
                if (this.isQuiz) this.nextQuizRound();
            }
        }

        this.hasStarted = true;
        this.ui.syncSessionActions(true);
        this.setPaused(false);
    }

    resetRun() {
        this.score = 0;
        this.highScore = this.ui.loadHighScore(this.modeId, this.difficultyId);
        this.setStreak(0);
        this.obstacles = [];
        this.particles.particles = [];
        this.target = getRandomTarget();
        this.ui.setScore(this.score);
        this.ui.setHighScore(this.highScore, this.modeId, this.difficultyId);
        this.applyPresentation();
        this.clearQuizTimer();
        if (this.isQuiz) this.nextQuizRound();
    }

    startNewGame() {
        this.sound.ensure();
        this.ui.hideNewGameConfirm();
        if (this.helpOpen) this.closeHelp(true);
        this.resetRun();
        this.ui.showToast("Restarted", "correct");
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
        this.ctx.font = this.playerFont();
        this.player.measure();
        const maxX = Math.max(0, this.canvas.width - this.player.width);
        this.player.xPos = clamp(this.player.xPos, 0, maxX);
        this.player.yPos = this.canvas.height - this.player.height - 12;
    }

    resize() {
        const viewport = window.visualViewport;
        this.canvas.width = Math.floor(viewport?.width ?? window.innerWidth);
        this.canvas.height = Math.floor(viewport?.height ?? window.innerHeight);
        this.refreshObstacleCap();
        this.clampPlayer();
        syncHeaderOffset();
        this.drawFrame(0, true);
    }

    updateScore(delta) {
        this.score = Math.max(0, this.score + delta);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.ui.setHighScore(this.highScore, this.modeId, this.difficultyId);
        }
        this.ui.setScore(this.score);
    }

    setStreak(streak) {
        this.streak = streak;
        this.ui.setStreak(streak);
    }

    setNewTarget() {
        this.target = getRandomTarget();
        this.ui.setTargetDisplay(this.target, this.modeId, this.cheatsEnabled);
    }

    speedForScore() {
        const boost = Math.min(this.score / 100, 2);
        return (1 + boost * 0.35) * this.difficulty.speedScale;
    }

    randomX(width) {
        return Math.floor(
            Math.random() * Math.max(1, this.canvas.width - width)
        );
    }

    formatMiss(value) {
        return `${toBinary(value)} = ${value}`;
    }

    spawnObstacles() {
        if (this.isQuiz) return;

        const needed = this.maxObstacles - this.obstacles.length;
        for (let i = 0; i < needed; i++) {
            const value = getRandomTarget();
            const text = this.isReverse ? String(value) : toBinary(value);
            const obstacle = new GameComponent({
                context: this.ctx,
                text,
                xPos: 0,
                yPos: getRandomYPos(),
                moveSpeed: getRandomSpeed(this.speedForScore()),
            });
            this.applyBlockStyle(obstacle, "drop");
            obstacle.value = value;

            this.ctx.font = this.dropFont();
            obstacle.measure();
            obstacle.xPos = this.randomX(obstacle.width);
            this.obstacles.push(obstacle);
        }
    }

    handleCatch(obstacle) {
        const value =
            obstacle.value != null
                ? obstacle.value
                : this.isReverse
                  ? Number(obstacle.text)
                  : toDecimal(obstacle.text);
        this.resolveAnswer(value === this.target, value, obstacle.center);
    }

    resolveAnswer(correct, value, origin = null) {
        const point = origin || {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
        };

        if (correct) {
            this.setStreak(this.streak + 1);
            const points = Math.round(SCORE_STEP * streakMultiplier(this.streak));
            this.updateScore(points);
            this.flashColor = COLORS.hitCorrect;
            this.particles.spawn(point.x, point.y, COLORS.hitCorrect, 16);
            this.sound.correct(this.streak);
            const bonus =
                this.streak > 1
                    ? `  ·  x${streakMultiplier(this.streak).toFixed(1)} streak`
                    : "";
            this.ui.showToast(`+${points}${bonus}`, "correct");
            if (!this.isQuiz) this.setNewTarget();
        } else {
            this.setStreak(0);
            this.updateScore(-SCORE_STEP);
            this.flashColor = COLORS.hitWrong;
            this.particles.spawn(point.x, point.y, COLORS.hitWrong, 10);
            this.sound.wrong();
            this.ui.showToast(this.formatMiss(value), "wrong");
        }

        this.flashUntil = performance.now() + 180;
    }

    ensureQuizRound() {
        if (!this.isQuiz) return;
        if (!this.ui.els.quizChoices.children.length) {
            this.nextQuizRound();
        }
    }

    nextQuizRound() {
        if (!this.isQuiz) return;
        this.quizLocked = false;
        this.clearQuizTimer();
        this.setNewTarget();

        const options = quizOptions(this.target, this.difficulty.quizChoices);
        this.ui.renderQuizChoices(
            options.map((value) => ({ value, text: toBinary(value) })),
            (picked, button) => this.onQuizPick(picked, button)
        );

        this.startQuizTimer();
    }

    startQuizTimer() {
        const seconds = this.difficulty.quizSeconds;
        this.quizRemainingMs = null;
        if (!seconds) {
            this.ui.setQuizTimer(null);
            return;
        }

        this.quizDeadline = performance.now() + seconds * 1000;
        this.ui.setQuizTimer(seconds);
        this.runQuizTimerTicks();
    }

    runQuizTimerTicks() {
        if (this.quizTimerId) {
            clearInterval(this.quizTimerId);
            this.quizTimerId = null;
        }
        this.quizTimerId = setInterval(() => {
            if (this.helpOpen || this.quizLocked || this.paused) return;
            const left = Math.ceil((this.quizDeadline - performance.now()) / 1000);
            if (left <= 0) {
                this.ui.setQuizTimer(0);
                this.onQuizTimeout();
                return;
            }
            this.ui.setQuizTimer(left);
        }, 200);
    }

    pauseQuizTimer() {
        if (!this.quizDeadline) return;
        this.quizRemainingMs = Math.max(0, this.quizDeadline - performance.now());
        if (this.quizTimerId) {
            clearInterval(this.quizTimerId);
            this.quizTimerId = null;
        }
        this.ui.setQuizTimer(Math.ceil(this.quizRemainingMs / 1000));
    }

    resumeQuizTimer() {
        if (this.quizRemainingMs == null) return;
        this.quizDeadline = performance.now() + this.quizRemainingMs;
        this.quizRemainingMs = null;
        this.ui.setQuizTimer(Math.ceil((this.quizDeadline - performance.now()) / 1000));
        this.runQuizTimerTicks();
    }

    clearQuizTimer() {
        if (this.quizTimerId) {
            clearInterval(this.quizTimerId);
            this.quizTimerId = null;
        }
        this.quizDeadline = null;
        this.quizRemainingMs = null;
        this.ui.setQuizTimer(null);
    }

    onQuizTimeout() {
        if (this.quizLocked || this.paused) return;
        this.quizLocked = true;
        this.clearQuizTimer();
        this.ui.lockQuizChoices(this.target, null);
        this.resolveAnswer(false, this.target);
        setTimeout(() => {
            if (this.isQuiz && !this.helpOpen && !this.paused) this.nextQuizRound();
        }, 900);
    }

    onQuizPick(picked, _button) {
        if (this.quizLocked || this.helpOpen || this.paused) return;
        this.quizLocked = true;
        this.clearQuizTimer();
        this.ui.lockQuizChoices(this.target, picked);
        this.resolveAnswer(picked === this.target, picked);
        setTimeout(() => {
            if (this.isQuiz && !this.helpOpen && !this.paused) this.nextQuizRound();
        }, 900);
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

        if (this.isQuiz) {
            if (!this.paused) this.particles.update(deltaSeconds);
            this.particles.draw(ctx);
            return;
        }

        if (!this.paused) {
            if (this.keys.ArrowLeft) player.xPos -= PLAYER_SPEED * deltaSeconds;
            if (this.keys.ArrowRight) player.xPos += PLAYER_SPEED * deltaSeconds;
            this.clampPlayer();
            this.particles.update(deltaSeconds);
        }

        ctx.font = this.playerFont();
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

            ctx.font = this.dropFont();
            for (const obstacle of this.obstacles) {
                obstacle.yPos += obstacle.moveSpeed * deltaSeconds;
                obstacle.render();
            }
            this.obstacles = this.obstacles.filter(
                (o) => o.yPos < canvas.height
            );
        } else {
            ctx.font = this.dropFont();
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
