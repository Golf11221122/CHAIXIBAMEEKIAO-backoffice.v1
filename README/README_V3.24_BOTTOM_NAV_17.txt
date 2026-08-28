JOKJUNG Back Office V3.24 — Bottom Navigation แบบ 17

ฐาน: V3.23 SAFE UI FROM V3.22

เพิ่มเฉพาะระบบเมนูล่างมือถือ:
- หน้าหลัก
- การเงิน
- Stock
- จัดซื้อ
- เพิ่มเติม

พฤติกรรม:
- แสดงเฉพาะหน้าที่มี Top Bar และหน้าจอไม่เกิน 900px
- หน้าที่กำลังใช้งานจะมีพื้นหลังอ่อนและไอคอนไฮไลต์สีเหลือง
- ปุ่ม เพิ่มเติม เปิด Bottom Sheet รวมเมนูรอง
- รองรับ Light / Dark Mode
- เพิ่ม safe padding ด้านล่างเพื่อไม่ให้เมนูทับเนื้อหา
- ไม่แตะ business logic ของหน้า Stock / Finance / Purchasing

ไฟล์ใหม่:
css/ui-bottom-nav-v3.24.css
js/ui-bottom-nav-v3.24.js
