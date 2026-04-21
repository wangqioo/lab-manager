import { useApp } from './context/AppContext'
import Login from './components/Login'
import StudentDashboard from './components/StudentDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const { currentUser, ready } = useApp()

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--g400)', fontSize: '15px' }}>加载中...</div>
      </div>
    )
  }

  if (!currentUser) return <Login />
  if (currentUser.role === 'admin') return <AdminDashboard />
  if (currentUser.role === 'teacher') return <TeacherDashboard />
  return <StudentDashboard />
}
