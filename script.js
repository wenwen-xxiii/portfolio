/**
 * Portfolio Interactive Engine (800k.dev inspired)
 * - Sound Engine (Web Audio synthesizer, zero external audio dependencies needed)
 * - Theme Switcher (Circular Reveal View Transitions & dark class)
 * - Interactive Gaze Tracker Canvas (Looking in 8 directions according to mouse/touch)
 * - 3D Spotlight Project Deck
 * - Typing Speed Test Engine (⌘J / Alt+J)
 * - Ask Anything Terminal Overlay (⌘K / Alt+K)
 * - Modal System & Copy to Clipboard
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. Sound Synthesizer (Zero-latency Web Audio API)
     ========================================================================== */
  const Sound = (function () {
    const SOUND_KEY = 'site_sound_enabled';
    let ctx = null;
    let enabled = false;

    try {
      enabled = localStorage.getItem(SOUND_KEY) === 'true';
    } catch (e) {
      enabled = false;
    }

    function getCtx() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
      return ctx;
    }

    function play(type) {
      if (!enabled) return;
      const c = getCtx();
      if (!c) return;

      const now = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      if (type === 'tick') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'press') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'droplet') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === 'toggle') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(620, now + 0.07);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.03);
        gain.gain.setValueAtTime(0.025, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    }

    function toggle() {
      enabled = !enabled;
      try {
        localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
      } catch (e) { }
      getCtx();
      if (enabled) play('toggle');
      updateUi();
    }

    function updateUi() {
      const btns = document.querySelectorAll('[data-sound-toggle]');
      btns.forEach(b => {
        b.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        b.title = enabled ? 'Sounds on' : 'Sounds off';
        const onIcon = b.querySelector('[data-sound-on]');
        const offIcon = b.querySelector('[data-sound-off]');
        if (onIcon && offIcon) {
          onIcon.style.display = enabled ? 'inline-block' : 'none';
          offIcon.style.display = enabled ? 'none' : 'inline-block';
        }
      });
    }

    // Interactive sounds for hover & click
    let lastHoverTime = 0;
    function initInteractiveSounds() {
      const interactiveSelector = 'a, button, [role="button"], .theme-opt, .sound-btn, .gh-repo-card, .deck-card, .exp-skill-pill, .skill-pill, .cert-link-btn, .typing-key, .tab-btn';

      // Mouseenter delegation (captured)
      document.addEventListener('mouseover', (e) => {
        if (!enabled) return;
        const target = e.target.closest(interactiveSelector);
        if (!target) return;

        // Check if we just hovered this element or another element recently
        const now = Date.now();
        if (now - lastHoverTime < 35) return; // Prevent audio burst
        lastHoverTime = now;
        play('hover');
      }, { passive: true });

      // Click delegation
      document.addEventListener('click', (e) => {
        if (!enabled) return;
        const target = e.target.closest(interactiveSelector);
        if (!target) return;
        // Skip toggle button to avoid double sound with 'toggle'
        if (target.hasAttribute('data-sound-toggle') || target.closest('[data-sound-toggle]')) return;
        play('click');
      }, { passive: true });

      // Unlock AudioContext on first user interaction if enabled
      const unlockAudio = () => {
        if (enabled) getCtx();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }

    // Sync across open tabs
    window.addEventListener('storage', (e) => {
      if (e.key === SOUND_KEY) {
        enabled = e.newValue === 'true';
        updateUi();
      }
    });

    return { play, toggle, isEnabled: () => enabled, updateUi, initInteractiveSounds };
  })();
  window.siteSound = Sound;

  /* ==========================================================================
     2. Theme Switcher (View Transitions circular reveal + fallback)
     ========================================================================== */
  const Theme = (function () {
    const KEY = 'theme_pref';
    const root = document.documentElement;
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    let animTimer = null;

    function getPref() {
      try {
        const v = localStorage.getItem(KEY);
        return (v === 'dark' || v === 'light' || v === 'system') ? v : 'system';
      } catch (e) {
        return 'system';
      }
    }

    function isDark(pref) {
      return pref === 'dark' || (pref === 'system' && !!mq && mq.matches);
    }

    function setClass(pref) {
      root.classList.toggle('dark', isDark(pref));
      document.querySelectorAll('[data-theme-opt]').forEach(btn => {
        btn.classList.toggle('is-active', btn.getAttribute('data-theme-opt') === pref);
      });
      if (typeof initGithubGraph === 'function') initGithubGraph();
    }

    function crossfade(pref) {
      root.classList.add('theme-anim');
      setClass(pref);
      clearTimeout(animTimer);
      animTimer = setTimeout(() => root.classList.remove('theme-anim'), 520);
    }

    function reveal(pref, x, y) {
      if (!document.startViewTransition) {
        crossfade(pref);
        return;
      }
      const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const vt = document.startViewTransition(() => {
        setClass(pref);
      });
      vt.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 520, easing: 'cubic-bezier(0.32, 0.08, 0.24, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => { });
    }

    function setTheme(pref, ev) {
      try { localStorage.setItem(KEY, pref); } catch (e) { }
      if (isDark(pref) === root.classList.contains('dark')) {
        setClass(pref);
        return;
      }
      Sound.play('toggle');
      const x = (ev && ev.clientX) || window.innerWidth / 2;
      const y = (ev && ev.clientY) || 0;
      reveal(pref, x, y);
    }

    function init() {
      setClass(getPref());
      if (mq) {
        mq.addEventListener('change', () => {
          if (getPref() === 'system') crossfade('system');
        });
      }
    }

    return { init, setTheme };
  })();
  window.setTheme = Theme.setTheme;

  /* ==========================================================================
     3. Interactive Gaze Tracker Canvas (Looking towards pointer)
     ========================================================================== */
  function initGazeCanvas() {
    const canvas = document.getElementById('gazeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let currentAngle = 0;
    let currentLookDist = 0;
    let targetLookDist = 0;
    let targetAngle = 0;

    function render() {
      const rect = canvas.getBoundingClientRect();
      const headCenterX = rect.left + rect.width / 2;
      const headCenterY = rect.top + rect.height * 0.45;

      const dx = pointerX - headCenterX;
      const dy = pointerY - headCenterY;
      const dist = Math.hypot(dx, dy);

      targetAngle = Math.atan2(dy, dx);
      targetLookDist = Math.min(1, dist / (window.innerWidth * 0.35));

      // Ease current look
      currentAngle += (targetAngle - currentAngle) * 0.15;
      currentLookDist += (targetLookDist - currentLookDist) * 0.15;

      // Draw portrait on canvas
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const isDark = document.documentElement.classList.contains('dark');

      // Head Base / Silhouette (minimalist editorial tech style)
      const cx = w / 2;
      const cy = h * 0.44;

      // Soft gradient background inside avatar
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      if (isDark) {
        grad.addColorStop(0, '#1c1c22');
        grad.addColorStop(1, '#121216');
      } else {
        grad.addColorStop(0, '#f9f9fb');
        grad.addColorStop(1, '#ececef');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 28);
      ctx.fill();

      // Subtle halftone pattern in avatar background
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
      for (let x = 12; x < w; x += 16) {
        for (let y = 12; y < h; y += 16) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Shoulders / Hood
      ctx.fillStyle = isDark ? '#2b2b32' : '#d8d8de';
      ctx.beginPath();
      ctx.ellipse(cx, h + 30, w * 0.48, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Neck
      ctx.fillStyle = isDark ? '#e4b693' : '#ffd1ab';
      ctx.fillRect(cx - 24, cy + 45, 48, 55);

      // Face
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 74, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hair (dark clean crop)
      ctx.fillStyle = isDark ? '#141418' : '#1a1a1e';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 26, 66, 56, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + 64, cy + 6);
      ctx.lineTo(cx - 64, cy + 6);
      ctx.fill();

      // Eyes position offsets
      const maxEyeOffset = 7;
      const eyeOffsetX = Math.cos(currentAngle) * currentLookDist * maxEyeOffset;
      const eyeOffsetY = Math.sin(currentAngle) * currentLookDist * maxEyeOffset;

      const leftEyeX = cx - 24;
      const rightEyeX = cx + 24;
      const eyeY = cy - 2;

      // Eyebrows
      ctx.strokeStyle = isDark ? '#141418' : '#1a1a1e';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(leftEyeX - 14, eyeY - 14 + eyeOffsetY * 0.4);
      ctx.lineTo(leftEyeX + 14, eyeY - 13 + eyeOffsetY * 0.4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(rightEyeX - 14, eyeY - 13 + eyeOffsetY * 0.4);
      ctx.lineTo(rightEyeX + 14, eyeY - 14 + eyeOffsetY * 0.4);
      ctx.stroke();

      // Eye Whites
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(leftEyeX, eyeY, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX, eyeY, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils (tracks gaze!)
      ctx.fillStyle = '#111113';
      ctx.beginPath();
      ctx.arc(leftEyeX + eyeOffsetX, eyeY + eyeOffsetY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + eyeOffsetX, eyeY + eyeOffsetY, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight in eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX + eyeOffsetX - 1.8, eyeY + eyeOffsetY - 1.8, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + eyeOffsetX - 1.8, eyeY + eyeOffsetY - 1.8, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Glasses Frame (Modern minimal frames)
      ctx.strokeStyle = isDark ? '#f4f4f6' : '#121214';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(leftEyeX - 18, eyeY - 14, 36, 26, 7);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(rightEyeX - 18, eyeY - 14, 36, 26, 7);
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(leftEyeX + 18, eyeY - 3);
      ctx.lineTo(rightEyeX - 18, eyeY - 3);
      ctx.stroke();

      // Smile
      ctx.strokeStyle = isDark ? '#b88164' : '#c98a69';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(cx, cy + 34, 15, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

      requestAnimationFrame(render);
    }

    window.addEventListener('pointermove', (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
    }, { passive: true });

    render();
  }

  /* ==========================================================================
     4. 3D Spotlight Project Card Deck
     ========================================================================== */
  function activateDeckCard(card) {
    if (!card || card.classList.contains('is-center')) return;
    const deck = card.closest('[data-deck]');
    if (!deck) return;

    const center = deck.querySelector('.deck-card.is-center');
    const slot = card.classList.contains('is-left') ? 'is-left' : 'is-right';

    Sound.play('press');
    if (center) {
      center.classList.remove('is-center');
      center.classList.add(slot);
    }
    card.classList.remove('is-left', 'is-right');
    card.classList.add('is-center');
  }
  window.activateDeckCard = activateDeckCard;

  /* ==========================================================================
     5. Typing Speed Test Engine (⌘J / Alt+J)
     ========================================================================== */
  const TypingTest = (function () {
    const overlay = document.getElementById('typingOverlay');
    const wordsEl = document.getElementById('ttWords');
    const kbEl = document.getElementById('ttKeyboard');
    const elWpm = document.getElementById('ttWpm');
    const elAcc = document.getElementById('ttAcc');
    const elTime = document.getElementById('ttTime');
    const rWpm = document.getElementById('ttResWpm');
    const rAcc = document.getElementById('ttResAcc');
    const rRaw = document.getElementById('ttResRaw');
    const rTime = document.getElementById('ttResTime');

    const WORDS_BANK = [
      'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for', 'they',
      'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you', 'do', 'but', 'from',
      'or', 'which', 'one', 'would', 'all', 'will', 'there', 'say', 'who', 'make', 'when',
      'can', 'more', 'if', 'no', 'man', 'out', 'other', 'so', 'what', 'time', 'up', 'go',
      'about', 'than', 'into', 'could', 'state', 'only', 'new', 'year', 'some', 'take',
      'come', 'these', 'know', 'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work',
      'now', 'may', 'such', 'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also'
    ];

    const KB_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const TOTAL_WORDS = 24;

    let words = [];
    let wordEls = [];
    let wordIndex = 0;
    let charIndex = 0;
    let started = false;
    let finished = false;
    let startTime = 0;
    let rafId = null;
    let raw = 0;
    let correct = 0;
    let isOpen = false;

    const caretEl = document.createElement('span');
    caretEl.className = 'tt-caret';

    function buildKeyboard() {
      if (!kbEl) return;
      kbEl.innerHTML = '';
      KB_ROWS.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'tt-krow';
        for (const ch of row) {
          const key = document.createElement('span');
          key.className = 'tt-key';
          key.dataset.key = ch;
          key.textContent = ch;
          rowEl.appendChild(key);
        }
        kbEl.appendChild(rowEl);
      });
      const spaceRow = document.createElement('div');
      spaceRow.className = 'tt-krow';
      const spaceKey = document.createElement('span');
      spaceKey.className = 'tt-key space';
      spaceKey.dataset.key = ' ';
      spaceKey.textContent = 'space';
      spaceRow.appendChild(spaceKey);
      kbEl.appendChild(spaceRow);
    }

    function flashKey(ch) {
      if (!kbEl) return;
      const k = kbEl.querySelector(`.tt-key[data-key="${ch === ' ' ? ' ' : ch}"]`);
      if (k) {
        k.classList.add('active');
        setTimeout(() => k.classList.remove('active'), 110);
      }
    }

    function highlightNext() {
      if (!kbEl) return;
      kbEl.querySelectorAll('.tt-key.next').forEach(k => k.classList.remove('next'));
      if (finished) return;
      const cur = wordEls[wordIndex];
      let nextChar = null;
      if (cur && charIndex < cur.word.length) {
        nextChar = cur.word[charIndex];
      } else if (wordIndex < words.length - 1) {
        nextChar = ' ';
      }
      if (nextChar) {
        const k = kbEl.querySelector(`.tt-key[data-key="${nextChar}"]`);
        if (k) k.classList.add('next');
      }
    }

    function moveCaret() {
      const cur = wordEls[wordIndex];
      if (!cur) return;
      let left = 0;
      let top = 0;
      if (charIndex < cur.chars.length) {
        const el = cur.chars[charIndex];
        left = el.offsetLeft;
        top = el.offsetTop;
      } else if (cur.chars.length > 0) {
        const el = cur.chars[cur.chars.length - 1];
        left = el.offsetLeft + el.offsetWidth;
        top = el.offsetTop;
      }
      caretEl.style.left = `${left}px`;
      caretEl.style.top = `${top}px`;
    }

    function generateWords() {
      words = [];
      for (let i = 0; i < TOTAL_WORDS; i++) {
        words.push(WORDS_BANK[Math.floor(Math.random() * WORDS_BANK.length)]);
      }
    }

    function buildWords() {
      if (!wordsEl) return;
      wordsEl.innerHTML = '';
      wordEls = [];
      words.forEach(w => {
        const wEl = document.createElement('span');
        wEl.className = 'tt-word';
        const chars = [];
        for (const ch of w) {
          const c = document.createElement('span');
          c.className = 'tt-char';
          c.textContent = ch;
          wEl.appendChild(c);
          chars.push(c);
        }
        wordsEl.appendChild(wEl);
        wordEls.push({ el: wEl, chars, word: w });
      });
      wordsEl.appendChild(caretEl);
    }

    function loop() {
      if (!started || finished) return;
      const t = Math.max(0.1, (Date.now() - startTime) / 1000);
      const wpm = Math.round((correct / 5) / (t / 60));
      const acc = raw > 0 ? Math.round((correct / raw) * 100) : 100;
      if (elWpm) elWpm.textContent = wpm;
      if (elAcc) elAcc.textContent = acc;
      if (elTime) elTime.textContent = Math.floor(t);
      rafId = requestAnimationFrame(loop);
    }

    function finish() {
      finished = true;
      cancelAnimationFrame(rafId);
      const totalSeconds = Math.max(0.1, (Date.now() - startTime) / 1000);
      const wpm = Math.round((correct / 5) / (totalSeconds / 60));
      const acc = raw > 0 ? Math.round((correct / raw) * 100) : 100;
      const rawWpm = Math.round((raw / 5) / (totalSeconds / 60));

      if (rWpm) rWpm.textContent = wpm;
      if (rAcc) rAcc.textContent = acc;
      if (rRaw) rRaw.textContent = rawWpm;
      if (rTime) rTime.textContent = totalSeconds.toFixed(1);

      overlay.classList.add('show-results');
      Sound.play('success');
    }

    function handleChar(k) {
      if (finished) return;
      if (!started) {
        started = true;
        startTime = Date.now();
        rafId = requestAnimationFrame(loop);
      }
      const cur = wordEls[wordIndex];
      if (!cur) return;

      if (charIndex < cur.word.length) {
        const target = cur.word[charIndex];
        const ok = k === target;
        cur.chars[charIndex].classList.add(ok ? 'correct' : 'incorrect');
        raw++;
        if (ok) correct++;
        charIndex++;
        Sound.play(ok ? 'tick' : 'droplet');
      } else if (cur.chars.length - cur.word.length < 6) {
        const extra = document.createElement('span');
        extra.className = 'tt-char extra';
        extra.textContent = k;
        cur.el.appendChild(extra);
        cur.chars.push(extra);
        raw++;
        charIndex++;
        Sound.play('droplet');
      }

      moveCaret();
      highlightNext();

      if (wordIndex === words.length - 1 && charIndex >= cur.word.length) {
        finish();
      }
    }

    function handleSpace() {
      if (finished || !started) return;
      if (wordIndex < words.length - 1) {
        wordIndex++;
        charIndex = 0;
        Sound.play('press');
        moveCaret();
        highlightNext();
      }
    }

    function handleBackspace() {
      if (finished || !started) return;
      const cur = wordEls[wordIndex];
      if (charIndex > 0) {
        charIndex--;
        if (charIndex >= cur.word.length) {
          const ex = cur.chars.pop();
          if (ex) ex.remove();
        } else {
          cur.chars[charIndex].classList.remove('correct', 'incorrect');
        }
        Sound.play('press');
      } else if (wordIndex > 0) {
        wordIndex--;
        charIndex = wordEls[wordIndex].chars.length;
        Sound.play('press');
      }
      moveCaret();
      highlightNext();
    }

    function reset() {
      started = false;
      finished = false;
      startTime = 0;
      wordIndex = 0;
      charIndex = 0;
      raw = 0;
      correct = 0;
      cancelAnimationFrame(rafId);
      if (overlay) overlay.classList.remove('show-results');
      if (elWpm) elWpm.textContent = '0';
      if (elAcc) elAcc.textContent = '100';
      if (elTime) elTime.textContent = '0';
      generateWords();
      buildWords();
      requestAnimationFrame(() => {
        moveCaret();
        highlightNext();
      });
    }

    function open() {
      if (!overlay) return;
      overlay.classList.add('is-visible');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      isOpen = true;
      reset();
    }

    function close() {
      if (!overlay || !isOpen) return;
      isOpen = false;
      cancelAnimationFrame(rafId);
      document.documentElement.style.overflow = '';
      overlay.classList.remove('is-open');
      setTimeout(() => overlay.classList.remove('is-visible'), 320);
    }

    function init() {
      buildKeyboard();
      reset();

      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.altKey) && e.code === 'KeyJ') {
          e.preventDefault();
          isOpen ? close() : open();
          return;
        }
        if (!isOpen) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
          return;
        }
        if (e.key === 'Tab') {
          e.preventDefault();
          reset();
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          flashKey('backspace');
          handleBackspace();
          return;
        }
        if (e.key === ' ') {
          e.preventDefault();
          flashKey(' ');
          finished ? reset() : handleSpace();
          return;
        }
        if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
          e.preventDefault();
          const ch = e.key.toLowerCase();
          flashKey(ch);
          handleChar(ch);
        }
      });
    }

    return { init, open, close, reset };
  })();
  window.openTyping = TypingTest.open;
  window.closeTyping = TypingTest.close;
  window.ttRestart = TypingTest.reset;

  /* ==========================================================================
     6. Ask Anything Terminal Overlay (⌘K / Alt+K)
     ========================================================================== */
  const Ask = (function () {
    const overlay = document.getElementById('askOverlay');
    const input = document.getElementById('askInput');
    const textSpan = document.getElementById('askText');
    const title = document.querySelector('.ask-title');
    const bubble = document.getElementById('askBubble');
    const bubbleText = document.getElementById('askBubbleText');
    const caret = document.querySelector('.ask-caret');
    let busy = false;
    let isOpen = false;

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function open() {
      if (!overlay) return;
      overlay.classList.add('is-visible');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      isOpen = true;
      reset();
      setTimeout(() => input && input.focus(), 80);
    }

    function close() {
      if (!overlay || !isOpen) return;
      isOpen = false;
      document.documentElement.style.overflow = '';
      overlay.classList.remove('is-open');
      setTimeout(() => overlay.classList.remove('is-visible'), 320);
    }

    function reset() {
      busy = false;
      if (input) {
        input.value = '';
        input.removeAttribute('readonly');
      }
      if (textSpan) textSpan.textContent = '';
      if (title) title.textContent = 'what do you want to ask?';
      if (bubble) bubble.classList.remove('is-on');
      if (bubbleText) bubbleText.textContent = '';
      if (caret) caret.style.display = '';
    }

    async function submit() {
      if (busy || !input || !input.value.trim()) return;
      const q = input.value.trim();
      busy = true;
      input.setAttribute('readonly', 'true');
      if (caret) caret.style.display = 'none';

      // Open the tab NOW — synchronously inside the user-gesture context
      // (must happen before any await or browsers will block it as a popup)
      const searchWin = window.open('', '_blank');

      if (bubble && bubbleText) {
        bubbleText.textContent = q;
        bubble.classList.add('is-on');
      }

      Sound.play('tick');
      title.textContent = 'thinking...';
      await sleep(1400);

      title.textContent = 'analyzing question...';
      await sleep(1500);

      const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : 'browser';
      title.textContent = `detected ${browser} on your device.`;
      await sleep(2000);

      title.textContent = "i'd answer, but let's see what Google says :)";
      Sound.play('success');
      await sleep(1800);

      // Navigate the pre-opened tab to the search results
      if (searchWin) {
        searchWin.location.href = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      }
      close();
    }


    function init() {
      if (!input) return;
      input.addEventListener('input', () => {
        if (textSpan) textSpan.textContent = input.value;
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.altKey) && e.code === 'KeyK') {
          e.preventDefault();
          isOpen ? close() : open();
          return;
        }
        if (e.key === 'Escape' && isOpen) {
          close();
        }
      });
    }

    return { init, open, close };
  })();
  window.openAsk = Ask.open;
  window.closeAsk = Ask.close;

  /* ==========================================================================
     7. Generic Modal System & Email Copier
     ========================================================================== */
  const Modal = (function () {
    const modalEl = document.getElementById('modal');

    function open(name) {
      if (!modalEl) return;
      modalEl.querySelectorAll('[data-panel]').forEach(p => {
        p.style.display = p.getAttribute('data-panel') === name ? 'block' : 'none';
      });
      modalEl.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      Sound.play('press');
    }

    function close() {
      if (!modalEl) return;
      modalEl.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      Sound.play('press');
    }

    function copyEmail(ev, emailStr) {
      if (ev) ev.stopPropagation();
      const email = emailStr || 'bryllim@gmail.com';
      const btn = ev ? ev.currentTarget : null;

      navigator.clipboard.writeText(email).then(() => {
        Sound.play('success');
        if (btn) {
          const old = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => btn.textContent = old, 1600);
        }
      }).catch(() => {
        prompt('Copy email:', email);
      });
    }

    return { open, close, copyEmail };
  })();
  window.openModal = Modal.open;
  window.closeModal = Modal.close;
  window.copyEmail = Modal.copyEmail;

  /* ==========================================================================
     8. Mobile Navigation Drawer
     ========================================================================== */
  window.openMobileNav = function () {
    const nav = document.getElementById('mobileNav');
    if (!nav) return;
    nav.style.display = 'flex';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => nav.classList.add('is-open'));
    Sound.play('press');
  };

  window.closeMobileNav = function () {
    const nav = document.getElementById('mobileNav');
    if (!nav) return;
    nav.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    setTimeout(() => nav.style.display = 'none', 300);
  };

  /* ==========================================================================
     9. GitHub Activity Halftone Matrix Generator (1,019 commits profile)
     ========================================================================== */
  function initGithubGraph() {
    const svg = document.getElementById('githubGraph');
    if (!svg) return;

    const weeks = 53;
    const days = 7;
    const cellSize = 10;
    const cellGap = 3.4;
    const startX = 28;
    const startY = 22;

    // Months matching user's exact range (Sep to Sep)
    const monthCols = [
      { name: 'Sep', col: 0 },
      { name: 'Oct', col: 4 },
      { name: 'Nov', col: 9 },
      { name: 'Dec', col: 13 },
      { name: 'Jan', col: 17 },
      { name: 'Feb', col: 22 },
      { name: 'Mar', col: 26 },
      { name: 'Apr', col: 31 },
      { name: 'May', col: 35 },
      { name: 'Jun', col: 39 },
      { name: 'Jul', col: 44 },
      { name: 'Aug', col: 48 },
      { name: 'Sep', col: 51 }
    ];

    let headersSvg = '';
    monthCols.forEach(m => {
      const x = startX + m.col * (cellSize + cellGap);
      headersSvg += `<text x="${x}" y="11" fill="currentColor" opacity="0.55" font-family="'Geist Mono', monospace" font-size="9">${m.name}</text>`;
    });

    // Weekday labels (Mon, Wed, Fri)
    headersSvg += `
      <text x="2" y="${startY + 1 * (cellSize + cellGap) + 8}" fill="currentColor" opacity="0.45" font-family="'Geist Mono', monospace" font-size="8.5">Mon</text>
      <text x="2" y="${startY + 3 * (cellSize + cellGap) + 8}" fill="currentColor" opacity="0.45" font-family="'Geist Mono', monospace" font-size="8.5">Wed</text>
      <text x="2" y="${startY + 5 * (cellSize + cellGap) + 8}" fill="currentColor" opacity="0.45" font-family="'Geist Mono', monospace" font-size="8.5">Fri</text>
    `;

    // Activity distribution map matching user's real GitHub chart:
    // Sep-Nov: medium-high cluster
    // Dec-Jan: low/break
    // Jan end - Feb: brief activity
    // Mar: light ramp-up
    // Apr - May - Jun - Jul: high & peak intensity (bright green highlights)
    // Aug - Sep: steady active streak
    function getActivityLevel(w, d) {
      // Early period: w: 1..10 (Oct to mid-Nov)
      if (w >= 1 && w <= 9) {
        if ((w === 4 && d === 0) || (w === 5 && d === 1) || (w === 7 && d === 0)) return 4;
        if (d >= 1 && d <= 5 && Math.sin(w * 3 + d * 2) > -0.3) return (w % 2 === 0) ? 3 : 2;
        if (d === 6 && w % 3 === 0) return 2;
      }
      // Late Nov - Dec: calm
      if (w >= 10 && w <= 16) {
        if (w === 10 && d <= 3) return 2;
        if (w === 11 && d === 1) return 1;
        return 0;
      }
      // Jan: small cluster
      if (w >= 17 && w <= 20) {
        if ((w === 18 && (d === 1 || d === 4)) || (w === 19 && (d === 2 || d === 5))) return 2;
        return 0;
      }
      // Feb - mid Mar: break
      if (w >= 21 && w <= 24) return 0;
      // Late Mar: picking up
      if (w >= 25 && w <= 28) {
        if (d >= 2 && d <= 5) return ((w + d) % 3 === 0) ? 2 : 1;
        return 0;
      }
      // Apr - Jul: Major heavy streak (w: 29..44)
      if (w >= 29 && w <= 44) {
        // Peaks
        if ((w === 31 && d === 4) || (w === 38 && (d === 0 || d === 2)) || (w === 39 && d === 1) || (w === 41 && d === 1) || (w === 42 && d === 4)) return 4;
        // High density
        if (d >= 0 && d <= 6) {
          const v = Math.abs(Math.sin(w * 2.1 + d * 1.7));
          if (v > 0.65) return 3;
          if (v > 0.3) return 2;
          return 1;
        }
      }
      // Aug - Sep: steady active streak (w: 45..52)
      if (w >= 45) {
        if (w === 49 && d === 5) return 4;
        if (w === 48 && (d === 1 || d === 3)) return 3;
        if (w === 51 && d >= 1 && d <= 4) return 3;
        if (d <= 5 && (w + d) % 2 === 0) return 2;
        if (d >= 2 && d <= 4) return 1;
      }
      return 0;
    }

    // Strict Monochrome Aesthetic (white in dark mode, dark in light mode)
    const monoColors = [
      { dark: '#27272a', light: '#e4e4e7', r: 1.8, op: 0.35 }, // level 0 (dim backdrop)
      { dark: '#71717a', light: '#a1a1aa', r: 2.5, op: 0.65 }, // level 1
      { dark: '#a1a1aa', light: '#52525b', r: 3.3, op: 0.85 }, // level 2
      { dark: '#e4e4e7', light: '#27272a', r: 4.1, op: 0.95 }, // level 3
      { dark: '#ffffff', light: '#09090b', r: 5.0, op: 1.0 }   // level 4 (pure white peak)
    ];

    const colors = monoColors;
    const isDark = document.documentElement.classList.contains('dark');
    const selectedYear = window._ghYear || 'last';

    let cells = '';

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        let lvl = getActivityLevel(w, d);

        // Filter year logic
        if (selectedYear === '2024') {
          // Profile created Oct 2024 (w: 0..10 has activity)
          if (w > 12) lvl = 0;
        } else if (selectedYear === '2025') {
          // 2025 corresponds to the bulk of commits
          if (w < 10) lvl = (lvl > 1) ? 1 : 0;
        } else if (selectedYear === '2026') {
          // 2026 current year activity
          if (w < 35) lvl = 0;
        } else if (selectedYear === '2023') {
          lvl = 0;
        }

        const cfg = colors[lvl];
        const cx = startX + w * (cellSize + cellGap) + cellSize / 2;
        const cy = startY + d * (cellSize + cellGap) + cellSize / 2;
        const fill = isDark ? cfg.dark : cfg.light;

        cells += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${cfg.r}" fill="${fill}" opacity="${cfg.op}" class="gh-dot" data-level="${lvl}"/>`;
      }
    }

    svg.innerHTML = headersSvg + `<g class="gh-dots">${cells}</g>`;
  }

  window.setGhYear = function (year, btn) {
    window._ghYear = year;
    const group = btn.closest('.gh-ctrl-group');
    if (group) {
      group.querySelectorAll('.gh-ctrl-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
    }

    // Update count headline
    const countEl = document.getElementById('ghCommitCount');
    if (countEl) {
      if (year === 'last') countEl.innerHTML = '<b style="font-size: 1.35rem; color: rgb(var(--ink)); font-weight: 700;">1,019</b> contributions in the last year';
      else if (year === '2026') countEl.innerHTML = '<b style="font-size: 1.35rem; color: rgb(var(--ink)); font-weight: 700;">342</b> contributions in 2026';
      else if (year === '2025') countEl.innerHTML = '<b style="font-size: 1.35rem; color: rgb(var(--ink)); font-weight: 700;">677</b> contributions in 2025';
      else if (year === '2024') countEl.innerHTML = '<b style="font-size: 1.35rem; color: rgb(var(--ink)); font-weight: 700;">128</b> contributions in 2024';
      else if (year === '2023') countEl.innerHTML = '<b style="font-size: 1.35rem; color: rgb(var(--ink)); font-weight: 700;">0</b> contributions in 2023';
    }

    initGithubGraph();
  };

  /* ==========================================================================
     DOM Ready Bootstrapper
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    Theme.init();
    Sound.updateUi();
    Sound.initInteractiveSounds();
    initGazeCanvas();
    TypingTest.init();
    Ask.init();
    initGithubGraph();

    // Adjust shortcut modifier for Mac vs Windows / Linux
    const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgent || '');
    document.querySelectorAll('.ask-mod-key').forEach(el => {
      el.textContent = isMac ? '⌘' : 'Alt';
    });

    initVisitorStats();
  });

  /* ==========================================================================
     Live Active Visitors & Cumulative Total Visits Engine
     ========================================================================== */
  function initVisitorStats() {
    const TOTAL_VISITS_KEY = 'site_total_visits_v1';
    const SESSION_KEY = 'site_session_counted';
    const BASE_VISITS = 0; // Authentic base starting count

    // 1. Calculate & record Total Visits
    let totalVisits = BASE_VISITS;
    try {
      const stored = localStorage.getItem(TOTAL_VISITS_KEY);
      if (stored) {
        totalVisits = parseInt(stored, 10) || BASE_VISITS;
      }
      if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, '1');
        totalVisits += 1;
        localStorage.setItem(TOTAL_VISITS_KEY, totalVisits.toString());
      }
    } catch (e) { }

    // Update all Total Visits displays in the DOM
    function updateTotalVisitsUi() {
      const formatted = totalVisits.toLocaleString();
      document.querySelectorAll('[data-total-visits]').forEach(el => {
        el.textContent = formatted;
      });
    }
    updateTotalVisitsUi();

    // 2. Real-time Live Visitors simulation (natural fluctuation 6 - 12)
    let currentLive = 0;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e'];

    function updateLiveUi() {
      document.querySelectorAll('[data-live-visitors]').forEach(el => {
        el.textContent = currentLive;
      });
      document.querySelectorAll('[data-presence-more]').forEach(el => {
        const extra = Math.max(1, currentLive - 3);
        el.textContent = `+${extra}`;
      });
    }

    // Natural fluctuation every 4-8 seconds
    function scheduleNextLiveChange() {
      const delay = Math.floor(Math.random() * 4000) + 4000;
      setTimeout(() => {
        // Delta of -1, 0, or +1 with slight bias toward staying between 6 and 14
        const delta = Math.random() < 0.48 ? 1 : (Math.random() < 0.5 ? -1 : 0);
        currentLive = Math.max(5, Math.min(15, currentLive + delta));
        updateLiveUi();
        scheduleNextLiveChange();
      }, delay);
    }

    updateLiveUi();
    scheduleNextLiveChange();

    // Cross-tab sync for total visits
    window.addEventListener('storage', (e) => {
      if (e.key === TOTAL_VISITS_KEY && e.newValue) {
        totalVisits = parseInt(e.newValue, 10) || totalVisits;
        updateTotalVisitsUi();
      }
    });
  }

})();
