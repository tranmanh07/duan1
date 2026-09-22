/**
 * gesture.js
 * Nhận diện cử chỉ tay từ 21 điểm landmark của MediaPipe Hands.
 *
 * Gesture được phân loại:
 *  - open_hand  : Tất cả 5 ngón tay duỗi thẳng
 *  - peace      : Ngón trỏ + ngón giữa (chữ V)
 *  - thumbs_up  : Chỉ ngón cái chỉ lên, các ngón còn lại gập
 *  - pinky      : Chỉ ngón út duỗi thẳng
 *  - fist       : Tất cả ngón tay gập vào lòng bàn tay
 *  - unknown    : Không xác định
 */

const GestureDetector = (() => {

  // MediaPipe landmark indices
  const LM = {
    WRIST          : 0,
    THUMB_CMC      : 1, THUMB_MCP  : 2, THUMB_IP   : 3, THUMB_TIP  : 4,
    INDEX_MCP      : 5, INDEX_PIP  : 6, INDEX_DIP  : 7, INDEX_TIP  : 8,
    MIDDLE_MCP     : 9, MIDDLE_PIP : 10, MIDDLE_DIP: 11, MIDDLE_TIP : 12,
    RING_MCP       : 13, RING_PIP  : 14, RING_DIP  : 15, RING_TIP  : 16,
    PINKY_MCP      : 17, PINKY_PIP : 18, PINKY_DIP : 19, PINKY_TIP : 20,
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Trả về true nếu ngón tay (trỏ/giữa/nhẫn/út) duỗi thẳng.
   * Kiểm tra: đầu ngón (TIP) cao hơn khớp PIP (y nhỏ hơn = cao hơn trên màn hình).
   */
  function isFingerUp(lm, tipIdx, pipIdx) {
    return lm[tipIdx].y < lm[pipIdx].y - 0.02;
  }

  /**
   * Kiểm tra ngón cái duỗi ra (theo trục X vì ngón cái nằm ngang).
   * Sử dụng khoảng cách từ TIP đến INDEX_MCP.
   */
  function isThumbOut(lm) {
    const thumbTip  = lm[LM.THUMB_TIP];
    const thumbIp   = lm[LM.THUMB_IP];
    const thumbMcp  = lm[LM.THUMB_MCP];
    const indexMcp  = lm[LM.INDEX_MCP];

    // Ước tính kích thước bàn tay để chuẩn hoá
    const handSize  = dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP]);
    const thumbLen  = dist(thumbTip, indexMcp);

    return thumbLen > handSize * 0.55;
  }

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // ─── Smoothing (debounce gesture flicker) ───────────────────────────────────

  const HISTORY_SIZE = 6;
  let gestureHistory = [];

  function smoothGesture(raw) {
    gestureHistory.push(raw);
    if (gestureHistory.length > HISTORY_SIZE) gestureHistory.shift();

    // Majority vote
    const counts = {};
    gestureHistory.forEach(g => { counts[g] = (counts[g] || 0) + 1; });
    let best = raw, bestCount = 0;
    Object.entries(counts).forEach(([g, c]) => {
      if (c > bestCount) { bestCount = c; best = g; }
    });

    // Require majority (> half) to switch
    return bestCount >= Math.ceil(HISTORY_SIZE / 2) ? best : (gestureHistory[gestureHistory.length - 2] || 'unknown');
  }

  // ─── Main Detector ──────────────────────────────────────────────────────────

  function detect(landmarks) {
    if (!landmarks || landmarks.length < 21) return 'unknown';

    const lm = landmarks;

    const indexUp  = isFingerUp(lm, LM.INDEX_TIP,  LM.INDEX_PIP);
    const middleUp = isFingerUp(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP);
    const ringUp   = isFingerUp(lm, LM.RING_TIP,   LM.RING_PIP);
    const pinkyUp  = isFingerUp(lm, LM.PINKY_TIP,  LM.PINKY_PIP);
    const thumbOut = isThumbOut(lm);

    let raw;

    // Open hand: all 4 fingers up
    if (indexUp && middleUp && ringUp && pinkyUp) {
      raw = 'open_hand';
    }
    // Peace: index + middle up, others folded
    else if (indexUp && middleUp && !ringUp && !pinkyUp) {
      raw = 'peace';
    }
    // Thumbs up: thumb out, no fingers up
    else if (!indexUp && !middleUp && !ringUp && !pinkyUp && thumbOut) {
      raw = 'thumbs_up';
    }
    // Pinky: only pinky up
    else if (!indexUp && !middleUp && !ringUp && pinkyUp) {
      raw = 'pinky';
    }
    // Fist: nothing up
    else if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbOut) {
      raw = 'fist';
    }
    else {
      raw = 'unknown';
    }

    return smoothGesture(raw);
  }

  function reset() {
    gestureHistory = [];
  }

  /**
   * Tính toán toạ độ canvas (pixel) từ landmark normalised (0-1).
   * Lật trục X vì video được mirror bằng CSS.
   */
  function toCanvas(lm, canvasW, canvasH) {
    return {
      x: (1 - lm.x) * canvasW,
      y: lm.y * canvasH,
      z: lm.z
    };
  }

  /**
   * Chuyển đổi tất cả landmarks sang toạ độ canvas.
   */
  function landmarksToCanvas(landmarks, canvasW, canvasH) {
    return landmarks.map(lm => toCanvas(lm, canvasW, canvasH));
  }

  return { detect, reset, toCanvas, landmarksToCanvas, LM };
})();

