JOKJUNG BACK OFFICE — V3.33 CLEAN STORE UI REBUILD

เป้าหมาย
- ยึดหน้าตา Clean Store UI ที่อนุมัติเป็นมาตรฐานเดียวทั้งโปรเจกต์
- หยุดการ override UI แบบหลายชั้นที่ทำให้แต่ละหน้าไม่เหมือนกัน

สิ่งที่เปลี่ยน
1. คืน css/js core ของ V3.31 ให้เป็นฐานที่เสถียรก่อนรอบทดลอง FAB/Date Range หลายชั้น
2. เพิ่ม css/jokjung-ui-v3.33.css เป็น final visual layer ตัวเดียว
3. เพิ่ม js/jokjung-ui-v3.33.js เป็นตัว normalize component มือถือ
4. ทุก 34 หน้าโหลด V3.33 หลัง V3.31 core
5. Header / Status / User controls ใช้สัดส่วนเดียวกัน
6. Page title + Share/Print icon ใช้โครงเดียวกัน
7. Add/Create ใน page header ใช้ FAB + เพียงตัวเดียว
8. Date range 2 ช่องอยู่แถวเดียว มีคำว่า ถึง ตรงกลาง
9. Quick range / tabs เป็น compact pill และ scroll แนวนอนได้
10. Action 2 ปุ่ม เช่น จัดการหมวด + Production อยู่แถวเดียว
11. KPI / Summary บนมือถือใช้ 2 คอลัมน์แบบ compact
12. Table อยู่ใน scroll shell และไม่ดัน viewport ออกด้านขวา
13. Bottom navigation มีพื้นที่เผื่อด้านล่าง ไม่บัง content
14. Dark mode ใช้ contrast ใหม่จาก final layer
15. ซ่อน legacy action dock / ghost spacer เก่า

ไม่ได้แก้
- Supabase schema / SQL business logic
- EOD / Business Date logic
- Stock calculation logic
- Purchasing calculation logic
- P&L calculation logic

ไฟล์ UI หลัก
- css/jokjung-ui-v3.31.css   (stable core)
- css/jokjung-ui-v3.33.css   (final clean visual layer)
- js/jokjung-ui-v3.31.js     (stable core behavior)
- js/jokjung-ui-v3.33.js     (final mobile component normalizer)
