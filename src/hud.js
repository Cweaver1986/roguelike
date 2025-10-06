// hud.js
// Manages HUD elements: hearts, bombs, scoreboard, XP bar and XP gems

// Note: this module assumes kaboom is already initialized and assets are registered.

let bombPool = []
let heartPool = []
let scoreText = null
let scoreboardSprite = null
let xpBarEntity = null
let xpFill = null
let xpText = null

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

    xpFill.targetScaleX = xpFill.targetScaleX || 0
    xpFill.onUpdate(() => {
        const cur = xpFill.scale.x || 0
        const target = xpFill.targetScaleX || 0
        const speed = 6
        const next = cur + (target - cur) * Math.min(1, speed * dt())
        xpFill.scale.x = next
        if (Math.abs(next - target) < 0.001) xpFill.scale.x = target
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
}

function initBombPool() {
    if (bombPool.length > 0) return
    for (let i = 0; i < MAX_BOMB_DISPLAY; i++) {
        const b = add([sprite("bomb"), pos(-100, -100), scale(0.15), fixed(), "hudBomb"])
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
    for (let i = 0; i < heartPool.length; i++) {
        const h = heartPool[i]
        if (i < health) {
            h.pos = vec2(24 + i * 32, 12)
            h.hidden = false
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
