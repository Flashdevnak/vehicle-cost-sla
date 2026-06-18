# Vehicle Cost SLA

เว็บ GitHub Pages สำหรับดูนโยบายควบคุมต้นทุนรถและ SLA พร้อมระบบ Admin สำหรับอัปโหลดข้อมูลผ่าน Firebase

## วิธีตั้งค่า

1. อัปโหลดไฟล์ทั้งหมดไว้ที่ root ของ GitHub Pages repository
2. เปิด `firebase-config.js` แล้วใส่ค่า Firebase web app config
3. เปิด Firebase Auth provider ที่ต้องใช้ เช่น Google และ Email/Password
4. เพิ่ม Authorized domain: `flashdevnak.github.io`
5. Publish `firestore.rules` ไปที่ Firestore Rules
6. Publish `storage.rules` ไปที่ Storage Rules
7. เปิด `admin.html` แล้ว Login
8. ถ้ายังไม่ใช่ admin ให้คัดลอก UID ที่หน้า Admin แสดง แล้วเพิ่มเอกสาร `admins/{UID}` ใน Firestore พร้อม field `active: true`
9. เลือกไฟล์ Excel > Preview > Publish
10. เปิดเว็บด้วย cache-busting URL เช่น `https://flashdevnak.github.io/vehicle-cost-sla/?v=20260618`

## ไฟล์หลัก

- `index.html` โครงสร้างหน้าเว็บและเนื้อหานโยบาย
- `styles.css` CSS ที่แยกจากไฟล์ต้นฉบับ
- `data.js` fallback data จากไฟล์ต้นฉบับ
- `app.js` renderer และ calculator หลัก
- `firebase-client.js` โหลด `public/data.json` จาก Firebase Storage และ fallback ไปใช้ `data.js`
- `admin.html` หน้า Login, Preview Excel, Publish JSON/backup และ audit log

ถ้า Firebase config ยังว่าง เว็บ public จะยังทำงานด้วย fallback data จาก `data.js`
