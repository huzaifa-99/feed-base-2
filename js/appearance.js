export const BLOCK_SIZE_KEY = "feed-base-2-block-size";
export const BLOCK_LOOK_KEY = "feed-base-2-block-look";

/** Small matches the original game; Medium/Large scale up from there. */
export const BLOCK_SIZES = {
    compact: {
        id: "compact",
        label: "Small",
        title: "Small",
        playerFont: 24,
        dropFont: 18,
        playerPadX: 5,
        playerPadY: 5,
        dropPadX: 4,
        dropPadY: 0,
        playerRounding: 0,
        dropRounding: 5,
    },
    cozy: {
        id: "cozy",
        label: "Medium",
        title: "Medium",
        playerFont: 28,
        dropFont: 20,
        playerPadX: 10,
        playerPadY: 7,
        dropPadX: 8,
        dropPadY: 4,
        playerRounding: 0,
        dropRounding: 6,
    },
    large: {
        id: "large",
        label: "Large",
        title: "Large",
        playerFont: 34,
        dropFont: 24,
        playerPadX: 14,
        playerPadY: 9,
        dropPadX: 12,
        dropPadY: 6,
        playerRounding: 0,
        dropRounding: 7,
    },
};

/**
 * Classic matches the original. Other themes vary color, corners, and depth.
 */
export const BLOCK_LOOKS = {
    classic: {
        id: "classic",
        label: "Classic",
        player: {
            text: "#000000",
            fill: "#0e8225",
            border: "#0e8225",
            borderWidth: 0,
            shadow: false,
            rounding: 0,
        },
        drop: {
            text: "#0e8225",
            fill: "#000000",
            border: "#000000",
            borderWidth: 0,
            shadow: false,
        },
    },
    neon: {
        id: "neon",
        label: "Neon",
        player: {
            text: "#04140a",
            fill: "#2ecc71",
            border: "#1e8449",
            borderWidth: 0,
            shadow: true,
            rounding: 10,
        },
        drop: {
            text: "#b8f5c4",
            fill: "#121812",
            border: "#1a2e20",
            borderWidth: 0,
            shadow: true,
            rounding: 10,
        },
    },
    wire: {
        id: "wire",
        label: "Wire",
        player: {
            text: "#b8f5c4",
            fill: "#0a160e",
            border: "#0e8225",
            borderWidth: 2,
            shadow: false,
            rounding: 4,
        },
        drop: {
            text: "#0e8225",
            fill: "#050805",
            border: "#0e8225",
            borderWidth: 2,
            shadow: false,
            rounding: 4,
        },
    },
    inverse: {
        id: "inverse",
        label: "Inverse",
        player: {
            text: "#0e8225",
            fill: "#000000",
            border: "#0e8225",
            borderWidth: 2,
            shadow: false,
            rounding: 0,
        },
        drop: {
            text: "#000000",
            fill: "#0e8225",
            border: "#0e8225",
            borderWidth: 0,
            shadow: false,
            rounding: 5,
        },
    },
    amber: {
        id: "amber",
        label: "Amber",
        player: {
            text: "#1a0f00",
            fill: "#e0a020",
            border: "#a07010",
            borderWidth: 0,
            shadow: true,
            rounding: 6,
        },
        drop: {
            text: "#f0c060",
            fill: "#14100a",
            border: "#5a4010",
            borderWidth: 0,
            shadow: true,
            rounding: 6,
        },
    },
};

export function loadBlockSize() {
    const saved = localStorage.getItem(BLOCK_SIZE_KEY);
    return BLOCK_SIZES[saved] ? saved : "compact";
}

export function loadBlockLook() {
    const saved = localStorage.getItem(BLOCK_LOOK_KEY);
    return BLOCK_LOOKS[saved] ? saved : "classic";
}
