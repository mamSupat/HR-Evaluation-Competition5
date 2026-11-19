# Frontend Quick Map

## ไฟล์ที่ควรรู้

| ไฟล์ | หน้าที่ | จำสั้น ๆ |
|---|---|---|
| `main.js` | เริ่ม Vue | createApp → router → mount |
| `App.vue` | จุดแสดงหน้าตาม URL | RouterView |
| `router.js` | URL และ Role | path + component + meta |
| `api.js` | ติดต่อ Backend | GET / POST / PUT / DELETE |
| `Page.vue` | หน้าจอและเหตุการณ์ | template + state + functions |
| `style.css` | รูปแบบหน้าตา | สี / ระยะ / ตาราง / ฟอร์ม |

## Page.vue แบ่งเป็น 3 ส่วน

1. `<template>` — สิ่งที่ผู้ใช้เห็นและปุ่มที่กด
2. `<script setup>` — ตัวแปรและฟังก์ชันทำงาน
3. `watch()` — โหลดข้อมูลเมื่อเปลี่ยนหน้า

## ตัวแปรที่พบเป็นประจำ

- `ref()` — เก็บค่าที่เปลี่ยนได้ เช่น รายการข้อมูล
- `reactive()` — เก็บข้อมูลฟอร์มหลายช่อง
- `computed()` — คำนวณค่าที่แสดง เช่น ชื่อหน้า
- `props` — รับชื่อหน้าจาก Router

## จำเส้นทางข้อมูล

`ปุ่ม @click → function → api.js → /api/... → server.js → MySQL`

## คำสั่ง API

| งาน | คำสั่ง |
|---|---|
| อ่าน | `get('/users')` |
| เพิ่ม | `post('/users', form)` |
| แก้ไข | `put('/users/1', form)` |
| ลบ | `del('/users/1')` |

หมายเหตุ: Endpoint บางรายการใช้การปิดใช้งานแทนการลบจริง ให้ดูวิธีที่ API กำหนดไว้
