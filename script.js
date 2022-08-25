// constants
const DECIMAL_TO_BINARY = {
    0: "0000",
    1: "0001",
    2: "0010",
    3: "0011",
    4: "0100",
    5: "0101",
    6: "0110",
    7: "0111",
    8: "1000",
    9: "1001",
    10: "1010",
    11: "1011",
    12: "1100",
    13: "1101",
    14: "1110",
    15: "1111",
};
const BINARY_TO_DECIMAL = {
    "0000": "0",
    "0001": "1",
    "0010": "2",
    "0011": "3",
    "0100": "4",
    "0101": "5",
    "0110": "6",
    "0111": "7",
    1000: "8",
    1001: "9",
    1010: "10",
    1011: "11",
    1100: "12",
    1101: "13",
    1110: "14",
    1111: "15",
};
const COLORS = {
    primaryColor: "#0e8225",
    secondaryColor: "#1a1717",
    blackColor: "#000000",
    whiteColor: "#ffffff",
    grayColor: "#282b28",
};
const FONT = {
    family: "Consolas",
    unit: "pt",
    large: "24pt",
    small: "18pt",
};
const MIN_SPEED = 2;
const MAX_SPEED = 12;
const PLAYER_SPEED = 40;

// helpers
const getRandomBinary = () => DECIMAL_TO_BINARY[Math.floor(Math.random() * 16)];
const getRandomXPos = () => Math.floor(Math.random() * window.innerWidth);
const getRandomYPos = () => Math.floor(Math.random() * 20);
const getRandomSpeed = () =>
    Math.floor(Math.random() * (MIN_SPEED - MAX_SPEED)) + MAX_SPEED;
const getMaxObstaclesCount = (width) => {
    if (width < 640) return 6;
    if (width < 1024) return 12;
    return 24;
};

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Object} radius All corner radii. Defaults to 0,0,0,0;
 * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
 * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
 */
CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius,
    fill,
    stroke
) {
    var cornerRadius = {
        upperLeft: 0,
        upperRight: 0,
        lowerLeft: 0,
        lowerRight: 0,
    };
    if (typeof stroke == "undefined") {
        stroke = true;
    }
    if (typeof radius === "object") {
        for (var side in radius) {
            cornerRadius[side] = radius[side];
        }
    }

    this.beginPath();
    this.moveTo(x + cornerRadius.upperLeft, y);
    this.lineTo(x + width - cornerRadius.upperRight, y);
    this.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
    this.lineTo(x + width, y + height - cornerRadius.lowerRight);
    this.quadraticCurveTo(
        x + width,
        y + height,
        x + width - cornerRadius.lowerRight,
        y + height
    );
    this.lineTo(x + cornerRadius.lowerLeft, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
    this.lineTo(x, y + cornerRadius.upperLeft);
    this.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
    this.closePath();
    if (stroke) {
        this.stroke();
    }
    if (fill) {
        this.fill();
    }
};

/**
 * Draws a game component on the canvas.
 * @param {Object} context The canvas context
 * @param {Number} width The width of the component
 * @param {Number} height The height of the component
 * @param {String} text The text string of the component
 * @param {String} color The text color of the component
 * @param {String} bgColor The background color of the component
 * @param {Number} xPos The top left x coordinate
 * @param {Number} xPadding Padding of component along x-axis
 * @param {Number} yPos The top left y coordinate
 * @param {Number} moveSpeed Movement speed of the component
 * @param {Number} rounding Border radius of the component
 */
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
        this.id = Math.floor(Math.random() * 2467853784559);
        this.context = context;
        this.width = width;
        this.height = height;
        this.text = text;
        this.color = color;
        this.bgColor = bgColor;
        this.xPos = xPos;
        this.xPadding = xPadding || 0;
        this.yPos = yPos;
        this.moveSpeed = moveSpeed;
        this.rounding = rounding;
    }

    render() {
        // make component with text
        if (this.text) {
            // calc text dimensions
            const textInfo = this.context.measureText(this.text);
            const height = this.context.font.match(/\d+/).pop() || 10;
            const width = textInfo.width;

            // set component dimensions
            this.width = Math.floor(width < this.width ? this.width : width);
            this.height = Math.floor(height < this.height ? this.height : height);

            // set component background
            this.context.fillStyle = this.bgColor;
        }

        // make round corners
        if (this.rounding > 0) {
            this.context.roundRect(
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
            // make sharp corners
            this.context.fillRect(
                this.xPos,
                this.yPos,
                this.width + this.xPadding,
                this.height
            );
        }

        // add text to component
        if (this.text) {
            this.context.fillStyle = this.color;
            this.context.textBaseline = "top";
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
        let hasCrashed = false;

        const myCoordinates = {
            left: this.xPos,
            right: this.xPos + this.width,
            top: this.yPos,
            bottom: this.yPos + this.height,
        };

        const otherCoordinates = {
            left: gameComponent.xPos,
            right: gameComponent.xPos + gameComponent.width,
            top: gameComponent.yPos,
            bottom: gameComponent.yPos + gameComponent.height,
        };

        if (
            ((otherCoordinates.left >= myCoordinates.left &&
                otherCoordinates.left <= myCoordinates.right) ||
                (otherCoordinates.right <= myCoordinates.right &&
                    otherCoordinates.right >= myCoordinates.left)) &&
            otherCoordinates.bottom >= myCoordinates.top &&
            otherCoordinates.bottom <= myCoordinates.bottom
        ) {
            hasCrashed = true;
        }

        return hasCrashed;
    }
}

window.onload = function () {
    const browserWidth = document.body.clientWidth;
    let score = 0;
    let target = Math.floor(Math.random() * 2467853784559).toString();
    let currentTargetIndex = 0;
    let paused = true;
    let obstacles = [];
    let maxObstacles = getMaxObstaclesCount(browserWidth);
    let touchCoordinates = null;
    let touchStartCoordinates = null;

    // get html elements
    const canvas = document.getElementById("game-canvas");
    const context = canvas.getContext("2d");
    const scoreContainer = document.getElementById("score");
    const currentTargetContainer = document.getElementById("current-target");
    const playBtn = document.getElementById("play-btn");
    const pauseBtn = document.getElementById("pause-btn");

    // update ui
    context.font = `${FONT.large} ${FONT.family}`;
    currentTargetContainer.innerHTML = target[currentTargetIndex];
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    // add player to canvas
    const player = new GameComponent({
        context,
        width: 50,
        height: 40,
        text: "mem",
        color: COLORS.blackColor,
        bgColor: COLORS.primaryColor,
        xPos: canvas.width / 2 - 75 / 2,
        xPadding: 10,
        yPos: canvas.height - (40 + 10),
    });
    player.render();

    // attach event listeners
    playBtn.classList.add("hidden");
    playBtn.addEventListener("click", function () {
        paused = false;
        pauseBtn.classList.remove("hidden");
        this.classList.add("hidden");
    });
    pauseBtn.addEventListener("click", function () {
        paused = true;
        playBtn.classList.remove("hidden");
        this.classList.add("hidden");
    });
    document.addEventListener(
        "touchstart",
        (e) => {
            touchCoordinates = player.xPos;
            touchStartCoordinates = e.touches[0].clientX;
        },
        true
    );
    document.addEventListener(
        "touchmove",
        (e) => {
            if (touchCoordinates && e.touches[0].clientX && touchStartCoordinates) {
                player.xPos =
                    touchCoordinates + (e.touches[0].clientX - touchStartCoordinates);
            }
        },
        true
    );
    document.addEventListener(
        "touchend",
        () => {
            touchCoordinates = null;
            touchStartCoordinates = null;
        },
        true
    );
    document.addEventListener(
        "touchcancel",
        () => {
            touchCoordinates = null;
            touchStartCoordinates = null;
        },
        true
    );
    window.addEventListener("keydown", (e) => {
        // ignore up/down arrow deys
        if (["ArrowUp", "ArrowDown"].includes(e.code)) {
            e.preventDefault();
        }

        // play/pause the game
        if (e.code === "Space") {
            paused = !paused;
            if (paused) {
                playBtn.classList.remove("hidden");
                pauseBtn.classList.add("hidden");
            }
            if (!paused) {
                playBtn.classList.add("hidden");
                pauseBtn.classList.remove("hidden");
            }
        }

        // return if the game is paused
        if (paused) return;

        // change player position on x-axis
        if (
            e.code === "ArrowRight" &&
            player.xPos <= window.innerWidth - player.width / 2
        ) {
            player.xPos += PLAYER_SPEED;
        }
        if (e.code === "ArrowLeft" && player.xPos >= 0) {
            player.xPos -= PLAYER_SPEED;
        }
    });

    function refreshFrame() {
        if (paused) return;

        // clear canvas and apply styling
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = `${FONT.large} ${FONT.family}`;

        player.render();

        // check if the player hits any obstacles
        let _tempObstacles = [...obstacles];
        _tempObstacles.map((x) => {
            if (player.doesCrash(x)) {
                // remove the hit target obstacle
                obstacles = [...obstacles].filter((y) => y.id !== x.id);

                // get decimal of hit obstacle binary
                const decimal = BINARY_TO_DECIMAL[x.text];

                if (decimal.toString() === target[currentTargetIndex]) {
                    // increment score if the hit target was correct
                    score += 10;

                    // update target number if half target is complete
                    if (currentTargetIndex > target.length / 2) {
                        target = Math.floor(Math.random() * 2467853784559).toString();
                        currentTargetIndex = 0;
                    }

                    // move to next target number
                    currentTargetIndex += 1;
                    currentTargetContainer.innerHTML = target[currentTargetIndex];
                } else {
                    score -= 10;
                }

                // update ui with score
                scoreContainer.innerHTML = score;
            }
        });

        // create obstacles
        const requiredObstacles = maxObstacles - obstacles.length;
        for (let i = 0; i < requiredObstacles; i++) {
            obstacles.push(
                new GameComponent({
                    context,
                    text: getRandomBinary(),
                    color: COLORS.primaryColor,
                    bgColor: COLORS.blackColor,
                    xPos: getRandomXPos(),
                    xPadding: 2,
                    yPos: getRandomYPos(),
                    moveSpeed: getRandomSpeed(),
                    rounding: 5,
                })
            );
        }

        // move obstacles
        context.font = `${FONT.small} ${FONT.family}`;
        obstacles.map((x) => {
            x.yPos += x.moveSpeed;
            x.render();
        });

        // remove obstacles that are off canvas
        obstacles = obstacles.filter((x) => x.yPos < canvas.height);
    }

    // game loop
    setInterval(refreshFrame, 20);
};
