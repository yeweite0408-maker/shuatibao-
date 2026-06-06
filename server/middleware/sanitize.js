// 简单 XSS 防护：去除文本中的 HTML 标签
export function sanitize(str) {
  if (typeof str !== 'string') return str
  return str.replace(/<[^>]*>/g, '').trim()
}

// 中间件：自动清理请求体中的字符串字段
export function sanitizeInput(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key])
      }
    }
  }
  next()
}
