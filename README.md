# HR Evaluation Platform — Competition Edition v0.3

ระบบประเมินผลการปฏิบัติงานบุคลากร ตัวอย่างสำหรับฝึกแข่งขัน พัฒนาด้วย Vue 3 + Vite, Node.js + Express และ MySQL โดยตั้งใจใช้โครงสร้างตรงไปตรงมา: หน้าเว็บเรียก API, API ตรวจสิทธิ์ แล้วอ่าน/บันทึกข้อมูลใน MySQL

> ใช้ข้อมูลตัวอย่างสำหรับฝึกเท่านั้น ก่อนใช้งานกับข้อมูลบุคลากรจริงให้เปลี่ยนรหัสผ่านทุกบัญชีและ JWT_SECRET

## 1. โครงสร้าง

```text
HR-Evaluation-Competition/
├── backend/
│   ├── server.js       # API, Login, JWT, CRUD, คะแนน, หลักฐาน, รายงาน
│   ├── seed.js         # สร้างบัญชีและข้อมูลตัวอย่าง
│   └── .env.example    # ค่าการเชื่อมต่อฐานข้อมูล
├── frontend/
│   └── src/
│       ├── router.js   # เส้นทางและตรวจสิทธิ์
│       ├── api.js      # ฟังก์ชันเรียก API
│       └── views/      # หน้าจอและตารางข้อมูล
├── database/schema.sql
├── docs/               # Flow, API และ Class Diagram
└── uploads/            # ไฟล์หลักฐานที่อัปโหลด
```

## 2. เตรียม MySQL ด้วย Docker

1. เปิด Docker Desktop และ Start Container MySQL (พอร์ต `3306`) กับ phpMyAdmin (พอร์ต `8080`)
2. เปิด `http://localhost:8080`
3. Import ไฟล์ `database/schema.sql` เพื่อสร้างฐานข้อมูล `hr_evaluation` และ 9 ตาราง
4. ถ้ามีฐานข้อมูล `hr_evaluation` อยู่แล้ว ให้สำรองข้อมูลก่อน Import ซ้ำ

## 3. ตั้งค่าและเปิด Backend

เปิด Terminal ที่โฟลเดอร์ `backend`:

```bash
npm install
cp .env.example .env
```

บน Windows PowerShell ใช้ `Copy-Item .env.example .env` แทน `cp` ได้

แก้ `.env` ให้ตรงกับ MySQL ในเครื่อง:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=รหัสผ่าน_MySQL
DB_NAME=hr_evaluation
JWT_SECRET=เปลี่ยนเป็นข้อความลับที่ยาวและเดายาก
FRONTEND_URL=http://localhost:5173
```

จากนั้นรัน:

```bash
npm run seed
npm run dev
```

ทดสอบ API ได้ที่ `http://localhost:3000/api/health`

## 4. เปิด Frontend

เปิด Terminal ใหม่ที่โฟลเดอร์ `frontend`:

```bash
npm install
npm run dev
```

เปิด `http://localhost:5173` ระบบจะแสดงหน้า Login ทันที

## 5. บัญชีทดสอบ

| บทบาท | Username | Password |
|---|---|---|
| ผู้ดูแลระบบ | `admin` | `admin123` |
| ผู้รับการประเมิน | `employee01` | `emp123` |
| กรรมการ | `committee01` | `com123` |

`npm run seed` สร้างข้อมูลตัวอย่างหนึ่งรอบ หนึ่งหัวข้อ หนึ่งตัวชี้วัด และรายการประเมินตนเอง/กรรมการ หากมีข้อมูลอยู่แล้วจะไม่สร้างรายการซ้ำ

## 6. ความสามารถใน v0.3

### ผู้ดูแลระบบ
- Dashboard สรุปจำนวนบุคลากร รอบประเมิน งานที่มอบหมาย และแบบประเมินที่ส่งแล้ว
- เพิ่ม/แก้ไข/ปิดใช้งานบัญชีบุคลากร และรีเซ็ตรหัสผ่าน
- เพิ่ม/แก้ไข/ลบรอบประเมิน
- เพิ่ม/แก้ไข/ลบหัวข้อและตัวชี้วัด กำหนดน้ำหนัก ประเภทคะแนน และการบังคับแนบหลักฐาน
- มอบหมายผู้รับการประเมินให้รอบ และมอบหมายกรรมการ
- ดูรายงานสรุป พิมพ์หรือบันทึกเป็น PDF ผ่านหน้าต่าง Print ของเบราว์เซอร์
- ดาวน์โหลด SQL Backup หากเครื่อง Backend มี `mysqldump`; หากไม่มีให้ใช้ Export ใน phpMyAdmin

### ผู้รับการประเมินและกรรมการ
- ดูรายการประเมินที่ตนได้รับมอบหมาย
- บันทึกคะแนนและความคิดเห็นรายตัวชี้วัด
- เพิ่มรายละเอียดประกอบคะแนน
- แนบ PDF/JPG/PNG ขนาดไม่เกิน 5 MB และดาวน์โหลดหลักฐาน
- พิมพ์ชื่อเพื่อยืนยันผลการประเมิน
- ระบบไม่ให้ยืนยันจนกว่าจะกรอกคะแนนครบ และแนบหลักฐานครบในตัวชี้วัดที่บังคับ
- เมื่อส่งแล้วจะล็อกไม่ให้แก้ไขรายการนั้น

## 7. สิทธิ์และความปลอดภัย

- `/` เปลี่ยนไปหน้า `/login`; ไม่มีหน้า Demo สาธารณะ
- Frontend ตรวจ Session กับ `/api/auth/me` และตรวจ Role ก่อนเปิดหน้า
- ทุก API ที่เกี่ยวกับข้อมูลต้องผ่าน JWT; Backend ตรวจสถานะและบทบาทจากฐานข้อมูลทุกคำขอ
- ผู้ใช้ดูและแก้ไขแบบประเมินได้เฉพาะรายการที่ตนได้รับมอบหมาย ยกเว้นผู้ดูแลระบบ
- รหัสผ่านเก็บเป็น bcrypt hash; Token หมดอายุใน 8 ชั่วโมง
- Logout ล้าง Token และข้อมูลผู้ใช้

## 8. ทดสอบตามลำดับ

1. Login ด้วยบัญชีทั้ง 3 บทบาท และตรวจว่าเข้า Dashboard ถูกต้อง
2. ผู้ดูแลเพิ่มบุคลากร กำหนดรอบ หัวข้อ และตัวชี้วัด
3. มอบหมายผู้รับการประเมินและกรรมการ
4. Login เป็นผู้รับการประเมิน บันทึกคะแนน เพิ่มรายละเอียด และแนบหลักฐาน
5. Login เป็นกรรมการ ทำรายการเดียวกันและยืนยันผล
6. ตรวจรายงานด้วยบัญชีผู้ดูแล และลอง Print / Save as PDF
7. ทดสอบเปิด URL ของบทบาทอื่นโดยตรง ต้องถูกส่งกลับหน้า Dashboard ตามสิทธิ์
8. ทดสอบ API ที่ไม่มี Token ต้องได้ 401 และใช้ Role ผิดต้องได้ 403

## 9. เอกสารประกอบการแข่งขัน

- `docs/FLOWS.md` แผนภาพ Flow ของ Login, Admin และการประเมิน
- `docs/CLASS-DIAGRAM.md` Class Diagram 9 คลาส พร้อม Attributes/Methods/Relationships
- `docs/API.md` รายการ Endpoint, Role และตัวอย่าง Request/Response
- `docs/RUBRIC-CHECKLIST.md` Checklist สำหรับทดสอบตามเกณฑ์สนาม

## 10. ข้อจำกัดที่ต้องทราบ

- ระบบนี้เป็นรุ่นฝึกแข่งขัน ไม่ใช่ระบบ HR production; ควรทดสอบบนเครื่องและ MySQL ที่จะใช้แข่งก่อนวันจริง
- รายงาน PDF ใช้ Print ของเบราว์เซอร์ ไม่ได้สร้างไฟล์ PDF ฝั่งเซิร์ฟเวอร์
- Backup API ต้องมี `mysqldump`; การ Restore ให้ใช้ Import ผ่าน phpMyAdmin
- ลายเซ็นในรุ่นนี้เป็นการพิมพ์ชื่อยืนยัน ไม่ใช่ลายเซ็นดิจิทัลที่มีใบรับรอง
- ยังต้องทดสอบ Integration กับฐานข้อมูลจริง, LAN, เครื่องแข่งขัน และ rubric ของสนามทุกข้อก่อนถือว่าพร้อมแข่งขัน



## คู่มือการเตรียมเครื่องมือและติดตั้ง Framework สำหรับการแข่งขัน

เอกสารฉบับนี้จัดทำขึ้นเพื่อแนะนำการเตรียมความพร้อมด้านเครื่องมือและการติดตั้ง Framework สำหรับพัฒนาระบบประเมินบุคลากร โดยใช้ Vue 3, Vite, Node.js, Express.js และ MySQL

---

## 1. เครื่องมือที่ต้องติดตั้งก่อนเริ่มพัฒนา

ติดตั้งโปรแกรมต่อไปนี้ให้เรียบร้อยก่อนวันแข่งขัน

| โปรแกรม | รายละเอียด | ดาวน์โหลด |
|---|---|---|
| Node.js (LTS) | ใช้รัน JavaScript และจัดการแพ็กเกจ | https://nodejs.org/ |
| Visual Studio Code | โปรแกรมสำหรับเขียนโค้ด | https://code.visualstudio.com/ |
| Docker Desktop | ใช้จัดการ Container | https://www.docker.com/products/docker-desktop/ |
| Git | ใช้จัดการ Source Code | https://git-scm.com/ |

### ตรวจสอบการติดตั้ง

เปิด Terminal หรือ Command Prompt แล้วใช้คำสั่ง

```bash
node -v
npm -v
git --version
docker --version
```

หากแสดงหมายเลขเวอร์ชัน แสดงว่าติดตั้งเครื่องมือเรียบร้อยแล้ว

---

## 2. เทคโนโลยีที่ใช้ในการพัฒนา

### 2.1 Frontend

- Vue 3 : JavaScript Framework สำหรับพัฒนาส่วนติดต่อผู้ใช้งาน
- Vite : เครื่องมือสร้างและรันโปรเจกต์
- Vue Router : ใช้จัดการเส้นทางและเปลี่ยนหน้าเว็บไซต์

### 2.2 Backend

- Node.js : Runtime สำหรับประมวลผล JavaScript
- Express.js : Framework สำหรับพัฒนา REST API
- MySQL2 : ใช้เชื่อมต่อฐานข้อมูล MySQL
- CORS : จัดการการเข้าถึง API จาก Frontend
- dotenv : จัดการค่าการตั้งค่าผ่านไฟล์ .env
- JSON Web Token (JWT) : ใช้ตรวจสอบสิทธิ์การเข้าใช้งาน
- bcryptjs : ใช้เข้ารหัสรหัสผ่าน
- Multer : ใช้จัดการการอัปโหลดไฟล์

### 2.3 Database

- MySQL 8.4 : ระบบจัดการฐานข้อมูล
- phpMyAdmin : เครื่องมือจัดการฐานข้อมูลผ่าน Web Browser
- Docker : ใช้สร้างและจัดการ Container สำหรับ MySQL

---

## 3. การสร้างโปรเจกต์ Frontend

เปิด Terminal ในโฟลเดอร์ที่ต้องการจัดเก็บโปรเจกต์

### ขั้นตอนที่ 1 สร้างโปรเจกต์ Vue 3 ด้วย Vite

```bash
npm create vite@latest frontend -- --template vue
```

### ขั้นตอนที่ 2 เข้าไปยังโฟลเดอร์ Frontend

```bash
cd frontend
```

### ขั้นตอนที่ 3 ติดตั้ง Dependencies

```bash
npm install
```

### ขั้นตอนที่ 4 ติดตั้ง Vue Router

```bash
npm install vue-router
```

### ขั้นตอนที่ 5 เริ่มต้นใช้งาน Frontend

```bash
npm run dev
```

เมื่อเริ่มต้นสำเร็จ Vite จะแสดง URL สำหรับเปิดเว็บไซต์ โดยปกติคือ

```text
http://localhost:5173
```

---

## 4. การสร้างโปรเจกต์ Backend

เปิด Terminal อีกหน้าต่างหนึ่ง และกลับไปยังโฟลเดอร์หลักของโปรเจกต์

### ขั้นตอนที่ 1 สร้างโฟลเดอร์ Backend

```bash
mkdir backend
cd backend
```

### ขั้นตอนที่ 2 สร้าง Node.js Project

```bash
npm init -y
```

### ขั้นตอนที่ 3 ติดตั้ง Express และ Library ที่จำเป็น

```bash
npm install express mysql2 cors dotenv jsonwebtoken bcryptjs multer
```

### ขั้นตอนที่ 4 สร้างไฟล์สำหรับพัฒนา Backend

สร้างไฟล์ต่อไปนี้ภายในโฟลเดอร์ backend

```text
backend/
├── server.js
├── seed.js
├── .env
└── package.json
```

### ขั้นตอนที่ 5 เริ่มต้นใช้งาน Backend

```bash
node server.js
```

Backend จะทำงานตาม Port ที่กำหนดไว้ในไฟล์ .env

---

## 5. การเตรียมฐานข้อมูล MySQL ด้วย Docker

ตรวจสอบว่า Docker Desktop เปิดใช้งานอยู่

### ขั้นตอนที่ 1 ดาวน์โหลด MySQL Image และสร้าง Container

```bash
docker run --name mysql -e MYSQL_ROOT_PASSWORD=1234 -p 3306:3306 -d mysql:8.4
```

### ขั้นตอนที่ 2 ตรวจสอบ Container

```bash
docker ps
```

### ขั้นตอนที่ 3 สร้างฐานข้อมูล

เข้าใช้งาน MySQL ผ่าน phpMyAdmin หรือ MySQL Client แล้วสร้างฐานข้อมูลด้วยคำสั่ง

```sql
CREATE DATABASE hr_evaluation;
```

จากนั้นเลือกฐานข้อมูล

```sql
USE hr_evaluation;
```

### ขั้นตอนที่ 4 สร้างตาราง

สร้างตารางตามโครงสร้างฐานข้อมูลของระบบ โดยประกอบด้วย

1. USER
2. ROUND
3. TOPIC
4. DUTIES
5. INDICATOR
6. ASSESSMENT
7. SCORE
8. SCORE_DETAIL
9. EVIDENCE

---

## 6. การเชื่อมต่อ Backend กับ MySQL

สร้างไฟล์ `.env` ภายในโฟลเดอร์ backend และกำหนดค่าการเชื่อมต่อฐานข้อมูล

```env
PORT=3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=1234
DB_NAME=hr_evaluation

JWT_SECRET=hr_evaluation_secret

FRONTEND_URL=http://localhost:5173
```

หมายเหตุ: ต้องกำหนดค่ารหัสผ่านให้ตรงกับ MySQL ที่สร้างไว้จริง และไม่ควรนำไฟล์ `.env` ที่มีข้อมูลลับขึ้น GitHub

---

## 7. โครงสร้างโปรเจกต์

```text
HR-Evaluation/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router.js
│   │   └── api.js
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── seed.js
│   ├── .env
│   └── package.json
│
└── database/
    └── schema.sql
```

---

## 8. คำสั่งที่ใช้ในการเริ่มต้นระบบ

เปิด Terminal แยกเป็น 2 หน้าต่าง

**Terminal 1 : Frontend**

```bash
cd frontend
npm run dev
```

**Terminal 2 : Backend**

```bash
cd backend
node server.js
```

**Database : MySQL**

ตรวจสอบสถานะ Container

```bash
docker ps
```

หาก Container หยุดทำงาน ให้เปิดด้วยคำสั่ง

```bash
docker start mysql
```

---

## 9. ข้อควรจำก่อนการแข่งขัน

1. ติดตั้ง Node.js, npm, Docker Desktop และโปรแกรมที่จำเป็นให้เรียบร้อยก่อนวันแข่งขัน
2. ตรวจสอบเวอร์ชันของเครื่องมือก่อนเริ่มพัฒนา
3. สร้าง Frontend และ Backend แยกออกจากกัน
4. ติดตั้ง Library ให้ครบตามคำสั่งที่กำหนด
5. เตรียมโครงสร้างฐานข้อมูลและตรวจสอบการเชื่อมต่อ MySQL
6. ทดสอบการทำงานของ Frontend และ Backend ก่อนเริ่มพัฒนาระบบจริง
7. ไม่ควรเผยแพร่ไฟล์ .env หรือข้อมูลรหัสผ่านลงใน GitHub

---

**หมายเหตุ:** คู่มือนี้เป็นแนวทางการเตรียมสภาพแวดล้อมสำหรับเริ่มพัฒนาระบบ โดยผู้พัฒนาต้องสร้างไฟล์และเขียนโค้ดของแต่ละส่วนเพิ่มเติมตามข้อกำหนดของระบบประเมินบุคลากร
