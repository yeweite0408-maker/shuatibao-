import { Router } from 'express'
import { all, get, run } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// 所有管理接口需要 admin 权限
router.use(requireAuth)
router.use((req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '无权限' })
  next()
})

// 用户管理
router.get('/users', (req, res) => {
  const users = all('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC')
  res.json(users)
})

router.patch('/users/:id/role', (req, res) => {
  const { role } = req.body
  if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: '无效角色' })
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: '不能修改自己的角色' })
  const result = run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
  if (result.changes === 0) return res.status(404).json({ error: '用户不存在' })
  res.json({ success: true })
})

router.delete('/users/:id', (req, res) => {
  if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: '不能删除自己' })
  const result = run('DELETE FROM users WHERE id = ?', [req.params.id])
  if (result.changes === 0) return res.status(404).json({ error: '用户不存在' })
  res.json({ success: true })
})

// 待审核题目
router.get('/questions/pending', (req, res) => {
  const rows = all(`
    SELECT q.*, u.username as uploader_name
    FROM questions q LEFT JOIN users u ON q.uploaded_by = u.id
    WHERE q.status = 'pending' ORDER BY q.created_at ASC
  `).map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null }))
  res.json(rows)
})

router.patch('/questions/:id/status', (req, res) => {
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: '无效状态' })
  const result = run('UPDATE questions SET status = ? WHERE id = ?', [status, req.params.id])
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' })
  res.json({ success: true })
})

// 全站统计
router.get('/stats/overview', (req, res) => {
  const totalUsers = get('SELECT COUNT(*) as count FROM users')
  const totalQuestions = get('SELECT COUNT(*) as count FROM questions')
  const pendingQuestions = get("SELECT COUNT(*) as count FROM questions WHERE status = 'pending'")
  const totalRecords = get('SELECT COUNT(*) as count FROM records')
  const subjectStats = all(`
    SELECT q.subject, COUNT(*) as count,
      SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as avg_correct
    FROM questions q LEFT JOIN records r ON q.id = r.question_id
    GROUP BY q.subject
  `)
  res.json({
    users: totalUsers.count,
    questions: totalQuestions.count,
    pending: pendingQuestions.count,
    records: totalRecords.count,
    subjects: subjectStats.map(s => ({
      subject: s.subject,
      count: s.count,
      avgCorrect: s.avg_correct ? Math.round(s.avg_correct * 100) : null
    }))
  })
})

export default router
