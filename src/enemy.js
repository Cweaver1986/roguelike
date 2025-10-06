// enemy.js
// Handles enemy spawning and behaviors

export function spawnEnemy(opts = {}) {
    const { playerRef, ENEMY_PADDING, w, h } = opts
    if (!playerRef) return
    // Pick a random enemy sprite
    const enemySprites = ["enemy1", "enemy2", "enemy3", "enemy4"];
    const spriteName = enemySprites[Math.floor(Math.random() * enemySprites.length)];
    const minDistance = 200; // Minimum distance from player

    let x, y;
    do {
        x = rand(ENEMY_PADDING, w - ENEMY_PADDING);
        y = rand(ENEMY_PADDING, h - ENEMY_PADDING);
    } while (playerRef && vec2(x, y).dist(playerRef.pos) < minDistance);

    return add([
        sprite(spriteName),
        scale(0.4),
        pos(x, y),
        anchor("center"),
        area({ scale: .7 }),
        "enemy",
        { hp: 1 },
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
    onUpdate("enemy", (e) => {
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
