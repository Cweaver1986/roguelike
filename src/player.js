// player.js
// Handles player creation, movement, and shooting helper

let playerRef = null

export function spawnPlayer() {
    playerRef = add([
        sprite("player"),
        scale(0.2),
        pos(width() / 2, height() / 2),
        anchor("center"),
        area({ scale: .7 }),
        "player"
    ])
    return playerRef
}

export function getPlayer() {
    return playerRef
}

export function getShootDir() {
    return mousePos().sub(playerRef.pos).unit()
}
