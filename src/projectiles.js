// projectiles.js — projectile pool and lifecycle

const POOL_SIZE = 24
const pool = []
let _worldW = Infinity
let _worldH = Infinity

export function initProjectiles({ worldW = Infinity, worldH = Infinity } = {}) {
    _worldW = worldW
    _worldH = worldH
}

function makeBullet(spriteName = "bullet", scaleVal = 0.14) {
    const b = add([
        sprite(spriteName),
        pos(-1000, -1000),
        area(),
        anchor("center"),
        scale(scaleVal),
        "projectile",
    ])
    b.hidden = true
    // Cull bullets that move off the world bounds
    b.onUpdate(() => {
        try {
            if (b.hidden) return
            const x = b.pos.x
            const y = b.pos.y
            if (x < 0 || y < 0 || x > _worldW || y > _worldH) {
                try { destroy(b) } catch (e) { }
            }
        } catch (e) { }
    })
    return b
}

// initialize pool lazily
function ensurePool() {
    if (pool.length > 0) return
    for (let i = 0; i < POOL_SIZE; i++) {
        pool.push(makeBullet())
    }
}

export function spawnProjectile(posVec, dirVec, angle = 0, opts = {}) {
    ensurePool()
    const speed = opts.speed || 400
    const spriteName = opts.sprite || "bullet"
    const scaleVal = opts.scale || 0.14

    // find an available slot index of a hidden bullet
    let idx = pool.findIndex(x => x && x.hidden)
    if (idx === -1) {
        // no hidden slot: create a new bullet and push to pool
        const nb = add([
            sprite(spriteName),
            pos(posVec),
            area(),
            anchor("center"),
            scale(scaleVal),
            move(vec2(dirVec).unit(), speed),
            rotate(angle),
            "projectile",
        ])
        pool.push(nb)
        // schedule removal (hide) after lifetime
        wait(2.5, () => { try { nb.destroy && destroy(nb) } catch (e) { } })
        return nb
    }

    // There is a hidden slot; replace the old entity with a fresh one to avoid stale state
    const old = pool[idx]
    try { if (old) destroy(old) } catch (e) { }
    const b = add([
        sprite(spriteName),
        pos(posVec),
        area(),
        anchor("center"),
        scale(scaleVal),
        move(vec2(dirVec).unit(), speed),
        rotate(angle),
        "projectile",
    ])
    // attach culling for runtime-created projectiles as well
    b.onUpdate(() => {
        try {
            if (b.hidden) return
            const x = b.pos.x
            const y = b.pos.y
            if (x < 0 || y < 0 || x > _worldW || y > _worldH) {
                try { destroy(b) } catch (e) { }
            }
        } catch (e) { }
    })
    pool[idx] = b
    wait(2.5, () => { try { destroy(b) } catch (e) { } })
    return b
}

export function clearProjectiles() {
    ensurePool()
    for (const b of pool) {
        b.hidden = true
        b.pos = vec2(-1000, -1000)
    }
}

