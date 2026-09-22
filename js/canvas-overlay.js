/**
 * canvas-overlay.js  (v2 – nâng cấp)
 * Vẽ hiệu ứng AR lên canvas + hệ thống particle nội bộ canvas.
 */

const CanvasOverlay = (() => {

  let animFrame = 0;

  // ─── Canvas Particle Pool ────────────────────────────────────────────────────

  const CP  = [];           // canvas particles
  const MAX = 120;

  function addParticle(x, y, type, opts = {}) {
    if (CP.length >= MAX) CP.shift();
    const speed = opts.speed || 1.8;
    CP.push({
      x, y, type,
      vx    : (Math.random() - 0.5) * speed * 1.5,
      vy    : -(Math.random() * speed + 0.8),
      life  : 1,
      decay : opts.decay  || 0.022,
      size  : opts.size   || 10,
      color : opts.color  || '#fda4af',
      angle : Math.random() * Math.PI * 2,
      spin  : (Math.random() - 0.5) * 0.15,
      gravity: opts.gravity || 0.04,
    });
  }

  function tickParticles(ctx) {
    for (let i = CP.length - 1; i >= 0; i--) {
      const p = CP[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += p.gravity;
      p.life -= p.decay;
      p.angle+= p.spin;
      if (p.life <= 0) { CP.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha = Math.min(p.life * 1.2, 1);

      if (p.type === 'petal') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.35, p.size * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 6;
        ctx.fill();

      } else if (p.type === 'heart') {
        drawHeart(ctx, p.x, p.y, p.size * 0.6, p.color, 1);

      } else if (p.type === 'star') {
        drawStar(ctx, p.x, p.y, p.size * 0.6, p.color, 1);

      } else if (p.type === 'sparkle') {
        // Tia sáng nhỏ hình chữ thập
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 8;
        const r = p.size * p.life;
        ctx.beginPath();
        ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y);
        ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x, p.y + r);
        ctx.stroke();

      } else if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (2 - p.life), 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth   = 2 * p.life;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 12;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ─── Drawing Primitives ──────────────────────────────────────────────────────

  function drawHeart(ctx, cx, cy, size, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.3);
    ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy - size * 0.5);
    ctx.bezierCurveTo(cx - size, cy - size * 1.2, cx, cy - size * 1.2, cx, cy - size * 0.5);
    ctx.bezierCurveTo(cx, cy - size * 1.2, cx + size, cy - size * 1.2, cx + size, cy - size * 0.5);
    ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + size * 0.3);
    ctx.closePath();
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = size * 1.4;
    ctx.fill();
    ctx.restore();
  }

  function drawStar(ctx, cx, cy, r, color, alpha = 1) {
    const spikes = 5;
    const inner  = r * 0.42;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const angle  = (Math.PI / spikes) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle   = color;
    ctx.shadowColor = color;
    ctx.shadowBlur  = r * 1.8;
    ctx.fill();
    ctx.restore();
  }

  function drawFlower(ctx, cx, cy, size, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI / n) * i + animFrame * 0.01;
      const px = cx + Math.cos(a) * size * 0.65;
      const py = cy + Math.sin(a) * size * 0.65;
      ctx.beginPath();
      ctx.arc(px, py, size * 0.44, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = size * 0.8;
      ctx.fill();
    }
    // Nhụy
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#fff9f0';
    ctx.shadowColor = '#ffecd2';
    ctx.shadowBlur  = size * 0.5;
    ctx.fill();
    ctx.restore();
  }

  function drawButterfly(ctx, cx, cy, size, alpha = 1) {
    const flap = Math.sin(animFrame * 0.14) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Cánh trên-trái
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-flap - 0.2);
    const g1 = ctx.createRadialGradient(-size * 0.4, -size * 0.3, 0, -size * 0.4, -size * 0.3, size);
    g1.addColorStop(0, 'rgba(220, 160, 255, 0.95)');
    g1.addColorStop(0.6, 'rgba(192, 100, 230, 0.7)');
    g1.addColorStop(1, 'rgba(150, 50, 200, 0.2)');
    ctx.beginPath();
    ctx.ellipse(-size * 0.65, -size * 0.35, size * 0.8, size * 0.55, -0.4, 0, Math.PI * 2);
    ctx.fillStyle   = g1;
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur  = size * 0.9;
    ctx.fill();
    // Hoa văn cánh
    ctx.beginPath();
    ctx.arc(-size * 0.7, -size * 0.4, size * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 255, 0.4)';
    ctx.fill();
    ctx.restore();

    // Cánh trên-phải
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(flap + 0.2);
    ctx.beginPath();
    ctx.ellipse(size * 0.65, -size * 0.35, size * 0.8, size * 0.55, 0.4, 0, Math.PI * 2);
    ctx.fillStyle   = g1;
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur  = size * 0.9;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.7, -size * 0.4, size * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 255, 0.4)';
    ctx.fill();
    ctx.restore();

    // Cánh dưới (nhỏ hơn)
    const flap2 = Math.sin(animFrame * 0.14 + 0.5) * 0.2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-flap2 - 0.1);
    ctx.beginPath();
    ctx.ellipse(-size * 0.4, size * 0.25, size * 0.45, size * 0.32, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 100, 250, 0.6)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(flap2 + 0.1);
    ctx.beginPath();
    ctx.ellipse(size * 0.4, size * 0.25, size * 0.45, size * 0.32, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200, 100, 250, 0.6)';
    ctx.fill();
    ctx.restore();

    // Thân bướm
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.07, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#581c87';
    ctx.fill();

    ctx.restore();
  }

  function drawSparkles(ctx, cx, cy, r, color, count = 8, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < count; i++) {
      const a = (2 * Math.PI / count) * i + animFrame * 0.035;
      const d = r * (0.8 + Math.sin(animFrame * 0.1 + i * 0.7) * 0.25);
      const sx = cx + Math.cos(a) * d;
      const sy = cy + Math.sin(a) * d;
      const sr = (2 + Math.sin(animFrame * 0.15 + i) * 1.2);
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle   = color;
      ctx.shadowColor = color;
      ctx.shadowBlur  = sr * 5;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHandSkeleton(ctx, lm, color = 'rgba(255,150,180,0.3)') {
    const conn = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],
      [0,17]
    ];
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.shadowColor = color;
    ctx.shadowBlur  = 8;
    ctx.globalAlpha = 0.55;
    conn.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(lm[a].x, lm[a].y);
      ctx.lineTo(lm[b].x, lm[b].y);
      ctx.stroke();
    });
    lm.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
    ctx.restore();
  }

  // ─── Gesture Overlays ────────────────────────────────────────────────────────

  const TIPS = [4, 8, 12, 16, 20];

  function drawOpenHand(ctx, lm, W) {
    const s = W / 640;
    drawHandSkeleton(ctx, lm, 'rgba(253,164,175,0.4)');

    TIPS.forEach((idx, i) => {
      const p    = lm[idx];
      const sz   = (20 + Math.sin(animFrame * 0.09 + i) * 5) * s;
      const alpha = 0.82 + Math.sin(animFrame * 0.07 + i) * 0.18;
      drawFlower(ctx, p.x, p.y - sz * 1.4, sz, '#fda4af', alpha);

      // Spawn petals every few frames
      if (animFrame % 3 === i % 3) {
        addParticle(p.x, p.y, 'petal', {
          size: (5 + Math.random() * 6) * s,
          color: ['#fda4af', '#f9a8d4', '#fbcfe8', '#fecdd3'][i % 4],
          speed: 1.2, decay: 0.018, gravity: 0.03,
        });
      }
    });

    // Hoa lòng bàn tay
    const palm = lm[0];
    drawFlower(ctx, palm.x, palm.y, 18 * s, '#f9a8d4', 0.5);
  }

  function drawPeace(ctx, lm, W) {
    const s = W / 640;
    drawHandSkeleton(ctx, lm, 'rgba(244,114,182,0.4)');

    const t1 = lm[8];  // ngón trỏ tip
    const t2 = lm[12]; // ngón giữa tip
    const mx = (t1.x + t2.x) / 2;
    const my = (t1.y + t2.y) / 2 - 28 * s;

    const pulse = 1 + Math.sin(animFrame * 0.13) * 0.18;

    drawHeart(ctx, t1.x, t1.y - 18 * s, 14 * s, '#f472b6');
    drawHeart(ctx, t2.x, t2.y - 18 * s, 14 * s, '#ec4899');
    drawHeart(ctx, mx, my, 22 * s * pulse, '#f43f5e', 0.88);
    drawSparkles(ctx, mx, my, 32 * s, '#fda4af', 10, 0.65);

    // Heart particles
    if (animFrame % 6 === 0) {
      addParticle(mx, my, 'heart', { size: (6 + Math.random() * 8) * s, color: '#f472b6', speed: 1.5, decay: 0.02 });
      addParticle(t1.x, t1.y, 'heart', { size: 5 * s, color: '#fda4af', speed: 1.2, decay: 0.025 });
      addParticle(t2.x, t2.y, 'heart', { size: 5 * s, color: '#fda4af', speed: 1.2, decay: 0.025 });
    }
  }

  function drawThumbsUp(ctx, lm, W) {
    const s = W / 640;
    drawHandSkeleton(ctx, lm, 'rgba(251,191,36,0.4)');

    const tip = lm[4];
    const r   = (26 + Math.sin(animFrame * 0.1) * 5) * s;

    ctx.save();
    ctx.translate(tip.x, tip.y - r * 1.2);
    ctx.rotate(animFrame * 0.025);
    drawStar(ctx, 0, 0, r, '#fbbf24');
    // Hào quang sao
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251,191,36,0.25)';
    ctx.lineWidth   = 3;
    ctx.stroke();
    ctx.restore();

    drawSparkles(ctx, tip.x, tip.y - r * 1.2, r * 2, '#fde68a', 12, 0.7);

    // Star + sparkle particles
    if (animFrame % 4 === 0) {
      addParticle(tip.x, tip.y, 'star', { size: (5 + Math.random() * 7) * s, color: '#fbbf24', speed: 2, decay: 0.02 });
    }
    if (animFrame % 3 === 0) {
      addParticle(
        tip.x + (Math.random() - 0.5) * 40 * s,
        tip.y - r + Math.random() * 20 * s,
        'sparkle', { size: (4 + Math.random() * 5) * s, color: '#fde68a', speed: 1, decay: 0.03 }
      );
    }
  }

  function drawPinky(ctx, lm, W) {
    const s = W / 640;
    drawHandSkeleton(ctx, lm, 'rgba(192,132,252,0.4)');

    const tip = lm[20];
    drawButterfly(ctx, tip.x, tip.y - 38 * s, 30 * s);
    drawSparkles(ctx, tip.x, tip.y - 38 * s, 40 * s, '#e879f9', 8, 0.5);

    // Particle trail theo ngón út
    if (animFrame % 4 === 0) {
      addParticle(tip.x, tip.y, 'sparkle', {
        size: (4 + Math.random() * 5) * s,
        color: '#c084fc', speed: 1.2, decay: 0.025,
      });
    }
  }

  function drawFist(ctx, lm, W) {
    const s    = W / 640;
    const palm = { x: (lm[0].x + lm[9].x) / 2, y: (lm[0].y + lm[9].y) / 2 };
    drawHandSkeleton(ctx, lm, 'rgba(244,63,94,0.4)');

    const pulse = 1 + Math.sin(animFrame * 0.16) * 0.22;
    const sz    = 38 * s * pulse;

    // Shockwave rings
    for (let r = 0; r < 3; r++) {
      const progress = ((animFrame * 0.6 + r * 30) % 90) / 90;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.35;
      ctx.beginPath();
      ctx.arc(palm.x, palm.y, sz * (1 + progress * 2.5), 0, Math.PI * 2);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth   = (1 - progress) * 3;
      ctx.stroke();
      ctx.restore();
    }

    drawHeart(ctx, palm.x, palm.y, sz, '#f43f5e', 0.92);

    // Orbiting mini hearts
    for (let i = 0; i < 5; i++) {
      const angle = (2 * Math.PI / 5) * i + animFrame * 0.025;
      const r     = (55 + Math.sin(animFrame * 0.1 + i) * 8) * s;
      const hx    = palm.x + Math.cos(angle) * r;
      const hy    = palm.y + Math.sin(angle) * r;
      const hs    = (7 + Math.sin(animFrame * 0.1 + i) * 2) * s;
      drawHeart(ctx, hx, hy, hs, '#fda4af', 0.75);
    }

    // Heart burst particles
    if (animFrame % 5 === 0) {
      addParticle(palm.x, palm.y, 'heart', {
        size: (8 + Math.random() * 10) * s,
        color: ['#f43f5e','#fb7185','#fda4af'][Math.floor(Math.random()*3)],
        speed: 2.5, decay: 0.018,
      });
      addParticle(palm.x, palm.y, 'ring', {
        size: sz * 0.8, color: '#f43f5e', decay: 0.035,
      });
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  function draw(ctx, gesture, landmarks, W, H) {
    animFrame++;
    ctx.clearRect(0, 0, W, H);

    // Tick particles even without hand
    tickParticles(ctx);

    if (!landmarks || landmarks.length === 0) return;

    const lm = GestureDetector.landmarksToCanvas(landmarks, W, H);

    switch (gesture) {
      case 'open_hand': drawOpenHand(ctx, lm, W); break;
      case 'peace':     drawPeace(ctx, lm, W);    break;
      case 'thumbs_up': drawThumbsUp(ctx, lm, W); break;
      case 'pinky':     drawPinky(ctx, lm, W);    break;
      case 'fist':      drawFist(ctx, lm, W);     break;
      default:
        drawHandSkeleton(ctx, lm, 'rgba(255,150,180,0.2)');
        break;
    }
  }

  return { draw };
})();
