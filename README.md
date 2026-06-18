# Vehicle Cost & SLA Firebase Full Restored Index

ชุดนี้ใช้ `index.html` เดิมแบบเนื้อหาครบ แล้วเพิ่ม:
- เมนู Admin
- Firebase loader
- แก้เครื่องคำนวณค่าปรับ/รางวัล
- แก้ตาราง Capacity กลางให้แสดงทั้งคอมและมือถือ
- จัดเมนูกึ่งกลาง

## ไฟล์ที่ต้องอัปขึ้น GitHub root
```text
index.html
admin.html
firebase-config.js
firestore.rules
storage.rules
README.md
```

## สำคัญ
ไฟล์นี้ตั้งใจใช้ `index.html` เดิมเพื่อเอาเนื้อหาทุกส่วนกลับมาครบ ไม่ใช่เวอร์ชัน clean split ที่ตัดเนื้อหาบางส่วนออก

## ข้อมูล fallback
- Route Capacity: 15,458 รายการ
- Capacity กลาง: 224 รายการ
- ประเภทรถ: 10

## หลังอัป
เปิด:
```text
https://flashdevnak.github.io/vehicle-cost-sla/?v=restoredfull1
```
