# Roguelike (Kaboom.js)

A small browser roguelike made with Kaboom.js. Drop the folder on a static web server (or open `index.html` in a modern browser) to play.

Contents
- `index.html` — game entry page
- `main.js` — game logic (Kaboom.js)
- `assets*` folders — sprites and sounds used by the game

Quick start (PowerShell)

# Initialize and open locally
# You can serve the folder with a simple static server. If you have Python:
python -m http.server 8000

# Then open http://localhost:8000 in your browser

How to publish to GitHub
1. Initialize a git repo and commit the files.
2. Create a repository on GitHub (via web UI or `gh repo create`).
3. Add the remote and push (example commands are below).

Notes
- This project uses Kaboom from the CDN (import in `main.js`).
- If you move assets, update the paths in `main.js` accordingly.