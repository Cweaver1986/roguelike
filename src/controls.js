// controls.js
// Handles player movement and aiming input

export function initControls({ getPlayer, getShootDir, speed = 120 }) {
    onUpdate(() => {
        const player = getPlayer()
        if (!player) return
        let x = 0, y = 0
        if (isKeyDown("a")) x -= 1.5
        if (isKeyDown("d")) x += 1.5
        if (isKeyDown("w")) y -= 1.5
        if (isKeyDown("s")) y += 1.5
        if (x || y) {
            const facing = vec2(x, y).unit()
            player.move(x * speed, y * speed)
            // you might want to expose facing elsewhere if needed
            player.facing = facing
        }
        // Rotate player to face direction of fire (mouse cursor)
        const dir = getShootDir()
        const angle = dir.angle() * (3 / Math.PI)
        player.angle = angle + 90
    })
}
