import { reactive } from 'vue'
import axios from 'axios'

const tokenKey = 'shuati_token'
const userKey = 'shuati_user'

const savedToken = localStorage.getItem(tokenKey)
const savedUser = JSON.parse(localStorage.getItem(userKey) || 'null')

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
  // 设置 axios 默认请求头
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export function clearAuth() {
  auth.token = null
  auth.user = null
  localStorage.removeItem(tokenKey)
  localStorage.removeItem(userKey)
  delete axios.defaults.headers.common['Authorization']
}

// 从后端同步用户信息（保证 role 等最新数据）
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

// 初始化时如果已有 token，设置请求头
if (auth.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`
}
