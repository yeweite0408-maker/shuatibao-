import { Router } from 'express'
import { all } from '../db.js'

const router = Router()

router.get('/daily', (req, res) => {
  const rows = all(`
    SELECT u.username, COUNT(*) as count, SUM(r.is_correct) as correct
    FROM records r
    JOIN users u ON r.user_id = u.id
    WHERE date(r.created_at) = date('now', 'localtime')
    GROUP BY u.id
    ORDER BY count DESC
    LIMIT 20
  `)
  res.json(rows.map((r, i) => ({ rank: i + 1, username: r.username, count: r.count, correct: r.correct || 0 })))
})

router.get('/historical', (req, res) => {
  const rows = all(`
    SELECT u.username, COUNT(*) as count, SUM(r.is_correct) as correct
    FROM records r
    JOIN users u ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY count DESC
    LIMIT 20
  `)
  res.json(rows.map((r, i) => ({ rank: i + 1, username: r.username, count: r.count, correct: r.correct || 0 })))
})

export default router
