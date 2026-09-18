/* Part 3 : จับผิดเอกสาร Bill of Lading
   ซ้าย = ต้นฉบับ (อ่านอย่างเดียว) / ขวา = ฉบับผิด โครงเดียวกันเป๊ะ
   คลิกช่องด้านขวาเพื่อแก้ คลิกที่อื่นเพื่อปิดช่องกรอก */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part3 = {
  id: "part3",
  title: "ตรวจสอบเอกสาร Bill of Lading",
  intro(cfg) {
    return `
      <ul>
        <li>จะแสดงเอกสาร B/L สองฉบับ: <b>ด้านซ้ายคือต้นฉบับ</b> (อ่านอย่างเดียว) และ <b>ด้านขวาคือฉบับที่มีข้อผิดพลาด</b></li>
        <li>ตรวจสอบทุกช่องของฉบับด้านขวา <b>คลิกที่ช่อง</b> ที่ต้องการแก้ พิมพ์ให้ตรงกับต้นฉบับ แล้วคลิกที่อื่นเพื่อปิดช่องกรอก</li>
        <li>ระบบไม่บอกว่ามีกี่จุดและอยู่ตรงไหน ให้แก้เฉพาะจุดที่ผิดเท่านั้น</li>
        <li>เวลา ${Math.round(cfg.TIME_LIMITS.part3 / 60)} นาที เริ่มจับเวลาเมื่อกด "เริ่ม"</li>
      </ul>`;
  },
  render(cfg, container) {
    const answers = Object.assign({}, cfg.BL_ORIGINAL, cfg.BL_WRONG);
    this._answers = answers;
    container.innerHTML = `
      <div class="bl-compare">
        <div><div class="bl-caption">ต้นฉบับ (ORIGINAL)</div>${renderBL(cfg, cfg.BL_ORIGINAL, false)}</div>
        <div><div class="bl-caption wrong">ฉบับที่ต้องตรวจแก้ (คลิกช่องเพื่อแก้ไข)</div>${renderBL(cfg, answers, true)}</div>
      </div>
      <div class="actions"><button class="btn btn-primary btn-inline" id="p3-submit">ส่ง</button></div>`;
    document.querySelector(".container").classList.add("wide");

    /* click-to-edit */
    container.querySelectorAll(".bl.editable .bl-cell").forEach(cell => {
      const key = cell.dataset.key;
      const val = cell.querySelector(".val");
      const ta = cell.querySelector("textarea");
      const open = () => {
        if (cell.classList.contains("editing")) return;
        ta.value = answers[key];
        cell.classList.add("editing");
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      };
      const close = () => {
        answers[key] = ta.value;
        val.textContent = ta.value;
        cell.classList.remove("editing");
      };
      cell.addEventListener("click", e => { if (e.target !== ta) open(); });
      ta.addEventListener("blur", close);
      ta.addEventListener("keydown", e => { if (e.key === "Escape") ta.blur(); });
    });
    return { submitBtn: container.querySelector("#p3-submit"), confirmText: "ยืนยันการส่งคำตอบ Part 3?" };
  },
  collect(cfg, container) {
    const active = container.querySelector(".bl-cell.editing textarea");
    if (active) active.blur();
    document.querySelector(".container").classList.remove("wide");
    return Object.assign({}, this._answers);
  },
  score(cfg, answer) {
    return HR_SCORING.scorePart3(answer, cfg.BL_ORIGINAL, cfg.BL_WRONG);
  },
};

function renderBL(cfg, doc, editable) {
  const fullWidth = new Set(["description", "totalInWords", "packingPremises", "signature"]);
  const cells = cfg.BL_FIELDS.map(([key, label, rows]) => {
    const val = doc[key] != null ? doc[key] : "";
    const ta = editable ? `<textarea rows="${rows}" spellcheck="false" tabindex="-1"></textarea>` : "";
    return `<div class="bl-cell ${fullWidth.has(key) ? "full" : ""}" data-key="${key}" style="--rows:${rows}">
      <div class="lbl">${label}</div><div class="val">${escapeHtml(val)}</div>${ta}</div>`;
  }).join("");
  return `<div class="bl ${editable ? "editable" : ""}"><div class="bl-grid">${cells}</div></div>`;
}
