(function setupInput(global) {
    const game = global.SurvivalGame || (global.SurvivalGame = {});
    const keys = new Set();
    const actions = [];
    const touchVector = { x: 0, y: 0 };

    let stick = null;
    let thumb = null;
    let activePointerId = null;

    const actionKeys = {
        e: "gather",
        " ": "attack",
        spacebar: "attack",
        f: "eat",
        c: "campfire",
        h: "hut",
        p: "pause",
    };

    function queueAction(action) {
        actions.push(action);
    }

    function initializeInput() {
        stick = document.getElementById("touchStick");
        thumb = document.getElementById("stickThumb");

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);

        for (const button of document.querySelectorAll("[data-action]")) {
            button.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                queueAction(button.dataset.action);
            });
        }

        if (stick && thumb) {
            stick.addEventListener("pointerdown", handleStickStart);
            stick.addEventListener("pointermove", handleStickMove);
            stick.addEventListener("pointerup", handleStickEnd);
            stick.addEventListener("pointercancel", handleStickEnd);
            stick.addEventListener("lostpointercapture", handleStickEnd);
        }
    }

    function handleKeyDown(event) {
        const key = event.key.toLowerCase();

        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "spacebar"].includes(key)) {
            event.preventDefault();
        }

        keys.add(key);

        if (!event.repeat && actionKeys[key]) {
            queueAction(actionKeys[key]);
        }
    }

    function handleKeyUp(event) {
        keys.delete(event.key.toLowerCase());
    }

    function handleStickStart(event) {
        activePointerId = event.pointerId;
        stick.setPointerCapture(activePointerId);
        updateStick(event);
    }

    function handleStickMove(event) {
        if (event.pointerId !== activePointerId) return;
        updateStick(event);
    }

    function handleStickEnd(event) {
        if (activePointerId !== null && event.pointerId !== activePointerId) return;

        activePointerId = null;
        touchVector.x = 0;
        touchVector.y = 0;
        moveThumb(0, 0);
    }

    function updateStick(event) {
        const rect = stick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxDistance = rect.width * 0.34;
        let dx = event.clientX - centerX;
        let dy = event.clientY - centerY;
        const length = Math.hypot(dx, dy);

        if (length > maxDistance) {
            dx = (dx / length) * maxDistance;
            dy = (dy / length) * maxDistance;
        }

        touchVector.x = dx / maxDistance;
        touchVector.y = dy / maxDistance;
        moveThumb(dx, dy);
    }

    function moveThumb(x, y) {
        if (!thumb) return;
        thumb.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    function getMovementVector() {
        let x = touchVector.x;
        let y = touchVector.y;

        if (keys.has("a") || keys.has("arrowleft")) x -= 1;
        if (keys.has("d") || keys.has("arrowright")) x += 1;
        if (keys.has("w") || keys.has("arrowup")) y -= 1;
        if (keys.has("s") || keys.has("arrowdown")) y += 1;

        const length = Math.hypot(x, y);
        if (length > 1) {
            x /= length;
            y /= length;
        }

        return { x, y };
    }

    function isSprinting() {
        return keys.has("shift");
    }

    function consumeActions() {
        return actions.splice(0, actions.length);
    }

    game.input = {
        initializeInput,
        getMovementVector,
        isSprinting,
        consumeActions,
    };
})(window);
