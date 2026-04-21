import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { STATUS_CONFIG, TEST_TYPES } from '../utils/constants'
import Layout from './Layout'
import NewRequest from './NewRequest'
import RequestModal from './RequestModal'

function ReqCard({ req, onClick }) {
  const sc = STATUS_CONFIG[req.status]
  const typeIds = req.test_types.map(id => TEST_TYPES.find(t => t.id === id)?.id || id)
  const canFillCost = ['approved', 'completed'].includes(req.status) && req.actual_cost == null

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: '10px', padding: '14px 16px', boxShadow: 'var(--sh)', cursor: 'pointer', border: `1px solid ${canFillCost ? '#fcd34d' : 'var(--g100)'}`, transition: 'box-shadow .15s,transform .15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shm)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--sh)'; e.currentTarget.style.transform = '' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
            {typeIds.map((id, i) => <span key={i} className="tag" style={{ fontSize: '11px' }}>{id}</span>)}
            {req.urgency === 'urgent' && <span className="badge badge-rejected" style={{ fontSize: '11px' }}>紧急</span>}
            {canFillCost && <span className="badge" style={{ background: '#fffbeb', color: '#92400e', fontSize: '11px', border: '1px solid #fcd34d' }}>待填实际费用</span>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--g600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.sample_description}</div>
          <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '4px' }}>
            {new Date(req.created_at).toLocaleDateString('zh-CN')} · {req.sample_count} 个
            {req.estimated_budget > 0 && ` · 预算¥${req.estimated_budget}`}
            {req.actual_cost != null && <span style={{ color: 'var(--success)', fontWeight: '600' }}> · 实际¥{req.actual_cost}</span>}
          </div>
          {req.teacher_comment && (
            <div style={{ marginTop: '6px', padding: '5px 9px', background: req.status === 'approved' ? 'var(--success-l)' : 'var(--danger-l)', borderRadius: '6px', fontSize: '12px', color: 'var(--g700)' }}>
              老师意见：{req.teacher_comment}
            </div>
          )}
        </div>
        <span className={`badge ${sc.className}`} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{sc.label}</span>
      </div>
    </div>
  )
}

const TABS = [
  { v: 'all', l: '全部' },
  { v: 'pending', l: '待审批' },
  { v: 'approved', l: '已批准' },
  { v: 'rejected', l: '已拒绝' },
  { v: 'completed', l: '已完成' },
]

export default function StudentDashboard() {
  const { currentUser, requests } = useApp()
  const [view, setView] = useState('list')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [flash, setFlash] = useState('')

  const mine = requests
    .filter(r => r.user_id === currentUser.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const shown = filter === 'all' ? mine : mine.filter(r => r.status === filter)

  const stats = {
    total: mine.length,
    pending: mine.filter(r => r.status === 'pending').length,
    approved: mine.filter(r => r.status === 'approved').length,
    rejected: mine.filter(r => r.status === 'rejected').length,
  }
  const totalActual = mine.filter(r => r.actual_cost != null).reduce((s, r) => s + r.actual_cost, 0)
  const missingCost = mine.filter(r => ['approved', 'completed'].includes(r.status) && r.actual_cost == null).length

  if (view === 'new') {
    return (
      <NewRequest
        onBack={() => setView('list')}
        onDone={() => {
          setView('list')
          setFlash('申请已提交，等待老师审批')
          setTimeout(() => setFlash(''), 4000)
        }}
      />
    )
  }

  return (
    <Layout title="我的申请" actions={<button className="btn btn-primary" onClick={() => setView('new')}>+ 新建申请</button>}>
      {flash && <div className="alert alert-ok">{flash}</div>}
      {missingCost > 0 && (
        <div className="alert alert-info" style={{ marginBottom: '14px' }}>
          有 {missingCost} 个已批准/完成的申请还未填写实际费用，点击申请卡片填写
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '18px' }}>
        {[
          { l: '全部', v: stats.total, c: 'var(--g800)' },
          { l: '待审批', v: stats.pending, c: '#92400e' },
          { l: '已批准', v: stats.approved, c: '#065f46' },
          { l: '累计实际费用', v: `¥${totalActual.toFixed(0)}`, c: 'var(--primary)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: i === 3 ? '18px' : '22px', fontWeight: '700', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '2px' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '3px', marginBottom: '14px', background: '#fff', padding: '4px', borderRadius: '8px', boxShadow: 'var(--sh)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.v} onClick={() => setFilter(tab.v)} style={{
            padding: '5px 12px', border: 'none', borderRadius: '6px',
            background: filter === tab.v ? 'var(--primary)' : 'transparent',
            color: filter === tab.v ? '#fff' : 'var(--g600)',
            cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all .15s',
          }}>{tab.l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '44px', color: 'var(--g400)' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📋</div>
          <div style={{ marginBottom: '12px' }}>暂无申请记录</div>
          {filter === 'all' && <button className="btn btn-primary" onClick={() => setView('new')}>立即提交申请</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {shown.map(req => <ReqCard key={req.id} req={req} onClick={() => setSelectedId(req.id)} />)}
        </div>
      )}

      {selectedId && <RequestModal requestId={selectedId} onClose={() => setSelectedId(null)} isTeacher={false} />}
    </Layout>
  )
}
