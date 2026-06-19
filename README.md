# Vehicle Cost SLA

เว็บ GitHub Pages สำหรับดูนโยบายควบคุมต้นทุนรถและ SLA พร้อมระบบ Admin สำหรับอัปโหลด Excel, ตรวจสอบข้อมูล, เผยแพร่เวอร์ชันล่าสุด และ rollback ผ่าน Firebase Auth + Firestore เท่านั้น

ระบบนี้ไม่ใช้ Firebase Storage เพื่อให้ใช้งานกับ Firebase Spark/free plan ได้

## วิธีตั้งค่า Firebase

1. สร้าง Firebase Project
2. เพิ่ม Web App แล้วคัดลอกค่า config มาใส่ใน `firebase-config.js`
3. เปิด Authentication provider ที่ต้องใช้ เช่น Google หรือ Email/Password
4. เพิ่ม Authorized domain: `flashdevnak.github.io`
5. เปิด Firestore Database
6. Publish กฎจาก `firestore.rules` ไปที่ Firestore Rules
7. ไม่ต้องเปิด Firebase Storage และไม่ต้องตั้งค่า Storage rules สำหรับระบบหลัก
8. เปิด `admin.html` แล้ว Login
9. ถ้ายังไม่ใช่ admin ให้คัดลอก UID จากหน้า Admin แล้วเพิ่มเอกสาร `admins/{UID}` ใน Firestore:

```json
{
  "active": true,
  "role": "superAdmin",
  "email": "admin@example.com"
}
```

10. กลับมาที่หน้า Admin แล้วเลือกไฟล์ Excel > Validate & Preview > Publish
11. เปิดเว็บด้วย cache-busting URL เช่น `https://flashdevnak.github.io/vehicle-cost-sla/?v=20260618`

## โครงสร้างข้อมูล Firestore

- `admins/{uid}` ควบคุมสิทธิ์ผู้ดูแลระบบ
- `site_current/current` ชี้ไปยังเวอร์ชันที่เว็บ public ต้องโหลด
- `site_versions/{versionId}` เก็บ metadata ของแต่ละเวอร์ชัน
- `site_data/{versionId}/chunks/meta` เก็บ `vehicleCapacityData`, `vehicleCapacityTrucks`, และ `hubMasterData`
- `site_data/{versionId}/chunks/routes_0001`, `routes_0002`, ... เก็บ `routeCapacityData` แบบแบ่ง chunk เพื่อหลีกเลี่ยงขนาดเอกสาร Firestore เกิน 1MB

ตัวอย่าง metadata:

```json
{
  "versionId": "v-2026-06-19T00-00-00-000Z",
  "updatedAt": "serverTimestamp",
  "updatedByUid": "firebase-user-uid",
  "updatedByEmail": "admin@example.com",
  "routeRows": 15458,
  "vehicleRows": 224,
  "hubRows": 40,
  "chunkCount": 40,
  "status": "published",
  "note": "source-file.xlsx"
}
```

## การใช้งาน Admin

- Login ด้วยบัญชีที่มีเอกสารใน `admins/{uid}` และ `active: true`
- Upload Excel เพื่อ parse ใน browser ด้วย SheetJS
- Validate & Preview เพื่อตรวจ sheet และจำนวนข้อมูล
- Publish เพื่อเขียน chunks ไปยัง Firestore และอัปเดต `site_current/current`
- Rollback เพื่อเปลี่ยน `site_current/current` ไปยัง `versionId` เก่า โดยไม่ copy ข้อมูลซ้ำ

## ไฟล์หลัก

- `index.html` โครงสร้างหน้าเว็บและเนื้อหานโยบาย
- `styles.css` CSS ของหน้า public, admin, และ responsive layout
- `data.js` ข้อมูลสำรองที่ฝังมากับเว็บ ใช้เมื่อ Firebase config ว่างหรือโหลด Firestore ไม่สำเร็จ
- `app.js` renderer, search, calculators, และ data normalizer
- `firebase-client.js` โหลดข้อมูลเวอร์ชันปัจจุบันจาก Firestore chunks
- `admin.html` หน้า Login, Validate, Preview, Publish, Version History และ Rollback
- `firestore.rules` กฎความปลอดภัยสำหรับ Firestore-only system
- `storage.rules` deny-all เพราะระบบหลักไม่ใช้ Firebase Storage

ถ้า Firebase config ยังว่าง หน้า public จะยังเปิดใช้งานได้จาก `data.js` โดยไม่แสดงข้อความตั้งค่าระบบให้ผู้ใช้ทั่วไปเห็น
