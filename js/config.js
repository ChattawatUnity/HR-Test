/* =====================================================================
 *  HR-Test  —  ค่าตั้งต้นทั้งหมดที่ HR แก้ได้ (ไม่ต้องแตะไฟล์อื่น)
 * ===================================================================== */
window.HR_CONFIG = {

  /* URL ของ Google Apps Script Web App (ดูวิธีตั้งค่าใน README.md)
     ปล่อยว่างไว้ = ไม่ส่งผล แสดงปุ่มดาวน์โหลดไฟล์ผลแทน */
  SHEETS_ENDPOINT: "https://script.google.com/macros/s/AKfycbwnZP9nEPyAcLs4daVhy85BT8aifBbkyHY2A--pBRNtoKyaVHgx77r_kYOYzkztCY0Y/exec",

  /* เวลาจำกัดแต่ละ part (วินาที) */
  TIME_LIMITS: {
    part1: 3 * 60,
    part2: 10 * 60,
    part3: 10 * 60,
    part4: 5 * 60,
  },

  /* ---------------- Part 1 : พิมพ์ภาษาไทย ---------------- */
  PART1_TEXT:
"เมื่อลูกค้ายืนยันการจองระวางเรือแล้ว เจ้าหน้าที่เอกสารต้องตรวจสอบชื่อผู้ส่งออก ผู้รับสินค้า ท่าเรือต้นทางและปลายทาง " +
"หมายเลขตู้คอนเทนเนอร์และหมายเลขซีลให้ครบถ้วน ก่อนจัดทำร่างใบตราส่งสินค้าส่งให้ลูกค้าตรวจทาน " +
"หากพบข้อผิดพลาดแม้เพียงตัวอักษรเดียว อาจทำให้เอกสารถูกปฏิเสธจากธนาคารและเกิดความล่าช้าในการเคลียร์สินค้าที่ปลายทาง " +
"โดยทั่วไปเรือแม่จะออกจากท่าเรือกรุงเทพทุกวันพฤหัสบดี และใช้เวลาเดินทางไปยังท่าเรือโอซาก้าประมาณ 7 ถึง 10 วัน",

  /* ---------------- Part 2 : อีเมลภาษาอังกฤษ ---------------- */
  PART2: {
    to: "test_customer@companyname.co.th",
    cc: "unity@unityagency.co.th",
    subject: "Notice of Draft B/L [UNITY]",
    body:
"1. VVD : JHKI924OW\n" +
"\n" +
"2. B/L Number : BKKE11111111\n" +
"\n" +
"3. B/L Type : Original B/L\n" +
"\n" +
"4. Rate of exchange : 32.71640\n" +
"\n" +
"Thank you for using UNITY service.\n" +
"\n" +
"Please review the draft B/L details as attached and advise us of any discrepancies and/or changes, if required.",
  },

  /* ---------------- Part 3 : จับผิดเอกสาร B/L ---------------- */
  /* ต้นฉบับ (แกะจาก PDF หน้า 1) — key = ชื่อช่อง, value = ค่าที่ถูกต้อง */
  BL_FIELDS: [
    /* [key, label, rows(1 = input, >1 = textarea)] */
    ["shipper",        "SHIPPER",                          5],
    ["blNo",           "B/L NO.",                          1],
    ["bookingRef",     "R/C / BOOKING REF.",               1],
    ["consignee",      "CONSIGNEE",                        2],
    ["exportRef",      "EXPORT REFERENCES",                1],
    ["notifyParty",    "NOTIFY PARTY",                     2],
    ["serviceRequired","SERVICE REQUIRED",                 1],
    ["feederVessel",   "FEEDER VESSEL",                    1],
    ["motherVessel",   "MOTHER VESSEL / VOYAGE",           1],
    ["portOfLoading",  "PORT OF LOADING",                  1],
    ["placeOfAcceptance","PLACE OF ACCEPTANCE",            1],
    ["portOfDischarge","PORT OF DISCHARGE",                1],
    ["placeOfDelivery","PLACE OF DELIVERY",                1],
    ["finalDestination","FINAL DESTINATION",               1],
    ["bkkDestination", "BKK DESTINATION",                  1],
    ["containerNo",    "CONTAINER NO.",                    1],
    ["sealNo",         "SEAL NO.",                         1],
    ["marks",          "MARK & NUMBERS",                   2],
    ["packages",       "NO. OF PACKAGE / UNIT",            1],
    ["description",    "DESCRIPTION OF GOODS",             6],
    ["grossWeight",    "GROSS WEIGHT / MEASUREMENT",       2],
    ["totalInWords",   "TOTAL NO. OF CONTAINERS OR PACKAGES (IN WORDS)", 1],
    ["freightPayable", "FREIGHT PAYABLE AT",               1],
    ["noOfOriginal",   "NUMBER OF ORIGINAL B/L",           1],
    ["packingPremises","PACKING PREMISES (FCL CARGO ONLY)",1],
    ["placeOfIssue",   "PLACE AND DATE OF ISSUE",          1],
    ["remarks",        "REMARKS",                          1],
    ["signature",      "NAME & SIGNATURE OF SHIPPER / AGENT", 1],
  ],

  BL_ORIGINAL: {
    shipper:          "SARA FARMS CO., LTD.\n44M MOO 11, NAWAMIN ROAD, KANNAYAW,\nKANNAYAW DISTRICT, BANGKOK 10230, THAILAND.",
    blNo:             "BKK235632",
    bookingRef:       "-",
    consignee:        "TO ORDER OF SIAM COMMERCIAL BANK PUBLIC COMPANY LIMITED",
    exportRef:        "SHIPMENT BKK235632",
    notifyParty:      "HANWA CO., LTD. TOKYO.\n(FAX NO. 03-3544-2050)",
    serviceRequired:  "CY/CY",
    feederVessel:     "-",
    motherVessel:     "SATSUKI V. 096 N",
    portOfLoading:    "BANGKOK, THAILAND",
    placeOfAcceptance:"BANGKOK, THAILAND",
    portOfDischarge:  "OSAKA, JAPAN",
    placeOfDelivery:  "OSAKA, JAPAN",
    finalDestination: "OSAKA, JAPAN",
    bkkDestination:   "-",
    containerNo:      "TRLU 1052114",
    sealNo:           "SPIC172554",
    marks:            "TC IN SQUARE\nHAN-04/20038",
    packages:         "CARTONS 1,000",
    description:      "FROZEN CHICKEN (GALLUS DOMESTICUS)\n(ONE THOUSAND CARTONS ONLY)\nSTOWED IN REFRIGERATED CONTAINER AT\n-18 DEGREE CELCIUS\nFREIGHT PREPAID\nB/L ON BOARD 18/2/2003",
    grossWeight:      "G.W. 12.500 M/TONS\nN.W. 12.000 M/TONS",
    totalInWords:     "ONE THOUSAND CARTONS ONLY",
    freightPayable:   "PREPAID",
    noOfOriginal:     "3 (THREE)",
    packingPremises:  "Contact Person: - | Tel: - | Packing Time: -",
    placeOfIssue:     "BANGKOK, THAILAND",
    remarks:          "Loading On Board Date: 18/02/2003",
    signature:        "UNITY AGENCY CO., LTD.",
  },

  /* ช่องที่ทำให้ผิดในฉบับที่ผู้สมัครต้องแก้ (ค่าเริ่มต้นแกะจาก PDF หน้า 2)
     แก้/เพิ่ม/ลบได้ตามต้องการ: key ต้องตรงกับ BL_ORIGINAL */
  BL_WRONG: {
    shipper:          "SAHA FARMS CO., LTD.\n44/4 MOO 11, NAWAMIN ROAD, KANAYAW,\nKANAYAW DISTRICTS, BANGKOK 10230, THAILAND.",
    blNo:             "BKK236532",
    consignee:        "TO ORDER OF SIAM COMERCIAL BANK PUBLIC COMPANY LIMITED",
    exportRef:        "SHIPMENT BKK236532",
    notifyParty:      "HANWA CO LTD. TOKYO.\n(FAX NO. 03-3544-2050)",
    motherVessel:     "SASUKI V. 096 N",
    placeOfAcceptance:"BANKGOK, THAILAND",
    containerNo:      "TRLU 1052119",
    marks:            "TC IN SQUARE\nHAN-04/2003",
    description:      "FROZEN CHICKEN (GALLUS DOMESTICUS)\n(ONE THOUSAND CARTONS ONLY)\nSTOWED IN REFRIGERATED CONTAINER AT\n-16 DEGREE CELCIUS\nFREIGHT PREPAID\nB/L ON BOARD 18/2/2003",
  },

  /* ---------------- Part 4 : ศัพท์ shipping ---------------- */
  /* answer = index ของตัวเลือกที่ถูก (เริ่มที่ 0) */
  PART4: [
    { q: "Shipper",           choices: ["ผู้ส่งออกสินค้า", "เจ้าของเรือขนส่ง", "เรือขนส่ง", "เส้นทางเดินเรือ"], answer: 0 },
    { q: "Temperature",       choices: ["ทะเล", "อากาศ", "อุณหภูมิ", "ความชื้น"], answer: 2 },
    { q: "Port of Discharge", choices: ["เส้นทางเดินเรือ", "ท่าเรือต้นทาง", "ท่าเรือปลายทาง", "ท่าเรือผ่านทาง"], answer: 2 },
    { q: "Delay",             choices: ["ก่อนกำหนด", "ล่าช้า", "ผิดสถานที่", "เปลี่ยนสถานที่"], answer: 1 },
    { q: "Demurrage",         choices: ["ค่าปรับกรณีตู้สินค้าค้างอยู่ในท่าเรือเกินกำหนด", "ค่าปรับกรณีคืนตู้เปล่าล่าช้าเกินกำหนด", "ค่าระวางเรือ", "ค่าประกันภัยสินค้า"], answer: 0 },
    { q: "Detention",         choices: ["ค่าปรับกรณีตู้สินค้าค้างอยู่ในท่าเรือเกินกำหนด", "ค่าปรับกรณีนำตู้ออกจากท่าเรือแล้วคืนช้าเกินกำหนด", "ค่าธรรมเนียมเอกสาร", "ค่ายกตู้ขึ้น-ลง"], answer: 1 },
    { q: "ETD",               choices: ["วันที่เรือถึงที่หมาย", "วันที่เรือออก", "ระยะเวลาขนส่งทั้งหมด", "ระยะเวลาที่สินค้าอยู่บนเรือ"], answer: 1 },
    { q: "LCL",               choices: ["สินค้าเต็มตู้", "สินค้าไม่เต็มตู้ (รวมตู้กับผู้ส่งรายอื่น)", "ลานพักตู้สินค้า", "ท่าเรือขนถ่ายสินค้า"], answer: 1 },
    { q: "CY",                choices: ["ลานพักตู้สินค้า", "โกดังรวมสินค้า", "ปีปฏิทิน", "ท่าเรือปลายทาง"], answer: 0 },
    { q: "Expense",           choices: ["รายได้", "ค่าใช้จ่าย", "ค่าประกันภัย", "ใบรับรอง"], answer: 1 },
    { q: "Certificate",       choices: ["ใบรับรอง", "ค่าประกันภัย", "รายได้", "ค่าใช้จ่าย"], answer: 0 },
    { q: "Mother Vessel",     choices: ["บริษัทแม่", "เรือแม่", "นักธุรกิจสาว", "ภาษาที่ใช้ในเอกสาร"], answer: 1 },
  ],
};
