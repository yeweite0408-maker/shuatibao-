<template>
  <div class="selection-page">
    <div class="page-header">
      <div class="container">
        <button class="back-btn" @click="$router.push('/')">← 返回</button>
        <h1>{{ subject }} 题库</h1>
        <p class="header-count">{{ questions.length }} 道题</p>
      </div>
    </div>

    <div class="container">
      <div class="quiz-actions">
        <button class="btn-quiz sequential" @click="startSequential">📖 顺序练习</button>
        <button class="btn-quiz random" @click="startRandom">🎲 随机练习</button>
        <button class="btn-quiz import-btn" @click="showImport = true">📥 批量导入</button>
      </div>

      <div class="question-table" v-if="questions.length > 0">
        <div class="table-header">
          <span class="col-num">#</span>
          <span class="col-type">题型</span>
          <span class="col-q">题目</span>
          <span class="col-stats">答题情况</span>
        </div>
        <div class="table-row" v-for="(q, idx) in questions" :key="q.id" @click="openQuestion(q.id)">
          <span class="col-num">{{ idx + 1 }}</span>
          <span class="col-type">
            <span class="type-badge">{{ typeLabel(q.type) }}</span>
          </span>
          <span class="col-q">{{ q.question }}</span>
          <span class="col-stats">
            <span v-if="q.totalAttempts > 0" class="stats-info" :class="rateClass(q.correctRate)">
              {{ q.correctRate }}% ({{ q.totalAttempts }}人)
            </span>
            <span v-else class="stats-info no-data">暂无数据</span>
          </span>
        </div>
      </div>
      <div v-else class="empty">
        <p>该题库暂无题目</p>
        <button class="btn-quiz import-btn" @click="showImport = true" style="margin-top:1rem;">📥 批量导入题目</button>
      </div>
    </div>

    <!-- 批量导入对话框 -->
    <div class="modal-overlay" v-if="showImport" @click.self="showImport = false">
      <div class="modal">
        <h3>批量导入 — {{ subject }}</h3>
        <p class="modal-hint">粘贴 JSON 格式的题目数组</p>
        <div class="modal-example">
          <pre>[
  {
    "type": "single_choice",
    "question": "题目",
    "options": ["A. xxx", "B. xxx"],
    "answer": "A"
  }
]</pre>
        </div>
        <textarea v-model="importJson" class="import-textarea" rows="8" placeholder='请粘贴 JSON...'></textarea>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="batchImport" :disabled="importing">{{ importing ? '导入中...' : '确认导入' }}</button>
          <button class="btn btn-secondary" @click="showImport = false">取消</button>
        </div>
        <div class="import-result" v-if="importResult">{{ importResult }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()
const subject = ref(route.params.subject)
const questions = ref([])
const showImport = ref(false)
const importJson = ref('')
const importing = ref(false)
const importResult = ref('')

function typeLabel(type) {
  const map = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空' }
  return map[type] || type
}
function rateClass(rate) {
  if (rate >= 70) return 'high'
  if (rate >= 40) return 'mid'
  return 'low'
}

onMounted(async () => {
  try {
    const res = await api.getSubjectQuestions(subject.value)
    questions.value = res.data
  } catch {}
})

function startSequential() {
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sid)
  router.push({ name: 'Quiz', query: { session_id: sid, subject: subject.value, sequential: 1 } })
}

function startRandom() {
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sid)
  router.push({ name: 'Quiz', query: { count: 10, session_id: sid, subject: subject.value, random: 1 } })
}

function openQuestion(id) {
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sid)
  router.push({ name: 'Quiz', query: { question_id: id, session_id: sid } })
}

async function batchImport() {
  let data
  try { data = JSON.parse(importJson.value) } catch { importResult.value = '❌ JSON 格式错误'; return }
  if (!Array.isArray(data) || data.length === 0) { importResult.value = '❌ 请传入非空数组'; return }
  importing.value = true
  importResult.value = ''
  try {
    // 给每个题目加上当前科目
    const items = data.map(q => ({ ...q, subject: subject.value }))
    const res = await api.batchImportQuestions(items)
    importResult.value = `✅ 成功导入 ${res.data.imported} 道题${res.data.status === 'pending' ? '（待审核）' : ''}`
    importJson.value = ''
    // 刷新列表
    const qRes = await api.getSubjectQuestions(subject.value)
    questions.value = qRes.data
  } catch (e) {
    importResult.value = '❌ 导入失败：' + (e.response?.data?.error || e.message)
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.page-header { background: #fff; border-bottom: 1px solid var(--border); padding: 1.2rem 0; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.3rem; font-weight: 700; }
.back-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; padding: 0; margin-bottom: 0.5rem; display: block; }
.back-btn:hover { color: var(--text); }
.header-count { font-size: 0.85rem; color: var(--text-secondary); }

.quiz-actions { display: flex; gap: 0.75rem; margin-bottom: 1.2rem; flex-wrap: wrap; }
.btn-quiz { padding: 0.7rem 1.5rem; border: none; border-radius: 10px; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; font-weight: 500; }
.btn-quiz.sequential { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.btn-quiz.random { background: linear-gradient(135deg, #f093fb, #f5576c); color: #fff; }
.btn-quiz.import-btn { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
.btn-quiz:hover { opacity: 0.9; transform: translateY(-1px); }

.question-table { background: #fff; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
.table-header, .table-row { display: flex; align-items: center; padding: 0.75rem 1rem; gap: 0.75rem; }
.table-header { background: var(--bg); font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
.table-row { cursor: pointer; transition: background 0.1s; border-top: 1px solid var(--border); }
.table-row:hover { background: #f8f8ff; }
.col-num { width: 2.5rem; flex-shrink: 0; font-size: 0.85rem; color: var(--text-secondary); }
.col-type { width: 3.5rem; flex-shrink: 0; }
.col-q { flex: 1; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.col-stats { width: 7rem; text-align: right; flex-shrink: 0; }
.type-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); }
.stats-info { font-size: 0.8rem; font-weight: 600; }
.stats-info.high { color: var(--success); }
.stats-info.mid { color: var(--warning); }
.stats-info.low { color: var(--error); }
.stats-info.no-data { color: var(--text-secondary); font-weight: 400; }
.empty { text-align: center; padding: 3rem; color: var(--text-secondary); }

@media (max-width: 640px) {
  .page-header { padding: 0.8rem 0; }
  .page-header h1 { font-size: 1.1rem; }
  .quiz-actions { gap: 0.5rem; }
  .btn-quiz { padding: 0.5rem 1rem; font-size: 0.8rem; flex: 1; text-align: center; }
  .table-header, .table-row { padding: 0.5rem 0.6rem; gap: 0.4rem; font-size: 0.78rem; }
  .col-num { width: 1.8rem; }
  .col-type { width: 2.8rem; }
  .col-stats { width: 5.5rem; }
  .col-q { font-size: 0.82rem; }
  .modal { padding: 1.2rem; max-width: 100%; margin: 0 0.5rem; }
}

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 14px; padding: 2rem; width: 90%; max-width: 560px; max-height: 85vh; overflow-y: auto; }
.modal h3 { font-size: 1.2rem; margin-bottom: 0.3rem; }
.modal-hint { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
.modal-example { background: #f5f5f7; border-radius: 8px; padding: 0.6rem; margin-bottom: 0.5rem; overflow-x: auto; }
.modal-example pre { font-size: 0.72rem; line-height: 1.4; white-space: pre; }
.import-textarea { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-family: monospace; font-size: 0.85rem; resize: vertical; }
.import-textarea:focus { outline: none; border-color: var(--primary); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.btn { padding: 0.6rem 1.5rem; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
.import-result { margin-top: 0.75rem; font-size: 0.9rem; font-weight: 500; }
</style>
