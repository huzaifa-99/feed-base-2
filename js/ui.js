import { HIGH_SCORE_KEY, SOUND_KEY, TOAST_MS } from "./constants.js";

/** Reads DOM nodes used by the game chrome. */
export function bindUi() {
    const soundBtn = document.getElementById("sound-btn");

    return {
        score: document.getElementById("score"),
        highScore: document.getElementById("high-score"),
        streak: document.getElementById("streak"),
        streakRow: document.getElementById("streak-row"),
        currentTarget: document.getElementById("current-target"),
        playBtn: document.getElementById("play-btn"),
        pauseBtn: document.getElementById("pause-btn"),
        soundBtn,
        shareBtn: document.getElementById("share-btn"),
        helpDialog: document.getElementById("help-dialog"),
        helpOpen: document.getElementById("help-open"),
        helpClose: document.getElementById("help-close"),
        pauseOverlay: document.getElementById("pause-overlay"),
        feedbackToast: document.getElementById("feedback-toast"),
        soundOnIcon: soundBtn.querySelector(".icon-sound-on"),
        soundOffIcon: soundBtn.querySelector(".icon-sound-off"),
        canvas: document.getElementById("game-canvas"),
    };
}

export class GameUi {
    constructor(els) {
        this.els = els;
        this.toastTimer = null;
    }

    setScore(score) {
        this.els.score.textContent = score;
    }

    setHighScore(highScore) {
        this.els.highScore.textContent = highScore;
        localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
    }

    setStreak(streak) {
        this.els.streak.textContent = streak;
        this.els.streakRow.classList.toggle("hidden", streak < 2);
    }

    setTarget(target) {
        this.els.currentTarget.textContent = target;
    }

    setPaused(paused, helpOpen) {
        this.els.playBtn.classList.toggle("hidden", !paused);
        this.els.pauseBtn.classList.toggle("hidden", paused);
        this.els.pauseOverlay.classList.toggle("hidden", !paused || helpOpen);
        this.els.pauseOverlay.setAttribute(
            "aria-hidden",
            String(!paused || helpOpen)
        );
    }

    openHelp() {
        this.els.helpDialog.classList.remove("hidden");
        this.els.pauseOverlay.classList.add("hidden");
    }

    closeHelp() {
        this.els.helpDialog.classList.add("hidden");
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

    async shareScore(score, highScore) {
        const text = `I scored ${score} on Feed Base-2 (best ${highScore}) - catch binary for decimals 0–15!`;
        const url = window.location.href;

        try {
            if (navigator.share) {
                await navigator.share({ title: "Feed Base-2", text, url });
                return;
            }
        } catch (err) {
            if (err && err.name === "AbortError") return;
        }

        try {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            this.showToast("Score copied", "correct");
        } catch {
            this.showToast("Could not share score", "wrong");
        }
    }
}
