// enemy.js — enemy spawning & AI helpers

import * as game from "./game.js"

export function spawnEnemy(opts = {}) {
    const { playerRef, ENEMY_PADDING, w, h } = opts
    if (!playerRef) return
    // Pick a random zombie sprite (assets named zombie1..zombie4)
    const zombieSprites = ["zombie1", "zombie2", "zombie3", "zombie4"];
    const spriteName = zombieSprites[Math.floor(Math.random() * zombieSprites.length)];
    const minDistance = 200; // Minimum distance from player

    let x, y;
    do {
        x = rand(ENEMY_PADDING, w - ENEMY_PADDING);
        y = rand(ENEMY_PADDING, h - ENEMY_PADDING);
    } while (playerRef && vec2(x, y).dist(playerRef.pos) < minDistance);

    const subtype = spriteName.replace(/\d+$/, '')
    return add([
        sprite(spriteName),
        scale(0.4),
        pos(x, y),
        anchor("center"),
        area({ scale: .7 }),
        // tag with both the category 'enemy' and a subtype tag (e.g. 'zombie')
        "enemy",
        subtype,
        { hp: 1, type: subtype },
    ])
}

export function initEnemyAI() {
    // placeholder: real AI registration is performed by initEnemyAIWith
}

// Registers the enemy movement handler and collision callback.
// getPlayerFn: () => player entity
// onEnemyPlayerCollision: (enemy, player) => void
// options: { ENEMY_SPEED }
export function initEnemyAIWith(getPlayerFn, onEnemyPlayerCollision, options = {}) {
    const ENEMY_SPEED = options.ENEMY_SPEED || 75
    // by default register AI for all entities tagged 'enemy'
    onUpdate("enemy", (e) => {
        if (game.isPaused && game.isPaused()) return
        const player = getPlayerFn()
        if (!player) return
        const dir = player.pos.sub(e.pos).unit()
        e.move(dir.scale(ENEMY_SPEED))
        const angle = dir.angle() * (3 / Math.PI)
        e.angle = angle + 90
        // delegate collision handling back to main to keep state there
        if (player.isColliding(e)) {
            onEnemyPlayerCollision(e, player)
        }
    })
}
