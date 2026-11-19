# แผนแบ่งงานและจำโค้ดสำหรับทีม 3 คน

เป้าหมาย: ไม่ให้คนใดคนหนึ่งท่องจำทุกไฟล์ แต่ให้แต่ละคนเข้าใจส่วนที่รับผิดชอบและอธิบายการเชื่อมต่อระหว่างส่วนได้

## คนที่ 1 — Frontend

จำแนวคิด 5 เรื่อง ไม่ต้องท่อง Page.vue ทั้งไฟล์

1. `main.js` เริ่มต้น Vue และติดตั้ง Router
2. `router.js` กำหนด URL และ Role ที่เข้าได้
3. `api.js` เป็นตัวกลางเรียก Backend
4. `Page.vue` แสดงหน้าจอและเรียกฟังก์ชันตามปุ่ม
5. `style.css` กำหนดหน้าตา

### โครงสร้างที่ต้องเขียนได้จากความเข้าใจ

```js
// main.js
createApp(App).use(router).mount('#app')
```

```js
// router.js
{ path: '/admin/staff', component: Page,
  props: { page: 'admin-staff' },
  meta: { auth: true, role: 'admin' } }
```

```js
// api.js — รูปแบบเรียก API
export const get = path => api(path)
export const post = (path, data) => api(path, {
  method: 'POST', body: JSON.stringify(data)
})
export const put = (path, data) => api(path, {
  method: 'PUT', body: JSON.stringify(data)
})
export const del = path => api(path, { method: 'DELETE' })
```

### รูปแบบใน Page.vue ที่ใช้ซ้ำ

```js
// โหลดข้อมูล
async function loadUsers() {
  users.value = await get('/users')
}

// เพิ่มข้อมูล
async function addUser() {
  await post('/users', userForm)
  await loadUsers()
}

// แก้ไขข้อมูล
async function updateUser(id) {
  await put(`/users/${id}`, userForm)
  await loadUsers()
}

// ลบ/ปิดใช้งานข้อมูล
async function removeUser(id) {
  await put(`/users/${id}`, { status: 'inactive' })
  await loadUsers()
}
```

> ตัวอย่างเป็นแม่แบบสำหรับจำหลักการ ไม่ใช่คำสั่งให้แทนที่ฟังก์ชันจริงในระบบโดยไม่ตรวจสอบ API

### ลำดับการอธิบายหน้าเว็บ

`ผู้ใช้กดปุ่ม → ฟังก์ชันใน Page.vue → api.js → Backend → Database → ส่งผลกลับมาแสดงบนหน้าเว็บ`

## คนที่ 2 — Backend

จำแนวคิด 5 เรื่อง

1. `server.js` สร้าง Express Server และ API
2. `db.js`/การตั้งค่า Pool เชื่อมต่อ MySQL (ในรุ่นนี้ Pool อยู่ใน `server.js`)
3. `auth()` ตรวจสอบ JWT และสถานะบัญชี
4. `allow()` ตรวจสอบ Role
5. SQL ใช้ `SELECT`, `INSERT`, `UPDATE`, `DELETE`

### รูปแบบ API ที่ต้องจำ

```js
app.get('/api/items', auth, allow('admin'), run(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM ITEM')
  ok(res, rows)
}))
```

```js
app.post('/api/items', auth, allow('admin'), run(async (req, res) => {
  const { name } = req.body
  await pool.execute('INSERT INTO ITEM(name) VALUES (?)', [name])
  ok(res, null, 'เพิ่มข้อมูลสำเร็จ')
}))
```

ใช้ `?` และส่งค่าผ่าน parameter เสมอ ห้ามนำข้อความจากผู้ใช้มาต่อเป็น SQL โดยตรง

## คนที่ 3 — ผังงานและเอกสาร

ไม่จำเป็นต้องจำโค้ด Frontend/Backend แต่ต้องอธิบาย Flow ให้ตรงกับระบบจริง

1. System Overview: ผู้ใช้ → Frontend → API/Backend → MySQL
2. Login: กรอกข้อมูล → ตรวจสอบ → ถูกต้องหรือไม่ → แยก Role → Dashboard
3. Admin: จัดการบุคลากร → รอบประเมิน → หัวข้อ/ตัวชี้วัด → มอบหมาย
4. Evaluatee: เปิดแบบประเมิน → กรอกคะแนน/รายละเอียด → แนบหลักฐาน → ส่งผล
5. Evaluator: เปิดงานที่ได้รับมอบหมาย → ตรวจสอบ → ให้คะแนน/ความเห็น → ยืนยัน
6. Class Diagram: ใช้ 9 คลาสตาม `CLASS-DIAGRAM.md`

ทุกผังงานต้องตรงกับการทำงานที่ทดสอบได้ ห้ามวาดขั้นตอนที่ระบบยังไม่มี

## การซ้อมร่วมกัน

- คน Frontend อธิบายว่าแต่ละปุ่มเรียก API ใด
- คน Backend อธิบายว่า API ตรวจสิทธิ์และแก้ไขตารางใด
- คนผังงานอธิบายเส้นทางข้อมูลตั้งแต่ผู้ใช้เริ่มจนจบ
- ซ้อมตอบคำถามโดยให้แต่ละคนอธิบายภาพรวมของอีกสองส่วนได้อย่างน้อยระดับแนวคิด

## ข้อควรจำ

- ไม่ควรตั้งเป้าจำทุกบรรทัดของ `Page.vue` หรือ `server.js`
- ให้จำโครงสร้าง คำสั่งหลัก และรูปแบบซ้ำ แล้วฝึกเขียนจากโจทย์
- ห้ามลดความปลอดภัยเพื่อให้โค้ดสั้น เช่น ลบ `auth`, `allow`, validation หรือ SQL parameters
- จำนวนบรรทัดไม่ใช่หลักฐานว่าระบบครบเกณฑ์ ต้องทดสอบทุกฟังก์ชันจริง
