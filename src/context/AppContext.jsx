import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [requests, setRequests] = useState([])
  const [ready, setReady] = useState(false)

  const loadRequests = useCallback(async () => {
    try {
      const data = await api.getRequests()
      setRequests(data)
    } catch (e) {
      if (e.message.includes('Token') || e.message.includes('登录')) {
        localStorage.removeItem('lab_token')
        localStorage.removeItem('lab_user')
        setCurrentUser(null)
      }
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('lab_token')
    const user = localStorage.getItem('lab_user')
    if (token && user) {
      setCurrentUser(JSON.parse(user))
      loadRequests().finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  const login = async (username, password) => {
    try {
      const { token, user } = await api.login(username, password)
      localStorage.setItem('lab_token', token)
      localStorage.setItem('lab_user', JSON.stringify(user))
      setCurrentUser(user)
      await loadRequests()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  const register = async (data) => {
    try {
      const { token, user } = await api.register(data)
      localStorage.setItem('lab_token', token)
      localStorage.setItem('lab_user', JSON.stringify(user))
      setCurrentUser(user)
      await loadRequests()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('lab_token')
    localStorage.removeItem('lab_user')
    setCurrentUser(null)
    setRequests([])
  }

  const submitRequest = async (data) => {
    const r = await api.submitRequest(data)
    setRequests(prev => [r, ...prev])
    return r
  }

  const approveRequest = async (id, comment) => {
    await api.approveRequest(id, comment)
    await loadRequests()
  }

  const rejectRequest = async (id, comment) => {
    await api.rejectRequest(id, comment)
    await loadRequests()
  }

  const completeRequest = async (id) => {
    await api.completeRequest(id)
    await loadRequests()
  }

  const setActualCost = async (id, cost) => {
    await api.setActualCost(id, cost)
    await loadRequests()
  }

  const deleteRequest = async (id) => {
    await api.deleteRequest(id)
    setRequests(prev => prev.filter(r => r.id !== id))
  }

  return (
    <Ctx.Provider value={{
      currentUser, requests, ready,
      login, register, logout,
      submitRequest, approveRequest, rejectRequest, completeRequest,
      setActualCost, deleteRequest,
      refreshRequests: loadRequests,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
