JOKJUNG BACK OFFICE V3.31 — COMPACT WORKSPACE & DATA GRID

เป้าหมายหลัก
1. Action bar ด้านบนเป็นแถวเดียว ไม่ใช้ horizontal slider
2. ปุ่มและข้อความ action เล็กลง เพื่อใช้พื้นที่หน้าจอน้อยลง
3. Page/Online/Date/Time status ย้ายไป Floating Status Dock มุมขวา
   - โปร่งแสง
   - เมื่อเลื่อนหน้า opacity ลดลงเพื่อไม่บังเนื้อหา
   - hover / focus แล้วชัดขึ้น
4. ตารางวัตถุดิบ
   - scroll ในกรอบได้ทั้งแนวตั้งและแนวนอน
   - header ค้างด้านบน
   - คอลัมน์แรกค้างด้านซ้าย
   - scrollbar มองเห็นชัด
   - ใช้พื้นที่แนวตั้งตาม viewport

การจัดไฟล์
- UI CSS หลัก: css/jokjung-ui-v3.31.css
- UI JS หลัก: js/jokjung-ui-v3.31.js
- UI JS รุ่น 3.21/3.22/3.23/3.27/3.28 และ navigation v3.30 ถูก consolidate แล้ว
- js/ ถูกทำความสะอาดให้เหลือ JavaScript ที่ใช้งานจริง

ไม่ได้แก้
- SQL
- Supabase schema / RPC
- Business Date / EOD logic
- Stock calculation logic
- Purchasing calculation logic
