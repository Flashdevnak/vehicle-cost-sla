# Vehicle Cost & SLA Firebase Full Final

ชุดนี้เป็นระบบเต็ม:
- GitHub Pages เป็นหน้าเว็บ
- Firebase Auth ใช้ Login Admin
- Firestore ใช้เก็บสิทธิ์ Admin และประวัติ upload
- Firebase Storage ใช้เก็บ Excel, backup และ public/data.json
- หน้าเว็บมีเมนู Admin ไม่ต้องพิมพ์ URL

## ไฟล์ที่ต้องอัปขึ้น GitHub root
```text
index.html
styles.css
data.js
app.js
firebase-client.js
firebase-config.js
admin.html
```

## ไฟล์ที่ใช้ตั้งค่า Firebase
```text
firestore.rules
storage.rules
README.md
```

## วิธีตั้งค่า Firebase
1. Firebase Console > Project settings > Your apps > Web app
2. คัดลอก firebaseConfig มาใส่ใน `firebase-config.js`
3. Authentication > Sign-in method > เปิด Google หรือ Email/Password
4. Authentication > Settings > Authorized domains > เพิ่ม:
```text
flashdevnak.github.io
```
5. Firestore Database > Rules > วางเนื้อหา `firestore.rules` แล้ว Publish
6. Storage > Rules > วางเนื้อหา `storage.rules` แล้ว Publish

## เพิ่ม Admin คนแรก
1. เปิดหน้าเว็บหลัก
2. กดเมนู Admin
3. Login
4. ถ้ายังไม่มีสิทธิ์ ระบบจะแสดง UID
5. ไป Firestore สร้าง:
```text
collection: admins
document ID: UID
fields:
active = true
role = superAdmin
email = your@email.com
```
6. Refresh หน้า Admin

## อัปเดตข้อมูล
1. หน้าเว็บ > Admin
2. Login
3. เลือก Excel ล่าสุด
4. กด Preview
5. ตรวจจำนวน Route / Capacity กลาง / HUB
6. กด Publish
7. กลับหน้าเว็บ เปิดแบบล้างแคช:
```text
https://flashdevnak.github.io/vehicle-cost-sla/?v=newdata1
```

## หมายเหตุ
- ถ้า Firebase ยังไม่ได้ตั้งค่า เว็บยังแสดงข้อมูล fallback จาก data.js ได้
- หลัง Publish เว็บจะโหลด public/data.json จาก Firebase Storage อัตโนมัติ
- คนทั่วไปดูเว็บได้ แต่ Publish ไม่ได้
