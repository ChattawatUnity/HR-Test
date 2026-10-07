/* Part 1 : พิมพ์ภาษาไทย */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part1 = {
  id: "part1",
  title: "พิมพ์ข้อความ (ไทย-อังกฤษ)",
  /* หน้าเดียว: เห็นข้อความต้นฉบับก่อนกด "เริ่ม" กล่องพิมพ์ล็อกไว้จนกว่าจะเริ่ม */
  inlineStart: true,
  intro(cfg) {
    return `
      <ul>
        <li>พิมพ์ข้อความที่แสดงให้เหมือนต้นฉบับทุกตัวอักษร วัดทั้งความเร็วและความถูกต้อง</li>
        <li>ระบบจะไม่แจ้งว่าพิมพ์ผิดหรือถูกระหว่างทำ โปรด<b>ตรวจทาน</b>ก่อนกด "ส่ง"</li>
        <li>มีเวลาไม่เกิน ${Math.round(cfg.TIME_LIMITS.part1 / 60)} นาที ระบบแสดงเวลาที่ใช้ไปมุมขวาบน</li>
      </ul>`;
  },
  hint() {
    return "พิมพ์ตามให้เหมือนต้นฉบับทุกตัวอักษร รวมถึงการเว้นวรรคและตัวพิมพ์ใหญ่พิมพ์เล็ก";
  },
  render(cfg, container, opts) {
    const locked = !!(opts && opts.locked);
    container.innerHTML = `
      <div class="muted" style="margin-bottom:4px">ต้นฉบับ</div>
      <div class="reference-text" id="p1-ref"></div>
      <div class="muted" style="margin:14px 0 4px">พิมพ์ที่นี่</div>
      <textarea id="p1-input" class="reference-text" placeholder="${locked ? "กด &quot;เริ่ม&quot; เพื่อเริ่มพิมพ์และจับเวลา" : "พิมพ์ข้อความข้างต้นที่นี่..."}" spellcheck="false" autocomplete="off"${locked ? " disabled" : ""}></textarea>
      <div class="actions">${locked
        ? `<span class="muted" style="align-self:center">เมื่อกด "เริ่ม" ระบบจะเริ่มจับเวลาทันที</span><button class="btn btn-primary btn-inline" id="start-btn">เริ่ม</button>`
        : `<button class="btn btn-primary btn-inline" id="p1-submit">ส่ง</button>`}</div>`;
    container.querySelector("#p1-ref").textContent = cfg.PART1_TEXT;
    const ta = container.querySelector("#p1-input");
    /* กล่องพิมพ์สูงเท่าต้นฉบับ และกัน Enter ให้พิมพ์ต่อกันไปเลย */
    const ref = container.querySelector("#p1-ref");
    const sync = () => { ta.style.height = Math.max(ref.offsetHeight, ta.scrollHeight) + "px"; };
    sync(); window.addEventListener("resize", sync);
    ta.addEventListener("input", sync);
    ta.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
    if (locked) return {};
    ta.focus();
    return { submitBtn: container.querySelector("#p1-submit") };
  },
  collect(cfg, container) {
    return { typed: container.querySelector("#p1-input").value };
  },
  score(cfg, answer, secondsUsed) {
    return HR_SCORING.scorePart1(answer.typed, cfg.PART1_TEXT, secondsUsed);
  },
};
