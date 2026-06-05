# ECharts 刷题网页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional quiz web app for ECharts knowledge with Vue 3 frontend, Express backend, and SQLite database.

**Architecture:** Single-page app with Vue 3 + Vite frontend, Express REST API backend, better-sqlite3 for persistence. Frontend and backend run as separate processes (Vite dev server + Express on different ports) with a proxy for API calls.

**Tech Stack:** Vue 3 (Composition API), Vite, Vue Router 4, Express.js, better-sqlite3, SQLite3

---

## Project Structure

```
C:\Users\75238\Desktop\Echarts\
├── server/
│   ├── index.js          # Express 入口
│   ├── db.js             # SQLite 初始化
│   ├── routes/
│   │   ├── questions.js  # 题目 CRUD API
│   │   └── records.js    # 答题记录 API
│   └── seed.js           # 测试数据（4题型 x 5题 = 20题）
├── src/
│   ├── main.js           # Vue 入口
│   ├── App.vue           # 根组件（布局框架）
│   ├── router/
│   │   └── index.js      # 路由配置
│   ├── api/
│   │   └── index.js      # Axios API 封装
│   ├── pages/
│   │   ├── Home.vue      # 首页
│   │   ├── Quiz.vue      # 刷题页
│   │   ├── Result.vue    # 结果页
│   │   ├── Admin.vue     # 题库管理
│   │   └── QuestionEdit.vue  # 新增/编辑题目
│   └── style.css         # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

---

### Task 1: 初始化项目（package.json + Vite + 依赖）

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `src/main.js`
- Create: `src/style.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "echarts-quiz",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "server": "node server/index.js",
    "seed": "node server/seed.js"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "axios": "^1.7.0",
    "express": "^4.19.0",
    "better-sqlite3": "^11.0.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.4.0"
  }
}
```

Expected: File created at `package.json`

- [ ] **Step 2: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ECharts 刷题</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

Expected: File created at `index.html`

- [ ] **Step 3: 创建 vite.config.js**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

Expected: File created at `vite.config.js`

- [ ] **Step 4: 创建 src/main.js**

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(router).mount('#app')
```

Expected: File created at `src/main.js`

- [ ] **Step 5: 创建 src/style.css**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: #0071e3;
  --success: #34c759;
  --error: #ff3b30;
  --warning: #ff9f0a;
  --bg: #f5f5f7;
  --card: #ffffff;
  --border: #d1d1d6;
  --text: #1d1d1f;
  --text-secondary: #86868b;
}
body {
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
.btn {
  display: inline-block;
  padding: 0.6rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.15s ease;
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { opacity: 0.85; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { background: var(--border); }
.container { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
```

Expected: File created at `src/style.css`

- [ ] **Step 6: 安装依赖**

Run: `npm install`
Expected: node_modules 创建完成，无错误

- [ ] **Step 7: 创建 .gitignore**

```
node_modules/
dist/
*.db
.superpowers/
```

Expected: File created

---

### Task 2: 后端 — 数据库 + Express 服务

**Files:**
- Create: `server/db.js`
- Create: `server/index.js`

- [ ] **Step 1: 创建 server/db.js 数据库初始化**

```js
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '..', 'quiz.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('single_choice','multi_choice','true_false','fill_blank')),
    question TEXT NOT NULL,
    options TEXT,
    answer TEXT NOT NULL,
    explanation TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_answer TEXT,
    is_correct INTEGER DEFAULT 0,
    is_bookmarked INTEGER DEFAULT 0,
    session_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );
`)

export default db
```

Expected: File created at `server/db.js`

- [ ] **Step 2: 创建 server/index.js Express 服务**

```js
import express from 'express'
import cors from 'cors'
import questionsRouter from './routes/questions.js'
import recordsRouter from './routes/records.js'

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.use('/api/questions', questionsRouter)
app.use('/api/records', recordsRouter)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
```

Expected: File created at `server/index.js`

- [ ] **Step 3: 创建 server/routes/questions.js**

```js
import { Router } from 'express'
import db from '../db.js'

const router = Router()

// 获取所有题目
router.get('/', (req, res) => {
  const { type } = req.query
  let stmt = 'SELECT * FROM questions'
  const params = []
  if (type) {
    stmt += ' WHERE type = ?'
    params.push(type)
  }
  stmt += ' ORDER BY created_at DESC'
  const rows = db.prepare(stmt).all(...params)
  res.json(rows.map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null })))
})

// 随机抽取 N 题
router.get('/random', (req, res) => {
  const count = parseInt(req.query.count) || 10
  const rows = db.prepare('SELECT * FROM questions ORDER BY RANDOM() LIMIT ?').all(count)
  res.json(rows.map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null })))
})

// 新增题目
router.post('/', (req, res) => {
  const { type, question, options, answer, explanation } = req.body
  if (!type || !question || !answer) {
    return res.status(400).json({ error: 'type, question, answer 为必填' })
  }
  const stmt = db.prepare(
    'INSERT INTO questions (type, question, options, answer, explanation) VALUES (?, ?, ?, ?, ?)'
  )
  const result = stmt.run(
    type,
    question,
    options ? JSON.stringify(options) : null,
    answer,
    explanation || ''
  )
  res.status(201).json({ id: result.lastInsertRowid })
})

// 获取单题
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: '题目不存在' })
  res.json({ ...row, options: row.options ? JSON.parse(row.options) : null })
})

// 更新题目
router.put('/:id', (req, res) => {
  const { type, question, options, answer, explanation } = req.body
  const stmt = db.prepare(
    'UPDATE questions SET type=?, question=?, options=?, answer=?, explanation=? WHERE id=?'
  )
  const result = stmt.run(
    type,
    question,
    options ? JSON.stringify(options) : null,
    answer,
    explanation || '',
    req.params.id
  )
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' })
  res.json({ success: true })
})

// 删除题目
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: '题目不存在' })
  res.json({ success: true })
})

export default router
```

Expected: File created

- [ ] **Step 4: 创建 server/routes/records.js**

```js
import { Router } from 'express'
import db from '../db.js'

const router = Router()

// 提交答题记录
router.post('/', (req, res) => {
  const { question_id, user_answer, is_correct, session_id } = req.body
  if (!question_id || !session_id) {
    return res.status(400).json({ error: 'question_id, session_id 为必填' })
  }
  const existing = db.prepare(
    'SELECT id FROM records WHERE question_id = ? AND session_id = ?'
  ).get(question_id, session_id)

  if (existing) {
    db.prepare('UPDATE records SET user_answer=?, is_correct=? WHERE id=?')
      .run(user_answer, is_correct ? 1 : 0, existing.id)
    return res.json({ id: existing.id })
  } else {
    const stmt = db.prepare(
      'INSERT INTO records (question_id, user_answer, is_correct, session_id) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(question_id, user_answer, is_correct ? 1 : 0, session_id)
    res.status(201).json({ id: result.lastInsertRowid })
  }
})

// 获取统计
router.get('/stats', (req, res) => {
  const { session_id } = req.query
  if (!session_id) return res.status(400).json({ error: 'session_id 必填' })

  const total = db.prepare('SELECT COUNT(*) as count FROM records WHERE session_id = ?').get(session_id)
  const correct = db.prepare('SELECT COUNT(*) as count FROM records WHERE session_id = ? AND is_correct = 1').get(session_id)
  const wrong = db.prepare('SELECT COUNT(*) as count FROM records WHERE session_id = ? AND is_correct = 0').get(session_id)
  const bookmarked = db.prepare('SELECT COUNT(*) as count FROM records WHERE session_id = ? AND is_bookmarked = 1').get(session_id)

  const wrongList = db.prepare(`
    SELECT r.*, q.question, q.options, q.answer, q.explanation, q.type
    FROM records r JOIN questions q ON r.question_id = q.id
    WHERE r.session_id = ? AND r.is_correct = 0
    ORDER BY r.created_at DESC
  `).all(session_id).map(r => ({ ...r, options: r.options ? JSON.parse(r.options) : null }))

  res.json({
    total: total.count,
    correct: correct.count,
    wrong: wrong.count,
    bookmarked: bookmarked.count,
    wrongList
  })
})

// 收藏/取消收藏
router.post('/bookmark', (req, res) => {
  const { question_id, session_id } = req.body
  const record = db.prepare('SELECT id, is_bookmarked FROM records WHERE question_id = ? AND session_id = ?').get(question_id, session_id)
  if (!record) return res.status(404).json({ error: '记录不存在' })
  db.prepare('UPDATE records SET is_bookmarked = ? WHERE id = ?')
    .run(record.is_bookmarked ? 0 : 1, record.id)
  res.json({ is_bookmarked: !record.is_bookmarked })
})

// 获取错题列表
router.get('/wrong', (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT r.question_id, q.question, q.type, q.answer, q.explanation
    FROM records r JOIN questions q ON r.question_id = q.id
    WHERE r.is_correct = 0 ORDER BY r.created_at DESC
  `).all()
  res.json(rows)
})

export default router
```

Expected: File created

---

### Task 3: 种子数据 — 4种题型 × 5题 = 20道 ECharts 题目

**Files:**
- Create: `server/seed.js`

- [ ] **Step 1: 创建 server/seed.js**

```js
import db from './db.js'

const questions = [
  // === 单选题 5题 ===
  { type: 'single_choice', question: '在 ECharts 中，以下哪个配置项用于设置图表的标题？', options: JSON.stringify(['A. title', 'B. header', 'C. legend', 'D. tooltip']), answer: 'A', explanation: 'ECharts 使用 title 配置项来设置图表的标题，包含 text、subtext、left、top 等属性。' },
  { type: 'single_choice', question: 'ECharts 中用于显示鼠标悬浮提示的组件是？', options: JSON.stringify(['A. title', 'B. tooltip', 'C. legend', 'D. toolbox']), answer: 'B', explanation: 'tooltip 组件用于显示鼠标悬浮时的提示信息，可设置 trigger 为 axis 或 item 来触发。' },
  { type: 'single_choice', question: '在 ECharts 柱状图中，如果要设置柱子的宽度，应使用哪个属性？', options: JSON.stringify(['A. width', 'B. barWidth', 'C. barGap', 'D. itemWidth']), answer: 'B', explanation: 'barWidth 是柱状图中用于设置柱子宽度的属性，可以是数值或百分比。' },
  { type: 'single_choice', question: 'ECharts 中用于表示数据系列的配置项名称是？', options: JSON.stringify(['A. data', 'B. dataset', 'C. series', 'D. xAxis']), answer: 'C', explanation: 'series 是 ECharts 的核心配置项，用于定义图表的数据系列，包括图表类型、数据、样式等。' },
  { type: 'single_choice', question: '以下哪个不是 ECharts 支持的图表类型？', options: JSON.stringify(['A. line', 'B. bar', 'C. pie', 'D. histogram']), answer: 'D', explanation: 'histogram（直方图）不是 ECharts 原生支持的图表类型。ECharts 支持 line(折线图)、bar(柱状图)、pie(饼图)、scatter(散点图) 等。' },

  // === 多选题 5题 ===
  { type: 'multi_choice', question: 'ECharts 中以下哪些是图表的组成组件？（多选）', options: JSON.stringify(['A. title', 'B. legend', 'C. tooltip', 'D. footer']), answer: 'A,B,C', explanation: 'title(标题)、legend(图例)、tooltip(提示框) 都是 ECharts 的组件。footer 不是 ECharts 的组件。' },
  { type: 'multi_choice', question: '以下哪些方法可以用于 ECharts 的数据交互？（多选）', options: JSON.stringify(['A. setOption()', 'B. dispatchAction()', 'C. showLoading()', 'D. connect()']), answer: 'A,B', explanation: 'setOption() 用于更新配置，dispatchAction() 用于触发交互行为。showLoading() 是加载动画，connect() 用于图表联动。' },
  { type: 'multi_choice', question: '在 ECharts 中，以下哪些属性属于柱状图的样式配置？（多选）', options: JSON.stringify(['A. barWidth', 'B. barBorderRadius', 'C. itemStyle', 'D. smooth']), answer: 'A,B,C', explanation: 'barWidth(柱宽)、barBorderRadius(柱圆角)、itemStyle(图形样式) 都是柱状图样式配置。smooth 是折线图的平滑属性。' },
  { type: 'multi_choice', question: '以下哪些 ECharts 配置项用于坐标轴配置？（多选）', options: JSON.stringify(['A. xAxis', 'B. yAxis', 'C. legend', 'D. grid']), answer: 'A,B,D', explanation: 'xAxis(横轴)、yAxis(纵轴)、grid(网格) 都用于坐标轴配置。legend 是图例组件。' },
  { type: 'multi_choice', question: 'ECharts 动画相关的配置项包括？（多选）', options: JSON.stringify(['A. animation', 'B. animationDuration', 'C. animationEasing', 'D. transition']), answer: 'A,B,C', explanation: 'animation(是否开启动画)、animationDuration(动画时长)、animationEasing(缓动效果) 都是动画配置。transition 不是 ECharts 的配置项。' },

  // === 判断题 5题 ===
  { type: 'true_false', question: 'ECharts 的 legend 组件必须配合 series 中的 name 属性才能正确显示图例。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'A', explanation: 'legend 图例组件需要读取 series 中的 name 值来显示对应的数据系列名称。' },
  { type: 'true_false', question: 'ECharts 支持在同一个图表中混合展示折线图和柱状图。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'A', explanation: 'ECharts 支持混搭图表，通过在 series 数组中设置不同的 type 值（line、bar 等）即可在同一个图表中展示多种图表类型。' },
  { type: 'true_false', question: 'ECharts 的 tooltip 组件只能通过鼠标悬停触发。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'B', explanation: 'tooltip 可以通过 triggerEvent: true 和 dispatchAction 事件来触发，也可以通过 show 方法主动显示。' },
  { type: 'true_false', question: 'ECharts 中 color 调色盘只能设置一种颜色。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'B', explanation: 'ECharts 的 color 调色盘可以设置一个颜色数组，图表会自动按顺序为各系列分配颜色，也可以使用全局调色盘。' },
  { type: 'true_false', question: 'ECharts 的 dataset 组件用于直接管理数据，可以替代 series.data。', options: JSON.stringify(['A. 正确', 'B. 错误']), answer: 'A', explanation: 'dataset 组件提供了数据管理功能，可以通过 encode 属性将数据映射到不同的系列和坐标轴，简化数据管理。' },

  // === 填空题 5题 ===
  { type: 'fill_blank', question: 'ECharts 中用于绘制折线图的 type 值是 ______。', options: null, answer: 'line', explanation: '在 ECharts 中，设置 series.type 为 "line" 即可绘制折线图。' },
  { type: 'fill_blank', question: 'ECharts 初始化实例的方法是 echarts.______(dom, theme, opts)。', options: null, answer: 'init', explanation: 'echarts.init() 是初始化 ECharts 实例的静态方法，接收 DOM 容器、主题和可选参数。' },
  { type: 'fill_blank', question: 'ECharts 配置项中，图表距离容器边界的距离由 ______ 属性控制。', options: null, answer: 'grid', explanation: 'grid 配置项控制图表与容器边界的距离，包含 left、right、top、bottom 等子属性。' },
  { type: 'fill_blank', question: 'ECharts 饼图中通过设置 ______: "rose" 可以实现南丁格尔玫瑰图效果。', options: null, answer: 'roseType', explanation: '将 series 中的 roseType 设为 "rose" 即可将饼图展示为南丁格尔玫瑰图（半径玫瑰图）。' },
  { type: 'fill_blank', question: '在 ECharts 中，多个图表之间通过 ______ 方法可以实现联动交互。', options: null, answer: 'connect', explanation: 'echarts.connect() 方法可以将多个图表实例关联起来，实现图例切换、数据刷选等联动交互。' },
]

const stmt = db.prepare('INSERT INTO questions (type, question, options, answer, explanation) VALUES (?, ?, ?, ?, ?)')

const existing = db.prepare('SELECT COUNT(*) as count FROM questions').get()
if (existing.count === 0) {
  const insertMany = db.transaction((items) => {
    for (const item of items) {
      stmt.run(item.type, item.question, item.options, item.answer, item.explanation)
    }
  })
  insertMany(questions)
  console.log(`✓ 已插入 ${questions.length} 道测试题目`)
} else {
  console.log(`数据库已有 ${existing.count} 道题目，跳过种子数据`)
}
```

Expected: File created at `server/seed.js`

- [ ] **Step 2: 运行种子数据**

Run: `npm run seed`
Expected: 输出 "已插入 20 道测试题目"

---

### Task 4: 前端 — 路由 + API 封装

**Files:**
- Create: `src/router/index.js`
- Create: `src/api/index.js`

- [ ] **Step 1: 创建 src/router/index.js**

```js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Quiz from '../pages/Quiz.vue'
import Result from '../pages/Result.vue'
import Admin from '../pages/Admin.vue'
import QuestionEdit from '../pages/QuestionEdit.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/quiz', name: 'Quiz', component: Quiz },
  { path: '/result', name: 'Result', component: Result },
  { path: '/admin', name: 'Admin', component: Admin },
  { path: '/admin/edit/:id?', name: 'QuestionEdit', component: QuestionEdit },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
```

Expected: File created

- [ ] **Step 2: 创建 src/api/index.js**

```js
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default {
  // 题目
  getQuestions(params) { return api.get('/questions', { params }) },
  getRandomQuestions(count) { return api.get(`/questions/random?count=${count}`) },
  getQuestion(id) { return api.get(`/questions/${id}`) },
  createQuestion(data) { return api.post('/questions', data) },
  updateQuestion(id, data) { return api.put(`/questions/${id}`, data) },
  deleteQuestion(id) { return api.delete(`/questions/${id}`) },

  // 记录
  submitRecord(data) { return api.post('/records', data) },
  getStats(sessionId) { return api.get(`/records/stats?session_id=${sessionId}`) },
  toggleBookmark(data) { return api.post('/records/bookmark', data) },
  getWrongQuestions() { return api.get('/records/wrong') },
}
```

Expected: File created

---

### Task 5: 前端 — App.vue 根组件 + 首页

**Files:**
- Create: `src/App.vue`
- Create: `src/pages/Home.vue`

- [ ] **Step 1: 创建 src/App.vue**

```vue
<template>
  <div class="app">
    <nav class="nav" v-if="$route.name !== 'Quiz'">
      <div class="container nav-inner">
        <router-link to="/" class="nav-title">📊 ECharts 刷题</router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/admin" class="nav-link">题库管理</router-link>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
</script>

<style scoped>
.nav { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
.nav-inner { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; }
.nav-title { font-weight: 700; font-size: 1.1rem; text-decoration: none; color: var(--text); }
.nav-links { display: flex; gap: 1.5rem; }
.nav-link { text-decoration: none; color: var(--text-secondary); font-size: 0.9rem; }
.nav-link:hover { color: var(--primary); }
</style>
```

Expected: File created

- [ ] **Step 2: 创建 src/pages/Home.vue**

```vue
<template>
  <div class="container home">
    <div class="hero">
      <h1>📊 ECharts 刷题</h1>
      <p class="subtitle">共 {{ totalQuestions }} 道题，涵盖 ECharts 可视化全知识</p>
    </div>

    <div class="card">
      <h3>选择刷题数量</h3>
      <div class="btn-group">
        <button class="btn btn-primary" @click="startQuiz(10)">随机 10 题</button>
        <button class="btn btn-secondary" @click="startQuiz(20)">随机 20 题</button>
        <button class="btn btn-secondary" @click="startQuiz(0)">全部随机</button>
      </div>
    </div>

    <div class="card" v-if="lastStats">
      <h3>上次练习记录</h3>
      <div class="stats-row">
        <div class="stat">
          <span class="stat-num">{{ lastStats.total }}</span>
          <span class="stat-label">总题</span>
        </div>
        <div class="stat stat-correct">
          <span class="stat-num">{{ lastStats.correct }}</span>
          <span class="stat-label">正确</span>
        </div>
        <div class="stat stat-wrong">
          <span class="stat-num">{{ lastStats.wrong }}</span>
          <span class="stat-label">错误</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ lastStats.correctRate }}%</span>
          <span class="stat-label">正确率</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>快速入口</h3>
      <div class="btn-group">
        <router-link to="/admin" class="btn btn-secondary">📝 题库管理</router-link>
        <button class="btn btn-secondary" @click="goWrong">❌ 错题集</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'

const router = useRouter()
const totalQuestions = ref(0)
const lastStats = ref(null)

onMounted(async () => {
  const res = await api.getQuestions()
  totalQuestions.value = res.data.length
  const sessionId = localStorage.getItem('lastSessionId')
  if (sessionId) {
    try {
      const stats = await api.getStats(sessionId)
      if (stats.data.total > 0) {
        stats.data.correctRate = Math.round(stats.data.correct / stats.data.total * 100)
        lastStats.value = stats.data
      }
    } catch {}
  }
})

function startQuiz(count) {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sessionId)
  router.push({ name: 'Quiz', query: { count: count || undefined, session_id: sessionId } })
}

async function goWrong() {
  const res = await api.getWrongQuestions()
  if (res.data.length === 0) { alert('暂无错题！'); return }
  const sessionId = 'wrong-' + Date.now().toString(36)
  localStorage.setItem('lastSessionId', sessionId)
  router.push({ name: 'Quiz', query: { session_id: sessionId, wrong: 1 } })
}
</script>

<style scoped>
.hero { text-align: center; padding: 2rem 0 1.5rem; }
.hero h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
.subtitle { color: var(--text-secondary); }
.card { background: var(--card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid var(--border); }
.card h3 { font-size: 1rem; margin-bottom: 1rem; }
.btn-group { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.stats-row { display: flex; gap: 1rem; }
.stat { flex: 1; text-align: center; padding: 0.75rem; background: var(--bg); border-radius: 8px; }
.stat-num { display: block; font-size: 1.5rem; font-weight: 700; }
.stat-label { font-size: 0.8rem; color: var(--text-secondary); }
.stat-correct .stat-num { color: var(--success); }
.stat-wrong .stat-num { color: var(--error); }
</style>
```

Expected: File created

---

### Task 6: 前端 — 刷题页面 Quiz.vue

**Files:**
- Create: `src/pages/Quiz.vue`

- [ ] **Step 1: 创建 src/pages/Quiz.vue**

```vue
<template>
  <div class="quiz-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="progress-text">{{ answeredCount }}/{{ questions.length }}</span>
        <button class="btn btn-secondary btn-sm" @click="finishQuiz">完成</button>
      </div>
      <div class="question-numbers">
        <button
          v-for="(q, idx) in questions"
          :key="q.id"
          class="q-num"
          :class="{
            answered: answers[q.id] !== undefined,
            correct: results[q.id] === true,
            wrong: results[q.id] === false,
            active: currentIndex === idx
          }"
          @click="goTo(idx)"
        >{{ idx + 1 }}</button>
      </div>
    </aside>

    <main class="quiz-main">
      <div class="quiz-card" v-if="currentQuestion">
        <div class="q-header">
          <span class="q-type">{{ typeLabel }}</span>
          <span class="q-index">第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
          <button
            class="btn-icon"
            :class="{ bookmarked: bookmarkedSet.has(currentQuestion.id) }"
            @click="toggleBookmark"
          >{{ bookmarkedSet.has(currentQuestion.id) ? '★' : '☆' }}</button>
        </div>

        <div class="q-text">{{ currentQuestion.question }}</div>

        <!-- 选择题 -->
        <div class="options" v-if="currentQuestion.type === 'single_choice'">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option"
            :class="{
              selected: answers[currentQuestion.id] === optionValue(idx),
              correct: submitted && currentQuestion.answer === optionValue(idx),
              wrong: submitted && answers[currentQuestion.id] === optionValue(idx) && currentQuestion.answer !== optionValue(idx),
              disabled: submitted
            }"
            @click="selectAnswer(idx)"
          >{{ opt }}</button>
        </div>

        <!-- 多选题 -->
        <div class="options" v-else-if="currentQuestion.type === 'multi_choice'">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option"
            :class="{
              selected: multiSelected.includes(optionValue(idx)),
              correct: submitted && currentQuestion.answer.split(',').includes(optionValue(idx)),
              wrong: submitted && multiSelected.includes(optionValue(idx)) && !currentQuestion.answer.split(',').includes(optionValue(idx)),
              disabled: submitted
            }"
            @click="toggleMultiSelect(optionValue(idx))"
          >{{ opt }}</button>
          <button class="btn btn-primary btn-sm" @click="submitMultiAnswer" v-if="!submitted">确认选择</button>
        </div>

        <!-- 判断题 -->
        <div class="options" v-else-if="currentQuestion.type === 'true_false'">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option"
            :class="{
              selected: answers[currentQuestion.id] === optionValue(idx),
              correct: submitted && currentQuestion.answer === optionValue(idx),
              wrong: submitted && answers[currentQuestion.id] === optionValue(idx) && currentQuestion.answer !== optionValue(idx),
              disabled: submitted
            }"
            @click="selectAnswer(idx)"
          >{{ opt }}</button>
        </div>

        <!-- 填空题 -->
        <div class="fill-area" v-else-if="currentQuestion.type === 'fill_blank'">
          <input
            v-model="fillAnswer"
            class="fill-input"
            :disabled="submitted"
            placeholder="请输入答案"
            @keyup.enter="submitFillAnswer"
          />
          <button class="btn btn-primary btn-sm" @click="submitFillAnswer" v-if="!submitted">确认</button>
        </div>

        <!-- 答案解析 -->
        <div class="feedback" v-if="submitted">
          <div class="result-badge" :class="isCurrentCorrect ? 'correct' : 'wrong'">
            {{ isCurrentCorrect ? '✓ 正确' : '✗ 错误' }}
          </div>
          <div class="correct-answer">
            {{ isCurrentCorrect ? '' : `正确答案：${currentQuestion.answer}` }}
            <span v-if="currentQuestion.type === 'fill_blank'">{{ currentQuestion.answer }}</span>
          </div>
          <div class="explanation">{{ currentQuestion.explanation }}</div>
        </div>

        <div class="q-footer">
          <button class="btn btn-secondary btn-sm" @click="prev" :disabled="currentIndex === 0">上一题</button>
          <button
            class="btn btn-primary btn-sm"
            @click="submitted ? next() : submitAnswer()"
          >{{ submitted ? (currentIndex === questions.length - 1 ? '查看结果' : '下一题') : '提交答案' }}</button>
        </div>
      </div>

      <div class="quiz-card empty" v-else>
        <p>暂无题目，请先<a href="/admin">添加题目</a></p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})
const results = ref({})
const submitted = ref(false)
const fillAnswer = ref('')
const multiSelected = ref([])
const bookmarkedSet = ref(new Set())

const typeLabel = computed(() => {
  const map = { single_choice: '单选题', multi_choice: '多选题', true_false: '判断题', fill_blank: '填空题' }
  return map[currentQuestion.value?.type] || ''
})

const currentQuestion = computed(() => questions.value[currentIndex.value])
const isCurrentCorrect = computed(() => results.value[currentQuestion.value?.id])

const answeredCount = computed(() => Object.keys(answers.value).length)

const sessionId = ref(route.query.session_id || Date.now().toString(36))

function optionValue(idx) {
  return String.fromCharCode(65 + idx)
}

function selectAnswer(idx) {
  if (submitted.value) return
  const val = optionValue(idx)
  answers.value[currentQuestion.value.id] = val
}

function toggleMultiSelect(val) {
  if (submitted.value) return
  const i = multiSelected.value.indexOf(val)
  if (i >= 0) multiSelected.value.splice(i, 1)
  else multiSelected.value.push(val)
}

function submitMultiAnswer() {
  const sorted = [...multiSelected.value].sort().join(',')
  answers.value[currentQuestion.value.id] = sorted
  submitAnswer()
}

function submitFillAnswer() {
  if (!fillAnswer.value.trim()) return
  answers.value[currentQuestion.value.id] = fillAnswer.value.trim()
  submitAnswer()
}

async function submitAnswer() {
  const q = currentQuestion.value
  const userAnswer = answers.value[q.id]
  if (!userAnswer) { alert('请先作答！'); return }

  let correct = false
  if (q.type === 'multi_choice') {
    const sorted = userAnswer.split(',').sort().join(',')
    const correctSorted = q.answer.split(',').sort().join(',')
    correct = sorted === correctSorted
  } else if (q.type === 'fill_blank') {
    correct = userAnswer.toLowerCase() === q.answer.toLowerCase()
  } else {
    correct = userAnswer === q.answer
  }
  results.value[q.id] = correct
  submitted.value = true

  await api.submitRecord({
    question_id: q.id,
    user_answer: userAnswer,
    is_correct: correct,
    session_id: sessionId.value
  })
}

async function toggleBookmark() {
  if (!submitted.value) return
  await api.toggleBookmark({
    question_id: currentQuestion.value.id,
    session_id: sessionId.value
  })
  if (bookmarkedSet.value.has(currentQuestion.value.id)) {
    bookmarkedSet.value.delete(currentQuestion.value.id)
  } else {
    bookmarkedSet.value.add(currentQuestion.value.id)
  }
}

function goTo(idx) { currentIndex.value = idx; submitted.value = false; fillAnswer.value = ''; multiSelected.value = [] }
function prev() { if (currentIndex.value > 0) { currentIndex.value--; submitted.value = false; fillAnswer.value = ''; multiSelected.value = [] } }
function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    submitted.value = false
    fillAnswer.value = ''
    multiSelected.value = []
  } else {
    finishQuiz()
  }
}

function finishQuiz() {
  router.push({ name: 'Result', query: { session_id: sessionId.value } })
}

onMounted(async () => {
  const count = parseInt(route.query.count)
  if (route.query.wrong) {
    const res = await api.getWrongQuestions()
    const ids = res.data.map(r => r.question_id)
    if (ids.length === 0) { alert('暂无错题'); router.push('/'); return }
    const all = await api.getQuestions()
    questions.value = all.data.filter(q => ids.includes(q.id))
  } else if (count > 0) {
    const res = await api.getRandomQuestions(count)
    questions.value = res.data
  } else {
    const res = await api.getRandomQuestions(999)
    questions.value = res.data
  }
})

onMounted(async () => {
  const count = parseInt(route.query.count)
  const res = route.query.wrong
    ? (await api.getWrongQuestions()).data.length > 0
      ? (await api.getQuestions()).data.filter(q => (await api.getWrongQuestions()).data.map(r => r.question_id).includes(q.id))
      : []
    : count > 0
      ? (await api.getRandomQuestions(count)).data
      : (await api.getRandomQuestions(999)).data
  questions.value = res || []
})
</script>

<style scoped>
.quiz-layout { display: flex; height: calc(100vh - 50px); }
.sidebar { width: 80px; background: #fff; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1rem 0.75rem; flex-shrink: 0; overflow-y: auto; }
.sidebar-header { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.progress-text { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.question-numbers { display: flex; flex-direction: column; gap: 0.35rem; align-items: center; }
.q-num { width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 6px; background: #fff; font-size: 0.8rem; cursor: pointer; }
.q-num.active { border-color: var(--primary); background: var(--primary); color: #fff; }
.q-num.answered { border-color: var(--text-secondary); }
.q-num.correct { border-color: var(--success); background: #d4edda; color: var(--success); }
.q-num.wrong { border-color: var(--error); background: #f8d7da; color: var(--error); }
.quiz-main { flex: 1; display: flex; justify-content: center; padding: 2rem; overflow-y: auto; }
.quiz-card { background: #fff; border-radius: 12px; border: 1px solid var(--border); padding: 2rem; max-width: 640px; width: 100%; align-self: flex-start; }
.quiz-card.empty { display: flex; justify-content: center; align-items: center; min-height: 300px; }
.q-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.q-type { font-size: 0.75rem; background: var(--bg); padding: 0.2rem 0.6rem; border-radius: 4px; color: var(--text-secondary); }
.q-index { font-size: 0.85rem; color: var(--text-secondary); flex: 1; }
.btn-icon { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-secondary); }
.btn-icon.bookmarked { color: var(--warning); }
.q-text { font-size: 1.05rem; font-weight: 500; margin-bottom: 1.5rem; line-height: 1.6; }
.options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
.option { display: block; width: 100%; text-align: left; padding: 0.8rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: #fff; font-size: 0.95rem; cursor: pointer; transition: all 0.1s; }
.option:hover:not(.disabled) { border-color: var(--primary); }
.option.selected { border-color: var(--primary); background: #e8f4fd; }
.option.correct { border-color: var(--success); background: #d4edda; }
.option.wrong { border-color: var(--error); background: #f8d7da; }
.option.disabled { cursor: default; opacity: 0.85; }
.fill-area { margin-bottom: 1rem; }
.fill-input { width: 100%; padding: 0.8rem; border: 1px solid var(--border); border-radius: 8px; font-size: 1rem; margin-bottom: 0.5rem; }
.feedback { margin: 1rem 0; padding: 1rem; border-radius: 8px; background: var(--bg); }
.result-badge { font-weight: 600; font-size: 1rem; margin-bottom: 0.5rem; }
.result-badge.correct { color: var(--success); }
.result-badge.wrong { color: var(--error); }
.correct-answer { font-size: 0.9rem; margin-bottom: 0.35rem; color: var(--text-secondary); }
.explanation { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
.q-footer { display: flex; justify-content: space-between; margin-top: 1.5rem; }
.btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; }
</style>
```

Expected: File created
Note: The `onMounted` has a duplicate call. Let me fix that in the implementation - just use one `onMounted`.

---

### Task 7: 前端 — 结果页 Result.vue

**Files:**
- Create: `src/pages/Result.vue`

- [ ] **Step 1: 创建 src/pages/Result.vue**

```vue
<template>
  <div class="container result">
    <div class="result-card" v-if="stats">
      <div class="score" :class="scoreClass">{{ stats.correctRate }}%</div>
      <p class="score-label">正确率</p>

      <div class="stat-cards">
        <div class="mini-stat">
          <span class="mini-num">{{ stats.total }}</span>
          <span class="mini-label">总题</span>
        </div>
        <div class="mini-stat correct">
          <span class="mini-num">{{ stats.correct }}</span>
          <span class="mini-label">正确</span>
        </div>
        <div class="mini-stat wrong">
          <span class="mini-num">{{ stats.wrong }}</span>
          <span class="mini-label">错误</span>
        </div>
        <div class="mini-stat bookmark">
          <span class="mini-num">{{ stats.bookmarked }}</span>
          <span class="mini-label">收藏</span>
        </div>
      </div>

      <div class="wrong-list" v-if="stats.wrongList.length">
        <h3>错题回顾</h3>
        <div class="wrong-item" v-for="item in stats.wrongList" :key="item.id">
          <div class="wrong-q">{{ item.question }}</div>
          <div class="wrong-answer">正确答案：{{ item.answer }}</div>
          <div class="wrong-explanation">{{ item.explanation }}</div>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn btn-primary" @click="retry">再来一轮</button>
        <button class="btn btn-secondary" @click="router.push('/')">返回首页</button>
      </div>
    </div>
    <div v-else class="result-card loading"><p>加载中...</p></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()
const stats = ref(null)

const scoreClass = computed(() => {
  if (!stats.value) return ''
  const rate = stats.value.correctRate
  if (rate >= 80) return 'excellent'
  if (rate >= 60) return 'good'
  return 'try-again'
})

onMounted(async () => {
  const sessionId = route.query.session_id
  if (!sessionId) return
  const res = await api.getStats(sessionId)
  const data = res.data
  if (data.total > 0) {
    data.correctRate = Math.round(data.correct / data.total * 100)
  } else {
    data.correctRate = 0
  }
  stats.value = data
})

function retry() {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sessionId)
  router.push({ name: 'Quiz', query: { session_id: sessionId } })
}
</script>

<style scoped>
.result-card { max-width: 600px; margin: 2rem auto; text-align: center; background: #fff; border-radius: 12px; padding: 2rem; border: 1px solid var(--border); }
.loading { display: flex; justify-content: center; align-items: center; min-height: 200px; }
.score { font-size: 3.5rem; font-weight: 800; }
.score.excellent { color: var(--success); }
.score.good { color: var(--warning); }
.score.try-again { color: var(--error); }
.score-label { color: var(--text-secondary); margin-bottom: 1.5rem; }
.stat-cards { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.mini-stat { flex: 1; padding: 1rem 0.5rem; background: var(--bg); border-radius: 8px; }
.mini-num { display: block; font-size: 1.3rem; font-weight: 700; }
.mini-label { font-size: 0.8rem; color: var(--text-secondary); }
.mini-stat.correct .mini-num { color: var(--success); }
.mini-stat.wrong .mini-num { color: var(--error); }
.mini-stat.bookmark .mini-num { color: var(--warning); }
.wrong-list { text-align: left; margin: 1.5rem 0; }
.wrong-list h3 { font-size: 1rem; margin-bottom: 0.75rem; }
.wrong-item { padding: 0.75rem; background: var(--bg); border-radius: 8px; margin-bottom: 0.5rem; }
.wrong-q { font-weight: 500; margin-bottom: 0.3rem; }
.wrong-answer { font-size: 0.85rem; color: var(--error); margin-bottom: 0.2rem; }
.wrong-explanation { font-size: 0.8rem; color: var(--text-secondary); }
.result-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; }
</style>
```

Expected: File created

---

### Task 8: 前端 — 题库管理页 Admin.vue 和 QuestionEdit.vue

**Files:**
- Create: `src/pages/Admin.vue`
- Create: `src/pages/QuestionEdit.vue`

- [ ] **Step 1: 创建 src/pages/Admin.vue**

```vue
<template>
  <div class="container admin">
    <div class="admin-header">
      <h2>题库管理</h2>
      <router-link to="/admin/edit" class="btn btn-primary">+ 新增题目</router-link>
    </div>

    <input v-model="search" class="search-input" placeholder="搜索题目..." />

    <div class="question-list">
      <div class="q-item" v-for="q in filteredQuestions" :key="q.id">
        <div class="q-info">
          <span class="q-type-badge" :class="q.type">{{ typeName(q.type) }}</span>
          <div class="q-text">{{ q.question }}</div>
        </div>
        <div class="q-actions">
          <button class="btn-icon" @click="edit(q.id)">✏️</button>
          <button class="btn-icon" @click="remove(q.id)">🗑️</button>
        </div>
      </div>
      <div v-if="filteredQuestions.length === 0" class="empty">暂无题目</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'

const router = useRouter()
const questions = ref([])
const search = ref('')

const filteredQuestions = computed(() => {
  if (!search.value) return questions.value
  return questions.value.filter(q => q.question.includes(search.value))
})

function typeName(type) {
  const map = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空' }
  return map[type] || type
}

function edit(id) { router.push(`/admin/edit/${id}`) }

async function remove(id) {
  if (!confirm('确定删除这道题吗？')) return
  await api.deleteQuestion(id)
  questions.value = questions.value.filter(q => q.id !== id)
}

onMounted(async () => {
  const res = await api.getQuestions()
  questions.value = res.data
})
</script>

<style scoped>
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.admin-header h2 { font-size: 1.3rem; }
.search-input { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
.question-list { display: flex; flex-direction: column; gap: 0.5rem; }
.q-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #fff; border-radius: 8px; border: 1px solid var(--border); }
.q-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
.q-type-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); flex-shrink: 0; }
.q-type-badge.single_choice { background: #e8f4fd; color: var(--primary); }
.q-type-badge.multi_choice { background: #fff3cd; color: #856404; }
.q-type-badge.true_false { background: #d4edda; color: var(--success); }
.q-type-badge.fill_blank { background: #f8d7da; color: var(--error); }
.q-text { font-size: 0.9rem; }
.q-actions { display: flex; gap: 0.25rem; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem; }
.empty { text-align: center; color: var(--text-secondary); padding: 2rem; }
</style>
```

Expected: File created

- [ ] **Step 2: 创建 src/pages/QuestionEdit.vue**

```vue
<template>
  <div class="container">
    <div class="edit-card">
      <h2>{{ isEdit ? '编辑题目' : '新增题目' }}</h2>

      <div class="form-group">
        <label>题型</label>
        <select v-model="form.type" class="form-input">
          <option value="single_choice">单选题</option>
          <option value="multi_choice">多选题</option>
          <option value="true_false">判断题</option>
          <option value="fill_blank">填空题</option>
        </select>
      </div>

      <div class="form-group">
        <label>题目内容</label>
        <textarea v-model="form.question" class="form-input" rows="3" placeholder="请输入题目"></textarea>
      </div>

      <div class="form-group" v-if="form.type !== 'fill_blank'">
        <label>选项（每行一个，如：A. 选项内容）</label>
        <textarea v-model="optionsText" class="form-input" rows="4" placeholder="A. 选项1&#10;B. 选项2&#10;C. 选项3&#10;D. 选项4"></textarea>
      </div>

      <div class="form-group">
        <label>正确答案</label>
        <input v-model="form.answer" class="form-input" placeholder="单选题/判断题填字母如 A；多选题填 A,B,C；填空题填答案文本" />
        <span class="form-hint" v-if="form.type === 'single_choice'">填写正确选项字母，如：A</span>
        <span class="form-hint" v-else-if="form.type === 'multi_choice'">填写正确选项字母，用逗号分隔，如：A,B,C</span>
        <span class="form-hint" v-else-if="form.type === 'true_false'">A 表示正确，B 表示错误</span>
        <span class="form-hint" v-else-if="form.type === 'fill_blank'">填写正确答案文本</span>
      </div>

      <div class="form-group">
        <label>答案解析（选填）</label>
        <textarea v-model="form.explanation" class="form-input" rows="2" placeholder="解析内容"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="save">{{ isEdit ? '保存修改' : '添加题目' }}</button>
        <button class="btn btn-secondary" @click="router.push('/admin')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!route.params.id)
const form = ref({ type: 'single_choice', question: '', answer: '', explanation: '' })
const optionsText = ref('')

onMounted(async () => {
  if (isEdit.value) {
    const res = await api.getQuestion(route.params.id)
    const q = res.data
    form.value = { type: q.type, question: q.question, answer: q.answer, explanation: q.explanation || '' }
    if (q.options) optionsText.value = q.options.join('\n')
  }
})

async function save() {
  if (!form.value.question || !form.value.answer) {
    alert('请填写题目和答案')
    return
  }
  const data = { ...form.value }
  if (data.type !== 'fill_blank') {
    data.options = optionsText.value.split('\n').filter(s => s.trim())
  }

  try {
    if (isEdit.value) {
      await api.updateQuestion(route.params.id, data)
    } else {
      await api.createQuestion(data)
    }
    router.push('/admin')
  } catch (e) {
    alert('保存失败：' + (e.response?.data?.error || e.message))
  }
}
</script>

<style scoped>
.edit-card { max-width: 640px; margin: 2rem auto; background: #fff; border-radius: 12px; padding: 2rem; border: 1px solid var(--border); }
.edit-card h2 { font-size: 1.3rem; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.4rem; }
.form-input { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem; font-family: inherit; }
.form-input:focus { outline: none; border-color: var(--primary); }
select.form-input { background: #fff; }
textarea.form-input { resize: vertical; }
.form-hint { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; }
.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
</style>
```

Expected: File created

---

### Task 9: 修复 Quiz.vue 的重复 onMounted

**Files:**
- Modify: `src/pages/Quiz.vue`

- [ ] **Step 1: 修复 Quiz.vue 中的重复 onMounted**

在最终的 Quiz.vue 中，确保只有一个 onMounted 调用。删除样板文件中的重复 onMounted 块（第二个块覆盖了第一个），保留第一个逻辑更完善的块。

Expected: Quiz.vue 只有 1 个 onMounted

---

### Task 10: 运行测试 & 验证

- [ ] **Step 1: 启动后端服务**

Run: `npm run server`
Expected: 输出 "Server running at http://localhost:3000"

- [ ] **Step 2: 启动前端开发服务器**

Run: `npm run dev` (在新终端)
Expected: 输出 "Local: http://localhost:5173"

- [ ] **Step 3: 浏览器验证**

打开 http://localhost:5173
验证：
- 首页显示4种刷题选项和快速入口
- 点击"随机10题"进入刷题页
- 左侧题号导航区显示10个题号
- 作答后显示对错和答案解析
- 收藏按钮可用
- 完成所有题后进入结果页显示统计
- 返回首页，进入题库管理
- 题库管理显示20道题，可新增/编辑/删除
