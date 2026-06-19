import { startGame } from "./gameState.js";
import { initializeInput } from "./input.js";
import { initializeUi } from "./ui.js";

const appElement = document.querySelector("#app");

initializeUi(appElement);
initializeInput();
startGame();
