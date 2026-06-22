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

    function drawGround(ctx, canvas, camX, camY) {
        ctx.fillStyle = "#386641";
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

                ctx.globalAlpha = noise > 0.82 ? 0.16 : 0.06;
                ctx.fillStyle = noise > 0.5 ? "#4d7c4d" : "#315c3b";
                ctx.fillRect(x, y, TILE, TILE);
            }
        }

        ctx.globalAlpha = 1;
    }

    function drawResource(ctx, state, resource, x, y) {
        const bob = Math.sin(state.time * 2 + resource.bob) * 1.5;
        const drawY = y + bob;

        if (resource.type === "tree") {
            ctx.fillStyle = "#6b4423";
            ctx.fillRect(x - 4, drawY + 6, 8, 18);
            ctx.fillStyle = "#14532d";
            ctx.beginPath();
            ctx.arc(x, drawY, 19, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#166534";
            ctx.beginPath();
            ctx.arc(x - 9, drawY + 5, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 9, drawY + 5, 14, 0, Math.PI * 2);
            ctx.fill();
        } else if (resource.type === "rock") {
            ctx.fillStyle = "#64748b";
            ctx.beginPath();
            ctx.moveTo(x - 18, drawY + 12);
            ctx.lineTo(x - 10, drawY - 10);
            ctx.lineTo(x + 11, drawY - 15);
            ctx.lineTo(x + 19, drawY + 8);
            ctx.lineTo(x + 4, drawY + 18);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
            ctx.fillRect(x - 6, drawY - 8, 10, 3);
        } else {
            ctx.fillStyle = "#15803d";
            ctx.beginPath();
            ctx.arc(x, drawY + 5, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ef4444";
            for (let i = 0; i < 4; i += 1) {
                ctx.beginPath();
                ctx.arc(x + Math.cos(i * 1.9) * 7, drawY + 3 + Math.sin(i * 1.7) * 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (resource.hp < resource.maxHp) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.fillRect(x - 17, drawY - 26, 34, 5);
            ctx.fillStyle = "#facc15";
            ctx.fillRect(x - 17, drawY - 26, 34 * (resource.hp / resource.maxHp), 5);
        }
    }

    function drawStructure(ctx, state, structure, x, y) {
        if (structure.type === "campfire") {
            const glow = 60 + Math.sin(state.time * 8) * 8;
            const gradient = ctx.createRadialGradient(x, y, 5, x, y, glow);
            gradient.addColorStop(0, "rgba(251, 191, 36, 0.42)");
            gradient.addColorStop(1, "rgba(251, 191, 36, 0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, glow, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#7c2d12";
            ctx.fillRect(x - 16, y + 9, 32, 5);
            ctx.fillRect(x - 13, y + 1, 26, 5);
            ctx.fillStyle = "#f97316";
            ctx.beginPath();
            ctx.moveTo(x, y - 21);
            ctx.quadraticCurveTo(x + 18, y - 1, x, y + 14);
            ctx.quadraticCurveTo(x - 18, y - 2, x, y - 21);
            ctx.fill();
            ctx.fillStyle = "#fde047";
            ctx.beginPath();
            ctx.moveTo(x, y - 12);
            ctx.quadraticCurveTo(x + 8, y, x, y + 9);
            ctx.quadraticCurveTo(x - 8, y, x, y - 12);
            ctx.fill();
            return;
        }

        ctx.fillStyle = "#92400e";
        ctx.fillRect(x - 25, y - 5, 50, 34);
        ctx.fillStyle = "#7f1d1d";
        ctx.beginPath();
        ctx.moveTo(x - 32, y - 5);
        ctx.lineTo(x, y - 33);
        ctx.lineTo(x + 32, y - 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#422006";
        ctx.fillRect(x - 7, y + 9, 14, 20);
        ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
        ctx.fillRect(x + 10, y + 4, 10, 9);
    }

    function drawPlayer(ctx, state, player, x, y) {
        if (player.invuln > 0 && Math.floor(state.time * 18) % 2 === 0) return;

        ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
        ctx.beginPath();
        ctx.ellipse(x, y + 15, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f472b6";
        ctx.beginPath();
        ctx.arc(x, y, player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 15px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("人", x, y + 1);

        if (player.attackCd > 0.15) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 32, -0.5, 1.8);
            ctx.stroke();
        }
    }

    function drawEnemy(ctx, enemy, x, y) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.ellipse(x, y + 13, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#581c87";
        ctx.beginPath();
        ctx.arc(x, y, enemy.r + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#e9d5ff";
        ctx.beginPath();
        ctx.arc(x - 4, y - 2, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, y - 2, 2.4, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawHudOverlay(ctx, state) {
        ctx.save();
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.font = "bold 18px system-ui";
        ctx.fillStyle = "rgba(15, 23, 42, 0.74)";
        ctx.beginPath();
        roundRect(ctx, 14, 14, 212, 76, 14);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(`${getTimeLabel(state)} / ${state.day + 1}日目`, 28, 26);
        ctx.font = "13px system-ui";
        ctx.fillStyle = isNight(state) ? "#fecaca" : "#dcfce7";
        ctx.fillText(isNight(state) ? "夜: 敵が近づく。火の近くへ" : "昼: 採取とクラフトの時間", 28, 56);
        ctx.restore();
    }

    function render(ctx, canvas, state, paused) {
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
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(target.x - camX, target.y - camY, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (isNight(state)) {
            const alpha = 0.36 + Math.sin(state.time * 0.8) * 0.05;
            ctx.fillStyle = `rgba(2, 6, 23, ${alpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (state.time % 60 > 30) {
            ctx.fillStyle = `rgba(120, 53, 15, ${((state.time % 60) - 30) / 9 * 0.16})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        drawHudOverlay(ctx, state);

        if (paused && !state.gameOver) {
            ctx.fillStyle = "rgba(2, 6, 23, 0.55)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
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
