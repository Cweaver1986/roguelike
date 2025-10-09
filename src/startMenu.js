// startMenu.js — simple start screen with title and menu options
// Exports showStartMenu(callbacks) which displays a menu and calls back on
// selection: { onStart, onOptions, onQuit }

export function showStartMenu({ onStart = () => { }, onOptions = () => { }, onQuit = () => { } } = {}) {
    // showStartMenu called (debug logs removed for polish)

    // If Kaboom didn't initialize or global APIs are missing, render a DOM
    // fallback UI so the user isn't stuck on a black screen and can still
    // trigger the callbacks. This is a diagnostic aid only.
    try {
        if (typeof add !== 'function') {
            const root = document.createElement('div')
            root.style.position = 'fixed'
            root.style.left = '0'
            root.style.top = '0'
            root.style.width = '100%'
            root.style.height = '100%'
            root.style.display = 'flex'
            root.style.flexDirection = 'column'
            root.style.alignItems = 'center'
            root.style.justifyContent = 'center'
            root.style.background = '#060608'
            root.style.color = '#e6d0b4'
            root.style.zIndex = '99999'
            root.id = 'startMenuFallback'

            const h = document.createElement('h1')
            h.innerText = 'Bullet & Bone'
            h.style.fontFamily = 'sans-serif'
            h.style.marginBottom = '8px'
            root.appendChild(h)

            const p = document.createElement('p')
            p.innerText = 'Kaboom did not initialize. Click Start to attempt to continue.'
            p.style.marginTop = '0'
            p.style.marginBottom = '20px'
            root.appendChild(p)

            function makeBtn(label, cb) {
                const b = document.createElement('button')
                b.innerText = label
                b.style.padding = '12px 24px'
                b.style.margin = '6px'
                b.onclick = () => { try { document.body.removeChild(root) } catch (e) { }; try { cb() } catch (e) { } }
                root.appendChild(b)
            }

            makeBtn('Start Game', onStart)
            makeBtn('Options', onOptions)
            makeBtn('Quit', onQuit)

            document.body.appendChild(root)
            return { clear: () => { try { document.body.removeChild(root) } catch (e) { } } }
        }
    } catch (e) { console.log('[startMenu] fallback error', e) }
    // clear any existing menu entities when created
    const entities = []
    function clear() { for (const e of entities) try { destroy(e) } catch (x) { } }

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

    // overlay (draw first so UI appears above it)
    const overlay = add([rect(width(), height()), pos(0, 0), color(6, 6, 8), fixed()])
    try { overlay.opacity = 0.85 } catch (e) { }
    entities.push(overlay)

    // title - use spooky font if available; add a subtle shadow behind it
    const titleStyle = { size: 56, align: 'center' }

    // title shadow (exactly centered horizontally)
    try {
        const titleShadow = add([text('Bullet & Bone', titleStyle), pos(width() / 2, 62), originSafe('center'), fixed(), color(10, 10, 10)])
        entities.push(titleShadow)
    } catch (e) { }
    const title = add([text('Bullet & Bone', titleStyle), pos(width() / 2, 60), originSafe('center'), fixed(), color(220, 200, 180)])
    title.pos.x -= title.width / 2
    title.pos.y -= title.height / 2
    entities.push(title)

    // menu options - centered vertically and visually rounded
    const BUTTON_W = 360
    const BUTTON_H = 56
    const GAP = 18
    const labels = ['Play', 'Options', 'Quit']
    const totalH = labels.length * BUTTON_H + (labels.length - 1) * GAP
    const baseY = Math.max(160, Math.floor(height() / 2 - totalH / 2))

    function makeRoundedButton(label, y, cb) {
        const bx = Math.floor(width() / 2 - BUTTON_W / 2)
        const by = y
        // invisible hit area (rectangle) for interaction
        const hit = add([rect(BUTTON_W, BUTTON_H), pos(bx, by), originSafe('topleft'), fixed(), area(), 'start_button', opacity(0)])
        // visual parts: center rect and left/right semicircles to fake rounded ends
        const r = Math.floor(BUTTON_H / 2)
        const centerW = BUTTON_W - r * 2
        const centerRect = add([rect(centerW, BUTTON_H), pos(bx + r, by), originSafe('topleft'), fixed(), color(28, 28, 28)])
        const leftCircle = add([circle(r), pos(bx + r, by + BUTTON_H / 2), originSafe('center'), fixed(), color(28, 28, 28)])
        const rightCircle = add([circle(r), pos(bx + BUTTON_W - r, by + BUTTON_H / 2), originSafe('center'), fixed(), color(28, 28, 28)])
        // ensure the label's origin is centered and placed at the button center
        const labelText = add([text(label, { size: 22, align: 'center' }), pos(bx + Math.floor(BUTTON_W / 2), by + Math.floor(BUTTON_H / 2)), originSafe('center'), fixed(), color(220, 200, 180)])
        // Some Kaboom builds render text baseline slightly off; enforce origin/pos
        try {
            // ensure a true center origin
            if (labelText) {
                try { labelText.origin = vec2(0.5, 0.5) } catch (e) { }
                try { labelText.pos = vec2(bx + Math.floor(BUTTON_W / 2), by + Math.floor(BUTTON_H / 2)) } catch (e) { }
                // if the renderer reports a height property, use it to nudge exact centering
                try {
                    if (typeof labelText.height === 'number') {
                        // center vertically using reported height (safe no-op if not supported)
                        labelText.pos.x -= labelText.width / 2
                        labelText.pos.y -= labelText.height / 2
                    }
                } catch (e) { }
            }
        } catch (e) { }
        entities.push(hit, centerRect, leftCircle, rightCircle, labelText)
        // keep references for hover
        try { hit._parts = { centerRect, leftCircle, rightCircle, labelText } } catch (e) { }

        onClick('start_button', (ent) => {
            try {
                if (ent === hit) { clear(); cb(); }
            } catch (e) { }
        })

        try {
            const canvasEl = document.querySelector('canvas')
            onHover('start_button', (ent, h) => {
                try {
                    if (ent !== hit) return
                    const parts = ent._parts || {}
                    const col = h ? color(48, 48, 48) : color(28, 28, 28)
                    try { if (parts.centerRect) parts.centerRect.color = col } catch (e) { }
                    try { if (parts.leftCircle) parts.leftCircle.color = col } catch (e) { }
                    try { if (parts.rightCircle) parts.rightCircle.color = col } catch (e) { }
                    try { if (canvasEl) canvasEl.style.cursor = h ? 'pointer' : '' } catch (e) { }
                    try { if (parts.labelText) parts.labelText.scale = h ? vec2(1.03, 1.03) : vec2(1, 1) } catch (e) { }
                } catch (e) { }
            })
        } catch (e) { }
    }

    for (let i = 0; i < labels.length; i++) {
        const y = baseY + i * (BUTTON_H + GAP)
        // map the label 'Play' to onStart
        const cb = labels[i] === 'Play' ? onStart : (labels[i] === 'Options' ? onOptions : onQuit)
        makeRoundedButton(labels[i], y, cb)
    }

    // return a handle to clear from outside if needed
    return { clear }
}
