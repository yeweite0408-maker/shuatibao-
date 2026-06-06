import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// 生产环境必须设置 JWT_SECRET 环境变量
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')

// 要求登录（必须）
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: '登录已过期' })
  }
}

// 可选登录（有就用，没有也行）
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET)
    } catch {}
  }
  next()
}

export function createToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' })
}
