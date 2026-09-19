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

syncHeaderOffset();
window.addEventListener("resize", syncHeaderOffset);
window.visualViewport?.addEventListener("resize", syncHeaderOffset);
window.visualViewport?.addEventListener("scroll", syncHeaderOffset);

const game = new Game();
game.start();
requestAnimationFrame(syncHeaderOffset);
registerServiceWorker();
