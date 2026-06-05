import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
import questionsRouter from './routes/questions.js'
import recordsRouter from './routes/records.js'
import authRouter from './routes/auth.js'
import adminRouter from './routes/admin.js'
import feedbackRouter from './routes/feedback.js'
import leaderboardRouter from './routes/leaderboard.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/questions', questionsRouter)
app.use('/api/records', recordsRouter)
app.use('/api/admin', adminRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 生产环境：服务前端构建文件
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

async function start() {
  await initDB()
  console.log('Database initialized')
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`)
  })
}

start().catch(console.error)
