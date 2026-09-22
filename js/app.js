/**
 * app.js  (v2 – nâng cấp)
 * Điều phối: MediaPipe, camera, gesture, AR canvas, love messages,
 *            audio, love meter, và tất cả hiệu ứng UI.
 */

// ─── State ────────────────────────────────────────────────────────────────────

const AppState = {
  currentGesture  : null,
  lastGesture     : null,
  handDetected    : false,
  loveMeter       : 0,      // 0 – 100
  meterFull       : false,
  meterRafId      : null,
};

// ─── DOM ─────────────────────────────────────────────────────────────────────

const DOM = {
  splash          : document.getElementById('splash-screen'),
  startBtn        : document.getElementById('start-btn'),
  main            : document.getElementById('main-container'),
  loading         : document.getElementById('loading-overlay'),
  video           : document.getElementById('video'),
  arCanvas        : document.getElementById('ar-canvas'),
  gestureBadge    : document.getElementById('gesture-badge'),
  gestureEmoji    : document.getElementById('gesture-emoji'),
  gestureNameText : document.getElementById('gesture-name-text'),
  noHandHint      : document.getElementById('no-hand-hint'),
  audioBtn        : document.getElementById('audio-btn'),
  meterFill       : document.getElementById('love-meter-fill'),
  meterPct        : document.getElementById('love-meter-pct'),
  meterEmoji      : document.getElementById('love-meter-emoji'),
  loveFull        : document.getElementById('love-full-overlay'),
};

const ctx = DOM.arCanvas.getContext('2d');

// ─── Gesture Labels ───────────────────────────────────────────────────────────

const GESTURE_LABEL = {
  open_hand : { emoji: '🖐️', name: 'Mở Tay – Hoa Nở',     meterRate: 0.6 },
  peace     : { emoji: '✌️', name: 'Chữ V – Tình Đôi',     meterRate: 0.7 },
  thumbs_up : { emoji: '👍', name: 'Like – Ánh Sao',        meterRate: 0.8 },
  pinky     : { emoji: '🤙', name: 'Ngón Út – Bướm Bay',   meterRate: 0.65 },
  fist      : { emoji: '✊', name: 'Nắm Đấm – Lửa Tim',    meterRate: 1.0 },
};

// ─── Love Meter ──────────────────────────────────────────────────────────────

const METER_EMOJIS = ['💕','💗','💖','💘','❤️','❤️‍🔥'];

function updateMeterUI(value) {
  const clamped = Math.max(0, Math.min(100, value));
  DOM.meterFill.style.width   = `${clamped}%`;
  DOM.meterPct.textContent    = `${Math.round(clamped)}%`;

  const emojiIdx = Math.floor((clamped / 100) * (METER_EMOJIS.length - 1));
  DOM.meterEmoji.textContent  = METER_EMOJIS[emojiIdx];

  // Glow mạnh hơn khi đầy
  const glow = `0 0 ${8 + clamped * 0.3}px rgba(244,63,94,${0.4 + clamped * 0.005})`;
  DOM.meterFill.style.boxShadow = glow;
}

let meterInterval = null;

function startMeterFill(gesture) {
  clearInterval(meterInterval);
  const label = GESTURE_LABEL[gesture];
  if (!label) return;
  const rate = label.meterRate;

  meterInterval = setInterval(() => {
    if (AppState.loveMeter >= 100) {
      clearInterval(meterInterval);
      if (!AppState.meterFull) {
        AppState.meterFull = true;
        triggerLoveFull();
      }
      return;
    }
    AppState.loveMeter = Math.min(100, AppState.loveMeter + rate * 0.7);
    updateMeterUI(AppState.loveMeter);
  }, 50);
}

function startMeterDecay() {
  clearInterval(meterInterval);
  meterInterval = setInterval(() => {
    if (AppState.loveMeter <= 0) {
      clearInterval(meterInterval);
      AppState.meterFull = false;
      return;
    }
    AppState.loveMeter = Math.max(0, AppState.loveMeter - 0.4);
    updateMeterUI(AppState.loveMeter);
  }, 50);
}

function triggerLoveFull() {
  DOM.loveFull.classList.remove('hidden');
  ParticleSystem.burst(20);
  if (AudioManager.isEnabled()) {
    // Fanfare: nốt nhạc đặc biệt
    AudioManager.playGestureSound('fist');
    setTimeout(() => AudioManager.playGestureSound('open_hand'), 600);
  }
  setTimeout(() => {
    DOM.loveFull.classList.add('hidden');
    AppState.meterFull = false;
    AppState.loveMeter  = 0;
    updateMeterUI(0);
  }, 2500);
}

// ─── Canvas Resize ────────────────────────────────────────────────────────────

function resizeCanvas() {
  const r = DOM.arCanvas.parentElement.getBoundingClientRect();
  DOM.arCanvas.width  = r.width;
  DOM.arCanvas.height = r.height;
}

// ─── MediaPipe Results ────────────────────────────────────────────────────────

function onResults(results) {
  const W = DOM.arCanvas.width;
  const H = DOM.arCanvas.height;

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    if (AppState.handDetected) {
      AppState.handDetected = false;
      GestureDetector.reset();
      onGestureChange(null);
      startMeterDecay();
    }
    ctx.clearRect(0, 0, W, H);
    DOM.noHandHint.classList.remove('hidden');
    return;
  }

  DOM.noHandHint.classList.add('hidden');
  const landmarks       = results.multiHandLandmarks[0];
  AppState.handDetected = true;

  const gesture = GestureDetector.detect(landmarks);
  AppState.currentGesture = gesture;

  if (gesture !== AppState.lastGesture) {
    onGestureChange(gesture);
    AppState.lastGesture = gesture;
  }

  CanvasOverlay.draw(ctx, gesture, landmarks, W, H);
}

// ─── Gesture Change ───────────────────────────────────────────────────────────

function onGestureChange(gesture) {
  // Badge
  const label = gesture && GESTURE_LABEL[gesture];
  if (label) {
    DOM.gestureEmoji.textContent    = label.emoji;
    DOM.gestureNameText.textContent = label.name;
    DOM.gestureBadge.classList.remove('hidden');
  } else {
    DOM.gestureBadge.classList.add('hidden');
  }

  // Messages
  LoveMessages.update(gesture);

  // Particles burst
  if (gesture && gesture !== 'unknown') {
    ParticleSystem.burst(8);
    AudioManager.playGestureSound(gesture);
    startMeterFill(gesture);
  } else {
    startMeterDecay();
  }
}

// ─── MediaPipe & Camera Init ──────────────────────────────────────────────────

function initMediaPipe() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands           : 1,
    modelComplexity       : 1,
    minDetectionConfidence: 0.72,
    minTrackingConfidence : 0.55,
  });

  hands.onResults(onResults);

  const camera = new Camera(DOM.video, {
    onFrame: async () => { await hands.send({ image: DOM.video }); },
    width: 640, height: 480,
  });

  camera.start()
    .then(() => {
      DOM.loading.classList.add('hidden');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      ParticleSystem.start();
      AudioManager.init();
    })
    .catch((err) => {
      console.error('Camera error:', err);
      DOM.loading.querySelector('p').textContent =
        '❌ Không thể truy cập camera. Hãy cho phép quyền camera và thử lại.';
    });
}

// ─── Audio Toggle ─────────────────────────────────────────────────────────────

DOM.audioBtn.addEventListener('click', () => {
  const on = AudioManager.toggle();
  DOM.audioBtn.textContent = on ? '🔊' : '🔇';
  DOM.audioBtn.classList.toggle('active', on);
});

// ─── Splash → App ─────────────────────────────────────────────────────────────

DOM.startBtn.addEventListener('click', () => {
  DOM.splash.classList.add('fade-out');
  DOM.loading.classList.remove('hidden');
  DOM.main.classList.remove('hidden');

  LoveMessages.init();
  updateMeterUI(0);
  initMediaPipe();

  setTimeout(() => { DOM.splash.style.display = 'none'; }, 900);
});

// Start particles on splash
ParticleSystem.start();
