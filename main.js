(function startSurvivalGame(global) {
    const game = global.SurvivalGame;
    const stateTools = game.state;
    const entities = game.entities;
    const input = game.input;
    const uiTools = game.ui;

    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");

    let ui = null;
    let state = null;
    let last = performance.now();
    let paused = false;

    function toast(message) {
        uiTools.showToast(ui, message);
    }

    function log(message) {
        uiTools.writeLog(ui, message);
    }

    function restart() {
        state = stateTools.createState();
        paused = false;
        last = performance.now();
        uiTools.hideGameOver(ui);
        uiTools.clearLog(ui);
        uiTools.setPaused(ui, paused);
        log("目が覚めた。まずは木と石を集めよう。");
        toast("サバイバル開始");
    }

    function togglePause() {
        paused = !paused;
        uiTools.setPaused(ui, paused);
        toast(paused ? "一時停止中" : "再開");
    }

    function gather() {
        const player = state.player;
        const resource = entities.nearestResource(state);

        if (!resource) {
            toast("近くに採れるものがない");
            return;
        }

        if (player.stamina < 9) {
            toast("スタミナ不足。少し休もう");
            return;
        }

        player.stamina -= 9;
        resource.hp -= 1;

        if (resource.type === "tree") toast("木を切った");
        if (resource.type === "rock") toast("石を叩いた");
        if (resource.type === "bush") toast("ベリーを摘んだ");

        if (resource.hp > 0) return;

        if (resource.type === "tree") {
            state.inv.wood += 2 + Math.floor(Math.random() * 2);
            log("木材を手に入れた。");
        }

        if (resource.type === "rock") {
            state.inv.stone += 2 + Math.floor(Math.random() * 2);
            log("石を手に入れた。");
        }

        if (resource.type === "bush") {
            state.inv.berries += 2 + Math.floor(Math.random() * 3);
            log("ベリーを手に入れた。");
        }

        state.resources.splice(state.resources.indexOf(resource), 1);
    }

    function attack() {
        const player = state.player;

        if (player.attackCd > 0) return;

        if (player.stamina < 14) {
            toast("攻撃するスタミナがない");
            return;
        }

        player.stamina -= 14;
        player.attackCd = 0.35;

        const enemy = entities.nearestEnemy(state, 62);
        if (!enemy) {
            toast("空振り");
            return;
        }

        enemy.hp -= 1;
        enemy.vx = (enemy.x - player.x) * 1.8;
        enemy.vy = (enemy.y - player.y) * 1.8;
        toast("敵を追い払った");

        if (enemy.hp > 0) return;

        state.enemies.splice(state.enemies.indexOf(enemy), 1);
        log("夜の影を倒した。");

        if (Math.random() < 0.35) {
            state.inv.berries += 1;
            log("ベリーを拾った。");
        }
    }

    function eatBerry() {
        if (state.inv.berries <= 0) {
            toast("ベリーがない");
            return;
        }

        state.inv.berries -= 1;
        state.player.hunger = stateTools.clamp(state.player.hunger + 24, 0, 100);
        state.player.hp = stateTools.clamp(state.player.hp + 3, 0, 100);
        toast("ベリーを食べた");
    }

    function craftCampfire() {
        const inv = state.inv;

        if (inv.wood < 5 || inv.stone < 3) {
            toast("焚き火には木材5・石3が必要");
            return;
        }

        inv.wood -= 5;
        inv.stone -= 3;
        state.structures.push({
            type: "campfire",
            x: state.player.x + stateTools.rand(-26, 26),
            y: state.player.y + stateTools.rand(-26, 26),
            life: 70,
        });
        log("焚き火を作った。夜が少し安全になる。");
        toast("焚き火クラフト");
    }

    function craftHut() {
        const inv = state.inv;

        if (inv.wood < 16 || inv.stone < 10) {
            toast("小屋には木材16・石10が必要");
            return;
        }

        inv.wood -= 16;
        inv.stone -= 10;
        state.structures.push({
            type: "hut",
            x: state.player.x + 42,
            y: state.player.y,
            life: Infinity,
        });
        log("小屋を建てた。近くにいると安心だ。");
        toast("小屋クラフト");
    }

    function handleActions() {
        for (const action of input.consumeActions()) {
            if (action === "restart") {
                restart();
                continue;
            }

            if (action === "pause") {
                togglePause();
                continue;
            }

            if (paused || state.gameOver) continue;

            if (action === "gather") gather();
            if (action === "attack") attack();
            if (action === "eat") eatBerry();
            if (action === "campfire") craftCampfire();
            if (action === "hut") craftHut();
        }
    }

    function updateTimeAndResources(dt) {
        state.time += dt;
        state.survivedSeconds += dt;

        const newDay = Math.floor(state.time / 60);
        if (newDay <= state.day) return;

        state.day = newDay;
        log(`${state.day}日目の朝。まだ生きている。`);

        if (state.resources.length >= 280) return;

        for (let i = 0; i < 18; i += 1) {
            const roll = Math.random();
            const type = roll < 0.45 ? "tree" : roll < 0.7 ? "bush" : "rock";
            state.resources.push(stateTools.createResource(type));
        }
    }

    function updatePlayer(dt) {
        const player = state.player;
        const movement = input.getMovementVector();
        const moving = movement.x !== 0 || movement.y !== 0;

        if (moving) {
            const sprint = input.isSprinting() && player.stamina > 5;
            const speed = player.speed * (sprint ? 1.45 : 1);
            player.x += movement.x * speed * dt;
            player.y += movement.y * speed * dt;
            player.stamina -= (sprint ? 16 : 5) * dt;
        } else {
            player.stamina += 18 * dt;
        }

        player.x = stateTools.clamp(player.x, player.r, stateTools.WORLD_W * stateTools.TILE - player.r);
        player.y = stateTools.clamp(player.y, player.r, stateTools.WORLD_H * stateTools.TILE - player.r);
        player.stamina = stateTools.clamp(player.stamina, 0, 100);

        player.hunger -= (stateTools.isNight(state) ? 1.15 : 0.72) * dt;
        if (player.hunger <= 0) player.hp -= 5.5 * dt;
        player.hunger = stateTools.clamp(player.hunger, 0, 100);
        player.attackCd = Math.max(0, player.attackCd - dt);
        player.invuln = Math.max(0, player.invuln - dt);
    }

    function updateStructures(dt) {
        for (const structure of state.structures) {
            if (structure.life !== Infinity) {
                structure.life -= dt;
            }
        }

        state.structures = state.structures.filter((structure) => structure.life > 0);
    }

    function updateEnemySpawns(dt) {
        if (stateTools.isNight(state)) {
            state.spawnTimer -= dt;
            const cap = 3 + state.day;

            if (state.spawnTimer <= 0 && state.enemies.length < cap) {
                entities.spawnEnemy(state);
                state.spawnTimer = Math.max(1.6, 4.8 - state.day * 0.35);
            }
            return;
        }

        state.spawnTimer = 2.5;
        if (state.enemies.length > 0 && Math.random() < 0.02) {
            state.enemies.pop();
        }
    }

    function updateEnemies(dt) {
        const player = state.player;

        for (const enemy of state.enemies) {
            let repelX = 0;
            let repelY = 0;

            for (const structure of state.structures) {
                if (structure.type !== "campfire") continue;

                const distance = Math.hypot(enemy.x - structure.x, enemy.y - structure.y);
                if (distance < 150) {
                    repelX += ((enemy.x - structure.x) / Math.max(distance, 1)) * 115;
                    repelY += ((enemy.y - structure.y) / Math.max(distance, 1)) * 115;
                }
            }

            const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y) || 1;
            const chase = stateTools.isNight(state) ? 62 + state.day * 4 : 22;
            enemy.vx += (((player.x - enemy.x) / distance) * chase + repelX - enemy.vx) * 2.6 * dt;
            enemy.vy += (((player.y - enemy.y) / distance) * chase + repelY - enemy.vy) * 2.6 * dt;
            enemy.x += enemy.vx * dt;
            enemy.y += enemy.vy * dt;

            if (distance < player.r + enemy.r + 3 && player.invuln <= 0) {
                let damage = 9;
                const nearHut = state.structures.some((structure) => structure.type === "hut" && Math.hypot(player.x - structure.x, player.y - structure.y) < 95);

                if (nearHut) damage *= 0.45;

                player.hp -= damage;
                player.invuln = 0.8;
                log(nearHut ? "小屋のおかげで被害を抑えた。" : "夜の影に襲われた。");
            }
        }
    }

    function updateGameOver() {
        if (state.player.hp > 0) return;

        state.player.hp = 0;
        state.gameOver = true;
        uiTools.showGameOver(ui, state);
    }

    function update(dt) {
        handleActions();
        if (paused || state.gameOver) return;

        updateTimeAndResources(dt);
        updatePlayer(dt);
        updateStructures(dt);
        updateEnemySpawns(dt);
        updateEnemies(dt);
        updateGameOver();
    }

    function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;

        update(dt);
        entities.render(ctx, canvas, state, paused);
        uiTools.syncUi(ui, state);
        requestAnimationFrame(loop);
    }

    function initialize() {
        if (!canvas || !ctx) {
            throw new Error("Game canvas was not found.");
        }

        ui = uiTools.initializeUi();
        input.initializeInput();
        restart();
        requestAnimationFrame(loop);
    }

    initialize();
})(window);
