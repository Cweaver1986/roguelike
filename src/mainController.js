// mainController.js — composes modules and starts the game (initMain)

import { zombieSounds } from "./assets.js"
import { initHUD, renderHearts, renderBombs, setScore, updateXPUI as hudUpdateXPUI, resetXPFill, spawnXPGem as spawnXPGemHUD } from "./hud.js"
import { playDebounced } from "./utils.js"
import { spawnPlayer, getPlayer, getShootDir } from "./player.js"
import { initAutoAttack } from "./combat.js"
import { initXP, addXP, resetXP } from "./xp.js"
import { spawnEnemy as spawnEnemyMod, initEnemyAIWith } from "./enemy.js"
import * as game from "./game.js"
import { initScene } from "./scene.js"
import { initControls } from "./controls.js"
import { initWaves } from "./waves.js"
import { initScore, addScore } from "./score.js"
import { togglePauseMenu, isPauseOpen } from "./pauseMenu.js"
import * as audio from "./audio.js"
import * as keybinds from "./keybinds.js"
import * as gamestate from "./game.js"
import * as powerups from "./powerups.js"

export function initMain() {
    const PLAYER_SPEED = 120
    const ENEMY_SPEED = 75
    const ENEMY_PADDING = 64
    const INITIAL_ENEMIES = 5
    // MAP_SCALE controls how many viewports the world spans. 1 = same as
    // viewport size. 2 = twice the width and height, etc. Change this to grow
    // or shrink the world size.
    const MAP_SCALE = 3
    const vw = width()
    const vh = height()
    const w = vw * MAP_SCALE
    const h = vh * MAP_SCALE
    const MAX_ENEMIES = 25

    // local player reference used by spawn and AI wiring
    let player = null

    initXP(hudUpdateXPUI)
    initHUD()

    function spawnXPGem(atPos) { spawnXPGemHUD(atPos) }

    function spawnEnemy() {
        // don't spawn if game over or player isn't ready
        if (game.isGameOver() || !player) return
        spawnEnemyMod({ playerRef: player, ENEMY_PADDING, w, h })
    }

    // Provide world dimensions to the scene so it tiles the background over
    // the full map area.
    initScene({ worldW: w, worldH: h, spawnEnemy, zombieSounds, tileSize: 102, tileScale: 0.25, music: "spooky", musicVolume: 0.12, initialEnemies: INITIAL_ENEMIES, MAX_ENEMIES })

    // provide spawnPowerups so game.restart can respawn them
    const spawnPowerups = () => {
        for (let i = 0; i < 3; i++) {
            const px = rand(60, w - 60)
            const py = rand(60, h - 60)
            powerups.spawnMagnet(vec2(px, py))
        }
        // also spawn 3 firerate pickups
        for (let i = 0; i < 3; i++) {
            const px = rand(60, w - 60)
            const py = rand(60, h - 60)
            powerups.spawnFirerate(vec2(px, py))
        }
        // spawn 3 movement speed pickups
        for (let i = 0; i < 3; i++) {
            const px = rand(60, w - 60)
            const py = rand(60, h - 60)
            powerups.spawnMovement(vec2(px, py))
        }
    }

    game.initGame({ spawnPlayer: () => { player = spawnPlayer(); }, spawnEnemy: spawnEnemy, renderHearts: renderHearts, renderBombs: renderBombs, setScore: setScore, spawnXPGem: spawnXPGem, addXP: addXP, resetXP: resetXP, resetXPFill: resetXPFill, playDebounced: playDebounced, initialBombs: 3, initialHealth: 5, initialEnemies: INITIAL_ENEMIES, spawnPowerups })

    // Spawn player near the center of the world (not the viewport center when
    // MAP_SCALE > 1).
    if (!player) player = spawnPlayer({ x: w / 2, y: h / 2 })
    // ensure player exists before spawning enemies
    if (player) {
        for (let i = 0; i < INITIAL_ENEMIES; i++) spawnEnemy()
    }

    // initialize minimal powerups system; powerups will be spawned via game.initGame -> spawnPowerups
    powerups.initPowerups(() => getPlayer())

    initControls({ getPlayer, getShootDir, speed: PLAYER_SPEED, worldW: w, worldH: h })
    initAutoAttack(getPlayer, getShootDir, playDebounced)

    // initialize projectile bounds culling
    import("./projectiles.js").then(mod => {
        try { mod.initProjectiles({ worldW: w, worldH: h }) } catch (e) { }
    }).catch(() => { })

    initEnemyAIWith(() => player, (zombie, playerEntity) => { game.playerHitByEnemy(zombie, playerEntity) }, { ENEMY_SPEED })

    const bombKey = keybinds.getBind('bomb') || 'b'
    onKeyPress(bombKey, () => { if (!gamestate.isPaused()) game.handleBombPress() })
    // Pause toggle (uses keybinds.pause by default)
    const pauseKey = keybinds.getBind('pause') || 'escape'
    onKeyPress(pauseKey, () => {
        if (!gamestate.isPaused()) {
            gamestate.pauseGame()
            togglePauseMenu()
        } else {
            gamestate.resumeGame()
            togglePauseMenu()
        }
    })
    onCollide("projectile", "enemy", (p, e) => { game.handleProjectileEnemyCollision(p, e) })
    onCollide("player", "xpGem", (p, g) => { game.handlePlayerPickupXP(p, g) })
    onCollide("player", "powerup", (pl, pw) => {
        try {
            if (pw.type === 'magnet') powerups.activateMagnet()
            if (pw.type === 'firerate') powerups.activateFirerate(10)
            if (pw.type === 'movement') powerups.activateMovement(10)
        } catch (e) { }
        try { destroy(pw) } catch (e) { }
    })

    // Camera: smooth follow (lerp) and clamp to world bounds. The `lerp`
    // parameter controls how snappy the camera is: 1 = instant, 0 = frozen.
    const CAMERA_LERP = 0.12
    onUpdate(() => {
        const pl = getPlayer()
        if (!pl) return
        // desired target: centered on player
        const target = pl.pos
        // current camera position
        const cur = camPos()
        // compute unclamped lerp target
        const lerpX = cur.x + (target.x - cur.x) * CAMERA_LERP
        const lerpY = cur.y + (target.y - cur.y) * CAMERA_LERP

        // Clamp camera so it doesn't show outside the world
        const halfW = vw / 2
        const halfH = vh / 2
        const cx = Math.max(halfW, Math.min(lerpX, w - halfW))
        const cy = Math.max(halfH, Math.min(lerpY, h - halfH))
        camPos(vec2(cx, cy))
    })

    // If a minimap module is present, initialize it and allow it to update on each frame.
    let minimap = null
    // dynamic import without await so we avoid making this function async.
    import("./minimap.js").then(mod => {
        try {
            minimap = mod.initMinimap({ worldW: w, worldH: h, vw, vh })
        } catch (e) { /* ignore init failure */ }
    }).catch(() => { /* minimap optional */ })
}
