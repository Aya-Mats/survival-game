(function setupGameState(global) {
    const game = global.SurvivalGame || (global.SurvivalGame = {});

    const TILE = 32;
    const WORLD_W = 70;
    const WORLD_H = 54;

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function createResource(type) {
        const maxHp = type === "tree" ? 3 : type === "rock" ? 4 : 1;

        return {
            type,
            x: rand(3 * TILE, (WORLD_W - 3) * TILE),
            y: rand(3 * TILE, (WORLD_H - 3) * TILE),
            hp: maxHp,
            maxHp,
            bob: rand(0, Math.PI * 2),
        };
    }

    function addResources(resources, type, count) {
        for (let i = 0; i < count; i += 1) {
            resources.push(createResource(type));
        }
    }

    function createState() {
        const resources = [];

        addResources(resources, "tree", 165);
        addResources(resources, "rock", 95);
        addResources(resources, "bush", 90);

        return {
            player: {
                x: (WORLD_W * TILE) / 2,
                y: (WORLD_H * TILE) / 2,
                r: 13,
                speed: 150,
                hp: 100,
                hunger: 100,
                stamina: 100,
                invuln: 0,
                attackCd: 0,
            },
            inv: {
                wood: 0,
                stone: 0,
                berries: 0,
            },
            resources,
            structures: [],
            enemies: [],
            time: 0,
            day: 0,
            spawnTimer: 0,
            gameOver: false,
            survivedSeconds: 0,
        };
    }

    function isNight(state) {
        return state.time % 60 > 39;
    }

    function getTimeLabel(state) {
        const time = state.time % 60;

        if (time < 28) return "昼";
        if (time < 39) return "夕方";
        return "夜";
    }

    game.state = {
        TILE,
        WORLD_W,
        WORLD_H,
        rand,
        clamp,
        distance,
        createResource,
        addResources,
        createState,
        isNight,
        getTimeLabel,
    };
})(window);
