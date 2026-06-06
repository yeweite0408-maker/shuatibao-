<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <span class="brand-logo">📚</span>
        <span class="brand-text">刷题宝管理</span>
      </div>
      <nav class="sidebar-nav">
        <a v-for="item in menu" :key="item.key" :class="['nav-item', { active: activeTab === item.key }]" @click="activeTab = item.key">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span class="nav-badge" v-if="item.badge">{{ item.badge }}</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/" class="back-link">← 返回前台</router-link>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="admin-main">
      <!-- 概览 -->
      <div v-if="activeTab === 'overview'" class="admin-content">
        <h2 class="page-title">仪表盘</h2>
        <div class="metrics" v-if="overview">
          <div class="metric-card" v-for="m in metrics" :key="m.label">
            <div class="metric-icon" :style="{ background: m.color }">{{ m.icon }}</div>
            <div class="metric-body">
              <span class="metric-val">{{ m.val }}</span>
              <span class="metric-lbl">{{ m.label }}</span>
            </div>
          </div>
        </div>
        <div class="section-card">
          <h3>各科目概览</h3>
          <div class="subject-chart" v-if="overview?.subjects?.length">
            <div class="chart-row" v-for="s in overview.subjects" :key="s.subject">
              <span class="chart-lbl">{{ s.subject }}</span>
              <div class="chart-bar"><div class="chart-fill" :style="{ width: Math.min(100, s.count) + '%' }"></div></div>
              <span class="chart-num">{{ s.count }} 题</span>
              <span class="chart-rate" v-if="s.avgCorrect !== null">{{ s.avgCorrect }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 题库管理 -->
      <div v-if="activeTab === 'subjects'" class="admin-content">
        <h2 class="page-title">题库管理</h2>

        <div class="section-card" v-for="s in overview?.subjects || []" :key="s.subject">
          <div class="section-card-header" @click="toggleSubject(s.subject)">
            <span>{{ expandedSubject === s.subject ? '▼' : '▶' }} {{ s.subject }}</span>
            <span class="sc-actions">
              <span class="sc-count">{{ s.count }} 题</span>
              <button class="sc-btn" @click.stop="exportSubject(s.subject)" title="导出">📤</button>
              <button class="sc-btn" @click.stop="renameSubject(s.subject)" title="重命名">✏️</button>
              <button class="sc-btn" @click.stop="deleteSubject(s.subject)" title="删除">🗑️</button>
            </span>
          </div>
          <div class="section-card-body" v-if="expandedSubject === s.subject">
            <div class="aq-table">
              <div class="aq-row aq-header">
                <span style="width:2rem"></span>
                <span style="width:3rem">题型</span>
                <span style="flex:1">题目</span>
                <span style="width:4.5rem">状态</span>
                <span style="width:6rem">操作</span>
              </div>
              <div class="aq-row" v-for="q in subjectQuestions(s.subject)" :key="q.id">
                <span style="width:2rem"><input type="checkbox" v-model="selectedIds" :value="q.id" class="q-cb" /></span>
                <span style="width:3rem"><span class="aq-type">{{ typeLabel(q.type) }}</span></span>
                <span style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{{ q.question }}</span>
                <span style="width:4.5rem"><span class="aq-status" :class="q.status">{{ statusLabel(q.status) }}</span></span>
                <span style="width:6rem; display:flex; gap:0.2rem">
                  <button class="sc-btn" @click="editQuestion(q.id)">✏️</button>
                  <button class="sc-btn" @click="deleteOneQuestion(q.id)">🗑️</button>
                  <button v-if="q.status==='pending'" class="sc-btn sc-ok" @click="approveQ(q.id)">✓</button>
                  <button v-if="q.status==='pending'" class="sc-btn sc-no" @click="rejectQ(q.id)">✗</button>
                </span>
              </div>
            </div>
            <div class="move-bar" v-if="selectedIds.length && expandedSubject === s.subject">
              <span>已选 {{ selectedIds.length }} 题</span>
              <select v-model="moveTarget" class="move-sel"><option value="">移动到...</option>
                <option v-for="t in subjectList" :key="t" :value="t" v-if="t !== s.subject">{{ t }}</option>
              </select>
              <button class="btn-xs btn-ok" @click="doBatchMove">移动</button>
              <button class="btn-xs btn-no" @click="selectedIds=[]">取消</button>
            </div>
          </div>
        </div>

        <!-- 个人题库 -->
        <div class="section-card" v-if="personalSubjects.length">
          <div class="section-card-header"><span>👤 用户个人题库</span></div>
          <div class="aq-table">
            <div class="aq-row" v-for="s in personalSubjects" :key="s.subject">
              <span style="flex:1">{{ s.subject }} <small>by {{ s.creator_name }}</small></span>
              <span style="width:3rem">{{ s.count }} 题</span>
              <span style="width:6rem"><button class="sc-btn sc-ok" @click="publishPersonal(s.subject, s.uploaded_by)">🌐 发布</button></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="admin-content">
        <h2 class="page-title">用户管理 <small>({{ users.length }})</small></h2>
        <div class="section-card">
          <div class="aq-table">
            <div class="aq-row aq-header">
              <span style="flex:1">用户名</span>
              <span style="width:4rem">角色</span>
              <span style="width:5rem">注册时间</span>
              <span style="width:8rem">操作</span>
            </div>
            <div class="aq-row" v-for="u in users" :key="u.id">
              <span style="flex:1; font-weight:500">{{ u.username }}</span>
              <span style="width:4rem"><span class="aq-role" :class="u.role">{{ u.role === 'admin' ? '管理员' : '用户' }}</span></span>
              <span style="width:5rem; color:var(--text-secondary); font-size:0.82rem">{{ u.created_at?.slice(0, 10) }}</span>
              <span style="width:8rem; display:flex; gap:0.3rem">
                <button class="sc-btn" @click="viewUser(u.id)" title="查看数据">📊</button>
                <select v-model="u.role" @change="changeRole(u.id, u.role)" class="role-sel">
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                </select>
                <button class="sc-btn sc-no" @click="deleteUser(u.id)" :disabled="isSelf(u.id)" title="删除">🗑️</button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 待审核 -->
      <div v-if="activeTab === 'pending'" class="admin-content">
        <h2 class="page-title">待审核题目</h2>
        <div class="section-card" v-if="pendingQuestions.length">
          <div class="aq-row aq-header">
            <span style="width:5rem">科目</span>
            <span style="width:3rem">题型</span>
            <span style="flex:1">题目</span>
            <span style="width:8rem">操作</span>
          </div>
          <div class="aq-row" v-for="q in pendingQuestions" :key="q.id">
            <span style="width:5rem">{{ q.subject }}</span>
            <span style="width:3rem">{{ typeLabel(q.type) }}</span>
            <span style="flex:1">{{ q.question }}</span>
            <span style="width:8rem; display:flex; gap:0.3rem">
              <button class="sc-btn sc-ok" @click="approve(q.id)">✓ 通过</button>
              <button class="sc-btn sc-no" @click="reject(q.id)">✗ 拒绝</button>
            </span>
          </div>
        </div>
        <div v-else class="empty-card">暂无待审核题目</div>
      </div>

      <!-- 发布审核 -->
      <div v-if="activeTab === 'publish'" class="admin-content">
        <h2 class="page-title">发布审核</h2>
        <div class="section-card" v-if="publishRequests.length">
          <div class="aq-row aq-header">
            <span style="width:6rem">题库</span>
            <span style="width:5rem">申请人</span>
            <span style="width:5rem">状态</span>
            <span style="width:5rem">时间</span>
            <span style="width:8rem">操作</span>
          </div>
          <div class="aq-row" v-for="pr in publishRequests" :key="pr.id">
            <span style="width:6rem">{{ pr.subject }}</span>
            <span style="width:5rem">{{ pr.username }}</span>
            <span style="width:5rem"><span class="aq-status" :class="pr.status">{{ pr.status==='approved'?'已通过':pr.status==='rejected'?'已拒绝':'待审核' }}</span></span>
            <span style="width:5rem; font-size:0.82rem">{{ pr.created_at?.slice(0,10) }}</span>
            <span style="width:8rem; display:flex; gap:0.3rem" v-if="pr.status==='pending'">
              <button class="sc-btn sc-ok" @click="approvePublish(pr.id)">✓ 通过</button>
              <button class="sc-btn sc-no" @click="rejectPublish(pr.id)">✗ 拒绝</button>
            </span>
          </div>
        </div>
        <div v-else class="empty-card">暂无发布请求</div>
      </div>

      <!-- 纠错 -->
      <div v-if="activeTab === 'reports'" class="admin-content">
        <h2 class="page-title">题目纠错</h2>
        <div class="section-card" v-if="reports.length">
          <div class="aq-row aq-header">
            <span style="width:5rem">科目</span>
            <span style="width:3rem">用户</span>
            <span style="flex:1">题目</span>
            <span style="width:4rem">状态</span>
            <span style="width:8rem">操作</span>
          </div>
          <div class="aq-row" v-for="r in reports" :key="r.id">
            <span style="width:5rem">{{ r.question_subject }}</span>
            <span style="width:3rem">{{ r.username }}</span>
            <span style="flex:1; white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ r.question_text }}</span>
            <span style="width:4rem"><span class="aq-status" :class="r.status">{{ r.status==='resolved'?'已处理':r.status==='rejected'?'已驳回':'待处理' }}</span></span>
            <span style="width:8rem; display:flex; gap:0.2rem" v-if="r.status==='pending'">
              <input v-model="replyTexts[r.id]" class="rp-input" placeholder="回复..." style="flex:1;min-width:60px" @keyup.enter="resolveReport(r.id,'resolved')" />
              <button class="sc-btn sc-ok" @click="resolveReport(r.id,'resolved')">✓</button>
              <button class="sc-btn sc-no" @click="resolveReport(r.id,'rejected')">✗</button>
            </span>
          </div>
        </div>
        <div v-else class="empty-card">暂无纠错反馈</div>
      </div>

      <!-- 反馈 -->
      <div v-if="activeTab === 'feedback'" class="admin-content">
        <h2 class="page-title">意见反馈</h2>
        <div class="section-card" v-if="feedbackList.length">
          <div class="aq-row aq-header">
            <span style="width:4rem">用户</span>
            <span style="width:4rem">状态</span>
            <span style="flex:1">内容</span>
            <span style="width:8rem">操作</span>
          </div>
          <div class="aq-row" v-for="item in feedbackList" :key="item.id">
            <span style="width:4rem">{{ item.username }}</span>
            <span style="width:4rem"><span class="aq-status" :class="item.status">{{ item.status==='replied'?'已回复':'待处理' }}</span></span>
            <span style="flex:1; white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ item.content }}</span>
            <span style="width:8rem; display:flex; gap:0.2rem" v-if="item.status!=='replied'">
              <input v-model="replyTexts[item.id]" class="rp-input" placeholder="回复..." style="flex:1;min-width:60px" @keyup.enter="reply(item.id)" />
              <button class="sc-btn sc-ok" @click="reply(item.id)">发送</button>
            </span>
          </div>
        </div>
        <div v-else class="empty-card">暂无反馈</div>
      </div>
    </main>

    <!-- 用户详情弹窗 -->
    <div class="modal-overlay" v-if="userDetail" @click.self="userDetail=null">
      <div class="modal-box">
        <h3>📊 {{ userDetail.user.username }} 的学习数据</h3>
        <div class="ud-stats">
          <div class="ud-c"><strong>{{ userDetail.total }}</strong> 总答题</div>
          <div class="ud-c ok"><strong>{{ userDetail.correct }}</strong> 正确</div>
          <div class="ud-c no"><strong>{{ userDetail.wrong }}</strong> 错误</div>
        </div>
        <div v-if="userDetail.bySubject?.length" class="ud-chart">
          <div v-for="s in userDetail.bySubject" :key="s.subject" class="ud-row">
            <span style="width:4rem">{{ s.subject }}</span>
            <div class="ud-bar"><div class="ud-fill" :style="{width:s.rate+'%', background: rc(s.rate)}"></div></div>
            <span style="width:4rem;text-align:right">{{ s.rate }}%</span>
          </div>
        </div>
        <button class="modal-close" @click="userDetail=null">关闭</button>
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
const activeTab = ref('overview')
const overview = ref(null)
const pendingQuestions = ref([])
const users = ref([])
const feedbackList = ref([])
const reports = ref([])
const personalSubjects = ref([])
const publishRequests = ref([])
const replyTexts = ref({})
const userDetail = ref(null)
const expandedSubject = ref(null)
const selectedIds = ref([])
const moveTarget = ref('')
const allQuestionsMap = ref({})

function rc(r) { return r>=70 ? 'var(--success)' : r>=40 ? 'var(--warning)' : 'var(--error)' }
function typeLabel(t) { const m={single_choice:'单选',multi_choice:'多选',true_false:'判断',fill_blank:'填空'};return m[t]||t }
function statusLabel(s) { const m={approved:'已审核',pending:'待审核',rejected:'已拒绝'};return m[s]||s }
function isSelf(id) { return auth.user?.id === id }

const subjectList = computed(() => (overview.value?.subjects || []).map(s => s.subject))

const menu = computed(() => [
  { key:'overview', icon:'📊', label:'仪表盘', badge:0 },
  { key:'subjects', icon:'📚', label:'题库管理', badge:0 },
  { key:'pending', icon:'⏳', label:'待审核', badge:overview.value?.pending || 0 },
  { key:'publish', icon:'📩', label:'发布审核', badge:publishRequests.value.filter(r=>r.status==='pending').length },
  { key:'reports', icon:'🚨', label:'纠错管理', badge:reports.value.filter(r=>r.status==='pending').length },
  { key:'feedback', icon:'💬', label:'意见反馈', badge:feedbackList.value.filter(r=>r.status==='pending').length },
  { key:'users', icon:'👥', label:'用户管理', badge:0 },
])

const metrics = computed(() => [
  { icon:'📚', label:'题库', val:overview.value?.subjects?.length || 0, color:'#0071e3' },
  { icon:'📝', label:'题目', val:overview.value?.questions || 0, color:'#34c759' },
  { icon:'⏳', label:'待审核', val:overview.value?.pending || 0, color:'#ff9f0a' },
  { icon:'📊', label:'答题记录', val:overview.value?.records || 0, color:'#5856d6' },
  { icon:'👥', label:'用户', val:overview.value?.users || 0, color:'#0071e3' },
])

function subjectQuestions(subject) { return allQuestionsMap.value[subject] || [] }

function toggleSubject(subject) {
  expandedSubject.value = expandedSubject.value === subject ? null : subject
  if (expandedSubject.value && !allQuestionsMap.value[subject]) loadSubjectQuestions(subject)
}

async function loadSubjectQuestions(subject) {
  try { const r = await api.getAllQuestions({ subject }); allQuestionsMap.value[subject] = r.data } catch {}
}
function editQuestion(id) { router.push(`/admin/edit/${id}`) }

async function loadAll() {
  try {
    const [ov, pq, us, fb, rp, ps, pr] = await Promise.all([
      api.getAdminOverview(), api.getPendingQuestions(), api.getAdminUsers(),
      api.getFeedback(), api.getReports(), api.getPersonalSubjects(), api.getPublishRequests()
    ])
    overview.value = ov.data; pendingQuestions.value = pq.data; users.value = us.data
    feedbackList.value = fb.data; reports.value = rp.data; personalSubjects.value = ps.data; publishRequests.value = pr.data
  } catch {}
}
onMounted(loadAll)

async function deleteOneQuestion(id) { if (!confirm('确定删除？')) return; await api.deleteQuestion(id); if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value); loadAll() }
async function approveQ(id) { await api.updateQuestionStatus(id,'approved'); if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value); loadAll() }
async function rejectQ(id) { await api.updateQuestionStatus(id,'rejected'); if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value); loadAll() }
async function approve(id) { await api.updateQuestionStatus(id,'approved'); pendingQuestions.value = pendingQuestions.value.filter(q=>q.id!==id); loadAll() }
async function reject(id) { await api.updateQuestionStatus(id,'rejected'); pendingQuestions.value = pendingQuestions.value.filter(q=>q.id!==id); loadAll() }
async function changeRole(id, role) { if (isSelf(id)) return; await api.updateUserRole(id, role) }
async function deleteUser(id) { if (isSelf(id) || !confirm('确定删除？')) return; await api.deleteUser(id); users.value = users.value.filter(u=>u.id!==id) }

async function viewUser(id) { try { const r = await api.getUserDetailStats(id); userDetail.value = r.data } catch {} }
async function doBatchMove() { if (!selectedIds.value.length || !moveTarget.value) return; await api.batchMoveQuestions(selectedIds.value, moveTarget.value); selectedIds.value=[]; moveTarget.value=''; if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value); loadAll() }

async function exportSubject(subject) {
  try { const r = await api.getAllQuestions({ subject }); const b = new Blob([JSON.stringify(r.data,null,2)],{type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href=u; a.download=subject+'-题库.json'; a.click(); URL.revokeObjectURL(u) } catch {}
}
async function renameSubject(n) { const s = prompt('新名称：', n); if (!s || s===n) return; await api.renameSubject(n, s); expandedSubject.value = null; allQuestionsMap.value[s] = allQuestionsMap.value[n]; delete allQuestionsMap.value[n]; loadAll() }
async function deleteSubject(n) { if (!confirm(`删除"${n}"及其所有题目？不可撤销！`)) return; await api.deleteSubject(n); expandedSubject.value = null; loadAll() }

async function publishPersonal(subject, userId) { if (!confirm(`发布"${subject}"到公共？`)) return; await api.publishPersonalSubject(subject, userId); const r = await api.getPersonalSubjects(); personalSubjects.value = r.data; loadAll() }
async function approvePublish(id) { await api.approvePublishRequest(id); const r = await api.getPublishRequests(); publishRequests.value = r.data; loadAll() }
async function rejectPublish(id) { await api.rejectPublishRequest(id); const r = await api.getPublishRequests(); publishRequests.value = r.data; loadAll() }
async function resolveReport(id, status) { const reply = replyTexts.value[id]||''; await api.resolveReport(id, status, reply); replyTexts.value[id]=''; const r = await api.getReports(); reports.value = r.data }
async function reply(id) { const t = replyTexts.value[id]; if (!t?.trim()) return; await api.replyFeedback(id, t.trim()); replyTexts.value[id]=''; const r = await api.getFeedback(); feedbackList.value = r.data }
</script>

<style scoped>
.admin-layout { display:flex; min-height:100vh; }
.admin-sidebar { width:200px; background:var(--card); border-right:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; }
.sidebar-brand { display:flex; align-items:center; gap:0.5rem; padding:1rem 1.2rem; border-bottom:1px solid var(--border); }
.brand-logo { font-size:1.3rem; }
.brand-text { font-weight:700; font-size:0.95rem; color:var(--text); }
.sidebar-nav { flex:1; padding:0.5rem 0; }
.nav-item { display:flex; align-items:center; gap:0.5rem; padding:0.55rem 1.2rem; cursor:pointer; text-decoration:none; color:var(--text); font-size:0.85rem; transition:all 0.1s; }
.nav-item:hover { background:var(--bg); }
.nav-item.active { background:rgba(0,113,227,0.08); color:var(--primary); font-weight:500; border-right:3px solid var(--primary); }
.nav-icon { font-size:1rem; width:1.5rem; text-align:center; }
.nav-badge { margin-left:auto; background:var(--error); color:#fff; font-size:0.6rem; padding:0.05rem 0.4rem; border-radius:8px; }
.sidebar-footer { padding:0.8rem 1.2rem; border-top:1px solid var(--border); }
.back-link { text-decoration:none; color:var(--text-secondary); font-size:0.82rem; }
.back-link:hover { color:var(--primary); }

.admin-main { flex:1; background:var(--bg); padding:1.5rem; overflow-y:auto; }
.page-title { font-size:1.2rem; font-weight:700; margin-bottom:1rem; }
.page-title small { font-weight:400; color:var(--text-secondary); font-size:0.85rem; }

.metrics { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.8rem; margin-bottom:1.2rem; }
.metric-card { display:flex; align-items:center; gap:0.8rem; background:var(--card); border-radius:12px; padding:1rem; border:1px solid var(--border); }
.metric-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
.metric-val { display:block; font-size:1.3rem; font-weight:700; color:var(--text); }
.metric-lbl { font-size:0.75rem; color:var(--text-secondary); }

.section-card { background:var(--card); border-radius:12px; border:1px solid var(--border); margin-bottom:0.8rem; overflow:hidden; }
.section-card-header { display:flex; justify-content:space-between; align-items:center; padding:0.65rem 1rem; cursor:pointer; font-weight:600; font-size:0.9rem; }
.section-card-header:hover { background:var(--bg); }
.sc-actions { display:flex; align-items:center; gap:0.3rem; }
.sc-count { font-size:0.78rem; color:var(--text-secondary); font-weight:400; margin-right:0.3rem; }
.sc-btn { background:none; border:none; cursor:pointer; font-size:0.82rem; padding:0.2rem 0.35rem; border-radius:4px; }
.sc-btn:hover { background:var(--bg); }
.sc-ok { color:var(--success); }
.sc-no { color:var(--error); }
.section-card-body { border-top:1px solid var(--border); }

.aq-table { font-size:0.85rem; }
.aq-row { display:flex; align-items:center; padding:0.45rem 1rem; gap:0.5rem; border-top:1px solid var(--border); }
.aq-row:first-child { border-top:none; }
.aq-header { color:var(--text-secondary); font-size:0.78rem; font-weight:500; }
.aq-type { font-size:0.7rem; padding:0.1rem 0.35rem; border-radius:4px; background:var(--bg); color:var(--text-secondary); }
.aq-status { font-size:0.7rem; padding:0.1rem 0.35rem; border-radius:4px; }
.aq-status.approved { background:rgba(52,199,89,0.12); color:var(--success); }
.aq-status.pending { background:rgba(255,159,10,0.12); color:var(--warning); }
.aq-status.rejected, .aq-status.replied { background:rgba(255,59,48,0.1); color:var(--error); }
.aq-role { font-size:0.7rem; padding:0.1rem 0.35rem; border-radius:4px; }
.aq-role.admin { background:rgba(0,113,227,0.1); color:var(--primary); }
.aq-role.user { background:var(--bg); color:var(--text-secondary); }
.q-cb { width:14px; height:14px; accent-color:var(--primary); cursor:pointer; }

.move-bar { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; border-top:1px solid var(--border); background:var(--bg); font-size:0.8rem; }
.move-sel { padding:0.2rem 0.4rem; border:1px solid var(--border); border-radius:6px; font-size:0.8rem; background:var(--card); color:var(--text); }
.btn-xs { padding:0.2rem 0.5rem; border:none; border-radius:4px; font-size:0.7rem; cursor:pointer; }
.btn-ok { background:var(--success); color:#fff; }
.btn-no { background:var(--error); color:#fff; }
.role-sel { padding:0.2rem; border:1px solid var(--border); border-radius:6px; font-size:0.75rem; background:var(--card); color:var(--text); }
.rp-input { padding:0.2rem 0.4rem; border:1px solid var(--border); border-radius:4px; font-size:0.78rem; background:var(--card); color:var(--text); }
.rp-input:focus { outline:none; border-color:var(--primary); }

.empty-card { text-align:center; padding:2rem; color:var(--text-secondary); background:var(--card); border-radius:12px; border:1px solid var(--border); }

/* 图表 */
.subject-chart { padding:0.5rem 0; }
.chart-row { display:flex; align-items:center; gap:0.5rem; padding:0.35rem 1rem; font-size:0.82rem; }
.chart-lbl { width:5rem; flex-shrink:0; }
.chart-bar { flex:1; height:12px; background:var(--bg); border-radius:6px; overflow:hidden; }
.chart-fill { height:100%; border-radius:6px; background:linear-gradient(90deg,var(--primary),#5856d6); min-width:4px; }
.chart-num { width:3rem; text-align:right; color:var(--text-secondary); }
.chart-rate { width:3rem; text-align:right; font-weight:600; color:var(--success); }

/* 弹窗 */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal-box { background:var(--card); border-radius:14px; padding:1.5rem; width:90%; max-width:480px; max-height:70vh; overflow-y:auto; }
.modal-box h3 { font-size:1rem; margin-bottom:0.8rem; }
.ud-stats { display:flex; gap:0.5rem; margin-bottom:0.8rem; }
.ud-c { flex:1; text-align:center; padding:0.5rem; background:var(--bg); border-radius:8px; font-size:0.82rem; color:var(--text-secondary); }
.ud-c strong { display:block; font-size:1.2rem; color:var(--primary); }
.ud-c.ok strong { color:var(--success); }
.ud-c.no strong { color:var(--error); }
.ud-chart { margin-bottom:0.8rem; }
.ud-row { display:flex; align-items:center; gap:0.4rem; font-size:0.8rem; padding:0.25rem 0; }
.ud-bar { flex:1; height:10px; background:var(--bg); border-radius:5px; overflow:hidden; }
.ud-fill { height:100%; border-radius:5px; min-width:4px; }
.modal-close { width:100%; padding:0.5rem; border:1px solid var(--border); border-radius:8px; background:none; cursor:pointer; color:var(--text-secondary); font-size:0.85rem; }
.modal-close:hover { background:var(--bg); }

@media(max-width:768px) {
  .admin-sidebar { width:56px; }
  .sidebar-brand .brand-text, .nav-label, .nav-badge, .sidebar-footer .back-link { display:none; }
  .nav-item { justify-content:center; padding:0.55rem; }
  .admin-main { padding:0.8rem; }
  .metrics { grid-template-columns:repeat(2,1fr); }
}
</style>
