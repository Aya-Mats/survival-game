(function setupFeedback(global) {
    const game = global.SurvivalGame || (global.SurvivalGame = {});
    const ui = game.ui;

    if (!ui) return;

    const shell = document.querySelector(".game-shell");
    let layer = null;
    let audioContext = null;
    let lastEvent = "";
    let lastEventAt = 0;

    const eventMap = [
        { match: /木を切った|木材を手に入れた/, type: "wood", label: "+WOOD" },
        { match: /石を叩いた|石を手に入れた/, type: "stone", label: "+STONE" },
        { match: /ベリーを摘んだ|ベリーを手に入れた|ベリーを拾った/, type: "berry", label: "+BERRY" },
        { match: /ベリーを食べた/, type: "eat", label: "YUM" },
        { match: /敵を追い払った|夜の影を倒した/, type: "attack", label: "HIT" },
        { match: /空振り/, type: "miss", label: "MISS" },
        { match: /焚き火を作った|焚き火クラフト/, type: "campfire", label: "FIRE" },
        { match: /小屋を建てた|小屋クラフト/, type: "hut", label: "BUILD" },
        { match: /襲われた|被害を抑えた/, type: "damage", label: "OUCH" },
        { match: /サバイバル開始|目が覚めた/, type: "start", label: "START" },
        { match: /一時停止中|再開/, type: "pause", label: "" },
    ];

    function ensureLayer() {
        if (layer || !shell) return layer;

        layer = document.createElement("div");
        layer.className = "feedback-layer";
        layer.setAttribute("aria-hidden", "true");
        shell.append(layer);
        return layer;
    }

    function unlockAudio() {
        if (audioContext) return;

        const AudioContext = global.AudioContext || global.webkitAudioContext;
        if (!AudioContext) return;

        audioContext = new AudioContext();
    }

    function playTone(type) {
        unlockAudio();
        if (!audioContext) return;

        const now = audioContext.currentTime;
        const gain = audioContext.createGain();
        const osc = audioContext.createOscillator();
        const tone = getTone(type);

        osc.type = tone.wave;
        osc.frequency.setValueAtTime(tone.start, now);
        osc.frequency.exponentialRampToValueAtTime(tone.end, now + tone.length);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(tone.volume, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + tone.length);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(now);
        osc.stop(now + tone.length + 0.03);
    }

    function getTone(type) {
        const tones = {
            wood: { wave: "triangle", start: 180, end: 110, length: 0.12, volume: 0.08 },
            stone: { wave: "square", start: 250, end: 150, length: 0.09, volume: 0.055 },
            berry: { wave: "sine", start: 520, end: 760, length: 0.1, volume: 0.06 },
            eat: { wave: "sine", start: 380, end: 620, length: 0.16, volume: 0.065 },
            attack: { wave: "sawtooth", start: 720, end: 190, length: 0.11, volume: 0.065 },
            miss: { wave: "triangle", start: 260, end: 210, length: 0.08, volume: 0.04 },
            campfire: { wave: "triangle", start: 240, end: 460, length: 0.18, volume: 0.07 },
            hut: { wave: "square", start: 190, end: 260, length: 0.12, volume: 0.055 },
            damage: { wave: "sawtooth", start: 140, end: 80, length: 0.2, volume: 0.075 },
            start: { wave: "sine", start: 320, end: 560, length: 0.18, volume: 0.055 },
            pause: { wave: "sine", start: 280, end: 280, length: 0.06, volume: 0.035 },
        };

        return tones[type] || tones.start;
    }

    function addFloat(label, type) {
        const target = ensureLayer();
        if (!target || !label) return;

        const item = document.createElement("span");
        item.className = `feedback-pop ${type}`;
        item.textContent = label;
        item.style.left = `${42 + Math.random() * 16}%`;
        item.style.top = `${42 + Math.random() * 18}%`;
        target.append(item);
        item.addEventListener("animationend", () => item.remove(), { once: true });
    }

    function flash(type) {
        if (!shell) return;

        shell.classList.remove("feedback-flash", "feedback-hit", "feedback-warm");
        shell.offsetWidth;

        if (type === "damage" || type === "attack") {
            shell.classList.add("feedback-hit");
        } else if (type === "campfire" || type === "hut" || type === "berry" || type === "eat") {
            shell.classList.add("feedback-warm");
        } else {
            shell.classList.add("feedback-flash");
        }
    }

    function shake(type) {
        if (!shell || !["attack", "damage", "stone", "wood"].includes(type)) return;

        shell.classList.remove("feedback-shake");
        shell.offsetWidth;
        shell.classList.add("feedback-shake");
    }

    function classify(message) {
        return eventMap.find((event) => event.match.test(message));
    }

    function respond(message) {
        const event = classify(message);
        if (!event) return;

        const stamp = `${event.type}:${message}`;
        const now = performance.now();
        if (stamp === lastEvent && now - lastEventAt < 90) return;

        lastEvent = stamp;
        lastEventAt = now;
        playTone(event.type);
        addFloat(event.label, event.type);
        flash(event.type);
        shake(event.type);
    }

    const originalShowToast = ui.showToast;
    ui.showToast = function showToastWithFeedback(widgets, message) {
        originalShowToast(widgets, message);
        respond(message);
    };

    const originalWriteLog = ui.writeLog;
    ui.writeLog = function writeLogWithFeedback(widgets, message) {
        originalWriteLog(widgets, message);
        respond(message);
    };

    document.addEventListener("pointerdown", unlockAudio, { capture: true });
    document.addEventListener("keydown", unlockAudio, { capture: true });
})(window);
