
(function() {
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, cx, cy;
  let frame = 0;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    cx = W / 2; cy = H / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles
  const particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * 2000 - 1000,
    y: Math.random() * 2000 - 1000,
    z: Math.random() * 1200 + 100,
    speed: Math.random() * 0.5 + 0.2,
    size: Math.random() * 2 + 0.5,
  }));

  // Grid lines for 3D perspective floor
  function project(x, y, z) {
    const fov = 600;
    const scale = fov / (fov + z);
    return {
      x: cx + x * scale,
      y: cy + y * scale,
      scale
    };
  }

  // Radar arcs
  let radarAngle = 0;
  const radarBlips = Array.from({ length: 6 }, () => ({
    angle: Math.random() * Math.PI * 2,
    dist: Math.random() * 0.3 + 0.05,
    life: 0,
    maxLife: 100 + Math.random() * 60
  }));

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    radarAngle += 0.008;

    // BG gradient
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    grad.addColorStop(0, 'rgba(13,26,36,0.95)');
    grad.addColorStop(1, 'rgba(6,11,16,0.98)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── PERSPECTIVE GRID ──
    ctx.save();
    const gridY = H * 0.72;
    const horizY = H * 0.42;
    const vanishX = cx;
    const cols = 14;
    const rows = 10;

    // vertical perspective lines
    for (let i = 0; i <= cols; i++) {
      const t = i / cols;
      const xBottom = (W * 0.05) + t * (W * 0.9);
      const xTop = vanishX + (xBottom - vanishX) * 0.05;
      const alpha = 0.04 + 0.04 * Math.abs(t - 0.5) * 2;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizY);
      ctx.lineTo(xBottom, gridY);
      ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // horizontal lines
    for (let j = 1; j <= rows; j++) {
      const t = j / rows;
      const easedT = Math.pow(t, 2.5);
      const y = horizY + easedT * (gridY - horizY);
      const spreadX = (vanishX - W * 0.05) * (1 - Math.pow(1 - t, 2.5) * 0.95);
      ctx.beginPath();
      ctx.moveTo(vanishX - spreadX, y);
      ctx.lineTo(vanishX + spreadX, y);
      const alpha = 0.03 + t * 0.06;
      ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // horizon glow line
    const hGrad = ctx.createLinearGradient(0, horizY, W, horizY);
    hGrad.addColorStop(0, 'transparent');
    hGrad.addColorStop(0.3, 'rgba(0,212,255,0.12)');
    hGrad.addColorStop(0.5, 'rgba(0,212,255,0.22)');
    hGrad.addColorStop(0.7, 'rgba(0,212,255,0.12)');
    hGrad.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.moveTo(0, horizY);
    ctx.lineTo(W, horizY);
    ctx.strokeStyle = hGrad;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ── FLOATING PARTICLES (star field / data nodes) ──
    ctx.save();
    for (const p of particles) {
      p.z -= p.speed * 1.5;
      if (p.z <= 0) p.z = 1200;
      const { x, y, scale } = project(p.x, p.y - cy * 0.3, p.z);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      const alpha = (1 - p.z / 1200) * 0.6;
      ctx.beginPath();
      ctx.arc(x, y, p.size * scale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,212,255,${alpha})`;
      ctx.fill();
    }
    ctx.restore();

    // ── MINI RADAR (bottom right) ──
    const rX = W - 90, rY = H - 90, rR = 60;
    ctx.save();

    // radar rings
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(rX, rY, rR * (i / 3), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,212,255,0.12)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // crosshairs
    ctx.beginPath();
    ctx.moveTo(rX - rR, rY); ctx.lineTo(rX + rR, rY);
    ctx.moveTo(rX, rY - rR); ctx.lineTo(rX, rY + rR);
    ctx.strokeStyle = 'rgba(0,212,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // sweep
    const sweepGrad = ctx.createConicalGradient
      ? null : null; // fallback manual arc
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rX, rY);
    ctx.arc(rX, rY, rR, radarAngle - 0.8, radarAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0,245,160,0.07)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rX, rY);
    ctx.lineTo(rX + Math.cos(radarAngle) * rR, rY + Math.sin(radarAngle) * rR);
    ctx.strokeStyle = 'rgba(0,245,160,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // blips
    for (const b of radarBlips) {
      b.life++;
      if (b.life > b.maxLife) {
        b.angle = Math.random() * Math.PI * 2;
        b.dist = Math.random() * 0.28 + 0.05;
        b.life = 0;
        b.maxLife = 100 + Math.random() * 60;
      }
      const diff = ((b.angle - radarAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      if (diff < 0.8) {
        const fade = 1 - diff / 0.8;
        const bx = rX + Math.cos(b.angle) * rR * b.dist;
        const by_ = rY + Math.sin(b.angle) * rR * b.dist;
        ctx.beginPath();
        ctx.arc(bx, by_, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,160,${fade * 0.9})`;
        ctx.fill();
      }
    }

    // radar border
    ctx.beginPath();
    ctx.arc(rX, rY, rR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,212,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // ── HUD CORNER MARKS ──
    ctx.save();
    const corners = [
      [24, 24, 1, 1],
      [W - 24, 24, -1, 1],
      [24, H - 24, 1, -1],
      [W - 24, H - 24, -1, -1]
    ];
    const cLen = 18;
    for (const [x, y, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(x + dx * cLen, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * cLen);
      ctx.strokeStyle = 'rgba(0,212,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // ── HUD DATA TEXT ──
    ctx.save();
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.25)';
    const time = new Date();
    const ts = `${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}:${String(time.getSeconds()).padStart(2,'0')}`;
    ctx.fillText(`SYS_TIME: ${ts}`, 28, H - 28);
    ctx.fillText(`NODE: SANTHOSH_S :: ACTIVE`, 28, H - 44);
    ctx.fillText(`SIGNAL: TCP/IP ████████░░ 82%`, W - 220, 48);
    ctx.fillText(`STATUS: ONLINE`, W - 150, 64);
    ctx.restore();

    requestAnimationFrame(drawFrame);
  }

  drawFrame();
})();

// ─── HAMBURGER MENU ───
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navMenu.classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
  });
});

// ─── SCROLL ANIMATIONS ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  observer.observe(el);
});