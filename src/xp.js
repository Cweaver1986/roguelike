// xp.js
// Manages XP, leveling, and notifies the HUD when values change

const MAX_LEVELS = 25
const BASE_XP = 10
const XP_STEP = 5

let xp = 0
let level = 1
let hudUpdateFn = null

export function initXP(hudUpdate) {
    hudUpdateFn = hudUpdate
    // ensure HUD shows initial state
    notifyHUD()
}

export function xpToNext(lev) {
    return BASE_XP + (lev - 1) * XP_STEP
}

function notifyHUD() {
    if (typeof hudUpdateFn === 'function') {
        hudUpdateFn(xp, level, xpToNext(level))
    }
}

function checkLevelUp() {
    while (level < MAX_LEVELS && xp >= xpToNext(level)) {
        xp -= xpToNext(level)
        level++
        // place to grant perks if desired
    }
    notifyHUD()
}

export function addXP(n = 1) {
    xp += n
    checkLevelUp()
}

export function resetXP() {
    xp = 0
    level = 1
    notifyHUD()
}

export function getXP() { return xp }
export function getLevel() { return level }
