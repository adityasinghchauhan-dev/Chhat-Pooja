"use strict";

/* =================================
   FESTIVAL DATES (local time)
   November = month 10 in JavaScript
================================= */

const festival = {
    evening: new Date(2026, 10, 15, 17, 0, 0),
    morning: new Date(2026, 10, 16, 6, 0, 0)
};

const OFFERING_WINDOW = 90 * 60 * 1000; // treat the offering as "live" for 90 minutes

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (id) => document.getElementById(id);
const pad2 = (n) => String(n).padStart(2, "0");


/* =================================
   LIVE COUNTDOWN
================================= */

function updateTimer(timerId, targetDate) {
    const timer = $(timerId);
    if (!timer) return;

    const now = Date.now();
    const remaining = targetDate.getTime() - now;
    const values = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (remaining > 0) {
        values.days = Math.floor(remaining / 86400000);
        values.hours = Math.floor((remaining / 3600000) % 24);
        values.minutes = Math.floor((remaining / 60000) % 60);
        values.seconds = Math.floor((remaining / 1000) % 60);
    }

    timer.querySelectorAll("[data-unit]").forEach((el) => {
        el.textContent = pad2(values[el.dataset.unit] ?? 0);
    });

    const chip = timer.closest(".countdown-card")?.querySelector(".status");
    if (chip) {
        let state = "upcoming";
        let label = "Upcoming";

        if (remaining <= 0 && now < targetDate.getTime() + OFFERING_WINDOW) {
            state = "live";
            label = "Happening now 🙏";
        } else if (remaining <= 0) {
            state = "done";
            label = "Offered 🙏";
        }

        chip.dataset.status = state;
        chip.textContent = label;
    }
}

function updateCountdowns() {
    updateTimer("eveningTimer", festival.evening);
    updateTimer("morningTimer", festival.morning);
}

updateCountdowns();
setInterval(updateCountdowns, 1000);


/* =================================
   SUNSET / SUNRISE MOOD
================================= */

const hero = $("home");
const moodButtons = document.querySelectorAll(".mood-toggle button");

function setMood(mood) {
    if (!hero) return;
    hero.dataset.mood = mood;
    moodButtons.forEach((btn) => {
        btn.setAttribute("aria-pressed", String(btn.dataset.mood === mood));
    });
}

moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMood(btn.dataset.mood));
});

// Start with the sky that matches the visitor's current time of day
const hourNow = new Date().getHours();
setMood(hourNow >= 4 && hourNow < 12 ? "dawn" : "dusk");


/* =================================
   STARS + GOLDEN SPARKLES
================================= */

(function createStars() {
    const container = $("stars");
    if (!container) return;

    for (let i = 0; i < 70; i++) {
        const star = document.createElement("span");
        const size = 1 + Math.random() * 2;

        star.className = "star";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = star.style.height = `${size}px`;
        star.style.animationDelay = `${-Math.random() * 4}s`;
        star.style.animationDuration = `${2.5 + Math.random() * 3}s`;

        container.appendChild(star);
    }
})();

(function createSparkles() {
    const container = $("heroSparkles");
    if (!container || prefersReducedMotion) return;

    const symbols = ["✦", "✧", "·", "✺"];

    for (let i = 0; i < 22; i++) {
        const sparkle = document.createElement("span");

        sparkle.className = "sparkle";
        sparkle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.fontSize = `${8 + Math.random() * 12}px`;
        sparkle.style.animationDuration = `${10 + Math.random() * 14}s`;
        sparkle.style.animationDelay = `${-Math.random() * 20}s`;
        sparkle.style.setProperty("--drift", `${Math.random() * 100 - 50}px`);

        container.appendChild(sparkle);
    }
})();


/* =================================
   NAVIGATION AND SCROLL PROGRESS
================================= */

const navbar = $("navbar");
const menuToggle = $("menuToggle");
const navLinks = $("navLinks");
const progress = $("progress");

function closeMenu() {
    if (!navLinks || !menuToggle) return;
    navLinks.classList.remove("open");
    menuToggle.textContent = "☰";
    menuToggle.setAttribute("aria-expanded", "false");
}

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const opened = navLinks.classList.toggle("open");
        menuToggle.textContent = opened ? "✕" : "☰";
        menuToggle.setAttribute("aria-expanded", String(opened));
    });

    navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });
}

function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (navbar) navbar.classList.toggle("scrolled", y > 30);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Highlight the nav link for the section being viewed
if ("IntersectionObserver" in window) {
    const spyLinks = [...document.querySelectorAll("[data-spy]")];
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            spyLinks.forEach((link) => link.classList.toggle("active", link.dataset.spy === entry.target.id));
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    spyLinks.forEach((link) => {
        const section = $(link.dataset.spy);
        if (section) spy.observe(section);
    });
}

/* =================================
   SCROLL REVEAL
================================= */

(function setupReveal() {
    const items = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
        items.forEach((el) => el.classList.add("in"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach((el) => observer.observe(el));
})();


/* =================================
   JOURNEY: MARK TODAY / UP NEXT
================================= */

(function markTimeline() {
    const cards = [...document.querySelectorAll(".day-card[data-date]")];
    if (!cards.length) return;

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    const addBadge = (card, text) => {
        const badge = document.createElement("span");
        badge.className = "day-badge";
        badge.textContent = text;
        card.appendChild(badge);
    };

    const today = cards.find((c) => c.dataset.date === todayKey);

    if (today) {
        today.classList.add("is-today");
        addBadge(today, "TODAY");
        return;
    }

    const next = cards.find((c) => c.dataset.date > todayKey);
    if (next) addBadge(next, "UP NEXT");
})();


/* =================================
   FILE DOWNLOAD HELPER
================================= */

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);
}


/* =================================
   FLOAT A DIYA + DIYA COUNTERS
================================= */

(function diyaRiver() {
    const box = $("riverBox");
    const button = $("diyaButton");
    const countEl = $("diyaCount");
    const worldEl = $("worldCount");
    const noteEl = $("worldNote");
    const hint = $("riverHint");

    if (!box) return;

    const fmt = new Intl.NumberFormat();

    /* ---------- saving numbers so a refresh never loses them ----------
       Each number is written to localStorage, sessionStorage, a cookie and
       window.name. The highest value found wins when the page loads. */
    const persist = {
        read(key) {
            let best = 0;
            const take = (v) => {
                const n = parseInt(v, 10);
                if (n > best) best = n;
            };

            try { take(localStorage.getItem("chhath2026." + key)); } catch (e) { /* blocked */ }
            try { take(sessionStorage.getItem("chhath2026." + key)); } catch (e) { /* blocked */ }

            try {
                const m = document.cookie.match(new RegExp("(?:^|;\\s*)chhath2026_" + key + "=(\\d+)"));
                if (m) take(m[1]);
            } catch (e) { /* blocked */ }

            try {
                const m = window.name.match(new RegExp("chhath2026_" + key + "=(\\d+);"));
                if (m) take(m[1]);
            } catch (e) { /* blocked */ }

            return best;
        },

        write(key, n) {
            try { localStorage.setItem("chhath2026." + key, String(n)); } catch (e) { /* blocked */ }
            try { sessionStorage.setItem("chhath2026." + key, String(n)); } catch (e) { /* blocked */ }

            try {
                document.cookie = `chhath2026_${key}=${n}; max-age=31536000; path=/; SameSite=Lax`;
            } catch (e) { /* blocked */ }

            try {
                const clean = window.name.replace(new RegExp("chhath2026_" + key + "=\\d+;", "g"), "");
                window.name = `${clean}chhath2026_${key}=${n};`;
            } catch (e) { /* blocked */ }
        }
    };

    /* ---------- your diyas ---------- */
    let count = persist.read("lit");        // diyas you have lit
    let reported = Math.min(persist.read("sent"), count); // of those, how many the world counter has received

    function bump(el) {
        if (!el) return;
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
    }

    function renderYours() {
        if (countEl) countEl.textContent = fmt.format(count);
    }

    /* ---------- worldwide diyas ----------
       A free shared counter service keeps one number for every visitor.
       Two services are tried in turn, so one being down does not stop it. */
    const NS = "chhath-puja-2026";
    const KEY = "diyas-lit";

    const providers = [
        {
            get: `https://abacus.jasoncameron.dev/get/${NS}/${KEY}`,
            hit: `https://abacus.jasoncameron.dev/hit/${NS}/${KEY}`,
            value: (d) => d.value
        },
        {
            get: `https://api.counterapi.dev/v1/${NS}/${KEY}/`,
            hit: `https://api.counterapi.dev/v1/${NS}/${KEY}/up`,
            value: (d) => d.count
        }
    ];

    let preferred = 0;        // provider that worked last
    let server = null;        // last confirmed worldwide total
    let shownWorld = null;

    async function request(url, allowMissing) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 7000);

        try {
            const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });

            // a counter that does not exist yet simply means nobody has lit a diya
            if (allowMissing && (res.status === 404 || res.status === 400)) return { missing: true };
            if (!res.ok) throw new Error("counter " + res.status);

            return await res.json();
        } finally {
            clearTimeout(timer);
        }
    }

    // try each service, starting with the one that worked last
    async function ask(kind) {
        let lastError = new Error("no counter service");

        for (let i = 0; i < providers.length; i++) {
            const idx = (preferred + i) % providers.length;
            const p = providers[idx];

            try {
                const data = await request(p[kind], kind === "get");
                const n = data.missing ? 0 : Number(p.value(data));

                if (!Number.isFinite(n) || n < 0) throw new Error("bad counter reply");

                preferred = idx;
                return n;
            } catch (e) {
                lastError = e;
            }
        }

        throw lastError;
    }

    function renderWorld() {
        if (!worldEl) return;

        if (server == null) {
            worldEl.textContent = "—";
            return;
        }

        // confirmed total plus your diyas that have not reached the server yet
        const shown = server + Math.max(0, count - reported);

        if (shown !== shownWorld) {
            worldEl.textContent = fmt.format(shown);
            if (shownWorld != null) bump(worldEl);
            shownWorld = shown;
        }
    }

    function setNote(failed) {
        if (!noteEl) return;
        noteEl.textContent = failed
            ? "Reconnecting to the worldwide counter… your diyas are saved and will be added."
            : "";
    }

    let syncing = false;
    let syncAgain = false;

    async function sync() {
        if (syncing) {
            syncAgain = true;
            return;
        }

        syncing = true;

        try {
            // send any diyas the world counter has not received yet, one at a time
            let guard = 0;

            while (reported < count && guard < 60) {
                server = await ask("hit");
                reported += 1;
                guard += 1;
                persist.write("sent", reported);
                renderWorld();
            }

            // then read the latest total, which includes everyone else's diyas
            server = await ask("get");
            setNote(false);
        } catch (e) {
            setNote(true);
        }

        renderWorld();
        syncing = false;

        if (syncAgain) {
            syncAgain = false;
            sync();
        }
    }

    /* ---------- floating a diya ---------- */
    const blessings = [
        "जय छठी मैया 🙏",
        "May your wish reach the sun ☀",
        "Light travels far on water ✨",
        "Gratitude, glowing 🪷",
        "Surya Dev ki jai 🙏"
    ];

    let hintTimer = 0;

    function floatDiya(x, y) {
        const rect = box.getBoundingClientRect();
        const left = x ?? rect.width * (0.15 + Math.random() * 0.45);
        const top = y ?? rect.height * (0.4 + Math.random() * 0.45);

        const lamp = document.createElement("div");
        lamp.className = "lamp";
        lamp.innerHTML = "<span></span>";

        lamp.style.left = `${left}px`;
        lamp.style.top = `${Math.max(rect.height * 0.28, Math.min(top, rect.height - 24))}px`;
        lamp.style.setProperty("--dx", `${120 + Math.random() * 220}px`);
        lamp.style.setProperty("--dy", `${Math.random() * 50 - 25}px`);
        lamp.style.animationDuration = `${14 + Math.random() * 7}s`;

        lamp.addEventListener("animationend", (e) => {
            if (e.target === lamp) lamp.remove();
        });

        box.appendChild(lamp);

        // keep the river from getting too crowded
        const lamps = box.querySelectorAll(".lamp");
        if (lamps.length > 28) lamps[0].remove();

        count += 1;
        persist.write("lit", count);
        renderYours();
        bump(countEl);

        renderWorld();
        bump(worldEl);
        sync();

        if (hint) {
            hint.textContent = blessings[count % blessings.length];
            clearTimeout(hintTimer);
            hintTimer = setTimeout(() => { hint.textContent = "Tap the water 🪔"; }, 2600);
        }
    }

    box.addEventListener("click", (e) => {
        const rect = box.getBoundingClientRect();
        floatDiya(e.clientX - rect.left, e.clientY - rect.top);
    });

    box.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            floatDiya();
        }
    });

    if (button) button.addEventListener("click", () => floatDiya());

    /* ---------- start up ---------- */
    renderYours();
    renderWorld();
    sync();

    setInterval(() => { if (!document.hidden) sync(); }, 20000);
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
})();


/* =================================
   GREETING CARD MAKER
================================= */

(function greetingCard() {
    const canvas = $("cardCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const nameInput = $("cardName");
    const msgSelect = $("cardMsg");
    const downloadBtn = $("cardDownload");
    const shareBtn = $("cardShare");
    const whatsappLink = $("cardWhatsApp");
    const S = 1080;

    const messages = [
        "May Surya Dev bless you and your family with good health, happiness and prosperity.",
        "Wishing you a Chhath Puja filled with faith, gratitude and the golden light of the rising sun.",
        "May Chhathi Maiya fulfil your prayers and fill your home with peace and joy."
    ];

    const themes = {
        dusk: {
            sky: [[0, "#2a0826"], [0.35, "#6d0f10"], [0.7, "#d4400c"], [1, "#ffb347"]],
            sun: ["#fffbc4", "#ffc93c", "#ff8a1c"],
            ink: "#fff3d6",
            accent: "#ffd46f"
        },
        dawn: {
            sky: [[0, "#3b1a55"], [0.35, "#a2365a"], [0.7, "#f08a45"], [1, "#ffe0a0"]],
            sun: ["#ffffff", "#fff0a0", "#ffb53a"],
            ink: "#fff6e2",
            accent: "#ffe08a"
        },
        gold: {
            sky: [[0, "#4d0802"], [0.5, "#a81308"], [1, "#e8890f"]],
            sun: ["#fff7b0", "#ffd24a", "#ff9a1f"],
            ink: "#fff1d0",
            accent: "#ffd46f"
        }
    };

    const state = { theme: "dusk" };

    const setSpacing = (px) => { if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`; };

    function wrapText(text, maxWidth) {
        const words = text.split(" ");
        const lines = [];
        let line = "";

        words.forEach((word) => {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        });

        if (line) lines.push(line);
        return lines;
    }

    function drawDiya(x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // bowl
        ctx.beginPath();
        ctx.moveTo(-34, 0);
        ctx.quadraticCurveTo(0, 38, 34, 0);
        ctx.closePath();
        ctx.fillStyle = "#b85a17";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#ffd46f";
        ctx.stroke();

        // flame
        ctx.shadowColor = "#ffb82e";
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(-13, -22, 0, -44);
        ctx.quadraticCurveTo(13, -22, 0, -4);
        const flame = ctx.createLinearGradient(0, -44, 0, -4);
        flame.addColorStop(0, "#fff9b4");
        flame.addColorStop(0.6, "#ffad1e");
        flame.addColorStop(1, "#ff4d00");
        ctx.fillStyle = flame;
        ctx.fill();

        ctx.restore();
    }

    function drawCard() {
        const t = themes[state.theme];
        const horizon = 850;

        canvas.width = S;
        canvas.height = S;

        // sky
        const sky = ctx.createLinearGradient(0, 0, 0, S);
        t.sky.forEach(([offset, color]) => sky.addColorStop(offset, color));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, S, S);

        // rays
        ctx.save();
        ctx.strokeStyle = "rgba(255, 232, 160, 0.10)";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        for (let i = 0; i <= 26; i++) {
            const a = Math.PI + (i / 26) * Math.PI;
            ctx.beginPath();
            ctx.moveTo(S / 2 + Math.cos(a) * 190, horizon + Math.sin(a) * 190);
            ctx.lineTo(S / 2 + Math.cos(a) * 980, horizon + Math.sin(a) * 980);
            ctx.stroke();
        }
        ctx.restore();

        // sun
        ctx.save();
        ctx.shadowColor = "rgba(255, 170, 40, 0.75)";
        ctx.shadowBlur = 90;
        const sun = ctx.createRadialGradient(S / 2, horizon, 10, S / 2, horizon, 150);
        sun.addColorStop(0, t.sun[0]);
        sun.addColorStop(0.5, t.sun[1]);
        sun.addColorStop(1, t.sun[2]);
        ctx.fillStyle = sun;
        ctx.beginPath();
        ctx.arc(S / 2, horizon, 150, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // river
        const water = ctx.createLinearGradient(0, horizon, 0, S);
        water.addColorStop(0, "rgba(60, 8, 3, 0.35)");
        water.addColorStop(1, "rgba(18, 3, 2, 0.97)");
        ctx.fillStyle = water;
        ctx.fillRect(0, horizon, S, S - horizon);

        // sun reflection
        const reflection = ctx.createLinearGradient(0, horizon, 0, horizon + 170);
        reflection.addColorStop(0, "rgba(255, 214, 100, 0.55)");
        reflection.addColorStop(1, "rgba(255, 214, 100, 0)");
        ctx.fillStyle = reflection;
        ctx.fillRect(S / 2 - 55, horizon, 110, 170);

        // ripples
        ctx.strokeStyle = "rgba(255, 210, 120, 0.22)";
        ctx.lineWidth = 2;
        [[330, 885, 120], [760, 905, 150], [540, 930, 90], [200, 975, 110], [880, 1000, 100]].forEach(([x, y, w]) => {
            ctx.beginPath();
            ctx.ellipse(x, y, w, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
        });

        // floating diyas
        drawDiya(215, 905, 1);
        drawDiya(870, 925, 0.85);
        drawDiya(115, 1000, 0.65);
        drawDiya(965, 1005, 0.7);

        // text
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = t.accent;
        ctx.font = '600 84px "Noto Serif Devanagari", "Cormorant Garamond", serif';
        ctx.fillText("ॐ", S / 2, 150);

        ctx.fillStyle = t.ink;
        ctx.font = '600 32px "DM Sans", sans-serif';
        setSpacing(14);
        ctx.fillText("HAPPY", S / 2 + 7, 224);
        setSpacing(0);

        ctx.fillStyle = t.accent;
        ctx.font = 'italic 600 148px "Cormorant Garamond", Georgia, serif';
        ctx.fillText("Chhath Puja", S / 2, 360);

        ctx.fillStyle = t.ink;
        ctx.font = '500 44px "Cormorant Garamond", Georgia, serif';
        const lines = wrapText(messages[Number(msgSelect.value)] || messages[0], 780);
        lines.forEach((line, i) => ctx.fillText(line, S / 2, 450 + i * 58));

        const name = nameInput.value.trim();

        if (name) {
            ctx.font = '500 28px "DM Sans", sans-serif';
            ctx.fillStyle = t.ink;
            ctx.globalAlpha = 0.85;
            ctx.fillText("With love from", S / 2, 940);
            ctx.globalAlpha = 1;

            let size = 68;
            ctx.fillStyle = t.accent;
            do {
                ctx.font = `italic 600 ${size}px "Cormorant Garamond", Georgia, serif`;
                size -= 2;
            } while (ctx.measureText(name).width > 740 && size > 30);
            ctx.fillText(name, S / 2, 1008);

            ctx.fillStyle = t.ink;
            ctx.font = '500 30px "Noto Serif Devanagari", serif';
            ctx.fillText("॥ जय छठी मैया ॥", S / 2, 1046);
        } else {
            ctx.fillStyle = t.accent;
            ctx.font = '600 70px "Noto Serif Devanagari", serif';
            ctx.fillText("॥ जय छठी मैया ॥", S / 2, 995);
        }

        // frame
        ctx.strokeStyle = t.accent;
        ctx.lineWidth = 3;
        ctx.strokeRect(30, 30, S - 60, S - 60);
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(48, 48, S - 96, S - 96);
        ctx.globalAlpha = 1;

        ctx.fillStyle = t.accent;
        ctx.font = "34px serif";
        [[30, 30], [S - 30, 30], [30, S - 30], [S - 30, S - 30]].forEach(([x, y]) => {
            ctx.fillText("✦", x, y + 11);
        });

        updateWhatsApp();
    }

    function shareText() {
        const name = nameInput.value.trim();
        const base = messages[Number(msgSelect.value)] || messages[0];
        return `🙏 Happy Chhath Puja! ${base}${name ? ` — ${name}` : ""} ☀ जय छठी मैया`;
    }

    function updateWhatsApp() {
        if (whatsappLink) whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(shareText())}`;
    }

    let frame = 0;
    function scheduleDraw() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(drawCard);
    }

    nameInput.addEventListener("input", scheduleDraw);
    msgSelect.addEventListener("change", scheduleDraw);

    document.querySelectorAll('input[name="theme"]').forEach((radio) => {
        radio.addEventListener("change", () => {
            state.theme = radio.value;
            scheduleDraw();
        });
    });

    const toBlob = () => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

    if (downloadBtn) {
        downloadBtn.addEventListener("click", async () => {
            const blob = await toBlob();
            if (blob) downloadBlob(blob, "chhath-puja-wishes.png");
        });
    }

    if (shareBtn && navigator.share) {
        shareBtn.hidden = false;

        shareBtn.addEventListener("click", async () => {
            try {
                const blob = await toBlob();
                const file = new File([blob], "chhath-puja-wishes.png", { type: "image/png" });
                const payload = { title: "Happy Chhath Puja", text: shareText() };

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    payload.files = [file];
                }

                await navigator.share(payload);
            } catch (err) {
                /* user cancelled sharing, nothing to do */
            }
        });
    }

    // Draw straight away, then again once the web fonts have loaded
    drawCard();

    if (document.fonts && document.fonts.load) {
        Promise.all([
            document.fonts.load('italic 600 148px "Cormorant Garamond"'),
            document.fonts.load('500 44px "Cormorant Garamond"'),
            document.fonts.load('600 32px "DM Sans"'),
            document.fonts.load('600 70px "Noto Serif Devanagari"', "ॐ जय छठी मैया")
        ]).then(scheduleDraw).catch(() => {});
    }
})();


/* =================================
   FOOTER YEAR
================================= */

const footerText = document.querySelector(".footer small");

if (footerText) {
    footerText.textContent = `© ${new Date().getFullYear()} Chhath Puja Celebration`;
}