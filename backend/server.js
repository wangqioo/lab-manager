const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const path = require('path')
const { getDb } = require('./db')

const app = express()
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || 'lab_ylx_2026_secret'

app.use(cors())
app.use(express.json())

// Serve built React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')))
}

// ── Middleware ──────────────────────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: '未登录' })
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token 无效，请重新登录' })
  }
}

function teacherOnly(req, res, next) {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: '无权限' })
  next()
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' })
  next()
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function parseReq(r) {
  if (!r) return r
  return { ...r, test_types: JSON.parse(r.test_types || '[]') }
}

// ── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '学号/密码错误' })
  }
  const { password_hash, ...safe } = user
  const token = jwt.sign(safe, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user: safe })
})

app.post('/api/auth/register', (req, res) => {
  const { name, studentId, password, enrolledYear } = req.body
  if (!name || !studentId || !password) {
    return res.status(400).json({ error: '请填写姓名、学号和密码' })
  }
  if (password.length < 6) return res.status(400).json({ error: '密码至少6位' })
  const db = getDb()
  const exists = db.prepare('SELECT id FROM users WHERE username = ? OR student_id = ?').get(studentId, studentId)
  if (exists) return res.status(400).json({ error: '该学号已注册' })
  const id = genId('u')
  const hash = bcrypt.hashSync(password, 10)
  const year = enrolledYear || new Date().getFullYear()
  db.prepare(`
    INSERT INTO users (id, name, student_id, username, password_hash, role, enrolled_year)
    VALUES (?, ?, ?, ?, ?, 'student', ?)
  `).run(id, name, studentId, studentId, hash, year)
  const user = db.prepare('SELECT id,name,student_id,username,role,enrolled_year,created_at FROM users WHERE id=?').get(id)
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '30d' })
  res.json({ token, user })
})

// ── Users ───────────────────────────────────────────────────────────────────

app.get('/api/users', auth, teacherOnly, (req, res) => {
  const db = getDb()
  const users = db.prepare(`
    SELECT u.id, u.name, u.student_id, u.username, u.enrolled_year, u.created_at,
      COUNT(r.id) AS request_count,
      COUNT(CASE WHEN r.status IN ('approved','completed') THEN 1 END) AS approved_count
    FROM users u
    LEFT JOIN requests r ON r.user_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.enrolled_year DESC, u.name
  `).all()
  res.json(users)
})

app.delete('/api/users/:id', auth, teacherOnly, (req, res) => {
  const db = getDb()
  const user = db.prepare("SELECT id FROM users WHERE id=? AND role='student'").get(req.params.id)
  if (!user) return res.status(404).json({ error: '用户不存在' })
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Requests ─────────────────────────────────────────────────────────────────

app.get('/api/requests', auth, (req, res) => {
  const db = getDb()
  let rows
  if (req.user.role === 'teacher') {
    rows = db.prepare(`
      SELECT r.*, u.name AS student_name, u.student_id AS student_number, u.enrolled_year
      FROM requests r JOIN users u ON u.id = r.user_id
      ORDER BY CASE WHEN r.urgency='urgent' THEN 0 ELSE 1 END, r.created_at DESC
    `).all()
  } else {
    rows = db.prepare(`
      SELECT r.*, u.name AS student_name, u.student_id AS student_number
      FROM requests r JOIN users u ON u.id = r.user_id
      WHERE r.user_id=?
      ORDER BY r.created_at DESC
    `).all(req.user.id)
  }
  res.json(rows.map(parseReq))
})

app.post('/api/requests', auth, (req, res) => {
  const { testTypes, sampleDescription, sampleCount, estimatedBudget, purpose, notes, urgency } = req.body
  const db = getDb()
  const id = genId('r')
  db.prepare(`
    INSERT INTO requests (id, user_id, test_types, sample_description, sample_count, estimated_budget, purpose, notes, urgency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, JSON.stringify(testTypes || []), sampleDescription, sampleCount || 1, estimatedBudget || 0, purpose, notes || '', urgency || 'normal')
  const r = db.prepare(`
    SELECT r.*, u.name AS student_name, u.student_id AS student_number
    FROM requests r JOIN users u ON u.id = r.user_id WHERE r.id=?
  `).get(id)
  res.json(parseReq(r))
})

app.put('/api/requests/:id/approve', auth, teacherOnly, (req, res) => {
  const { comment } = req.body
  const db = getDb()
  db.prepare(`
    UPDATE requests SET status='approved', teacher_comment=?, approved_by=?, approved_at=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?
  `).run(comment || '', req.user.name, req.params.id)
  res.json({ ok: true })
})

app.put('/api/requests/:id/reject', auth, teacherOnly, (req, res) => {
  const { comment } = req.body
  if (!comment?.trim()) return res.status(400).json({ error: '拒绝时必须填写意见' })
  const db = getDb()
  db.prepare(`
    UPDATE requests SET status='rejected', teacher_comment=?, approved_by=?, updated_at=datetime('now','localtime') WHERE id=?
  `).run(comment, req.user.name, req.params.id)
  res.json({ ok: true })
})

app.put('/api/requests/:id/complete', auth, teacherOnly, (req, res) => {
  const db = getDb()
  db.prepare(`UPDATE requests SET status='completed', updated_at=datetime('now','localtime') WHERE id=?`).run(req.params.id)
  res.json({ ok: true })
})

app.put('/api/requests/:id/actual-cost', auth, (req, res) => {
  const { actualCost } = req.body
  if (actualCost === undefined || actualCost === null || isNaN(+actualCost)) {
    return res.status(400).json({ error: '请输入有效金额' })
  }
  const db = getDb()
  const r = db.prepare('SELECT user_id, status FROM requests WHERE id=?').get(req.params.id)
  if (!r) return res.status(404).json({ error: '申请不存在' })
  if (req.user.role !== 'teacher' && r.user_id !== req.user.id) {
    return res.status(403).json({ error: '无权限' })
  }
  db.prepare(`UPDATE requests SET actual_cost=?, updated_at=datetime('now','localtime') WHERE id=?`).run(+actualCost, req.params.id)
  res.json({ ok: true })
})

app.delete('/api/requests/:id', auth, teacherOnly, (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM requests WHERE id=?').run(req.params.id)
  res.json({ ok: true })
})

// ── Stats ─────────────────────────────────────────────────────────────────────

app.get('/api/stats/students', auth, teacherOnly, (req, res) => {
  const db = getDb()

  const summary = db.prepare(`
    SELECT
      u.id, u.name, u.student_id, u.enrolled_year, u.created_at,
      COUNT(r.id) AS total_requests,
      COUNT(CASE WHEN r.status IN ('approved','completed') THEN 1 END) AS approved_count,
      COALESCE(SUM(CASE WHEN r.status IN ('approved','completed') THEN r.estimated_budget ELSE 0 END), 0) AS total_estimated,
      COALESCE(SUM(CASE WHEN r.status IN ('approved','completed') AND r.actual_cost IS NOT NULL THEN r.actual_cost ELSE 0 END), 0) AS total_actual,
      COUNT(CASE WHEN r.status IN ('approved','completed') AND r.actual_cost IS NULL THEN 1 END) AS missing_actual
    FROM users u
    LEFT JOIN requests r ON r.user_id = u.id
    WHERE u.role = 'student'
    GROUP BY u.id
    ORDER BY u.enrolled_year DESC, u.name
  `).all()

  const byYear = db.prepare(`
    SELECT
      r.user_id,
      strftime('%Y', r.created_at) AS year,
      COUNT(r.id) AS count,
      COALESCE(SUM(r.estimated_budget), 0) AS estimated,
      COALESCE(SUM(CASE WHEN r.actual_cost IS NOT NULL THEN r.actual_cost ELSE 0 END), 0) AS actual,
      COUNT(CASE WHEN r.actual_cost IS NULL THEN 1 END) AS missing
    FROM requests r
    WHERE r.status IN ('approved','completed')
    GROUP BY r.user_id, year
    ORDER BY r.user_id, year DESC
  `).all()

  res.json({ summary, byYear })
})

// ── Admin Routes ──────────────────────────────────────────────────────────────

app.get('/api/admin/system', auth, adminOnly, (req, res) => {
  const db = getDb()
  const studentCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role='student'").get().n
  const teacherCount = db.prepare("SELECT COUNT(*) as n FROM users WHERE role='teacher'").get().n
  const reqTotal    = db.prepare("SELECT COUNT(*) as n FROM requests").get().n
  const reqPending  = db.prepare("SELECT COUNT(*) as n FROM requests WHERE status='pending'").get().n
  const reqApproved = db.prepare("SELECT COUNT(*) as n FROM requests WHERE status='approved'").get().n
  const reqCompleted= db.prepare("SELECT COUNT(*) as n FROM requests WHERE status='completed'").get().n
  const reqRejected = db.prepare("SELECT COUNT(*) as n FROM requests WHERE status='rejected'").get().n
  const totalActual = db.prepare("SELECT COALESCE(SUM(actual_cost),0) as s FROM requests WHERE status IN ('approved','completed') AND actual_cost IS NOT NULL").get().s
  const recentUsers = db.prepare("SELECT name, student_id, role, created_at FROM users WHERE role='student' ORDER BY created_at DESC LIMIT 5").all()
  const recentReqs  = db.prepare(`
    SELECT r.id, u.name as student_name, r.test_types, r.status, r.created_at
    FROM requests r JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 8
  `).all().map(r => ({ ...r, test_types: JSON.parse(r.test_types || '[]') }))

  res.json({
    users: { students: studentCount, teachers: teacherCount },
    requests: { total: reqTotal, pending: reqPending, approved: reqApproved, completed: reqCompleted, rejected: reqRejected },
    totalActual,
    recentUsers,
    recentReqs,
    uptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
  })
})

app.get('/api/admin/teachers', auth, adminOnly, (req, res) => {
  const db = getDb()
  const teachers = db.prepare("SELECT id, name, username, created_at FROM users WHERE role='teacher' ORDER BY created_at").all()
  res.json(teachers)
})

app.post('/api/admin/teachers', auth, adminOnly, (req, res) => {
  const { name, password } = req.body
  if (!name || !password) return res.status(400).json({ error: '请填写姓名和密码（手机号）' })
  const db = getDb()
  const exists = db.prepare('SELECT id FROM users WHERE username=?').get(name)
  if (exists) return res.status(400).json({ error: '该姓名已存在' })
  const id = genId('u')
  const hash = bcrypt.hashSync(password, 10)
  db.prepare(`INSERT INTO users (id, name, username, password_hash, role) VALUES (?, ?, ?, ?, 'teacher')`).run(id, name, name, hash)
  res.json({ ok: true, id })
})

app.delete('/api/admin/teachers/:id', auth, adminOnly, (req, res) => {
  const db = getDb()
  db.prepare("DELETE FROM users WHERE id=? AND role='teacher'").run(req.params.id)
  res.json({ ok: true })
})

// Fallback to React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lab Manager server running on port ${PORT}`)
  getDb() // Initialize DB on startup
})
