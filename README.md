# Vehicle Cost SLA

เว็บ GitHub Pages สำหรับดูนโยบายควบคุมต้นทุนรถและ SLA พร้อมระบบ Admin สำหรับอัปโหลดข้อมูล Excel ตรวจสอบข้อมูล และเผยแพร่ข้อมูลเวอร์ชันล่าสุดผ่าน Firebase

## วิธีตั้งค่า

1. อัปโหลดไฟล์ทั้งหมดไว้ที่ root ของ GitHub Pages repository
2. เปิด `firebase-config.js` แล้วใส่ค่า Firebase web app config
3. เปิด Firebase Auth provider ที่ต้องใช้ เช่น Google และ Email/Password
4. เพิ่ม Authorized domain: `flashdevnak.github.io`
5. Publish `firestore.rules` ไปที่ Firestore Rules
6. Publish `storage.rules` ไปที่ Storage Rules
7. เปิด `admin.html` แล้ว Login
8. ถ้ายังไม่ใช่ admin ให้คัดลอก UID ที่หน้า Admin แสดง แล้วเพิ่มเอกสาร `admins/{UID}` ใน Firestore พร้อม field `active: true`
9. เลือกไฟล์ Excel > Validate & Preview > Publish
10. เปิดเว็บด้วย cache-busting URL เช่น `https://flashdevnak.github.io/vehicle-cost-sla/?v=20260618`

## โครงสร้างข้อมูล Firebase

- Firestore `admins/{uid}` ใช้ควบคุมสิทธิ์ผู้ดูแลระบบ
- Firestore `site_versions/{versionId}` เก็บ metadata ของแต่ละเวอร์ชัน
- Firestore `site_current/current` ชี้ไปยังเวอร์ชันล่าสุดที่เผยแพร่
- Storage `uploads/{versionId}/source.xlsx` เก็บไฟล์ Excel ต้นทาง
- Storage `uploads/{versionId}/normalized-data.json` เก็บข้อมูล normalized สำหรับหน้าเว็บ

## ไฟล์หลัก

- `index.html` โครงสร้างหน้าเว็บและเนื้อหานโยบาย
- `styles.css` CSS ของหน้า public และ responsive layout
- `data.js` ข้อมูลสำรองที่ฝังมากับเว็บ
- `app.js` renderer, search, calculators และ data normalizer
- `firebase-client.js` โหลดข้อมูลเวอร์ชันปัจจุบันจาก Firebase เมื่อ config พร้อมใช้งาน
- `admin.html` หน้า Login, Validate, Preview, Publish, Version History และ Rollback
- `firestore.rules` และ `storage.rules` กฎความปลอดภัยสำหรับ Firebase

ถ้า Firebase config ยังว่าง หน้า public จะยังเปิดใช้งานได้จากข้อมูลสำรองโดยไม่แสดงข้อความตั้งค่าระบบให้ผู้ใช้ทั่วไปเห็น
