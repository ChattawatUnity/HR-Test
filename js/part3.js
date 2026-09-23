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
        <li>ตรวจสอบทุกช่องของฉบับด้านขวา <b>คลิกตรงตำแหน่งที่ต้องการแก้</b> พิมพ์ให้ตรงกับต้นฉบับ แล้วกด <b>Enter</b> หรือคลิกที่อื่นเพื่อปิดช่องกรอก (Shift+Enter = ขึ้นบรรทัดใหม่)</li>
        <li>ฉบับด้านขวามีช่องที่ผิดอยู่ <b>${errorPoints(cfg)} จุด</b> ให้แก้เฉพาะจุดที่ผิดเท่านั้น</li>
        ${cfg.PART3_LIVE_FEEDBACK
          ? `<li>ตัวอักษรที่พิมพ์แก้ไขจะเป็น<span style="color:#b91c1c;font-weight:700">สีแดง</span> ถ้าช่องนั้นยังไม่ตรงต้นฉบับ และเป็น<span style="color:#047857;font-weight:700">สีเขียว</span> เมื่อช่องนั้นตรงแล้ว มีตัวนับบอกว่าแก้ถูกแล้วกี่ช่อง</li>`
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
        <div><div class="bl-caption wrong">ฉบับที่ต้องตรวจแก้ (คลิกช่องเพื่อแก้ไข — ผิด ${errorPoints(cfg)} จุด) <span class="bl-counter" id="p3-counter"></span></div>${renderBL(cfg, answers, true)}</div>
      </div>
      <div class="actions p3-actions"><button class="btn btn-primary btn-inline" id="p3-submit">ส่ง</button></div>`;
    document.querySelector(".container").classList.add("wide", "p3");

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
        counter.textContent = "";
      }
    };
    updateCounter();

    container.querySelectorAll(".bl.editable .bl-cell[data-key]").forEach(cell => {
      const key = cell.dataset.key;
      const val = cell.querySelector(".val");
      const ta = cell.querySelector("textarea");
      const open = (e) => {
        if (cell.classList.contains("editing")) return;
        const pos = caretOffsetFromClick(e, val);
        ta.value = answers[key];
        cell.classList.add("editing");
        ta.focus();
        const at = pos == null ? ta.value.length : Math.min(pos, ta.value.length);
        ta.setSelectionRange(at, at);
      };
      const close = () => {
        answers[key] = ta.value;
        cell.classList.remove("editing", "ok", "bad");
        val.innerHTML = diffHtml(initial[key], ta.value);
        if (live && ta.value !== initial[key]) {
          cell.classList.add(norm(ta.value) === norm(cfg.BL_ORIGINAL[key]) ? "ok" : "bad");
        }
        updateCounter();
      };
      cell.addEventListener("mousedown", e => { if (e.target !== ta) { e.preventDefault(); open(e); } });
      ta.addEventListener("blur", close);
      ta.addEventListener("keydown", e => {
        if (e.key === "Escape") { e.preventDefault(); ta.blur(); }
        else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ta.blur(); }
      });
    });
    return { submitBtn: container.querySelector("#p3-submit"), confirmText: "ยืนยันการส่งคำตอบ Part 3?" };
  },
  collect(cfg, container) {
    const active = container.querySelector(".bl-cell.editing textarea");
    if (active) active.blur();
    document.querySelector(".container").classList.remove("wide", "p3");
    return Object.assign({}, this._answers);
  },
  score(cfg, answer) {
    return HR_SCORING.scorePart3(answer, cfg.BL_ORIGINAL, cfg.BL_WRONG);
  },
};

function errorPoints(cfg) { return cfg.PART3_ERROR_POINTS || countWrong(cfg); }

function countWrong(cfg) {
  return Object.keys(cfg.BL_WRONG).filter(k => HR_SCORING.normalizeField(cfg.BL_WRONG[k]) !== HR_SCORING.normalizeField(cfg.BL_ORIGINAL[k])).length;
}

/* ตัวอักษรใน cur ที่ต่างจาก base (พิมพ์เพิ่ม/แก้) → สีแดง */
function diffHtml(base, cur) {
  if (base === cur) return escapeHtml(cur);
  return HR_SCORING.diffOps(base, cur).filter(o => o.t !== "del")
    .map(o => o.t === "ins" ? `<span class="ins">${escapeHtml(o.c)}</span>` : escapeHtml(o.c)).join("");
}

/* หาตำแหน่งตัวอักษรในข้อความจากจุดที่คลิก เพื่อวาง cursor ให้ตรง */
function caretOffsetFromClick(e, valEl) {
  if (!e || e.clientX == null) return null;
  let node = null, offset = 0;
  if (document.caretPositionFromPoint) {
    const p = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (p) { node = p.offsetNode; offset = p.offset; }
  } else if (document.caretRangeFromPoint) {
    const r = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (r) { node = r.startContainer; offset = r.startOffset; }
  }
  if (!node || !valEl.contains(node)) return null;
  const pre = document.createRange();
  pre.selectNodeContents(valEl);
  pre.setEnd(node, offset);
  return pre.toString().length;
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
        <div class="bl-title">
          <div class="t">BILL OF LADING</div>
          <div class="co">UNITY AGENCY COMPANY LIMITED</div>
          <div class="addr">128/13 Soi Silom 6, Silom Road, Suriyawongse,<br>Bangrak, Bangkok 10500<br>Tel: (662) 634-2020</div>
        </div>
        ${cell("serviceRequired", "", 1)}
        ${cell("bkkDestination", "", 1)}
      </div>
    </div>
    <div class="bl-row4">
      ${cell("feederVessel", "", 2)}
      ${cell("placeOfAcceptance", "", 2)}
      ${cell("motherVessel", "", 2)}
      ${cell("portOfLoading", "", 2)}
      ${cell("portOfDischarge", "", 1)}
      ${cell("placeOfDelivery", "", 1)}
      ${cell("finalDestination", "", 1)}
      ${cell("containerNo", "", 1)}
    </div>
    <div class="bl-body-head">
      <div>MARKS &amp; NUMBERS<br>SEAL NO.</div>
      <div>NO. OF PKGS.<br>OR UNITS</div>
      <div>DESCRIPTION OF PACKAGES AND GOODS</div>
      <div>GROSS WEIGHT<br>MEASUREMENT</div>
    </div>
    <div class="bl-body">
      <div class="bl-body-col">${cell("marks", "nolbl", 3)}${cell("sealNo", "nolbl", 1, "SEAL NO.")}</div>
      <div class="bl-body-col">${cell("packages", "nolbl", 2)}</div>
      <div class="bl-body-col">${cell("description", "nolbl", 8)}</div>
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

window.HR_RENDER_BL = renderBL;
