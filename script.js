/* ═══════════════════════════════════════════════
   COUSINS & CO TECH — MAIN SCRIPT
   Cinematic intro + Starfield + UI Orchestration
═══════════════════════════════════════════════ */

// ── Constants ──────────────────────────────────
const INTRO_DURATION    = 4200;  // ms — must match CSS var(--intro-dur)
const INTRO_FADE        = 900;   // ms fade-out duration

const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

// ══════════════════════════════════════════════════════
// 1. CINEMATIC INTRO SEQUENCE
// ══════════════════════════════════════════════════════

function runIntro() {
    const overlay = document.getElementById("intro-overlay");
    if (!overlay || prefersReducedMotion) {
        overlay && overlay.remove();
        afterIntro();
        return;
    }

    // Lock scroll during intro
    document.body.style.overflow = "hidden";

    // After intro animation completes, clean up and reveal site
    const totalTime = INTRO_DURATION + INTRO_FADE;

    setTimeout(() => {
        overlay.style.pointerEvents = "none";
    }, INTRO_DURATION);

    setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = "";
        afterIntro();
    }, totalTime);
}

// Called once intro is done — fires hero reveals
function afterIntro() {
    // Show nav
    const header = document.getElementById("site-header");
    if (header) {
        requestAnimationFrame(() => {
            header.classList.add("visible");
        });
    }

    // Staggered hero sequence
    const seqEls = document.querySelectorAll(".reveal-seq");
    seqEls.forEach((el) => {
        const delay = (parseInt(el.dataset.delay) || 0) * 160 + 200;
        setTimeout(() => el.classList.add("active"), delay);
    });
}

// ══════════════════════════════════════════════════════
// 2. SCROLL REVEAL (IntersectionObserver)
// ══════════════════════════════════════════════════════

function initScrollReveal() {
    const options = {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, options);

    document.querySelectorAll(".scroll-reveal").forEach((el) => {
        observer.observe(el);
    });
}

// ══════════════════════════════════════════════════════
// 3. STARFIELD CANVAS ENGINE
// ══════════════════════════════════════════════════════

(function StarField() {
    const canvas = document.getElementById("starfield");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let stars        = [];
    let dustParticles = [];
    let comet = { x: 0, y: 0, z: 2000, vx: 0, vy: 0, active: false };

    let width, height;
    let scrollDepth   = 0;
    let targetDepth   = 0;
    let lastScrollTime = Date.now();
    let isScrolling   = false;
    let raf;

    // ── Resize & DPR ──────────────────────────────
    function resizeCanvas() {
        width  = window.innerWidth;
        height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width  = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width  = width + "px";
        canvas.style.height = height + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles();
    }

    const resizeDebounced = debounce(resizeCanvas, 200);
    window.addEventListener("resize", resizeDebounced);

    // ── Init particles ─────────────────────────────
    function initParticles() {
        stars = [];
        dustParticles = [];

        const isMobile   = width < 768;
        const baseCount  = isMobile ? 350 : 700;
        const starCount  = baseCount * 2;
        const spreadX    = width  * 2.2;
        const spreadY    = height * 2.2;

        for (let i = 0; i < starCount; i++) {
            // Slightly bias toward warmer star temperatures
            const temp = Math.random();
            const color = temp > 0.85
                ? { r: 200, g: 215, b: 255 }  // Blue-white
                : temp > 0.5
                    ? { r: 255, g: 248, b: 240 } // Warm white
                    : { r: 255, g: 240, b: 200 }; // Yellow-ish

            stars.push({
                x: Math.random() * spreadX - spreadX / 2 + width / 2,
                y: Math.random() * spreadY - spreadY / 2 + height / 2,
                z: Math.random() * 1800 + 300,
                radius: Math.random() * 0.55 + 0.15,
                brightness: Math.random() * 0.3 + 0.7,
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: Math.random() * 0.0012 + 0.0003,
                color,
            });
        }

        // Nebula dust clouds — JWST palette
        const dustColors = [
            { h: 18,  s: 60, l: 38 },   // Webb Gold
            { h: 210, s: 55, l: 28 },   // Deep Blue
            { h: 275, s: 45, l: 28 },   // Nebula Purple
            { h: 170, s: 40, l: 25 },   // Teal haze
        ];
        const dustCount = Math.round(width * height / 5500);
        for (let i = 0; i < dustCount; i++) {
            const col = dustColors[Math.floor(Math.random() * dustColors.length)];
            dustParticles.push({
                x:     Math.random() * width  * 3 - width  * 1.5,
                y:     Math.random() * height * 3 - height * 1.5,
                z:     Math.random() * 2500 + 500,
                size:  Math.random() * 70 + 35,
                hue:   col.h, sat: col.s, lit: col.l,
                alpha: Math.random() * 0.032 + 0.008,
                drift: (Math.random() - 0.5) * 0.08,
            });
        }

        spawnComet();
    }

    // ── Comet ──────────────────────────────────────
    function spawnComet() {
        comet.active = true;
        comet.z = 1800;
        comet.y = Math.random() * height * 0.6 + height * 0.05;
        if (Math.random() > 0.5) {
            comet.x  = -120;
            comet.vx = Math.random() * 0.6 + 0.4;
        } else {
            comet.x  = width + 120;
            comet.vx = -(Math.random() * 0.6 + 0.4);
        }
        comet.vy = (Math.random() - 0.5) * 0.45;
    }

    function drawComet(offset) {
        if (!comet.active) return;

        let cz = comet.z - offset * 0.2;
        if (cz < 10 || comet.x < -250 || comet.x > width + 250) {
            if (Math.random() < 0.004) spawnComet();
            return;
        }

        const p  = 1000 / cz;
        const sx = (comet.x - width / 2) * p + width / 2;
        const sy = (comet.y - height / 2) * p + height / 2;

        const angle   = Math.atan2(comet.vy, comet.vx);
        const tailLen = 80 * p;
        const tailX   = sx - Math.cos(angle) * tailLen;
        const tailY   = sy - Math.sin(angle) * tailLen;

        const grad = ctx.createLinearGradient(sx, sy, tailX, tailY);
        grad.addColorStop(0, `rgba(210, 235, 255, ${Math.min(0.55, p * 0.4)})`);
        grad.addColorStop(0.5, `rgba(180, 215, 255, ${Math.min(0.2, p * 0.15)})`);
        grad.addColorStop(1, "transparent");

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth   = Math.max(0.5, 2.5 * p);
        ctx.lineCap     = "round";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Head glow
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 10 * p);
        grd.addColorStop(0, "rgba(240,250,255,0.8)");
        grd.addColorStop(0.3, "rgba(200,230,255,0.3)");
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx, sy, 10 * p, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.8, 1.8 * p), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        comet.x += comet.vx;
        comet.y += comet.vy;
    }

    // ── Dust ───────────────────────────────────────
    function drawDust() {
        ctx.globalCompositeOperation = "screen";
        for (const p of dustParticles) {
            let dz = p.z - scrollDepth * 0.35;
            if (dz < 100)  dz += 3000;
            if (dz > 3100) dz -= 3000;

            const persp = 1000 / dz;
            const sx    = width  / 2 + p.x * persp;
            const sy    = height / 2 + p.y * persp;
            const r     = p.size * persp;

            if (sx < -r || sx > width + r || sy < -r || sy > height + r) continue;

            const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
            grad.addColorStop(0, `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${p.alpha * 1.4})`);
            grad.addColorStop(0.5, `hsla(${p.hue}, ${p.sat}%, ${p.lit}%, ${p.alpha * 0.5})`);
            grad.addColorStop(1, "transparent");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.drift;
        }
        ctx.globalCompositeOperation = "source-over";
    }

    // ── Star shapes (Webb diffraction) ─────────────
    function drawStarShape(x, y, size, opacity, color) {
        ctx.save();
        ctx.globalAlpha = Math.min(opacity, 0.92);
        const spike = size * 4.5;
        const c     = `rgba(${color.r},${color.g},${color.b},${opacity * 0.7})`;

        ctx.strokeStyle = c;
        ctx.lineWidth   = 0.4;
        ctx.beginPath();
        ctx.moveTo(x, y - spike);     ctx.lineTo(x, y + spike);
        ctx.moveTo(x - spike, y);     ctx.lineTo(x + spike, y);
        ctx.moveTo(x - spike * 0.65, y - spike * 0.65); ctx.lineTo(x + spike * 0.65, y + spike * 0.65);
        ctx.moveTo(x + spike * 0.65, y - spike * 0.65); ctx.lineTo(x - spike * 0.65, y + spike * 0.65);
        ctx.stroke();

        // Core glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        grd.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${opacity * 0.3})`);
        grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // ── Main animate loop ──────────────────────────
    function animate() {
        if (prefersReducedMotion) return;

        ctx.clearRect(0, 0, width, height);

        drawDust();
        drawComet(scrollDepth);

        // Smooth scroll depth
        scrollDepth += (targetDepth - scrollDepth) * 0.045;
        scrollDepth += 0.45; // constant slow fly-through

        if (Date.now() - lastScrollTime > 300) isScrolling = false;

        const time      = Date.now() * 0.001;
        const idleDX    = Math.sin(time * 0.45) * 0.08;
        const idleDY    = Math.cos(time * 0.28) * 0.08;
        const spreadX   = width  * 2.2;
        const spreadY   = height * 2.2;

        for (const star of stars) {
            if (!isScrolling) {
                star.x += (Math.random() - 0.5) * 0.08 + idleDX;
                star.y += (Math.random() - 0.5) * 0.08 + idleDY;
            }

            let z = star.z - (scrollDepth % 2000);
            if (z < 10) z += 2000;

            if (star.z < 10 && z > 1900) {
                star.x = Math.random() * spreadX - spreadX / 2 + width / 2;
                star.y = Math.random() * spreadY - spreadY / 2 + height / 2;
            }

            const persp = 1200 / z;
            const sx    = (star.x - width / 2) * persp + width / 2;
            const sy    = (star.y - height / 2) * persp + height / 2;
            const size  = star.radius * persp * 0.75;

            if (sx < -60 || sx > width + 60 || sy < -60 || sy > height + 60) continue;

            const bright = Math.min(
                star.brightness + Math.sin(star.twinklePhase) * 0.22,
                0.96
            );
            star.twinklePhase += star.twinkleSpeed;

            if (size > 2.2) {
                drawStarShape(sx, sy, size * 0.55, bright, star.color);
            } else {
                ctx.save();
                ctx.globalAlpha = bright;
                ctx.fillStyle = `rgba(${star.color.r},${star.color.g},${star.color.b},${bright * 0.95})`;
                ctx.beginPath();
                ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        raf = requestAnimationFrame(animate);
    }

    // ── Scroll listener ────────────────────────────
    window.addEventListener("scroll", () => {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) return;
        const pct = window.scrollY / maxScroll;
        targetDepth = pct * 1300;
        lastScrollTime = Date.now();
        isScrolling = true;
    }, { passive: true });

    // ── Boot ───────────────────────────────────────
    resizeCanvas();
    if (!prefersReducedMotion) animate();

})();

// ══════════════════════════════════════════════════════
// 4. MOBILE NAVIGATION
// ══════════════════════════════════════════════════════

function initMobileNav() {
    const hamburger = document.querySelector(".hamburger");
    const navLinks  = document.querySelector(".nav-links");

    if (!hamburger || !navLinks) return;

    hamburger.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("active");
        hamburger.classList.toggle("open", isOpen);
        document.body.style.overflow = isOpen ? "hidden" : "";
    });

    document.querySelectorAll(".nav-links a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            hamburger.classList.remove("open");
            document.body.style.overflow = "";
        });
    });
}

// ══════════════════════════════════════════════════════
// 5. FORM HANDLING
// ══════════════════════════════════════════════════════

function initForm() {
    const form = document.getElementById("contactForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const btn  = form.querySelector(".cta-button");
        const span = btn.querySelector("span");
        const orig = span.textContent;

        btn.disabled      = true;
        btn.style.opacity = "0.7";
        span.textContent  = "Sending…";

        // Simulate async send (replace with real API call)
        setTimeout(() => {
            span.textContent  = "Message Sent ✓";
            btn.style.background = "rgba(200,169,110,0.8)";

            setTimeout(() => {
                form.reset();
                btn.disabled      = false;
                btn.style.opacity = "";
                btn.style.background = "";
                span.textContent  = orig;
            }, 3500);
        }, 1500);
    });
}

// ══════════════════════════════════════════════════════
// 6. UTILITIES
// ══════════════════════════════════════════════════════

function debounce(fn, ms) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

// ══════════════════════════════════════════════════════
// 7. BOOT
// ══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
    runIntro();
    initScrollReveal();
    initMobileNav();
    initForm();
});
