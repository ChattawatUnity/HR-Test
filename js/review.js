/* หน้ารายละเอียดคำตอบ ใช้ร่วมกันระหว่างหน้าสรุปผู้สมัคร (app.js) และหน้า HR (review.html)
   ต้องโหลดหลัง config.js, scoring.js, part1-4.js */
(function () {
  const ORDER = ["part1", "part2", "part3", "part4"];
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const pct = x => Math.round((x || 0) * 100) + "%";

  /* เฉลย ณ ตอนสอบ เก็บลง raw_json เพื่อให้ดูย้อนหลังได้ถูกต้องแม้แก้ข้อสอบภายหลัง */
  function snapshotKey(cfg) {
    return {
      part1Text: cfg.PART1_TEXT,
      part2: cfg.PART2,
      blOriginal: cfg.BL_ORIGINAL,
      blWrong: cfg.BL_WRONG,
      part4: cfg.PART4,
    };
  }

  /* รวมเฉลยที่เก็บไว้กับ config ปัจจุบัน (ผลเก่าที่ไม่มี key จะใช้ config ปัจจุบัน) */
  function keyFor(data, cfg) {
    const k = data.key || {};
    return Object.assign({}, cfg, {
      PART1_TEXT: k.part1Text || cfg.PART1_TEXT,
      PART2: k.part2 || cfg.PART2,
      BL_ORIGINAL: k.blOriginal || cfg.BL_ORIGINAL,
      BL_WRONG: k.blWrong || cfg.BL_WRONG,
      PART4: k.part4 || cfg.PART4,
    });
  }

  function summaryHtml(r) {
    return `<div class="summary-grid">
      <div class="stat"><div class="k">Part 1 พิมพ์ข้อความ</div><div class="v">${r.part1.wpm} WPM</div><div class="muted">ความถูกต้อง ${pct(r.part1.accuracy)}</div></div>
      <div class="stat"><div class="k">Part 2 อีเมล</div><div class="v">${pct(r.part2.accuracy != null ? r.part2.accuracy : r.part2.bodySimilarity)}</div><div class="muted">${r.part2.errors != null ? `ผิด ${r.part2.errors} ตัวอักษร` : `เนื้อหาตรง ${pct(r.part2.bodySimilarity)}`}</div></div>
      <div class="stat"><div class="k">Part 3 ตรวจเอกสาร</div><div class="v">${r.part3.fixed}/${r.part3.total} ช่อง</div><div class="muted">แก้ผิดเพิ่ม ${r.part3.damaged} ช่อง</div></div>
      <div class="stat"><div class="k">Part 4 คำศัพท์</div><div class="v">${r.part4.correct}/${r.part4.total}</div></div>
    </div>`;
  }

  function navHtml() {
    return ORDER.map((p, i) => `<button class="btn btn-secondary" data-review="${p}">Part ${i + 1}: ${window.HR_PARTS[p].title}</button>`).join("");
  }

  function diffBlocks(reference, typed, mono) {
    const ops = HR_SCORING.diffOps(reference, typed);
    const ref = ops.filter(o => o.t !== "ins").map(o => o.t === "del" ? `<span class="missing">${esc(o.c)}</span>` : esc(o.c)).join("");
    const typ = ops.filter(o => o.t !== "del").map(o => o.t === "ins" ? `<span class="ins">${esc(o.c)}</span>` : esc(o.c)).join("");
    const cls = "diff-block" + (mono ? " mono" : "");
    return `
      <div class="legend"><span><i style="background:#fef3c7"></i>ในต้นฉบับแต่ไม่ได้พิมพ์ / พิมพ์ตกหล่น</span><span><i style="background:#fee2e2"></i>พิมพ์ผิดหรือพิมพ์เกิน</span></div>
      <div class="muted">ต้นฉบับ</div><div class="${cls}">${ref || "<span class=muted>(ว่าง)</span>"}</div>
      <div class="muted">ที่พิมพ์</div><div class="${cls}">${typ || "<span class=muted>(ไม่ได้พิมพ์)</span>"}</div>`;
  }

  /* box = element ที่จะแสดงผล, data = { answers, results, key? } */
  function render(box, partId, data, baseCfg) {
    const cfg = keyFor(data, baseCfg);
    const r = data.results[partId], a = data.answers[partId];
    const idx = ORDER.indexOf(partId) + 1;
    let html = "";
    if (!r || a == null) {
      html = `<p class="muted">ไม่มีข้อมูลของ part นี้</p>`;
    } else if (partId === "part1") {
      html = `<div class="summary-grid" style="margin-bottom:16px">
          <div class="stat"><div class="k">ความเร็ว</div><div class="v">${r.wpm} WPM</div><div class="muted">สุทธิ ${r.netWpm} WPM</div></div>
          <div class="stat"><div class="k">ความถูกต้อง</div><div class="v">${pct(r.accuracy)}</div><div class="muted">ผิด/ตกหล่น ${r.errors} ตัวอักษร</div></div>
          <div class="stat"><div class="k">พิมพ์ได้</div><div class="v">${r.typedChars}/${r.referenceChars}</div><div class="muted">ตัวอักษร ใช้เวลา ${r.secondsUsed} วินาที</div></div>
        </div>` + diffBlocks(cfg.PART1_TEXT.replace(/\s+/g, " ").trim(), (a.typed || "").replace(/\s+/g, " ").trim(), false);
    } else if (partId === "part2") {
      const d = r.detail || { to: { ok: r.toOk }, cc: { ok: r.ccOk }, body: { ok: r.bodyOk } };
      const row = (label, det, typed, expect) => `<tr><td>${label}</td><td class="${det.ok ? "ok" : "bad"}">${det.ok ? "✓ ถูก" : (det.errors != null ? `✗ ผิด ${det.errors} ตัว` : "✗ ผิด")}</td><td>${esc(typed) || "<span class=muted>(ว่าง)</span>"}</td><td>${esc(expect)}</td></tr>`;
      html = `<div class="summary-grid" style="margin-bottom:16px">
          <div class="stat"><div class="k">ความถูกต้องรวม</div><div class="v">${pct(r.accuracy)}</div><div class="muted">${r.errors != null ? `ผิด/ขาด ${r.errors} จาก ${r.referenceChars} ตัวอักษร` : ""}</div></div>
          <div class="stat"><div class="k">เนื้อหา</div><div class="v">${pct(r.bodySimilarity)}</div><div class="muted">ใช้เวลา ${r.secondsUsed} วินาที</div></div>
        </div>
        <table class="review-table"><tr><th>รายการ</th><th>ผล</th><th>ที่พิมพ์</th><th>ที่ถูกต้อง</th></tr>
          ${row("To", d.to || {}, a.to, cfg.PART2.to)}
          ${row("Cc", d.cc || {}, a.cc, cfg.PART2.cc)}
          ${a.bcc ? `<tr><td>Bcc</td><td class="bad">ไม่ควรมี</td><td>${esc(a.bcc)}</td><td>-</td></tr>` : ""}
          ${a.subject ? `<tr><td>Subject</td><td class="muted">ไม่ตรวจ</td><td>${esc(a.subject)}</td><td>-</td></tr>` : ""}
          ${row("เนื้อหา", d.body || {}, r.bodyOk ? "ตรง 100%" : `ตรง ${pct(r.bodySimilarity)}`, "ตรงทุกตัวอักษร")}
        </table>` +
        diffBlocks(HR_SCORING.normalizeText(cfg.PART2.body), HR_SCORING.normalizeText(a.body), true);
    } else if (partId === "part3") {
      html = `<div class="legend"><span><i style="background:#d1fae5"></i>แก้ถูก ${r.fixed}</span><span><i style="background:#fee2e2"></i>ยังผิดอยู่ ${r.missed}</span><span><i style="background:#ffedd5"></i>ช่องที่ถูกอยู่แล้วแต่ถูกแก้จนผิด ${r.damaged}</span></div>
        <div class="bl-compare">
          <div><div class="bl-caption">ต้นฉบับ</div>${window.HR_RENDER_BL(cfg, cfg.BL_ORIGINAL, false)}</div>
          <div><div class="bl-caption wrong">คำตอบ</div>${window.HR_RENDER_BL(cfg, a, false)}</div>
        </div>`;
    } else if (partId === "part4") {
      html = `<div class="legend"><span><i style="background:#ecfdf5;border:2px solid #059669"></i>เฉลย</span><span><i style="background:#fef2f2;border:2px solid #ff1a1a"></i>ข้อที่เลือกผิด</span><span>ถูก ${r.correct}/${r.total} ข้อ</span></div>` + cfg.PART4.map((q, i) => `
        <div class="q review">
          <div class="qt"><span class="num">${i + 1}</span>${esc(q.q)} ${a[i] === q.answer ? '<span class="ok">✓</span>' : '<span class="bad">✗</span>'}${a[i] == null ? ' <span class="muted">(ไม่ได้ตอบ)</span>' : ""}</div>
          <div class="choices">${q.choices.map((c, j) => {
            const cls = j === q.answer ? "correct" : (j === a[i] ? "wrong" : "");
            return `<label class="${cls}"><span class="letter">${"ABCD"[j]}</span><span>${esc(c)}</span></label>`;
          }).join("")}</div>
        </div>`).join("");
    }
    box.innerHTML = `<div class="card"><h2>Part ${idx}: ${window.HR_PARTS[partId].title}</h2>${html}</div>`;
    const container = document.querySelector(".container");
    if (partId === "part3" && r && r.detail) {
      box.querySelectorAll(".bl-compare > div:last-child .bl-cell[data-key]").forEach(cell => {
        const d = r.detail[cell.dataset.key];
        if (d) cell.classList.add("r-" + d);
      });
    }
    if (container) container.classList.toggle("wide", partId === "part3");
  }

  window.HR_REVIEW = { ORDER, snapshotKey, summaryHtml, navHtml, render };
})();
