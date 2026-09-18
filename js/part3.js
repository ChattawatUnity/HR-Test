/* Part 3 : จับผิดเอกสาร Bill of Lading */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part3 = {
  id: "part3",
  title: "ตรวจสอบเอกสาร Bill of Lading",
  intro(cfg) {
    return `
      <ul>
        <li>จะแสดงเอกสาร B/L สองฉบับ: <b>ด้านซ้ายคือต้นฉบับ</b> (อ่านอย่างเดียว) และ <b>ด้านขวาคือฉบับที่มีข้อผิดพลาด</b></li>
        <li>ให้ตรวจสอบทุกช่องของฉบับด้านขวา แล้วแก้ไขข้อความในช่องที่ผิดให้ตรงกับต้นฉบับ</li>
        <li>ระบบไม่บอกว่ามีกี่จุดและอยู่ตรงไหน ให้แก้เฉพาะจุดที่ผิดเท่านั้น</li>
        <li>เวลา ${Math.round(cfg.TIME_LIMITS.part3 / 60)} นาที เริ่มจับเวลาเมื่อกด "เริ่ม"</li>
      </ul>`;
  },
  render(cfg, container) {
    const wrongDoc = Object.assign({}, cfg.BL_ORIGINAL, cfg.BL_WRONG);
    container.innerHTML = `
      <div class="bl-compare">
        <div><div class="bl-caption">ต้นฉบับ (ORIGINAL)</div>${renderBL(cfg, cfg.BL_ORIGINAL, false)}</div>
        <div><div class="bl-caption wrong">ฉบับที่ต้องตรวจแก้ (แก้ไขในช่องได้)</div>${renderBL(cfg, wrongDoc, true)}</div>
      </div>
      <div class="actions"><button class="btn btn-primary btn-inline" id="p3-submit">ส่ง</button></div>`;
    document.querySelector(".container").classList.add("wide");
    return { submitBtn: container.querySelector("#p3-submit"), confirmText: "ยืนยันการส่งคำตอบ Part 3?" };
  },
  collect(cfg, container) {
    const out = {};
    container.querySelectorAll("[data-bl-key]").forEach(el => { out[el.dataset.blKey] = el.value; });
    document.querySelector(".container").classList.remove("wide");
    return out;
  },
  score(cfg, answer) {
    return HR_SCORING.scorePart3(answer, cfg.BL_ORIGINAL, cfg.BL_WRONG);
  },
};

function renderBL(cfg, doc, editable) {
  const fullWidth = new Set(["description", "totalInWords", "packingPremises", "signature"]);
  const cells = cfg.BL_FIELDS.map(([key, label, rows]) => {
    const val = doc[key] != null ? doc[key] : "";
    let inner;
    if (editable) {
      inner = rows > 1
        ? `<textarea rows="${rows}" data-bl-key="${key}" spellcheck="false">${escapeHtml(val)}</textarea>`
        : `<input type="text" data-bl-key="${key}" value="${escapeHtml(val).replace(/"/g, "&quot;")}" spellcheck="false">`;
    } else {
      inner = `<div class="val">${escapeHtml(val)}</div>`;
    }
    return `<div class="bl-cell ${fullWidth.has(key) ? "full" : ""}"><div class="lbl">${label}</div>${inner}</div>`;
  }).join("");
  return `
    <div class="bl">
      <div class="bl-head">
        <div class="co">UNITY AGENCY COMPANY LIMITED</div>
        <div class="addr">128/13 Soi Silom 6, Silom Road, Suriyawongse, Bangrak, Bangkok 10500<br>Tel: (662) 634-2020 (Auto 10 Lines) | Fax: (662) 634-2022-3</div>
        <div class="title">BILL OF LADING</div>
      </div>
      <div class="bl-grid">${cells}</div>
    </div>`;
}
