// entry.js — safe bootstrapper
// This module loads Kaboom, loads assets, then dynamically imports the old main.js

import kaboom from "https://unpkg.com/kaboom/dist/kaboom.mjs";
import { loadAll } from "./assets.js";

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
