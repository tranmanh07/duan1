/**
 * particles.js
 * Hệ thống hạt nền: trái tim, hoa, và sao lơ lửng bay lên.
 */

const ParticleSystem = (() => {
  const EMOJIS = ['💕', '🌸', '✨', '💖', '🌺', '⭐', '🦋', '💗', '🌼', '💫'];
  let container = null;
  let interval = null;
  let active = false;

  function createParticle() {
    if (!active || !container) return;

    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    const size   = 0.9 + Math.random() * 1.4;
    const left   = Math.random() * 100;
    const dur    = 7 + Math.random() * 8;  // seconds
    const delay  = Math.random() * 2;

    p.style.cssText = `
      left: ${left}%;
      font-size: ${size}rem;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    container.appendChild(p);

    // Remove after animation ends
    setTimeout(() => p.remove(), (dur + delay + 0.5) * 1000);
  }

  function start() {
    if (active) return;
    active = true;
    container = document.getElementById('particles-container');

    // Spawn particles at random interval
    function spawnLoop() {
      createParticle();
      if (active) {
        const nextDelay = 600 + Math.random() * 900;
        interval = setTimeout(spawnLoop, nextDelay);
      }
    }
    spawnLoop();
  }

  function stop() {
    active = false;
    if (interval) clearTimeout(interval);
  }

  /**
   * Burst: spawn many particles at once (called on gesture change)
   */
  function burst(count = 8) {
    for (let i = 0; i < count; i++) {
      setTimeout(createParticle, i * 80);
    }
  }

  return { start, stop, burst };
})();

