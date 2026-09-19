import { drawRoundRect } from "./draw.js";

export class GameComponent {
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

    get center() {
        return {
            x: this.xPos + (this.width + this.xPadding) / 2,
            y: this.yPos + this.height / 2,
        };
    }

    render() {
        if (this.text) {
            const textInfo = this.context.measureText(this.text);
            const fontSize = parseFloat(this.context.font) || 10;

            this.width = Math.floor(Math.max(this.width, textInfo.width));
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

    doesCrash(other) {
        const a = this.bounds;
        const b = other.bounds;
        return (
            a.left < b.right &&
            a.right > b.left &&
            a.top < b.bottom &&
            a.bottom > b.top
        );
    }
}
