// entry.js — safe bootstrapper
// This module loads Kaboom, loads assets, then dynamically imports the old main.js

import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";
import { loadAll } from "./assets.js";

// Attempt to load a spooky display font from Google Fonts. This injects the
// link tag so the font is available to the canvas text rendering (Kaboom
// uses canvas fonts from document fonts). If offline, this will silently
// fail and the engine will fall back to a default font.
try {
    const href = "https://fonts.googleapis.com/css2?family=Creepster&display=swap"
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    document.head.appendChild(link)
} catch (e) { }

// initialize kaboom with the same options used previously
kaboom({ background: [0, 0, 0] });

// Load assets then start the game logic from the existing main.js file
loadAll().then(() => {
    // import the original script as a module so it runs after assets are registered
    import("../main.js").then(() => {
        // main script imported after assets registered
        // console.log("Main script imported after assets registered.");
    }).catch(err => {
        // console.error("Failed to import main.js:", err)
    });
}).catch(err => console.error("Asset loading failed:", err));
