// scene.js — background, music, and global scene loops

import * as game from "./game.js"
import { initWaves } from "./waves.js"
import * as audio from "./audio.js"

export function initScene(options = {}) {
    const {
        // world dimensions (in pixels). If you want a larger map, pass a larger
        // `worldW` / `worldH` when calling initScene. Defaults to viewport size.
        worldW = width(),
        worldH = height(),
        spawnEnemy,
        zombieSounds = [],
        tileSize = 102,
        tileScale = 0.25,
        music = "spooky",
        musicVolume = 0.12,
        initialEnemies = 5,
        MAX_ENEMIES = 25,
    } = options

    // Play background music with the audio manager so volume changes take effect
    try {
        audio.playMusic(music, { loop: true })
    } catch (e) {
        // ignore if music asset missing
    }

    // Tile the background across the world area (worldW x worldH). We step by
    // tileSize so the background tiles repeat across the larger world.
    for (let x = 0; x < worldW; x += tileSize) {
        for (let y = 0; y < worldH; y += tileSize) {
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

    // Initialize wave manager (difficulty scaling + ambient sounds). Note the
    // spawnEnemy callback should be implemented to spawn within the world
    // bounds the caller provides.
    initWaves({ spawnEnemy, zombieSounds, initialEnemies, MAX_ENEMIES })
}
