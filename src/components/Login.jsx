import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { login, register } = useApp()
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ username: '', password: '', name: '', studentId: '', confirm: '', enrolledYear: new Date().getFullYear() })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const doLogin = async (e) => {
    e.preventDefault(); setErr('')
    if (!f.username || !f.password) return setErr('请填写学号和密码')
    setLoading(true)
    const r = await login(f.username, f.password)
    setLoading(false)
    if (!r.ok) setErr(r.error)
  }

  const doRegister = async (e) => {
    e.preventDefault(); setErr('')
    if (!f.name || !f.studentId || !f.password) return setErr('请填写所有必填项')
    if (f.password !== f.confirm) return setErr('两次密码不一致')
    if (f.password.length < 6) return setErr('密码至少6位')
    setLoading(true)
    const r = await register({ name: f.name, studentId: f.studentId, password: f.password, enrolledYear: +f.enrolledYear })
    setLoading(false)
    if (!r.ok) setErr(r.error)
  }

  const switchMode = (m) => {
    setMode(m); setErr('')
    setF({ username: '', password: '', name: '', studentId: '', confirm: '', enrolledYear: new Date().getFullYear() })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 55%,#60a5fa 100%)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: '#fff', borderRadius: '16px', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontSize: '28px' }}>🔬</div>
          <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: '700', lineHeight: 1.3 }}>实验室测试申请系统</h1>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '13px', marginTop: '4px' }}>南昌航空大学 · 杨丽霞课题组</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {mode === 'login' ? (
            <>
              <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '20px' }}>登录</h2>
              <form onSubmit={doLogin}>
                {err && <div className="alert alert-err">{err}</div>}
                <div className="fg">
                  <label className="fl">学号 / 教师账号</label>
                  <input className="fi" value={f.username} onChange={e => set('username', e.target.value)} placeholder="输入学号或教师账号" autoFocus />
                </div>
                <div className="fg">
                  <label className="fl">密码</label>
                  <input className="fi" type="password" value={f.password} onChange={e => set('password', e.target.value)} placeholder="输入密码" />
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }} disabled={loading}>
                  {loading ? '登录中...' : '登录'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--g500)' }}>
                没有账号？
                <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
                  注册学生账号
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '6px' }}>注册学生账号</h2>
              <p style={{ fontSize: '12px', color: 'var(--g400)', marginBottom: '18px' }}>登录凭证为学号，请如实填写</p>
              <form onSubmit={doRegister}>
                {err && <div className="alert alert-err">{err}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label className="fl">姓名 *</label>
                    <input className="fi" value={f.name} onChange={e => set('name', e.target.value)} placeholder="真实姓名" />
                  </div>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label className="fl">入学年份 *</label>
                    <input className="fi" type="number" value={f.enrolledYear} onChange={e => set('enrolledYear', e.target.value)} placeholder="如 2023" min="2000" max="2099" />
                  </div>
                </div>
                <div className="fg" style={{ marginTop: '12px' }}>
                  <label className="fl">学号 * <span style={{ fontWeight: 400, color: 'var(--g400)' }}>（用于登录）</span></label>
                  <input className="fi" value={f.studentId} onChange={e => set('studentId', e.target.value)} placeholder="输入学号（即登录账号）" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label className="fl">密码 *</label>
                    <input className="fi" type="password" value={f.password} onChange={e => set('password', e.target.value)} placeholder="至少6位" />
                  </div>
                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label className="fl">确认密码 *</label>
                    <input className="fi" type="password" value={f.confirm} onChange={e => set('confirm', e.target.value)} placeholder="再次输入" />
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }} disabled={loading}>
                  {loading ? '注册中...' : '注册'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: 'var(--g500)' }}>
                已有账号？
                <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
                  返回登录
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
