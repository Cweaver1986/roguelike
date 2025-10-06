// mainController.js
// Composes all modules and exposes a single initMain() to start the game

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

export function initMain() {
    const PLAYER_SPEED = 120
    const ENEMY_SPEED = 75
    const ENEMY_PADDING = 64
    const INITIAL_ENEMIES = 5
    const w = width()
    const h = height()
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

    initScene({ w, h, spawnEnemy, zombieSounds, tileSize: 102, tileScale: 0.25, music: "spooky", musicVolume: 0.12, initialEnemies: INITIAL_ENEMIES, MAX_ENEMIES })

    game.initGame({ spawnPlayer: () => { player = spawnPlayer(); }, spawnEnemy: spawnEnemy, renderHearts: renderHearts, renderBombs: renderBombs, setScore: setScore, spawnXPGem: spawnXPGem, addXP: addXP, resetXP: resetXP, resetXPFill: resetXPFill, playDebounced: playDebounced, initialBombs: 3, initialHealth: 5, initialEnemies: INITIAL_ENEMIES })

    if (!player) player = spawnPlayer()
    // ensure player exists before spawning enemies
    if (player) {
        for (let i = 0; i < INITIAL_ENEMIES; i++) spawnEnemy()
    }

    initControls({ getPlayer, getShootDir, speed: PLAYER_SPEED })
    initAutoAttack(getPlayer, getShootDir, playDebounced)

    initEnemyAIWith(() => player, (enemy, playerEntity) => { game.playerHitByEnemy(enemy, playerEntity) }, { ENEMY_SPEED })

    onKeyPress("b", () => { game.handleBombPress() })
    onCollide("projectile", "enemy", (p, e) => { game.handleProjectileEnemyCollision(p, e) })
    onCollide("player", "xpGem", (p, g) => { game.handlePlayerPickupXP(p, g) })
}
