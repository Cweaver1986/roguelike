# Roguelike (Kaboom.js)

This is a small browser roguelike built with Kaboom.js. The project is split into modules under `src/` for easier development and maintenance.

Quick start

1. Open a PowerShell terminal in the project root:

	cd 'C:\Users\User\Desktop\roguelike'

2. Serve the folder with a simple static server (Python is an easy option):

	python -m http.server 8000

3. Open http://localhost:8000 in your browser.

Project structure (important files)
- `index.html` — game entry page
- `src/entry.js` — safe Kaboom bootstrap (initializes Kaboom and preloads assets)
- `src/mainController.js` — main orchestration; call `initMain()` to start the game
- `src/assets.js` — central asset list and loader
- `src/hud.js`, `src/player.js`, `src/enemy.js`, `src/projectiles.js`, `src/combat.js`, `src/controls.js`, `src/waves.js`, `src/scene.js`, `src/game.js`, `src/xp.js`, `src/utils.js` — feature modules

Running and developing
- The app runs entirely in the browser and doesn't need a backend. Serve the folder over HTTP and open `index.html`.
- Edit files in `src/` and reload the page to see changes.

Making a GitHub repository
1. git init; git add .; git commit -m "Initial commit"
2. Create a repo on GitHub and push:
	git remote add origin <your-repo-url>
	git branch -M main
	git push -u origin main

Files included for publishing
- `.gitignore` — ignores common artifacts like `node_modules/` and OS files.
- `package.json` — small developer convenience script: `npm run serve` runs a local static server using Python.

Notes & next steps
- No license file is included per author request.
- Optional improvements: CI for static checks, GitHub Pages deployment, or performance-focused pooling for enemies/projectiles.

If you'd like, I can add GitHub Actions, a deploy script, or wire score persistence before you push — tell me which and I'll add them.