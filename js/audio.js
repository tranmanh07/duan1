/**
 * audio.js
 * Hệ thống âm thanh lãng mạn dùng Web Audio API.
 * Không cần file âm thanh bên ngoài – tất cả được tổng hợp trong trình duyệt.
 */

const AudioManager = (() => {

  let actx = null;  // AudioContext
  let enabled = false;
  let bgOscillators = [];
  let bgGain = null;
  let reverbNode = null;

  // ─── Thang âm pentatonic (âm điệu lãng mạn) ────────────────────────────────
  const NOTES = {
    C3: 130.81, G3: 196.00,
    C4: 261.63, E4: 329.63, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, E5: 659.25, G5: 783.99,
  };

  const PENTATONIC = [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.A4, NOTES.C5, NOTES.E5];

  // Âm điệu cho mỗi cử chỉ
  const GESTURE_ARPEGGIO = {
    open_hand : [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
    peace     : [NOTES.E4, NOTES.G4, NOTES.A4, NOTES.E5],
    thumbs_up : [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.E4, NOTES.C5],
    pinky     : [NOTES.A4, NOTES.C5, NOTES.E5],
    fist      : [NOTES.G3, NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5],
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /** Tạo reverb nhẹ bằng convolver với impulse response ngẫu nhiên */
  function createReverb() {
    const convolver  = actx.createConvolver();
    const sampleRate = actx.sampleRate;
    const length     = sampleRate * 2;          // 2 giây reverb tail
    const impulse    = actx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
      }
    }
    convolver.buffer = impulse;
    return convolver;
  }

  /** Phát một nốt nhạc (sine/triangle) có envelope */
  function playNote(freq, startTime, duration = 0.7, vol = 0.18, type = 'sine') {
    if (!actx || !enabled) return;

    const osc  = actx.createOscillator();
    const gain = actx.createGain();

    osc.type            = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    if (reverbNode) {
      gain.connect(reverbNode);
    } else {
      gain.connect(actx.destination);
    }

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /** Phát arpeggio (chuỗi nốt nhạc) cho cử chỉ */
  function playGestureSound(gesture) {
    if (!actx || !enabled) return;

    const notes = GESTURE_ARPEGGIO[gesture] || PENTATONIC.slice(0, 4);
    const now   = actx.currentTime;

    notes.forEach((freq, i) => {
      playNote(freq, now + i * 0.13, 0.55, 0.2, 'sine');
    });

    // Thêm chord nhẹ phía sau
    setTimeout(() => {
      if (!enabled) return;
      const t = actx.currentTime;
      playNote(notes[0] / 2, t, 0.9, 0.06, 'triangle');
      playNote(notes[1] || notes[0], t, 0.9, 0.06, 'triangle');
    }, 300);
  }

  /** Nhạc nền nhẹ: chord C major lơ lửng */
  function startBackground() {
    if (!actx || !enabled) return;

    bgGain = actx.createGain();
    bgGain.gain.value = 0;
    bgGain.gain.linearRampToValueAtTime(0.04, actx.currentTime + 2);

    if (reverbNode) bgGain.connect(reverbNode);
    else bgGain.connect(actx.destination);

    // Pad chord: C3 + G3 + E4 (mờ nhạt)
    [NOTES.C3, NOTES.G3, NOTES.E4].forEach(freq => {
      const osc = actx.createOscillator();
      osc.type            = 'sine';
      osc.frequency.value = freq;
      osc.connect(bgGain);
      osc.start();
      bgOscillators.push(osc);
    });

    // Tiếng chuông ngẫu nhiên mỗi vài giây
    scheduleChimes();
  }

  let chimeTimeout = null;

  function scheduleChimes() {
    if (!enabled) return;
    const delay = 3000 + Math.random() * 5000;
    chimeTimeout = setTimeout(() => {
      if (!enabled) return;
      const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
      playNote(note, actx.currentTime, 1.2, 0.12, 'sine');
      scheduleChimes();
    }, delay);
  }

  function stopBackground() {
    if (chimeTimeout) clearTimeout(chimeTimeout);
    bgOscillators.forEach(o => {
      try {
        o.stop();
      } catch (_) {}
    });
    bgOscillators = [];
    if (bgGain) {
      bgGain.gain.linearRampToValueAtTime(0, actx.currentTime + 0.5);
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  function init() {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      reverbNode = createReverb();
      reverbNode.connect(actx.destination);
    } catch (e) {
      console.warn('Web Audio API không khả dụng:', e);
    }
  }

  /** Bật/tắt âm thanh, trả về trạng thái mới */
  function toggle() {
    if (!actx) init();

    enabled = !enabled;

    if (enabled) {
      if (actx.state === 'suspended') actx.resume();
      startBackground();
    } else {
      stopBackground();
    }
    return enabled;
  }

  function isEnabled() { return enabled; }

  return { init, toggle, isEnabled, playGestureSound };
})();

