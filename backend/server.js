import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT || 3000)
const SECRET = process.env.JWT_SECRET || 'development-secret-change-before-contest'
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_evaluation', waitForConnections: true, connectionLimit: 10
})
const uploadDir = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })
app.use(cors({ origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','), credentials: true }))
app.use(express.json({ limit: '2mb' }))
const run = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const ok = (res, data, message = 'สำเร็จ') => res.json({ status: 'success', message, data })
const bad = (res, message, code = 400) => res.status(code).json({ status: 'error', message })
const id = value => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null
const roles = ['admin', 'evaluatee', 'evaluator']
async function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  try {
    const payload = jwt.verify(token, SECRET)
    const [[account]] = await pool.execute("SELECT role,status,must_change_password FROM `USER` WHERE user_id=?", [payload.id])
    if (!account || account.status !== 'active') return bad(res, 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ', 401)
    req.user = { ...payload, role: account.role, must_change_password: Boolean(account.must_change_password) }
    next()
  } catch { return bad(res, 'กรุณาเข้าสู่ระบบใหม่', 401) }
}
function allow(...allowed) {
  return (req, res, next) => allowed.includes(req.user.role) ? next() : bad(res, 'ไม่มีสิทธิ์ใช้งานส่วนนี้', 403)
}
async function ownsAssessment(assessmentId, user, connection = pool) {
  const [[row]] = await connection.execute('SELECT * FROM ASSESSMENT WHERE assessment_id=?', [assessmentId])
  return row && (user.role === 'admin' || row.evaluator_id === user.id) ? row : null
}
app.get('/api/health', run(async (_req, res) => { await pool.query('SELECT 1'); ok(res, { api: 'running', database: 'connected' }) }))
// Login and account
app.post('/api/auth/login', run(async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return bad(res, 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
  const [rows] = await pool.execute("SELECT user_id,username,password,full_name,role,must_change_password FROM `USER` WHERE username=? AND status='active' LIMIT 1", [String(username).trim()])
  const user = rows[0]
  if (!user || !(await bcrypt.compare(String(password), user.password))) return bad(res, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 401)
  const payload = { id: user.user_id, username: user.username, full_name: user.full_name, role: user.role }
  ok(res, { token: jwt.sign(payload, SECRET, { expiresIn: '8h' }), user: payload, must_change_password: Boolean(user.must_change_password) }, 'เข้าสู่ระบบสำเร็จ')
}))
app.get('/api/auth/me', auth, run(async (req, res) => {
  const [[u]] = await pool.execute('SELECT user_id,username,full_name,email,phone,department,position,role,must_change_password FROM `USER` WHERE user_id=? AND status=\'active\'', [req.user.id])
  if (!u) return bad(res, 'ไม่พบบัญชีผู้ใช้', 401)
  ok(res, { ...u, id: u.user_id, must_change_password: Boolean(u.must_change_password) })
}))
app.put('/api/auth/password', auth, run(async (req, res) => {
  const { old_password, new_password } = req.body || {}
  if (!old_password || !new_password || String(new_password).length < 6) return bad(res, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
  const [[u]] = await pool.execute('SELECT password FROM `USER` WHERE user_id=?', [req.user.id])
  if (!u || !(await bcrypt.compare(String(old_password), u.password))) return bad(res, 'รหัสผ่านเดิมไม่ถูกต้อง', 401)
  await pool.execute('UPDATE `USER` SET password=?,must_change_password=0 WHERE user_id=?', [await bcrypt.hash(String(new_password), 10), req.user.id])
  ok(res, null, 'เปลี่ยนรหัสผ่านแล้ว')
}))
// Dashboard
app.get('/api/dashboard', auth, run(async (req, res) => {
  const [[users]] = await pool.query("SELECT COUNT(*) total FROM `USER` WHERE role='evaluatee' AND status='active'")
  const [[rounds]] = await pool.query("SELECT COUNT(*) total FROM ROUND WHERE status='open'")
  const [[duties]] = await pool.query('SELECT COUNT(*) total FROM DUTIES')
  const [[submitted]] = await pool.query("SELECT COUNT(*) total FROM ASSESSMENT WHERE status='SUBMITTED'")
  const [[mine]] = await pool.execute('SELECT COUNT(*) total FROM ASSESSMENT WHERE evaluator_id=?', [req.user.id])
  ok(res, { users: users.total, rounds: rounds.total, duties: duties.total, submitted: submitted.total, mine: mine.total, role: req.user.role })
}))
// Personnel CRUD
app.get('/api/users', auth, allow('admin'), run(async (_req, res) => {
  const [rows] = await pool.query('SELECT user_id,username,full_name,email,phone,department,position,role,status,must_change_password FROM `USER` ORDER BY user_id DESC')
  ok(res, rows)
}))
app.post('/api/users', auth, allow('admin'), run(async (req, res) => {
  const b = req.body || {}
  if (!b.username || !b.password || String(b.password).length < 6 || !b.full_name || !roles.includes(b.role)) return bad(res, 'กรุณากรอกชื่อผู้ใช้ รหัสผ่านอย่างน้อย 6 ตัว ชื่อ และบทบาทให้ครบ')
  const [r] = await pool.execute('INSERT INTO `USER` (username,password,full_name,email,phone,department,position,role) VALUES (?,?,?,?,?,?,?,?)', [String(b.username).trim(), await bcrypt.hash(String(b.password), 10), b.full_name, b.email || null, b.phone || null, b.department || null, b.position || null, b.role])
  ok(res, { user_id: r.insertId }, 'เพิ่มบุคลากรแล้ว')
}))
app.put('/api/users/:id', auth, allow('admin'), run(async (req, res) => {
  const uid = id(req.params.id), b = req.body || {}
  if (!uid || !b.full_name || !roles.includes(b.role) || !['active', 'inactive'].includes(b.status || 'active')) return bad(res, 'ข้อมูลไม่ถูกต้อง')
  if (uid === req.user.id && (b.role !== 'admin' || b.status === 'inactive')) return bad(res, 'ไม่สามารถปิดใช้งานหรือลดสิทธิ์บัญชีที่กำลังใช้งานได้')
  const [r] = await pool.execute('UPDATE `USER` SET full_name=?,email=?,phone=?,department=?,position=?,role=?,status=? WHERE user_id=?', [b.full_name,b.email || null,b.phone || null,b.department || null,b.position || null,b.role,b.status || 'active',uid])
  if (!r.affectedRows) return bad(res, 'ไม่พบผู้ใช้', 404)
  ok(res, null, 'แก้ไขข้อมูลแล้ว')
}))
app.post('/api/users/:id/reset-password', auth, allow('admin'), run(async (req, res) => {
  const uid = id(req.params.id), temp = String(req.body?.password || '123456')
  if (!uid || temp.length < 6) return bad(res, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
  const [r] = await pool.execute('UPDATE `USER` SET password=?,must_change_password=1 WHERE user_id=?', [await bcrypt.hash(temp, 10), uid])
  if (!r.affectedRows) return bad(res, 'ไม่พบผู้ใช้', 404)
  ok(res, { temporary_password: temp }, 'รีเซ็ตรหัสผ่านแล้ว')
}))
// Evaluation rounds, topics and indicators
app.get('/api/rounds', auth, run(async (_req, res) => { const [r] = await pool.query('SELECT * FROM ROUND ORDER BY round_id DESC'); ok(res, r) }))
app.post('/api/rounds', auth, allow('admin'), run(async (req, res) => {
  const b=req.body||{}; if(!b.title||!b.start_date||!b.end_date||b.end_date<b.start_date)return bad(res,'กรุณากรอกชื่อและช่วงวันที่ให้ถูกต้อง')
  const [r]=await pool.execute('INSERT INTO ROUND(title,start_date,end_date,status) VALUES(?,?,?,?)',[b.title,b.start_date,b.end_date,b.status||'draft']);ok(res,{round_id:r.insertId},'เพิ่มรอบประเมินแล้ว')
}))
app.put('/api/rounds/:id', auth, allow('admin'), run(async (req,res)=>{const b=req.body||{};if(!id(req.params.id)||!b.title||!b.start_date||!b.end_date||b.end_date<b.start_date)return bad(res,'ข้อมูลรอบประเมินไม่ถูกต้อง');const [r]=await pool.execute('UPDATE ROUND SET title=?,start_date=?,end_date=?,status=? WHERE round_id=?',[b.title,b.start_date,b.end_date,b.status||'draft',id(req.params.id)]);if(!r.affectedRows)return bad(res,'ไม่พบรอบประเมิน',404);ok(res,null,'แก้ไขรอบประเมินแล้ว')}))
app.delete('/api/rounds/:id', auth, allow('admin'), run(async(req,res)=>{const [r]=await pool.execute('DELETE FROM ROUND WHERE round_id=?',[id(req.params.id)]);if(!r.affectedRows)return bad(res,'ไม่พบรอบประเมิน',404);ok(res,null,'ลบรอบประเมินแล้ว')}))
app.get('/api/topics', auth, run(async(_req,res)=>{const [r]=await pool.query('SELECT t.*,r.title round_title FROM TOPIC t JOIN ROUND r ON r.round_id=t.round_id ORDER BY t.topic_id DESC');ok(res,r)}))
app.post('/api/topics', auth, allow('admin'), run(async(req,res)=>{const b=req.body||{};if(!id(b.round_id)||!b.topic_name)return bad(res,'กรุณาเลือกรอบและกรอกชื่อหัวข้อ');const [r]=await pool.execute('INSERT INTO TOPIC(round_id,topic_name,description) VALUES(?,?,?)',[b.round_id,b.topic_name,b.description||null]);ok(res,{topic_id:r.insertId},'เพิ่มหัวข้อแล้ว')}))
app.put('/api/topics/:id', auth, allow('admin'), run(async(req,res)=>{const b=req.body||{};if(!id(req.params.id)||!id(b.round_id)||!b.topic_name)return bad(res,'ข้อมูลหัวข้อไม่ถูกต้อง');const [r]=await pool.execute('UPDATE TOPIC SET round_id=?,topic_name=?,description=? WHERE topic_id=?',[b.round_id,b.topic_name,b.description||null,id(req.params.id)]);if(!r.affectedRows)return bad(res,'ไม่พบหัวข้อ',404);ok(res,null,'แก้ไขหัวข้อแล้ว')}))
app.delete('/api/topics/:id', auth, allow('admin'), run(async(req,res)=>{const [r]=await pool.execute('DELETE FROM TOPIC WHERE topic_id=?',[id(req.params.id)]);if(!r.affectedRows)return bad(res,'ไม่พบหัวข้อ',404);ok(res,null,'ลบหัวข้อแล้ว')}))
app.get('/api/indicators', auth, run(async(_req,res)=>{const [r]=await pool.query('SELECT i.*,t.topic_name,t.round_id FROM INDICATOR i JOIN TOPIC t ON t.topic_id=i.topic_id ORDER BY i.indicator_id DESC');ok(res,r)}))
app.post('/api/indicators', auth, allow('admin'), run(async(req,res)=>{const b=req.body||{};if(!id(b.topic_id)||!b.indicator_name||!['BOOLEAN','RATING'].includes(b.evaluation_type)||Number(b.weight)<=0)return bad(res,'ข้อมูลตัวชี้วัดไม่ครบหรือไม่ถูกต้อง');const [r]=await pool.execute('INSERT INTO INDICATOR(topic_id,indicator_name,description,weight,evaluation_type,evidence_required,status) VALUES(?,?,?,?,?,?,?)',[b.topic_id,b.indicator_name,b.description||null,Number(b.weight),b.evaluation_type,!!b.evidence_required,b.status||'active']);ok(res,{indicator_id:r.insertId},'เพิ่มตัวชี้วัดแล้ว')}))
app.put('/api/indicators/:id', auth, allow('admin'), run(async(req,res)=>{const b=req.body||{};if(!id(req.params.id)||!id(b.topic_id)||!b.indicator_name||!['BOOLEAN','RATING'].includes(b.evaluation_type)||Number(b.weight)<=0)return bad(res,'ข้อมูลตัวชี้วัดไม่ถูกต้อง');const [r]=await pool.execute('UPDATE INDICATOR SET topic_id=?,indicator_name=?,description=?,weight=?,evaluation_type=?,evidence_required=?,status=? WHERE indicator_id=?',[b.topic_id,b.indicator_name,b.description||null,Number(b.weight),b.evaluation_type,!!b.evidence_required,b.status||'active',id(req.params.id)]);if(!r.affectedRows)return bad(res,'ไม่พบตัวชี้วัด',404);ok(res,null,'แก้ไขตัวชี้วัดแล้ว')}))
app.delete('/api/indicators/:id', auth, allow('admin'), run(async(req,res)=>{const [r]=await pool.execute('DELETE FROM INDICATOR WHERE indicator_id=?',[id(req.params.id)]);if(!r.affectedRows)return bad(res,'ไม่พบตัวชี้วัด',404);ok(res,null,'ลบตัวชี้วัดแล้ว')}))
// Assign staff to rounds and committees
app.get('/api/duties', auth, allow('admin','evaluator'), run(async(req,res)=>{
  let sql=`SELECT d.*,u.full_name,u.position,u.department,r.title round_title FROM DUTIES d JOIN \`USER\` u ON u.user_id=d.user_id JOIN ROUND r ON r.round_id=d.round_id`
  const args=[];if(req.user.role==='evaluator'){sql+=' JOIN ASSESSMENT a ON a.duty_id=d.duty_id WHERE a.evaluator_id=? AND a.assessment_type=\'COMMITTEE\'';args.push(req.user.id)}
  sql+=' ORDER BY d.duty_id DESC';const [rows]=await pool.execute(sql,args);ok(res,rows)
}))
app.get('/api/duties/mine', auth, allow('evaluatee'), run(async(req,res)=>{const [r]=await pool.execute('SELECT d.*,rd.title round_title FROM DUTIES d JOIN ROUND rd ON rd.round_id=d.round_id WHERE d.user_id=? ORDER BY d.duty_id DESC',[req.user.id]);ok(res,r)}))
app.post('/api/duties', auth, allow('admin'), run(async(req,res)=>{
  const b=req.body||{};if(!id(b.user_id)||!id(b.round_id))return bad(res,'กรุณาเลือกบุคลากรและรอบประเมิน')
  const [[u]] = await pool.execute("SELECT user_id FROM `USER` WHERE user_id=? AND role='evaluatee' AND status='active'",[b.user_id]);if(!u)return bad(res,'ไม่พบบุคลากรที่เปิดใช้งาน')
  const c=await pool.getConnection();try{await c.beginTransaction();const [r]=await c.execute('INSERT INTO DUTIES(user_id,round_id) VALUES(?,?)',[b.user_id,b.round_id]);await c.execute("INSERT INTO ASSESSMENT(duty_id,evaluator_id,assessment_type,status) VALUES(?,?,'SELF','PENDING')",[r.insertId,b.user_id]);await c.commit();ok(res,{duty_id:r.insertId},'มอบหมายผู้เข้ารับการประเมินแล้ว')}catch(e){await c.rollback();throw e}finally{c.release()}
}))
app.post('/api/duties/:id/assign', auth, allow('admin'), run(async(req,res)=>{
  const did=id(req.params.id),b=req.body||{};if(!did||!id(b.evaluator_id))return bad(res,'กรุณาเลือกกรรมการ')
  const [[u]]=await pool.execute("SELECT user_id FROM `USER` WHERE user_id=? AND role='evaluator' AND status='active'",[b.evaluator_id]);if(!u)return bad(res,'บัญชีที่เลือกไม่ใช่กรรมการที่เปิดใช้งาน')
  await pool.execute("INSERT INTO ASSESSMENT(duty_id,evaluator_id,assessment_type,committee_role,status) VALUES(?,?,'COMMITTEE',?,'PENDING')",[did,b.evaluator_id,b.committee_role||'COMMITTEE']);ok(res,null,'มอบหมายกรรมการแล้ว')
}))
// Assessments and scoring
app.get('/api/assessments/mine', auth, run(async(req,res)=>{
  const [r]=await pool.execute(`SELECT a.*,d.user_id,u.full_name evaluatee_name,u.department,rd.title round_title FROM ASSESSMENT a JOIN DUTIES d ON d.duty_id=a.duty_id JOIN \`USER\` u ON u.user_id=d.user_id JOIN ROUND rd ON rd.round_id=d.round_id WHERE a.evaluator_id=? ORDER BY a.assessment_id DESC`,[req.user.id]);ok(res,r)
}))
app.get('/api/assessments/:id/scores', auth, run(async(req,res)=>{
  const aid=id(req.params.id),a=await ownsAssessment(aid,req.user);if(!a)return bad(res,'ไม่มีสิทธิ์ดูแบบประเมินนี้',403)
  const [rows]=await pool.execute(`SELECT i.indicator_id,i.indicator_name,i.description,i.weight,i.evaluation_type,i.evidence_required,s.score_id,s.score_value,s.comment FROM INDICATOR i JOIN TOPIC t ON t.topic_id=i.topic_id JOIN DUTIES d ON d.round_id=t.round_id JOIN ASSESSMENT a ON a.duty_id=d.duty_id AND a.assessment_id=? LEFT JOIN SCORE s ON s.assessment_id=a.assessment_id AND s.indicator_id=i.indicator_id WHERE d.duty_id=a.duty_id AND i.status='active' ORDER BY t.topic_id,i.indicator_id`,[aid]);ok(res,rows)
}))
app.post('/api/assessments/:id/scores', auth, run(async(req,res)=>{
  const aid=id(req.params.id),b=req.body||{},a=await ownsAssessment(aid,req.user);if(!a)return bad(res,'ไม่มีสิทธิ์แก้ไขรายการนี้',403);if(a.status==='SUBMITTED')return bad(res,'รายการนี้ยืนยันแล้ว ไม่สามารถแก้ไขได้',409)
  const [[indicator]]=await pool.execute('SELECT i.* FROM INDICATOR i JOIN TOPIC t ON t.topic_id=i.topic_id JOIN DUTIES d ON d.round_id=t.round_id WHERE i.indicator_id=? AND d.duty_id=? AND i.status=\'active\'', [b.indicator_id,a.duty_id]);if(!indicator)return bad(res,'ตัวชี้วัดไม่อยู่ในรอบประเมินนี้')
  const score=Number(b.score_value);if(!Number.isFinite(score)||score<0||score>(indicator.evaluation_type==='BOOLEAN'?1:5))return bad(res,indicator.evaluation_type==='BOOLEAN'?'คะแนนต้องเป็น 0 หรือ 1':'คะแนนต้องอยู่ระหว่าง 0 ถึง 5')
  const [r]=await pool.execute('INSERT INTO SCORE(assessment_id,indicator_id,score_value,comment) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE score_value=VALUES(score_value),comment=VALUES(comment)',[aid,b.indicator_id,score,b.comment||null]);await pool.execute("UPDATE ASSESSMENT SET status='DRAFT' WHERE assessment_id=?",[aid]);ok(res,{score_id:r.insertId},'บันทึกคะแนนแล้ว')
}))
app.get('/api/scores/:id/details', auth, run(async(req,res)=>{const sid=id(req.params.id);const [[a]]=await pool.execute('SELECT a.evaluator_id FROM SCORE s JOIN ASSESSMENT a ON a.assessment_id=s.assessment_id WHERE s.score_id=?',[sid]);if(!a||req.user.role!=='admin'&&a.evaluator_id!==req.user.id)return bad(res,'ไม่มีสิทธิ์ดูรายละเอียด',403);const [r]=await pool.execute('SELECT * FROM SCORE_DETAIL WHERE score_id=? ORDER BY detail_id',[sid]);ok(res,r)}))
app.post('/api/scores/:id/details', auth, run(async(req,res)=>{const sid=id(req.params.id),text=String(req.body?.detail_text||'').trim();if(!sid||!text)return bad(res,'กรุณากรอกรายละเอียด');const [[a]]=await pool.execute('SELECT a.evaluator_id,a.status FROM SCORE s JOIN ASSESSMENT a ON a.assessment_id=s.assessment_id WHERE s.score_id=?',[sid]);if(!a||req.user.role!=='admin'&&a.evaluator_id!==req.user.id)return bad(res,'ไม่มีสิทธิ์แก้ไขรายการนี้',403);if(a.status==='SUBMITTED')return bad(res,'รายการยืนยันแล้ว',409);const [r]=await pool.execute('INSERT INTO SCORE_DETAIL(score_id,detail_text) VALUES(?,?)',[sid,text]);ok(res,{detail_id:r.insertId},'เพิ่มรายละเอียดแล้ว')}))
app.get('/api/scores/:id/evidence', auth, run(async(req,res)=>{const sid=id(req.params.id);const [[a]]=await pool.execute('SELECT a.evaluator_id,d.user_id FROM SCORE s JOIN ASSESSMENT a ON a.assessment_id=s.assessment_id JOIN DUTIES d ON d.duty_id=a.duty_id WHERE s.score_id=?',[sid]);if(!a||req.user.role!=='admin'&&req.user.id!==a.evaluator_id&&req.user.id!==a.user_id)return bad(res,'ไม่มีสิทธิ์ดูหลักฐาน',403);const [r]=await pool.execute('SELECT evidence_id,file_name,file_type,uploaded_at FROM EVIDENCE WHERE score_id=?',[sid]);ok(res,r)}))
const storage=multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadDir),filename:(_req,file,cb)=>cb(null,`${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')}`)})
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>cb(null,['application/pdf','image/png','image/jpeg'].includes(file.mimetype))})
app.post('/api/scores/:id/evidence', auth, upload.single('file'), run(async(req,res)=>{
  const sid=id(req.params.id);if(!req.file)return bad(res,'เลือกไฟล์ PDF, JPG หรือ PNG ขนาดไม่เกิน 5 MB')
  const [[a]]=await pool.execute('SELECT a.evaluator_id,a.status,d.user_id FROM SCORE s JOIN ASSESSMENT a ON a.assessment_id=s.assessment_id JOIN DUTIES d ON d.duty_id=a.duty_id WHERE s.score_id=?',[sid])
  if(!a||req.user.role!=='admin'&&req.user.id!==a.evaluator_id&&req.user.id!==a.user_id||a?.status==='SUBMITTED'){fs.unlinkSync(req.file.path);return bad(res,'ไม่มีสิทธิ์แนบหลักฐาน',403)}
  const [r]=await pool.execute('INSERT INTO EVIDENCE(score_id,file_name,file_path,file_type) VALUES(?,?,?,?)',[sid,req.file.originalname,`/uploads/${req.file.filename}`,req.file.mimetype]);ok(res,{evidence_id:r.insertId},'อัปโหลดหลักฐานแล้ว')
}))
app.get('/api/evidence/:id/download', auth, run(async(req,res)=>{
  const [[row]]=await pool.execute('SELECT e.file_name,e.file_path,a.evaluator_id,d.user_id FROM EVIDENCE e JOIN SCORE s ON s.score_id=e.score_id JOIN ASSESSMENT a ON a.assessment_id=s.assessment_id JOIN DUTIES d ON d.duty_id=a.duty_id WHERE e.evidence_id=?',[id(req.params.id)])
  if(!row)return bad(res,'ไม่พบไฟล์หลักฐาน',404);if(req.user.role!=='admin'&&req.user.id!==row.evaluator_id&&req.user.id!==row.user_id)return bad(res,'ไม่มีสิทธิ์ดาวน์โหลดไฟล์นี้',403)
  const file=path.join(uploadDir,path.basename(row.file_path));if(!fs.existsSync(file))return bad(res,'ไม่พบไฟล์บนเซิร์ฟเวอร์',404);res.download(file,row.file_name)
}))
app.post('/api/assessments/:id/submit', auth, run(async(req,res)=>{
  const aid=id(req.params.id),a=await ownsAssessment(aid,req.user);if(!a)return bad(res,'ไม่มีสิทธิ์ยืนยันแบบประเมิน',403);if(a.status==='SUBMITTED')return bad(res,'แบบประเมินนี้ยืนยันแล้ว',409)
  if(!String(req.body?.signature_path||'').trim())return bad(res,'กรุณาพิมพ์ชื่อเพื่อยืนยันผลการประเมิน')
  const [[total]]=await pool.execute(`SELECT COUNT(*) total,COUNT(s.score_id) filled,SUM(i.evidence_required=1 AND s.score_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM EVIDENCE e WHERE e.score_id=s.score_id)) missing_evidence FROM INDICATOR i JOIN TOPIC t ON t.topic_id=i.topic_id JOIN DUTIES d ON d.round_id=t.round_id LEFT JOIN SCORE s ON s.indicator_id=i.indicator_id AND s.assessment_id=? WHERE d.duty_id=? AND i.status='active'`,[aid,a.duty_id])
  if(!total.total||Number(total.total)!==Number(total.filled))return bad(res,'กรุณาบันทึกคะแนนให้ครบทุกตัวชี้วัดก่อนยืนยัน')
  if(Number(total.missing_evidence)>0)return bad(res,'กรุณาแนบหลักฐานให้ครบตามตัวชี้วัดที่กำหนด')
  await pool.execute("UPDATE ASSESSMENT SET overall_comment=?,signature_path=?,status='SUBMITTED',submitted_at=NOW() WHERE assessment_id=?",[req.body?.overall_comment||null,String(req.body.signature_path).trim(),aid]);const [[left]]=await pool.execute("SELECT COUNT(*) total FROM ASSESSMENT WHERE duty_id=? AND status<>'SUBMITTED'",[a.duty_id]);if(Number(left.total)===0)await pool.execute("UPDATE DUTIES SET status='completed' WHERE duty_id=?",[a.duty_id]);ok(res,null,'ยืนยันผลการประเมินแล้ว')
}))
// Reports
app.get('/api/reports/summary', auth, allow('admin'), run(async(_req,res)=>{
  const [r]=await pool.query(`SELECT d.duty_id,u.user_id,u.full_name,u.department,rd.title round_title,COUNT(DISTINCT a.assessment_id) assessment_count,COUNT(DISTINCT CASE WHEN a.status='SUBMITTED' THEN a.assessment_id END) submitted_count,ROUND(SUM(s.score_value*i.weight)/NULLIF(SUM(CASE WHEN s.score_value IS NOT NULL THEN i.weight ELSE 0 END),0),2) average_score FROM DUTIES d JOIN \`USER\` u ON u.user_id=d.user_id JOIN ROUND rd ON rd.round_id=d.round_id LEFT JOIN ASSESSMENT a ON a.duty_id=d.duty_id LEFT JOIN SCORE s ON s.assessment_id=a.assessment_id LEFT JOIN INDICATOR i ON i.indicator_id=s.indicator_id GROUP BY d.duty_id,u.user_id,u.full_name,u.department,rd.title ORDER BY u.full_name`);ok(res,r)
}))
app.get('/api/reports/person/:id', auth, run(async(req,res)=>{
  const uid=id(req.params.id);if(req.user.role!=='admin'&&req.user.id!==uid)return bad(res,'ไม่มีสิทธิ์ดูรายงานนี้',403)
  const [r]=await pool.execute(`SELECT u.full_name,u.position,u.department,rd.title round_title,a.assessment_type,a.status,a.overall_comment,s.score_value,s.comment,i.indicator_name,i.weight FROM DUTIES d JOIN \`USER\` u ON u.user_id=d.user_id JOIN ROUND rd ON rd.round_id=d.round_id JOIN ASSESSMENT a ON a.duty_id=d.duty_id LEFT JOIN SCORE s ON s.assessment_id=a.assessment_id LEFT JOIN INDICATOR i ON i.indicator_id=s.indicator_id WHERE u.user_id=? ORDER BY a.assessment_id,i.indicator_id`,[uid]);ok(res,r)
}))
app.get('/api/admin/backup', auth, allow('admin'), (req,res)=>{
  const file=path.join(__dirname,'backup.sql'),args=['-h',process.env.DB_HOST||'127.0.0.1','-P',String(process.env.DB_PORT||3306),'-u',process.env.DB_USER||'root',`--result-file=${file}`,process.env.DB_NAME||'hr_evaluation']
  execFile('mysqldump',args,{env:{...process.env,MYSQL_PWD:process.env.DB_PASSWORD||''}},err=>{if(err)return bad(res,'ไม่พบ mysqldump กรุณาใช้ Export ใน phpMyAdmin',500);res.download(file,'hr_evaluation_backup.sql')})
})
app.use((err,req,res,next)=>{console.error(err);if(res.headersSent)return next(err);if(err.code==='ER_DUP_ENTRY')return bad(res,'ข้อมูลซ้ำ กรุณาตรวจสอบอีกครั้ง',409);if(err.code==='ER_ROW_IS_REFERENCED_2')return bad(res,'ไม่สามารถลบได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่',409);if(err.code==='LIMIT_FILE_SIZE')return bad(res,'ไฟล์มีขนาดเกิน 5 MB');bad(res,'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์',500)})
app.listen(PORT,()=>console.log(`HR Evaluation API running at http://localhost:${PORT}`))
