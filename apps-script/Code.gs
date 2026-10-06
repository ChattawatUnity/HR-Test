/**
 * Google Apps Script — รับผลสอบจากเว็บ HR-Test แล้วบันทึกลง Google Sheets
 *
 * ใช้ได้ทั้ง 2 แบบ:
 *   1) สร้างสคริปต์จากในชีต (Extensions → Apps Script) → บันทึกลงชีตนั้นอัตโนมัติ
 *   2) สร้างสคริปต์เดี่ยว (script.google.com) → ใส่ SPREADSHEET_ID ด้านล่าง
 *      หรือปล่อยว่างไว้ สคริปต์จะสร้างชีตชื่อ "HR-Test Results" ให้เองใน Google Drive
 *
 * หลังแก้โค้ดทุกครั้ง ต้อง Deploy → Manage deployments → ✎ → Version: New version → Deploy
 * (ไม่งั้น URL เดิมจะยังรันโค้ดเก่า)
 *
 * ชีตเก็บสรุปที่อ่านง่าย + คอลัมน์สุดท้ายเป็นข้อมูลทั้งหมด (JSON) สำหรับหน้า review.html
 * ทุกคอลัมน์สรุปคำนวณจาก JSON จึงสร้างชีตใหม่ทั้งหมดได้ด้วย rebuildFromJson()
 */
var SPREADSHEET_ID = "";   // ใส่ ID จาก URL ของชีต (ส่วนระหว่าง /d/ กับ /edit) ถ้าต้องการระบุเอง
var SHEET_NAME = "Results";
var HEADERS = [
  "วันที่สอบ (เวลาไทย)",
  "ชื่อ-นามสกุล",
  "เบอร์โทร",
  "P1 พิมพ์ (WPM)",
  "P1 ผิด (ตัวอักษร)",
  "P2 อีเมล (WPM)",
  "P2 ผิด (ตัวอักษร)",
  "P3 ตรวจ B/L",
  "P4 คำศัพท์",
  "ออกนอกหน้าจอ (ครั้ง)",
  "พยายามคัดลอก/วาง (ครั้ง)",
  "ข้อมูลทั้งหมด (JSON)"
];

/* ---------- ฟังก์ชันล้วน (ไม่แตะชีต) ทดสอบได้ ---------- */

/* เวลาไทย (UTC+7 ไม่มีเวลาออมแสง) รูปแบบ ปปปป-ดด-วว ชช:นน เรียงตามเวลาได้ */
function thaiTime_(iso) {
  var t = Date.parse(iso);
  if (isNaN(t)) return "";
  var d = new Date(t + 7 * 3600 * 1000);
  var p = function (n) { return (n < 10 ? "0" : "") + n; };
  return d.getUTCFullYear() + "-" + p(d.getUTCMonth() + 1) + "-" + p(d.getUTCDate()) + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes());
}

/* เบอร์โทรที่ 0 นำหน้าหายไป (ชีตแปลงเป็นตัวเลข) */
function fixPhone_(phone) {
  var s = String(phone == null ? "" : phone).replace(/\D/g, "");
  if (s.length === 9) s = "0" + s;
  return s;
}

function violationCounts_(violations) {
  var v = violations || [];
  var paste = v.filter(function (x) { return ["paste", "copy", "cut", "drop"].indexOf(x.type) >= 0; }).length;
  var times = v.filter(function (x) { return x.type === "tab-switch" || x.type === "window-blur"; })
    .map(function (x) { return Date.parse(x.at) || 0; }).sort(function (a, b) { return a - b; });
  var leave = times.filter(function (t, i) { return i === 0 || t - times[i - 1] > 1000; }).length;
  return { paste: paste, leave: leave };
}

function part2Wpm_(a, secondsUsed) {
  if (!a || !secondsUsed) return "";
  var chars = [a.to, a.cc, a.subject, a.body].map(function (x) { return x || ""; }).join("").length;
  return Math.round((chars / 5) / (Math.max(secondsUsed, 5) / 60) * 10) / 10;
}

/* Part 3: ถ้าคำตอบเหมือนฉบับผิดทุกช่อง = ไม่ได้แก้ในเว็บ (อาจตรวจบนกระดาษ) */
function part3Text_(raw) {
  var r = (raw.results || {}).part3 || {};
  var k = raw.key || {};
  var a = (raw.answers || {}).part3 || {};
  if (k.blOriginal && k.blWrong) {
    var untouched = Object.keys(k.blOriginal).every(function (f) {
      var wrong = k.blWrong[f] != null ? k.blWrong[f] : k.blOriginal[f];
      return (a[f] || "") === (wrong || "");
    });
    if (untouched) return "ไม่ได้แก้ในเว็บ";
  }
  if (r.fixed == null) return "";
  return "แก้ถูก " + r.fixed + "/" + r.total + (r.damaged ? " แก้ผิดเพิ่ม " + r.damaged : "");
}

/* แถวสรุปจาก JSON (fallback = ค่าจากแถวเก่า สำหรับผลรุ่นแรกที่ JSON ไม่มีชื่อ/เวลา) */
function summaryRow_(raw, fallback) {
  fallback = fallback || {};
  var c = raw.candidate || {};
  var r = raw.results || {};
  var p1 = r.part1 || {}, p2 = r.part2 || {}, p4 = r.part4 || {};
  var vc = violationCounts_(raw.violations);
  var p2w = p2.wpm != null ? p2.wpm : part2Wpm_((raw.answers || {}).part2, p2.secondsUsed);
  return [
    "'" + thaiTime_(raw.finishedAt || fallback.time || raw.startedAt),
    c.name || fallback.name || "",
    "'" + fixPhone_(c.phone || fallback.phone),
    p1.wpm != null ? p1.wpm : "",
    p1.errors != null ? p1.errors : "",
    p2w,
    p2.errors != null ? p2.errors : "",
    part3Text_(raw),
    p4.correct != null ? "'" + p4.correct + "/" + p4.total : "",
    vc.leave,
    vc.paste,
    JSON.stringify(raw)
  ];
}

/* ---------- ชีต ---------- */

function getSpreadsheet_() {
  var ss = null;
  if (SPREADSHEET_ID) ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (!ss) { try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {} }
  if (!ss) {
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty("HR_TEST_SHEET_ID");
    if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) {} }
    if (!ss) {
      ss = SpreadsheetApp.create("HR-Test Results");
      props.setProperty("HR_TEST_SHEET_ID", ss.getId());
    }
  }
  return ss;
}

function getSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) writeHeader_(sheet);
  return sheet;
}

function writeHeader_(sheet) {
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/* ผลเดียวกัน (startedAt เดียวกัน) มีอยู่แล้วหรือยัง กันส่งซ้ำ */
function alreadySaved_(sheet, raw) {
  if (!raw.startedAt || sheet.getLastRow() < 2) return false;
  var col = sheet.getRange(2, HEADERS.length, sheet.getLastRow() - 1, 1).getValues();
  var needle = '"startedAt":"' + raw.startedAt + '"';
  return col.some(function (r) { return String(r[0]).indexOf(needle) >= 0; });
}

function appendResult_(raw) {
  var sheet = getSheet_();
  if (alreadySaved_(sheet, raw)) return { url: sheet.getParent().getUrl(), duplicate: true };
  sheet.appendRow(summaryRow_(raw));
  return { url: sheet.getParent().getUrl(), duplicate: false };
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = (e && e.postData && e.postData.contents) || (e && e.parameter && e.parameter.payload) || "{}";
    var data = JSON.parse(body);
    var raw = data.raw || data;
    var res = appendResult_(raw);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, sheet: res.url, duplicate: res.duplicate })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/* เปิด URL /exec ในเบราว์เซอร์ จะบอกว่าผลถูกบันทึกลงชีตไหน */
function doGet() {
  var url = getSpreadsheet_().getUrl();
  return ContentService.createTextOutput("HR-Test endpoint OK\nResults sheet: " + url);
}

/* ---------- สร้างชีตใหม่จาก JSON ทุกแถว (กด Run ครั้งเดียวหลังอัปเดตโค้ด) ----------
   - ใช้ได้กับทุกรูปแบบคอลัมน์เดิม เพราะหาเซลล์ JSON ในแต่ละแถวเอง
   - ตัดแถวที่ซ้ำ (startedAt เดียวกัน) เก็บแถวแรกไว้
   - สำรองชีตเดิมไว้เป็นแท็บ "Results (สำรอง วันที่)" ก่อนเขียนทับ */
function rebuildRows_(rows) {
  var seen = {}, out = [];
  rows.forEach(function (row) {
    var json = null;
    for (var i = row.length - 1; i >= 0; i--) {
      if (typeof row[i] === "string" && row[i].charAt(0) === "{") { json = row[i]; break; }
    }
    if (!json) return;
    var raw;
    try { raw = JSON.parse(json); } catch (e) { return; }
    var id = raw.startedAt || json;
    if (seen[id]) return;
    seen[id] = true;
    var t = row[0];
    var time = t instanceof Date ? t.toISOString() : String(t || "");
    out.push(summaryRow_(raw, { time: time, name: row[1], phone: row[2] }));
  });
  return out;
}

function rebuildFromJson() {
  var sheet = getSheet_();
  var ss = sheet.getParent();
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2) { Logger.log("ไม่มีข้อมูล"); return; }
  var backupName = SHEET_NAME + " (สำรอง " + thaiTime_(new Date().toISOString()).replace(":", ".") + ")";
  sheet.copyTo(ss).setName(backupName);
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var out = rebuildRows_(rows);
  sheet.clear();
  writeHeader_(sheet);
  if (out.length) sheet.getRange(2, 1, out.length, HEADERS.length).setValues(out);
  sheet.autoResizeColumns(1, HEADERS.length - 1);
  sheet.setColumnWidth(HEADERS.length, 160);
  Logger.log("สร้างใหม่ " + out.length + " แถว (จากเดิม " + rows.length + " แถว) สำรองไว้ที่แท็บ: " + backupName);
}

/* กด Run เพื่อทดสอบ: เพิ่มแถวตัวอย่าง 1 แถว */
function testInsert() {
  var res = appendResult_({ candidate: { name: "TEST", phone: "0800000000" }, startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), results: {} });
  Logger.log("Inserted test row into: " + res.url);
}
