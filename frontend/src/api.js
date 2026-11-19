const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
export async function api(path, options = {}) {
  const token = localStorage.getItem('hr_token')
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  const response = await fetch(`${BASE}${path}`, { ...options, headers })
  if (response.status === 401) { localStorage.removeItem('hr_token'); localStorage.removeItem('hr_user') }
  const result = await response.json().catch(() => ({ message: 'ไม่สามารถอ่านคำตอบจากเซิร์ฟเวอร์ได้' }))
  if (!response.ok) throw new Error(result.message || 'เกิดข้อผิดพลาด')
  return result.data
}
export const get = path => api(path)
export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) })
export const put = (path, body) => api(path, { method: 'PUT', body: JSON.stringify(body) })
export const del = path => api(path, { method: 'DELETE' })
export async function download(path, filename) {
  const token = localStorage.getItem('hr_token')
  const response = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.message || 'ดาวน์โหลดไม่สำเร็จ') }
  const blob = await response.blob(), url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
