import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TEST_TYPES, STATUS_CONFIG } from '../utils/constants'

function Row({ label, children }) {
  return (
    <div className="dr">
      <div className="dl">{label}</div>
      <div className="dv">{children}</div>
    </div>
  )
}

export default function RequestModal({ requestId, onClose, isTeacher }) {
  const { requests, approveRequest, rejectRequest, completeRequest, setActualCost } = useApp()
  const request = requests.find(r => r.id === requestId)
  const [comment, setComment] = useState('')
  const [step, setStep] = useState(null) // 'approve' | 'reject'
  const [costInput, setCostInput] = useState('')
  const [showCostInput, setShowCostInput] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  if (!request) return null

  const sc = STATUS_CONFIG[request.status]
  const typeNames = request.test_types.map(id => TEST_TYPES.find(t => t.id === id)?.name || id)

  const canFillCost = ['approved', 'completed'].includes(request.status)
  const fmt = iso => new Date(iso).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  const saveCost = async () => {
    if (!costInput && costInput !== '0') return setErr('请输入金额')
    if (isNaN(+costInput) || +costInput < 0) return setErr('请输入有效金额')
    setSaving(true); setErr('')
    try {
      await setActualCost(request.id, +costInput)
      setShowCostInput(false); setCostInput('')
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mh">
          <div>
            <div className="mt">申请详情</div>
            <div style={{ fontSize: '11px', color: 'var(--g400)', marginTop: '2px' }}>{request.id}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: 'var(--g400)', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        <div className="mb">
          {/* Status */}
          <div style={{ display: 'flex', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span className={`badge ${sc.className}`}>{sc.label}</span>
            {request.urgency === 'urgent' && <span className="badge badge-rejected">紧急</span>}
          </div>

          {err && <div className="alert alert-err" style={{ marginBottom: '10px' }}>{err}</div>}

          <Row label="申请人">{request.student_name}{request.student_number ? `（${request.student_number}）` : ''}</Row>
          <Row label="申请时间">{fmt(request.created_at)}</Row>
          <Row label="测试项目">
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {typeNames.map((n, i) => <span key={i} className="tag">{n}</span>)}
            </div>
          </Row>
          <Row label="样品描述">{request.sample_description}</Row>
          <Row label="样品数量">{request.sample_count} 个</Row>
          <Row label="预算金额">
            <span style={{ fontWeight: '500' }}>¥{request.estimated_budget || 0}</span>
          </Row>

          {/* Actual cost row */}
          <Row label="实际费用">
            {request.actual_cost != null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: '600', color: 'var(--success)', fontSize: '15px' }}>¥{request.actual_cost}</span>
                {canFillCost && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setCostInput(String(request.actual_cost)); setShowCostInput(true) }}>修改</button>
                )}
              </div>
            ) : canFillCost ? (
              <span style={{ color: 'var(--warning)', fontSize: '13px', fontWeight: '500' }}>待填写</span>
            ) : (
              <span style={{ color: 'var(--g400)' }}>—</span>
            )}
          </Row>

          {/* Fill actual cost */}
          {canFillCost && showCostInput && (
            <div style={{ margin: '10px 0', padding: '12px', background: 'var(--g50)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: 'var(--g700)' }}>填写实际发生费用</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className="fi" style={{ flex: 1 }} type="number" min="0" step="0.01" value={costInput} onChange={e => setCostInput(e.target.value)} placeholder="实际金额（元）" autoFocus />
                <button className="btn btn-success btn-sm" onClick={saveCost} disabled={saving}>{saving ? '保存中' : '确认'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowCostInput(false); setCostInput('') }}>取消</button>
              </div>
            </div>
          )}

          {canFillCost && !showCostInput && request.actual_cost == null && (
            <div style={{ margin: '10px 0' }}>
              <button className="btn btn-sm" style={{ background: 'var(--warning-l)', color: '#92400e', border: '1px solid #fcd34d' }} onClick={() => setShowCostInput(true)}>
                + 填写实际费用
              </button>
            </div>
          )}

          <Row label="测试目的">{request.purpose}</Row>
          {request.notes && <Row label="备注">{request.notes}</Row>}

          {/* Teacher comment */}
          {(request.teacher_comment || request.approved_by) && (
            <div style={{ marginTop: '14px', padding: '10px 12px', background: request.status === 'approved' ? 'var(--success-l)' : request.status === 'rejected' ? 'var(--danger-l)' : 'var(--warning-l)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--g500)' }}>
                  {request.status === 'approved' ? '批准' : '拒绝'}意见
                  {request.approved_by && <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: '700' }}>· {request.approved_by}</span>}
                </div>
                {request.approved_at && <div style={{ fontSize: '11px', color: 'var(--g400)' }}>{fmt(request.approved_at)}</div>}
              </div>
              {request.teacher_comment && <div style={{ fontSize: '13px', color: 'var(--g800)' }}>{request.teacher_comment}</div>}
            </div>
          )}

          {/* Teacher: approve/reject */}
          {isTeacher && request.status === 'pending' && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--g200)' }}>
              <div className="fg">
                <label className="fl">
                  审批意见
                  {step === 'reject' && <span style={{ color: 'var(--danger)', fontWeight: 400 }}> （拒绝时必填）</span>}
                </label>
                <textarea className="fi" rows={3} value={comment} onChange={e => setComment(e.target.value)}
                  placeholder={step === 'reject' ? '填写拒绝原因（必填）' : '填写审批意见（可选）'} />
              </div>
              {step !== 'reject' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}
                    onClick={async () => { setSaving(true); setErr(''); try { await approveRequest(request.id, comment); onClose() } catch(e) { setErr(e.message) } setSaving(false) }}>
                    {saving ? '处理中...' : '批准'}
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep('reject')}>拒绝</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(null)}>取消</button>
                  <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                    disabled={!comment.trim() || saving}
                    onClick={async () => { setSaving(true); setErr(''); try { await rejectRequest(request.id, comment); onClose() } catch(e) { setErr(e.message) } setSaving(false) }}>
                    {saving ? '处理中...' : '确认拒绝'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Teacher: mark complete */}
          {isTeacher && request.status === 'approved' && (
            <div style={{ marginTop: '14px' }}>
              <button className="btn" style={{ width: '100%', justifyContent: 'center', background: 'var(--info-l)', color: 'var(--info)', border: '1px solid #c7d2fe' }}
                onClick={async () => { await completeRequest(request.id); onClose() }}>
                标记为已完成
              </button>
            </div>
          )}
        </div>

        <div className="mf">
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}
