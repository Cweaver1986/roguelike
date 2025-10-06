// combat.js
// Handles player auto-attack logic and projectile creation

import { spawnProjectile } from "./projectiles.js"
import * as game from "./game.js"

export function initAutoAttack(getPlayerFn, getShootDirFn, playDebouncedFn) {
    // returns nothing; sets up a loop
    loop(0.4, () => {
        if (game.isGameOver()) return
        const player = getPlayerFn()
        if (!player) return
        const dir = getShootDirFn()
        playDebouncedFn("bulletsound", { volume: 0.075 }, 90)
        // Offset bullet spawn to barrel
        const barrelOffset = 32
        const spawnPos = player.pos.add(dir.scale(barrelOffset))
        const bulletAngle = player.angle - 90
        spawnProjectile(spawnPos, dir, bulletAngle, { speed: 400, scale: 0.14, sprite: "bullet" })
    })
}
