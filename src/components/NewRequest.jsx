import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { TEST_TYPES } from '../utils/constants'
import Layout from './Layout'

export default function NewRequest({ onBack, onDone }) {
  const { submitRequest } = useApp()
  const [f, setF] = useState({
    testTypes: [],
    sampleDescription: '',
    sampleCount: 1,
    budget: '',
    purpose: '',
    notes: '',
    urgency: 'normal',
  })
  const [err, setErr] = useState('')

  const toggleType = (id) => setF(p => ({
    ...p,
    testTypes: p.testTypes.includes(id) ? p.testTypes.filter(t => t !== id) : [...p.testTypes, id],
  }))

  const submit = (e) => {
    e.preventDefault(); setErr('')
    if (f.testTypes.length === 0) return setErr('请至少选择一个测试项目')
    if (!f.sampleDescription.trim()) return setErr('请填写样品描述')
    if (!f.purpose.trim()) return setErr('请填写测试目的')
    submitRequest({ ...f, sampleCount: +f.sampleCount, budget: f.budget ? +f.budget : 0 })
    onDone()
  }

  return (
    <Layout title="新建测试申请" actions={<button className="btn btn-ghost btn-sm" onClick={onBack}>← 返回</button>}>
      <div className="card" style={{ maxWidth: '660px', margin: '0 auto' }}>
        <form onSubmit={submit}>
          {err && <div className="alert alert-err">{err}</div>}

          {/* Test types */}
          <div className="fg">
            <label className="fl">测试项目 * <span style={{ fontWeight: 400, color: 'var(--g400)' }}>（可多选）</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '2px' }}>
              {TEST_TYPES.map(t => {
                const sel = f.testTypes.includes(t.id)
                return (
                  <button key={t.id} type="button" onClick={() => toggleType(t.id)} style={{
                    padding: '6px 13px', border: sel ? '2px solid var(--primary)' : '1px solid var(--g300)',
                    borderRadius: '20px', background: sel ? 'var(--primary-l)' : '#fff',
                    color: sel ? 'var(--primary)' : 'var(--g600)', cursor: 'pointer',
                    fontSize: '13px', fontWeight: sel ? '600' : '400', transition: 'all .15s',
                  }}>
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sample description */}
          <div className="fg">
            <label className="fl">样品描述 *</label>
            <textarea className="fi" rows={3} value={f.sampleDescription} onChange={e => setF(p => ({ ...p, sampleDescription: e.target.value }))} placeholder="样品名称、状态（粉末/薄膜/溶液等）、主要成分等" />
          </div>

          {/* Count + budget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="fg">
              <label className="fl">样品数量 *</label>
              <input className="fi" type="number" min="1" value={f.sampleCount} onChange={e => setF(p => ({ ...p, sampleCount: e.target.value }))} />
            </div>
            <div className="fg">
              <label className="fl">预算（元）</label>
              <input className="fi" type="number" min="0" value={f.budget} onChange={e => setF(p => ({ ...p, budget: e.target.value }))} placeholder="预计花费" />
            </div>
          </div>

          {/* Purpose */}
          <div className="fg">
            <label className="fl">测试目的 *</label>
            <textarea className="fi" rows={2} value={f.purpose} onChange={e => setF(p => ({ ...p, purpose: e.target.value }))} placeholder="说明该测试用于哪个课题/论文，以及测试的具体目的" />
          </div>

          {/* Urgency */}
          <div className="fg">
            <label className="fl">紧急程度</label>
            <div style={{ display: 'flex', gap: '20px', marginTop: '2px' }}>
              {[{ v: 'normal', l: '普通' }, { v: 'urgent', l: '紧急' }].map(o => (
                <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" name="urgency" value={o.v} checked={f.urgency === o.v} onChange={e => setF(p => ({ ...p, urgency: e.target.value }))} />
                  {o.l}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="fg">
            <label className="fl">备注</label>
            <textarea className="fi" rows={2} value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="其他需要说明的事项（可选）" />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="button" className="btn btn-ghost" onClick={onBack}>取消</button>
            <button type="submit" className="btn btn-primary btn-lg">提交申请</button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
