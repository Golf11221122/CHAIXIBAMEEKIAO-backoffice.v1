CHAIXI BAMEEKIAO - Production Batch Output Edit Patch

ไฟล์ใน ZIP นี้มีเฉพาะส่วนที่แก้:
1) PATCH_PRODUCTION_BATCH_OUTPUT_EDIT_V1.sql
2) production.js   -> วางทับใน /js/production.js
3) production.html -> วางทับใน /stock/production.html

ลำดับติดตั้ง:
1. Supabase SQL Editor: รัน PATCH_PRODUCTION_BATCH_OUTPUT_EDIT_V1.sql หนึ่งครั้ง
2. GitHub: วาง production.js ที่โฟลเดอร์ js/
3. GitHub: วาง production.html ที่โฟลเดอร์ stock/
4. รอ GitHub Pages deploy แล้ว Refresh

วิธีแก้เคส PB-20260829-0008 หมูแดง:
- Production / Prep > เลือก Batch > ดู > ✏️ แก้ Output
- เปลี่ยน 990 เป็น 10000
- เนื่องจากคุณแจ้งว่าได้ Adjust Stock ชดเชยไปแล้ว ให้ติ๊ก
  "ฉันปรับ Stock เพิ่ม/ลดชดเชยไว้แล้ว — ไม่ต้องปรับ Stock ซ้ำ"
- กดยืนยัน

สิ่งที่ระบบแก้เฉพาะ Batch นี้:
- actual_output_qty
- output_unit_cost
- actual_yield_pct
- yield_variance_pct
- yield_loss_value

ระบบไม่แก้ Input ของ Batch และไม่แก้ Production Batch อื่น
