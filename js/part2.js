/* Part 2 : พิมพ์อีเมลภาษาอังกฤษ (Gmail UI จำลอง) */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part2 = {
  id: "part2",
  title: "พิมพ์อีเมลภาษาอังกฤษ",
  intro(cfg) {
    const full = cfg.PART2.body;
    return `
      <ul style="margin:0 0 12px;padding-left:22px">
        <li>พิมพ์ข้อความตามต้นฉบับ ให้ตรงทุกอักษร รวมถึงการเว้นวรรค, เว้นบรรทัด และตัวพิมพ์ใหญ่พิมพ์เล็ก <b>โดยไม่ต้องใส่ Subject</b></li>
        <li>ส่งไปที่ <b>${cfg.PART2.to}</b> และ CC ไปที่ <b>${cfg.PART2.cc}</b></li>
      </ul>
      <div class="email-target">${escapeHtml(full)}</div>
      <p class="muted" style="margin:10px 0 0">เวลา ${Math.round(cfg.TIME_LIMITS.part2 / 60)} นาที เริ่มจับเวลาเมื่อกด "เริ่ม" เมื่อพิมพ์เสร็จกดปุ่ม <b>Send</b> เพื่อส่งคำตอบ</p>`;
  },
  render(cfg, container) {
    const full = cfg.PART2.body;
    document.querySelector(".container").classList.add("wide");
    container.innerHTML = `
      <div class="p2-layout">
      <div class="instructions p2-instructions">
        <p style="margin:0 0 8px"><b>พิมพ์ข้อความตามตัวอย่างทุกอักษร</b> ลงในเนื้อหาอีเมล <u>ไม่ต้องใส่ Subject</u> และส่งไปที่เมล <b>${cfg.PART2.to}</b> พร้อม CC ไปที่ <b>${cfg.PART2.cc}</b></p>
        <div class="email-target">${escapeHtml(full)}</div>
      </div>
      <div class="gmail">
        <div class="gmail-head"><span>New Message</span><span class="win">_ ⤡ ✕</span></div>
        <div class="gmail-row">
          <span class="lbl">To</span>
          <input type="text" id="p2-to" autocomplete="off" spellcheck="false">
          <span class="ccbcc"><button type="button" id="p2-cc-btn">Cc</button><button type="button" id="p2-bcc-btn">Bcc</button></span>
        </div>
        <div class="gmail-row hidden" id="p2-cc-row">
          <span class="lbl">Cc</span>
          <input type="text" id="p2-cc" autocomplete="off" spellcheck="false">
        </div>
        <div class="gmail-row hidden" id="p2-bcc-row">
          <span class="lbl">Bcc</span>
          <input type="text" id="p2-bcc" autocomplete="off" spellcheck="false">
        </div>
        <div class="gmail-row">
          <input type="text" id="p2-subject" placeholder="Subject" autocomplete="off" spellcheck="false" style="padding-left:0">
        </div>
        <div class="gmail-body" id="p2-body" contenteditable="plaintext-only" spellcheck="false"></div>
        <div class="gmail-foot">
          <div class="gmail-send"><button type="button" id="p2-send">Send</button><span class="caret">▼</span></div>
          <div class="gmail-tools"><span>Aa</span><span>✎</span><span>📎</span><span>🔗</span><span>☺</span><span>△</span><span>▣</span><span>🔒</span><span>✒</span><span>📅</span><span>⋮</span></div>
          <div class="gmail-trash">🗑</div>
        </div>
      </div>
      </div>`;
    const state = { ccOpened: false, bccOpened: false };
    const ccBtn = container.querySelector("#p2-cc-btn");
    const bccBtn = container.querySelector("#p2-bcc-btn");
    ccBtn.addEventListener("click", () => {
      state.ccOpened = true; ccBtn.classList.add("hidden");
      container.querySelector("#p2-cc-row").classList.remove("hidden");
      container.querySelector("#p2-cc").focus();
    });
    bccBtn.addEventListener("click", () => {
      state.bccOpened = true; bccBtn.classList.add("hidden");
      container.querySelector("#p2-bcc-row").classList.remove("hidden");
      container.querySelector("#p2-bcc").focus();
    });
    const body = container.querySelector("#p2-body");
    if (!body.isContentEditable) body.setAttribute("contenteditable", "true");
    /* ให้ความกว้างข้อความในกล่องพิมพ์เท่ากับกล่องต้นฉบับ บรรทัดจะตัดตำแหน่งเดียวกัน */
    const target = container.querySelector(".email-target");
    const syncWidth = () => {
      if (!document.body.contains(body)) { window.removeEventListener("resize", syncWidth); return; }
      body.style.paddingRight = "";
      const tcs = getComputedStyle(target), bcs = getComputedStyle(body);
      const textW = target.clientWidth - parseFloat(tcs.paddingLeft) - parseFloat(tcs.paddingRight);
      const padL = parseFloat(bcs.paddingLeft);
      const extra = body.clientWidth - padL - textW;
      if (extra >= 0) body.style.paddingRight = extra + "px";
    };
    syncWidth();
    window.addEventListener("resize", syncWidth);
    container.querySelector("#p2-to").focus();
    this._state = state;
    return { submitBtn: container.querySelector("#p2-send"), confirmText: "ยืนยันการส่งอีเมลนี้?" };
  },
  collect(cfg, container) {
    document.querySelector(".container").classList.remove("wide");
    const body = container.querySelector("#p2-body");
    return {
      to: container.querySelector("#p2-to").value,
      cc: container.querySelector("#p2-cc").value,
      bcc: container.querySelector("#p2-bcc").value,
      subject: container.querySelector("#p2-subject").value,
      body: body.innerText,
      ccOpened: this._state.ccOpened,
    };
  },
  score(cfg, answer, secondsUsed) {
    return HR_SCORING.scorePart2(answer, cfg.PART2, secondsUsed);
  },
};
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
