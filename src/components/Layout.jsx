import { useApp } from '../context/AppContext'

export default function Layout({ children, title, actions }) {
  const { currentUser, logout } = useApp()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--g50)' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid var(--g200)', padding: '0 20px', height: '54px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🔬</span>
          <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--g900)' }}>实验室测试申请系统</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--g800)' }}>{currentUser?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--g400)' }}>
              {currentUser?.role === 'teacher' ? '教师' : `学号 ${currentUser?.studentId}`}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>退出</button>
        </div>
      </nav>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '22px 16px' }}>
        {(title || actions) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            {title && <h1 style={{ fontSize: '19px', fontWeight: '700', color: 'var(--g900)' }}>{title}</h1>}
            {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
