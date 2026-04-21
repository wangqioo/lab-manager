const BASE = '/api'

function token() { return localStorage.getItem('lab_token') }

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

const get = (p) => req('GET', p)
const post = (p, b) => req('POST', p, b)
const put = (p, b) => req('PUT', p, b)
const del = (p) => req('DELETE', p)

export const api = {
  // auth
  login: (username, password) => post('/auth/login', { username, password }),
  register: (data) => post('/auth/register', data),

  // requests
  getRequests: () => get('/requests'),
  submitRequest: (data) => post('/requests', data),
  approveRequest: (id, comment) => put(`/requests/${id}/approve`, { comment }),
  rejectRequest: (id, comment) => put(`/requests/${id}/reject`, { comment }),
  completeRequest: (id) => put(`/requests/${id}/complete`),
  setActualCost: (id, actualCost) => put(`/requests/${id}/actual-cost`, { actualCost }),
  deleteRequest: (id) => del(`/requests/${id}`),

  // users (teacher)
  getUsers: () => get('/users'),
  deleteUser: (id) => del(`/users/${id}`),

  // stats
  getStudentStats: () => get('/stats/students'),

  // admin
  getSystemInfo: () => get('/admin/system'),
  getTeachers: () => get('/admin/teachers'),
  addTeacher: (name, password) => post('/admin/teachers', { name, password }),
  deleteTeacher: (id) => del(`/admin/teachers/${id}`),
}
