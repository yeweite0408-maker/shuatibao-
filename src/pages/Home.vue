<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="container">
        <h1 class="hero-title">📚 刷题宝</h1>
        <p class="hero-desc">选择题库，开始刷题</p>
      </div>
    </div>

    <div class="container">
      <!-- 公共题库 -->
      <div class="section-header">
        <h2>📖 公共题库</h2>
        <button class="btn-new" @click="showCreateDialog = true">+ 新建题库</button>
      </div>

      <div class="subject-grid" v-if="publicSubjects.length > 0">
        <div
          class="subject-card"
          v-for="s in publicSubjects"
          :key="'pub-' + s.subject"
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
      <div v-if="publicSubjects.length === 0 && auth.isLoggedIn" class="empty-state">
        <p>暂无公共题库</p>
      </div>

      <!-- 我的题库（登录用户） -->
      <div v-if="auth.isLoggedIn" style="margin-top: 1.5rem;">
        <div class="section-header">
          <h2>👤 我的题库</h2>
        </div>
        <div class="subject-grid" v-if="personalSubjects.length > 0">
          <div
            class="subject-card personal"
            v-for="s in personalSubjects"
            :key="'per-' + s.subject"
            @click="goToSubject(s.subject)"
          >
            <div class="card-emoji">{{ subjectEmoji(s.subject) }}</div>
            <div class="card-body">
              <h3 class="card-title">{{ s.subject }} <span class="personal-badge">个人</span></h3>
              <span class="card-count">{{ s.count }} 道题</span>
            </div>
            <div class="card-personal-actions" @click.stop>
              <button class="btn-publish" @click="publishSubject(s.subject)" title="发布到公共题库" v-if="auth.user?.role === 'admin'">🌐 发布</button>
              <button class="btn-publish" @click="requestPublish(s.subject)" title="申请发布到公共题库" v-else>📩 申请发布</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>还没有个人题库，创建题目时选择"个人"即可</p>
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
          <div class="dialog-scope">
          <label class="scope-label" v-if="auth.user?.role === 'admin'">
            <input type="radio" v-model="newSubjectScope" value="public" /> 🌐 公共题库（所有人可见）
          </label>
          <label class="scope-label">
            <input type="radio" v-model="newSubjectScope" value="private" /> 👤 个人题库（仅自己可见）
          </label>
        </div>
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

    <!-- 模拟考试设置 -->
    <div class="modal-overlay" v-if="showExamModal" @click.self="showExamModal = false">
      <div class="modal">
        <h3>📝 模拟考试</h3>
        <div class="exam-form">
          <div class="exam-field">
            <label>科目</label>
            <select v-model="examConfig.subject" class="exam-select">
              <option value="">全部科目</option>
              <option v-for="s in subjects" :key="s.subject" :value="s.subject">{{ s.subject }}</option>
            </select>
          </div>
          <div class="exam-field">
            <label>时间限制</label>
            <select v-model.number="examConfig.timeLimit" class="exam-select">
              <option :value="5">5 分钟</option>
              <option :value="10">10 分钟</option>
              <option :value="15">15 分钟</option>
              <option :value="30">30 分钟</option>
              <option :value="60">60 分钟</option>
              <option :value="0">不限时</option>
            </select>
          </div>
          <div class="exam-type-grid">
            <div class="exam-type-row" v-for="t in examConfig.types" :key="t.type">
              <span class="et-label">{{ t.label }}</span>
              <div class="et-inputs">
                <label class="et-col">
                  <span class="et-col-label">题数</span>
                  <input type="number" v-model.number="t.count" min="0" max="50" class="et-input" />
                </label>
                <label class="et-col">
                  <span class="et-col-label">分值/题</span>
                  <input type="number" v-model.number="t.score" min="0" max="100" class="et-input" />
                </label>
              </div>
            </div>
            <div class="exam-total">
              总分：<strong>{{ homeTotalScore }}</strong> 分 &nbsp;|&nbsp; 题数：<strong>{{ homeTotalCount }}</strong> 题
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn exam-start" @click="startHomeExam" :disabled="homeTotalCount === 0">开始考试</button>
          <button class="btn btn-secondary" @click="showExamModal = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'
import { auth } from '../stores/auth.js'

const router = useRouter()
const subjects = ref([])
const publicSubjects = computed(() => subjects.value.filter(s => !s.isPersonal))
const personalSubjects = computed(() => subjects.value.filter(s => s.isPersonal))
const lastStats = ref(null)
const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const newSubjectName = ref('')
const newSubjectScope = ref(auth.user?.role === 'admin' ? 'public' : 'private')
const importJson = ref('')
const importing = ref(false)
const importResult = ref('')
const showExamModal = ref(false)
const examConfig = ref({
  subject: '', timeLimit: 10,
  types: [
    { type: 'single_choice', label: '单选题', count: 5, score: 5 },
    { type: 'multi_choice', label: '多选题', count: 3, score: 5 },
    { type: 'true_false', label: '判断题', count: 2, score: 3 },
    { type: 'fill_blank', label: '填空题', count: 0, score: 3 },
  ]
})
const homeTotalScore = computed(() => examConfig.value.types.reduce((s, t) => s + t.count * t.score, 0))
const homeTotalCount = computed(() => examConfig.value.types.reduce((s, t) => s + t.count, 0))

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
    router.push(`/admin/edit?subject=${encodeURIComponent(name)}&scope=${newSubjectScope.value}`)
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
    const res = await api.batchImportQuestions(items, newSubjectScope.value)
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

async function startHomeExam() {
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sid)
  localStorage.setItem('examConfig', JSON.stringify({
    types: examConfig.value.types.map(t => ({ type: t.type, count: t.count, score: t.score })),
    totalScore: homeTotalScore.value
  }))
  const query = {
    session_id: sid, exam: 1, timeLimit: examConfig.value.timeLimit || undefined,
    examTypes: examConfig.value.types.filter(t => t.count > 0).map(t => `${t.type}:${t.count}:${t.score}`).join(',')
  }
  if (examConfig.value.subject) query.subject = examConfig.value.subject
  showExamModal.value = false
  router.push({ name: 'Quiz', query })
}

async function publishSubject(name) {
  if (!confirm(`确定将"${name}"发布到公共题库吗？`)) return
  try {
    await api.publishSubject(name)
    const res = await api.getSubjects()
    subjects.value = res.data
  } catch {}
}

async function requestPublish(name) {
  try {
    const res = await api.requestPublish(name)
    alert(res.data.message || '审核请求已提交')
  } catch {}
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
.subject-card { display: flex; align-items: center; gap: 1rem; background: var(--card); border-radius: 14px; padding: 1.2rem 1.2rem; border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
.subject-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: var(--primary); }
.card-emoji { font-size: 2rem; }
.card-body { flex: 1; }
.card-title { font-size: 1rem; font-weight: 600; margin-bottom: 0.2rem; }
.card-count { font-size: 0.8rem; color: var(--text-secondary); }
.card-arrow { color: var(--text-secondary); font-size: 1.2rem; transition: all 0.15s; }
.subject-card:hover .card-arrow { color: var(--primary); transform: translateX(3px); }
.subject-card.personal { border-left: 4px solid var(--warning); }
.personal-badge { font-size: 0.6rem; background: #fff3cd; color: #856404; padding: 0.1rem 0.35rem; border-radius: 4px; vertical-align: middle; }
.card-personal-actions { flex-shrink: 0; }
.btn-publish { font-size: 0.7rem; padding: 0.25rem 0.5rem; border: 1px solid var(--primary); border-radius: 6px; background: none; color: var(--primary); cursor: pointer; white-space: nowrap; }
.btn-publish:hover { background: var(--primary); color: #fff; }
.private-label { font-size:0.7rem; color:var(--text-secondary); }

.empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }


.last-stats { background: var(--card); border-radius: 12px; padding: 1.2rem 1.5rem; border: 1px solid var(--border); }
.last-stats h3 { font-size: 0.95rem; margin-bottom: 0.8rem; }
.stats-row { display: flex; gap: 1rem; }
.stat-item { flex: 1; text-align: center; }
.stat-val { display: block; font-size: 1.4rem; font-weight: 700; }
.stat-lbl { font-size: 0.8rem; color: var(--text-secondary); }
.stat-val.correct { color: var(--success); }
.stat-val.wrong { color: var(--error); }
.stat-val.rate { color: var(--primary); }
.exam-form { display: flex; flex-direction: column; gap: 0.8rem; }
.exam-field label { display: block; font-size: 0.82rem; font-weight: 500; margin-bottom: 0.3rem; }
.exam-select { width: 100%; padding: 0.5rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem; background: var(--card); }
.exam-start { background: var(--error); color: #fff; flex: 1; }
.exam-type-grid { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.exam-type-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.8rem; border-top: 1px solid var(--border); }
.exam-type-row:first-child { border-top: none; }
.et-label { font-weight: 500; font-size: 0.82rem; min-width: 3.5rem; }
.et-inputs { display: flex; gap: 0.6rem; }
.et-col { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
.et-col-label { font-size: 0.65rem; color: var(--text-secondary); }
.et-input { width: 55px; padding: 0.25rem 0.35rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem; text-align: center; }
.et-input:focus { outline: none; border-color: var(--primary); }
.exam-total { padding: 0.5rem 0.8rem; text-align: right; font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid var(--border); }
.dialog-scope { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.8rem; padding: 0.6rem 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.scope-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--card); border-radius: 14px; padding: 2rem; width: 90%; max-width: 400px; }
.modal h3 { font-size: 1.2rem; margin-bottom: 0.3rem; }
.modal-hint { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem; }
.modal-input { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.95rem; }
.modal-input:focus { outline: none; border-color: var(--primary); }
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.btn { display: inline-block; padding: 0.6rem 1.5rem; border: none; border-radius: 8px; font-size: 0.9rem; cursor: pointer; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-secondary { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
</style>
