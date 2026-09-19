/** Draws a filled/stroked rounded rectangle. */
export function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
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

    if (stroke) ctx.stroke();
    if (fill) ctx.fill();
}
