import 'dotenv/config'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
const db = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hr_evaluation'
})
const accounts = [
  ['admin', 'admin123', 'ผู้ดูแลระบบตัวอย่าง', 'admin'],
  ['employee01', 'emp123', 'นายตัวอย่าง บุคลากร', 'evaluatee'],
  ['committee01', 'com123', 'นางตัวอย่าง กรรมการ', 'evaluator']
]
const ids = {}
for (const [username, password, fullName, role] of accounts) {
  const [found] = await db.execute('SELECT user_id FROM `USER` WHERE username=?', [username])
  const hash = await bcrypt.hash(password, 10)
  if (found[0]) {
    ids[username] = found[0].user_id
    await db.execute('UPDATE `USER` SET full_name=?,role=?,status=\'active\' WHERE user_id=?', [fullName, role, ids[username]])
  } else {
    const [r] = await db.execute('INSERT INTO `USER` (username,password,full_name,role,must_change_password,status) VALUES (?,?,?,?,0,\'active\')', [username, hash, fullName, role])
    ids[username] = r.insertId
  }
}
let [[round]] = await db.query('SELECT * FROM ROUND ORDER BY round_id LIMIT 1')
if (!round) {
  const [r] = await db.execute("INSERT INTO ROUND(title,start_date,end_date,status) VALUES('รอบประเมินตัวอย่าง 2569','2026-01-01','2026-12-31','open')")
  round = { round_id: r.insertId }
}
let [[topic]] = await db.execute('SELECT * FROM TOPIC WHERE round_id=? ORDER BY topic_id LIMIT 1', [round.round_id])
if (!topic) {
  const [r] = await db.execute('INSERT INTO TOPIC(round_id,topic_name,description) VALUES(?,?,?)', [round.round_id, 'ผลสัมฤทธิ์ของงาน', 'ตัวอย่างหัวข้อสำหรับทดลองระบบ'])
  topic = { topic_id: r.insertId }
}
const [[indicator]] = await db.execute('SELECT * FROM INDICATOR WHERE topic_id=? LIMIT 1', [topic.topic_id])
if (!indicator) await db.execute("INSERT INTO INDICATOR(topic_id,indicator_name,description,weight,evaluation_type,evidence_required,status) VALUES(?, 'คุณภาพและความสำเร็จของงาน', 'ประเมินคุณภาพและความสำเร็จตามเป้าหมาย', 1, 'RATING', 0, 'active')", [topic.topic_id])
let [[duty]] = await db.execute('SELECT * FROM DUTIES WHERE user_id=? AND round_id=?', [ids.employee01, round.round_id])
if (!duty) {
  const [r] = await db.execute('INSERT INTO DUTIES(user_id,round_id) VALUES(?,?)', [ids.employee01, round.round_id])
  duty = { duty_id: r.insertId }
}
const [[self]] = await db.execute("SELECT assessment_id FROM ASSESSMENT WHERE duty_id=? AND evaluator_id=? AND assessment_type='SELF'", [duty.duty_id, ids.employee01])
if (!self) await db.execute("INSERT INTO ASSESSMENT(duty_id,evaluator_id,assessment_type,status) VALUES(?,?,'SELF','PENDING')", [duty.duty_id, ids.employee01])
const [[committee]] = await db.execute("SELECT assessment_id FROM ASSESSMENT WHERE duty_id=? AND evaluator_id=? AND assessment_type='COMMITTEE'", [duty.duty_id, ids.committee01])
if (!committee) await db.execute("INSERT INTO ASSESSMENT(duty_id,evaluator_id,assessment_type,committee_role,status) VALUES(?,?,'COMMITTEE','CHAIRMAN','PENDING')", [duty.duty_id, ids.committee01])
console.log('ตัวอย่างข้อมูลพร้อมใช้งาน')
console.log('admin / admin123')
console.log('employee01 / emp123')
console.log('committee01 / com123')
await db.end()
