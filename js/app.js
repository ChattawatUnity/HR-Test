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
  function startTimer(label, onExpire, countUp) {
    stopTimer();
    timerLabel.textContent = label;
    timerEl.classList.remove("hidden", "warning");
    const tick = () => {
      const left = (state.deadline - Date.now()) / 1000;
      if (countUp) {
        timerVal.textContent = fmt((Date.now() - state.partStartedAt) / 1000);
      } else {
        timerVal.textContent = fmt(left);
        if (left <= 30) timerEl.classList.add("warning");
      }
      if (left <= 0) { stopTimer(); onExpire(); }
    };
    tick();
    timerHandle = setInterval(tick, 250);
  }
  function stopTimer() { if (timerHandle) clearInterval(timerHandle); timerHandle = null; }
  function hideTimer() { stopTimer(); timerEl.classList.add("hidden"); }

  /* ---------- in-page modal (ไม่ใช้ confirm/alert ของเบราว์เซอร์ เพราะทำให้หลุดเต็มจอ) ---------- */
  let modalResolve = null;
  function closeModal(result) {
    const ov = document.getElementById("modal-overlay");
    if (ov) ov.remove();
    document.removeEventListener("keydown", modalKeys, true);
    if (modalResolve) { const r = modalResolve; modalResolve = null; r(result); }
  }
  function modalKeys(e) {
    if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); closeModal(true); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeModal(false); }
  }
  function showModal({ message, okText = "ตกลง", cancelText = null }) {
    closeModal(false);
    return new Promise(resolve => {
      modalResolve = resolve;
      const ov = document.createElement("div");
      ov.id = "modal-overlay"; ov.className = "modal-overlay";
      ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
          <p class="modal-msg"></p>
          <div class="modal-actions">
            ${cancelText ? `<button type="button" class="btn btn-secondary btn-inline" data-r="0"></button>` : ""}
            <button type="button" class="btn btn-primary btn-inline" data-r="1"></button>
          </div></div>`;
      ov.querySelector(".modal-msg").textContent = message;
      ov.querySelector('[data-r="1"]').textContent = okText;
      if (cancelText) ov.querySelector('[data-r="0"]').textContent = cancelText;
      ov.addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (b) closeModal(b.dataset.r === "1"); });
      document.body.appendChild(ov);
      document.addEventListener("keydown", modalKeys, true);
      ov.querySelector('[data-r="1"]').focus();
    });
  }

  /* ---------- ปุ่มกลับเข้าเต็มจอ ---------- */
  const fsBtn = document.getElementById("fs-btn");
  function isFullscreen() {
    return !!document.fullscreenElement || (window.innerHeight >= screen.height - 2 && window.innerWidth >= screen.width - 2);
  }
  function updateFsBtn() {
    const inPart = state.stage !== "register" && state.stage !== "summary";
    fsBtn.classList.toggle("hidden", !inPart || isFullscreen());
  }
  fsBtn.addEventListener("click", () => {
    try { document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
  });
  document.addEventListener("fullscreenchange", updateFsBtn);
  window.addEventListener("resize", updateFsBtn);

  /* ---------- views ---------- */
  function renderRegister() {
    hideTimer();
    app.innerHTML = `
      <div class="notice">
        <h2>ข้อกำหนดในการทดสอบ</h2>
        <ul>
          <li>ทำเรียงตามลำดับ ไม่สามารถย้อนกลับไป part ก่อนหน้าได้</li>
          <li>แต่ละส่วนมีเวลาจำกัด ในแต่ละ part จะเริ่มจับเวลาเมื่อกด "เริ่ม"</li>
          <li>ระบบทำการปิดการคัดลอก-วางข้อความไว้</li>
          <li>แนะนำให้ทำแบบทดสอบแบบเต็มหน้าจอ (ระบบจะขอเปิดเต็มจอให้เมื่อกดเริ่ม หรือสามารถกด F11 เองได้)</li>
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
      try { const el = document.documentElement; if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {}); } catch (e) {}
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
    let asking = false;
    ui.submitBtn.addEventListener("click", async () => {
      if (asking || done) return;
      if (ui.confirmText) {
        asking = true;
        const ok = await showModal({ message: ui.confirmText, okText: "ส่ง", cancelText: "ยกเลิก" });
        asking = false;
        if (!ok) return;
      }
      finish(false);
    });
    const countUp = partId === "part1" && !!cfg.PART1_COUNT_UP;
    startTimer(countUp ? "เวลาที่ใช้" : `Part ${idx}`, () => {
      closeModal(false);
      finish(true);
      showModal({ message: `หมดเวลา Part ${idx} ระบบบันทึกคำตอบแล้ว`, okText: "ตกลง" });
    }, countUp);
  }

  function renderSummary() {
    hideTimer();
    const r = state.results;
    const pasteCount = state.violations.filter(v => ["paste", "copy", "cut", "drop"].includes(v.type)).length;
    const tabCount = state.violations.filter(v => ["tab-switch", "window-blur"].includes(v.type)).length;
    app.innerHTML = `
      <div class="card">
        <h2>ทำแบบทดสอบครบแล้ว</h2>
        <p>ขอบคุณคุณ <b>${escapeHtml(state.candidate.name)}</b> ที่ทำแบบทดสอบ ผลของคุณถูกบันทึกไว้แล้ว</p>
        ${HR_REVIEW.summaryHtml(r)}
        <p id="submit-status" class="muted" style="margin-top:18px">กำลังส่งผล...</p>
        <div id="submit-fallback" class="hidden">
          <button class="btn btn-secondary btn-inline" id="download-btn">ดาวน์โหลดไฟล์ผลสอบ</button>
          <span class="muted"> กรุณาส่งไฟล์นี้ให้เจ้าหน้าที่</span>
        </div>
        <h3 style="margin-top:26px">ดูรายละเอียดคำตอบ</h3>
        <div class="review-nav">
          ${HR_REVIEW.navHtml()}
        </div>
      </div>
      <div id="review"></div>`;
    app.querySelectorAll("[data-review]").forEach(b => b.addEventListener("click", () => {
      app.querySelectorAll("[data-review]").forEach(x => x.classList.toggle("active", x === b));
      renderReview(b.dataset.review);
      document.getElementById("review").scrollIntoView({ behavior: "smooth" });
    }));
    const payload = buildPayload(pasteCount, tabCount);
    document.getElementById("download-btn").addEventListener("click", () => downloadJson(payload));
    submitResults(payload);
  }

  function renderReview(partId) {
    HR_REVIEW.render(document.getElementById("review"), partId, { answers: state.answers, results: state.results }, cfg);
  }

  function buildPayload(pasteCount, tabCount) {
    const r = state.results;
    return {
      timestamp: new Date().toISOString(),
      name: state.candidate.name,
      phone: state.candidate.phone,
      p1_wpm: r.part1.wpm, p1_netWpm: r.part1.netWpm, p1_accuracy: r.part1.accuracy, p1_completion: r.part1.completion, p1_timeUsed: r.part1.secondsUsed,
      p2_accuracy: r.part2.accuracy, p2_errors: r.part2.errors, p2_to_ok: r.part2.toOk, p2_cc_ok: r.part2.ccOk, p2_body_ok: r.part2.bodyOk, p2_body_similarity: r.part2.bodySimilarity, p2_timeUsed: r.part2.secondsUsed,
      p3_fixed: r.part3.fixed, p3_missed: r.part3.missed, p3_damaged: r.part3.damaged, p3_total: r.part3.total, p3_score: r.part3.score, p3_timeUsed: r.part3.secondsUsed,
      p4_correct: r.part4.correct, p4_total: r.part4.total, p4_score: r.part4.score, p4_timeUsed: r.part4.secondsUsed,
      violations_paste: pasteCount, violations_tabSwitch: tabCount,
      raw: {
        candidate: state.candidate, startedAt: state.startedAt, finishedAt: new Date().toISOString(),
        answers: state.answers, results: state.results, violations: state.violations, userAgent: navigator.userAgent,
        /* เก็บเฉลย ณ ตอนสอบ ไว้ให้หน้า review.html แสดงผลถูกแม้แก้ข้อสอบภายหลัง */
        key: HR_REVIEW.snapshotKey(cfg),
      },
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
    updateFsBtn();
    const s = state.stage;
    if (s === "register") return renderRegister();
    if (s.startsWith("intro:")) return renderIntro(s.slice(6));
    if (s.startsWith("run:")) return renderRun(s.slice(4));
    if (s === "summary") return renderSummary();
  }

  render();
})();
