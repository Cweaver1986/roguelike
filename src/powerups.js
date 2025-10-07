// powerups.js — powerup spawn & activation helpers (magnet, firerate, movement)

import * as game from "./game.js"
let _getPlayer = null

export function initPowerups(getPlayerFn) {
    _getPlayer = getPlayerFn
}

export function spawnMagnet(atPos) {
    // prefer sprite if available
    try {
        if (getSprite && getSprite('magnet')) {
            return add([sprite('magnet'), scale(.125), pos(atPos), anchor('center'), area(), 'powerup', { type: 'magnet' }])
        }
    } catch (e) { }
    // fallback rect
    return add([rect(18, 18), pos(atPos), anchor('center'), color(180, 100, 255), area(), 'powerup', { type: 'magnet' }])
}

export function activateMagnet(speedMultiplier = 1) {
    const player = _getPlayer && _getPlayer()
    if (!player) return
    // pull all xp gems to player over a short tween; speedMultiplier < 1 makes
    // the pull slower (longer duration). Default behavior approximates ~0.3s.
    for (const g of get('xpGem')) {
        const dir = player.pos.sub(g.pos)
        // base steps and stepDelay create a ~0.3s animation; scale with inverse
        // of speedMultiplier so 0.5 => twice as long.
        const baseSteps = 6
        const baseDelay = 0.05
        const steps = Math.max(2, Math.round(baseSteps / Math.max(0.01, speedMultiplier)))
        const delay = baseDelay / Math.max(0.01, speedMultiplier)
        for (let i = 1; i <= steps; i++) {
            wait(i * delay, () => {
                try { g.pos = g.pos.add(dir.scale(1 / steps)) } catch (e) { }
                if (i === steps) {
                    try { game.handlePlayerPickupXP(player, g) } catch (e) { }
                    try { destroy(g) } catch (e) { }
                }
            })
        }
    }
}

// --- firerate powerup ---
let _firerateExpires = 0
let _firerateDuration = 0

export function spawnFirerate(atPos) {
    try {
        if (getSprite && getSprite('fastAttack')) {
            return add([sprite('fastAttack'), scale(.75), pos(atPos), anchor('center'), area(), 'powerup', { type: 'firerate' }])
        }
    } catch (e) { }
    return add([rect(18, 18), pos(atPos), anchor('center'), color(255, 140, 40), area(), 'powerup', { type: 'firerate' }])
}

export function activateFirerate(durationSec = 10) {
    _firerateExpires = Date.now() + durationSec * 1000
    _firerateDuration = durationSec * 1000
}

export function getFireRateMultiplier() {
    return Date.now() < _firerateExpires ? 2 : 1
}

// Returns remaining milliseconds for firerate (0 if inactive)
export function getFirerateRemaining() {
    const rem = _firerateExpires - Date.now()
    return rem > 0 ? rem : 0
}

// Returns the configured duration in milliseconds (0 if never set)
export function getFirerateDuration() {
    return _firerateDuration || 0
}

// --- movement powerup ---
let _movementExpires = 0
let _movementDuration = 0

export function spawnMovement(atPos) {
    try {
        if (getSprite && getSprite('fastMovement')) {
            return add([sprite('fastMovement'), scale(.075), pos(atPos), anchor('center'), area(), 'powerup', { type: 'movement' }])
        }
    } catch (e) { }
    return add([rect(18, 18), pos(atPos), anchor('center'), color(100, 200, 255), area(), 'powerup', { type: 'movement' }])
}

export function activateMovement(durationSec = 10) {
    _movementExpires = Date.now() + durationSec * 1000
    _movementDuration = durationSec * 1000
}

export function getMovementMultiplier() {
    return Date.now() < _movementExpires ? 1.75 : 1
}

// Bullets travel faster while movement powerup is active
export function getProjectileSpeedMultiplier() {
    return Date.now() < _movementExpires ? 1.5 : 1
}

export function getMovementRemaining() {
    const rem = _movementExpires - Date.now()
    return rem > 0 ? rem : 0
}

export function getMovementDuration() {
    return _movementDuration || 0
}
