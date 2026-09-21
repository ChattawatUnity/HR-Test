/* Part 4 : ศัพท์ shipping (ปรนัย) */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part4 = {
  id: "part4",
  title: "คำศัพท์ด้านการขนส่ง",
  intro(cfg) {
    return `
      <ul>
        <li>เลือกคำแปลภาษาไทยที่ถูกต้องของคำศัพท์ภาษาอังกฤษ จำนวน ${cfg.PART4.length} ข้อ</li>
        <li>เวลา ${Math.round(cfg.TIME_LIMITS.part4 / 60)} นาที เริ่มจับเวลาเมื่อกด "เริ่ม"</li>
      </ul>`;
  },
  render(cfg, container) {
    container.innerHTML = cfg.PART4.map((q, i) => `
      <div class="q">
        <div class="qt"><span class="num">${i + 1}</span>${escapeHtml(q.q)}</div>
        <div class="choices">
          ${q.choices.map((c, j) => `<label><input type="radio" name="q${i}" value="${j}"><span class="letter">${"ABCD"[j]}</span><span>${escapeHtml(c)}</span></label>`).join("")}
        </div>
      </div>`).join("") +
      `<div class="actions"><button class="btn btn-primary btn-inline" id="p4-submit">ส่ง</button></div>`;
    return { submitBtn: container.querySelector("#p4-submit"), confirmText: "ยืนยันการส่งคำตอบ Part 4?" };
  },
  collect(cfg, container) {
    return cfg.PART4.map((_, i) => {
      const el = container.querySelector(`input[name="q${i}"]:checked`);
      return el ? Number(el.value) : null;
    });
  },
  score(cfg, answer) {
    return HR_SCORING.scorePart4(answer, cfg.PART4);
  },
};
