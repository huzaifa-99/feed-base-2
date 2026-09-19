export const PLAY_MODES = {
    classic: {
        id: "classic",
        label: "Classic",
        blurb: "Find a decimal - catch its binary",
    },
    reverse: {
        id: "reverse",
        label: "Reverse",
        blurb: "Find a binary - catch its decimal",
    },
    quiz: {
        id: "quiz",
        label: "Quiz",
        blurb: "Pick the matching value from choices",
    },
};

export const DIFFICULTIES = {
    easy: {
        id: "easy",
        label: "Easy",
        speedScale: 0.65,
        obstacleScale: 0.55,
        quizChoices: 3,
        quizSeconds: null,
    },
    normal: {
        id: "normal",
        label: "Normal",
        speedScale: 1,
        obstacleScale: 1,
        quizChoices: 4,
        quizSeconds: null,
    },
    hard: {
        id: "hard",
        label: "Hard",
        speedScale: 1.45,
        obstacleScale: 1.35,
        quizChoices: 6,
        quizSeconds: 7,
    },
};

export const MODE_KEY = "feed-base-2-mode";
export const DIFFICULTY_KEY = "feed-base-2-difficulty";
export const CHEATS_KEY = "feed-base-2-cheats";
export const CONTROLS_KEY = "feed-base-2-onscreen-controls";

export function highScoreKey(modeId, difficultyId) {
    return `feed-base-2-hs-${modeId}-${difficultyId}`;
}

export function loadPlayMode() {
    const saved = localStorage.getItem(MODE_KEY);
    return PLAY_MODES[saved] ? saved : "classic";
}

export function loadDifficulty() {
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    return DIFFICULTIES[saved] ? saved : "normal";
}

export function loadCheats() {
    return localStorage.getItem(CHEATS_KEY) === "on";
}

/** Touch-primary UI: no hover and/or coarse pointer (phones/tablets). */
export function prefersTouchUi() {
    return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

export function loadOnScreenControls() {
    const saved = localStorage.getItem(CONTROLS_KEY);
    if (saved === "on") return true;
    if (saved === "off") return false;
    return prefersTouchUi();
}
