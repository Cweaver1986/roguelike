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

    // Volume labels (centered) with black button backgrounds and clickable sliders
    const mv = getMusicVolume()
    const sv = getSfxVolume()
    const volW = Math.min(boxW - 40, 320)
    const volH = 34
    const volX = x + boxW / 2 - volW / 2
    const mvY = y + 80 - volH / 2
    const svY = y + 120 - volH / 2
    // Music button background (tagged for hover/click)
    elements.push(add([rect(volW, volH), pos(volX, mvY), anchor('topleft'), fixed(), area(), color(0, 0, 0), z(200), 'pm_vol_music_btn', 'pm_btn']))
    // Music slider track (inset)
    const trackPad = 8
    elements.push(add([rect(volW - trackPad * 2, volH / 3), pos(volX + trackPad, mvY + volH / 3), anchor('topleft'), fixed(), area(), color(60, 60, 60), z(201), 'pm_vol_music_track']))
    // Music knob
    const mvKnobX = volX + trackPad + Math.max(0, Math.min(1, mv)) * (volW - trackPad * 2)
    elements.push(add([rect(10, volH - 12), pos(mvKnobX - 5, mvY + 6), anchor('topleft'), fixed(), color(255, 200, 0), z(202), 'pm_vol_music_knob']))
    elements.push(add([text(`Music: ${Math.round(mv * 100)}%`, { size: 18 }), pos(x + boxW / 2, y + 80), anchor('center'), fixed(), titleColor, z(203), 'pm_vol_music_label']))
    // SFX button background (tagged)
    elements.push(add([rect(volW, volH), pos(volX, svY), anchor('topleft'), fixed(), area(), color(0, 0, 0), z(200), 'pm_vol_sfx_btn', 'pm_btn']))
    // SFX slider track
    elements.push(add([rect(volW - trackPad * 2, volH / 3), pos(volX + trackPad, svY + volH / 3), anchor('topleft'), fixed(), area(), color(60, 60, 60), z(201), 'pm_vol_sfx_track']))
    // SFX knob
    const svKnobX = volX + trackPad + Math.max(0, Math.min(1, sv)) * (volW - trackPad * 2)
    elements.push(add([rect(10, volH - 12), pos(svKnobX - 5, svY + 6), anchor('topleft'), fixed(), color(255, 200, 0), z(202), 'pm_vol_sfx_knob']))
    elements.push(add([text(`SFX:   ${Math.round(sv * 100)}%`, { size: 18 }), pos(x + boxW / 2, y + 120), anchor('center'), fixed(), titleColor, z(203), 'pm_vol_sfx_label']))

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
    const keyW = Math.min(boxW - 60, 360)
    const keyH = 30
    for (let i = 0; i < lines.length; i++) {
        const label = `${lines[i][0]} : ${String(lines[i][1]).toUpperCase()}`
        const lineY = ky + i * 36
        const keyX = x + boxW / 2 - keyW / 2
        // black button behind each keybind line (tagged for hover)
        elements.push(add([rect(keyW, keyH), pos(keyX, lineY - keyH / 2), anchor('topleft'), fixed(), area(), color(0, 0, 0), z(200), 'pm_keybtn']))
        elements.push(add([text(label, { size: 16 }), pos(x + boxW / 2, lineY), anchor('center'), fixed(), titleColor, z(201)]))
    }

    // helper text removed per UI change
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

                // Hover: darken pm_btn / pm_keybtn to dark red on hover
                onHover('pm_btn', (btn, isOver) => {
                    try { btn.color = isOver ? color(100, 10, 10) : color(0, 0, 0) } catch (e) { }
                })
                onHover('pm_keybtn', (btn, isOver) => {
                    try { btn.color = isOver ? color(100, 10, 10) : color(0, 0, 0) } catch (e) { }
                })

                // Volume slider interaction: click/drag on track or knob to set value
                // Helper to update music/sfx values and redraw menu
                function setMusicFromX(x) {
                    const tracks = get('pm_vol_music_track')
                    const knobs = get('pm_vol_music_knob')
                    const labels = get('pm_vol_music_label')
                    if (!tracks || tracks.length === 0 || !knobs || knobs.length === 0) return
                    const t = tracks[0]
                    const k = knobs[0]
                    const lbl = labels && labels[0]
                    const localX = Math.max(0, Math.min(t.width, x - t.pos.x))
                    const frac = localX / t.width
                    setMusicVolume(frac)
                    try { import('./audio.js').then(m => m.updateMusicVolume()) } catch (e) { }
                    // move knob in-place
                    k.pos.x = t.pos.x + localX - (k.width / 2)
                    if (lbl) lbl.text = `Music: ${Math.round(frac * 100)}%`
                }
                function setSfxFromX(x) {
                    const tracks = get('pm_vol_sfx_track')
                    const knobs = get('pm_vol_sfx_knob')
                    const labels = get('pm_vol_sfx_label')
                    if (!tracks || tracks.length === 0 || !knobs || knobs.length === 0) return
                    const t = tracks[0]
                    const k = knobs[0]
                    const lbl = labels && labels[0]
                    const localX = Math.max(0, Math.min(t.width, x - t.pos.x))
                    const frac = localX / t.width
                    setSfxVolume(frac)
                    // move knob in-place
                    k.pos.x = t.pos.x + localX - (k.width / 2)
                    if (lbl) lbl.text = `SFX:   ${Math.round(frac * 100)}%`
                }

                // Click handlers on tracks
                onClick('pm_vol_music_track', (t) => { setMusicFromX(mousePos().x) })
                onClick('pm_vol_sfx_track', (t) => { setSfxFromX(mousePos().x) })
                // Click on button area sets focus as well
                onClick('pm_vol_music_btn', () => { setMusicFromX(mousePos().x) })
                onClick('pm_vol_sfx_btn', () => { setSfxFromX(mousePos().x) })

                // Dragging knobs: we implement a simple mousemove while mouse is down
                let dragging = null
                onMouseDown(() => {
                    const mx = mousePos().x
                    const my = mousePos().y
                    try {
                        const km = get('pm_vol_music_knob')[0]
                        const ks = get('pm_vol_sfx_knob')[0]
                        if (km && mx >= km.pos.x && mx <= km.pos.x + km.width && my >= km.pos.y && my <= km.pos.y + km.height) dragging = 'music'
                        else if (ks && mx >= ks.pos.x && mx <= ks.pos.x + ks.width && my >= ks.pos.y && my <= ks.pos.y + ks.height) dragging = 'sfx'
                    } catch (e) { }
                })
                onMouseRelease(() => { dragging = null })
                onUpdate(() => {
                    if (!dragging) return
                    const mx = mousePos().x
                    if (dragging === 'music') setMusicFromX(mx)
                    if (dragging === 'sfx') setSfxFromX(mx)
                })
            })
        }
    } else {
        clearElements()
        // no recording state to clear
        // We do not remove key listeners (Kaboom doesn't provide easy offKeyDown)
    }
}

export function isPauseOpen() { return open }