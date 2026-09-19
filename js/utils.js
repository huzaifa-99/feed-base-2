import { MIN_SPEED, MAX_SPEED } from "./constants.js";

export const toBinary = (n) => n.toString(2).padStart(4, "0");
export const toDecimal = (binary) => parseInt(binary, 2);
export const getRandomBinary = () => toBinary(Math.floor(Math.random() * 16));
export const getRandomTarget = () => Math.floor(Math.random() * 16);
export const getRandomYPos = () => Math.floor(Math.random() * 20);
export const getRandomSpeed = () =>
    MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);

export const getMaxObstaclesCount = (width) => {
    if (width < 640) return 6;
    if (width < 1024) return 12;
    return 24;
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const streakMultiplier = (streak) =>
    Math.min(1 + Math.max(0, streak - 1) * 0.5, 4);
