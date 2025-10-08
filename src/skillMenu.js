// skillMenu.js — fresh, clean Kaboom UI for the level-up skill menu
// Shows three centered cards with picture / name+desc / stars, pauses game on open,
// resumes on selection. Includes a small fade-in animation with optional stagger.

import { pickRandomSkills, getPlayerSkillLevel, bumpSkillLevel } from './skills.js'
import { pauseGame, resumeGame, isPaused as gameIsPaused, refreshFortifyBonus } from './game.js'
import { handleNextPendingLevelUp } from './xp.js'

let menuOpen = false
let menuEntities = []
let menuPausedGame = false
let _clickHandlerRegistered = false
let _hoverHandlerRegistered = false

function clearMenu() {
    for (const e of menuEntities) try { destroy(e) } catch (err) { }
    menuEntities = []
}

// Small fade-in component with optional delay and target opacity
function fadeIn(target = 1, speed = 3.0, delay = 0) {
    return {
        id: 'fadeIn',
        add() { this._fadeTarget = target; this._fadeSpeed = speed; this._fadeDelay = delay; this.opacity = 0 },
        update() {
            if (this._fadeDelay > 0) { this._fadeDelay -= dt(); return }
            this.opacity = Math.min(this._fadeTarget, (this.opacity || 0) + dt() * this._fadeSpeed)
        }
    }
}

// originSafe: use Kaboom's origin() if available, otherwise provide a
// tiny fallback component that sets this.origin to a vec2.
function originSafe(kind) {
    try {
        if (typeof origin === 'function') return origin(kind)
    } catch (e) { }
    return {
        id: 'originSafe',
        add() {
            try {
                let v = null
                if (typeof kind === 'string') {
                    if (kind === 'center') v = vec2(0.5, 0.5)
                    else if (kind === 'topleft') v = vec2(0, 0)
                    else if (kind === 'top') v = vec2(0.5, 0)
                    else v = vec2(0, 0)
                } else if (Array.isArray(kind)) {
                    v = vec2(kind[0], kind[1])
                } else if (kind && typeof kind.x === 'number' && typeof kind.y === 'number') {
                    v = kind
                }
                if (v) this.origin = v
            } catch (e) { }
        }
    }
}

// hoverable: smooth scale animation helper for hover effects
function hoverable() {
    return {
        id: 'hoverable',
        add() { try { this._targetScale = 1; this.scale = vec2(1, 1); this._targetBorderScale = 1 } catch (e) { } },
        update() {
            try {
                const t = Math.min(1, dt() * 10)
                // smooth lerp for scale
                const cur = (this.scale && this.scale.x) ? this.scale.x : 1
                const next = cur + (this._targetScale - cur) * t
                this.scale = vec2(next, next)
                // attached border: keep visible, but avoid scaling it (scaling can hide outlines)
                if (this._border) {
                    try { this._border.opacity = 1 } catch (e) { }
                }
            } catch (e) { }
        }
    }
}

export function isSkillMenuOpen() { return menuOpen }

export function openSkillMenu(opts = {}) {
    if (menuOpen) return
    menuOpen = true
    clearMenu()

    // debug: log picked skills when opening via console for testing
    try { console.log('[skillMenu] openSkillMenu called') } catch (e) { }

    try {
        if (!gameIsPaused()) { pauseGame(); menuPausedGame = true } else { menuPausedGame = false }
    } catch (e) { menuPausedGame = false }

    const skills = pickRandomSkills(3)
    // fallback to any skills if pickRandomSkills returns fewer
    if (skills.length < 3) {
        try { const all = (typeof getAllSkills === 'function') ? getAllSkills() : []; for (const s of all) if (!skills.includes(s)) skills.push(s) } catch (e) { }
    }

    // layout
    const margin = 28
    const maxW = Math.min(900, width() - margin * 2)
    const panelW = Math.max(640, Math.min(820, maxW))
    const panelH = 380
    const panelX = Math.max(margin, Math.floor(width() / 2 - panelW / 2))
    const panelY = Math.max(margin, Math.floor(height() / 2 - panelH / 2))

    // overlay + panel (fade in)
    const overlay = add([rect(width(), height()), pos(0, 0), color(6, 6, 8), fixed(), fadeIn(0.75, 3.0)])
    menuEntities.push(overlay)

    const panel = add([rect(panelW, panelH), pos(panelX, panelY), color(16, 14, 16), outline(3), fixed(), fadeIn(1, 3.2)])
    menuEntities.push(panel)

    // title - anchor to panel left padding and center text inside the panel width
    const titlePad = 12
    menuEntities.push(add([text('LEVEL UP', { size: 28, width: panelW - titlePad * 2, align: 'center' }), pos(panelX + titlePad, panelY + 18), originSafe('topleft'), fixed(), color(220, 200, 180), fadeIn(1, 3.5)]))
    menuEntities.push(add([text('Choose one to empower the hero', { size: 12, width: panelW - titlePad * 2, align: 'center' }), pos(panelX + titlePad, panelY + 44), originSafe('topleft'), fixed(), color(180, 170, 160), fadeIn(1, 3.5)]))

    // cards
    const cols = 3
    const cardW = Math.floor((panelW - 48) / cols)
    const cardH = 240
    const cardY = panelY + 76
    const gap = Math.floor((panelW - cols * cardW) / (cols + 1))

    // ensure onClick handler registered once
    if (!_clickHandlerRegistered) {
        _clickHandlerRegistered = true
        try {
            onClick('skill_card', (ent) => {
                if (!menuOpen) return
                const id = ent.skillId || null
                try { bumpSkillLevel(id) } catch (e) { }
                // If the player just bumped Fortify, apply the bonus for this round
                try { if (id === 'skill_fortify') refreshFortifyBonus() } catch (e) { }
                closeSkillMenu()
            })
        } catch (e) { }
    }

    // register hover handler once to provide a small highlight on hover
    if (!_hoverHandlerRegistered) {
        _hoverHandlerRegistered = true
        try {
            onHover('skill_card', (ent, isHover) => {
                try {
                    if (!ent) return
                    // animate scale target on the card
                    ent._targetScale = isHover ? 1.04 : 1.0
                    // set a target on the card for border animation; hoverable() will pick it up
                    ent._targetBorderScale = isHover ? 1.06 : 1.0
                    if (ent._border) {
                        // change border color on hover
                        ent._border.color = isHover ? color(200, 120, 80) : color(60, 12, 12)
                    }
                    // small opacity change
                    ent.opacity = isHover ? 0.96 : 1
                } catch (e) { }
            })
        } catch (e) { }
    }

    for (let i = 0; i < Math.min(cols, skills.length); i++) {
        const s = skills[i]
        const cx = panelX + gap + i * (cardW + gap)
        const cy = cardY

        const bodyColor = [[120, 22, 22], [22, 120, 30], [30, 26, 120]][i % 3]
        // border drawn before the card so it sits behind and doesn't intercept input
        const border = add([rect(cardW + 8, cardH + 8), pos(cx - 4, cy - 4), color(60, 12, 12), fixed(), outline(2), fadeIn(1, 3.2, i * 0.06)])
        try { border.opacity = 1 } catch (e) { }
        menuEntities.push(border)

        // then create the card on top
        const card = add([rect(cardW, cardH), pos(cx, cy), color(bodyColor[0], bodyColor[1], bodyColor[2]), fixed(), area(), 'skill_card', originSafe('topleft'), fadeIn(1, 3.2, i * 0.06), hoverable()])
        card.skillId = s && s.id
        // keep a reference to the border so hover handler can highlight it
        try { card._border = border } catch (e) { }
        menuEntities.push(card)

        // top: picture placeholder
        const picH = 76
        const pic = add([rect(cardW - 24, picH), pos(cx + 12, cy + 12), color(24, 12, 12), fixed(), fadeIn(1, 3.2, i * 0.08)])
        menuEntities.push(pic)

        // center: name + desc
        // anchor the text to the card's left padding and let text align:'center'
        // center the title within the available width instead of relying on global center origin
        const name = add([text(s ? s.name : '—', { size: 16, width: cardW - 24, align: 'center' }), pos(cx + 12, cy + 26), originSafe('topleft'), fixed(), color(230, 210, 190), fadeIn(1, 3.5, i * 0.09)])
        menuEntities.push(name)
        const descY = cy + picH + 22
        // anchor description to left padding so align:'center' will center lines within card
        const desc = add([text(s ? s.desc : '', { size: 12, width: cardW - 28, align: 'center' }), pos(cx + 14, descY), originSafe('topleft'), fixed(), color(190, 180, 170), fadeIn(1, 3.5, i * 0.09)])
        menuEntities.push(desc)

        // bottom: stars
        const lvl = getPlayerSkillLevel(s ? s.id : null) || 0
        const starY = cy + cardH - 44
        const starSpacing = 18
        const totalStarsW = 5 * starSpacing
        const startX = cx + cardW / 2 - totalStarsW / 2
        for (let j = 0; j < 5; j++) {
            const filled = j < lvl
            const star = add([rect(12, 12), pos(startX + j * starSpacing, starY), color(filled ? 220 : 70, filled ? 200 : 70, filled ? 70 : 70), fixed(), fadeIn(1, 3.5, i * 0.1)])
            menuEntities.push(star)
        }

        // select text - anchor to left padding and center within card width
        const selectText = add([text('CLICK TO SELECT', { size: 12, width: cardW - 24, align: 'center' }), pos(cx + 12, cy + cardH - 18), originSafe('topleft'), fixed(), color(220, 190, 120), fadeIn(1, 3.0, i * 0.12)])
        menuEntities.push(selectText)
    }

    // expose for debugging (also add common lowercase-typo aliases)
    try {
        globalThis.openSkillMenu = openSkillMenu; globalThis.closeSkillMenu = closeSkillMenu
        globalThis.isSkillMenuOpen = isSkillMenuOpen
        // common-typo / different-casing aliases
        try { globalThis.openSkillmenu = openSkillMenu; globalThis.closeSkillmenu = closeSkillMenu } catch (e) { }
    } catch (e) { }
}

export function closeSkillMenu() {
    if (!menuOpen) return
    clearMenu()
    menuOpen = false
    try { if (menuPausedGame) { resumeGame(); menuPausedGame = false } } catch (e) { }
    // After closing (the player picked one skill), wait a short tick then
    // trigger the next pending level-up (if any) to avoid a race where the
    // menu might not be fully torn down yet.
    try { wait(0.2, () => { try { handleNextPendingLevelUp() } catch (e) { } }) } catch (e) { try { handleNextPendingLevelUp() } catch (e) { } }
}

// Module loaded log removed

// Top-level aliases so the dev console can call these functions anytime
try {
    globalThis.openSkillMenu = openSkillMenu
    globalThis.openSkillmenu = openSkillMenu
    globalThis.closeSkillMenu = closeSkillMenu
    globalThis.closeSkillmenu = closeSkillMenu
} catch (e) { }
