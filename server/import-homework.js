import http from 'http'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '..', 'echarts-homework.json'), 'utf-8'))
const postData = JSON.stringify({ questions: data, scope: 'public' })

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/questions/batch',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}

const req = http.request(options, (res) => {
  let body = ''
  res.on('data', chunk => body += chunk)
  res.on('end', () => {
    const r = JSON.parse(body)
    console.log('Imported: ' + r.imported + ', Status: ' + r.status)
    process.exit(0)
  })
})
req.on('error', e => { console.error('Error: ' + e.message); process.exit(1) })
req.write(postData)
req.end()
