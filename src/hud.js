// hud.js — HUD elements (hearts, bombs, score, XP)

// Note: this module assumes kaboom is already initialized and assets are registered.

let bombPool = []
let heartPool = []
let scoreText = null
let scoreboardSprite = null
let xpBarEntity = null
let xpFill = null
let xpCapLeft = null
let xpCapRight = null
let xpText = null
let buffIcons = {}
import * as powerups from "./powerups.js"

const MAX_BOMB_DISPLAY = 8
const MAX_HEART_DISPLAY = 10
const XP_BAR_WIDTH = 180
const XP_BAR_HEIGHT = 12
const XP_FILL_OFFSET_X = -20
const XP_FILL_OFFSET_Y = -8
const XP_FILL_SCALE_FACTOR = 1.3

export function initHUD() {
    // idempotent
    if (scoreText) return

    const w = width()
    const h = height()

    // Score text
    scoreText = add([
        text(`0`, { size: 24 }),
        pos(w / 2, 45),
        anchor("center"),
        fixed(),
        color(200, 200, 0),
        z(2)
    ])

    scoreboardSprite = add([
        sprite("scoreboard"),
        pos(w / 2, 40),
        anchor("center"),
        fixed(),
        scale(0.5),
        z(1)
    ])

    // XP bar frame
    xpBarEntity = add([
        sprite("xpBar"),
        pos(w / 2, h - 24),
        anchor("center"),
        fixed(),
        scale(1),
        z(3),
        "xpBar"
    ])

    // XP fill (rectangle) placed under the frame
    const leftX = xpBarEntity.pos.x - XP_BAR_WIDTH / 2 + XP_FILL_OFFSET_X
    const fillY = xpBarEntity.pos.y + XP_FILL_OFFSET_Y
    xpFill = add([
        rect(XP_BAR_WIDTH, XP_BAR_HEIGHT),
        pos(leftX, fillY),
        anchor("topleft"),
        fixed(),
        color(255, 200, 0),
        z(4),
        scale(0, 1.1),
    ])

    // rounded caps for the fill so the yellow bar looks rounded instead of
    // colliding with the artwork. We'll position these each frame in onUpdate.
    const visualH = XP_BAR_HEIGHT * 1.1
    const capR = visualH / 2
    xpCapLeft = add([circle(capR), pos(leftX, fillY + visualH / 2), anchor('center'), fixed(), color(255, 200, 0), z(4)])
    xpCapRight = add([circle(capR), pos(leftX, fillY + visualH / 2), anchor('center'), fixed(), color(255, 200, 0), z(4)])

    xpFill.targetScaleX = xpFill.targetScaleX || 0
    xpFill.onUpdate(() => {
        const cur = xpFill.scale.x || 0
        const target = xpFill.targetScaleX || 0
        const speed = 6
        const next = cur + (target - cur) * Math.min(1, speed * dt())
        xpFill.scale.x = next
        if (Math.abs(next - target) < 0.001) xpFill.scale.x = target
        // update cap positions based on current visual width
        try {
            const visualW = XP_BAR_WIDTH * xpFill.scale.x
            const visualH = XP_BAR_HEIGHT * 1.1
            const cx = xpFill.pos.x
            const cy = xpFill.pos.y + visualH / 2
            if (xpCapLeft) {
                xpCapLeft.pos.x = cx
                xpCapLeft.pos.y = cy
                xpCapLeft.hidden = next <= 0.001
            }
            if (xpCapRight) {
                xpCapRight.pos.x = cx + visualW
                xpCapRight.pos.y = cy
                xpCapRight.hidden = next <= 0.001
            }
        } catch (e) { }
    })

    xpText = add([
        text(`LV 1 0/10`, { size: 14 }),
        pos(xpBarEntity.pos.x, xpBarEntity.pos.y - 22),
        anchor("center"),
        fixed(),
        color(255, 255, 255),
        z(4),
    ])

    // initialize pools
    initBombPool()
    initHeartPool()

    // prepare buff icons (movement then firerate). We'll create icons only if sprites exist.
    try {
        if (getSprite && getSprite('fastMovement')) {
            buffIcons.movement = add([sprite('fastMovement'), pos(scoreboardSprite.pos.x + 150, scoreboardSprite.pos.y), anchor('center'), fixed(), scale(0.075), z(5)])
            buffIcons.movement.hidden = true
        }
    } catch (e) { }
    try {
        if (getSprite && getSprite('fastAttack')) {
            buffIcons.firerate = add([sprite('fastAttack'), pos(scoreboardSprite.pos.x + 150, scoreboardSprite.pos.y), anchor('center'), fixed(), scale(0.75), z(5)])
            buffIcons.firerate.hidden = true
        }
    } catch (e) { }

    // update loop: render queued buffs to the right of the scoreboard
    onUpdate(() => {
        // compute ordered active buffs: movement first, then firerate
        const active = []
        const mvRem = powerups.getMovementRemaining ? powerups.getMovementRemaining() : 0
        const mvDur = powerups.getMovementDuration ? powerups.getMovementDuration() : 0
        if (mvRem > 0 && mvDur > 0) active.push('movement')
        const frRem = powerups.getFirerateRemaining ? powerups.getFirerateRemaining() : 0
        const frDur = powerups.getFirerateDuration ? powerups.getFirerateDuration() : 0
        if (frRem > 0 && frDur > 0) active.push('firerate')

        const BASE_OFFSET = 175
        const SPACING = 75

        // Position and visibility for each buff slot
        for (let i = 0; i < Object.keys(buffIcons).length; i++) {
            const key = Object.keys(buffIcons)[i]
            const icon = buffIcons[key]
            if (!icon) continue
            const idx = active.indexOf(key)
            if (idx === -1) {
                icon.hidden = true
                continue
            }
            // place icon in queue order (0 = nearest scoreboard)
            icon.pos.x = scoreboardSprite.pos.x + BASE_OFFSET + idx * SPACING
            icon.pos.y = scoreboardSprite.pos.y

            // compute blinking/steady behavior using the relevant remaining/duration
            let rem = 0, dur = 0
            if (key === 'movement') {
                rem = mvRem; dur = mvDur
            } else if (key === 'firerate') {
                rem = frRem; dur = frDur
            }
            const ratio = Math.max(0, Math.min(1, rem / dur))
            if (ratio > 0.5) {
                icon.hidden = false
            } else {
                const norm = (0.5 - ratio) / 0.5
                const freq = 1 + norm * 1.5 // ramp 1..8 Hz
                const visible = Math.sin(time() * freq * Math.PI * 2) > 0
                icon.hidden = !visible
            }
        }
    })
}

function initBombPool() {
    if (bombPool.length > 0) return
    for (let i = 0; i < MAX_BOMB_DISPLAY; i++) {
        const b = add([sprite("bomb"), pos(-100, -100), scale(0.18), fixed(), "hudBomb"])
        b.hidden = true
        bombPool.push(b)
    }
}

export function renderBombs(count) {
    initBombPool()
    for (let i = 0; i < bombPool.length; i++) {
        const b = bombPool[i]
        if (i < count) {
            b.pos = vec2(24 + i * 32, 50)
            b.hidden = false
        } else {
            b.hidden = true
        }
    }
}

function initHeartPool() {
    if (heartPool.length > 0) return
    for (let i = 0; i < MAX_HEART_DISPLAY; i++) {
        const h = add([sprite("heart"), pos(-100, -100), scale(0.085), fixed(), "hudHeart"])
        h.hidden = true
        heartPool.push(h)
    }
}

export function renderHearts(health) {
    initHeartPool()
    // Constants for sizing and spacing
    const LEFT_X = 24
    const BASE_SPACING = 32 // base horizontal spacing between hearts at scale 1
    const BASE_SCALE = 0.085 // original sprite scale used in initHeartPool
    const MAX_SCALE_MULT = 1.4 // hearts can be up to 40% larger

    // Determine available width to the scoreboard (prevent overlap)
    let scoreboardCenterX = null
    try { scoreboardCenterX = scoreboardSprite && scoreboardSprite.pos ? scoreboardSprite.pos.x : null } catch (e) { scoreboardCenterX = null }
    if (!scoreboardCenterX) scoreboardCenterX = width() / 2
    // reserve some extra space to the right (scoreboard and padding)
    const RESERVED_RIGHT_SPACE = 50
    const AVAILABLE_WIDTH = Math.max(80, scoreboardCenterX - 60 - LEFT_X - RESERVED_RIGHT_SPACE)

    const count = Math.max(0, Math.min(heartPool.length, health || 0))
    // If no hearts to show, hide all and return
    if (count <= 0) {
        for (let i = 0; i < heartPool.length; i++) heartPool[i].hidden = true
        return
    }

    // Compute a scale multiplier: try to use MAX_SCALE_MULT, but shrink if
    // the total width would exceed AVAILABLE_WIDTH.
    const baseTotalWidth = count * BASE_SPACING
    let scaleMult = MAX_SCALE_MULT
    if (baseTotalWidth * scaleMult > AVAILABLE_WIDTH) {
        scaleMult = Math.max(0.1, AVAILABLE_WIDTH / baseTotalWidth)
    }

    const spacing = BASE_SPACING * scaleMult
    const heartScale = BASE_SCALE * scaleMult

    for (let i = 0; i < heartPool.length; i++) {
        const h = heartPool[i]
        if (i < count) {
            try {
                h.pos = vec2(LEFT_X + i * spacing, 12)
                h.hidden = false
                // set individual scale components if available
                try { h.scale.x = heartScale } catch (e) { try { h.scale = heartScale } catch (e) { } }
                try { h.scale.y = heartScale } catch (e) { try { h.scale = heartScale } catch (e) { } }
            } catch (e) { }
        } else {
            h.hidden = true
        }
    }
}

export function setScore(n) {
    if (!scoreText) return
    scoreText.text = `${n}`
}

export function updateXPUI(xp, level, req) {
    if (!xpFill || !xpText) return
    const ratio = Math.min(1, xp / req)
    xpFill.targetScaleX = ratio * XP_FILL_SCALE_FACTOR
    xpText.text = `LV ${level} ${xp}/${req}`
}

export function resetXPFill() {
    if (xpFill) xpFill.scale.x = 0
}

export function spawnXPGem(atPos) {
    add([
        sprite("xpGem"),
        pos(atPos),
        scale(0.2),
        area(),
        anchor("center"),
        "xpGem",
        { value: 1 }
    ])
}
