import { drawRoundRect } from "./draw.js";

export class GameComponent {
    constructor({
        context,
        width,
        height,
        text,
        color,
        bgColor,
        borderColor,
        borderWidth,
        shadow,
        xPos,
        padX,
        padY,
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
        this.borderColor = borderColor || null;
        this.borderWidth = borderWidth || 0;
        this.shadow = Boolean(shadow);
        this.xPos = xPos;
        this.padX = padX ?? 0;
        this.padY = padY ?? 0;
        // legacy alias used by older clamp math
        this.xPadding = 0;
        this.yPos = yPos;
        this.moveSpeed = moveSpeed || 0;
        this.rounding = rounding || 0;
    }

    get bounds() {
        return {
            left: this.xPos,
            right: this.xPos + this.width,
            top: this.yPos,
            bottom: this.yPos + this.height,
        };
    }

    get center() {
        return {
            x: this.xPos + this.width / 2,
            y: this.yPos + this.height / 2,
        };
    }

    measure() {
        if (!this.text) return;
        const textInfo = this.context.measureText(this.text);
        const fontSize = parseFloat(this.context.font) || 10;
        this.width = Math.ceil(textInfo.width + this.padX * 2);
        this.height = Math.ceil(fontSize + this.padY * 2);
    }

    render() {
        this.measure();
        const ctx = this.context;
        const radius = Math.min(this.rounding, this.height / 2, this.width / 2);

        if (this.shadow) {
            ctx.save();
            ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 3;
        }

        ctx.fillStyle = this.bgColor;
        ctx.strokeStyle = this.borderColor || this.bgColor;
        ctx.lineWidth = this.borderWidth;

        if (radius > 0) {
            drawRoundRect(
                ctx,
                this.xPos,
                this.yPos,
                this.width,
                this.height,
                {
                    upperLeft: radius,
                    upperRight: radius,
                    lowerLeft: radius,
                    lowerRight: radius,
                },
                true,
                this.borderWidth > 0
            );
        } else {
            ctx.fillRect(this.xPos, this.yPos, this.width, this.height);
            if (this.borderWidth > 0) {
                ctx.strokeRect(
                    this.xPos + this.borderWidth / 2,
                    this.yPos + this.borderWidth / 2,
                    this.width - this.borderWidth,
                    this.height - this.borderWidth
                );
            }
        }

        if (this.shadow) ctx.restore();

        if (this.text) {
            ctx.fillStyle = this.color;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                this.text,
                this.xPos + this.width / 2,
                this.yPos + this.height / 2 + 1
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
