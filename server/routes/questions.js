import { Router } from 'express'
import { all, get, run, transaction } from '../db.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

const router = Router()

const parseRow = r => ({ ...r, options: r.options ? JSON.parse(r.options) : null })

// 仅返回已审核题目（普通用户），管理员可看全部
router.get('/', (req, res) => {
  const { type, subject, status } = req.query
  let sql = 'SELECT q.*, u.username as uploader_name FROM questions q LEFT JOIN users u ON q.uploaded_by = u.id'
  const conditions = []
  const params = []
  if (type) { conditions.push('q.type = ?'); params.push(type) }
  if (subject) { conditions.push('q.subject = ?'); params.push(subject) }
  if (status) { conditions.push('q.status = ?'); params.push(status) }
  else { conditions.push("q.status = 'approved'") }
  sql += ' WHERE ' + conditions.join(' AND ')
  sql += ' ORDER BY q.created_at DESC'
  res.json(all(sql, params).map(parseRow))
})

// 获取所有科目及题目数（含公共/个人区分）
router.get('/subjects', optionalAuth, (req, res) => {
  const userId = req.user?.id
  if (userId) {
    // 登录用户：公共 + 自己的个人题库
    const rows = all(`
      SELECT subject, COUNT(*) as count,
        CASE WHEN q.scope IS NULL THEN 'public' ELSE q.scope END as scope,
        q.uploaded_by,
        (SELECT username FROM users WHERE id = q.uploaded_by) as creator_name
      FROM questions q WHERE status = 'approved' AND (
        q.scope IS NULL OR q.scope = 'public' OR (q.scope = 'private' AND q.uploaded_by = ?))
      GROUP BY subject, scope, q.uploaded_by ORDER BY scope, subject
    `, [userId])
    res.json(rows.map(r => ({ ...r, isPersonal: r.scope === 'private' })))
  } else {
    // 未登录：只看公共
    const rows = all("SELECT subject, COUNT(*) as count FROM questions WHERE status = 'approved' AND (scope IS NULL OR scope = 'public') GROUP BY subject ORDER BY subject")
    res.json(rows.map(r => ({ ...r, isPersonal: false })))
  }
})

// 全局搜索
router.get('/search/all', (req, res) => {
  const { q } = req.query
  if (!q || !q.trim()) return res.json([])
  const keyword = '%' + q.trim() + '%'
  const rows = all("SELECT id, subject, type, question, LEFT(question, 80) as snippet FROM questions WHERE status = 'approved' AND question LIKE ? ORDER BY created_at DESC LIMIT 30", [keyword])
  res.json(rows)
})

// 公开个人题库（发布到公共）
router.post('/publish-request', requireAuth, (req, res) => {
  const { subject } = req.body
  if (!subject) return res.status(400).json({ error: '请指定题库名称' })
  if (req.user.role === 'admin') {
    run("UPDATE questions SET scope = 'public' WHERE subject = ?", [subject])
    res.json({ success: true })
  } else {
    const existing = get("SELECT id FROM publish_requests WHERE subject = ? AND user_id = ? AND status = 'pending'", [subject, req.user.id])
    if (existing) return res.json({ success: true, message: '已提交过审核请求' })
    run("INSERT INTO publish_requests (subject, user_id, username) VALUES (?, ?, ?)", [subject, req.user.id, req.user.username])
    res.json({ success: true, message: '审核请求已提交' })
  }
})

router.post('/publish', requireAuth, (req, res) => {
  const { subject } = req.body
  if (!subject) return res.status(400).json({ error: '请指定题库名称' })
  if (req.user.role === 'admin') {
    // 管理员直接发布
    const result = run("UPDATE questions SET scope = 'public' WHERE subject = ? AND uploaded_by = ?", [subject, req.user.id])
    res.json({ success: true, updated: result.changes })
  } else {
    // 普通用户：提交审核请求
    const existing = get("SELECT id FROM publish_requests WHERE subject = ? AND user_id = ? AND status = 'pending'", [subject, req.user.id])
    if (existing) return res.json({ success: true, message: '已提交过审核请求，请等待管理员处理' })
    run("INSERT INTO publish_requests (subject, user_id, username) VALUES (?, ?, ?)", [subject, req.user.id, req.user.username])
    res.json({ success: true, message: '审核请求已提交，请等待管理员处理' })
  }
})

// 按科目获取题目统计（含全局答题情况）
router.get('/subject/:subject/stats', (req, res) => {
  const subject = req.params.subject
  const questions = all(
    "SELECT q.id, q.type, q.question, q.options, q.answer, COUNT(r.id) as total_attempts, SUM(CASE WHEN r.is_correct = 1 THEN 1 ELSE 0 END) as correct_count FROM questions q LEFT JOIN records r ON q.id = r.question_id WHERE q.subject = ? AND q.status = 'approved' GROUP BY q.id ORDER BY q.created_at ASC",
    [subject]
  )
  res.json(questions.map(q => ({
    id: q.id,
    type: q.type,
    question: q.question,
    options: q.options ? JSON.parse(q.options) : null,
    answer: q.answer,
    totalAttempts: q.total_attempts,
    correctCount: q.correct_count || 0,
    correctRate: q.total_attempts > 0 ? Math.round(q.correct_count / q.total_attempts * 100) : null
  })))
})

router.get('/random', (req, res) => {
  const count = parseInt(req.query.count) || 10
  const { subject } = req.query
  let sql = "SELECT * FROM questions WHERE status = 'approved'"
  const params = []
  if (subject) { sql += ' AND subject = ?'; params.push(subject) }
  sql += ' ORDER BY RANDOM() LIMIT ?'
  params.push(count)
  res.json(all(sql, params).map(parseRow))
})

// 批量导入（管理员直接通过，普通用户需审核）
router.post('/batch', optionalAuth, (req, res) => {
  const { questions } = req.body
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: '请传入 questions 数组' })
  }
  const isAdmin = req.user?.role === 'admin'
  const status = isAdmin ? 'approved' : 'pending'
  let count = 0
  const insert = transaction((items) => {
    for (const item of items) {
      if (!item.type || !item.question || !item.answer) continue
      const scope = isAdmin ? (req.body.scope || 'public') : 'private'
      run(
        'INSERT INTO questions (subject, type, question, options, answer, explanation, status, uploaded_by, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [item.subject || '', item.type, item.question, item.options ? JSON.stringify(item.options) : null, item.answer, item.explanation || '', status, req.user?.id || null, scope]
      )
      count++
    }
  })
  insert(questions)
  res.json({ success: true, imported: count, status })
})

router.post('/', optionalAuth, (req, res) => {
  const { subject, type, question, options, answer, explanation } = req.body
  if (!type || !question || !answer) {
    return res.status(400).json({ error: 'type, question, answer 为必填' })
  }
  const isAdmin = req.user?.role === 'admin'
  const status = isAdmin ? 'approved' : 'pending'
  const scope = isAdmin ? (req.body.scope || 'public') : 'private'
  const result = run(
    'INSERT INTO questions (subject, type, question, options, answer, explanation, status, uploaded_by, scope) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [subject || '', type, question, options ? JSON.stringify(options) : null, answer, explanation || '', status, req.user?.id || null, scope]
  )
  res.status(201).json({ id: result.lastInsertRowid, status })
})

router.get('/:id/stats', (req, res) => {
  const id = req.params.id
  const total = get('SELECT COUNT(*) as count FROM records WHERE question_id = ?', [id])
  const correct = get('SELECT COUNT(*) as count FROM records WHERE question_id = ? AND is_correct = 1', [id])
  const answers = all('SELECT user_answer, COUNT(*) as cnt FROM records WHERE question_id = ? AND user_answer IS NOT NULL GROUP BY user_answer ORDER BY cnt DESC', [id])
  res.json({
    total: total.count,
    correct: correct.count,
    correctRate: total.count > 0 ? Math.round(correct.count / total.count * 100) : 0,
    distribution: answers.map(a => ({ answer: a.user_answer, count: a.cnt }))
  })
})

router.get('/:id', (req, res) => {
  const row = get('SELECT q.*, u.username as uploader_name FROM questions q LEFT JOIN users u ON q.uploaded_by = u.id WHERE q.id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: '题目不存在' })
  res.json(parseRow(row))
})

router.put('/:id', (req, res) => {
  const { subject, type, question, options, answer, explanation } = req.body
  const result = run(
    'UPDATE questions SET subject=?, type=?, question=?, options=?, answer=?, explanation=? WHERE id=?',
    [subject || '', type, question, options ? JSON.stringify(options) : null, answer, explanation || '', req.params.id]
  )
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' })
  res.json({ success: true })
})

router.delete('/:id', (req, res) => {
  const result = run('DELETE FROM questions WHERE id = ?', [req.params.id])
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' })
  res.json({ success: true })
})

export default router
