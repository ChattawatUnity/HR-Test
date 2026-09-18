/**
 * Google Apps Script — รับผลสอบจากเว็บ HR-Test แล้วบันทึกลง Google Sheets
 * วิธีติดตั้ง: ดู README.md หัวข้อ "ตั้งค่า Google Sheets"
 */
var SHEET_NAME = "Results";
var COLUMNS = [
  "timestamp", "name", "phone",
  "p1_wpm", "p1_netWpm", "p1_accuracy", "p1_completion", "p1_timeUsed",
  "p2_to_ok", "p2_cc_ok", "p2_subject_ok", "p2_body_ok", "p2_body_similarity", "p2_timeUsed",
  "p3_fixed", "p3_missed", "p3_damaged", "p3_total", "p3_score", "p3_timeUsed",
  "p4_correct", "p4_total", "p4_score", "p4_timeUsed",
  "violations_paste", "violations_tabSwitch",
  "raw_json"
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    var row = COLUMNS.map(function (c) {
      if (c === "raw_json") return JSON.stringify(data.raw || {});
      var v = data[c];
      return v === undefined || v === null ? "" : v;
    });
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("HR-Test endpoint OK");
}
