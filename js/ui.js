import { SOUND_KEY, TOAST_MS } from "./constants.js";
import {
    BLOCK_LOOK_KEY,
    BLOCK_LOOKS,
    BLOCK_SIZE_KEY,
    BLOCK_SIZES,
} from "./appearance.js";
import {
    DIFFICULTIES,
    DIFFICULTY_KEY,
    CHEATS_KEY,
    CONTROLS_KEY,
    MODE_KEY,
    PLAY_MODES,
    highScoreKey,
} from "./modes.js";
import { toBinary } from "./utils.js";

export function syncHeaderOffset() {
    const header = document.querySelector("header");
    if (!header) return;
    const height = Math.ceil(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--header-offset", `${height}px`);
}

/** Reads DOM nodes used by the game chrome. */
export function bindUi() {
    const soundBtn = document.getElementById("sound-btn");

    return {
        score: document.getElementById("score"),
        highScore: document.getElementById("high-score"),
        streak: document.getElementById("streak"),
        streakRow: document.getElementById("streak-row"),
        targetHead: document.getElementById("target-head"),
        currentTarget: document.getElementById("current-target"),
        targetHint: document.getElementById("target-hint"),
        modeBadge: document.getElementById("mode-badge"),
        modeHint: document.getElementById("mode-hint"),
        playBtn: document.getElementById("play-btn"),
        pauseBtn: document.getElementById("pause-btn"),
        soundBtn,
        shareBtn: document.getElementById("share-btn"),
        helpDialog: document.getElementById("help-dialog"),
        helpOpen: document.getElementById("help-open"),
        helpClose: document.getElementById("help-close"),
        howtoOpen: document.getElementById("howto-open"),
        howtoBack: document.getElementById("howto-back"),
        settingsPanel: document.getElementById("settings-panel"),
        howtoPanel: document.getElementById("howto-panel"),
        pauseOverlay: document.getElementById("pause-overlay"),
        feedbackToast: document.getElementById("feedback-toast"),
        soundOnIcon: soundBtn.querySelector(".icon-sound-on"),
        soundOffIcon: soundBtn.querySelector(".icon-sound-off"),
        canvas: document.getElementById("game-canvas"),
        quizPanel: document.getElementById("quiz-panel"),
        quizChoices: document.getElementById("quiz-choices"),
        quizTimer: document.getElementById("quiz-timer"),
        moveControls: document.getElementById("move-controls"),
        moveLeft: document.getElementById("move-left"),
        moveRight: document.getElementById("move-right"),
        cheatsToggle: document.getElementById("cheats-toggle"),
        controlsToggle: document.getElementById("controls-toggle"),
        modeInputs: [...document.querySelectorAll('input[name="play-mode"]')],
        difficultyInputs: [
            ...document.querySelectorAll('input[name="difficulty"]'),
        ],
        blockSizeInputs: [
            ...document.querySelectorAll('input[name="block-size"]'),
        ],
        blockLookInputs: [
            ...document.querySelectorAll('input[name="block-look"]'),
        ],
    };
}

export class GameUi {
    constructor(els) {
        this.els = els;
        this.toastTimer = null;
    }

    getSelectedMode() {
        const checked = this.els.modeInputs.find((input) => input.checked);
        return checked?.value || "classic";
    }

    getSelectedDifficulty() {
        const checked = this.els.difficultyInputs.find((input) => input.checked);
        return checked?.value || "normal";
    }

    getSelectedCheats() {
        return Boolean(this.els.cheatsToggle?.checked);
    }

    getSelectedOnScreenControls() {
        return Boolean(this.els.controlsToggle?.checked);
    }

    getSelectedBlockSize() {
        const checked = this.els.blockSizeInputs.find((input) => input.checked);
        const value = checked?.value || "compact";
        return BLOCK_SIZES[value] ? value : "compact";
    }

    getSelectedBlockLook() {
        const checked = this.els.blockLookInputs.find((input) => input.checked);
        const value = checked?.value || "classic";
        return BLOCK_LOOKS[value] ? value : "classic";
    }

    syncSettingsForm({
        modeId,
        difficultyId,
        cheatsEnabled,
        onScreenControls,
        blockSizeId,
        blockLookId,
    }) {
        for (const input of this.els.modeInputs) {
            input.checked = input.value === modeId;
        }
        for (const input of this.els.difficultyInputs) {
            input.checked = input.value === difficultyId;
        }
        for (const input of this.els.blockSizeInputs) {
            input.checked = input.value === blockSizeId;
        }
        for (const input of this.els.blockLookInputs) {
            input.checked = input.value === blockLookId;
        }
        if (this.els.cheatsToggle) {
            this.els.cheatsToggle.checked = Boolean(cheatsEnabled);
        }
        if (this.els.controlsToggle) {
            this.els.controlsToggle.checked = Boolean(onScreenControls);
        }
        this.updateModeHint(modeId);
    }

    updateModeHint(modeId) {
        const mode = PLAY_MODES[modeId] || PLAY_MODES.classic;
        this.els.modeHint.textContent = mode.blurb;
    }

    persistSettings({
        modeId,
        difficultyId,
        cheatsEnabled,
        onScreenControls,
        blockSizeId,
        blockLookId,
    }) {
        localStorage.setItem(MODE_KEY, modeId);
        localStorage.setItem(DIFFICULTY_KEY, difficultyId);
        localStorage.setItem(CHEATS_KEY, cheatsEnabled ? "on" : "off");
        localStorage.setItem(CONTROLS_KEY, onScreenControls ? "on" : "off");
        localStorage.setItem(BLOCK_SIZE_KEY, blockSizeId);
        localStorage.setItem(BLOCK_LOOK_KEY, blockLookId);
    }

    setScore(score) {
        this.els.score.textContent = score;
    }

    loadHighScore(modeId, difficultyId) {
        const key = highScoreKey(modeId, difficultyId);
        let value = Number(localStorage.getItem(key)) || 0;
        // Migrate legacy single high-score into classic/normal once
        if (!value && modeId === "classic" && difficultyId === "normal") {
            value = Number(localStorage.getItem("feed-base-2-high-score")) || 0;
            if (value) localStorage.setItem(key, String(value));
        }
        return value;
    }

    setHighScore(highScore, modeId, difficultyId) {
        this.els.highScore.textContent = highScore;
        localStorage.setItem(highScoreKey(modeId, difficultyId), String(highScore));
    }

    setStreak(streak) {
        this.els.streak.textContent = streak;
        this.els.streakRow.classList.toggle("hidden", streak < 2);
        syncHeaderOffset();
    }

    setTargetDisplay(targetDecimal, modeId, cheatsEnabled = false) {
        const isReverse = modeId === "reverse";
        const prompt = isReverse ? toBinary(targetDecimal) : String(targetDecimal);
        const answer = isReverse ? String(targetDecimal) : toBinary(targetDecimal);

        this.els.targetHead.textContent = "Find";
        this.els.currentTarget.textContent = prompt;

        if (cheatsEnabled) {
            this.els.targetHint.textContent = answer;
            this.els.targetHint.classList.remove("hidden");
        } else {
            this.els.targetHint.textContent = "";
            this.els.targetHint.classList.add("hidden");
        }
        syncHeaderOffset();
    }

    setModeBadge(modeId, difficultyId) {
        const mode = PLAY_MODES[modeId]?.label || modeId;
        const difficulty = DIFFICULTIES[difficultyId]?.label || difficultyId;
        this.els.modeBadge.textContent = `${mode} · ${difficulty}`;
        document.body.classList.toggle("mode-quiz", modeId === "quiz");
        syncHeaderOffset();
    }

    setPaused(paused, helpOpen) {
        this.els.playBtn.classList.toggle("hidden", !paused);
        this.els.pauseBtn.classList.toggle("hidden", paused);
        this.els.pauseOverlay.classList.toggle("hidden", !paused || helpOpen);
        this.els.pauseOverlay.setAttribute(
            "aria-hidden",
            String(!paused || helpOpen)
        );
        document.body.classList.toggle("is-paused", paused && !helpOpen);
    }

    openHelp() {
        this.showSettingsPanel();
        this.els.helpDialog.classList.remove("hidden");
        this.els.pauseOverlay.classList.add("hidden");
    }

    closeHelp() {
        this.els.helpDialog.classList.add("hidden");
        this.showSettingsPanel();
    }

    showSettingsPanel() {
        this.els.settingsPanel.classList.remove("hidden");
        this.els.howtoPanel.classList.add("hidden");
    }

    showHowtoPanel() {
        this.els.settingsPanel.classList.add("hidden");
        this.els.howtoPanel.classList.remove("hidden");
    }

    syncSound(enabled) {
        this.els.soundBtn.setAttribute("aria-pressed", String(enabled));
        this.els.soundBtn.title = enabled ? "Mute sound" : "Unmute sound";
        this.els.soundOnIcon.classList.toggle("hidden", !enabled);
        this.els.soundOffIcon.classList.toggle("hidden", enabled);
        localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
    }

    showToast(message, kind) {
        const toast = this.els.feedbackToast;
        toast.textContent = message;
        toast.classList.remove("hidden", "correct", "wrong", "visible");
        toast.classList.add(kind);
        void toast.offsetWidth;
        toast.classList.add("visible");

        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.classList.remove("visible");
            setTimeout(() => toast.classList.add("hidden"), 180);
        }, TOAST_MS);
    }

    setMoveControlsVisible(visible) {
        this.els.moveControls.classList.toggle("hidden", !visible);
    }

    setQuizVisible(visible) {
        this.els.quizPanel.classList.toggle("hidden", !visible);
    }

    setQuizTimer(secondsLeft) {
        const timer = this.els.quizTimer;
        if (secondsLeft == null) {
            timer.classList.add("hidden");
            timer.textContent = "";
            return;
        }
        timer.classList.remove("hidden");
        timer.classList.toggle("urgent", secondsLeft <= 2);
        timer.textContent = `${secondsLeft}s`;
    }

    renderQuizChoices(labels, onPick) {
        const root = this.els.quizChoices;
        root.innerHTML = "";
        root.classList.toggle("cols-3", labels.length >= 5);

        for (const label of labels) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "quiz-choice";
            button.textContent = label.text;
            button.dataset.value = String(label.value);
            button.addEventListener("click", () => onPick(label.value, button));
            root.appendChild(button);
        }
    }

    lockQuizChoices(correctValue, pickedValue) {
        for (const button of this.els.quizChoices.querySelectorAll(".quiz-choice")) {
            button.disabled = true;
            const value = Number(button.dataset.value);
            if (value === correctValue) button.classList.add("correct");
            if (pickedValue != null && value === pickedValue && value !== correctValue) {
                button.classList.add("wrong");
            }
        }
    }

    async shareScore(score, highScore, modeId, difficultyId) {
        const mode = PLAY_MODES[modeId]?.label || modeId;
        const difficulty = DIFFICULTIES[difficultyId]?.label || difficultyId;
        const text = `I scored ${score} on FeedBase2 (${mode} · ${difficulty}, best ${highScore})!`;
        const url = window.location.href;
        const payload = `${text}\n${url}`;

        // Web Share works best as a single text blob on many mobile browsers
        if (navigator.share) {
            try {
                const data = { title: "FeedBase2", text: payload };
                if (!navigator.canShare || navigator.canShare(data)) {
                    await navigator.share(data);
                    return;
                }
            } catch (err) {
                if (err && err.name === "AbortError") return;
                // Fall through to clipboard / manual copy
            }
        }

        if (await this.copyText(payload)) {
            this.showToast("Score copied", "correct");
            return;
        }

        this.showToast("Sharing needs HTTPS (or localhost)", "wrong");
    }

    async copyText(value) {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(value);
                return true;
            } catch {
                // try legacy path below
            }
        }

        try {
            const field = document.createElement("textarea");
            field.value = value;
            field.setAttribute("readonly", "");
            field.style.position = "fixed";
            field.style.opacity = "0";
            field.style.pointerEvents = "none";
            document.body.appendChild(field);
            field.focus();
            field.select();
            field.setSelectionRange(0, field.value.length);
            const ok = document.execCommand("copy");
            document.body.removeChild(field);
            return ok;
        } catch {
            return false;
        }
    }
}
