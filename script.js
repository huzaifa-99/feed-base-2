const COLORS = {
    primaryColor: "#0e8225",
    secondaryColor: "#1a1717",
    blackColor: "#000000",
    whiteColor: "#ffffff",
    grayColor: "#282b28",
    hitCorrect: "#2ecc71",
    hitWrong: "#c0392b",
};
const FONT = {
    family: "Inconsolata, monospace",
    large: "24px",
    small: "18px",
};
const MIN_SPEED = 80; // px per second
const MAX_SPEED = 280;
const PLAYER_SPEED = 420; // px per second
const SCORE_STEP = 10;
const HIGH_SCORE_KEY = "feed-base-2-high-score";

const toBinary = (n) => n.toString(2).padStart(4, "0");
const toDecimal = (binary) => parseInt(binary, 2);
const getRandomBinary = () => toBinary(Math.floor(Math.random() * 16));
const getRandomTarget = () => Math.floor(Math.random() * 16);
const getRandomYPos = () => Math.floor(Math.random() * 20);
const getRandomSpeed = () =>
    MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
const getMaxObstaclesCount = (width) => {
    if (width < 640) return 6;
    if (width < 1024) return 12;
    return 24;
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Draws a filled/stroked rounded rectangle.
 */
function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
    const cornerRadius = {
        upperLeft: 0,
        upperRight: 0,
        lowerLeft: 0,
        lowerRight: 0,
    };
    if (typeof stroke === "undefined") {
        stroke = true;
    }
    if (typeof radius === "object") {
        for (const side in radius) {
            cornerRadius[side] = radius[side];
        }
    }

    ctx.beginPath();
    ctx.moveTo(x + cornerRadius.upperLeft, y);
    ctx.lineTo(x + width - cornerRadius.upperRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
    ctx.lineTo(x + width, y + height - cornerRadius.lowerRight);
    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - cornerRadius.lowerRight,
        y + height
    );
    ctx.lineTo(x + cornerRadius.lowerLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
    ctx.lineTo(x, y + cornerRadius.upperLeft);
    ctx.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
    ctx.closePath();
    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }
}

class GameComponent {
    constructor({
        context,
        width,
        height,
        text,
        color,
        bgColor,
        xPos,
        xPadding,
        yPos,
        moveSpeed,
        rounding,
    }) {
        this.id = Math.random().toString(36).slice(2);
        this.context = context;
        this.width = width || 0;
        this.height = height || 0;
        this.text = text;
        this.color = color;
        this.bgColor = bgColor;
        this.xPos = xPos;
        this.xPadding = xPadding || 0;
        this.yPos = yPos;
        this.moveSpeed = moveSpeed || 0;
        this.rounding = rounding || 0;
    }

    get bounds() {
        return {
            left: this.xPos,
            right: this.xPos + this.width + this.xPadding,
            top: this.yPos,
            bottom: this.yPos + this.height,
        };
    }

    render() {
        if (this.text) {
            const textInfo = this.context.measureText(this.text);
            const fontSize = parseFloat(this.context.font) || 10;
            const width = textInfo.width;

            this.width = Math.floor(Math.max(this.width, width));
            this.height = Math.floor(Math.max(this.height, fontSize));
            this.context.fillStyle = this.bgColor;
        }

        if (this.rounding > 0) {
            drawRoundRect(
                this.context,
                this.xPos,
                this.yPos,
                this.width + this.xPadding,
                this.height,
                {
                    upperLeft: this.rounding,
                    upperRight: this.rounding,
                    lowerLeft: this.rounding,
                    lowerRight: this.rounding,
                },
                true,
                true
            );
        } else {
            this.context.fillRect(
                this.xPos,
                this.yPos,
                this.width + this.xPadding,
                this.height
            );
        }

        if (this.text) {
            this.context.fillStyle = this.color;
            this.context.textAlign = "center";
            this.context.textBaseline = "middle";
            this.context.fillText(
                this.text,
                this.xPos + (this.width + this.xPadding) / 2,
                this.yPos + this.height / 2
            );
        }
    }

    doesCrash(gameComponent) {
        const a = this.bounds;
        const b = gameComponent.bounds;
        return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    let score = 0;
    let highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    let target = getRandomTarget();
    let paused = true;
    let helpDialogIsOpen = true;
    let obstacles = [];
    let maxObstacles = getMaxObstaclesCount(document.body.clientWidth);
    let touchOriginX = null;
    let touchStartX = null;
    let lastFrameTime = 0;
    let flashUntil = 0;
    let flashColor = null;
    const keys = {
        ArrowLeft: false,
        ArrowRight: false,
    };

    const canvas = document.getElementById("game-canvas");
    const context = canvas.getContext("2d");
    const scoreContainer = document.getElementById("score");
    const highScoreContainer = document.getElementById("high-score");
    const currentTargetContainer = document.getElementById("current-target");
    const playBtn = document.getElementById("play-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const helpDialog = document.getElementById("help-dialog");
    const helpOpen = document.getElementById("help-open");
    const helpClose = document.getElementById("help-close");
    const pauseOverlay = document.getElementById("pause-overlay");

    const player = new GameComponent({
        context,
        width: 50,
        height: 40,
        text: "mem",
        color: COLORS.blackColor,
        bgColor: COLORS.primaryColor,
        xPos: 0,
        xPadding: 10,
        yPos: 0,
    });

    function playerMaxX() {
        return canvas.width - player.width - player.xPadding;
    }

    function clampPlayer() {
        player.xPos = clamp(player.xPos, 0, playerMaxX());
        player.yPos = canvas.height - player.height - 10;
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        maxObstacles = getMaxObstaclesCount(canvas.width);
        clampPlayer();
        drawFrame(0, true);
    }

    function setPaused(nextPaused) {
        paused = nextPaused;
        playBtn.classList.toggle("hidden", !paused);
        pauseBtn.classList.toggle("hidden", paused);
        pauseOverlay.classList.toggle("hidden", !paused || helpDialogIsOpen);
    }

    function openHelp() {
        helpDialogIsOpen = true;
        setPaused(true);
        helpDialog.classList.remove("hidden");
        pauseOverlay.classList.add("hidden");
    }

    function closeHelp() {
        helpDialogIsOpen = false;
        helpDialog.classList.add("hidden");
        setPaused(false);
    }

    function updateScore(delta) {
        score = Math.max(0, score + delta);
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
            highScoreContainer.textContent = highScore;
        }
        scoreContainer.textContent = score;
    }

    function setNewTarget() {
        target = getRandomTarget();
        currentTargetContainer.textContent = target;
    }

    function getRandomXPos(width) {
        return Math.floor(Math.random() * Math.max(1, canvas.width - width));
    }

    function speedForScore() {
        const boost = Math.min(score / 100, 2);
        return 1 + boost * 0.35;
    }

    function spawnObstacles() {
        const needed = maxObstacles - obstacles.length;
        for (let i = 0; i < needed; i++) {
            const binary = getRandomBinary();
            const obstacle = new GameComponent({
                context,
                text: binary,
                color: COLORS.primaryColor,
                bgColor: COLORS.blackColor,
                xPos: 0,
                xPadding: 8,
                yPos: getRandomYPos(),
                moveSpeed: getRandomSpeed() * speedForScore(),
                rounding: 5,
            });
            // Measure once so spawn X stays on-screen
            context.font = `${FONT.small} ${FONT.family}`;
            const measured = context.measureText(binary).width;
            obstacle.width = Math.ceil(measured);
            obstacle.height = 18;
            obstacle.xPos = getRandomXPos(obstacle.width + obstacle.xPadding);
            obstacles.push(obstacle);
        }
    }

    function drawFrame(deltaSeconds, forceDraw = false) {
        if (paused && !forceDraw) return;

        context.clearRect(0, 0, canvas.width, canvas.height);

        if (flashUntil > performance.now()) {
            context.fillStyle = flashColor;
            context.globalAlpha = 0.18;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1;
        }

        if (!paused) {
            if (keys.ArrowLeft) player.xPos -= PLAYER_SPEED * deltaSeconds;
            if (keys.ArrowRight) player.xPos += PLAYER_SPEED * deltaSeconds;
            clampPlayer();
        }

        context.font = `${FONT.large} ${FONT.family}`;
        context.fillStyle = player.bgColor;
        player.render();

        if (!paused) {
            const remaining = [];
            for (const obstacle of obstacles) {
                if (player.doesCrash(obstacle)) {
                    const decimal = toDecimal(obstacle.text);
                    if (decimal === target) {
                        updateScore(SCORE_STEP);
                        setNewTarget();
                        flashColor = COLORS.hitCorrect;
                    } else {
                        updateScore(-SCORE_STEP);
                        flashColor = COLORS.hitWrong;
                    }
                    flashUntil = performance.now() + 180;
                    continue;
                }
                remaining.push(obstacle);
            }
            obstacles = remaining;

            spawnObstacles();

            context.font = `${FONT.small} ${FONT.family}`;
            for (const obstacle of obstacles) {
                obstacle.yPos += obstacle.moveSpeed * deltaSeconds;
                obstacle.render();
            }

            obstacles = obstacles.filter((o) => o.yPos < canvas.height);
        } else {
            context.font = `${FONT.small} ${FONT.family}`;
            for (const obstacle of obstacles) {
                obstacle.render();
            }
        }
    }

    function gameLoop(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const deltaSeconds = Math.min((timestamp - lastFrameTime) / 1000, 0.05);
        lastFrameTime = timestamp;
        drawFrame(deltaSeconds);
        requestAnimationFrame(gameLoop);
    }

    // Initial UI
    context.font = `${FONT.large} ${FONT.family}`;
    currentTargetContainer.textContent = target;
    scoreContainer.textContent = score;
    highScoreContainer.textContent = highScore;
    resizeCanvas();
    player.xPos = (canvas.width - player.width - player.xPadding) / 2;
    clampPlayer();
    drawFrame(0, true);
    // Help starts open: paused, no pause overlay, Play visible
    playBtn.classList.remove("hidden");
    pauseBtn.classList.add("hidden");
    pauseOverlay.classList.add("hidden");

    playBtn.addEventListener("click", () => setPaused(false));
    pauseBtn.addEventListener("click", () => setPaused(true));
    helpClose.addEventListener("click", closeHelp);
    helpOpen.addEventListener("click", openHelp);
    window.addEventListener("resize", resizeCanvas);

    document.addEventListener(
        "touchstart",
        (e) => {
            touchOriginX = player.xPos;
            touchStartX = e.touches[0].clientX;
        },
        { passive: true }
    );
    document.addEventListener(
        "touchmove",
        (e) => {
            if (touchOriginX === null || touchStartX === null) return;
            player.xPos = touchOriginX + (e.touches[0].clientX - touchStartX);
            clampPlayer();
        },
        { passive: true }
    );
    const clearTouch = () => {
        touchOriginX = null;
        touchStartX = null;
    };
    document.addEventListener("touchend", clearTouch);
    document.addEventListener("touchcancel", clearTouch);

    window.addEventListener("keydown", (e) => {
        if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === "Escape") {
            if (helpDialogIsOpen) closeHelp();
            else openHelp();
            return;
        }

        if (e.code === "Space" && !helpDialogIsOpen) {
            setPaused(!paused);
            return;
        }

        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
            keys[e.code] = true;
        }
    });

    window.addEventListener("keyup", (e) => {
        if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
            keys[e.code] = false;
        }
    });

    requestAnimationFrame(gameLoop);
});
