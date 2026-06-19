const pressedKeys = new Set();
const activeTouches = new Map();

export function initializeInput() {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
}

export function getInputState() {
    return {
        keys: new Set(pressedKeys),
        touches: new Map(activeTouches),
    };
}

function handleKeyDown(event) {
    pressedKeys.add(event.code);
}

function handleKeyUp(event) {
    pressedKeys.delete(event.code);
}

function handleTouchStart(event) {
    updateTouches(event.changedTouches);
}

function handleTouchMove(event) {
    updateTouches(event.changedTouches);
}

function handleTouchEnd(event) {
    for (const touch of event.changedTouches) {
        activeTouches.delete(touch.identifier);
    }
}

function updateTouches(touches) {
    for (const touch of touches) {
        activeTouches.set(touch.identifier, {
            x: touch.clientX,
            y: touch.clientY,
        });
    }
}
