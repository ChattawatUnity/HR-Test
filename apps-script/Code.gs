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
 */
var SPREADSHEET_ID = "";   // ใส่ ID จาก URL ของชีต (ส่วนระหว่าง /d/ กับ /edit) ถ้าต้องการระบุเอง
var SHEET_NAME = "Results";
var COLUMNS = [
  "timestamp", "name", "phone",
  "p1_wpm", "p1_netWpm", "p1_accuracy", "p1_completion", "p1_timeUsed",
  "p2_accuracy", "p2_errors", "p2_to_ok", "p2_cc_ok", "p2_body_ok", "p2_body_similarity", "p2_timeUsed",
  "p3_fixed", "p3_missed", "p3_damaged", "p3_total", "p3_score", "p3_timeUsed",
  "p4_correct", "p4_total", "p4_score", "p4_timeUsed",
  "violations_paste", "violations_tabSwitch",
  "raw_json"
];

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
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS);
    styleHeader_(sheet, COLUMNS.length);
  }
  return sheet;
}

function styleHeader_(sheet, n) {
  sheet.getRange(1, 1, 1, n).setFontWeight("bold");
  sheet.setFrozenRows(1);
}

/* ---------- ฟังก์ชันล้วน (ไม่แตะชีต) ทดสอบได้ ---------- */

/* หัวคอลัมน์ที่มีอยู่ + คอลัมน์ใหม่ที่ยังไม่มี ต่อท้าย (raw_json อยู่ท้ายสุดเสมอ) */
function mergeHeader_(existing, columns) {
  var head = existing.filter(function (h) { return h !== "" && h !== "raw_json"; });
  columns.forEach(function (c) { if (c !== "raw_json" && head.indexOf(c) < 0) head.push(c); });
  head.push("raw_json");
  return head;
}

/* แปลงข้อมูลผลสอบเป็นแถว ตามชื่อหัวคอลัมน์ */
function rowFor_(header, data) {
  return header.map(function (c) {
    if (c === "raw_json") return JSON.stringify(data.raw || {});
    var v = data[c];
    return v === undefined || v === null ? "" : v;
  });
}

/* จัดแถวเดิมใหม่ให้ตรงหัว: ดูว่า raw_json (ค่าที่ขึ้นต้นด้วย "{") อยู่คอลัมน์ไหน
   แล้วเทียบกับลำดับคอลัมน์ที่ใช้ตอนเขียนแถวนั้น (layouts) */
function relayout_(rows, layouts, header) {
  return rows.map(function (row) {
    var jsonAt = -1;
    for (var i = row.length - 1; i >= 0; i--) {
      if (typeof row[i] === "string" && row[i].charAt(0) === "{") { jsonAt = i; break; }
    }
    var layout = null;
    for (var k = 0; k < layouts.length; k++) {
      if (layouts[k].indexOf("raw_json") === jsonAt) { layout = layouts[k]; break; }
    }
    if (!layout) return header.map(function (h, j) { return row[j] === undefined ? "" : row[j]; });
    var data = {};
    layout.forEach(function (c, j) { data[c] = row[j]; });
    return header.map(function (h) { return data[h] === undefined ? "" : data[h]; });
  });
}

/* ---------- เขียนผล ---------- */

function appendResult_(data) {
  var sheet = getSheet_();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var header = mergeHeader_(existing, COLUMNS);
  if (header.join("|") !== existing.join("|")) {
    // หัวไม่ตรงกับเวอร์ชันปัจจุบัน → เพิ่มคอลัมน์ใหม่ต่อท้ายหัว (ไม่ย้ายข้อมูลเดิม)
    if (existing.indexOf("raw_json") >= 0 && existing.indexOf("raw_json") !== header.indexOf("raw_json")) {
      // raw_json เดิมไม่ได้อยู่ท้าย ให้คงตำแหน่งเดิม แล้วต่อคอลัมน์ใหม่ไว้หลังสุด
      header = existing.filter(function (h) { return h !== ""; });
      COLUMNS.forEach(function (c) { if (header.indexOf(c) < 0) header.push(c); });
    }
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    styleHeader_(sheet, header.length);
  }
  sheet.appendRow(rowFor_(header, data));
  return sheet.getParent().getUrl();
}

/* ---------- ซ่อมข้อมูลที่เลื่อนคอลัมน์ (กด Run ครั้งเดียว) ----------
   ใช้เมื่อหัวคอลัมน์ในชีตไม่ตรงกับข้อมูล: ตั้งหัวใหม่ตามเวอร์ชันปัจจุบัน
   แล้วจัดทุกแถวให้ค่าอยู่ใต้หัวที่ถูกต้อง */
var LEGACY_LAYOUTS = [
  // เวอร์ชันแรก (มี p2_subject_ok)
  ["timestamp", "name", "phone", "p1_wpm", "p1_netWpm", "p1_accuracy", "p1_completion", "p1_timeUsed",
   "p2_to_ok", "p2_cc_ok", "p2_subject_ok", "p2_body_ok", "p2_body_similarity", "p2_timeUsed",
   "p3_fixed", "p3_missed", "p3_damaged", "p3_total", "p3_score", "p3_timeUsed",
   "p4_correct", "p4_total", "p4_score", "p4_timeUsed", "violations_paste", "violations_tabSwitch", "raw_json"],
  // เวอร์ชันที่ 2 (ตัด subject)
  ["timestamp", "name", "phone", "p1_wpm", "p1_netWpm", "p1_accuracy", "p1_completion", "p1_timeUsed",
   "p2_to_ok", "p2_cc_ok", "p2_body_ok", "p2_body_similarity", "p2_timeUsed",
   "p3_fixed", "p3_missed", "p3_damaged", "p3_total", "p3_score", "p3_timeUsed",
   "p4_correct", "p4_total", "p4_score", "p4_timeUsed", "violations_paste", "violations_tabSwitch", "raw_json"]
];

function fixShiftedRows() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow(), lastCol = sheet.getLastColumn();
  if (lastRow < 2) { Logger.log("ไม่มีข้อมูลให้ซ่อม"); return; }
  var rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var fixed = relayout_(rows, [COLUMNS].concat(LEGACY_LAYOUTS), COLUMNS);
  sheet.getRange(1, 1, lastRow, lastCol).clearContent();
  sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
  styleHeader_(sheet, COLUMNS.length);
  sheet.getRange(2, 1, fixed.length, COLUMNS.length).setValues(fixed);
  Logger.log("จัดใหม่แล้ว " + fixed.length + " แถว");
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = (e && e.postData && e.postData.contents) || (e && e.parameter && e.parameter.payload) || "{}";
    var data = JSON.parse(body);
    var url = appendResult_(data);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, sheet: url })).setMimeType(ContentService.MimeType.JSON);
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

/* กด Run ฟังก์ชันนี้ใน editor เพื่อทดสอบ: จะเพิ่มแถวตัวอย่าง 1 แถว และแสดง URL ของชีตใน Execution log */
function testInsert() {
  var url = appendResult_({ timestamp: new Date().toISOString(), name: "TEST", phone: "0000000000", raw: { test: true } });
  Logger.log("Inserted test row into: " + url);
}
