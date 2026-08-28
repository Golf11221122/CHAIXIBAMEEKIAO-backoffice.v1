JOKJUNG BACK OFFICE V3.31.4 — MOBILE FIXES (EXCEPT P&L READINESS)

ทำตามชุดวิเคราะห์ที่ผู้ใช้ส่งมา โดยตั้งใจไม่แก้หน้า P&L Readiness (ข้อ 2)

แก้แล้ว
1) P&L Dashboard
- ย่อฟอร์มวันที่เป็น 2 ช่องในแถวเดียว
- ปุ่ม วันนี้ / เดือนนี้ / คำนวณ อยู่แถวเดียว
- เปลี่ยนหัวข้อ KPI สำคัญเป็นภาษาไทย
- ลดความสูง action/share/print
- เพิ่มพื้นที่ท้ายหน้าสำหรับ bottom navigation

3) Cost Fix Center / COGS = 0
- เพิ่มสถานะวิเคราะห์ชัดเจน
- เพิ่ม SQL PATCH V1.1 ใช้ขอบเขตวันที่ Asia/Bangkok แบบ explicit
- เพิ่ม sales_amount / captured_cogs / zero_cost_line_count / diagnostic_status
- ถ้ามียอดขาย แต่ COGS = 0 และตัวตรวจเดิมหา issue ไม่เจอ จะแสดง COGS_ZERO_UNEXPLAINED
SQL ที่ต้องรัน: sql/PATCH_COST_FIX_CENTER_V1.1_TIMEZONE_DIAGNOSTIC.sql

4) Bulk Cost Sync
- KPI 3 กล่องอยู่แถวเดียว
- ปุ่ม Preview / เลือก Sync / Sync กระชับ
- มือถือแสดงรายการเป็น card แทน desktop table
- checkbox ใหญ่ขึ้น และปุ่ม Sync แสดงจำนวนที่เลือก

5) Stock Count
- แก้ overflow แนวนอน
- ปุ่มเริ่มนับเป็นปุ่ม + แบบ compact
- รายการ Stock Count บนมือถือเป็น cards
- modal จำกัดความกว้างตาม viewport
- ลบเมนู Go-Live ซ้ำใน sidebar หน้า Stock Count

6-7) Stock Report / PDF
- A4 Landscape
- แบ่งข้อมูลเป็นหน้าๆ ละประมาณ 20 แถว
- thead มีในแต่ละชุด/หน้ารายงาน
- หลีกเลี่ยง row split
- เพิ่ม summary ท้ายรายงาน
- คอลัมน์ชื่อวัตถุดิบกว้างขึ้น

Global mobile safety
- html/body/app/main/content max-width 100%
- overflow-x hidden ที่ shell
- sidebar จำกัดไม่เกิน 86vw
- เพิ่ม bottom padding กัน bottom navigation ทับข้อมูล
- report share/print ย่อลง

ไม่ได้แก้
- P&L Readiness (ข้อ 2)
- POS / Kitchen
- Stock calculation
- Purchase calculation
- EOD / Business Date
