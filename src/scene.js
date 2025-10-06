// scene.js
// Responsible for background, music, and global scene loops (difficulty, zombie sounds)

import * as game from "./game.js"
import { initWaves } from "./waves.js"

export function initScene(options = {}) {
    const {
        w = width(),
        h = height(),
        spawnEnemy,
        zombieSounds = [],
        tileSize = 102,
        tileScale = 0.25,
        music = "spooky",
        musicVolume = 0.12,
        initialEnemies = 5,
        MAX_ENEMIES = 25,
    } = options

    // Play background music
    try {
        play(music, { loop: true, volume: musicVolume })
    } catch (e) {
        // ignore if music asset missing
    }

    // Tile the background across the screen
    for (let x = 0; x < w; x += tileSize) {
        for (let y = 0; y < h; y += tileSize) {
            add([
                sprite("background"),
                pos(x, y),
                anchor("topleft"),
                scale(tileScale),
                z(-1),
                color(150, 150, 150),
            ])
        }
    }

    // Initialize wave manager (difficulty scaling + ambient sounds)
    initWaves({ spawnEnemy, zombieSounds, initialEnemies, MAX_ENEMIES })
}
