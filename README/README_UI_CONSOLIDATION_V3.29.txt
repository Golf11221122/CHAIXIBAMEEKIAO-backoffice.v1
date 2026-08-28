JOKJUNG BACK OFFICE V3.29 — UI CONSOLIDATION

สิ่งที่ทำ
- รวมไฟล์ UI CSS เดิมเป็นไฟล์เดียว: css/jokjung-ui-v3.29.css
- รวมลำดับเดิมตั้งแต่ ui-pro-v3.20.css และ ui-store-v3.21.css ถึง ui-store-v3.28.5.css
- แก้ HTML ที่เคยเรียก UI CSS หลายไฟล์ ให้เรียก jokjung-ui-v3.29.css เพียงไฟล์เดียว
- ลบไฟล์ UI CSS รุ่นย่อยที่รวมแล้วออกจาก css/ เพื่อลดความซ้ำซ้อน
- ย้าย README ที่กระจายอยู่ root เข้าโฟลเดอร์ README/
- README ที่ชื่อซ้ำและเนื้อหาเหมือนกัน เก็บเพียงสำเนาเดียว

ไฟล์ CSS พื้นฐานที่ยังแยกไว้ตามหน้าที่
- app.css
- stock-v2.css
- responsive.css
- print.css / print-wide-report.css
- login.css
- employees.css

หมายเหตุ
- ไม่แก้ SQL
- ไม่แก้ Supabase logic
- ไม่แก้ Business Date / EOD / Stock / Purchasing logic
- JavaScript UI ยังแยกตามหน้าที่ เพราะเป็น behavior ไม่ใช่ stylesheet และไม่ควรรวมแบบสุ่ม
