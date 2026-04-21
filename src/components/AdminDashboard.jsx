import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import Layout from './Layout'

const STATUS_COLOR = {
  pending: '#f59e0b', approved: '#10b981', completed: '#6366f1', rejected: '#ef4444',
}

// ── Simple bar chart (pure CSS/SVG, no dependency needed beyond recharts) ─────

function MiniBar({ value, max, color = 'var(--primary)', label, sub }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: 'var(--g700)', fontWeight: '500' }}>{label}</span>
        <span style={{ color: 'var(--g500)' }}>{sub || value}</span>
      </div>
      <div style={{ height: '8px', background: 'var(--g100)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width .6s ease' }} />
      </div>
    </div>
  )
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────────

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--g400)', fontSize: '13px', padding: '20px' }}>暂无数据</div>
  const r = 50, cx = 70, cy = 70, stroke = 22
  let offset = -90
  const arcs = data.map(d => {
    const angle = (d.value / total) * 360
    const start = offset
    offset += angle
    return { ...d, start, angle }
  })

  const polarToXY = (deg, radius) => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const arcPath = (startDeg, sweepDeg, radius) => {
    if (sweepDeg >= 360) sweepDeg = 359.99
    const start = polarToXY(startDeg, radius)
    const end = polarToXY(startDeg + sweepDeg, radius)
    const large = sweepDeg > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 140 140">
        {arcs.map((d, i) => (
          <path key={i} d={arcPath(d.start, d.angle, r)} fill="none" stroke={d.color} strokeWidth={stroke} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--g800)">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="var(--g400)">总申请</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--g700)' }}>{d.label}</span>
            <span style={{ fontWeight: '600', color: 'var(--g800)' }}>{d.value}</span>
            <span style={{ color: 'var(--g400)', fontSize: '11px' }}>({Math.round(d.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── System Overview Tab ───────────────────────────────────────────────────────

function SystemTab() {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSystemInfo().then(setInfo).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--g400)' }}>加载中...</div>
  if (!info) return <div className="alert alert-err">加载失败</div>

  const { users, requests, totalActual, recentUsers, recentReqs, uptime } = info
  const uptimeStr = uptime < 60 ? `${uptime}秒` : uptime < 3600 ? `${Math.floor(uptime / 60)}分钟` : `${Math.floor(uptime / 3600)}小时${Math.floor((uptime % 3600) / 60)}分钟`

  const donutData = [
    { label: '待审批', value: requests.pending, color: STATUS_COLOR.pending },
    { label: '已批准', value: requests.approved, color: STATUS_COLOR.approved },
    { label: '已完成', value: requests.completed, color: STATUS_COLOR.completed },
    { label: '已拒绝', value: requests.rejected, color: STATUS_COLOR.rejected },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
        {[
          { l: '注册学生', v: users.students, bg: 'var(--primary-l)', c: 'var(--primary)' },
          { l: '教师账号', v: users.teachers, bg: 'var(--info-l)', c: 'var(--info)' },
          { l: '总申请数', v: requests.total, bg: 'var(--g100)', c: 'var(--g800)' },
          { l: '实际费用合计', v: `¥${Number(totalActual).toFixed(0)}`, bg: 'var(--success-l)', c: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: i === 3 ? '18px' : '26px', fontWeight: '700', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--g500)', marginTop: '3px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Donut chart */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--g800)' }}>申请状态分布</div>
          <DonutChart data={donutData} />
        </div>

        {/* Request bar breakdown */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: 'var(--g800)' }}>各状态数量</div>
          {donutData.map(d => (
            <MiniBar key={d.label} label={d.label} value={d.value} max={requests.total} color={d.color} />
          ))}
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--g100)', fontSize: '12px', color: 'var(--g400)' }}>
            服务运行时间：{uptimeStr}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Recent students */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px', color: 'var(--g800)' }}>最近注册学生</div>
          {recentUsers.length === 0 ? (
            <div style={{ color: 'var(--g400)', fontSize: '13px' }}>暂无</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentUsers.map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--g50)', borderRadius: '7px' }}>
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '13px' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)', fontFamily: 'monospace' }}>{u.student_id}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{new Date(u.created_at).toLocaleDateString('zh-CN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent requests */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px', color: 'var(--g800)' }}>最近申请动态</div>
          {recentReqs.length === 0 ? (
            <div style={{ color: 'var(--g400)', fontSize: '13px' }}>暂无</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentReqs.map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'var(--g50)', borderRadius: '7px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '500', fontSize: '13px' }}>{r.student_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{r.test_types.join(' · ') || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: STATUS_COLOR[r.status] }}>
                      {{pending:'待审批',approved:'已批准',completed:'已完成',rejected:'已拒绝'}[r.status]}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{new Date(r.created_at).toLocaleDateString('zh-CN')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Teacher Management Tab ────────────────────────────────────────────────────

function TeachersTab() {
  const [teachers, setTeachers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', password: '' })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [delConfirm, setDelConfirm] = useState(null)

  const load = () => {
    setLoading(true)
    api.getTeachers().then(setTeachers).catch(console.error).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const add = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.name || !form.password) return setErr('请填写姓名和密码')
    setSaving(true)
    try {
      await api.addTeacher(form.name, form.password)
      setForm({ name: '', password: '' })
      load()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  const del = async (id) => {
    try { await api.deleteTeacher(id); load(); setDelConfirm(null) } catch (e) { alert(e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add teacher form */}
      <div className="card">
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>添加新教师账号</div>
        <form onSubmit={add}>
          {err && <div className="alert alert-err">{err}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label className="fl">姓名（即登录账号）</label>
              <input className="fi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="如：王老师" />
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label className="fl">密码（建议手机号）</label>
              <input className="fi" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="设置登录密码" />
            </div>
            <button className="btn btn-primary" disabled={saving}>{saving ? '添加中...' : '添加'}</button>
          </div>
        </form>
      </div>

      {/* Teacher list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--g100)', fontSize: '14px', fontWeight: '600' }}>教师账号列表</div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--g400)' }}>加载中...</div>
        ) : !teachers || teachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--g400)' }}>暂无教师账号</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>姓名 / 登录账号</th><th>创建时间</th><th>操作</th></tr></thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--g400)' }}>账号：{t.username}</div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--g400)' }}>{new Date(t.created_at).toLocaleDateString('zh-CN')}</td>
                  <td>
                    {delConfirm === t.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--danger)' }}>确认删除？</span>
                        <button className="btn btn-danger btn-sm" onClick={() => del(t.id)}>确认</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDelConfirm(null)}>取消</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-l)' }} onClick={() => setDelConfirm(t.id)}>删除</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS = [
  { v: 'system', l: '系统概览' },
  { v: 'teachers', l: '教师管理' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('system')

  return (
    <Layout title="系统管理后台">
      <div style={{ display: 'flex', gap: '3px', marginBottom: '18px', background: '#fff', padding: '4px', borderRadius: '8px', boxShadow: 'var(--sh)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{
            padding: '7px 22px', border: 'none', borderRadius: '6px',
            background: tab === t.v ? 'var(--g800)' : 'transparent',
            color: tab === t.v ? '#fff' : 'var(--g600)',
            cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all .15s',
          }}>{t.l}</button>
        ))}
      </div>

      {tab === 'system' && <SystemTab />}
      {tab === 'teachers' && <TeachersTab />}
    </Layout>
  )
}
