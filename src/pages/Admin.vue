<template>
  <div class="container admin">
    <div class="admin-header">
      <h2>题库管理</h2>
      <div class="admin-actions">
        <button class="btn btn-secondary" @click="showImport = true">📥 批量导入</button>
        <router-link to="/admin/edit" class="btn btn-primary">+ 新增题目</router-link>
      </div>
    </div>

    <input v-model="search" class="search-input" placeholder="搜索题目..." />

    <div class="question-list">
      <div class="q-item" v-for="q in filteredQuestions" :key="q.id">
        <div class="q-info">
          <span class="q-subject" v-if="q.subject">{{ q.subject }}</span>
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

    <!-- 批量导入对话框 -->
    <div class="modal-overlay" v-if="showImport" @click.self="showImport = false">
      <div class="modal">
        <h3>批量导入题目</h3>
        <p class="modal-hint">粘贴 JSON 格式的题目数组，每道题包含 type、question、options（选择题）、answer、explanation（选填）。</p>
        <div class="modal-example">
          <pre>[
  {
    "subject": "科目名",
    "type": "single_choice",
    "question": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": "A",
    "explanation": "解析（选填）"
  }
]</pre>
        </div>
        <textarea v-model="importJson" class="import-textarea" rows="10" placeholder='请粘贴 JSON 格式的题目数据...'></textarea>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="batchImport" :disabled="importing">
            {{ importing ? '导入中...' : '确认导入' }}
          </button>
          <button class="btn btn-secondary" @click="showImport = false">取消</button>
        </div>
        <div class="import-result" v-if="importResult">{{ importResult }}</div>
      </div>
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
const showImport = ref(false)
const importJson = ref('')
const importing = ref(false)
const importResult = ref('')

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
  try {
    await api.deleteQuestion(id)
    questions.value = questions.value.filter(q => q.id !== id)
  } catch {}
}

async function batchImport() {
  let data
  try {
    data = JSON.parse(importJson.value)
  } catch {
    importResult.value = '❌ JSON 格式错误，请检查后重试'
    return
  }
  if (!Array.isArray(data) || data.length === 0) {
    importResult.value = '❌ 请传入非空数组'
    return
  }
  importing.value = true
  importResult.value = ''
  try {
    const res = await api.batchImportQuestions(data)
    importResult.value = `✅ 成功导入 ${res.data.imported} 道题目`
    importJson.value = ''
    const qRes = await api.getQuestions()
    questions.value = qRes.data
  } catch (e) {
    importResult.value = '❌ 导入失败：' + (e.response?.data?.error || e.message)
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  try {
    const res = await api.getQuestions()
    questions.value = res.data
  } catch {}
})
</script>

<style scoped>
.admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.admin-header h2 { font-size: 1.3rem; }
.admin-actions { display: flex; gap: 0.5rem; }
.search-input { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
.search-input:focus { outline: none; border-color: var(--primary); }
.question-list { display: flex; flex-direction: column; gap: 0.5rem; }
.q-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: #fff; border-radius: 8px; border: 1px solid var(--border); }
.q-info { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
.q-type-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); flex-shrink: 0; }
.q-type-badge.single_choice { background: #e8f4fd; color: var(--primary); }
.q-type-badge.multi_choice { background: #fff3cd; color: #856404; }
.q-type-badge.true_false { background: #d4edda; color: var(--success); }
.q-type-badge.fill_blank { background: #f8d7da; color: var(--error); }
.q-subject { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; background: #e8e8f0; color: #555; flex-shrink: 0; }
.q-text { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.q-actions { display: flex; gap: 0.25rem; flex-shrink: 0; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.25rem; }
.empty { text-align: center; color: var(--text-secondary); padding: 2rem; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 12px; padding: 2rem; width: 90%; max-width: 640px; max-height: 85vh; overflow-y: auto; }
.modal h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
.modal-hint { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; }
.modal-example { background: #f0f0f0; border-radius: 6px; padding: 0.75rem; margin-bottom: 0.75rem; overflow-x: auto; }
.modal-example pre { font-size: 0.75rem; line-height: 1.4; white-space: pre; }
.import-textarea { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-family: monospace; font-size: 0.85rem; resize: vertical; }
.import-textarea:focus { outline: none; border-color: var(--primary); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.import-result { margin-top: 0.75rem; padding: 0.5rem; border-radius: 6px; font-size: 0.9rem; font-weight: 500; }
</style>
