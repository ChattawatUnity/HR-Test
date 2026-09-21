/* Part 3 : จับผิดเอกสาร Bill of Lading
   ซ้าย = ต้นฉบับ (อ่านอย่างเดียว) / ขวา = ฉบับผิด ฟอร์มเดียวกันเป๊ะ
   คลิกช่องด้านขวาเพื่อแก้ คลิกที่อื่นเพื่อปิดช่องกรอก
   ตัวอักษรที่พิมพ์แก้เพิ่มเข้ามา (ต่างจากค่าเดิมในฉบับผิด) แสดงเป็นสีแดง */
window.HR_PARTS = window.HR_PARTS || {};
window.HR_PARTS.part3 = {
  id: "part3",
  title: "ตรวจสอบเอกสาร Bill of Lading",
  intro(cfg) {
    return `
      <ul>
        <li>จะแสดงเอกสาร B/L สองฉบับ: <b>ด้านซ้ายคือต้นฉบับ</b> (อ่านอย่างเดียว) และ <b>ด้านขวาคือฉบับที่มีข้อผิดพลาด</b></li>
        <li>ตรวจสอบทุกช่องของฉบับด้านขวา <b>คลิกที่ช่อง</b> ที่ต้องการแก้ พิมพ์ให้ตรงกับต้นฉบับ แล้วคลิกที่อื่นเพื่อปิดช่องกรอก</li>
        <li>ฉบับด้านขวามีช่องที่ผิดอยู่ <b>${countWrong(cfg)} ช่อง</b> (บางช่องอาจผิดมากกว่า 1 จุด) ให้แก้เฉพาะช่องที่ผิดเท่านั้น</li>
        ${cfg.PART3_LIVE_FEEDBACK
          ? `<li>ช่องที่แก้แล้วตรงกับต้นฉบับจะเป็น<span style="color:#047857;font-weight:700">สีเขียว</span> ถ้ายังไม่ตรงจะเป็น<span style="color:#b91c1c;font-weight:700">สีแดง</span> มีตัวนับบอกว่าแก้ถูกแล้วกี่ช่อง</li>`
          : `<li>ตัวอักษรที่พิมพ์แก้ไขจะแสดงเป็น<span style="color:#b91c1c;font-weight:700">สีแดง</span> ถ้าแก้กลับเป็นค่าเดิมจะกลับเป็นสีดำ</li>`}
        <li>เวลา ${Math.round(cfg.TIME_LIMITS.part3 / 60)} นาที เริ่มจับเวลาเมื่อกด "เริ่ม"</li>
      </ul>`;
  },
  render(cfg, container) {
    const initial = Object.assign({}, cfg.BL_ORIGINAL, cfg.BL_WRONG);
    const answers = Object.assign({}, initial);
    this._answers = answers;
    container.innerHTML = `
      <div class="bl-compare">
        <div><div class="bl-caption">ต้นฉบับ (ORIGINAL)</div>${renderBL(cfg, cfg.BL_ORIGINAL, false)}</div>
        <div><div class="bl-caption wrong">ฉบับที่ต้องตรวจแก้ (คลิกช่องเพื่อแก้ไข — ผิด ${countWrong(cfg)} ช่อง) <span class="bl-counter" id="p3-counter"></span></div>${renderBL(cfg, answers, true)}</div>
      </div>
      <div class="actions"><button class="btn btn-primary btn-inline" id="p3-submit">ส่ง</button></div>`;
    document.querySelector(".container").classList.add("wide");

    const live = !!cfg.PART3_LIVE_FEEDBACK;
    const total = countWrong(cfg);
    const norm = HR_SCORING.normalizeField;
    const counter = container.querySelector("#p3-counter");
    const updateCounter = () => {
      const keys = Object.keys(cfg.BL_ORIGINAL);
      if (live) {
        const ok = keys.filter(k => norm(initial[k]) !== norm(cfg.BL_ORIGINAL[k]) && norm(answers[k]) === norm(cfg.BL_ORIGINAL[k])).length;
        counter.textContent = `ถูกแล้ว ${ok}/${total}`;
        counter.classList.toggle("done", ok === total);
      } else {
        const touched = keys.filter(k => answers[k] !== initial[k]).length;
        counter.textContent = `แก้ไปแล้ว ${touched}/${total} ช่อง`;
      }
    };
    updateCounter();

    container.querySelectorAll(".bl.editable .bl-cell[data-key]").forEach(cell => {
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
        cell.classList.remove("editing", "ok", "bad");
        if (live) {
          const touched = ta.value !== initial[key];
          val.textContent = ta.value;
          if (touched) cell.classList.add(norm(ta.value) === norm(cfg.BL_ORIGINAL[key]) ? "ok" : "bad");
        } else {
          val.innerHTML = diffHtml(initial[key], ta.value);
        }
        updateCounter();
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

function countWrong(cfg) {
  return Object.keys(cfg.BL_WRONG).filter(k => HR_SCORING.normalizeField(cfg.BL_WRONG[k]) !== HR_SCORING.normalizeField(cfg.BL_ORIGINAL[k])).length;
}

/* ตัวอักษรใน cur ที่ไม่อยู่ใน LCS กับ base = ตัวที่พิมพ์เพิ่ม/แก้ → สีแดง */
function diffHtml(base, cur) {
  const a = Array.from(base || ""), b = Array.from(cur || "");
  if (base === cur) return escapeHtml(cur);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0, out = "";
  while (j < m) {
    if (i < n && a[i] === b[j]) { out += escapeHtml(b[j]); i++; j++; }
    else if (i < n && dp[i + 1][j] >= dp[i][j + 1]) { i++; }
    else { out += `<span class="ins">${escapeHtml(b[j])}</span>`; j++; }
  }
  return out;
}

/* ---------- ฟอร์ม B/L (โครงเดียวกับฟอร์ม A4 มาตรฐาน) ---------- */
function renderBL(cfg, doc, editable) {
  const rowsOf = {}; cfg.BL_FIELDS.forEach(([k, , r]) => rowsOf[k] = r);
  const labelOf = {}; cfg.BL_FIELDS.forEach(([k, l]) => labelOf[k] = l);
  const cell = (key, extraClass, rows, label) => {
    if (!(key in doc)) return `<div class="bl-cell ${extraClass || ""}"></div>`;
    const val = doc[key] != null ? doc[key] : "";
    const r = rows || rowsOf[key] || 1;
    const ta = editable ? `<textarea rows="${r}" spellcheck="false" tabindex="-1"></textarea>` : "";
    return `<div class="bl-cell ${extraClass || ""}" data-key="${key}" style="--rows:${r}">
      <div class="lbl">${label || labelOf[key]}</div><div class="val">${escapeHtml(val)}</div>${ta}</div>`;
  };
  return `<div class="bl ${editable ? "editable" : ""}">
    <div class="bl-top">
      <div class="bl-left">
        ${cell("shipper", "", 4)}
        ${cell("consignee", "", 3)}
        ${cell("notifyParty", "", 3)}
      </div>
      <div class="bl-right">
        ${cell("blNo", "bl-no", 1)}
        <div class="bl-title">BILL OF LADING</div>
        ${cell("serviceRequired", "", 1)}
        ${cell("bkkDestination", "", 1)}
        <div class="bl-cell bl-fill"></div>
      </div>
    </div>
    <div class="bl-row4">
      ${cell("feederVessel", "", 1, "PRE-CARRIAGE BY / FEEDER VESSEL")}
      ${cell("placeOfAcceptance", "", 1, "PLACE OF RECEIPT / ACCEPTANCE")}
      ${cell("motherVessel", "", 1, "OCEAN VESSEL / VOYAGE NO. (MOTHER VESSEL)")}
      ${cell("portOfLoading", "", 1)}
      ${cell("portOfDischarge", "", 1)}
      ${cell("placeOfDelivery", "", 1)}
      ${cell("finalDestination", "", 1)}
      ${cell("containerNo", "", 1, "CONTAINER NO. / SEAL NO.")}
    </div>
    <div class="bl-body-head">
      <div>MARKS &amp; NUMBERS<br>CONTAINER NO. / SEAL NO.</div>
      <div>NO. OF PKGS.<br>OR UNITS</div>
      <div>DESCRIPTION OF PACKAGES AND GOODS</div>
      <div>GROSS WEIGHT<br>MEASUREMENT</div>
    </div>
    <div class="bl-body">
      <div class="bl-body-col">${cell("marks", "nolbl", 3)}${cell("sealNo", "nolbl", 1, "SEAL NO.")}</div>
      <div class="bl-body-col">${cell("packages", "nolbl", 2)}</div>
      <div class="bl-body-col">${cell("description", "nolbl", 9)}</div>
      <div class="bl-body-col">${cell("grossWeight", "nolbl", 4)}</div>
    </div>
    <div class="bl-row3">
      ${cell("totalInWords", "span2", 1)}
      ${cell("freightPayable", "", 1)}
      ${cell("noOfOriginal", "", 1)}
    </div>
    <div class="bl-row3">
      ${cell("placeOfIssue", "", 2)}
      ${cell("remarks", "", 2)}
      ${cell("signature", "span2", 2, "SIGNED FOR THE CARRIER / AGENT")}
    </div>
  </div>`;
}
