// xp.js — XP, leveling, and HUD notifications

const MAX_LEVELS = 25
const BASE_XP = 10
const XP_STEP = 5

let xp = 0
let level = 1
let hudUpdateFn = null
let _onLevelUp = null
let _pendingLevelUps = 0
let _menuActive = false

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
        // queue a pending level-up (we'll show menus one at a time)
        _pendingLevelUps++
    }
    // If there are pending level-ups and an onLevelUp handler, trigger one
    try {
        if (_pendingLevelUps > 0 && typeof _onLevelUp === 'function' && !_menuActive) {
            // Consume one pending level-up because we're about to show the
            // menu immediately for it. Remaining pending level-ups (if any)
            // will be handled after the player makes their choice.
            _pendingLevelUps = Math.max(0, _pendingLevelUps - 1)
            _menuActive = true
            try { _onLevelUp(level) } catch (e) { }
        }
    } catch (e) { }
    notifyHUD()
}

// Called by the skill menu when a level-up choice has been handled so the
// next pending level-up (if any) can be shown.
export function handleNextPendingLevelUp() {
    try {
        // mark the previous menu as finished
        _menuActive = false
        if (_pendingLevelUps > 0 && typeof _onLevelUp === 'function') {
            _pendingLevelUps--
            _menuActive = true
            try { _onLevelUp(level) } catch (e) { }
        }
    } catch (e) { }
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

export function registerOnLevelUp(fn) { _onLevelUp = fn }

export function getXP() { return xp }
export function getLevel() { return level }
