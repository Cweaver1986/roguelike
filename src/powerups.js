// powerups.js — powerup spawn & activation helpers (magnet, firerate, movement)

import * as game from "./game.js"
import { getPickupRangeMultiplier } from './skills.js'
let _getPlayer = null

export function initPowerups(getPlayerFn) {
    _getPlayer = getPlayerFn
    // Passive pickup: player automatically collects nearby xp gems within a
    // small base radius that is scaled by the Magnet skill's pickup multiplier.
    // Base radius (in pixels) when skill level = 0
    // Make the passive pickup radius noticeably larger so it's easy to test.
    // Base radius (in pixels) when skill level = 0
    const PASSIVE_BASE_RANGE = 48
    // Debug UI: circle + text to help visualize pickup radius
    let _debugCircle = null
    let _debugText = null
    onUpdate(() => {
        const player = _getPlayer && _getPlayer()
        if (!player) {
            if (_debugCircle) try { destroy(_debugCircle) } catch (e) { }
            _debugCircle = null
            return
        }
        let pickupMult = 1
        try { pickupMult = typeof getPickupRangeMultiplier === 'function' ? getPickupRangeMultiplier() : 1 } catch (e) { }
        const range = PASSIVE_BASE_RANGE * pickupMult

        // create debug circle once
        try {
            if (!_debugCircle) {
                // add a scale component so we can mutate _debugCircle.scale.x/y later
                _debugCircle = add([circle(1), scale(1), pos(player.pos), origin('center'), color(80, 180, 255), opacity(0.12), outline(1), 'pickupDebug'])
            }
            if (!_debugText) {
                try {
                    _debugText = add([text('', { size: 10 }), pos(player.pos.add(vec2(0, -40))), fixed(), origin('center'), color(180, 220, 255), z(100)])
                } catch (e) { _debugText = null }
            }
            // keep it synced to player position and scale it to the computed range
            if (_debugCircle) {
                _debugCircle.pos = player.pos
                try {
                    _debugCircle.scale.x = range
                    _debugCircle.scale.y = range
                } catch (e) { }
                try {
                    if (_debugText) {
                        _debugText.pos = player.pos.add(vec2(0, -40))
                        _debugText.text = `pickup: ${Math.round(range)}px`
                    }
                } catch (e) { }
            }
        } catch (e) { }

        for (const g of get('xpGem')) {
            try {
                if (player.pos.dist(g.pos) <= range) {
                    try { game.handlePlayerPickupXP(player, g) } catch (e) { }
                    try { destroy(g) } catch (e) { }
                }
            } catch (err) { }
        }
        // Also pick up nearby powerup pickups (magnet, firerate, movement)
        for (const pw of get('powerup')) {
            try {
                if (player.pos.dist(pw.pos) <= range) {
                    try {
                        if (pw.type === 'magnet') activateMagnet()
                        if (pw.type === 'firerate') activateFirerate(10)
                        if (pw.type === 'movement') activateMovement(10)
                    } catch (e) { }
                    try { destroy(pw) } catch (e) { }
                }
            } catch (err) { }
        }
    })
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
    // pull nearby xp gems to player over a short tween; speedMultiplier < 1 makes
    // the pull slower (longer duration). Default behavior approximates ~0.3s.
    // Respect skill-based pickup range multiplier if present to extend pull range.
    // read skill-based pickup multiplier when available
    let pickupMult = 1
    try { pickupMult = typeof getPickupRangeMultiplier === 'function' ? getPickupRangeMultiplier() : 1 } catch (e) { }
    for (const g of get('xpGem')) {
        // Powerup magnet: always pull all gems on the map regardless of skill
        // pickup multiplier. The skill only affects the passive player pickup
        // range handled in initPowerups().
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
