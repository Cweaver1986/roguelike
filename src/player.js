// player.js — player spawn and shooting helpers

let playerRef = null

// spawnPlayer accepts an optional position object { x, y } so callers can place
// the player in a different world-coordinate (useful when the world is larger
// than the viewport). If no position is provided, it falls back to the screen
// center.
export function spawnPlayer(at = null) {
    const px = at && typeof at.x === 'number' ? at.x : width() / 2
    const py = at && typeof at.y === 'number' ? at.y : height() / 2
    playerRef = add([
        sprite("player"),
        scale(0.2),
        pos(px, py),
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
    // mousePos() returns screen coordinates; when camera has moved, convert
    // to world coordinates by adding the camera offset (camPos - viewport center).
    const screenMouse = mousePos()
    const camera = camPos()
    const worldMouse = vec2(screenMouse.x + (camera.x - width() / 2), screenMouse.y + (camera.y - height() / 2))
    return worldMouse.sub(playerRef.pos).unit()
}
