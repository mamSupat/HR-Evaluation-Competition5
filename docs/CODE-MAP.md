# แผนที่โค้ดสำหรับฝึกจำ

## จำโครงสร้างหลัก 6 จุด

1. `frontend/src/main.js` — จุดเริ่มต้นของ Vue
2. `frontend/src/router.js` — เส้นทางและสิทธิ์แต่ละบทบาท
3. `frontend/src/api.js` — ฟังก์ชันเรียก Backend (`get`, `post`, `put`, `del`)
4. `frontend/src/views/Page.vue` — หน้าจอและการทำงานของแต่ละหน้า
5. `backend/server.js` — API, ตรวจสอบสิทธิ์ และ Logic
6. `database/schema.sql` — ตารางและความสัมพันธ์ของฐานข้อมูล

## ลำดับการจำ Page.vue

- `template` — แสดงหน้าจอและปุ่ม
- `imports / state` — นำเข้าเครื่องมือและประกาศตัวแปร
- `login` — เข้าสู่ระบบ ออกจากระบบ เปลี่ยนรหัสผ่าน
- `loadAll` — โหลดข้อมูลตามหน้าที่เปิด
- `staff / rounds / indicators` — จัดการข้อมูลพื้นฐาน
- `assignments` — มอบหมายผู้รับการประเมินและกรรมการ
- `assessment` — คะแนน รายละเอียด หลักฐาน และยืนยันผล
- `reports` — รายงานและสำรองข้อมูล

## รูปแบบ API ที่ใช้ซ้ำ

```js
const rows = await get('/users')
await post('/users', form)
await put('/users/1', form)
await del('/users/1')
```

## หลักการลดโค้ด

- ใช้ `api.js` แทนการเขียน `fetch()` ซ้ำ
- ใช้ `loadAll()` โหลดข้อมูลของหน้าปัจจุบัน
- ใช้ `editId` ร่วมกันสำหรับฟอร์มเพิ่ม/แก้ไข
- ใช้ `message()` และ `fail()` แสดงผลสำเร็จ/ผิดพลาด
- อย่าลบการตรวจสิทธิ์ใน Backend เพื่อให้โค้ดสั้นลง
