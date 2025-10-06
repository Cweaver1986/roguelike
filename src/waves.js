// waves.js — enemy wave manager and ambient sounds

import * as game from "./game.js"
import { applySfxVolume } from "./audio.js"

export function initWaves(options = {}) {
    const {
        spawnEnemy,
        zombieSounds = [],
        initialEnemies = 5,
        MAX_ENEMIES = 25,
    } = options

    let currentMaxEnemies = initialEnemies

    loop(9, () => {
        if (game.isGameOver()) return
        if (game.isPaused && game.isPaused()) return
        if (currentMaxEnemies < MAX_ENEMIES) {
            currentMaxEnemies++
            if (get("enemy").length < currentMaxEnemies) {
                spawnEnemy && spawnEnemy()
            }
        }
    })

    // Maintain a dynamic minimum active enemy floor: half of the current max
    loop(1, () => {
        if (game.isGameOver()) return
        if (game.isPaused && game.isPaused()) return
        const minActive = Math.floor(currentMaxEnemies / 2)
        const current = get("enemy").length
        if (current < minActive) {
            spawnEnemy && spawnEnemy()
        }
    })

    // Play random zombie sound every 12s when enemies exist
    loop(12, () => {
        if (game.isPaused && game.isPaused()) return
        const enemies = get("enemy")
        if (enemies.length > 0 && zombieSounds && zombieSounds.length > 0) {
            const snd = zombieSounds[Math.floor(Math.random() * zombieSounds.length)]
            try { play(snd, applySfxVolume({ volume: 0.1 })) } catch (e) { }
        }
    })
}
