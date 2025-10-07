// combat.js — player auto-attack and projectile firing

import { spawnProjectile } from "./projectiles.js"
import * as game from "./game.js"
import * as powerups from "./powerups.js"

export function initAutoAttack(getPlayerFn, getShootDirFn, playDebouncedFn) {
    let cooldown = 0
    const baseInterval = 0.4
    onUpdate(() => {
        if (game.isGameOver()) return
        if (game.isPaused && game.isPaused()) return
        const dtv = dt()
        if (cooldown > 0) cooldown -= dtv
        const player = getPlayerFn()
        if (!player) return
        const mult = powerups.getFireRateMultiplier ? powerups.getFireRateMultiplier() : 1
        const interval = baseInterval / mult
        if (cooldown <= 0) {
            const dir = getShootDirFn()
            playDebouncedFn("bulletsound", { volume: 0.075 }, 90)
            const barrelOffset = 32
            const spawnPos = player.pos.add(dir.scale(barrelOffset))
            const bulletAngle = player.angle - 90
            const speedMult = powerups.getProjectileSpeedMultiplier ? powerups.getProjectileSpeedMultiplier() : 1
            spawnProjectile(spawnPos, dir, bulletAngle, { speed: 400 * speedMult, scale: 0.14, sprite: "bullet" })
            cooldown = interval
        }
    })
}
