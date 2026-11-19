import { createRouter, createWebHistory } from 'vue-router'
import Page from './views/Page.vue'
const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Page, props: { page: 'login' }, meta: { guestOnly: true } },
  { path: '/admin', redirect: '/admin/dashboard' },
  { path: '/admin/dashboard', component: Page, props: { page: 'admin' }, meta: { auth: true, role: 'admin' } },
  { path: '/admin/staff', component: Page, props: { page: 'admin-staff' }, meta: { auth: true, role: 'admin' } },
  { path: '/admin/rounds', component: Page, props: { page: 'admin-rounds' }, meta: { auth: true, role: 'admin' } },
  { path: '/admin/indicators', component: Page, props: { page: 'admin-indicators' }, meta: { auth: true, role: 'admin' } },
  { path: '/admin/assignments', component: Page, props: { page: 'admin-assignments' }, meta: { auth: true, role: 'admin' } },
  { path: '/admin/reports', component: Page, props: { page: 'admin-reports' }, meta: { auth: true, role: 'admin' } },
  { path: '/evaluatee', redirect: '/evaluatee/dashboard' },
  { path: '/evaluatee/dashboard', component: Page, props: { page: 'employee' }, meta: { auth: true, role: 'evaluatee' } },
  { path: '/evaluatee/assessment', component: Page, props: { page: 'employee-assessment' }, meta: { auth: true, role: 'evaluatee' } },
  { path: '/committee', redirect: '/committee/dashboard' },
  { path: '/committee/dashboard', component: Page, props: { page: 'committee' }, meta: { auth: true, role: 'evaluator' } },
  { path: '/committee/evaluate', component: Page, props: { page: 'committee-evaluate' }, meta: { auth: true, role: 'evaluator' } },
  { path: '/change-password', component: Page, props: { page: 'password' }, meta: { auth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]
const router = createRouter({ history: createWebHistory(), routes })
function home(role) { return role === 'admin' ? '/admin/dashboard' : role === 'evaluatee' ? '/evaluatee/dashboard' : role === 'evaluator' ? '/committee/dashboard' : '/login' }
router.beforeEach(async to => {
  const token = localStorage.getItem('hr_token')
  let user = null
  try { user = JSON.parse(localStorage.getItem('hr_user') || 'null') } catch { user = null }
  if (token && user) {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('session expired')
      const result = await response.json(); user = result.data
      localStorage.setItem('hr_user', JSON.stringify(user))
    } catch { localStorage.removeItem('hr_token'); localStorage.removeItem('hr_user'); user = null }
  }
  if (to.meta.guestOnly && user) return home(user.role)
  if (to.meta.auth && !user) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.meta.role && user?.role !== to.meta.role) return home(user?.role)
  if (user?.must_change_password && to.path !== '/change-password') return '/change-password'
  if (to.path === '/change-password' && !user) return '/login'
  return true
})
export default router
