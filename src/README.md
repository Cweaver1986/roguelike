# src/ README

This file describes the modules in `src/`, conventions used across the codebase, and quick debugging tips.

High-level
- The project uses Kaboom.js (global API) and splits functionality into small modules under `src/`.
- `src/entry.js` bootstraps Kaboom and loads assets, then imports `main.js` which calls `initMain()` in `src/mainController.js`.
- `mainController.js` composes systems and is the single place that wires global input handlers (pause, bombs), game lifecycle (spawn/restart), and coordination between subsystems.

Module map (brief)
- assets.js — lists sprites/sounds and exposes `loadAll()` to register assets with Kaboom.
- audio.js — small audio manager: master/music/sfx volumes and helpers for play/stop music.
- combat.js — auto-attack behavior; creates projectiles via `projectiles.spawnProjectile()`.
- controls.js — player movement and aiming input; clamps player to `worldW/worldH`.
- enemy.js — enemy spawn helper and `initEnemyAIWith()` to register enemy update logic.
- entry.js — bootstraps Kaboom and ensures assets are loaded before importing `main.js`.
- game.js — central game state (score, bombs, health, pause, game over) and injected callbacks via `initGame()`.
- hud.js — HUD rendering (score, hearts, bombs, XP bar, buff icons). Exposes `initHUD()`, `renderHearts()`, `renderBombs()`, `setScore()`, `updateXPUI()`, `spawnXPGem()`.
- keybinds.js — runtime keybind storage; `getBind()`/`setBind()`/`allBinds()`.
- mainController.js — composes everything and exposes `initMain()`.
- minimap.js — optional minimap overlay (`initMinimap()` returns a destroy handle).
- pauseMenu.js — draws the pause menu UI and exposes `togglePauseMenu()` and `isPauseOpen()`.
- player.js — `spawnPlayer()`, `getPlayer()`, `getShootDir()` helpers.
- powerups.js — spawn & activation helpers for magnet, firerate, movement, plus getters for remaining/duration.
- projectiles.js — manages projectile pool and lifecycle; `initProjectiles()` and `spawnProjectile()`.
- scene.js — builds the tiled background and starts `initWaves()`.
- score.js — score persistence and helpers (localStorage key `roguelike_score`).
- utils.js — small helpers like `playDebounced()`.
- waves.js — enemy wave manager and ambient sounds.
- xp.js — XP and leveling state; exposes `initXP()` and `addXP()`.

Conventions
- Modules prefer small, focused responsibilities and accept injected callbacks where they need to interact with game state (see `game.initGame()` usage).
- Entities are tagged with semantic tags (e.g., `"player"`, `"enemy"`, `"xpGem"`, `"powerup"`, `"projectile"`) and sometimes subtype tags (e.g., `"zombie"`).
- Use `fixed()` for HUD/UI elements so they render in screen space.
- Avoid global side-effects at import time; `entry.js` ensures Kaboom is initialized before `main.js` runs.

Debugging tips
- Open the browser console for logs. Most modules use `try` guards around optional features to avoid crashy behavior when assets are missing.
- Common interactive flows:
  - Pause: `mainController` owns the pause key handler and calls `togglePauseMenu()`.
  - Restart: `game.restartGame()` resets state and re-spawns initial enemies.
- If input seems not to work, ensure `entry.js` ran and Kaboom mounted the canvas. Focus issues (clicking outside canvas) can prevent key events from reaching Kaboom.

Want this README expanded?
- I can add example call sequences, public method signatures, or a `CONTRIBUTING.md` with formatting/linting rules.
