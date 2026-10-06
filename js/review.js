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
  function render(box, partId, data, baseCfg, opts) {
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
    if (container && !(opts && opts.noLayout)) container.classList.toggle("wide", partId === "part3");
  }

  /* ---------- ไฟล์ผลสอบ HTML ไฟล์เดียว (ส่ง LINE / อีเมล) ----------
     ไม่มี JavaScript และไม่โหลดอะไรจากภายนอก เพราะตัวเปิดไฟล์ในแอปแชทมักปิด JS */
  function buildReportHtml(raw, meta, baseCfg, cssText) {
    const scratch = document.createElement("div");
    const sections = ORDER.map((p, i) => {
      render(scratch, p, raw, baseCfg, { noLayout: true });
      return `<section id="${p}" class="report-part">${scratch.innerHTML}</section>`;
    }).join("");
    const { paste, leave: tab } = violationCounts(raw.violations);
    const nav = ORDER.map((p, i) => `<a href="#${p}">Part ${i + 1}</a>`).join("");
    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>ผลสอบ ${esc(meta.name || "ผู้สมัคร")}</title>
<style>
${cssText}
.report-nav { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; padding: 10px 16px; background: var(--navy-dark); overflow-x: auto; }
.report-nav a { color: #fff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,.14); white-space: nowrap; }
.report-part { scroll-margin-top: 60px; }
.report-part .bl-compare { overflow-x: auto; }
.report-part .bl-compare > div { min-width: 640px; }
.report-part .bl-cell .val { height: auto; min-height: calc(var(--rows, 1) * 15px); overflow: visible; }
@media (max-width: 700px) {
  .container { padding: 12px; }
  .card { padding: 16px; }
  .summary-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .stat .v { font-size: 19px; }
  .review-table { font-size: 14px; }
  .review-table td, .review-table th { padding: 6px; }
  .review-table td:nth-child(n+3) { word-break: break-all; }
  .review-table td:nth-child(-n+2), .review-table th { white-space: nowrap; }
  .diff-block { font-size: 15px; }
}
</style>
</head>
<body>
<header class="topbar"><div class="topbar-inner"><h1>ผลแบบทดสอบผู้สมัคร</h1></div></header>
<nav class="report-nav">${nav}</nav>
<main class="container">
  <div class="card">
    <h2>${esc(meta.name || "ผู้สมัคร")}${meta.phone ? ` <span class="muted" style="font-weight:400">โทร ${esc(meta.phone)}</span>` : ""}</h2>
    <p class="muted" style="margin-top:-6px">ทำแบบทดสอบเมื่อ ${esc(meta.when || "-")} · พยายามคัดลอก/วาง ${paste} ครั้ง · ออกนอกหน้าจอ ${tab} ครั้ง</p>
    ${summaryHtml(raw.results)}
  </div>
  ${sections}
</main>
</body>
</html>`;
  }

  /* จำนวนครั้งที่ออกนอกหน้าจอ: นับ tab-switch และ window-blur ที่ไม่ได้เกิดพร้อมกัน (ภายใน 1 วินาที) */
  function violationCounts(violations) {
    const v = violations || [];
    const paste = v.filter(x => ["paste", "copy", "cut", "drop"].includes(x.type)).length;
    const leave = v.filter(x => x.type === "tab-switch" || x.type === "window-blur")
      .map(x => Date.parse(x.at) || 0).sort((a, b) => a - b)
      .filter((t, i, arr) => i === 0 || t - arr[i - 1] > 1000).length;
    return { paste, leave };
  }

  /* ---------- หน้าพิมพ์ A4 หน้าเดียว (แบบ C ขาวดำ) ---------- */
  function buildPrintHtml(raw, meta, baseCfg) {
    const cfg = keyFor(raw, baseCfg);
    const A = raw.answers, R = raw.results;
    const mmss = s => s == null ? "-" : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    const mark = (ref, typ) => {
      const ops = HR_SCORING.diffOps(ref, typ);
      return {
        ref: ops.filter(o => o.t !== "ins").map(o => o.t === "del" ? `<span class="miss">${esc(o.c)}</span>` : esc(o.c)).join(""),
        typ: ops.filter(o => o.t !== "del").map(o => o.t === "ins" ? `<span class="err">${esc(o.c)}</span>` : esc(o.c)).join(""),
      };
    };
    const { paste, leave } = violationCounts(raw.violations);

    const d1 = mark(cfg.PART1_TEXT.replace(/\s+/g, " ").trim(), (A.part1.typed || "").replace(/\s+/g, " ").trim());
    const p2wpm = R.part2.wpm != null ? R.part2.wpm : HR_SCORING.part2Wpm(A.part2, R.part2.secondsUsed);
    const d2 = mark(HR_SCORING.normalizeText(cfg.PART2.body), HR_SCORING.normalizeText(A.part2.body));

    const labels = Object.fromEntries(cfg.BL_FIELDS.map(([k, l]) => [k, l]));
    const wrongDoc = Object.assign({}, cfg.BL_ORIGINAL, cfg.BL_WRONG);
    const untouched = Object.keys(wrongDoc).every(k => (A.part3[k] || "") === (wrongDoc[k] || ""));
    const pts = cfg.PART3_ERROR_POINTS || R.part3.total;
    const p3status = { fixed: "แก้ถูก", missed: "ยังผิด", damaged: "แก้จนผิด" };
    const p3list = Object.entries(R.part3.detail || {}).map(([k, st]) => `${esc(labels[k] || k)}: ${p3status[st] || st}`).join(" · ");

    const p4wrong = cfg.PART4.map((q, i) => ({ i, q, sel: A.part4[i] })).filter(x => x.sel !== x.q.answer);
    const when = meta.when || "-";

    return `<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><title>ผลสอบ ${esc(meta.name || "")}</title><style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; }
body { font-family: Tahoma, "Leelawadee UI", Arial, sans-serif; color: #000; }
.page { width: 210mm; min-height: 297mm; padding: 14mm 15mm; }
.err { border-bottom: 2px solid #000; font-weight: 700; }
.miss { text-decoration: line-through; }
.hd { text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; }
.hd h1 { margin: 0; font-size: 17px; letter-spacing: .5px; } .hd div { font-size: 11px; margin-top: 2px; }
table.info { width: 100%; font-size: 11.5px; margin: 8px 0; } table.info td { padding: 2px 0; }
table.sum { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 6px; }
table.sum td, table.sum th { border: 1px solid #000; padding: 4px 6px; text-align: center; }
table.sum th { font-weight: 700; background: #eee; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h2 { font-size: 12.5px; margin: 10px 0 3px; border-bottom: 1px solid #000; }
.txt { font-size: 11px; line-height: 1.55; white-space: pre-wrap; } .lbl { font-size: 10.5px; font-weight: 700; margin-top: 3px; }
.leg { font-size: 9.5px; margin: 2px 0; }
ol { margin: 2px 0; padding-left: 18px; font-size: 11px; }
</style></head><body><div class="page">
<div class="hd"><h1>แบบบันทึกผลการทดสอบผู้สมัครงาน</h1><div>UNITY AGENCY COMPANY LIMITED</div></div>
<table class="info"><tr><td>ชื่อ-นามสกุล: <b>${esc(meta.name || "-")}</b></td><td>โทร: ${esc(meta.phone || "-")}</td><td style="text-align:right">วันที่สอบ: ${esc(when)}</td></tr>
<tr><td colspan="3">ข้อสังเกต: ออกนอกหน้าจอ ${leave} ครั้ง, พยายามคัดลอก/วาง ${paste} ครั้ง</td></tr></table>
<table class="sum"><tr><th>ส่วน</th><th>ผล</th><th>ข้อผิดพลาด</th><th>เวลา</th></tr>
<tr><td>1. พิมพ์ข้อความ</td><td>${R.part1.wpm} WPM</td><td>${R.part1.errors} ตัวอักษร</td><td>${mmss(R.part1.secondsUsed)}</td></tr>
<tr><td>2. อีเมล</td><td>${p2wpm != null ? p2wpm + " WPM" : "-"}</td><td>${R.part2.errors != null ? R.part2.errors + " ตัวอักษร" : "-"}</td><td>${mmss(R.part2.secondsUsed)}</td></tr>
<tr><td>3. ตรวจ B/L</td><td>${untouched ? `พบ ____ / ${pts} จุด (กระดาษ)` : `แก้ถูก ${R.part3.fixed} / ${R.part3.total} ช่อง`}</td><td>${untouched ? "แก้ผิดเพิ่ม ____" : `แก้ผิดเพิ่ม ${R.part3.damaged}`}</td><td>${mmss(R.part3.secondsUsed)}</td></tr>
<tr><td>4. คำศัพท์</td><td>${R.part4.correct} / ${R.part4.total}</td><td>${R.part4.total - R.part4.correct} ข้อ</td><td>${mmss(R.part4.secondsUsed)}</td></tr></table>
<div class="leg">สัญลักษณ์: <span class="err">ขีดเส้นใต้หนา</span> = พิมพ์ผิด/เกิน, <span class="miss">ขีดฆ่า</span> = ตกหล่น</div>
<h2>1. พิมพ์ข้อความ</h2>
<div class="lbl">ต้นฉบับ</div><div class="txt">${d1.ref}</div>
<div class="lbl">ที่พิมพ์ส่ง</div><div class="txt">${d1.typ || "(ไม่ได้พิมพ์)"}</div>
<h2>2. อีเมล</h2>
<div class="txt">To: ${esc(A.part2.to) || "(ว่าง)"} ${R.part2.toOk ? "(ถูก)" : "(ผิด)"} &nbsp;&nbsp; Cc: ${esc(A.part2.cc) || "(ว่าง)"} ${R.part2.ccOk ? "(ถูก)" : "(ผิด)"}${A.part2.subject ? ` &nbsp;&nbsp; Subject: ${esc(A.part2.subject)} (ไม่ต้องใส่)` : ""}${A.part2.bcc ? ` &nbsp;&nbsp; Bcc: ${esc(A.part2.bcc)} (ไม่ต้องใส่)` : ""}</div>
<div class="lbl">เนื้อหาที่พิมพ์</div><div class="txt" style="font-size:10px;line-height:1.4">${d2.typ || "(ไม่ได้พิมพ์)"}</div>
<h2>3. ตรวจเอกสาร B/L</h2>
<div class="txt">${untouched ? `ไม่มีการแก้ไขในเว็บ ตรวจบนกระดาษ พบ ________ / ${pts} จุด` : p3list}</div>
<h2>4. คำศัพท์ (เฉพาะข้อที่ผิด)</h2>
${p4wrong.length ? `<ol>${p4wrong.map(x => `<li value="${x.i + 1}">${esc(x.q.q)} : เลือก "${x.sel == null ? "ไม่ได้ตอบ" : esc(x.q.choices[x.sel])}" (ที่ถูก: ${esc(x.q.choices[x.q.answer])})</li>`).join("")}</ol>` : `<div class="txt">ถูกทุกข้อ</div>`}
</div></body></html>`;
  }

  window.HR_REVIEW = { ORDER, snapshotKey, summaryHtml, navHtml, render, buildReportHtml, buildPrintHtml, violationCounts };
})();
