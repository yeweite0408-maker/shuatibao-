<template>
  <div class="home-page">
    <!-- Hero -->
    <div class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-icon">📚</div>
        <h1 class="hero-title">刷题宝</h1>
        <p class="hero-desc">多科目在线刷题，学习从未如此高效</p>
        <div class="hero-stats" v-if="totalQuestions > 0">
          <span>共 <strong>{{ totalQuestions }}</strong> 道题目</span>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="container">
        <!-- 上次练习 -->
        <div class="summary-card" v-if="lastStats">
          <div class="summary-row">
            <span>📊 上次练习</span>
            <span class="summary-rate" :class="rateClass(lastStats.correctRate)">{{ lastStats.correctRate }}% 正确率</span>
          </div>
          <div class="summary-badges">
            <span class="badge badge-ok">✓ {{ lastStats.correct }} 正确</span>
            <span class="badge badge-no">✗ {{ lastStats.wrong }} 错误</span>
          </div>
        </div>

        <!-- 公共题库 -->
        <div class="section">
          <div class="section-header">
            <h2>📖 公共题库</h2>
            <button class="btn-new" @click="showCreateDialog = true">+ 新建</button>
          </div>
          <div class="card-grid" v-if="publicSubjects.length">
            <div class="card-item" v-for="s in publicSubjects" :key="s.subject" @click="goToSubject(s.subject)">
              <div class="card-emoji">{{ subjectEmoji(s.subject) }}</div>
              <div class="card-body">
                <h3>{{ s.subject }}</h3>
                <span>{{ s.count }} 题</span>
              </div>
              <div class="card-arrow">→</div>
            </div>
          </div>
          <div v-else class="empty">暂无公共题库</div>
        </div>

        <!-- 我的题库 -->
        <div class="section" v-if="auth.isLoggedIn">
          <div class="section-header">
            <h2>👤 我的题库</h2>
          </div>
          <div class="card-grid" v-if="personalSubjects.length">
            <div class="card-item personal" v-for="s in personalSubjects" :key="s.subject" @click="goToSubject(s.subject)">
              <div class="card-emoji">{{ subjectEmoji(s.subject) }}</div>
              <div class="card-body">
                <h3>{{ s.subject }} <span class="tag-personal">个人</span></h3>
                <span>{{ s.count }} 题</span>
              </div>
              <div class="card-btns" @click.stop>
                <button class="card-btn" @click="publishSubject(s.subject)" v-if="auth.user?.role === 'admin'" title="发布到公共">🌐</button>
                <button class="card-btn" @click="requestPublish(s.subject)" v-else title="申请发布">📩</button>
              </div>
            </div>
          </div>
          <div v-else class="empty">创建题目时选择「个人题库」即可在此显示</div>
        </div>
      </div>
    </div>

    <!-- 新建题库 -->
    <div class="modal-overlay" v-if="showCreateDialog" @click.self="showCreateDialog = false">
      <div class="modal">
        <h3>📚 新建题库</h3>
        <input v-model="newSubjectName" class="modal-input" placeholder="题库名称，如：JavaScript、Python" @keyup.enter="createSubject('manual')" />
        <div class="scope-toggle" v-if="auth.user?.role === 'admin'">
          <label :class="{ active: newSubjectScope === 'public' }"><input type="radio" v-model="newSubjectScope" value="public" /> 🌐 公共</label>
          <label :class="{ active: newSubjectScope === 'private' }"><input type="radio" v-model="newSubjectScope" value="private" /> 👤 个人</label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="createSubject('manual')">✏️ 手动添加</button>
          <button class="btn-secondary" @click="createSubject('import')">📥 批量导入</button>
        </div>
      </div>
    </div>

    <!-- 批量导入 -->
    <div class="modal-overlay" v-if="showImportDialog" @click.self="showImportDialog = false">
      <div class="modal modal-wide">
        <h3>📥 批量导入 — {{ newSubjectName }}</h3>
        <div class="import-tabs">
          <button :class="{ active: importTab === 'paste' }" @click="importTab='paste'">📋 粘贴 JSON</button>
          <button :class="{ active: importTab === 'file' }" @click="importTab='file'">📁 上传文件</button>
          <button :class="{ active: importTab === 'csv' }" @click="importTab='csv'">📊 CSV/Excel</button>
        </div>
        <div v-if="importTab === 'paste'">
          <textarea v-model="importJson" class="modal-textarea" rows="6" placeholder='[{ "type":"single_choice", "question":"题目", "options":["A. xxx","B. xxx"], "answer":"A" }]'></textarea>
        </div>
        <div v-if="importTab === 'file'" class="file-zone">
          <input ref="fileInput" type="file" accept=".json" hidden @change="onFileSelected" />
          <div class="file-drop" @click="fileInput.click()" @dragover.prevent @drop.prevent="onFileDrop">
            <span class="file-icon">📂</span>
            <span>点击选择或拖拽 .json 文件</span>
          </div>
        </div>
        <div v-if="importTab === 'csv'" class="file-zone">
          <input ref="csvInput" type="file" accept=".csv,.xlsx,.xls" hidden @change="onCsvSelected" />
          <div class="file-drop" @click="csvInput.click()">
            <span class="file-icon">📊</span>
            <span>点击选择 .csv 或 .xlsx 文件</span>
          </div>
          <div class="csv-preview" v-if="csvPreview">{{ csvPreview }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="doBatchImport" :disabled="importing">{{ importing ? '导入中...' : '确认导入' }}</button>
          <button class="btn-secondary" @click="showImportDialog = false">取消</button>
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
import { auth } from '../stores/auth.js'
import * as XLSX from 'xlsx'

const router = useRouter()
const subjects = ref([])
const totalQuestions = ref(0)
const lastStats = ref(null)
const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const newSubjectName = ref('')
const newSubjectScope = ref(auth.user?.role === 'admin' ? 'public' : 'private')
const importTab = ref('paste')
const importJson = ref('')
const importing = ref(false)
const importResult = ref('')
const fileInput = ref(null)
const csvInput = ref(null)
const csvPreview = ref('')
const csvData = ref(null)

const publicSubjects = computed(() => subjects.value.filter(s => !s.isPersonal))
const personalSubjects = computed(() => subjects.value.filter(s => s.isPersonal))

function subjectEmoji(n) { const m = { ECharts:'📊', JavaScript:'🟨', Python:'🐍', 数学:'🔢', 英语:'🔤' }; return m[n]||'📖' }
function rateClass(r) { if (r>=70) return 'good'; if (r>=40) return 'mid'; return 'low' }

onMounted(async () => {
  try {
    const [subRes, qRes] = await Promise.all([api.getSubjects(), api.getQuestions()])
    subjects.value = subRes.data
    totalQuestions.value = qRes.data.length
  } catch {}
  try {
    const sid = auth.isLoggedIn ? 'all' : localStorage.getItem('lastSessionId')
    if (sid) {
      const st = await api.getStats(sid)
      if (st.data.total > 0) { st.data.correctRate = Math.round(st.data.correct/st.data.total*100); lastStats.value = st.data }
    }
  } catch {}
})

function goToSubject(name) { router.push({ name:'QuizSelection', params:{ subject: name } }) }

function createSubject(mode) {
  if (!newSubjectName.value.trim()) return
  if (mode === 'import') { showCreateDialog.value = false; showImportDialog.value = true }
  else { router.push(`/admin/edit?subject=${encodeURIComponent(newSubjectName.value.trim())}&scope=${newSubjectScope.value}`); showCreateDialog.value = false; newSubjectName.value = '' }
}

function onFileSelected(e) {
  const f = e.target.files[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = ev => importJson.value = ev.target.result
  reader.readAsText(f)
}
function onFileDrop(e) {
  const f = e.dataTransfer.files[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = ev => importJson.value = ev.target.result
  reader.readAsText(f)
}

function onCsvSelected(e) {
  const f = e.target.files[0]; if (!f) return
  const reader = new FileReader()
  reader.onload = ev => {
    try {
      const data = ev.target.result
      let rows
      if (f.name.endsWith('.csv')) {
        rows = parseCSV(data)
      } else {
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(ws)
      }
      csvData.value = rows
      csvPreview.value = `解析到 ${rows.length} 条数据`
    } catch (e) { csvPreview.value = '解析失败：' + e.message }
  }
  if (f.name.endsWith('.csv')) reader.readAsText(f)
  else reader.readAsArrayBuffer(f)
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') inQuote = !inQuote
      else if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = '' }
      else cur += ch
    }
    vals.push(cur.trim())
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
    return obj
  })
}

async function doBatchImport() {
  let items = []
  if (importTab.value === 'paste') {
    try { items = JSON.parse(importJson.value) } catch { importResult.value = '❌ JSON 格式错误'; return }
  } else if (importTab.value === 'csv') {
    if (!csvData.value) { importResult.value = '❌ 请先选择文件'; return }
    items = csvData.value.map(r => {
      const q = { subject: newSubjectName.value.trim(), type: r.type || 'single_choice', question: r.question, answer: r.answer, explanation: r.explanation || '' }
      if (r.options) q.options = r.options.split('|').filter(s => s.trim()).map(s => s.trim())
      return q
    })
  } else {
    try { items = JSON.parse(importJson.value) } catch { importResult.value = '❌ JSON 格式错误'; return }
  }
  if (!Array.isArray(items) || !items.length) { importResult.value = '❌ 无有效数据'; return }
  importing.value = true
  importResult.value = ''
  try {
    const data = items.map(q => ({ ...q, subject: newSubjectName.value.trim() }))
    const res = await api.batchImportQuestions(data, newSubjectScope.value)
    importResult.value = `✅ 成功导入 ${res.data.imported} 题${res.data.status === 'pending' ? '（待审核）' : ''}`
    importJson.value = ''
    csvData.value = null; csvPreview.value = ''
    const subRes = await api.getSubjects()
    subjects.value = subRes.data
  } catch (e) { importResult.value = '❌ 导入失败：' + (e.response?.data?.error || e.message) }
  finally { importing.value = false }
}

async function publishSubject(name) {
  if (!confirm(`发布"${name}"到公共题库？`)) return
  await api.publishSubject(name)
  subjects.value = (await api.getSubjects()).data
}
async function requestPublish(name) {
  const res = await api.requestPublish(name)
  alert(res.data.message || '已提交审核请求')
}
</script>

<style scoped>
.hero { position:relative; padding:3rem 1.5rem; text-align:center; overflow:hidden; background: linear-gradient(135deg, #0071e3 0%, #00a8ff 50%, #5856d6 100%); }
.hero-bg { position:absolute; inset:0; opacity:0.1; background: radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 50%, #fff 0%, transparent 50%); }
.hero-content { position:relative; z-index:1; }
.hero-icon { font-size:3.5rem; margin-bottom:0.3rem; animation:bounce 0.8s cubic-bezier(0.68,-0.55,0.27,1.55); }
@keyframes bounce { 0%{opacity:0;transform:scale(0.3)} 50%{transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
.hero-title { font-size:2.2rem; font-weight:800; color:#fff; margin-bottom:0.3rem; letter-spacing:1px; }
.hero-desc { color:rgba(255,255,255,0.85); font-size:1rem; margin-bottom:0.5rem; }
.hero-stats { color:rgba(255,255,255,0.7); font-size:0.85rem; }
.main-content { margin-top:-1rem; position:relative; z-index:2; }

.summary-card { background:var(--card); border-radius:14px; padding:1rem 1.2rem; border:1px solid var(--border); margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; }
.summary-row { display:flex; align-items:center; gap:0.8rem; font-size:0.9rem; }
.summary-rate { font-weight:700; }
.summary-rate.good { color:var(--success); }
.summary-rate.mid { color:var(--warning); }
.summary-rate.low { color:var(--error); }
.summary-badges { display:flex; gap:0.5rem; }
.badge { font-size:0.75rem; padding:0.2rem 0.6rem; border-radius:6px; }
.badge-ok { background:rgba(52,199,89,0.12); color:var(--success); }
.badge-no { background:rgba(255,59,48,0.12); color:var(--error); }

.section { margin-bottom:1.5rem; }
.section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem; }
.section-header h2 { font-size:1.05rem; font-weight:700; }
.btn-new { background:var(--primary); color:#fff; border:none; padding:0.35rem 0.8rem; border-radius:8px; font-size:0.8rem; cursor:pointer; }

.card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:0.7rem; }
.card-item { display:flex; align-items:center; gap:0.8rem; background:var(--card); border-radius:14px; padding:0.9rem 1rem; border:1px solid var(--border); cursor:pointer; transition:all 0.2s; }
.card-item:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.08); border-color:var(--primary); }
.card-item.personal { border-left:3px solid var(--warning); }
.card-emoji { font-size:1.6rem; }
.card-body { flex:1; min-width:0; }
.card-body h3 { font-size:0.9rem; font-weight:600; margin-bottom:0.1rem; }
.card-body span { font-size:0.75rem; color:var(--text-secondary); }
.tag-personal { font-size:0.6rem; background:rgba(255,159,10,0.15); color:var(--warning); padding:0.1rem 0.35rem; border-radius:4px; vertical-align:middle; }
.card-arrow { color:var(--text-secondary); font-size:1rem; transition:all 0.15s; }
.card-item:hover .card-arrow { color:var(--primary); transform:translateX(3px); }
.card-btns { display:flex; gap:0.2rem; }
.card-btn { background:none; border:none; cursor:pointer; font-size:0.9rem; padding:0.15rem; opacity:0.6; transition:opacity 0.15s; }
.card-btn:hover { opacity:1; }

.empty { text-align:center; padding:2rem; color:var(--text-secondary); font-size:0.85rem; background:var(--card); border-radius:14px; border:1px solid var(--border); }

/* Modals */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal { background:var(--card); border-radius:16px; padding:1.5rem; width:90%; max-width:420px; }
.modal-wide { max-width:540px; }
.modal h3 { font-size:1.1rem; margin-bottom:0.8rem; }
.modal-input { width:100%; padding:0.6rem; border:1px solid var(--border); border-radius:8px; font-size:0.9rem; margin-bottom:0.8rem; background:var(--card); color:var(--text); }
.modal-input:focus { outline:none; border-color:var(--primary); }
.scope-toggle { display:flex; gap:0.5rem; margin-bottom:0.8rem; }
.scope-toggle label { flex:1; text-align:center; padding:0.4rem; border:1px solid var(--border); border-radius:8px; cursor:pointer; font-size:0.82rem; }
.scope-toggle label.active { border-color:var(--primary); background:rgba(0,113,227,0.08); color:var(--primary); }
.scope-toggle input { display:none; }
.modal-actions { display:flex; gap:0.5rem; }
.modal-actions button { flex:1; padding:0.55rem; border:none; border-radius:8px; font-size:0.85rem; cursor:pointer; }
.modal-actions .btn-primary { background:var(--primary); color:#fff; }
.modal-actions .btn-secondary { background:var(--bg); color:var(--text); border:1px solid var(--border); }
.import-tabs { display:flex; gap:0; margin-bottom:0.8rem; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
.import-tabs button { flex:1; padding:0.4rem; border:none; background:var(--card); cursor:pointer; font-size:0.8rem; }
.import-tabs button.active { background:var(--primary); color:#fff; }
.modal-textarea { width:100%; padding:0.6rem; border:1px solid var(--border); border-radius:8px; font-size:0.82rem; font-family:monospace; resize:vertical; margin-bottom:0.5rem; background:var(--card); color:var(--text); }
.file-zone { margin-bottom:0.5rem; }
.file-drop { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:2rem; border:2px dashed var(--border); border-radius:10px; cursor:pointer; color:var(--text-secondary); transition:all 0.15s; }
.file-drop:hover { border-color:var(--primary); color:var(--primary); }
.file-icon { font-size:2rem; }
.csv-preview { font-size:0.82rem; color:var(--success); margin-top:0.3rem; }
.import-result { margin-top:0.5rem; font-size:0.85rem; font-weight:500; }

@media(max-width:640px) {
  .hero { padding:2rem 1rem; }
  .hero-title { font-size:1.6rem; }
  .card-grid { grid-template-columns:1fr; }
}
</style>
