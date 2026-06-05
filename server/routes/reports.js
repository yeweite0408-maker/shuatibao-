import { Router } from 'express'
import { all, get, run } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', optionalAuth, (req, res) => {
  const { question_id, content } = req.body
  if (!question_id || !content || !content.trim()) {
    return res.status(400).json({ error: '缺少题目ID或纠错内容' })
  }
  const result = run(
    'INSERT INTO reports (question_id, user_id, username, content) VALUES (?, ?, ?, ?)',
    [question_id, req.user?.id || null, req.user?.username || '匿名', content.trim()]
  )
  res.status(201).json({ id: result.lastInsertRowid })
})

router.get('/', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' })
  const rows = all(`
    SELECT r.*, q.question as question_text, q.subject as question_subject
    FROM reports r LEFT JOIN questions q ON r.question_id = q.id
    ORDER BY r.created_at DESC
  `)
  res.json(rows)
})

router.patch('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' })
  const { status, reply } = req.body
  if (!['resolved', 'rejected'].includes(status)) return res.status(400).json({ error: '无效状态' })
  run('UPDATE reports SET status=?, reply=? WHERE id=?', [status, reply || '', req.params.id])
  res.json({ success: true })
})

export default router
