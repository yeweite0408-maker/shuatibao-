import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { all, get, run } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', 'uploads')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('仅支持图片格式：jpg, png, gif, webp'))
  }
})

const router = Router()

router.post('/', optionalAuth, upload.array('images', 5), (req, res) => {
  const { content } = req.body
  if (!content || !content.trim()) {
    return res.status(400).json({ error: '请输入反馈内容' })
  }
  const images = (req.files || []).map(f => '/uploads/' + f.filename)
  const result = run(
    'INSERT INTO feedback (user_id, username, content, images) VALUES (?, ?, ?, ?)',
    [req.user?.id || null, req.user?.username || '匿名', content.trim(), JSON.stringify(images)]
  )
  res.status(201).json({ id: result.lastInsertRowid, images })
})

router.get('/', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' })
  const rows = all('SELECT * FROM feedback ORDER BY created_at DESC')
  res.json(rows.map(r => ({ ...r, images: JSON.parse(r.images || '[]') })))
})

router.patch('/:id/reply', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' })
  const { reply } = req.body
  run('UPDATE feedback SET reply=?, status=? WHERE id=?', [reply || '', 'replied', req.params.id])
  res.json({ success: true })
})

export default router
