import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { STATUS_CONFIG, TEST_TYPES } from '../utils/constants'
import { api } from '../utils/api'
import Layout from './Layout'
import RequestModal from './RequestModal'

// ── Approval Tab ──────────────────────────────────────────────────────────────

const FTABS = [
  { v: 'pending', l: '待审批' },
  { v: 'approved', l: '已批准' },
  { v: 'rejected', l: '已拒绝' },
  { v: 'completed', l: '已完成' },
  { v: 'all', l: '全部' },
]

function ApprovalTab({ requests, refreshRequests }) {
  const { deleteRequest } = useApp()
  const [filter, setFilter] = useState('pending')
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [delConfirm, setDelConfirm] = useState(null)

  const cnt = s => requests.filter(r => r.status === s).length
  const pendingCount = cnt('pending')

  const sorted = [...requests].sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'urgent' ? -1 : 1
    return new Date(b.created_at) - new Date(a.created_at)
  })

  const afterFilter = sorted.filter(r => filter === 'all' || r.status === filter)
  const shown = search.trim()
    ? afterFilter.filter(r =>
        r.student_name.includes(search) || r.student_number?.includes(search) ||
        r.sample_description?.includes(search))
    : afterFilter

  const handleDelete = async (id) => {
    try {
      await deleteRequest(id)
      setDelConfirm(null)
    } catch (e) { alert(e.message) }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '3px', background: '#fff', padding: '4px', borderRadius: '8px', boxShadow: 'var(--sh)' }}>
          {FTABS.map(tab => (
            <button key={tab.v} onClick={() => setFilter(tab.v)} style={{
              padding: '5px 11px', border: 'none', borderRadius: '6px',
              background: filter === tab.v ? 'var(--primary)' : 'transparent',
              color: filter === tab.v ? '#fff' : 'var(--g600)',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all .15s', whiteSpace: 'nowrap',
            }}>
              {tab.l}{tab.v === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>
        <input className="fi" style={{ maxWidth: '200px', fontSize: '13px' }} value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名/学号..." />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {shown.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>
            <div style={{ fontSize: '34px', marginBottom: '10px' }}>✅</div>
            <div>暂无{filter === 'pending' ? '待审批' : ''}申请</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr>
                <th>申请人</th><th>测试项目</th><th>样品描述</th>
                <th>数量</th><th>预算</th><th>实际费用</th><th>状态</th><th>申请时间</th><th></th>
              </tr></thead>
              <tbody>
                {shown.map(req => {
                  const sc = STATUS_CONFIG[req.status]
                  const typeIds = req.test_types.map(id => TEST_TYPES.find(t => t.id === id)?.id || id)
                  return (
                    <tr key={req.id}>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer' }}>
                        <div style={{ fontWeight: '500' }}>{req.student_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{req.student_number}</div>
                      </td>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {typeIds.map((id, i) => <span key={i} className="tag" style={{ fontSize: '11px' }}>{id}</span>)}
                        </div>
                      </td>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer', maxWidth: '150px' }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--g600)', fontSize: '12px' }}>{req.sample_description}</div>
                      </td>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer' }}>{req.sample_count}</td>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer', color: 'var(--g600)', fontSize: '12px' }}>{req.estimated_budget > 0 ? `¥${req.estimated_budget}` : '—'}</td>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer' }}>
                        {req.actual_cost != null
                          ? <span style={{ color: 'var(--success)', fontWeight: '600' }}>¥{req.actual_cost}</span>
                          : ['approved', 'completed'].includes(req.status)
                          ? <span style={{ color: 'var(--warning)', fontSize: '12px' }}>待填写</span>
                          : <span style={{ color: 'var(--g300)' }}>—</span>}
                      </td>
                      <td onClick={() => setSelectedId(req.id)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className={`badge ${sc.className}`}>{sc.label}</span>
                          {req.urgency === 'urgent' && <span className="badge badge-rejected" style={{ fontSize: '11px' }}>紧急</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--g400)', whiteSpace: 'nowrap' }} onClick={() => setSelectedId(req.id)}>
                        {new Date(req.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td>
                        {delConfirm === req.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(req.id)}>确认</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setDelConfirm(null)}>取消</button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-l)' }} onClick={() => setDelConfirm(req.id)}>删除</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && <RequestModal requestId={selectedId} onClose={() => setSelectedId(null)} isTeacher={true} />}
    </>
  )
}

// ── Chart helpers ─────────────────────────────────────────────────────────────

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6']

function BarChart({ data, valueKey, labelKey, colorKey, height = 160, unit = '' }) {
  if (!data || data.length === 0) return <div style={{ color: 'var(--g400)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>暂无数据</div>
  const max = Math.max(...data.map(d => d[valueKey] || 0))
  if (max === 0) return <div style={{ color: 'var(--g400)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>暂无数据</div>
  const barW = Math.max(24, Math.min(56, Math.floor(300 / data.length) - 10))
  const gap = Math.max(8, Math.min(18, Math.floor(300 / data.length) / 3))
  const svgW = data.length * (barW + gap) + gap
  const svgH = height
  const plotH = svgH - 40

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: '100%' }}>
        {data.map((d, i) => {
          const val = d[valueKey] || 0
          const bh = max > 0 ? Math.round((val / max) * plotH) : 0
          const x = gap + i * (barW + gap)
          const color = colorKey ? d[colorKey] : CHART_COLORS[i % CHART_COLORS.length]
          return (
            <g key={i}>
              <rect x={x} y={svgH - 30 - bh} width={barW} height={bh} rx={4} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={svgH - 33 - bh} textAnchor="middle" fontSize="11" fill="var(--g600)" fontWeight="600">
                {unit}{val > 999 ? `${(val / 1000).toFixed(1)}k` : val > 0 ? (Number.isInteger(val) ? val : val.toFixed(0)) : ''}
              </text>
              <text x={x + barW / 2} y={svgH - 8} textAnchor="middle" fontSize="10" fill="var(--g500)">
                {String(d[labelKey]).length > 5 ? String(d[labelKey]).slice(0, 5) + '…' : d[labelKey]}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function MiniDonut({ data, size = 130 }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0)
  if (total === 0) return <div style={{ color: 'var(--g400)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>暂无数据</div>
  const r = 46, cx = 65, cy = 65, sw = 18
  let offset = -90
  const arcs = data.map(d => {
    const angle = (d.value / total) * 360
    const start = offset; offset += angle
    return { ...d, start, angle }
  })
  const toXY = (deg, rad) => ({ x: cx + rad * Math.cos(deg * Math.PI / 180), y: cy + rad * Math.sin(deg * Math.PI / 180) })
  const arcPath = (s, sweep, rad) => {
    if (sweep >= 360) sweep = 359.99
    const a = toXY(s, rad), b = toXY(s + sweep, rad)
    return `M ${a.x} ${a.y} A ${rad} ${rad} 0 ${sweep > 180 ? 1 : 0} 1 ${b.x} ${b.y}`
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox="0 0 130 130" style={{ flexShrink: 0 }}>
        {arcs.map((d, i) => (
          <path key={i} d={arcPath(d.start, d.angle, r)} fill="none" stroke={d.color} strokeWidth={sw} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--g800)">{total}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="10" fill="var(--g400)">total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '2px', background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--g700)' }}>{d.label}</span>
            <span style={{ fontWeight: '600', color: 'var(--g800)' }}>{d.value}</span>
            <span style={{ color: 'var(--g400)', fontSize: '10px' }}>({Math.round(d.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stats Tab ─────────────────────────────────────────────────────────────────

const STAT_DIMS = [
  { v: 'student', l: '学生维度' },
  { v: 'year', l: '年度维度' },
  { v: 'type', l: '测试项目维度' },
]

function DimTab({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '3px', marginBottom: '14px', background: '#fff', padding: '4px', borderRadius: '8px', boxShadow: 'var(--sh)', width: 'fit-content' }}>
      {STAT_DIMS.map(d => (
        <button key={d.v} onClick={() => onChange(d.v)} style={{
          padding: '5px 14px', border: 'none', borderRadius: '6px',
          background: active === d.v ? 'var(--info)' : 'transparent',
          color: active === d.v ? '#fff' : 'var(--g600)',
          cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all .15s',
        }}>{d.l}</button>
      ))}
    </div>
  )
}

function StatsTab({ requests }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [dim, setDim] = useState('student')

  useEffect(() => {
    api.getStudentStats().then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>加载中...</div>
  if (!data) return <div className="alert alert-err">加载失败</div>

  const { summary, byYear } = data

  const yearMap = {}
  byYear.forEach(row => {
    if (!yearMap[row.user_id]) yearMap[row.user_id] = []
    yearMap[row.user_id].push(row)
  })

  // Per-student test type breakdown from requests
  const studentTypeMap = {}
  requests.filter(r => ['approved', 'completed'].includes(r.status)).forEach(r => {
    if (!studentTypeMap[r.user_id]) studentTypeMap[r.user_id] = {}
    r.test_types.forEach(t => {
      if (!studentTypeMap[r.user_id][t]) studentTypeMap[r.user_id][t] = { count: 0, actual: 0 }
      studentTypeMap[r.user_id][t].count++
      studentTypeMap[r.user_id][t].actual += r.actual_cost || 0
    })
  })

  const totalEstimated = summary.reduce((s, r) => s + (r.total_estimated || 0), 0)
  const totalActual = summary.reduce((s, r) => s + (r.total_actual || 0), 0)
  const totalApproved = summary.reduce((s, r) => s + (r.approved_count || 0), 0)

  // Year dimension: aggregate byYear across all students
  const yearAgg = {}
  byYear.forEach(row => {
    if (!yearAgg[row.year]) yearAgg[row.year] = { year: row.year, count: 0, estimated: 0, actual: 0, missing: 0 }
    yearAgg[row.year].count += row.count
    yearAgg[row.year].estimated += row.estimated || 0
    yearAgg[row.year].actual += row.actual || 0
    yearAgg[row.year].missing += row.missing || 0
  })
  const yearRows = Object.values(yearAgg).sort((a, b) => b.year - a.year)

  // Test type dimension: compute from all approved/completed requests
  const typeAgg = {}
  requests.filter(r => ['approved', 'completed'].includes(r.status)).forEach(r => {
    r.test_types.forEach(t => {
      if (!typeAgg[t]) typeAgg[t] = { id: t, count: 0, estimated: 0, actual: 0 }
      typeAgg[t].count++
      typeAgg[t].estimated += r.estimated_budget || 0
      typeAgg[t].actual += r.actual_cost || 0
    })
  })
  const typeRows = Object.values(typeAgg).sort((a, b) => b.count - a.count)

  return (
    <div>
      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
        {[
          { l: '注册学生', v: summary.length, c: 'var(--g800)' },
          { l: '批准总次数', v: totalApproved, c: 'var(--primary)' },
          { l: '预算合计', v: `¥${totalEstimated.toFixed(0)}`, c: 'var(--g700)' },
          { l: '实际费用合计', v: `¥${totalActual.toFixed(0)}`, c: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: i >= 2 ? '18px' : '22px', fontWeight: '700', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '2px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {(yearRows.length > 0 || typeRows.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          {yearRows.length > 0 && (
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--g700)', marginBottom: '12px' }}>按年度实际费用 (¥)</div>
              <BarChart
                data={[...yearRows].reverse()}
                valueKey="actual"
                labelKey="year"
                height={150}
                unit="¥"
              />
            </div>
          )}
          {typeRows.length > 0 && (
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--g700)', marginBottom: '12px' }}>测试项目分布</div>
              <MiniDonut
                data={typeRows.slice(0, 8).map((t, i) => ({
                  label: t.id,
                  value: t.count,
                  color: CHART_COLORS[i % CHART_COLORS.length],
                }))}
              />
            </div>
          )}
          {typeRows.length > 0 && (
            <div className="card">
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--g700)', marginBottom: '12px' }}>各项目实际费用 (¥)</div>
              <BarChart
                data={typeRows.slice(0, 10).map((t, i) => ({ ...t, color: CHART_COLORS[i % CHART_COLORS.length] }))}
                valueKey="actual"
                labelKey="id"
                colorKey="color"
                height={150}
                unit="¥"
              />
            </div>
          )}
        </div>
      )}

      <DimTab active={dim} onChange={setDim} />

      {/* Student dimension */}
      {dim === 'student' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {summary.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>暂无学生数据</div>
          ) : (
            <table className="tbl">
              <thead><tr>
                <th>姓名</th><th>学号</th><th>入学年份</th><th>批准次数</th>
                <th>预算合计</th><th>实际费用</th><th>未填写</th><th>年度明细</th>
              </tr></thead>
              <tbody>
                {summary.map(s => {
                  const years = yearMap[s.id] || []
                  const isOpen = expanded[s.id]
                  return (
                    <>
                      <tr key={s.id} style={{ background: isOpen ? 'var(--g50)' : '' }}>
                        <td style={{ fontWeight: '500' }}>{s.name}</td>
                        <td style={{ color: 'var(--g500)', fontFamily: 'monospace', fontSize: '12px' }}>{s.student_id}</td>
                        <td>{s.enrolled_year || '—'}</td>
                        <td>{s.approved_count}</td>
                        <td style={{ color: 'var(--g700)' }}>{s.total_estimated > 0 ? `¥${s.total_estimated.toFixed(0)}` : '—'}</td>
                        <td style={{ fontWeight: '600', color: 'var(--success)' }}>{s.total_actual > 0 ? `¥${s.total_actual.toFixed(0)}` : '—'}</td>
                        <td>
                          {s.missing_actual > 0
                            ? <span className="badge badge-pending">{s.missing_actual} 项</span>
                            : <span style={{ color: 'var(--g300)' }}>—</span>}
                        </td>
                        <td>
                          {(years.length > 0 || studentTypeMap[s.id]) && (
                            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(p => ({ ...p, [s.id]: !p[s.id] }))}>
                              {isOpen ? '收起' : '明细'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && years.map(y => (
                        <tr key={`${s.id}-${y.year}`} style={{ background: '#f8f9ff' }}>
                          <td colSpan={2} style={{ paddingLeft: '28px', fontSize: '12px', color: 'var(--g500)' }}>↳ {y.year} 年</td>
                          <td></td>
                          <td style={{ fontSize: '12px', color: 'var(--g600)' }}>{y.count} 次</td>
                          <td style={{ fontSize: '12px', color: 'var(--g600)' }}>{y.estimated > 0 ? `¥${y.estimated.toFixed(0)}` : '—'}</td>
                          <td style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>{y.actual > 0 ? `¥${y.actual.toFixed(0)}` : '—'}</td>
                          <td style={{ fontSize: '12px', color: 'var(--warning)' }}>{y.missing > 0 ? `${y.missing} 项` : ''}</td>
                          <td></td>
                        </tr>
                      ))}
                      {isOpen && (() => {
                        const types = studentTypeMap[s.id] || {}
                        const typeEntries = Object.entries(types).sort((a, b) => b[1].count - a[1].count)
                        if (!typeEntries.length) return null
                        return (
                          <tr style={{ background: '#f0f4ff' }}>
                            <td colSpan={8} style={{ paddingLeft: '28px', paddingTop: '8px', paddingBottom: '8px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--g400)', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.04em' }}>测试项目明细</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {typeEntries.map(([type, info]) => (
                                  <span key={type} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', background: '#fff', borderRadius: '12px', border: '1px solid var(--g200)', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{type}</span>
                                    <span style={{ color: 'var(--g400)' }}>×{info.count}</span>
                                    {info.actual > 0 && <span style={{ color: 'var(--success)', fontWeight: '500' }}>¥{info.actual.toFixed(0)}</span>}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })()}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Year dimension */}
      {dim === 'year' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {yearRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>暂无数据</div>
          ) : (
            <table className="tbl">
              <thead><tr>
                <th>年份</th><th>批准次数</th><th>预算合计</th><th>实际费用</th><th>未填写</th>
              </tr></thead>
              <tbody>
                {yearRows.map(y => (
                  <tr key={y.year}>
                    <td style={{ fontWeight: '600', fontSize: '15px', color: 'var(--primary)' }}>{y.year}</td>
                    <td>{y.count} 次</td>
                    <td style={{ color: 'var(--g700)' }}>{y.estimated > 0 ? `¥${y.estimated.toFixed(0)}` : '—'}</td>
                    <td style={{ fontWeight: '600', color: 'var(--success)' }}>{y.actual > 0 ? `¥${y.actual.toFixed(0)}` : '—'}</td>
                    <td>{y.missing > 0 ? <span className="badge badge-pending">{y.missing} 项</span> : <span style={{ color: 'var(--g300)' }}>—</span>}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--g50)', fontWeight: '600' }}>
                  <td>合计</td>
                  <td>{yearRows.reduce((s, y) => s + y.count, 0)} 次</td>
                  <td>¥{yearRows.reduce((s, y) => s + y.estimated, 0).toFixed(0)}</td>
                  <td style={{ color: 'var(--success)' }}>¥{yearRows.reduce((s, y) => s + y.actual, 0).toFixed(0)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Test type dimension */}
      {dim === 'type' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {typeRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>暂无数据</div>
          ) : (
            <table className="tbl">
              <thead><tr>
                <th>测试项目</th><th>批准次数</th><th>预算合计</th><th>实际费用</th><th>占比</th>
              </tr></thead>
              <tbody>
                {typeRows.map(t => {
                  const pct = totalApproved > 0 ? Math.round(t.count / totalApproved * 100) : 0
                  return (
                    <tr key={t.id}>
                      <td><span className="tag">{t.id}</span></td>
                      <td>{t.count} 次</td>
                      <td style={{ color: 'var(--g700)' }}>{t.estimated > 0 ? `¥${t.estimated.toFixed(0)}` : '—'}</td>
                      <td style={{ fontWeight: '600', color: 'var(--success)' }}>{t.actual > 0 ? `¥${t.actual.toFixed(0)}` : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '60px', height: '6px', background: 'var(--g200)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--g500)' }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState(null)
  const [loading, setLoading] = useState(true)
  const [delConfirm, setDelConfirm] = useState(null)

  const loadUsers = () => {
    setLoading(true)
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [])

  const handleDelete = async (id) => {
    try {
      await api.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      setDelConfirm(null)
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>加载中...</div>
  if (!users) return <div className="alert alert-err">加载失败</div>

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom: '14px' }}>
        删除账户将同时删除该学生的所有申请记录，操作不可恢复。
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>暂无注册学生</div>
        ) : (
          <table className="tbl">
            <thead><tr>
              <th>姓名</th><th>学号</th><th>入学年份</th><th>申请次数</th><th>注册时间</th><th>操作</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '500' }}>{u.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--g500)' }}>{u.student_id}</td>
                  <td>{u.enrolled_year || '—'}</td>
                  <td>{u.approved_count} / {u.request_count} 次</td>
                  <td style={{ fontSize: '11px', color: 'var(--g400)' }}>{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                  <td>
                    {delConfirm === u.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--danger)' }}>确认删除（含记录）？</span>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>确认</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDelConfirm(null)}>取消</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', borderColor: 'var(--danger-l)' }} onClick={() => setDelConfirm(u.id)}>
                        删除账户
                      </button>
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

// ── Main Dashboard ────────────────────────────────────────────────────────────

const MAIN_TABS = [
  { v: 'approval', l: '审批管理' },
  { v: 'stats', l: '费用统计' },
  { v: 'users', l: '账户管理' },
]

export default function TeacherDashboard() {
  const { requests } = useApp()
  const [tab, setTab] = useState('approval')

  const cnt = s => requests.filter(r => r.status === s).length
  const pendingCount = cnt('pending')

  return (
    <Layout title="杨丽霞课题组 · 实验室管理">
      {/* Stats overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { l: '待审批', v: pendingCount, bg: 'var(--warning-l)', c: '#92400e' },
          { l: '已批准', v: cnt('approved'), bg: 'var(--success-l)', c: '#065f46' },
          { l: '已完成', v: cnt('completed'), bg: 'var(--info-l)', c: '#3730a3' },
          { l: '已拒绝', v: cnt('rejected'), bg: 'var(--danger-l)', c: '#991b1b' },
          { l: '总申请', v: requests.length, bg: 'var(--g100)', c: 'var(--g700)' },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: '10px', padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--g500)', marginTop: '2px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '18px', background: '#fff', padding: '4px', borderRadius: '8px', boxShadow: 'var(--sh)', width: 'fit-content' }}>
        {MAIN_TABS.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{
            padding: '7px 20px', border: 'none', borderRadius: '6px',
            background: tab === t.v ? 'var(--primary)' : 'transparent',
            color: tab === t.v ? '#fff' : 'var(--g600)',
            cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all .15s',
          }}>
            {t.l}{t.v === 'approval' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {tab === 'approval' && <ApprovalTab requests={requests} />}
      {tab === 'stats' && <StatsTab requests={requests} />}
      {tab === 'users' && <UsersTab />}
    </Layout>
  )
}
