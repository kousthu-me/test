const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");
let stars = [], dustParticles = [], comet = { x: 0, y: 0, z: 2000, active: false, speed: 0.5 };
let width, height, scrollDepth = 0, targetDepth = 0;

// Sequence Controller
document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-wrapper');
    const loaderText = document.querySelector('.loader-text');
    const mainContent = document.getElementById('main-content');

    setTimeout(() => loaderText.classList.add('reveal'), 500);

    setTimeout(() => {
        loader.style.opacity = '0';
        resizeCanvas();
        animate(); 
        
        setTimeout(() => {
            loader.style.display = 'none';
            mainContent.style.visibility = 'visible';
            mainContent.style.opacity = '1';
        }, 1000);
    }, 3500);
});

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
    initParticles();
}

function initParticles() {
    stars = []; dustParticles = [];
    const starCount = width < 768 ? 400 : 800;
    for (let i = 0; i < starCount; i++) {
        stars.push({
            x: Math.random() * width * 2 - width,
            y: Math.random() * height * 2 - height,
            z: Math.random() * 1800 + 200,
            radius: Math.random() * 0.6 + 0.2,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }
    const dustCount = Math.round(width * height / 8000);
    for (let i = 0; i < dustCount; i++) {
        dustParticles.push({
            x: Math.random() * width * 3 - width * 1.5,
            y: Math.random() * height * 3 - height * 1.5,
            z: Math.random() * 2500 + 500,
            size: Math.random() * 100 + 50,
            hue: [20, 220, 280][Math.floor(Math.random() * 3)],
            alpha: Math.random() * 0.04 + 0.01
        });
    }
}

function drawStarShape(x, y, size, opacity) {
    ctx.globalAlpha = opacity;
    const spike = size * 6;
    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - spike); ctx.lineTo(x, y + spike);
    ctx.moveTo(x - spike, y); ctx.lineTo(x + spike, y);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(x, y, size * 1.2, 0, Math.PI * 2); ctx.fill();
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Dust Rendering
    ctx.globalCompositeOperation = "screen";
    dustParticles.forEach(p => {
        let dz = p.z - (scrollDepth * 0.4);
        if (dz < 100) dz += 3000;
        const perspective = 1000 / dz;
        const sx = width / 2 + p.x * perspective;
        const sy = height / 2 + p.y * perspective;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.size * perspective);
        grad.addColorStop(0, `hsla(${p.hue}, 60%, 50%, ${p.alpha})`);
        grad.addColorStop(1, `transparent`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sx, sy, p.size * perspective, 0, Math.PI * 2); ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
    scrollDepth += 0.4; // Constant drift

    stars.forEach(star => {
        let z = star.z - (scrollDepth % 2000);
        if (z < 10) z += 2000;
        const perspective = 1200 / z;
        const sx = (star.x) * perspective + width / 2;
        const sy = (star.y) * perspective + height / 2;
        const size = star.radius * perspective;
        const bright = 0.7 + Math.sin(Date.now() * 0.001 + star.twinklePhase) * 0.3;

        if (sx > 0 && sx < width && sy > 0 && sy < height) {
            if (size > 1.8) drawStarShape(sx, sy, size * 0.5, bright);
            else {
                ctx.globalAlpha = bright;
                ctx.fillStyle = "white";
                ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
            }
        }
    });

    requestAnimationFrame(animate);
}

// Reveal Observer
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));
window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", () => {
    targetDepth = window.scrollY * 1.2;
    scrollDepth += (targetDepth - scrollDepth) * 0.05;
});