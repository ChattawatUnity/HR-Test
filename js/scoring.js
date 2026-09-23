/* Pure scoring functions — ไม่แตะ DOM ใช้ได้ทั้ง browser และ node */
(function (root) {
  function levenshtein(a, b) {
    a = Array.from(a); b = Array.from(b);
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[b.length];
  }

  /* char-level diff → [{t:"eq"|"del"|"ins", c}] (del = อยู่ใน a แต่หายไป, ins = พิมพ์เพิ่ม/ผิดใน b) */
  function diffOps(a, b) {
    a = Array.from(a || ""); b = Array.from(b || "");
    const n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i] === b[j]) { out.push({ t: "eq", c: a[i] }); i++; j++; }
      else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) { out.push({ t: "ins", c: b[j] }); j++; }
      else { out.push({ t: "del", c: a[i] }); i++; }
    }
    return out;
  }

  function similarity(a, b) {
    const len = Math.max(Array.from(a).length, Array.from(b).length);
    if (!len) return 1;
    return Math.max(0, 1 - levenshtein(a, b) / len);
  }

  function normalizeText(s) {
    return String(s || "")
      .replace(/\r\n?/g, "\n")
      .replace(/ /g, " ")
      .split("\n").map(l => l.replace(/[ \t]+$/g, "")).join("\n")
      .replace(/\n+$/g, "").replace(/^\n+/g, "");
  }

  function normalizeField(s) {
    return String(s || "").replace(/\s+/g, " ").trim().toUpperCase();
  }

  function thaiWordCount(s) {
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const seg = new Intl.Segmenter("th", { granularity: "word" });
        let n = 0;
        for (const w of seg.segment(s)) if (w.isWordLike) n++;
        return n;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  /* Part 1 */
  function scorePart1(typed, reference, secondsUsed) {
    const typedN = typed.replace(/\s+/g, " ").trim();
    const refN = reference.replace(/\s+/g, " ").trim();
    const refLen = Array.from(refN).length;
    const typedLen = Array.from(typedN).length;
    const dist = levenshtein(typedN, refN);
    const accuracy = refLen ? Math.max(0, 1 - dist / refLen) : 0;
    const minutes = Math.max(secondsUsed, 5) / 60;
    const wpm = (typedLen / 5) / minutes;
    return {
      typedChars: typedLen,
      referenceChars: refLen,
      errors: dist,
      accuracy: +accuracy.toFixed(4),
      wpm: +wpm.toFixed(1),
      netWpm: +(wpm * accuracy).toFixed(1),
      thaiWords: thaiWordCount(typedN),
      secondsUsed,
      completion: +Math.min(1, typedLen / (refLen || 1)).toFixed(4),
    };
  }

  /* Part 2 — ความถูกต้องรวม (To + Cc + เนื้อหา) นับเป็นเปอร์เซ็นต์ตัวอักษรที่ตรง */
  function scorePart2(answer, expected) {
    const lc = x => String(x || "").trim().toLowerCase();
    const bodyA = normalizeText(answer.body), bodyE = normalizeText(expected.body);
    const parts = [
      { key: "to",   a: lc(answer.to), e: lc(expected.to) },
      { key: "cc",   a: lc(answer.cc), e: lc(expected.cc) },
      { key: "body", a: bodyA, e: bodyE },
    ];
    let errors = 0, refLen = 0;
    const detail = {};
    for (const p of parts) {
      const d = levenshtein(p.a, p.e), len = Array.from(p.e).length;
      errors += d; refLen += len;
      detail[p.key] = { ok: d === 0, errors: d, similarity: +Math.max(0, 1 - d / Math.max(len, 1)).toFixed(4) };
    }
    const accuracy = +Math.max(0, 1 - errors / Math.max(refLen, 1)).toFixed(4);
    return {
      toOk: detail.to.ok, ccOk: detail.cc.ok, bodyOk: detail.body.ok, ccOpened: !!answer.ccOpened,
      bodySimilarity: detail.body.similarity, errors, referenceChars: refLen,
      accuracy, score: accuracy, detail,
    };
  }

  /* Part 3 */
  function scorePart3(answers, original, wrong) {
    const diffKeys = Object.keys(wrong).filter(k => normalizeField(wrong[k]) !== normalizeField(original[k]));
    let fixed = 0, missed = 0, damaged = 0;
    const detail = {};
    for (const k of Object.keys(original)) {
      const ok = normalizeField(answers[k]) === normalizeField(original[k]);
      const wasWrong = diffKeys.includes(k);
      if (wasWrong) { ok ? fixed++ : missed++; detail[k] = ok ? "fixed" : "missed"; }
      else if (!ok) { damaged++; detail[k] = "damaged"; }
    }
    const total = diffKeys.length;
    return { fixed, missed, damaged, total, score: total ? +(fixed / total).toFixed(4) : 1, detail };
  }

  /* Part 4 */
  function scorePart4(selected, questions) {
    let correct = 0;
    const detail = questions.map((q, i) => {
      const ok = selected[i] === q.answer;
      if (ok) correct++;
      return { q: q.q, selected: selected[i] == null ? null : q.choices[selected[i]], correct: ok };
    });
    return { correct, total: questions.length, score: +(correct / questions.length).toFixed(4), detail };
  }

  const api = { levenshtein, diffOps, similarity, normalizeText, normalizeField, scorePart1, scorePart2, scorePart3, scorePart4 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HR_SCORING = api;
})(typeof window !== "undefined" ? window : globalThis);
