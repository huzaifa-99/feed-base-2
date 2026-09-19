import { Game } from "./game.js";
import { syncHeaderOffset } from "./ui.js";

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch((err) => {
            console.warn("Service worker registration failed:", err);
        });
    });
}

function revealApp() {
    const root = document.documentElement;
    root.classList.remove("booting");
    root.classList.add("is-ready");
}

async function boot() {
    syncHeaderOffset();
    window.addEventListener("resize", syncHeaderOffset);
    window.visualViewport?.addEventListener("resize", syncHeaderOffset);
    window.visualViewport?.addEventListener("scroll", syncHeaderOffset);

    const game = new Game();
    game.start();
    requestAnimationFrame(syncHeaderOffset);

    try {
        if (document.fonts?.ready) {
            await Promise.race([
                document.fonts.ready,
                new Promise((resolve) => setTimeout(resolve, 800)),
            ]);
        }
    } catch {
        /* ignore font wait failures */
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(revealApp);
    });

    registerServiceWorker();
}

boot();
