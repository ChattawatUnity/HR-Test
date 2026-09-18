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
  "p2_to_ok", "p2_cc_ok", "p2_subject_ok", "p2_body_ok", "p2_body_similarity", "p2_timeUsed",
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
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendResult_(data) {
  var sheet = getSheet_();
  var row = COLUMNS.map(function (c) {
    if (c === "raw_json") return JSON.stringify(data.raw || {});
    var v = data[c];
    return v === undefined || v === null ? "" : v;
  });
  sheet.appendRow(row);
  return sheet.getParent().getUrl();
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
