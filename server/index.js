import express from 'express'
import cors from 'cors'
import path from 'path'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import questionsRouter from './routes/questions.js'
import recordsRouter from './routes/records.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import { sanitizeInput } from './middleware/sanitize.js'
import feedbackRouter from './routes/feedback.js'
import leaderboardRouter from './routes/leaderboard.js'
import examRouter from './routes/exam.js'
import reportsRouter from './routes/reports.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

const app = express()

// ========== 安全配置 ==========

// 1. HTTP 安全头
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}))

// 2. CORS
app.use(cors({
  origin: isProd ? 'http://121.40.160.179:3000' : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}))

// 3. 请求大小限制（防止大请求攻击）
app.use(express.json({ limit: '5mb' }))

// 4. 登录/注册限流（防止暴力破解）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: '请求过于频繁，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// 5. 通用限流（每个 IP 每分钟最多 200 次请求）
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api', generalLimiter)

// ========== 路由 ==========
app.use('/api', sanitizeInput)  // 全局 XSS 过滤

app.use('/api/auth', authRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/records', recordsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/exam', examRouter)
app.use('/api/reports', reportsRouter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 生产环境：服务前端构建文件
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

// 全局错误处理（防止泄漏内部信息）
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: '服务器内部错误' })
})

async function start() {
  await initDB()
  console.log(`Server running on port ${PORT}${isProd ? ' (production)' : ' (development)'}`)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Listening at http://0.0.0.0:${PORT}`)
  })
}

const PORT = process.env.PORT || 3000
start().catch(console.error)
