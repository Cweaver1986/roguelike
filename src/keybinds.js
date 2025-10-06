// keybinds.js — simple runtime keybinding storage

const defaults = {
    moveLeft: 'a',
    moveRight: 'd',
    moveUp: 'w',
    moveDown: 's',
    bomb: 'b',
    pause: 'escape'
}

let binds = Object.assign({}, defaults)

export function getBind(action) { return binds[action] }
export function setBind(action, key) { binds[action] = key }
export function resetBinds() { binds = Object.assign({}, defaults) }

export function allBinds() { return Object.assign({}, binds) }
