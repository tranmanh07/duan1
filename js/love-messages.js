/**
 * love-messages.js  (v2 – nâng cấp)
 * Mỗi gesture có 3 bộ lời tình thay nhau, hiệu ứng typewriter từng ký tự.
 */

const GESTURE_MESSAGES = {
  open_hand: {
    icon: '🌸', name: 'Bàn Tay Mở', color: '#fda4af',
    sets: [
      ['Em là ánh sáng dịu dàng,', 'soi sáng mọi góc tối trong cuộc đời anh...', 'Anh trân trọng em mỗi ngày 🌸'],
      ['Như hoa nở giữa buổi sớm mai,', 'nụ cười em làm tim anh xao xuyến...', 'Em đẹp nhất trong mắt anh 🌺'],
      ['Mỗi ngón tay anh giơ lên', 'là một lời cảm ơn gửi đến em,', 'vì đã chọn anh làm bến đỗ 🌼'],
    ]
  },
  peace: {
    icon: '💕', name: 'Chữ V Tình Đôi', color: '#f472b6',
    sets: [
      ['Hai chúng ta, hai thế giới khác nhau,', 'nhưng cùng nhịp đập, cùng một trái tim...', 'Cùng nhau mọi thứ đều hoàn hảo 💕'],
      ['Trong vô vàn người anh đã gặp,', 'em là người anh muốn giữ lại nhất...', 'Mãi mãi bên nhau nhé 🫶'],
      ['Chữ "yêu" anh viết cho em', 'bằng cả trái tim và linh hồn,', 'không bao giờ xóa được ✌️'],
    ]
  },
  thumbs_up: {
    icon: '⭐', name: 'Ánh Sao Tình Yêu', color: '#fbbf24',
    sets: [
      ['Anh yêu em hơn tất cả những vì sao,', 'hơn cả những điều diệu kỳ nhất...', 'Em là điều tuyệt vời nhất đời anh ✨'],
      ['Nếu đêm tắt hết ngôi sao,', 'em vẫn là ánh sáng rực rỡ nhất...', 'trong trái tim anh ⭐'],
      ['Anh không cần cả vũ trụ,', 'vì em đã là cả thế giới của anh rồi...', 'Em thật tuyệt vời 💫'],
    ]
  },
  pinky: {
    icon: '🦋', name: 'Cánh Bướm Tình', color: '#c084fc',
    sets: [
      ['Trái tim anh nhẹ nhàng như cánh bướm,', 'mỗi khi nghĩ đến em...', 'Anh nhớ em mãi mãi 🦋'],
      ['Em bay vào cuộc đời anh', 'như cánh bướm lướt qua vườn hoa,', 'để lại hương thơm không phai 🌸'],
      ['Dù đường đời có bao xa,', 'anh vẫn tìm về bên em...', 'Vì đó là nơi anh thuộc về 💜'],
    ]
  },
  fist: {
    icon: '❤️‍🔥', name: 'Lửa Tình Yêu', color: '#f43f5e',
    sets: [
      ['Tình yêu của anh dành cho em', 'mãnh liệt và bất tận,', 'như ngọn lửa không bao giờ tắt ❤️‍🔥'],
      ['Anh sẽ đấu tranh vì em,', 'vì hạnh phúc của em là tất cả,', 'với anh là ý nghĩa của cuộc đời 🔥'],
      ['Dù bão tố hay giông tố,', 'anh vẫn đứng vững bên em...', 'Vì em là lý do anh mạnh mẽ ✊'],
    ]
  },
  default: {
    icon: '💕', name: '', color: '#fda4af',
    sets: [
      ['Giơ tay vào camera,', 'và để trái tim lên tiếng...', '💕'],
    ]
  }
};

// ─── Typewriter Engine ────────────────────────────────────────────────────────

const LoveMessages = (() => {
  let currentGesture = null;
  let setIndex       = {};  // Theo dõi bộ lời hiện tại per gesture
  let timers         = [];
  let charTimers     = [];

  const el = {
    icon    : null,
    line1   : null,
    line2   : null,
    line3   : null,
    msgBox  : null,
  };

  function init() {
    el.icon   = document.getElementById('love-icon-display');
    el.line1  = document.getElementById('msg-1');
    el.line2  = document.getElementById('msg-2');
    el.line3  = document.getElementById('msg-3');
    el.msgBox = document.getElementById('love-message-box');
    showMessage('default');
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    charTimers.forEach(clearTimeout);
    timers = []; charTimers = [];
  }

  function clearLines() {
    [el.line1, el.line2, el.line3].forEach(l => {
      if (l) { l.textContent = ''; l.classList.remove('visible'); }
    });
  }

  /**
   * Hiệu ứng typewriter: gõ từng ký tự cho một dòng.
   * @returns Promise resolve khi xong
   */
  function typewriterLine(lineEl, text, delay = 0, charDelay = 40) {
    return new Promise(resolve => {
      const t0 = setTimeout(() => {
        lineEl.textContent = '';
        lineEl.classList.add('visible');
        let i = 0;
        function tick() {
          if (i < text.length) {
            lineEl.textContent += text[i++];
            const t = setTimeout(tick, charDelay + Math.random() * 20);
            charTimers.push(t);
          } else {
            resolve();
          }
        }
        tick();
      }, delay);
      timers.push(t0);
    });
  }

  function showMessage(gesture) {
    if (gesture === currentGesture) return;
    currentGesture = gesture;

    const data = GESTURE_MESSAGES[gesture] || GESTURE_MESSAGES['default'];

    // Chọn bộ lời tiếp theo (tuần tự)
    if (!(gesture in setIndex)) setIndex[gesture] = 0;
    const lines = data.sets[setIndex[gesture] % data.sets.length];
    setIndex[gesture]++;

    clearAll();
    clearLines();

    // Đổi icon
    if (el.icon) {
      el.icon.style.animation = 'none';
      void el.icon.offsetWidth;
      el.icon.textContent = data.icon;
      el.icon.style.animation = 'heartBeat 1.5s ease-in-out infinite';
    }

    // Glow màu theo gesture
    if (el.msgBox) {
      el.msgBox.style.boxShadow =
        `0 8px 40px ${data.color}33, inset 0 0 0 1px rgba(255,255,255,0.05)`;
    }

    // Typewriter 3 dòng nối tiếp nhau
    const lineEls = [el.line1, el.line2, el.line3];
    let cumulativeDelay = 150;
    lines.forEach((text, i) => {
      const t = cumulativeDelay;
      cumulativeDelay += 100 + text.length * 42 + 200;
      if (lineEls[i]) {
        lineEls[i].style.color = i === 0 ? data.color : '';
        typewriterLine(lineEls[i], text, t);
      }
    });
  }

  function highlightGuide(gesture) {
    document.querySelectorAll('.guide-item').forEach(el => el.classList.remove('active'));
    const t = document.querySelector(`.guide-item[data-gesture="${gesture}"]`);
    if (t) t.classList.add('active');
  }

  function update(gesture) {
    const key = gesture && GESTURE_MESSAGES[gesture] ? gesture : 'default';
    showMessage(key);
    highlightGuide(key);
  }

  return { init, update };
})();
