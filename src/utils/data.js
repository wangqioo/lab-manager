const KEYS = {
  users: 'lab_users',
  requests: 'lab_requests',
  currentUser: 'lab_current_user',
}

const SEED_USERS = [
  {
    id: 'u_teacher',
    name: '李老师',
    username: 'teacher',
    password: 'teacher123',
    role: 'teacher',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u_s1',
    name: '张三',
    username: 'student1',
    password: '123456',
    role: 'student',
    studentId: '2023100001',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'u_s2',
    name: '李四',
    username: 'student2',
    password: '123456',
    role: 'student',
    studentId: '2023100002',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

const SEED_REQUESTS = [
  {
    id: 'r_001',
    studentId: 'u_s1',
    studentName: '张三',
    studentNumber: '2023100001',
    testTypes: ['EPR', 'Raman'],
    sampleDescription: '氧化铁纳米颗粒，已研磨成粉末，共3个样品',
    sampleCount: 3,
    budget: 800,
    purpose: '毕业论文实验，研究催化剂表面活性位点',
    notes: '样品已制备好，随时可测',
    urgency: 'normal',
    status: 'pending',
    createdAt: '2026-04-18T10:30:00.000Z',
    updatedAt: '2026-04-18T10:30:00.000Z',
    teacherComment: '',
    approvedAt: null,
  },
  {
    id: 'r_002',
    studentId: 'u_s2',
    studentName: '李四',
    studentNumber: '2023100002',
    testTypes: ['BET', 'XRD'],
    sampleDescription: '介孔二氧化硅材料，粉末状',
    sampleCount: 2,
    budget: 500,
    purpose: '课题组项目需求，表征新合成材料的物理性质',
    notes: '',
    urgency: 'urgent',
    status: 'approved',
    createdAt: '2026-04-16T14:20:00.000Z',
    updatedAt: '2026-04-17T09:00:00.000Z',
    teacherComment: '批准，请尽快安排实验',
    approvedAt: '2026-04-17T09:00:00.000Z',
  },
  {
    id: 'r_003',
    studentId: 'u_s1',
    studentName: '张三',
    studentNumber: '2023100001',
    testTypes: ['IR'],
    sampleDescription: '聚乳酸薄膜样品，5个',
    sampleCount: 5,
    budget: 300,
    purpose: '验证材料官能团',
    notes: '5个样品独立包装',
    urgency: 'normal',
    status: 'rejected',
    createdAt: '2026-04-10T11:00:00.000Z',
    updatedAt: '2026-04-11T08:30:00.000Z',
    teacherComment: '红外测试我们实验室可以自行完成，无需外送，请直接使用实验室FTIR仪器',
    approvedAt: null,
  },
]

export function initStorage() {
  if (!localStorage.getItem(KEYS.users)) {
    localStorage.setItem(KEYS.users, JSON.stringify(SEED_USERS))
  }
  if (!localStorage.getItem(KEYS.requests)) {
    localStorage.setItem(KEYS.requests, JSON.stringify(SEED_REQUESTS))
  }
}

export const getUsers = () => JSON.parse(localStorage.getItem(KEYS.users) || '[]')
export const saveUsers = (u) => localStorage.setItem(KEYS.users, JSON.stringify(u))
export const getRequests = () => JSON.parse(localStorage.getItem(KEYS.requests) || '[]')
export const saveRequests = (r) => localStorage.setItem(KEYS.requests, JSON.stringify(r))
export const getCurrentUser = () => {
  const s = localStorage.getItem(KEYS.currentUser)
  return s ? JSON.parse(s) : null
}
export const saveCurrentUser = (u) => {
  if (u) localStorage.setItem(KEYS.currentUser, JSON.stringify(u))
  else localStorage.removeItem(KEYS.currentUser)
}
export const genId = (p = 'id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
