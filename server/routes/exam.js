import { Router } from 'express'
import { all } from '../db.js'

const router = Router()

// 生成试卷
router.post('/generate', (req, res) => {
  const { subject, config } = req.body
  // config: [{ type: 'single_choice', count: 5 }, ...]
  if (!config || !Array.isArray(config) || config.length === 0) {
    return res.status(400).json({ error: '请传入试卷配置' })
  }

  const result = []
  for (const item of config) {
    if (!item.count || item.count <= 0) continue
    let sql = "SELECT * FROM questions WHERE type = ? AND status = 'approved'"
    const params = [item.type]
    if (subject) { sql += ' AND subject = ?'; params.push(subject) }
    sql += ' ORDER BY RANDOM() LIMIT ?'
    params.push(item.count)
    const rows = all(sql, params).map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null }))
    result.push(...rows)
  }

  // 打乱题目顺序
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }

  res.json(result)
})

export default router
