import { initMain } from "./src/mainController.js"
import { showStartMenu } from "./src/startMenu.js"

// Show the start menu; start the game when player presses Start
showStartMenu({
    onStart() {
        try { initMain() } catch (e) { }
    },
    onOptions() {
        // placeholder: show options menu later
        try { console.log('Options clicked') } catch (e) { }
    },
    onQuit() {
        try { console.log('Quit clicked (implement with Electron later)') } catch (e) { }
    }
})