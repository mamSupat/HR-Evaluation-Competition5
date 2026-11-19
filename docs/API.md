# API Quick Reference

ทุก Endpoint ต่อไปนี้อยู่ใต้ `/api` ยกเว้น Login และ Health ต้องส่ง Header `Authorization: Bearer <token>`

| Method | Path | Role | การทำงาน |
|---|---|---|---|
| GET | `/health` | Public | ตรวจ API/DB |
| POST | `/auth/login` | Public | เข้าสู่ระบบ |
| GET | `/auth/me` | ทุกบทบาท | ตรวจบัญชีปัจจุบัน |
| PUT | `/auth/password` | ทุกบทบาท | เปลี่ยนรหัสผ่าน |
| GET | `/dashboard` | ทุกบทบาท | ข้อมูลสรุป |
| GET/POST/PUT | `/users` | Admin | ดู/เพิ่ม/แก้ไขบุคลากร |
| POST | `/users/:id/reset-password` | Admin | รีเซ็ตรหัสผ่าน |
| GET/POST/PUT/DELETE | `/rounds` | ทุกคนอ่าน, Admin เขียน | CRUD รอบประเมิน |
| GET/POST/PUT/DELETE | `/topics` | ทุกคนอ่าน, Admin เขียน | CRUD หัวข้อ |
| GET/POST/PUT/DELETE | `/indicators` | ทุกคนอ่าน, Admin เขียน | CRUD ตัวชี้วัด |
| GET/POST | `/duties` | Admin จัดการ; Evaluator ดูรายการที่เกี่ยวข้อง | มอบหมายผู้รับการประเมิน |
| GET | `/duties/mine` | Evaluatee | รอบประเมินของตน |
| POST | `/duties/:id/assign` | Admin | มอบหมายกรรมการ |
| GET | `/assessments/mine` | ทุกบทบาท | แบบประเมินที่มอบหมายให้ตน |
| GET/POST | `/assessments/:id/scores` | เจ้าของแบบประเมิน/Admin | ดูและบันทึกคะแนน |
| GET/POST | `/scores/:id/details` | เจ้าของแบบประเมิน/Admin | รายละเอียดประกอบคะแนน |
| GET/POST | `/scores/:id/evidence` | เจ้าของแบบประเมิน/Admin/ผู้รับการประเมิน | ดู/แนบหลักฐาน |
| GET | `/evidence/:id/download` | ผู้เกี่ยวข้อง/Admin | ดาวน์โหลดหลักฐาน |
| POST | `/assessments/:id/submit` | เจ้าของแบบประเมิน/Admin | ยืนยันผล |
| GET | `/reports/summary` | Admin | รายงานสรุป |
| GET | `/reports/person/:id` | Admin หรือเจ้าของข้อมูล | รายงานรายบุคคล |
| GET | `/admin/backup` | Admin | ดาวน์โหลด SQL Backup |

## ตัวอย่าง Body

Login:

```json
{"username":"admin","password":"admin123"}
```

เพิ่มบุคลากร:

```json
{"username":"staff02","password":"123456","full_name":"ชื่อ นามสกุล","department":"ฝ่ายงาน","position":"ตำแหน่ง","role":"evaluatee"}
```

เพิ่มรอบประเมิน:

```json
{"title":"รอบประเมิน 2569","start_date":"2026-01-01","end_date":"2026-12-31","status":"open"}
```

บันทึกคะแนน:

```json
{"indicator_id":1,"score_value":4,"comment":"ผลการปฏิบัติงานตามเป้าหมาย"}
```

ยืนยันผล:

```json
{"overall_comment":"สรุปผลการประเมิน","signature_path":"ชื่อผู้ประเมิน"}
```

Response ปกติใช้รูปแบบ `{ "status": "success", "message": "...", "data": ... }`; Error ใช้ HTTP Status และ `{ "status": "error", "message": "..." }`.
