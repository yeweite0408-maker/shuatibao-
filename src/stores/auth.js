import { reactive } from 'vue'
import axios from 'axios'

const tokenKey = 'shuati_token'
const userKey = 'shuati_user'

const savedToken = localStorage.getItem(tokenKey)
let savedUser = JSON.parse(localStorage.getItem(userKey) || 'null')

// 修复旧数据缺少 role 字段的问题
if (savedUser && !savedUser.role && savedToken) {
  const parts = savedToken.split('.')
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(atob(parts[1]))
      if (payload.role) savedUser.role = payload.role
    } catch {}
  }
}

export const auth = reactive({
  token: savedToken,
  user: savedUser,
  get isLoggedIn() { return !!this.token && !!this.user },
})

export function setAuth(token, user) {
  auth.token = token
  auth.user = user
  localStorage.setItem(tokenKey, token)
  localStorage.setItem(userKey, JSON.stringify(user))
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearAuth() {
  auth.token = null
  auth.user = null
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
  delete axios.defaults.headers.common['Authorization']
}

export async function syncUser() {
  if (!auth.token) return
  try {
    const res = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${auth.token}` } })
    if (res.data?.user) {
      auth.user = res.data.user
      localStorage.setItem(userKey, JSON.stringify(res.data.user))
    }
  } catch { clearAuth() }
}

if (auth.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`
}
