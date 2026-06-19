(function setupUi(global) {
    const game = global.SurvivalGame || (global.SurvivalGame = {});
    let toastTimer = 0;

    function byId(id) {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required element #${id} was not found.`);
        }
        return element;
    }

    function initializeUi() {
        return {
            hpText: byId("hpText"),
            hungerText: byId("hungerText"),
            staminaText: byId("staminaText"),
            hpBar: byId("hpBar"),
            hungerBar: byId("hungerBar"),
            staminaBar: byId("staminaBar"),
            wood: byId("wood"),
            stone: byId("stone"),
            berries: byId("berries"),
            days: byId("days"),
            log: byId("log"),
            toast: byId("toast"),
            gameOver: byId("gameOver"),
            finalText: byId("finalText"),
            pauseBtn: byId("pauseBtn"),
        };
    }

    function percent(value) {
        return `${Math.round(game.state.clamp(value, 0, 100))}%`;
    }

    function syncUi(ui, state) {
        const player = state.player;

        ui.hpText.textContent = Math.round(player.hp);
        ui.hungerText.textContent = Math.round(player.hunger);
        ui.staminaText.textContent = Math.round(player.stamina);
        ui.hpBar.style.width = percent(player.hp);
        ui.hungerBar.style.width = percent(player.hunger);
        ui.staminaBar.style.width = percent(player.stamina);
        ui.wood.textContent = state.inv.wood;
        ui.stone.textContent = state.inv.stone;
        ui.berries.textContent = state.inv.berries;
        ui.days.textContent = state.day;
    }

    function writeLog(ui, message) {
        const item = document.createElement("div");
        item.textContent = `・${message}`;
        ui.log.prepend(item);

        while (ui.log.children.length > 7) {
            ui.log.lastChild.remove();
        }
    }

    function clearLog(ui) {
        ui.log.textContent = "";
    }

    function showToast(ui, message) {
        ui.toast.textContent = message;
        ui.toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 1100);
    }

    function setPaused(ui, paused) {
        ui.pauseBtn.textContent = paused ? "再開" : "一時停止";
    }

    function hideGameOver(ui) {
        ui.gameOver.classList.remove("show");
    }

    function showGameOver(ui, state) {
        ui.finalText.textContent = `${state.day}日と${Math.floor(state.time % 60)}秒、生き延びました。`;
        ui.gameOver.classList.add("show");
    }

    game.ui = {
        initializeUi,
        syncUi,
        writeLog,
        clearLog,
        showToast,
        setPaused,
        hideGameOver,
        showGameOver,
    };
})(window);
