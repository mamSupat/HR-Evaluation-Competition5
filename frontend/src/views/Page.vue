<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="/">
        HR
        <span>+</span>
        Evaluation
      </a>
      <nav v-if="currentUser">
        <a :href="homePath">หน้าหลัก</a>
        <template v-if="currentUser.role==='admin'">
          <a href="/admin/staff">บุคลากร</a>
          <a href="/admin/rounds">รอบประเมิน</a>
          <a href="/admin/indicators">ตัวชี้วัด</a>
          <a href="/admin/assignments">มอบหมาย</a>
          <a href="/admin/reports">รายงาน</a>
        </template>
        <template v-if="currentUser.role==='evaluatee'">
          <a href="/evaluatee/assessment">ประเมินตนเอง</a>
        </template>
        <template v-if="currentUser.role==='evaluator'">
          <a href="/committee/evaluate">ประเมินบุคลากร</a>
        </template>
        <a href="/change-password">เปลี่ยนรหัสผ่าน</a>
        <button class="btn small" @click="logout">ออกจากระบบ</button>
      </nav>
    </header>
    <main class="container">
      <section v-if="page==='login'" class="login-wrap">
        <div class="login-info">
          <span class="eyebrow">PERSONNEL PERFORMANCE SYSTEM</span>
          <h1>
            ระบบประเมินผล
            <br>
            การปฏิบัติงานของบุคลากร
          </h1>
          <p>เข้าสู่ระบบเพื่อจัดการและติดตามผลการประเมินบุคลากร</p>
        </div>
        <form class="panel login-panel" @submit.prevent="login">
          <h2>เข้าสู่ระบบ</h2>
          <label>
            ชื่อผู้ใช้งาน
            <input v-model="form.username" required autocomplete="username">
          </label>
          <label>
            รหัสผ่าน
            <input v-model="form.password" type="password" required autocomplete="current-password">
          </label>
          <p v-if="error" class="error">{{error}}</p>
          <button class="btn primary full" :disabled="busy">{{busy?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}}</button>
        </form>
      </section>
      <section v-else-if="page==='password'" class="panel narrow">
        <h1>เปลี่ยนรหัสผ่าน</h1>
        <form @submit.prevent="changePassword">
          <label>
            รหัสผ่านเดิม
            <input v-model="password.old_password" type="password" required>
          </label>
          <label>
            รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)
            <input v-model="password.new_password" type="password" minlength="6" required>
          </label>
          <label>
            ยืนยันรหัสผ่านใหม่
            <input v-model="password.confirm" type="password" minlength="6" required>
          </label>
          <button class="btn primary">บันทึกรหัสผ่าน</button>
        </form>
      </section>
      <template v-else>
        <div class="section-head">
          <div>
            <span class="eyebrow">HR EVALUATION WORKSPACE</span>
            <h1>{{pageTitle}}</h1>
            <p class="muted">{{currentUser?.full_name}} · {{roleName}}</p>
          </div>
          <button class="btn light" @click="loadAll">รีเฟรชข้อมูล</button>
        </div>
        <p v-if="notice" class="notice">{{notice}}</p>
        <p v-if="error" class="error">{{error}}</p>
        <section v-if="page.endsWith('dashboard') || page==='admin' || page==='employee' || page==='committee'" class="stats">
          <div class="stat">
            <small>บุคลากร</small>
            <strong>{{dashboard.users||0}}</strong>
            <span>บัญชีที่เปิดใช้งาน</span>
          </div>
          <div class="stat">
            <small>รอบที่เปิด</small>
            <strong>{{dashboard.rounds||0}}</strong>
            <span>รอบประเมิน</span>
          </div>
          <div class="stat">
            <small>รายการมอบหมาย</small>
            <strong>{{dashboard.duties||0}}</strong>
            <span>รายการทั้งหมด</span>
          </div>
          <div class="stat">
            <small>ส่งผลแล้ว</small>
            <strong>{{dashboard.submitted||0}}</strong>
            <span>แบบประเมินที่ยืนยัน</span>
          </div>
          <div class="panel span-all">
            <h2>ทางลัดการทำงาน</h2>
            <div class="actions">
              <a v-if="currentUser.role==='admin'" class="btn primary" href="/admin/staff">จัดการบุคลากร</a>
              <a v-if="currentUser.role==='admin'" class="btn" href="/admin/assignments">มอบหมายการประเมิน</a>
              <a v-if="currentUser.role==='evaluatee'" class="btn primary" href="/evaluatee/assessment">เปิดแบบประเมินตนเอง</a>
              <a v-if="currentUser.role==='evaluator'" class="btn primary" href="/committee/evaluate">เปิดรายการประเมิน</a>
            </div>
          </div>
        </section>
        <template v-if="page==='admin-staff'">
          <section class="panel">
            <h2>{{editId?'แก้ไขบุคลากร':'เพิ่มบุคลากร'}}</h2>
            <form class="form-grid" @submit.prevent="saveUser">
              <label>
                ชื่อผู้ใช้
                <input v-model="userForm.username" :disabled="!!editId" required>
              </label>
              <label v-if="!editId">
                รหัสผ่านเริ่มต้น
                <input v-model="userForm.password" type="password" minlength="6" required>
              </label>
              <label>
                ชื่อ-นามสกุล
                <input v-model="userForm.full_name" required>
              </label>
              <label>
                อีเมล
                <input v-model="userForm.email" type="email">
              </label>
              <label>
                เบอร์โทร
                <input v-model="userForm.phone">
              </label>
              <label>
                หน่วยงาน
                <input v-model="userForm.department">
              </label>
              <label>
                ตำแหน่ง
                <input v-model="userForm.position">
              </label>
              <label>
                บทบาท
                <select v-model="userForm.role">
                  <option value="evaluatee">ผู้รับการประเมิน</option>
                  <option value="evaluator">กรรมการ</option>
                  <option value="admin">ผู้ดูแลระบบ</option>
                </select>
              </label>
              <label v-if="editId">
                สถานะ
                <select v-model="userForm.status">
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>
              </label>
              <div class="form-actions">
                <button class="btn primary">{{editId?'บันทึกการแก้ไข':'เพิ่มบุคลากร'}}</button>
                <button v-if="editId" type="button" class="btn light" @click="resetForms">ยกเลิก</button>
              </div>
            </form>
          </section>
          <DataTable :rows="users" :columns="[{key:'username',label:'ชื่อผู้ใช้'},{key:'full_name',label:'ชื่อ-นามสกุล'},{key:'department',label:'หน่วยงาน'},{key:'role',label:'บทบาท'},{key:'status',label:'สถานะ'}]" @edit="editUser" @remove="removeUser" @reset="resetUserPassword" />
        </template>
        <template v-if="page==='admin-rounds'">
          <section class="panel">
            <h2>{{editId?'แก้ไขรอบประเมิน':'เพิ่มรอบประเมิน'}}</h2>
            <form class="form-grid" @submit.prevent="saveRound">
              <label>
                ชื่อรอบประเมิน
                <input v-model="roundForm.title" required>
              </label>
              <label>
                วันที่เริ่ม
                <input v-model="roundForm.start_date" type="date" required>
              </label>
              <label>
                วันที่สิ้นสุด
                <input v-model="roundForm.end_date" type="date" required>
              </label>
              <label>
                สถานะ
                <select v-model="roundForm.status">
                  <option value="draft">ฉบับร่าง</option>
                  <option value="open">เปิดประเมิน</option>
                  <option value="closed">ปิดรอบ</option>
                </select>
              </label>
              <div class="form-actions">
                <button class="btn primary">บันทึกรอบประเมิน</button>
                <button v-if="editId" type="button" class="btn light" @click="resetForms">ยกเลิก</button>
              </div>
            </form>
          </section>
          <DataTable :rows="rounds" :columns="[{key:'title',label:'รอบประเมิน'},{key:'start_date',label:'วันเริ่ม'},{key:'end_date',label:'วันสิ้นสุด'},{key:'status',label:'สถานะ'}]" @edit="editRound" @remove="removeRound" />
        </template>
        <template v-if="page==='admin-indicators'">
          <section class="panel">
            <h2>จัดการหัวข้อและตัวชี้วัด</h2>
            <form class="form-grid" @submit.prevent="saveTopic">
              <label>
                รอบประเมิน
                <select v-model="topicForm.round_id" required>
                  <option value="">เลือกรอบ</option>
                  <option v-for="r in rounds" :key="r.round_id" :value="r.round_id">{{r.title}}</option>
                </select>
              </label>
              <label>
                ชื่อหัวข้อ
                <input v-model="topicForm.topic_name" required>
              </label>
              <label class="wide">
                คำอธิบาย
                <input v-model="topicForm.description">
              </label>
              <div class="form-actions">
                <button class="btn">{{topicEditId?'บันทึกหัวข้อ':'เพิ่มหัวข้อ'}}</button>
                <button v-if="topicEditId" type="button" class="btn light" @click="topicEditId=null;Object.assign(topicForm,{round_id:'',topic_name:'',description:''})">ยกเลิก</button>
              </div>
            </form>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>หัวข้อ</th>
                    <th>รอบ</th>
                    <th>รายละเอียด</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in topics" :key="t.topic_id">
                    <td>{{t.topic_name}}</td>
                    <td>{{t.round_title}}</td>
                    <td>{{t.description}}</td>
                    <td>
                      <button class="btn small" @click="editTopic(t)">แก้ไข</button>
                      <button class="btn danger small" @click="removeTopic(t.topic_id)">ลบ</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <h2>{{editId?'แก้ไขตัวชี้วัด':'เพิ่มตัวชี้วัด'}}</h2>
            <form class="form-grid" @submit.prevent="saveIndicator">
              <label>
                หัวข้อ
                <select v-model="indicatorForm.topic_id" required>
                  <option value="">เลือกหัวข้อ</option>
                  <option v-for="t in topics" :key="t.topic_id" :value="t.topic_id">{{t.topic_name}} ({{t.round_title}})</option>
                </select>
              </label>
              <label>
                ชื่อตัวชี้วัด
                <input v-model="indicatorForm.indicator_name" required>
              </label>
              <label>
                น้ำหนักคะแนน
                <input v-model.number="indicatorForm.weight" type="number" min="0.01" step="0.01" required>
              </label>
              <label>
                ประเภทคะแนน
                <select v-model="indicatorForm.evaluation_type">
                  <option value="RATING">ระดับ 0–5</option>
                  <option value="BOOLEAN">ผ่าน/ไม่ผ่าน (0–1)</option>
                </select>
              </label>
              <label>
                ต้องแนบหลักฐาน
                <select v-model="indicatorForm.evidence_required">
                  <option :value="false">ไม่บังคับ</option>
                  <option :value="true">บังคับ</option>
                </select>
              </label>
              <label>
                สถานะ
                <select v-model="indicatorForm.status">
                  <option value="active">ใช้งาน</option>
                  <option value="inactive">ปิดใช้งาน</option>
                </select>
              </label>
              <label class="wide">
                คำอธิบาย
                <input v-model="indicatorForm.description">
              </label>
              <div class="form-actions">
                <button class="btn primary">บันทึกตัวชี้วัด</button>
                <button v-if="editId" type="button" class="btn light" @click="resetForms">ยกเลิก</button>
              </div>
            </form>
          </section>
          <DataTable :rows="indicators" :columns="[{key:'indicator_name',label:'ตัวชี้วัด'},{key:'topic_name',label:'หัวข้อ'},{key:'weight',label:'น้ำหนัก'},{key:'evaluation_type',label:'ประเภท'},{key:'status',label:'สถานะ'}]" @edit="editIndicator" @remove="removeIndicator" />
        </template>
        <template v-if="page==='admin-assignments'">
          <section class="panel">
            <h2>มอบหมายผู้รับการประเมิน</h2>
            <form class="form-grid" @submit.prevent="saveDuty">
              <label>
                บุคลากร
                <select v-model="assignForm.user_id" required>
                  <option value="">เลือกบุคลากร</option>
                  <option v-for="u in users.filter(x=>x.role==='evaluatee'&&x.status==='active')" :key="u.user_id" :value="u.user_id">
                    {{u.full_name}}
                  </option>
                </select>
              </label>
              <label>
                รอบประเมิน
                <select v-model="assignForm.round_id" required>
                  <option value="">เลือกรอบ</option>
                  <option v-for="r in rounds" :key="r.round_id" :value="r.round_id">{{r.title}}</option>
                </select>
              </label>
              <div class="form-actions">
                <button class="btn primary">มอบหมาย</button>
              </div>
            </form>
          </section>
          <section class="panel">
            <h2>มอบหมายกรรมการให้รายการ</h2>
            <form class="form-grid" @submit.prevent="assignEvaluator">
              <label>
                รายการประเมิน
                <select v-model="committeeForm.duty_id" required>
                  <option value="">เลือกรายการ</option>
                  <option v-for="d in duties" :key="d.duty_id" :value="d.duty_id">{{d.full_name}} · {{d.round_title}}</option>
                </select>
              </label>
              <label>
                กรรมการ
                <select v-model="committeeForm.evaluator_id" required>
                  <option value="">เลือกกรรมการ</option>
                  <option v-for="u in users.filter(x=>x.role==='evaluator'&&x.status==='active')" :key="u.user_id" :value="u.user_id">
                    {{u.full_name}}
                  </option>
                </select>
              </label>
              <label>
                ตำแหน่งกรรมการ
                <select v-model="committeeForm.committee_role">
                  <option value="COMMITTEE">กรรมการ</option>
                  <option value="CHAIRMAN">ประธานกรรมการ</option>
                </select>
              </label>
              <div class="form-actions">
                <button class="btn">มอบหมายกรรมการ</button>
              </div>
            </form>
          </section>
          <DataTable :rows="duties" :show-actions="false" :columns="[{key:'full_name',label:'ผู้รับการประเมิน'},{key:'department',label:'หน่วยงาน'},{key:'round_title',label:'รอบประเมิน'},{key:'status',label:'สถานะ'}]" />
        </template>
        <template v-if="page==='employee-assessment' || page==='committee-evaluate'">
          <section class="panel">
            <h2>รายการแบบประเมินของฉัน</h2>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ผู้รับการประเมิน</th>
                    <th>รอบ</th>
                    <th>ประเภท</th>
                    <th>สถานะ</th>
                    <th>ทำรายการ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="a in assessments" :key="a.assessment_id">
                    <td>{{a.evaluatee_name}}</td>
                    <td>{{a.round_title}}</td>
                    <td>{{a.assessment_type==='SELF'?'ประเมินตนเอง':'กรรมการ'}}</td>
                    <td>{{statusText(a.status)}}</td>
                    <td>
                      <button class="btn small primary" @click="openAssessment(a)">เปิดแบบประเมิน</button>
                    </td>
                  </tr>
                  <tr v-if="!assessments.length">
                    <td colspan="5">ยังไม่มีรายการที่ได้รับมอบหมาย</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section v-if="selectedAssessment" class="panel">
            <div class="section-head">
              <div>
                <h2>แบบประเมิน: {{selectedAssessment.evaluatee_name}}</h2>
                <p class="muted">{{selectedAssessment.round_title}} · {{selectedAssessment.assessment_type}}</p>
              </div>
              <span class="status">{{statusText(selectedAssessment.status)}}</span>
            </div>
            <div v-for="s in scores" :key="s.indicator_id" class="score-item">
              <div>
                <b>{{s.indicator_name}}</b>
                <p class="muted">{{s.description}} · น้ำหนัก {{s.weight}}</p>
              </div>
              <div class="form-grid">
                <label>
                  คะแนน ({{s.evaluation_type==='BOOLEAN'?'0 หรือ 1':'0 ถึง 5'}})
                  <input v-model.number="s.score_value" type="number" :min="0" :max="s.evaluation_type==='BOOLEAN'?1:5" :step="s.evaluation_type==='BOOLEAN'?1:0.5" :disabled="selectedAssessment.status==='SUBMITTED'">
                </label>
                <label>
                  ความคิดเห็น
                  <input v-model="s.comment" :disabled="selectedAssessment.status==='SUBMITTED'">
                </label>
                <div class="form-actions" v-if="selectedAssessment.status!=='SUBMITTED'">
                  <button class="btn small" @click="saveScore(s)">บันทึกคะแนน</button>
                  <label v-if="s.score_id" class="file-label">
                    แนบหลักฐาน
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" @change="uploadEvidence($event,s)">
                  </label>
                </div>
                <div v-if="s.score_id" class="form-actions">
                  <button class="btn light small" @click="addDetail(s)">เพิ่มรายละเอียด</button>
                  <button class="btn light small" @click="loadEvidence(s)">ดูหลักฐาน</button>
                </div>
              </div>
            </div>
            <div v-if="evidenceRows.length" class="panel">
              <h3>ไฟล์หลักฐาน</h3>
              <p v-for="f in evidenceRows" :key="f.evidence_id">
                <a href="#" @click.prevent="downloadEvidence(f)">{{f.file_name}} · ดาวน์โหลด</a>
              </p>
            </div>
            <label>
              ความเห็นภาพรวม
              <textarea v-model="assessmentComment" :disabled="selectedAssessment.status==='SUBMITTED'"></textarea>
            </label>
            <label>
              พิมพ์ชื่อเพื่อยืนยันผล
              <input v-model="assessmentSignature" :disabled="selectedAssessment.status==='SUBMITTED'" placeholder="ชื่อ-นามสกุลผู้ประเมิน">
            </label>
            <button v-if="selectedAssessment.status!=='SUBMITTED'" class="btn primary" @click="submitAssessment">ยืนยันและส่งผลการประเมิน</button>
          </section>
        </template>
        <template v-if="page==='admin-reports'">
          <section class="panel">
            <div class="section-head">
              <h2>รายงานสรุปผลการประเมิน</h2>
              <button class="btn" @click="printReport">พิมพ์ / บันทึก PDF</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>บุคลากร</th>
                    <th>หน่วยงาน</th>
                    <th>รอบประเมิน</th>
                    <th>แบบประเมิน</th>
                    <th>ส่งแล้ว</th>
                    <th>คะแนนเฉลี่ย</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in reports" :key="r.duty_id">
                    <td>{{r.full_name}}</td>
                    <td>{{r.department}}</td>
                    <td>{{r.round_title}}</td>
                    <td>{{r.assessment_count}}</td>
                    <td>{{r.submitted_count||0}}</td>
                    <td>{{r.average_score??'-'}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            <h2>สำรองข้อมูล</h2>
            <p>ดาวน์โหลดไฟล์ SQL สำรองข้อมูลจากฐานข้อมูล (ต้องติดตั้ง mysqldump บนเครื่อง Backend)</p>
            <button class="btn" @click="downloadBackup">ดาวน์โหลดไฟล์สำรอง</button>
            <p class="muted">หากไม่มี mysqldump ให้ใช้ Export / Import ผ่าน phpMyAdmin</p>
          </section>
        </template>
      </template>
    </main>
    <footer>HR Evaluation Platform · ระบบประเมินผลการปฏิบัติงานของบุคลากร</footer>
  </div>
</template>
<script setup>
// 1) Imports
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api, post, put, del, download } from '../api'
import DataTable from './components/DataTable.vue'
// 2) Page and user information
const props = defineProps({ page: { type: String, default: 'login' } })
const router = useRouter()
const currentUser = ref(JSON.parse(localStorage.getItem('hr_user') || 'null'))
const homePath = computed(() => {
  if (currentUser.value?.role === 'admin') return '/admin/dashboard'
  if (currentUser.value?.role === 'evaluatee') return '/evaluatee/dashboard'
  return '/committee/dashboard'
})
const roleName = computed(() => ({
  admin: 'ผู้ดูแลระบบ',
  evaluatee: 'ผู้รับการประเมิน',
  evaluator: 'กรรมการผู้ประเมิน'
}[currentUser.value?.role] || ''))
const pageTitle = computed(() => ({
  admin: 'Dashboard ฝ่ายบุคลากร',
  employee: 'Dashboard ผู้รับการประเมิน',
  committee: 'Dashboard กรรมการ',
  'admin-staff': 'จัดการข้อมูลบุคลากร',
  'admin-rounds': 'จัดการรอบประเมิน',
  'admin-indicators': 'จัดการหัวข้อและตัวชี้วัด',
  'admin-assignments': 'มอบหมายการประเมิน',
  'admin-reports': 'รายงานผลการประเมิน',
  'employee-assessment': 'ประเมินตนเอง',
  'committee-evaluate': 'ประเมินบุคลากร'
}[props.page] || 'ระบบประเมินบุคลากร'))
// 3) Form data
const form = reactive({ username: '', password: '' })
const password = reactive({ old_password: '', new_password: '', confirm: '' })
const userForm = reactive({
  username: '', password: '', full_name: '', email: '', phone: '',
  department: '', position: '', role: 'evaluatee', status: 'active'
})
const roundForm = reactive({ title: '', start_date: '', end_date: '', status: 'draft' })
const topicForm = reactive({ round_id: '', topic_name: '', description: '' })
const indicatorForm = reactive({
  topic_id: '', indicator_name: '', description: '', weight: 1,
  evaluation_type: 'RATING', evidence_required: false, status: 'active'
})
const assignForm = reactive({ user_id: '', round_id: '' })
const committeeForm = reactive({ duty_id: '', evaluator_id: '', committee_role: 'COMMITTEE' })
// 4) Page state and data from the API
const topicEditId = ref(null)
const evidenceRows = ref([])
const detailRows = ref([])
const error = ref('')
const notice = ref('')
const busy = ref(false)
const editId = ref(null)
const dashboard = ref({})
const users = ref([])
const rounds = ref([])
const topics = ref([])
const indicators = ref([])
const duties = ref([])
const assessments = ref([])
const reports = ref([])
const selectedAssessment = ref(null)
const scores = ref([])
const assessmentComment = ref('')
const assessmentSignature = ref('')
// 5) Shared messages
function message(text) {
  notice.value = text
  error.value = ''
}
function fail(e) {
  error.value = e.message || 'เกิดข้อผิดพลาด'
  notice.value = ''
}
// 6) Login, logout, and password
async function login() {
  busy.value = true
  try {
    const data = await post('/auth/login', form)
    localStorage.setItem('hr_token', data.token)
    localStorage.setItem('hr_user', JSON.stringify({
      ...data.user,
      must_change_password: data.must_change_password
    }))
    currentUser.value = data.user
    const nextPage = data.must_change_password
      ? '/change-password'
      : data.user.role === 'admin'
        ? '/admin/dashboard'
        : data.user.role === 'evaluatee'
          ? '/evaluatee/dashboard'
          : '/committee/dashboard'
    router.push(nextPage)
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}
function logout() {
  localStorage.clear()
  currentUser.value = null
  router.replace('/login')
}
async function changePassword() {
  try {
    if (password.new_password !== password.confirm) {
      throw Error('รหัสผ่านใหม่ไม่ตรงกัน')
    }
    await put('/auth/password', {
      old_password: password.old_password,
      new_password: password.new_password
    })
    const user = { ...currentUser.value, must_change_password: false }
    localStorage.setItem('hr_user', JSON.stringify(user))
    currentUser.value = user
    message('เปลี่ยนรหัสผ่านสำเร็จ')
    router.push(homePath.value)
  } catch (e) {
    fail(e)
  }
}
// 7) Load data for the current page
async function loadAll() {
  error.value = ''
  try {
    if (props.page.endsWith('dashboard') || ['admin', 'employee', 'committee'].includes(props.page)) {
      dashboard.value = await api('/dashboard')
    }
    if (props.page === 'admin-staff' || props.page === 'admin-assignments') {
      users.value = await api('/users')
    }
    if (['admin-rounds', 'admin-indicators', 'admin-assignments'].includes(props.page)) {
      rounds.value = await api('/rounds')
    }
    if (props.page === 'admin-indicators') {
      topics.value = await api('/topics')
      indicators.value = await api('/indicators')
    }
    if (props.page === 'admin-assignments') {
      duties.value = await api('/duties')
    }
    if (props.page === 'employee-assessment' || props.page === 'committee-evaluate') {
      assessments.value = await api('/assessments/mine')
    }
    if (props.page === 'admin-reports') {
      reports.value = await api('/reports/summary')
    }
  } catch (e) {
    fail(e)
  }
}
// 8) Reset forms
function resetForms() {
  editId.value = null
  Object.assign(userForm, {
    username: '', password: '', full_name: '', email: '', phone: '',
    department: '', position: '', role: 'evaluatee', status: 'active'
  })
  Object.assign(roundForm, { title: '', start_date: '', end_date: '', status: 'draft' })
  Object.assign(indicatorForm, {
    topic_id: '', indicator_name: '', description: '', weight: 1,
    evaluation_type: 'RATING', evidence_required: false, status: 'active'
  })
}
// 9) Staff management
function editUser(row) {
  editId.value = row.user_id
  Object.assign(userForm, { ...row, password: '' })
}
async function saveUser() {
  try {
    if (editId.value) {
      await put(`/users/${editId.value}`, userForm)
    } else {
      await post('/users', userForm)
    }
    message('บันทึกข้อมูลบุคลากรแล้ว')
    resetForms()
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function removeUser(row) {
  if (!confirm(`ปิดใช้งานบัญชี ${row.full_name} ใช่หรือไม่?`)) return
  try {
    await put(`/users/${row.user_id}`, { ...row, status: 'inactive' })
    message('ปิดใช้งานบัญชีแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function resetUserPassword(row) {
  const newPassword = prompt('กำหนดรหัสผ่านชั่วคราว (อย่างน้อย 6 ตัว)', '123456')
  if (!newPassword) return
  try {
    await post(`/users/${row.user_id}/reset-password`, { password: newPassword })
    message('รีเซ็ตรหัสผ่านแล้ว: ' + newPassword)
  } catch (e) {
    fail(e)
  }
}
// 10) Evaluation round management
function editRound(row) {
  editId.value = row.round_id
  Object.assign(roundForm, {
    ...row,
    start_date: String(row.start_date).slice(0, 10),
    end_date: String(row.end_date).slice(0, 10)
  })
}
async function saveRound() {
  try {
    if (editId.value) {
      await put(`/rounds/${editId.value}`, roundForm)
    } else {
      await post('/rounds', roundForm)
    }
    message('บันทึกรอบประเมินแล้ว')
    resetForms()
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function removeRound(row) {
  if (!confirm('ยืนยันลบรอบประเมินนี้?')) return
  try {
    await del(`/rounds/${row.round_id}`)
    message('ลบรอบประเมินแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
// 11) Topic and indicator management
function editIndicator(row) {
  editId.value = row.indicator_id
  Object.assign(indicatorForm, {
    ...row,
    topic_id: row.topic_id,
    evidence_required: !!row.evidence_required
  })
}
function editTopic(topic) {
  topicEditId.value = topic.topic_id
  Object.assign(topicForm, {
    round_id: topic.round_id,
    topic_name: topic.topic_name,
    description: topic.description || ''
  })
}
async function saveTopic() {
  try {
    if (topicEditId.value) {
      await put(`/topics/${topicEditId.value}`, topicForm)
    } else {
      await post('/topics', topicForm)
    }
    topicEditId.value = null
    Object.assign(topicForm, { round_id: '', topic_name: '', description: '' })
    message('บันทึกหัวข้อแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function removeTopic(id) {
  if (!confirm('ยืนยันลบหัวข้อนี้?')) return
  try {
    await del(`/topics/${id}`)
    message('ลบหัวข้อแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function saveIndicator() {
  try {
    if (editId.value) {
      await put(`/indicators/${editId.value}`, indicatorForm)
    } else {
      await post('/indicators', indicatorForm)
    }
    message('บันทึกตัวชี้วัดแล้ว')
    resetForms()
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function removeIndicator(row) {
  if (!confirm('ยืนยันลบตัวชี้วัดนี้?')) return
  try {
    await del(`/indicators/${row.indicator_id}`)
    message('ลบตัวชี้วัดแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
// 12) Assignment management
async function saveDuty() {
  try {
    await post('/duties', assignForm)
    Object.assign(assignForm, { user_id: '', round_id: '' })
    message('มอบหมายผู้รับการประเมินแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
async function assignEvaluator() {
  try {
    await post(`/duties/${committeeForm.duty_id}/assign`, committeeForm)
    message('มอบหมายกรรมการแล้ว')
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
// 13) Assessment and scoring
async function openAssessment(assessment) {
  selectedAssessment.value = assessment
  assessmentComment.value = assessment.overall_comment || ''
  assessmentSignature.value = assessment.signature_path || ''
  evidenceRows.value = []
  try {
    scores.value = await api(`/assessments/${assessment.assessment_id}/scores`)
  } catch (e) {
    fail(e)
  }
}
async function saveScore(score) {
  try {
    const result = await post(
      `/assessments/${selectedAssessment.value.assessment_id}/scores`,
      {
        indicator_id: score.indicator_id,
        score_value: score.score_value,
        comment: score.comment
      }
    )
    score.score_id = result.score_id || score.score_id
    message('บันทึกคะแนนแล้ว')
    await openAssessment(selectedAssessment.value)
  } catch (e) {
    fail(e)
  }
}
async function addDetail(score) {
  const detail = prompt('กรอกรายละเอียดเพิ่มเติม')
  if (!detail) return
  try {
    await post(`/scores/${score.score_id}/details`, { detail_text: detail })
    detailRows.value = await api(`/scores/${score.score_id}/details`)
    alert(detailRows.value.map(row => row.detail_text).join('\n'))
    message('เพิ่มรายละเอียดแล้ว')
  } catch (e) {
    fail(e)
  }
}
async function uploadEvidence(event, score) {
  const file = event.target.files[0]
  if (!file) return
  const data = new FormData()
  data.append('file', file)
  try {
    await api(`/scores/${score.score_id}/evidence`, { method: 'POST', body: data })
    message('แนบหลักฐานแล้ว')
  } catch (e) {
    fail(e)
  }
  event.target.value = ''
}
async function loadEvidence(score) {
  try {
    evidenceRows.value = await api(`/scores/${score.score_id}/evidence`)
    if (!evidenceRows.value.length) alert('ยังไม่มีหลักฐาน')
  } catch (e) {
    fail(e)
  }
}
async function downloadEvidence(item) {
  try {
    await download(`/evidence/${item.evidence_id}/download`, item.file_name)
  } catch (e) {
    fail(e)
  }
}
async function submitAssessment() {
  if (!confirm('ยืนยันส่งผลการประเมิน? เมื่อส่งแล้วจะไม่สามารถแก้ไขได้')) return
  try {
    await post(`/assessments/${selectedAssessment.value.assessment_id}/submit`, {
      overall_comment: assessmentComment.value,
      signature_path: assessmentSignature.value
    })
    message('ยืนยันผลการประเมินแล้ว')
    selectedAssessment.value = null
    await loadAll()
  } catch (e) {
    fail(e)
  }
}
// 14) Reports and backup
function statusText(status) {
  return ({
    PENDING: 'รอดำเนินการ',
    DRAFT: 'บันทึกร่าง',
    SUBMITTED: 'ส่งผลแล้ว'
  })[status] || status
}
function printReport() {
  window.print()
}
async function downloadBackup() {
  try {
    await download('/admin/backup', 'hr_evaluation_backup.sql')
    message('ดาวน์โหลดไฟล์สำรองแล้ว')
  } catch (e) {
    fail(e)
  }
}
// 15) Reload data when the route changes
watch(() => props.page, () => {
  selectedAssessment.value = null
  if (props.page !== 'login') loadAll()
}, { immediate: true })
</script>
