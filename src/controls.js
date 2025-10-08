// controls.js — player movement & input handling

import * as game from "./game.js"
import * as powerups from "./powerups.js"
import { getMoveSpeedMultiplier } from './skills.js'
import * as keybinds from "./keybinds.js"

export function initControls({ getPlayer, getShootDir, speed = 120, worldW = Infinity, worldH = Infinity }) {
    onUpdate(() => {
        if (game.isPaused && game.isPaused()) return
        const player = getPlayer()
        if (!player) return
        let x = 0, y = 0
        const leftKey = keybinds.getBind('moveLeft') || 'a'
        const rightKey = keybinds.getBind('moveRight') || 'd'
        const upKey = keybinds.getBind('moveUp') || 'w'
        const downKey = keybinds.getBind('moveDown') || 's'
        if (isKeyDown(leftKey)) x -= 1.5
        if (isKeyDown(rightKey)) x += 1.5
        if (isKeyDown(upKey)) y -= 1.5
        if (isKeyDown(downKey)) y += 1.5
        if (x || y) {
            const facing = vec2(x, y).unit()
            const moveMult = powerups.getMovementMultiplier ? powerups.getMovementMultiplier() : 1
            const skillMove = typeof getMoveSpeedMultiplier === 'function' ? getMoveSpeedMultiplier() : 1
            player.move(x * speed * moveMult * skillMove, y * speed * moveMult * skillMove)
            // clamp player inside world bounds to prevent leaving the map
            try {
                const halfW = player.width ? player.width * 0.5 : 16
                const halfH = player.height ? player.height * 0.5 : 16
                player.pos.x = Math.max(halfW, Math.min(player.pos.x, worldW - halfW))
                player.pos.y = Math.max(halfH, Math.min(player.pos.y, worldH - halfH))
            } catch (e) { }
            // expose facing if needed
            player.facing = facing
        }
        // Rotate player to face direction of fire (mouse cursor)
        const dir = getShootDir()
        const angle = dir.angle() * (3 / Math.PI)
        player.angle = angle + 90
    })
}
