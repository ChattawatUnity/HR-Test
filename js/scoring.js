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

  /* Part 2 */
  function scorePart2(answer, expected) {
    const eq = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
    const bodyA = normalizeText(answer.body), bodyE = normalizeText(expected.body);
    const subjA = normalizeText(answer.subject), subjE = normalizeText(expected.subject);
    const toOk = eq(answer.to, expected.to);
    const ccOk = eq(answer.cc, expected.cc);
    const subjectOk = subjA === subjE;
    const bodyOk = bodyA === bodyE;
    const bodySimilarity = +similarity(bodyA, bodyE).toFixed(4);
    const points = (toOk ? 1 : 0) + (ccOk ? 1 : 0) + (subjectOk ? 1 : 0) + (bodyOk ? 1 : 0);
    return { toOk, ccOk, ccOpened: !!answer.ccOpened, subjectOk, bodyOk, bodySimilarity, points, maxPoints: 4, score: +(points / 4).toFixed(4) };
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

  const api = { levenshtein, similarity, normalizeText, normalizeField, scorePart1, scorePart2, scorePart3, scorePart4 };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HR_SCORING = api;
})(typeof window !== "undefined" ? window : globalThis);
