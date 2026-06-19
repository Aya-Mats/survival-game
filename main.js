import { entities } from "./entities.js";
import { startGame } from "./gameState.js";
import { initializeInput } from "./input.js";
import { initializeUi } from "./ui.js";

const appElement = document.querySelector("#app");

initializeUi(appElement);
initializeInput();
startGame();

console.info("Survival Game initialized", {
    entityCount: entities.length,
});
