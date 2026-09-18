/* Part 1 : พิมพ์ภาษาไทย */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part1 = {
  id: "part1",
  title: "พิมพ์ภาษาไทย",
  intro(cfg) {
    return `
      <ul>
        <li>พิมพ์ข้อความภาษาไทยที่แสดงให้เหมือนต้นฉบับมากที่สุด</li>
        <li>ระบบจะไม่แจ้งว่าพิมพ์ผิดหรือถูกระหว่างทำ จะตรวจความถูกต้องและความเร็วครั้งเดียวเมื่อกด "ส่ง" หรือหมดเวลา</li>
        <li>เวลา ${Math.round(cfg.TIME_LIMITS.part1 / 60)} นาที เริ่มจับเวลาเมื่อกด "เริ่ม"</li>
      </ul>`;
  },
  render(cfg, container) {
    container.innerHTML = `
      <div class="reference-text" id="p1-ref"></div>
      <textarea id="p1-input" placeholder="พิมพ์ข้อความข้างต้นที่นี่..." spellcheck="false" autocomplete="off"></textarea>
      <div class="actions"><button class="btn btn-primary btn-inline" id="p1-submit">ส่ง</button></div>`;
    container.querySelector("#p1-ref").textContent = cfg.PART1_TEXT;
    const ta = container.querySelector("#p1-input");
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
