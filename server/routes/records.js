import { Router } from 'express'
import { all, get, run } from '../db.js'
import { optionalAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', optionalAuth, (req, res) => {
  const { question_id, user_answer, is_correct, session_id } = req.body
  if (!question_id || !session_id) {
    return res.status(400).json({ error: 'question_id, session_id 为必填' })
  }
  const existing = get(
    'SELECT id FROM records WHERE question_id = ? AND session_id = ?',
    [question_id, session_id]
  )

  if (existing) {
    run('UPDATE records SET user_answer=?, is_correct=? WHERE id=?',
      [user_answer, is_correct ? 1 : 0, existing.id])
    return res.json({ id: existing.id })
  } else {
    const result = run(
      'INSERT INTO records (question_id, user_answer, is_correct, session_id, user_id) VALUES (?, ?, ?, ?, ?)',
      [question_id, user_answer, is_correct ? 1 : 0, session_id, req.user?.id || null]
    )
    res.status(201).json({ id: result.lastInsertRowid })
  }
})

router.get('/stats', optionalAuth, (req, res) => {
  const { session_id } = req.query
  let where, params

  if (req.user && session_id === 'all') {
    // 登录用户查看全部记录
    where = 'WHERE user_id = ?'
    params = [req.user.id]
  } else if (session_id) {
    where = 'WHERE session_id = ?'
    params = [session_id]
  } else {
    return res.status(400).json({ error: '需要 session_id 或登录' })
  }

  const total = get(`SELECT COUNT(*) as count FROM records ${where}`, params)
  const correct = get(`SELECT COUNT(*) as count FROM records ${where} AND is_correct = 1`, params)
  const wrong = get(`SELECT COUNT(*) as count FROM records ${where} AND is_correct = 0`, params)
  const bookmarked = get(`SELECT COUNT(*) as count FROM records ${where} AND is_bookmarked = 1`, params)

  const wrongList = all(`
    SELECT r.*, q.question, q.options, q.answer, q.explanation, q.type
    FROM records r JOIN questions q ON r.question_id = q.id
    ${where} AND r.is_correct = 0
    ORDER BY r.created_at DESC
  `, params).map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null }))

  res.json({
    total: total.count,
    correct: correct.count,
    wrong: wrong.count,
    bookmarked: bookmarked.count,
    wrongList
  })
})

router.post('/bookmark', optionalAuth, (req, res) => {
  const { question_id, session_id } = req.body
  const record = req.user
    ? get('SELECT id, is_bookmarked FROM records WHERE question_id = ? AND user_id = ?', [question_id, req.user.id])
    : get('SELECT id, is_bookmarked FROM records WHERE question_id = ? AND session_id = ?', [question_id, session_id])

  if (!record) return res.status(404).json({ error: '记录不存在' })
  run('UPDATE records SET is_bookmarked = ? WHERE id = ?',
    [record.is_bookmarked ? 0 : 1, record.id])
  res.json({ is_bookmarked: !record.is_bookmarked })
})

router.get('/bookmarked', optionalAuth, (req, res) => {
  let where, params
  if (req.user) {
    where = 'WHERE r.user_id = ?'
    params = [req.user.id]
  } else {
    return res.json([])
  }
  const rows = all(`
    SELECT DISTINCT r.question_id, q.question, q.type, q.options, q.answer, q.explanation, q.subject
    FROM records r JOIN questions q ON r.question_id = q.id
    ${where} AND r.is_bookmarked = 1 ORDER BY r.created_at DESC
  `, params).map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null }))
  res.json(rows)
})

router.get('/stats/user', optionalAuth, (req, res) => {
  if (!req.user) return res.json({ total: 0, correct: 0 })
  const userId = req.user.id
  const total = get('SELECT COUNT(*) as count FROM records WHERE user_id = ?', [userId])
  const correct = get('SELECT COUNT(*) as count FROM records WHERE user_id = ? AND is_correct = 1', [userId])
  const wrong = get('SELECT COUNT(*) as count FROM records WHERE user_id = ? AND is_correct = 0', [userId])
  const bySubject = all(`
    SELECT q.subject, COUNT(*) as count, SUM(r.is_correct) * 1.0 / COUNT(*) as rate
    FROM records r JOIN questions q ON r.question_id = q.id
    WHERE r.user_id = ? GROUP BY q.subject
  `, [userId]).map(s => ({ ...s, rate: s.rate ? Math.round(s.rate * 100) : 0 }))
  const daily = all(`
    SELECT date(created_at) as day, COUNT(*) as count
    FROM records WHERE user_id = ? AND created_at > date('now', '-30 days')
    GROUP BY day ORDER BY day
  `, [userId])
  const streak = get(`WITH days AS (
    SELECT DISTINCT date(created_at) as day FROM records WHERE user_id = ? ORDER BY day DESC
  ), chains AS (
    SELECT day, julianday(day) - row_number() OVER (ORDER BY day) as grp FROM days
  ) SELECT COUNT(*) as streak FROM chains WHERE grp = (SELECT grp FROM chains LIMIT 1)`, [userId])

  res.json({
    total: total.count,
    correct: correct.count,
    wrong: wrong.count,
    rate: total.count > 0 ? Math.round(correct.count / total.count * 100) : 0,
    bySubject,
    daily,
    streak: streak?.streak || 0
  })
})

router.get('/wrong', optionalAuth, (req, res) => {
  let where, params
  if (req.user) {
    where = 'WHERE r.user_id = ?'
    params = [req.user.id]
  } else {
    where = 'WHERE 1=1'
    params = []
  }
  const rows = all(`
    SELECT DISTINCT r.question_id, q.question, q.type, q.answer, q.explanation
    FROM records r JOIN questions q ON r.question_id = q.id
    ${where} AND r.is_correct = 0 ORDER BY r.created_at DESC
  `, params)
  res.json(rows)
})

export default router
