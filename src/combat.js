// combat.js — player auto-attack and projectile firing

import { spawnProjectile } from "./projectiles.js"
import * as game from "./game.js"
import * as powerups from "./powerups.js"
import { getExtraProjectiles, getCritChancePercent } from "./skills.js"

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
            const extra = getExtraProjectiles ? getExtraProjectiles() : 0
            const total = Math.max(1, 1 + (extra || 0))
            const spread = 8 // degrees total spread for multi-shot
            for (let i = 0; i < total; i++) {
                // spread the projectiles evenly around the aimed angle
                const t = (total === 1) ? 0 : (i / (total - 1) - 0.5)
                const ang = bulletAngle + t * spread
                const rad = ang * (Math.PI / 180)
                const d = vec2(Math.cos(rad), Math.sin(rad))
                // determine crit chance per projectile
                let isCrit = false
                try {
                    const critPct = getCritChancePercent ? getCritChancePercent() : 0
                    isCrit = Math.random() * 100 < (critPct || 0)
                } catch (e) { }
                spawnProjectile(spawnPos, d, ang, { speed: 400 * speedMult, scale: 0.14, sprite: "bullet", isCrit })
            }
            cooldown = interval
        }
    })
}
