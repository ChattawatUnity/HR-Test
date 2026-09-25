/* Part 1 : พิมพ์ภาษาไทย */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part1 = {
  id: "part1",
  title: "พิมพ์ข้อความ (ไทย-อังกฤษ)",
  intro(cfg) {
    return `
      <ul>
        <li>พิมพ์ข้อความที่จะแสดง (ไทยผสมอังกฤษ) ตามให้เหมือนต้นฉบับ โดยจะวัดความเร็วและความถูกต้อง</li>
        <li>ระบบจะขึ้นบรรทัดใหม่ให้เองเมื่อสิ้นสุดบรรทัด ไม่ต้องกด Enter เพื่อขึ้นบรรทัดใหม่ ให้พิมพ์เรียงต่อกันเลย</li>
        <li>ระบบจะไม่แจ้งว่าพิมพ์ผิดหรือถูกระหว่างทำ โปรดตรวจเช็คความถูกต้องก่อนส่ง</li>
        <li>มีเวลา 10 นาที เริ่มจับเวลาเมื่อกด "เริ่ม"</li>
      </ul>`;
  },
  render(cfg, container) {
    container.innerHTML = `
      <div class="muted" style="margin-bottom:4px">ต้นฉบับ</div>
      <div class="reference-text" id="p1-ref"></div>
      <div class="muted" style="margin:14px 0 4px">พิมพ์ที่นี่</div>
      <textarea id="p1-input" class="reference-text" placeholder="พิมพ์ข้อความข้างต้นที่นี่..." spellcheck="false" autocomplete="off"></textarea>
      <div class="actions"><button class="btn btn-primary btn-inline" id="p1-submit">ส่ง</button></div>`;
    container.querySelector("#p1-ref").textContent = cfg.PART1_TEXT;
    const ta = container.querySelector("#p1-input");
    /* กล่องพิมพ์สูงเท่าต้นฉบับ และกัน Enter ให้พิมพ์ต่อกันไปเลย */
    const ref = container.querySelector("#p1-ref");
    const sync = () => { ta.style.height = Math.max(ref.offsetHeight, ta.scrollHeight) + "px"; };
    sync(); window.addEventListener("resize", sync);
    ta.addEventListener("input", sync);
    ta.addEventListener("keydown", e => { if (e.key === "Enter") e.preventDefault(); });
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
