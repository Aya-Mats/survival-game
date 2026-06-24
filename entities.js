(function setupEntities(global) {
    const game = global.SurvivalGame || (global.SurvivalGame = {});
    const {
        TILE,
        WORLD_W,
        WORLD_H,
        rand,
        clamp,
        isNight,
        getTimeLabel,
    } = game.state;

    const PIXEL = 4;

    function nearestResource(state, range = 46) {
        let best = null;
        let bestDistance = Infinity;

        for (const resource of state.resources) {
            const distance = Math.hypot(resource.x - state.player.x, resource.y - state.player.y);
            if (distance < range && distance < bestDistance) {
                best = resource;
                bestDistance = distance;
            }
        }

        return best;
    }

    function nearestEnemy(state, range = 54) {
        let best = null;
        let bestDistance = Infinity;

        for (const enemy of state.enemies) {
            const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
            if (distance < range && distance < bestDistance) {
                best = enemy;
                bestDistance = distance;
            }
        }

        return best;
    }

    function spawnEnemy(state) {
        const player = state.player;
        const angle = rand(0, Math.PI * 2);
        const distance = rand(360, 620);

        state.enemies.push({
            x: clamp(player.x + Math.cos(angle) * distance, 40, WORLD_W * TILE - 40),
            y: clamp(player.y + Math.sin(angle) * distance, 40, WORLD_H * TILE - 40),
            r: 12,
            hp: 2,
            vx: 0,
            vy: 0,
        });
    }

    function roundRect(ctx, x, y, width, height, radius) {
        if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, width, height, radius);
            return;
        }

        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
    }

    function snap(value) {
        return Math.round(value / PIXEL) * PIXEL;
    }

    function px(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(snap(x), snap(y), width, height);
    }

    function groundPx(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
    }

    function drawPixelShadow(ctx, x, y, width, height, alpha = 0.22) {
        ctx.fillStyle = `rgba(43, 31, 21, ${alpha})`;
        ctx.fillRect(snap(x - width / 2), snap(y - height / 2), width, height);
        ctx.fillRect(snap(x - width / 2 + 4), snap(y - height / 2 + height), width - 8, 4);
    }

    function drawGround(ctx, canvas, camX, camY) {
        ctx.fillStyle = "#6f9d55";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const startX = Math.floor(camX / TILE) - 1;
        const endX = Math.ceil((camX + canvas.width) / TILE) + 1;
        const startY = Math.floor(camY / TILE) - 1;
        const endY = Math.ceil((camY + canvas.height) / TILE) + 1;

        for (let gy = startY; gy < endY; gy += 1) {
            for (let gx = startX; gx < endX; gx += 1) {
                if (gx < 0 || gy < 0 || gx >= WORLD_W || gy >= WORLD_H) continue;

                const x = gx * TILE - camX;
                const y = gy * TILE - camY;
                const seed = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
                const noise = seed - Math.floor(seed);
                const base = noise > 0.66 ? "#7eaa5b" : noise > 0.32 ? "#6f9d55" : "#638f4d";

                groundPx(ctx, x, y, TILE + 1, TILE + 1, base);

                if (noise > 0.78) {
                    groundPx(ctx, x + 6, y + 9, 4, 10, "#8fbc65");
                    groundPx(ctx, x + 10, y + 13, 4, 6, "#4f7f40");
                    groundPx(ctx, x + 22, y + 22, 4, 6, "#8fbc65");
                } else if (noise < 0.18) {
                    groundPx(ctx, x + 4, y + 24, 8, 4, "#527d44");
                    groundPx(ctx, x + 20, y + 6, 4, 4, "#91b96f");
                }
            }
        }
    }

    function drawTree(ctx, x, y) {
        drawPixelShadow(ctx, x, y + 21, 34, 8, 0.18);
        px(ctx, x - 8, y + 5, 16, 28, "#8a5a32");
        px(ctx, x - 4, y + 5, 8, 28, "#a36b3c");
        px(ctx, x - 12, y + 25, 24, 8, "#5f3f25");

        px(ctx, x - 24, y - 23, 48, 16, "#2f6f3c");
        px(ctx, x - 32, y - 11, 64, 20, "#3d8747");
        px(ctx, x - 24, y + 5, 48, 16, "#2f6f3c");
        px(ctx, x - 12, y - 31, 24, 8, "#77ad5a");
        px(ctx, x + 12, y - 11, 16, 8, "#77ad5a");
        px(ctx, x - 28, y - 3, 12, 8, "#24542f");
    }

    function drawRock(ctx, x, y) {
        drawPixelShadow(ctx, x, y + 18, 36, 8, 0.2);
        px(ctx, x - 20, y + 2, 8, 16, "#53606d");
        px(ctx, x - 12, y - 10, 24, 28, "#7b8794");
        px(ctx, x + 12, y - 2, 12, 20, "#647281");
        px(ctx, x - 4, y - 18, 16, 8, "#9aa6b2");
        px(ctx, x - 8, y - 6, 12, 8, "#b8c2cc");
        px(ctx, x + 8, y + 10, 8, 8, "#475360");
    }

    function drawBush(ctx, x, y) {
        drawPixelShadow(ctx, x, y + 17, 34, 8, 0.17);
        px(ctx, x - 20, y, 40, 20, "#347d43");
        px(ctx, x - 12, y - 12, 24, 16, "#4b9a54");
        px(ctx, x - 24, y + 8, 12, 12, "#2d6d3c");
        px(ctx, x + 12, y + 8, 12, 12, "#2d6d3c");
        px(ctx, x - 8, y - 4, 4, 4, "#ef6f73");
        px(ctx, x + 8, y, 4, 4, "#f7a1a4");
        px(ctx, x, y + 8, 4, 4, "#dc4f5b");
        px(ctx, x - 14, y + 10, 4, 4, "#f7a1a4");
    }

    function drawResource(ctx, state, resource, x, y) {
        const bob = Math.round(Math.sin(state.time * 2 + resource.bob) * 1.5);
        const drawY = y + bob;

        if (resource.type === "tree") {
            drawTree(ctx, x, drawY);
        } else if (resource.type === "rock") {
            drawRock(ctx, x, drawY);
        } else {
            drawBush(ctx, x, drawY);
        }

        if (resource.hp < resource.maxHp) {
            px(ctx, x - 18, drawY - 34, 36, 6, "rgba(43, 31, 21, 0.45)");
            px(ctx, x - 16, drawY - 32, 32 * (resource.hp / resource.maxHp), 2, "#f6d365");
        }
    }

    function drawCampfire(ctx, state, x, y) {
        const glow = 56 + Math.sin(state.time * 8) * 8;
        const gradient = ctx.createRadialGradient(x, y, 4, x, y, glow);
        gradient.addColorStop(0, "rgba(255, 207, 92, 0.34)");
        gradient.addColorStop(1, "rgba(255, 207, 92, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glow, 0, Math.PI * 2);
        ctx.fill();

        drawPixelShadow(ctx, x, y + 18, 38, 8, 0.18);
        px(ctx, x - 20, y + 14, 40, 8, "#653923");
        px(ctx, x - 12, y + 6, 24, 8, "#8d4b2d");
        px(ctx, x - 8, y - 14, 16, 28, "#f26a2e");
        px(ctx, x - 12, y - 6, 8, 16, "#ff9e3d");
        px(ctx, x + 4, y - 2, 8, 16, "#ffbf4e");
        px(ctx, x - 4, y - 10, 8, 16, "#ffe27a");
    }

    function drawHut(ctx, x, y) {
        drawPixelShadow(ctx, x, y + 30, 66, 10, 0.22);
        px(ctx, x - 28, y - 4, 56, 36, "#a66a3f");
        px(ctx, x - 24, y, 48, 28, "#c48652");
        px(ctx, x - 36, y - 12, 72, 12, "#7f3f2a");
        px(ctx, x - 28, y - 24, 56, 12, "#934a31");
        px(ctx, x - 16, y - 36, 32, 12, "#a85b38");
        px(ctx, x - 8, y + 12, 16, 20, "#54331f");
        px(ctx, x + 12, y + 8, 12, 12, "#f3d7a1");
        px(ctx, x + 16, y + 12, 4, 8, "#7fb1b4");
        px(ctx, x - 24, y + 6, 12, 4, "#8a5635");
        px(ctx, x - 24, y + 18, 12, 4, "#8a5635");
    }

    function drawStructure(ctx, state, structure, x, y) {
        if (structure.type === "campfire") {
            drawCampfire(ctx, state, x, y);
            return;
        }

        drawHut(ctx, x, y);
    }

    function drawPlayer(ctx, state, player, x, y) {
        if (player.invuln > 0 && Math.floor(state.time * 18) % 2 === 0) return;

        drawPixelShadow(ctx, x, y + 17, 28, 8, 0.24);
        px(ctx, x - 8, y - 22, 16, 12, "#f2c49b");
        px(ctx, x - 12, y - 14, 24, 8, "#6b3f2a");
        px(ctx, x - 8, y - 26, 16, 8, "#6b3f2a");
        px(ctx, x - 10, y - 6, 20, 22, "#d85f8f");
        px(ctx, x - 6, y - 2, 12, 14, "#f08bb2");
        px(ctx, x - 14, y - 2, 4, 16, "#f2c49b");
        px(ctx, x + 10, y - 2, 4, 16, "#f2c49b");
        px(ctx, x - 8, y + 16, 6, 14, "#3f5f8a");
        px(ctx, x + 2, y + 16, 6, 14, "#3f5f8a");
        px(ctx, x - 4, y - 16, 4, 4, "#2f241c");
        px(ctx, x + 4, y - 16, 4, 4, "#2f241c");

        if (player.attackCd > 0.15) {
            px(ctx, x + 14, y - 12, 24, 4, "#fef3c7");
            px(ctx, x + 34, y - 8, 8, 8, "#fff7ed");
            px(ctx, x + 18, y - 4, 16, 4, "#facc15");
        }
    }

    function drawEnemy(ctx, enemy, x, y) {
        drawPixelShadow(ctx, x, y + 17, 30, 8, 0.3);
        px(ctx, x - 14, y - 18, 28, 36, "#3b175c");
        px(ctx, x - 18, y - 6, 36, 20, "#4c1d73");
        px(ctx, x - 10, y - 26, 20, 12, "#2e1248");
        px(ctx, x - 8, y - 8, 4, 4, "#f0d5ff");
        px(ctx, x + 6, y - 8, 4, 4, "#f0d5ff");
        px(ctx, x - 12, y + 16, 8, 8, "#241034");
        px(ctx, x + 4, y + 16, 8, 8, "#241034");
    }

    function drawHudOverlay(ctx, state) {
        ctx.save();
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "bold 18px system-ui";
        ctx.fillStyle = "rgba(54, 39, 28, 0.76)";
        ctx.beginPath();
        roundRect(ctx, 14, 14, 212, 76, 10);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 238, 194, 0.28)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#fff4d6";
        ctx.fillText(`${getTimeLabel(state)} / ${state.day + 1}日目`, 28, 26);
        ctx.font = "13px system-ui";
        ctx.fillStyle = isNight(state) ? "#fecaca" : "#dcfce7";
        ctx.fillText(isNight(state) ? "夜: 敵が近づく。火の近くへ" : "昼: 採取とクラフトの時間", 28, 56);
        ctx.restore();
    }

    function render(ctx, canvas, state, paused) {
        ctx.imageSmoothingEnabled = false;

        const player = state.player;
        const camX = clamp(player.x - canvas.width / 2, 0, WORLD_W * TILE - canvas.width);
        const camY = clamp(player.y - canvas.height / 2, 0, WORLD_H * TILE - canvas.height);

        drawGround(ctx, canvas, camX, camY);

        const visibleResources = state.resources
            .filter((resource) => resource.x > camX - 70 && resource.x < camX + canvas.width + 70 && resource.y > camY - 70 && resource.y < camY + canvas.height + 70)
            .sort((a, b) => a.y - b.y);

        const drawables = [
            ...visibleResources.map((item) => ({ kind: "resource", item, y: item.y })),
            ...state.structures.map((item) => ({ kind: "structure", item, y: item.y })),
            ...state.enemies.map((item) => ({ kind: "enemy", item, y: item.y })),
            { kind: "player", item: player, y: player.y },
        ].sort((a, b) => a.y - b.y);

        for (const drawable of drawables) {
            const x = drawable.item.x - camX;
            const y = drawable.item.y - camY;

            if (drawable.kind === "resource") drawResource(ctx, state, drawable.item, x, y);
            if (drawable.kind === "structure") drawStructure(ctx, state, drawable.item, x, y);
            if (drawable.kind === "enemy") drawEnemy(ctx, drawable.item, x, y);
            if (drawable.kind === "player") drawPlayer(ctx, state, drawable.item, x, y);
        }

        const target = nearestResource(state);
        if (target) {
            ctx.strokeStyle = "rgba(255, 244, 214, 0.85)";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(snap(target.x - camX - 28), snap(target.y - camY - 32), 56, 64);
            ctx.setLineDash([]);
        }

        if (isNight(state)) {
            const alpha = 0.38 + Math.sin(state.time * 0.8) * 0.05;
            ctx.fillStyle = `rgba(19, 24, 58, ${alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (state.time % 60 > 30) {
            ctx.fillStyle = `rgba(180, 99, 43, ${((state.time % 60) - 30) / 9 * 0.13})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        drawHudOverlay(ctx, state);

        if (paused && !state.gameOver) {
            ctx.fillStyle = "rgba(43, 31, 21, 0.58)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff4d6";
            ctx.font = "bold 42px system-ui";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("PAUSE", canvas.width / 2, canvas.height / 2);
        }
    }

    game.entities = {
        nearestResource,
        nearestEnemy,
        spawnEnemy,
        render,
    };
})(window);
