<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="container">
        <h1 class="hero-title">📚 刷题宝</h1>
        <p class="hero-desc">选择题库，开始刷题</p>
      </div>
    </div>

    <div class="container">
      <div class="section-header">
        <h2>我的题库</h2>
        <button class="btn-new" @click="showCreateDialog = true">+ 新建题库</button>
      </div>

      <div class="subject-grid" v-if="subjects.length > 0">
        <div
          class="subject-card"
          v-for="s in subjects"
          :key="s.subject"
          @click="goToSubject(s.subject)"
        >
          <div class="card-emoji">{{ subjectEmoji(s.subject) }}</div>
          <div class="card-body">
            <h3 class="card-title">{{ s.subject }}</h3>
            <span class="card-count">{{ s.count }} 道题</span>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>还没有题库，点击上方按钮新建</p>
      </div>

      <div class="section-header" style="margin-top:2rem;">
        <h2>快速操作</h2>
      </div>
      <div class="quick-actions">
        <div class="action-card" @click="quickQuiz">
          <span class="action-icon">🎲</span>
          <span>随机刷题</span>
        </div>
        <div class="action-card" @click="goWrong">
          <span class="action-icon">❌</span>
          <span>错题集</span>
        </div>
        <div class="action-card" @click="$router.push('/leaderboard')">
          <span class="action-icon">🏆</span>
          <span>排行榜</span>
        </div>
        <div class="action-card" @click="$router.push('/admin')" v-if="auth.isLoggedIn && auth.user.role === 'admin'">
          <span class="action-icon">⚙️</span>
          <span>管理后台</span>
        </div>
        <div class="action-card" @click="$router.push('/admin')">
          <span class="action-icon">📝</span>
          <span>上传题目</span>
        </div>
      </div>

      <div class="last-stats" v-if="lastStats">
        <h3>上次练习</h3>
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-val correct">{{ lastStats.correct }}</span>
            <span class="stat-lbl">正确</span>
          </div>
          <div class="stat-item">
            <span class="stat-val wrong">{{ lastStats.wrong }}</span>
            <span class="stat-lbl">错误</span>
          </div>
          <div class="stat-item">
            <span class="stat-val rate">{{ lastStats.correctRate }}%</span>
            <span class="stat-lbl">正确率</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建题库对话框 -->
    <div class="modal-overlay" v-if="showCreateDialog" @click.self="showCreateDialog = false">
      <div class="modal">
        <h3>新建题库</h3>
        <p class="modal-hint">输入新题库名称</p>
        <input v-model="newSubjectName" class="modal-input" placeholder="如：JavaScript、Python、数学" @keyup.enter="createSubject" />
        <div class="modal-actions">
          <button class="btn btn-primary" @click="createSubject('manual')">📝 手动添加</button>
          <button class="btn btn-secondary" @click="createSubject('import')">📥 批量导入</button>
          <button class="btn btn-secondary" @click="showCreateDialog = false">取消</button>
        </div>
        <p class="modal-tip" v-if="showImportTip" style="margin-top:0.8rem;font-size:0.85rem;color:var(--text-secondary);">
          创建后可在题库页继续导入更多题目
        </p>
      </div>
    </div>

    <!-- 批量导入对话框 -->
    <div class="modal-overlay" v-if="showImportDialog" @click.self="showImportDialog = false">
      <div class="modal modal-wide">
        <h3>批量导入 — {{ newSubjectName }}</h3>
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
        <textarea v-model="importJson" class="modal-textarea" rows="8" placeholder='请粘贴 JSON...'></textarea>
        <div class="modal-actions">
          <button class="btn btn-primary" @click="doBatchImport" :disabled="importing">{{ importing ? '导入中...' : '确认导入' }}</button>
          <button class="btn btn-secondary" @click="showImportDialog = false">取消</button>
        </div>
        <div class="import-result" v-if="importResult">{{ importResult }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'
import { auth } from '../stores/auth.js'

const router = useRouter()
const subjects = ref([])
const lastStats = ref(null)
const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const newSubjectName = ref('')
const importJson = ref('')
const importing = ref(false)
const importResult = ref('')

function subjectEmoji(name) {
  const map = { 'ECharts': '📊', 'JavaScript': '🟨', 'Python': '🐍', '数学': '🔢', '英语': '🔤', 'HTML': '🌐' }
  return map[name] || '📖'
}

onMounted(async () => {
  try {
    const res = await api.getSubjects()
    subjects.value = res.data
    const sid = localStorage.getItem('lastSessionId')
    if (sid) {
      const st = await api.getStats(sid)
      if (st.data.total > 0) {
        st.data.correctRate = Math.round(st.data.correct / st.data.total * 100)
        lastStats.value = st.data
      }
    }
  } catch {}
})

function goToSubject(subject) {
  router.push({ name: 'QuizSelection', params: { subject } })
}

function createSubject(mode) {
  const name = newSubjectName.value.trim()
  if (!name) return
  if (mode === 'import') {
    showCreateDialog.value = false
    showImportDialog.value = true
  } else {
    router.push(`/admin/edit?subject=${encodeURIComponent(name)}`)
    showCreateDialog.value = false
    newSubjectName.value = ''
  }
}

async function doBatchImport() {
  let data
  try { data = JSON.parse(importJson.value) } catch { importResult.value = '❌ JSON 格式错误'; return }
  if (!Array.isArray(data) || data.length === 0) { importResult.value = '❌ 请传入非空数组'; return }
  importing.value = true
  importResult.value = ''
  try {
    const items = data.map(q => ({ ...q, subject: newSubjectName.value.trim() }))
    const res = await api.batchImportQuestions(items)
    importResult.value = `✅ 成功导入 ${res.data.imported} 道题${res.data.status === 'pending' ? '（待审核）' : ''}`
    importJson.value = ''
    // 刷新题库列表
    const subRes = await api.getSubjects()
    subjects.value = subRes.data
  } catch (e) {
    importResult.value = '❌ 导入失败：' + (e.response?.data?.error || e.message)
  } finally {
    importing.value = false
  }
}

function quickQuiz() {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sessionId)
  router.push({ name: 'Quiz', query: { count: 10, session_id: sessionId } })
}

async function goWrong() {
  try {
    const res = await api.getWrongQuestions()
    if (res.data.length === 0) { alert('暂无错题！'); return }
    const sessionId = 'wrong-' + Date.now().toString(36)
    localStorage.setItem('lastSessionId', sessionId)
    router.push({ name: 'Quiz', query: { session_id: sessionId, wrong: 1 } })
  } catch { alert('暂无错题！') }
}
</script>

<style scoped>
.home-page { padding-bottom: 3rem; }
.hero-section { background: var(--primary); padding: 3rem 0; text-align: center; margin-bottom: 2rem; }
.hero-title { font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 0.3rem; }
.hero-desc { color: rgba(255,255,255,0.85); font-size: 1rem; }

.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.section-header h2 { font-size: 1.2rem; font-weight: 700; }
.btn-new { background: var(--primary); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 500; transition: all 0.15s; }
.btn-new:hover { opacity: 0.85; }
.modal-wide { max-width: 560px; }

@media (max-width: 640px) {
  .hero-section { padding: 1.5rem 0; }
  .hero-title { font-size: 1.6rem; }
  .subject-grid { grid-template-columns: 1fr; gap: 0.6rem; }
  .subject-card { padding: 0.8rem 1rem; }
  .card-emoji { font-size: 1.5rem; }
  .quick-actions { gap: 0.5rem; }
  .action-card { padding: 0.6rem 0.8rem; font-size: 0.8rem; }
  .stats-row { gap: 0.5rem; }
  .stat-val { font-size: 1.1rem; }
  .modal { padding: 1.2rem; }
}
.modal-example { background: #f5f5f7; border-radius: 8px; padding: 0.6rem; margin-bottom: 0.5rem; overflow-x: auto; }
.modal-example pre { font-size: 0.72rem; line-height: 1.4; white-space: pre; }
.modal-textarea { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-family: monospace; font-size: 0.85rem; resize: vertical; }
.modal-textarea:focus { outline: none; border-color: var(--primary); }
.import-result { margin-top: 0.75rem; font-size: 0.9rem; font-weight: 500; }

.subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.8rem; margin-bottom: 1.5rem; }
.subject-card { display: flex; align-items: center; gap: 1rem; background: #fff; border-radius: 14px; padding: 1.2rem 1.2rem; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
.subject-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: var(--primary); }
.card-emoji { font-size: 2rem; }
.card-body { flex: 1; }
.card-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.2rem; }
.card-count { font-size: 0.8rem; color: var(--text-secondary); }
.card-arrow { color: var(--text-secondary); font-size: 1.2rem; transition: all 0.15s; }
.subject-card:hover .card-arrow { color: var(--primary); transform: translateX(3px); }

.empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }

.quick-actions { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 2rem; }
.action-card { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.2rem; background: #fff; border-radius: 12px; border: 1px solid var(--border); cursor: pointer; font-size: 0.9rem; transition: all 0.15s; }
.action-card:hover { border-color: var(--primary); }
.action-icon { font-size: 1.2rem; }

.last-stats { background: #fff; border-radius: 12px; padding: 1.2rem 1.5rem; border: 1px solid var(--border); }
.last-stats h3 { font-size: 0.95rem; margin-bottom: 0.8rem; }
.stats-row { display: flex; gap: 1rem; }
.stat-item { flex: 1; text-align: center; }
.stat-val { display: block; font-size: 1.4rem; font-weight: 700; }
.stat-lbl { font-size: 0.8rem; color: var(--text-secondary); }
.stat-val.correct { color: var(--success); }
.stat-val.wrong { color: var(--error); }
.stat-val.rate { color: var(--primary); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 14px; padding: 2rem; width: 90%; max-width: 400px; }
.modal h3 { font-size: 1.2rem; margin-bottom: 0.3rem; }
.modal-hint { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem; }
.modal-input { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem; }
.modal-input:focus { outline: none; border-color: var(--primary); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.btn { display: inline-block; padding: 0.6rem 1.5rem; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
</style>
