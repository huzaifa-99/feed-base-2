import { MIN_SPEED, MAX_SPEED } from "./constants.js";

export const toBinary = (n) => n.toString(2).padStart(4, "0");
export const toDecimal = (binary) => parseInt(binary, 2);
export const getRandomBinary = () => toBinary(Math.floor(Math.random() * 16));
export const getRandomTarget = () => Math.floor(Math.random() * 16);
export const getRandomYPos = () => Math.floor(Math.random() * 20);

export const getRandomSpeed = (speedScale = 1) => {
    const min = MIN_SPEED * speedScale;
    const max = MAX_SPEED * speedScale;
    return min + Math.random() * (max - min);
};

export const getMaxObstaclesCount = (width, obstacleScale = 1) => {
    let base = 24;
    if (width < 640) base = 6;
    else if (width < 1024) base = 12;
    return Math.max(3, Math.round(base * obstacleScale));
};

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const streakMultiplier = (streak) =>
    Math.min(1 + Math.max(0, streak - 1) * 0.5, 4);

/** Build a shuffled list of unique 0–15 values including the answer. */
export function quizOptions(answer, count) {
    const set = new Set([answer]);
    while (set.size < Math.min(count, 16)) {
        set.add(Math.floor(Math.random() * 16));
    }
    return [...set].sort(() => Math.random() - 0.5);
}
