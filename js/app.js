/* App : state machine / timer / anti-cheat / submit */
(function () {
  const cfg = window.HR_CONFIG;
  const ORDER = ["part1", "part2", "part3", "part4"];
  const STORAGE_KEY = "hrtest-state-v1";
  const app = document.getElementById("app");
  const timerEl = document.getElementById("timer");
  const timerVal = document.getElementById("timer-value");
  const timerLabel = document.getElementById("timer-label");

  let state = loadState() || {
    stage: "register",          // register | intro:partX | run:partX | summary
    candidate: null,
    startedAt: null,
    deadline: null,             // epoch ms ของ part ที่กำลังทำ
    partStartedAt: null,
    answers: {},
    results: {},
    violations: [],             // {part, type, at}
    submitted: false,
  };
  let timerHandle = null;
  let currentPart = null;       // { mod, container, submitBtn, confirmText }

  /* ---------- persistence ---------- */
  function saveState() { try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} }
  function loadState() { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch (e) { return null; } }

  /* ---------- anti-cheat ---------- */
  function currentPartId() { return state.stage.startsWith("run:") ? state.stage.slice(4) : null; }
  function logViolation(type) {
    const part = currentPartId();
    if (!part) return;
    state.violations.push({ part, type, at: new Date().toISOString() });
    saveState();
  }
  ["paste", "copy", "cut", "drop"].forEach(evt => {
    document.addEventListener(evt, e => {
      if (currentPartId()) { e.preventDefault(); logViolation(evt); }
    }, true);
  });
  document.addEventListener("contextmenu", e => { if (currentPartId()) e.preventDefault(); }, true);
  document.addEventListener("dragstart", e => { if (currentPartId()) e.preventDefault(); }, true);
  document.addEventListener("visibilitychange", () => { if (document.hidden) logViolation("tab-switch"); });
  window.addEventListener("blur", () => logViolation("window-blur"));
  window.addEventListener("beforeunload", e => {
    if (currentPartId()) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- timer ---------- */
  function fmt(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return String(Math.floor(sec / 60)).padStart(2, "0") + ":" + String(sec % 60).padStart(2, "0");
  }
  function startTimer(label, onExpire) {
    stopTimer();
    timerLabel.textContent = label;
    timerEl.classList.remove("hidden", "warning");
    const tick = () => {
      const left = (state.deadline - Date.now()) / 1000;
      timerVal.textContent = fmt(left);
      if (left <= 30) timerEl.classList.add("warning");
      if (left <= 0) { stopTimer(); onExpire(); }
    };
    tick();
    timerHandle = setInterval(tick, 250);
  }
  function stopTimer() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; }
  function hideTimer() { stopTimer(); timerEl.classList.add("hidden"); }

  /* ---------- views ---------- */
  function renderRegister() {
    hideTimer();
    app.innerHTML = `
      <div class="notice">
        <h2>ข้อกำหนดในการสอบ</h2>
        <ul>
          <li>ทำเรียงตามลำดับ ไม่สามารถย้อนกลับไป part ก่อนหน้าได้</li>
          <li>แต่ละส่วนมีเวลาจำกัด ในแต่ละ part จะเริ่มจับเวลาเมื่อกด "เริ่ม"</li>
          <li>ห้ามคัดลอก-วางข้อความ หรือเปิดหน้าจออื่นระหว่างทำแบบทดสอบ ระบบจะบันทึกความพยายามฝ่าฝืนไว้</li>
        </ul>
      </div>
      <div class="card">
        <h2>ลงทะเบียน</h2>
        <form id="reg-form" autocomplete="off">
          <label for="reg-name">ชื่อ-นามสกุล</label>
          <input type="text" id="reg-name" required>
          <label for="reg-phone">เบอร์โทรศัพท์</label>
          <input type="tel" id="reg-phone" required inputmode="numeric">
          <div class="error hidden" id="reg-error"></div>
          <button type="submit" class="btn btn-primary">เริ่มทำแบบทดสอบ</button>
        </form>
      </div>`;
    document.getElementById("reg-form").addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value.trim();
      const phone = document.getElementById("reg-phone").value.replace(/[\s-]/g, "");
      const err = document.getElementById("reg-error");
      if (!name) { err.textContent = "กรุณากรอกชื่อ-นามสกุล"; err.classList.remove("hidden"); return; }
      if (!/^\d{9,10}$/.test(phone)) { err.textContent = "กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก"; err.classList.remove("hidden"); return; }
      state.candidate = { name, phone };
      state.startedAt = new Date().toISOString();
      state.stage = "intro:part1";
      saveState(); render();
    });
  }

  function renderIntro(partId) {
    hideTimer();
    const mod = window.HR_PARTS[partId];
    const idx = ORDER.indexOf(partId) + 1;
    app.innerHTML = `
      <div class="card">
        <div class="part-title"><span class="badge">Part ${idx} / ${ORDER.length}</span><h2 style="margin:0">${mod.title}</h2></div>
        <div class="instructions">${mod.intro(cfg)}</div>
        <p class="muted">เมื่อกด "เริ่ม" ระบบจะเริ่มจับเวลาทันที</p>
        <button class="btn btn-primary" id="start-btn">เริ่ม</button>
      </div>`;
    document.getElementById("start-btn").addEventListener("click", () => {
      state.partStartedAt = Date.now();
      state.deadline = Date.now() + cfg.TIME_LIMITS[partId] * 1000;
      state.stage = "run:" + partId;
      saveState(); render();
    });
  }

  function renderRun(partId) {
    const mod = window.HR_PARTS[partId];
    const idx = ORDER.indexOf(partId) + 1;
    app.innerHTML = `
      <div class="card">
        <div class="part-title"><span class="badge">Part ${idx} / ${ORDER.length}</span><h2 style="margin:0">${mod.title}</h2></div>
        <div id="part-body"></div>
      </div>`;
    const container = document.getElementById("part-body");
    const ui = mod.render(cfg, container);
    currentPart = { mod, container, partId };
    let done = false;
    const finish = (auto) => {
      if (done) return; done = true;
      const secondsUsed = Math.min(cfg.TIME_LIMITS[partId], Math.round((Date.now() - state.partStartedAt) / 1000));
      const answer = mod.collect(cfg, container);
      state.answers[partId] = answer;
      state.results[partId] = Object.assign({ secondsUsed, autoSubmitted: !!auto }, mod.score(cfg, answer, secondsUsed));
      currentPart = null;
      const next = ORDER[ORDER.indexOf(partId) + 1];
      state.stage = next ? "intro:" + next : "summary";
      state.deadline = null;
      saveState(); render();
    };
    ui.submitBtn.addEventListener("click", () => {
      if (ui.confirmText && !window.confirm(ui.confirmText)) return;
      finish(false);
    });
    startTimer(`Part ${idx}`, () => { alert("หมดเวลา Part " + idx + " ระบบจะบันทึกคำตอบและไปส่วนถัดไป"); finish(true); });
  }

  function renderSummary() {
    hideTimer();
    const r = state.results;
    const pasteCount = state.violations.filter(v => ["paste", "copy", "cut", "drop"].includes(v.type)).length;
    const tabCount = state.violations.filter(v => ["tab-switch", "window-blur"].includes(v.type)).length;
    const pct = x => Math.round((x || 0) * 100) + "%";
    app.innerHTML = `
      <div class="card">
        <h2>ทำแบบทดสอบครบแล้ว</h2>
        <p>ขอบคุณคุณ <b>${escapeHtml(state.candidate.name)}</b> ที่ทำแบบทดสอบ ผลของคุณถูกบันทึกไว้แล้ว</p>
        <div class="summary-grid">
          <div class="stat"><div class="k">Part 1 พิมพ์ข้อความ</div><div class="v">${r.part1.wpm} WPM</div><div class="muted">ความถูกต้อง ${pct(r.part1.accuracy)}</div></div>
          <div class="stat"><div class="k">Part 2 อีเมล</div><div class="v">${r.part2.points}/${r.part2.maxPoints}</div><div class="muted">เนื้อหาตรง ${pct(r.part2.bodySimilarity)}</div></div>
          <div class="stat"><div class="k">Part 3 ตรวจเอกสาร</div><div class="v">${r.part3.fixed}/${r.part3.total}</div><div class="muted">แก้ผิดเพิ่ม ${r.part3.damaged} ช่อง</div></div>
          <div class="stat"><div class="k">Part 4 คำศัพท์</div><div class="v">${r.part4.correct}/${r.part4.total}</div></div>
        </div>
        <p id="submit-status" class="muted" style="margin-top:18px">กำลังส่งผล...</p>
        <div id="submit-fallback" class="hidden">
          <button class="btn btn-secondary btn-inline" id="download-btn">ดาวน์โหลดไฟล์ผลสอบ</button>
          <span class="muted"> กรุณาส่งไฟล์นี้ให้เจ้าหน้าที่</span>
        </div>
      </div>`;
    const payload = buildPayload(pasteCount, tabCount);
    document.getElementById("download-btn").addEventListener("click", () => downloadJson(payload));
    submitResults(payload);
  }

  function buildPayload(pasteCount, tabCount) {
    const r = state.results;
    return {
      timestamp: new Date().toISOString(),
      name: state.candidate.name,
      phone: state.candidate.phone,
      p1_wpm: r.part1.wpm, p1_netWpm: r.part1.netWpm, p1_accuracy: r.part1.accuracy, p1_completion: r.part1.completion, p1_timeUsed: r.part1.secondsUsed,
      p2_to_ok: r.part2.toOk, p2_cc_ok: r.part2.ccOk, p2_body_ok: r.part2.bodyOk, p2_body_similarity: r.part2.bodySimilarity, p2_timeUsed: r.part2.secondsUsed,
      p3_fixed: r.part3.fixed, p3_missed: r.part3.missed, p3_damaged: r.part3.damaged, p3_total: r.part3.total, p3_score: r.part3.score, p3_timeUsed: r.part3.secondsUsed,
      p4_correct: r.part4.correct, p4_total: r.part4.total, p4_score: r.part4.score, p4_timeUsed: r.part4.secondsUsed,
      violations_paste: pasteCount, violations_tabSwitch: tabCount,
      raw: { startedAt: state.startedAt, answers: state.answers, results: state.results, violations: state.violations, userAgent: navigator.userAgent },
    };
  }

  async function submitResults(payload) {
    const status = document.getElementById("submit-status");
    const fallback = document.getElementById("submit-fallback");
    if (!cfg.SHEETS_ENDPOINT) {
      status.innerHTML = '<span class="status-err">ระบบยังไม่ได้ตั้งค่าปลายทางส่งผล</span>';
      fallback.classList.remove("hidden"); return;
    }
    try {
      await fetch(cfg.SHEETS_ENDPOINT, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      status.innerHTML = '<span class="status-ok">ส่งผลเรียบร้อยแล้ว</span> สามารถปิดหน้าต่างนี้ได้';
      state.submitted = true; saveState();
    } catch (e) {
      status.innerHTML = '<span class="status-err">ส่งผลไม่สำเร็จ</span> กรุณาดาวน์โหลดไฟล์ผลด้านล่างแล้วส่งให้เจ้าหน้าที่';
      fallback.classList.remove("hidden");
    }
  }

  function downloadJson(payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hr-test-${payload.name.replace(/\s+/g, "_")}-${Date.now()}.json`;
    a.click();
  }

  function render() {
    const s = state.stage;
    if (s === "register") return renderRegister();
    if (s.startsWith("intro:")) return renderIntro(s.slice(6));
    if (s.startsWith("run:")) return renderRun(s.slice(4));
    if (s === "summary") return renderSummary();
  }

  render();
})();
