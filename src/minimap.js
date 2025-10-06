// minimap.js — fixed minimap overlay showing player, enemies, and viewport

export function initMinimap(opts = {}) {
    const { worldW = width(), worldH = height(), vw = width(), vh = height(), size = 160 } = opts
    const padding = 8
    const mapW = size
    const mapH = size * (vh / vw)
    const mapX = width() - mapW - padding
    const mapY = padding

    // background box
    const bg = add([
        rect(mapW + 4, mapH + 4),
        pos(mapX - 2, mapY - 2),
        color(10, 10, 10),
        fixed(),
        z(100),
    ])

    // viewport holder (clear area)
    const mapBox = add([
        rect(mapW, mapH),
        pos(mapX, mapY),
        color(30, 30, 30),
        fixed(),
        z(101)
    ])

    // no extra layer needed; we'll tag minimap markers with 'mm'

    // helper to convert world -> minimap coords
    function toMinimap(posWorld) {
        // convert and clamp to minimap area so markers don't draw outside
        const x = mapX + (posWorld.x / worldW) * mapW
        const y = mapY + (posWorld.y / worldH) * mapH
        const cx = Math.max(mapX, Math.min(x, mapX + mapW))
        const cy = Math.max(mapY, Math.min(y, mapY + mapH))
        return vec2(cx, cy)
    }

    // update loop: clear old markers and redraw
    onUpdate(() => {
        // remove previous marker entities (we tag them 'mm')
        for (const m of get('mm')) destroy(m)

        // draw enemies (category 'enemy')
        for (const e of get('enemy')) {
            const p = toMinimap(e.pos)
            add([rect(4, 4), pos(p), anchor('center'), color(200, 40, 40), fixed(), 'mm', z(105)])
        }

        // draw player
        const p = get('player')[0]
        if (p) {
            const pp = toMinimap(p.pos)
            add([rect(6, 6), pos(pp), anchor('center'), color(60, 140, 220), fixed(), 'mm', z(106)])
        }

        // draw viewport rectangle as four thin rects (top, bottom, left, right)
        const cam = camPos()
        const halfW = vw / 2
        const halfH = vh / 2
        // top-left of viewport in world coords
        const tlWorld = vec2(cam.x - halfW, cam.y - halfH)
        const topLeft = toMinimap(tlWorld)
        const viewW = (vw / worldW) * mapW
        const viewH = (vh / worldH) * mapH
        // clamp viewport rect to minimap bounds
        const x = Math.max(mapX, Math.min(topLeft.x, mapX + mapW - viewW))
        const y = Math.max(mapY, Math.min(topLeft.y, mapY + mapH - viewH))
        const lineW = 2
        // top
        add([rect(viewW, lineW), pos(x, y), anchor('topleft'), color(220, 220, 220), fixed(), 'mm', z(107)])
        // bottom
        add([rect(viewW, lineW), pos(x, y + viewH - lineW), anchor('topleft'), color(220, 220, 220), fixed(), 'mm', z(107)])
        // left
        add([rect(lineW, viewH), pos(x, y), anchor('topleft'), color(220, 220, 220), fixed(), 'mm', z(107)])
        // right
        add([rect(lineW, viewH), pos(x + viewW - lineW, y), anchor('topleft'), color(220, 220, 220), fixed(), 'mm', z(107)])
    })

    return {
        destroy() {
            destroy(bg)
            destroy(mapBox)
            // remove any remaining 'mm' markers
            for (const m of get('mm')) destroy(m)
        }
    }
}
