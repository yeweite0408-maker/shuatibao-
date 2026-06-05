import { Router } from 'express'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { get, run } from '../db.js'
import { createToken, requireAuth } from '../middleware/auth.js'

const router = Router()

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString('hex')
}

router.post('/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填' })
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需在 2-20 个字符之间' })
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '密码长度至少 4 位' })
  }

  const existing = get('SELECT id FROM users WHERE username = ?', [username])
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' })
  }

  const salt = randomBytes(16).toString('hex')
  const hash = hashPassword(password, salt)
  const result = run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, salt + ':' + hash])

  const token = createToken({ id: result.lastInsertRowid, username, role: 'user' })
  res.status(201).json({ token, user: { id: result.lastInsertRowid, username, role: 'user' } })
})

router.post('/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码为必填' })
  }

  const user = get('SELECT * FROM users WHERE username = ?', [username])
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const [salt, storedHash] = user.password_hash.split(':')
  const hash = hashPassword(password, salt)

  if (hash !== storedHash) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = createToken({ id: user.id, username: user.username, role: user.role })
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
})

router.get('/me', requireAuth, (req, res) => {
  const u = get('SELECT id, username, role FROM users WHERE id = ?', [req.user.id])
  if (!u) return res.status(404).json({ error: '用户不存在' })
  res.json({ user: { id: u.id, username: u.username, role: u.role } })
})

export default router
