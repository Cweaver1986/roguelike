// pauseMenu.js — pause menu UI (draws menu, handles menu-specific input)

import { getMusicVolume, getSfxVolume, setMusicVolume, setSfxVolume } from "./audio.js"
import { allBinds } from "./keybinds.js"
import * as keybinds from "./keybinds.js"
import * as gamestate from "./game.js"

let open = false
let elements = []
let listenersInstalled = false

function clearElements() {
    for (const e of elements) try { destroy(e) } catch (e) { }
    elements = []
}

function drawMenu() {
    clearElements()
    const w = width()
    const h = height()
    const boxW = Math.min(420, Math.floor(w * 0.6))
    const boxH = Math.min(380, Math.floor(h * 0.7))
    const x = Math.floor((w - boxW) / 2)
    const y = Math.floor((h - boxH) / 2)

    // decorative sprite behind the menu text (if provided)
    try {
        if (getSprite && getSprite('pauseMenu')) {
            // place the sprite centered inside the dialog box
            elements.push(add([sprite('pauseMenu'), pos(x + boxW / 2, y + boxH / 2), anchor('center'), fixed(), scale(1.3), opacity(0.85), z(198)]))
        }
    } catch (e) { }

    // Title (centered)
    const titleColor = color(255, 165, 64)
    elements.push(add([text('PAUSED', { size: 32 }), pos(x + boxW / 2, y + 20), anchor('center'), fixed(), titleColor, z(201)]))

    // Volume labels (centered)
    const mv = getMusicVolume()
    const sv = getSfxVolume()
    elements.push(add([text(`Music: ${Math.round(mv * 100)}%`, { size: 18 }), pos(x + boxW / 2, y + 80), anchor('center'), fixed(), titleColor, z(201)]))
    elements.push(add([text(`SFX:   ${Math.round(sv * 100)}%`, { size: 18 }), pos(x + boxW / 2, y + 120), anchor('center'), fixed(), titleColor, z(201)]))

    // Keybinds list (centered, formatted). We only display bindings (no remapping here).
    const binds = allBinds()
    const ky = y + 170
    const lines = [
        [`Move Left`, String(binds.moveLeft || 'A')],
        [`Move Right`, String(binds.moveRight || 'D')],
        [`Move Up`, String(binds.moveUp || 'W')],
        [`Move Down`, String(binds.moveDown || 'S')],
        [`Use Bomb`, String(binds.bomb || 'B')],
        [`Pause`, String(binds.pause || 'Escape')],
    ]
    for (let i = 0; i < lines.length; i++) {
        const label = `${lines[i][0]} : ${String(lines[i][1]).toUpperCase()}`
        elements.push(add([text(label, { size: 16 }), pos(x + boxW / 2, ky + i * 26), anchor('center'), fixed(), titleColor, z(201)]))
    }

    elements.push(add([text('Use Left/Right to change volumes.', { size: 12 }), pos(x + boxW / 2, y + boxH - 40), anchor('center'), fixed(), titleColor, z(201)]))
}

export function togglePauseMenu() {
    open = !open
    if (open) {
        drawMenu()
        // install listeners once; when open they will act, otherwise ignored.
        // Delay installation by one tick so they don't immediately react to
        // the same key press that opened the menu (avoid race/double-toggle).
        if (!listenersInstalled) {
            listenersInstalled = true
            wait(0, () => {
                onKeyDown('left', () => { if (!open) return; setMusicVolume(Math.max(0, getMusicVolume() - 0.05)); try { import('./audio.js').then(m => m.updateMusicVolume()) } catch (e) { }; clearElements(); drawMenu() })
                onKeyDown('right', () => { if (!open) return; setMusicVolume(Math.min(1, getMusicVolume() + 0.05)); try { import('./audio.js').then(m => m.updateMusicVolume()) } catch (e) { }; clearElements(); drawMenu() })
                onKeyDown('down', () => { if (!open) return; setSfxVolume(Math.max(0, getSfxVolume() - 0.05)); clearElements(); drawMenu() })
                onKeyDown('up', () => { if (!open) return; setSfxVolume(Math.min(1, getSfxVolume() + 0.05)); clearElements(); drawMenu() })
                // Note: do not register an internal Escape handler here. Pause
                // toggling (open/close) is owned by mainController to avoid
                // duplicate handlers and race conditions.
            })
        }
    } else {
        clearElements()
        // no recording state to clear
        // We do not remove key listeners (Kaboom doesn't provide easy offKeyDown)
    }
}

export function isPauseOpen() { return open }