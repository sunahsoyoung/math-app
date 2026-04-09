import { useState, useEffect, useRef, useCallback } from "react";

// ── PARTS ─────────────────────────────────────────────────────────────────
const PARTS = [
  { id: 1, title: "합이 9까지인 덧셈",              icon: "🌼", color: "#FF8C69", colorLight: "#FFF3EE", colorShadow: "#E06040", total: 20 },
  { id: 2, title: "한 자리 수의 뺄셈",              icon: "🍎", color: "#E05050", colorLight: "#FFF0F0", colorShadow: "#B03030", total: 25 },
  { id: 3, title: "세 수의 덧셈과 뺄셈",            icon: "🎯", color: "#7B68EE", colorLight: "#F3F0FF", colorShadow: "#5A4ECC", total: 25 },
  { id: 4, title: "(몇십)+(몇), (몇)+(몇십)",       icon: "🚂", color: "#3DAA6E", colorLight: "#EEFAF3", colorShadow: "#2A8050", total: 20 },
  { id: 5, title: "(몇십몇)±(몇)",                  icon: "⭐", color: "#F0A500", colorLight: "#FFFBEE", colorShadow: "#C07800", total: 20 },
  { id: 6, title: "(몇십)±(몇십)",                  icon: "🎠", color: "#26C6DA", colorLight: "#E0F9FC", colorShadow: "#0097A7", total: 20 },
  { id: 7, title: "(몇십몇)±(몇십몇)",              icon: "🚀", color: "#AB47BC", colorLight: "#F5E6F9", colorShadow: "#7B1FA2", total: 20 },
];

// ── CHARACTERS ────────────────────────────────────────────────────────────
const CHARS = [
  { id: 0, name: "씨앗이",   emoji: "🌰", need: 0   },
  { id: 1, name: "새싹이",   emoji: "🌱", need: 20  },
  { id: 2, name: "풀잎이",   emoji: "🌿", need: 45  },
  { id: 3, name: "꽃봉오리", emoji: "🌸", need: 65  },
  { id: 4, name: "나무야",   emoji: "🌳", need: 100 },
];

function getChar(n) {
  const list = CHARS.filter(c => c.need <= n);
  return list[list.length - 1] || CHARS[0];
}

// ── QUESTION POOL BUILDERS ────────────────────────────────────────────────
// Each builder returns ALL possible questions for that part, deduplicated.
// We then shuffle and slice to the required count, spacing repeats as far as possible.

function buildPool(partId) {
  const pool = [];
  switch (partId) {
    case 1: // a + b, sum ≤ 9, a,b ≥ 1
      for (let a = 1; a <= 8; a++)
        for (let b = 1; b <= 9 - a; b++)
          pool.push({ display: `${a} + ${b}`, answer: a + b });
      break;
    case 2: // single-digit subtraction, a ≥ 1, b ≥ 0, result ≥ 0
      for (let a = 1; a <= 9; a++)
        for (let b = 0; b <= a; b++)
          pool.push({ display: `${a} - ${b}`, answer: a - b });
      break;
    case 3: { // three-number: only ++ or -- (same op both times)
      // a + b + c  (result ≤ 9)
      for (let a = 1; a <= 7; a++)
        for (let b = 1; b <= 7; b++)
          for (let c = 1; c <= 7; c++) {
            if (a + b + c <= 9) pool.push({ display: `${a} + ${b} + ${c}`, answer: a + b + c });
          }
      // a - b - c  (result ≥ 0)
      for (let a = 1; a <= 9; a++)
        for (let b = 1; b <= a - 1; b++)
          for (let c = 1; c <= a - b; c++) {
            pool.push({ display: `${a} - ${b} - ${c}`, answer: a - b - c });
          }
      break;
    }
    case 4: // (tens) + (ones) both ways
      for (let t = 1; t <= 9; t++)
        for (let o = 1; o <= 9; o++) {
          pool.push({ display: `${t * 10} + ${o}`, answer: t * 10 + o });
          pool.push({ display: `${o} + ${t * 10}`, answer: t * 10 + o });
        }
      break;
    case 5: { // (2-digit) ± (1-digit), no carrying/borrowing
      for (let t = 1; t <= 9; t++)
        for (let ones = 1; ones <= 9; ones++) {
          const base = t * 10 + ones;
          // addition: ones + delta ≤ 9
          for (let d = 1; d <= 9 - ones; d++)
            pool.push({ display: `${base} + ${d}`, answer: base + d });
          // subtraction: ones - delta ≥ 0
          for (let d = 1; d <= ones; d++)
            pool.push({ display: `${base} - ${d}`, answer: base - d });
        }
      break;
    }
    case 6: { // (몇십)±(몇십), result 10~90
      for (let a = 1; a <= 9; a++)
        for (let b = 1; b <= 9; b++) {
          if (a + b <= 9) pool.push({ display: `${a * 10} + ${b * 10}`, answer: (a + b) * 10 });
          if (a > b) pool.push({ display: `${a * 10} - ${b * 10}`, answer: (a - b) * 10 });
          if (a === b) pool.push({ display: `${a * 10} - ${b * 10}`, answer: 0 });
        }
      break;
    }
    case 7: { // (몇십몇)±(몇십몇), no carrying/borrowing, result ≥ 0
      for (let at = 1; at <= 9; at++)
        for (let ao = 1; ao <= 9; ao++) {
          const a = at * 10 + ao;
          // addition: tens sum ≤ 9, ones sum ≤ 9
          for (let bt = 1; bt + at <= 9; bt++)
            for (let bo = 1; bo + ao <= 9; bo++)
              pool.push({ display: `${a} + ${bt * 10 + bo}`, answer: a + bt * 10 + bo });
          // subtraction: tens b < tens a, ones b ≤ ones a
          for (let bt = 1; bt < at; bt++)
            for (let bo = 0; bo <= ao; bo++)
              pool.push({ display: `${a} - ${bt * 10 + bo}`, answer: a - (bt * 10 + bo) });
        }
      break;
    }
    default: break;
  }
  return pool;
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a question sequence of `count` from the pool.
// If pool is large enough: just pick first `count` of shuffled pool (all unique).
// If pool is smaller than count: tile shuffled copies, each copy shuffled independently,
// so repeats appear as far apart as possible.
function buildSequence(partId, count) {
  const pool = buildPool(partId);
  if (pool.length === 0) return Array(count).fill({ display: "1 + 1", answer: 2 });

  if (pool.length >= count) {
    return shuffle(pool).slice(0, count);
  }

  // Need multiple passes — shuffle each pass so repeats are spread out
  const result = [];
  while (result.length < count) {
    const pass = shuffle(pool);
    result.push(...pass);
  }
  return result.slice(0, count);
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jua&family=Gaegu:wght@400;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-text-size-adjust: 100%; }
body { background: #FDFAF4; font-family: 'Gaegu', sans-serif; touch-action: manipulation; }

:root {
  --bg: #FDFAF4;
  --bg2: #F5F0E8;
  --green: #3DAA6E;
  --green-dark: #2A8050;
  --text: #2A2018;
  --text-soft: #7A6E60;
  --border: #E8DFD0;
  --max: 600px;
}

.app {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom, 24px);
}

/* ── TOPBAR ── */
.topbar {
  width: 100%;
  max-width: var(--max);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(14px, 3vw, 22px) clamp(16px, 4vw, 28px) clamp(10px, 2vw, 16px);
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 10;
  border-bottom: 2px dashed var(--border);
}
.logo {
  font-family: 'Jua', sans-serif;
  font-size: clamp(17px, 3.5vw, 24px);
  color: var(--green-dark);
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.top-right { display: flex; align-items: center; gap: 10px; }
.correct-badge {
  background: var(--green);
  color: white;
  border-radius: 30px;
  padding: clamp(4px,1vw,7px) clamp(10px,2vw,16px);
  font-family: 'Jua', sans-serif;
  font-size: clamp(13px, 2.5vw, 16px);
  box-shadow: 0 3px 0 var(--green-dark);
  white-space: nowrap;
}
.top-char { font-size: clamp(22px, 4vw, 30px); }

/* ── HOME ── */
.home {
  width: 100%;
  max-width: var(--max);
  padding: clamp(14px,3vw,24px) clamp(14px,3.5vw,24px) 0;
  display: flex;
  flex-direction: column;
  gap: clamp(12px,2.5vw,20px);
}

.char-banner {
  background: white;
  border-radius: clamp(20px,4vw,32px);
  padding: clamp(16px,3vw,26px) clamp(18px,4vw,28px);
  display: flex;
  align-items: center;
  gap: clamp(12px,3vw,22px);
  border: 2.5px solid var(--border);
  box-shadow: 0 6px 0 var(--border);
  position: relative;
  overflow: hidden;
}
.char-banner::before {
  content: '';
  position: absolute; right: -20px; top: -20px;
  width: 100px; height: 100px;
  background: var(--bg2); border-radius: 50%;
}
.char-big {
  font-size: clamp(52px, 10vw, 72px);
  animation: sway 3s ease-in-out infinite;
  z-index: 1; flex-shrink: 0;
}
@keyframes sway { 0%,100%{transform:rotate(-5deg);}50%{transform:rotate(5deg);} }
.char-info { flex: 1; z-index: 1; min-width: 0; }
.char-name { font-family: 'Jua', sans-serif; font-size: clamp(18px,3.5vw,24px); color: var(--text); }
.char-sub  { font-size: clamp(13px,2.5vw,16px); color: var(--text-soft); margin-top: 3px; }

.progress-wrap { display: flex; flex-direction: column; gap: 5px; margin-top: 10px; }
.progress-label {
  display: flex; justify-content: space-between;
  font-size: clamp(12px,2vw,14px); color: var(--text-soft);
  font-family: 'Jua', sans-serif;
}
.progress-bar-bg {
  width: 100%; height: clamp(10px,1.8vw,14px);
  background: var(--bg2); border-radius: 10px;
  overflow: hidden; border: 2px solid var(--border);
}
.progress-bar {
  height: 100%; border-radius: 8px;
  background: linear-gradient(90deg, #3DAA6E, #7BD4A0);
  transition: width 0.6s cubic-bezier(.4,2,.6,1);
}

.chars-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: clamp(6px,1.5vw,12px);
}
.char-tile {
  background: white; border-radius: clamp(12px,2.5vw,18px);
  padding: clamp(10px,2vw,16px) 4px;
  text-align: center; border: 2px solid var(--border);
  box-shadow: 0 3px 0 var(--border);
  opacity: .3; filter: grayscale(1); transition: all .3s;
}
.char-tile.ok { opacity: 1; filter: none; border-color: #c5e8b0; box-shadow: 0 3px 0 #c5e8b0; }
.char-tile-emoji { font-size: clamp(24px,5vw,36px); }
.char-tile-name  { font-family: 'Jua', sans-serif; font-size: clamp(10px,2vw,13px); color: var(--text); margin-top: 4px; }
.char-tile-need  { font-size: clamp(9px,1.5vw,11px); color: #bbb; margin-top: 1px; }

.parts-list { display: flex; flex-direction: column; gap: clamp(10px,2vw,14px); }

.part-card {
  background: white;
  border-radius: clamp(16px,3vw,24px);
  padding: clamp(14px,2.5vw,20px) clamp(14px,3vw,22px);
  display: flex; align-items: center;
  gap: clamp(12px,2.5vw,18px);
  border: 2.5px solid var(--border);
  box-shadow: 0 5px 0 var(--border);
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
  -webkit-tap-highlight-color: transparent;
}
.part-card:hover  { transform: translateY(-2px); box-shadow: 0 7px 0 var(--border); }
.part-card:active { transform: translateY(3px);  box-shadow: 0 2px 0 var(--border); }
.part-card.done   { border-color: #c5e8b0; box-shadow: 0 5px 0 #c5e8b0; }

.part-icon-wrap {
  width: clamp(44px,9vw,60px); height: clamp(44px,9vw,60px);
  border-radius: clamp(12px,2.5vw,18px);
  display: flex; align-items: center; justify-content: center;
  font-size: clamp(22px,4.5vw,32px); flex-shrink: 0;
}
.part-info { flex: 1; min-width: 0; }
.part-title { font-family: 'Jua', sans-serif; font-size: clamp(14px,3vw,18px); color: var(--text); }
.part-progress-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.part-progress-bg  { flex: 1; height: 7px; background: var(--bg2); border-radius: 6px; overflow: hidden; }
.part-progress-fill{ height: 100%; border-radius: 6px; transition: width .5s; }
.part-score-text   { font-size: clamp(11px,2vw,13px); color: var(--text-soft); font-family: 'Jua', sans-serif; white-space: nowrap; }
.part-badge {
  font-size: clamp(10px,2vw,12px); font-family: 'Jua', sans-serif;
  padding: 4px clamp(8px,1.5vw,12px); border-radius: 20px; color: white; flex-shrink: 0;
}

/* ── QUIZ ── */
.quiz-wrap {
  width: 100%;
  max-width: var(--max);
  padding: clamp(12px,2.5vw,20px) clamp(14px,3.5vw,24px) 0;
  display: flex; flex-direction: column;
  gap: clamp(12px,2.5vw,18px);
}

.quiz-header { display: flex; align-items: center; gap: 12px; }
.back-btn {
  width: clamp(38px,7vw,48px); height: clamp(38px,7vw,48px);
  background: white; border: 2px solid var(--border);
  border-radius: clamp(10px,2vw,14px);
  display: flex; align-items: center; justify-content: center;
  font-size: clamp(16px,3vw,20px);
  cursor: pointer; box-shadow: 0 3px 0 var(--border);
  transition: all .15s; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:hover { background: var(--bg2); }
.quiz-header-info { flex: 1; }
.quiz-part-title { font-family: 'Jua', sans-serif; font-size: clamp(15px,3vw,19px); color: var(--text); }
.quiz-qcount     { font-size: clamp(12px,2.5vw,15px); color: var(--text-soft); }

.qcard {
  background: white; border-radius: clamp(22px,4.5vw,32px);
  padding: clamp(32px,7vw,52px) clamp(20px,4vw,32px) clamp(26px,5.5vw,40px);
  text-align: center; border: 2.5px solid var(--border);
  box-shadow: 0 8px 0 var(--border);
  position: relative; overflow: hidden;
}
.qcard-deco {
  position: absolute; top: 14px; right: 18px;
  font-size: clamp(24px,5vw,36px); opacity: .12;
}
.question-display {
  font-family: 'Jua', sans-serif;
  font-size: clamp(44px, 10vw, 64px);
  color: var(--text); letter-spacing: -2px; line-height: 1;
}
.question-eq { color: var(--green); }

.ans-input {
  width: 100%;
  font-family: 'Jua', sans-serif;
  font-size: clamp(32px, 7vw, 44px);
  text-align: center;
  background: white; border: 3px solid var(--border);
  border-radius: clamp(16px,3.5vw,24px);
  padding: clamp(12px,2.5vw,18px);
  color: var(--text); outline: none;
  transition: border-color .2s, background .2s;
  -webkit-appearance: none;
}
.ans-input:focus { border-color: var(--green); }
.ans-input.correct { border-color: #4caf50; background: #F0FFF4; animation: pop .3s; }
.ans-input.wrong   { border-color: #e53935; background: #FFF5F5; animation: shake .3s; }

@keyframes pop   { 0%{transform:scale(1);}50%{transform:scale(1.05);}100%{transform:scale(1);} }
@keyframes shake { 0%,100%{transform:translateX(0);}25%{transform:translateX(-9px);}75%{transform:translateX(9px);} }

/* number keypad for mobile */
.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(8px,2vw,14px);
}
.numpad-btn {
  background: white; border: 2.5px solid var(--border);
  border-radius: clamp(14px,3vw,20px);
  padding: clamp(14px,3vw,20px) 4px;
  font-family: 'Jua', sans-serif;
  font-size: clamp(22px,4.5vw,30px);
  color: var(--text); cursor: pointer;
  box-shadow: 0 4px 0 var(--border);
  transition: all .12s; user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.numpad-btn:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--border); }
.numpad-btn.del { background: #FFF0F0; border-color: #F5C5C5; color: #E05050; box-shadow: 0 4px 0 #F5C5C5; }
.numpad-btn.del:active { box-shadow: 0 1px 0 #F5C5C5; }

.confirm-btn {
  width: 100%; color: white; border: none;
  border-radius: clamp(16px,3.5vw,24px);
  padding: clamp(15px,3vw,20px);
  font-family: 'Jua', sans-serif;
  font-size: clamp(17px,3.5vw,22px);
  cursor: pointer; transition: all .15s;
  -webkit-tap-highlight-color: transparent;
}
.confirm-btn:hover  { transform: translateY(-2px); }
.confirm-btn:active { transform: translateY(3px); }

/* ── RESULT ── */
.result-wrap {
  width: 100%; max-width: var(--max);
  padding: clamp(14px,3vw,22px) clamp(14px,3.5vw,24px) 0;
  display: flex; flex-direction: column;
  align-items: center; gap: clamp(12px,2.5vw,16px);
}
.result-card {
  width: 100%; background: white;
  border-radius: clamp(22px,4.5vw,32px);
  padding: clamp(26px,5vw,38px) clamp(18px,4vw,28px);
  text-align: center; border: 2.5px solid var(--border);
  box-shadow: 0 8px 0 var(--border);
}
.res-char  { font-size: clamp(56px,12vw,80px); animation: sway 2s ease-in-out infinite; }
.res-title { font-family: 'Jua', sans-serif; font-size: clamp(20px,4vw,28px); color: var(--text); margin: 10px 0 4px; }
.res-score { font-family: 'Jua', sans-serif; font-size: clamp(48px,10vw,66px); line-height: 1; }
.res-sub   { font-size: clamp(14px,2.5vw,16px); color: var(--text-soft); margin-bottom: 18px; }
.stat-row  {
  display: flex; justify-content: space-around;
  background: var(--bg2); border-radius: clamp(14px,3vw,20px);
  padding: clamp(12px,2.5vw,16px); margin-bottom: 18px;
}
.stat-num   { font-family: 'Jua', sans-serif; font-size: clamp(18px,4vw,26px); color: var(--text); }
.stat-label { font-size: clamp(11px,2vw,14px); color: var(--text-soft); }

.tabs {
  width: 100%; display: flex; background: white;
  border-radius: clamp(16px,3vw,22px); padding: 5px; gap: 4px;
  border: 2px solid var(--border);
}
.tab-btn {
  flex: 1; padding: clamp(8px,1.8vw,11px) 4px; border: none;
  background: transparent; border-radius: clamp(10px,2vw,14px);
  font-family: 'Jua', sans-serif; font-size: clamp(11px,2.2vw,14px);
  cursor: pointer; color: #aaa; transition: all .18s;
  -webkit-tap-highlight-color: transparent;
}
.tab-btn.on { background: var(--green); color: white; box-shadow: 0 3px 0 var(--green-dark); }

.btn-row { display: flex; gap: 10px; width: 100%; }
.btn-a {
  flex: 1; background: white; border: 2px solid var(--border);
  border-radius: clamp(12px,2.5vw,18px); padding: clamp(12px,2.5vw,16px);
  font-family: 'Jua', sans-serif; font-size: clamp(14px,2.8vw,17px);
  cursor: pointer; color: var(--text); transition: all .15s;
  -webkit-tap-highlight-color: transparent;
}
.btn-a:hover { background: var(--bg2); }
.btn-b {
  flex: 1; border: none;
  border-radius: clamp(12px,2.5vw,18px); padding: clamp(12px,2.5vw,16px);
  font-family: 'Jua', sans-serif; font-size: clamp(14px,2.8vw,17px);
  cursor: pointer; color: white; transition: all .15s;
  -webkit-tap-highlight-color: transparent;
}
.btn-b:hover { transform: translateY(-2px); }

.wrong-list { width: 100%; display: flex; flex-direction: column; gap: clamp(8px,2vw,12px); }
.wrong-item {
  background: white; border-radius: clamp(14px,3vw,20px);
  padding: clamp(12px,2.5vw,16px) clamp(14px,3vw,20px);
  border: 2px solid var(--border); box-shadow: 0 4px 0 var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.wq { font-family: 'Jua', sans-serif; font-size: clamp(17px,3.5vw,22px); color: var(--text); }
.wa { font-size: clamp(12px,2.2vw,15px); color: var(--text-soft); margin-top: 3px; }
.wa-mine    { color: #e53935; font-weight: 700; }
.wa-correct { color: #4caf50; font-weight: 700; }

/* feedback overlay */
.fb-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 999; }
.fb-text { font-size: clamp(60px,15vw,90px); animation: fbPop .8s forwards; filter: drop-shadow(0 4px 12px rgba(0,0,0,.15)); }
@keyframes fbPop {
  0%  { transform: scale(.4) translateY(20px); opacity: 1; }
  55% { transform: scale(1.15) translateY(-50px); opacity: 1; }
  100%{ transform: scale(1) translateY(-110px); opacity: 0; }
}

.unlock-banner {
  width: 100%;
  background: linear-gradient(120deg, #2A8050, #3DAA6E);
  border-radius: clamp(16px,3vw,22px); padding: clamp(12px,2.5vw,16px) clamp(14px,3vw,20px);
  display: flex; align-items: center; gap: 14px;
  color: white; box-shadow: 0 6px 0 #1a5c3a;
  animation: slideDown .35s ease;
}
@keyframes slideDown { from{transform:translateY(-16px);opacity:0;}to{transform:translateY(0);opacity:1;} }

/* progress strip */
.progress-strip {
  width: 100%; height: clamp(6px,1.5vw,10px);
  background: var(--bg2); border-radius: 6px; overflow: hidden;
}
.progress-strip-fill {
  height: 100%; border-radius: 6px; transition: width .4s;
}
`;

// ── 🔑 비밀번호 설정 (여기서 변경하세요) ────────────────────────────────
const ACCESS_PASSWORD = "수다방1234";

// ── LOCK SCREEN ───────────────────────────────────────────────────────────
function LockScreen({ onUnlock }) {
  const [pw, setPw]         = useState("");
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);

  const tryUnlock = () => {
    if (pw === ACCESS_PASSWORD) {
      sessionStorage.setItem("unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setPw("");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") tryUnlock(); };

  return (
    <div style={{
      minHeight:"100vh", minHeight:"100dvh",
      background:"linear-gradient(160deg,#f0fce8,#e8f5e0,#f5fcf0)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"24px", fontFamily:"'Gaegu',sans-serif"
    }}>
      <div style={{
        background:"white", borderRadius:"clamp(24px,5vw,36px)",
        padding:"clamp(32px,7vw,52px) clamp(24px,5vw,40px)",
        width:"100%", maxWidth:"420px",
        border:"2.5px solid #E8DFD0",
        boxShadow:"0 10px 0 #E8DFD0",
        textAlign:"center", display:"flex",
        flexDirection:"column", gap:"20px"
      }}>
        <div style={{ fontSize:"clamp(56px,14vw,80px)", animation:"sway 3s ease-in-out infinite" }}>🌳</div>
        <div>
          <div style={{
            fontFamily:"'Jua',sans-serif",
            fontSize:"clamp(20px,4.5vw,28px)",
            color:"#2A2018", marginBottom:"6px"
          }}>
            ✨ 반짝반짝 연산수다방
          </div>
          <div style={{ fontSize:"clamp(14px,3vw,17px)", color:"#7A6E60" }}>
            이용권 비밀번호를 입력해주세요 🔑
          </div>
        </div>

        <input
          type="password"
          placeholder="비밀번호 입력"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={handleKey}
          autoFocus
          style={{
            width:"100%",
            fontFamily:"'Jua',sans-serif",
            fontSize:"clamp(20px,4vw,26px)",
            textAlign:"center",
            border:`3px solid ${error ? "#e53935" : "#E8DFD0"}`,
            borderRadius:"clamp(14px,3vw,20px)",
            padding:"clamp(12px,2.5vw,16px)",
            background: error ? "#FFF5F5" : "#FDFAF4",
            color:"#2A2018", outline:"none",
            animation: shake ? "shake .4s" : "none",
            transition:"border-color .2s, background .2s"
          }}
        />

        {error && (
          <div style={{
            color:"#e53935", fontFamily:"'Jua',sans-serif",
            fontSize:"clamp(14px,3vw,17px)", marginTop:"-8px"
          }}>
            비밀번호가 틀렸어요 😢
          </div>
        )}

        <button
          onClick={tryUnlock}
          style={{
            background:"#3DAA6E", color:"white", border:"none",
            borderRadius:"clamp(14px,3vw,20px)",
            padding:"clamp(14px,3vw,18px)",
            fontFamily:"'Jua',sans-serif",
            fontSize:"clamp(17px,3.5vw,22px)",
            cursor:"pointer",
            boxShadow:"0 6px 0 #2A8050",
            transition:"all .15s"
          }}
        >
          🚀 입장하기
        </button>

        <div style={{ fontSize:"clamp(12px,2.5vw,14px)", color:"#bbb", marginTop:"-8px" }}>
          크몽에서 구매하신 분께 비밀번호를 안내드려요
        </div>
      </div>
    </div>
  );
}

// ── NUMPAD COMPONENT ─────────────────────────────────────────────────────
function NumPad({ value, onChange, onSubmit }) {
  const press = (k) => {
    if (k === "del") { onChange(value.slice(0, -1)); return; }
    if (k === "ok")  { onSubmit(); return; }
    if (value.length >= 3) return; // max 3 digits
    onChange(value + k);
  };
  const keys = ["1","2","3","4","5","6","7","8","9","del","0","ok"];
  return (
    <div className="numpad">
      {keys.map(k => (
        <button
          key={k}
          className={`numpad-btn${k === "del" ? " del" : ""}`}
          onPointerDown={e => { e.preventDefault(); press(k); }}
        >
          {k === "del" ? "⌫" : k === "ok" ? "✅" : k}
        </button>
      ))}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────
export default function App() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem("unlocked") === "1"
  );

  if (!unlocked) return <LockScreen onUnlock={() => setUnlocked(true)} />;

  return <MainApp />;
}

function MainApp() {
  const [partData, setPartData] = useState(() =>
    Object.fromEntries(PARTS.map(p => [p.id, { correct: 0, wrong: 0, wrongList: [], done: false }]))
  );

  const totalCorrect = Object.values(partData).reduce((s, d) => s + d.correct, 0);
  const currentChar  = getChar(totalCorrect);

  const [screen, setScreen]       = useState("home");
  const [activePart, setActivePart] = useState(null);
  const [resultTab, setResultTab] = useState("result");

  const [question, setQuestion]   = useState(null);
  const [input, setInput]         = useState("");
  const [inputState, setInputState] = useState("");
  const [qIndex, setQIndex]       = useState(0);
  const [feedback, setFeedback]   = useState(null);
  const [unlockBanner, setUnlock] = useState(null);

  // refs for closure safety
  const questionRef    = useRef(null);
  const inputRef       = useRef("");
  const qIndexRef      = useRef(0);
  const correctRef     = useRef(0);
  const wrongRef       = useRef(0);
  const wrongListRef   = useRef([]);
  const processingRef  = useRef(false);
  const activePartRef  = useRef(null);
  const seqRef         = useRef([]); // pre-built question sequence
  const prevTotalRef   = useRef(0);

  useEffect(() => { inputRef.current = input; }, [input]);

  // inject CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  // detect touch device to decide whether to show numpad
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const showQ = useCallback((idx) => {
    const q = seqRef.current[idx];
    if (!q) return;
    questionRef.current = q;
    setQuestion(q);
    setInput("");
    inputRef.current = "";
    setInputState("");
    processingRef.current = false;
  }, []);

  const handleSubmit = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    const q = questionRef.current;
    if (!q) { processingRef.current = false; return; }

    const raw     = inputRef.current;
    const userAns = parseInt(raw, 10);
    const correct = !isNaN(userAns) && userAns === q.answer;

    setInputState(correct ? "correct" : "wrong");
    setFeedback(correct ? "⭐" : "💥");
    setTimeout(() => setFeedback(null), 800);

    if (correct) correctRef.current += 1;
    else {
      wrongRef.current += 1;
      wrongListRef.current.push({ question: q.display, answer: q.answer, userAnswer: userAns });
    }

    const nextIdx = qIndexRef.current + 1;
    qIndexRef.current = nextIdx;
    setQIndex(nextIdx);

    const part = activePartRef.current;

    if (nextIdx >= part.total) {
      const snapC = correctRef.current;
      const snapW = wrongRef.current;
      const snapWL = [...wrongListRef.current];
      setTimeout(() => {
        setPartData(prev => {
          const newData = { ...prev, [part.id]: { correct: snapC, wrong: snapW, wrongList: snapWL, done: true } };
          const newTotal = Object.values(newData).reduce((s, d) => s + d.correct, 0);
          const prevChar = getChar(prevTotalRef.current);
          const nxtChar  = getChar(newTotal);
          if (nxtChar.id > prevChar.id) setUnlock(nxtChar);
          prevTotalRef.current = newTotal;
          return newData;
        });
        setScreen("result");
        setResultTab("result");
        processingRef.current = false;
      }, 500);
    } else {
      setTimeout(() => showQ(nextIdx), 500);
    }
  }, [showQ]);

  const handleKey = (e) => { if (e.key === "Enter") handleSubmit(); };

  const startPart = (part) => {
    activePartRef.current = part;
    setActivePart(part);
    correctRef.current   = 0;
    wrongRef.current     = 0;
    wrongListRef.current = [];
    qIndexRef.current    = 0;
    processingRef.current = false;
    seqRef.current = buildSequence(part.id, part.total);
    setQIndex(0);
    setUnlock(null);
    setScreen("quiz");
    showQ(0);
  };

  const retryPart = () => startPart(activePart);
  const goHome    = () => { setScreen("home"); setUnlock(null); };

  const nextChar = CHARS.find(c => c.need > totalCorrect);
  const progressPct = nextChar
    ? Math.min(totalCorrect / nextChar.need, 1) * 100
    : 100;

  return (
    <div className="app">
      {feedback && (
        <div className="fb-overlay"><div className="fb-text">{feedback}</div></div>
      )}

      {/* TOPBAR */}
      <div className="topbar">
        <div className="logo">✨ 반짝반짝 연산수다방</div>
        <div className="top-right">
          <div className="correct-badge">✅ {totalCorrect}개</div>
          <div className="top-char">{currentChar.emoji}</div>
        </div>
      </div>

      {/* ── HOME ── */}
      {screen === "home" && (
        <div className="home">
          {/* char banner */}
          <div className="char-banner">
            <div className="char-big">{currentChar.emoji}</div>
            <div className="char-info">
              <div className="char-name">{currentChar.name}</div>
              <div className="char-sub">
                {nextChar
                  ? `${nextChar.emoji} ${nextChar.name}까지 ${nextChar.need - totalCorrect}개 남았어!`
                  : "🎉 모두 해금 완료!"}
              </div>
              <div className="progress-wrap">
                <div className="progress-label">
                  <span>{totalCorrect}개 정답</span>
                  <span>{nextChar ? `목표 ${nextChar.need}개` : "🌳 완성!"}</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* char row */}
          <div className="chars-grid">
            {CHARS.map(c => (
              <div key={c.id} className={`char-tile${totalCorrect >= c.need ? " ok" : ""}`}>
                <div className="char-tile-emoji">{c.emoji}</div>
                <div className="char-tile-name">{c.name}</div>
                <div className="char-tile-need">{totalCorrect >= c.need ? "🔓" : `${c.need}개`}</div>
              </div>
            ))}
          </div>

          {/* parts */}
          <div className="parts-list">
            {PARTS.map(p => {
              const pd  = partData[p.id];
              const pct = pd.done ? (pd.correct / p.total) * 100 : 0;
              return (
                <div
                  key={p.id}
                  className={`part-card${pd.done ? " done" : ""}`}
                  onClick={() => startPart(p)}
                >
                  <div className="part-icon-wrap" style={{ background: p.colorLight }}>
                    <span>{p.icon}</span>
                  </div>
                  <div className="part-info">
                    <div className="part-title">{p.title}</div>
                    <div className="part-progress-row">
                      <div className="part-progress-bg">
                        <div className="part-progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                      <div className="part-score-text">
                        {pd.done ? `${pd.correct}/${p.total}` : `${p.total}문제`}
                      </div>
                    </div>
                  </div>
                  {pd.done && <div className="part-badge" style={{ background: p.color }}>완료</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {screen === "quiz" && activePart && question && (
        <div className="quiz-wrap">
          {unlockBanner && (
            <div className="unlock-banner">
              <div style={{ fontSize: "clamp(32px,7vw,44px)" }}>{unlockBanner.emoji}</div>
              <div>
                <div style={{ fontFamily:"'Jua',sans-serif", fontSize:"clamp(14px,3vw,18px)" }}>🎉 캐릭터 해금!</div>
                <div style={{ fontSize:"clamp(12px,2.5vw,15px)", opacity:.9 }}>{unlockBanner.name} 등장!</div>
              </div>
            </div>
          )}

          <div className="quiz-header">
            <button className="back-btn" onClick={goHome}>←</button>
            <div className="quiz-header-info">
              <div className="quiz-part-title">{activePart.icon} {activePart.title}</div>
              <div className="quiz-qcount">문제 {qIndex + 1} / {activePart.total}</div>
            </div>
            <div style={{ fontSize: "clamp(22px,4.5vw,30px)" }}>{currentChar.emoji}</div>
          </div>

          <div className="progress-strip">
            <div className="progress-strip-fill" style={{ width: `${(qIndex / activePart.total) * 100}%`, background: activePart.color }} />
          </div>

          <div className="qcard">
            <div className="qcard-deco">{activePart.icon}</div>
            <div style={{ fontSize: "clamp(16px,3vw,22px)", marginBottom: 10, opacity: .4 }}>{currentChar.emoji}</div>
            <div className="question-display">
              {question.display} <span className="question-eq">= ?</span>
            </div>
          </div>

          {/* show native input on desktop, numpad on touch */}
          {!isTouch ? (
            <input
              className={`ans-input${inputState ? " "+inputState : ""}`}
              type="number"
              placeholder="정답 입력"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
          ) : (
            <div
              className={`ans-input${inputState ? " "+inputState : ""}`}
              style={{ cursor:"default", minHeight: "clamp(60px,12vw,80px)", display:"flex", alignItems:"center", justifyContent:"center" }}
            >
              {input || <span style={{ opacity:.35 }}>정답 입력</span>}
            </div>
          )}

          {isTouch ? (
            <NumPad value={input} onChange={setInput} onSubmit={handleSubmit} />
          ) : (
            <button
              className="confirm-btn"
              style={{ background: activePart.color, boxShadow: `0 6px 0 ${activePart.colorShadow}` }}
              onClick={handleSubmit}
            >
              ✅ 확인!
            </button>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === "result" && activePart && (
        <div className="result-wrap">
          <div className="tabs">
            <button className={`tab-btn${resultTab==="result"?" on":""}`} onClick={()=>setResultTab("result")}>🏅 결과</button>
            <button className={`tab-btn${resultTab==="wrong" ?" on":""}`} onClick={()=>setResultTab("wrong")}>📝 오답노트</button>
            <button className={`tab-btn${resultTab==="chars" ?" on":""}`} onClick={()=>setResultTab("chars")}>🌿 캐릭터</button>
          </div>

          {resultTab === "result" && (() => {
            const pd = partData[activePart.id];
            return (
              <div className="result-card">
                <div className="res-char">{currentChar.emoji}</div>
                <div className="res-title">
                  {pd.correct === activePart.total ? "만점이야! 🎉"
                    : pd.correct >= activePart.total * .8 ? "정말 잘했어! 👍"
                    : pd.correct >= activePart.total * .5 ? "잘하고 있어! 💪"
                    : "다시 도전해봐! 🌱"}
                </div>
                <div className="res-score" style={{ color: activePart.color }}>
                  {pd.correct} <span style={{ fontSize:"clamp(22px,4.5vw,30px)", color:"var(--text-soft)" }}>/ {activePart.total}</span>
                </div>
                <div className="res-sub">{activePart.title}</div>
                <div className="stat-row">
                  <div className="stat-item"><div className="stat-num">✅ {pd.correct}</div><div className="stat-label">정답</div></div>
                  <div className="stat-item"><div className="stat-num">❌ {pd.wrong}</div><div className="stat-label">오답</div></div>
                  <div className="stat-item"><div className="stat-num">🌰 {totalCorrect}</div><div className="stat-label">누적정답</div></div>
                </div>
                <div className="btn-row">
                  <button className="btn-a" onClick={goHome}>🏠 홈</button>
                  <button className="btn-b" style={{ background: activePart.color, boxShadow:`0 4px 0 ${activePart.colorShadow}` }} onClick={retryPart}>🔄 다시하기</button>
                </div>
              </div>
            );
          })()}

          {resultTab === "wrong" && (() => {
            const pd = partData[activePart.id];
            return (
              <div className="wrong-list">
                <div style={{ fontFamily:"'Jua',sans-serif", fontSize:"clamp(16px,3vw,20px)", color:"var(--text)" }}>
                  📝 오답 노트 ({pd.wrongList.length}개)
                </div>
                {pd.wrongList.length === 0 ? (
                  <div className="result-card" style={{ textAlign:"center" }}>
                    <div style={{fontSize:"clamp(44px,10vw,60px)"}}>🌸</div>
                    <div style={{fontFamily:"'Jua',sans-serif",fontSize:"clamp(17px,3.5vw,22px)",marginTop:10}}>오답이 없어요!<br/>완벽해요!</div>
                  </div>
                ) : pd.wrongList.map((w, i) => (
                  <div key={i} className="wrong-item">
                    <div>
                      <div className="wq">{w.question} = ?</div>
                      <div className="wa">내 답: <span className="wa-mine">{w.userAnswer}</span> → 정답: <span className="wa-correct">{w.answer}</span></div>
                    </div>
                    <div style={{fontSize:"clamp(18px,3.5vw,22px)"}}>❌</div>
                  </div>
                ))}
                <div className="btn-row">
                  <button className="btn-a" onClick={goHome}>🏠 홈</button>
                  <button className="btn-b" style={{ background: activePart.color, boxShadow:`0 4px 0 ${activePart.colorShadow}` }} onClick={retryPart}>🔄 다시하기</button>
                </div>
              </div>
            );
          })()}

          {resultTab === "chars" && (
            <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"clamp(12px,2.5vw,16px)" }}>
              <div style={{ fontFamily:"'Jua',sans-serif", fontSize:"clamp(16px,3vw,20px)", color:"var(--text)" }}>🌿 캐릭터 컬렉션</div>
              <div className="chars-grid">
                {CHARS.map(c => (
                  <div key={c.id} className={`char-tile${totalCorrect >= c.need ? " ok" : ""}`}>
                    <div className="char-tile-emoji">{c.emoji}</div>
                    <div className="char-tile-name">{c.name}</div>
                    <div className="char-tile-need">{totalCorrect >= c.need ? "🔓" : `${c.need}개`}</div>
                  </div>
                ))}
              </div>
              <div className="btn-row">
                <button className="btn-a" onClick={goHome}>🏠 홈</button>
                <button className="btn-b" style={{ background: activePart.color, boxShadow:`0 4px 0 ${activePart.colorShadow}` }} onClick={retryPart}>🔄 다시하기</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
