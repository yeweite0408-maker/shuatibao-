<template>
  <div class="admin-page">
    <div class="page-header">
      <div class="container">
        <button class="back-btn" @click="$router.push('/')">← 返回首页</button>
        <h1>⚙️ 管理后台</h1>
      </div>
    </div>

    <div class="container">
      <!-- 概览 -->
      <div class="overview-cards" v-if="overview">
        <div class="ov-card" @click="tab='subjects'"><span class="ov-num">{{ subjects.length }}</span><span class="ov-lbl">题库</span></div>
        <div class="ov-card" @click="tab='subjects'"><span class="ov-num">{{ overview.questions }}</span><span class="ov-lbl">题目</span></div>
        <div class="ov-card warn" @click="tab='pending'"><span class="ov-num">{{ overview.pending }}</span><span class="ov-lbl">待审核</span></div>
        <div class="ov-card" @click="tab='feedbacks'"><span class="ov-num">{{ overview.records }}</span><span class="ov-lbl">答题记录</span></div>
      </div>

      <!-- Tab 导航 -->
      <div class="tab-bar">
        <button class="tab" :class="{ active: tab === 'subjects' }" @click="tab='subjects'">📚 题库</button>
        <button class="tab" :class="{ active: tab === 'pending' }" @click="tab='pending'">⏳ 待审核 <span v-if="overview?.pending" class="tab-badge">{{ overview.pending }}</span></button>
        <button class="tab" :class="{ active: tab === 'users' }" @click="tab='users'">👥 用户</button>
        <button class="tab" :class="{ active: tab === 'reports' }" @click="tab='reports'">🚨 纠错</button>
        <button class="tab" :class="{ active: tab === 'pubreq' }" @click="tab='pubreq'">📩 发布审核</button>
        <button class="tab" :class="{ active: tab === 'feedbacks' }" @click="tab='feedbacks'">💬 反馈</button>
      </div>

      <!-- ====== 题库管理 ====== -->
      <div v-show="tab === 'subjects'">
        <div class="subject-admin-list">
          <div class="subject-admin-card" v-for="s in subjects" :key="s.subject">
            <div class="sa-header" @click="toggleSubject(s.subject)">
              <span class="sa-icon">{{ expandedSubject === s.subject ? '▼' : '▶' }}</span>
              <span class="sa-name">{{ s.subject }}</span>
              <span class="sa-count">{{ s.count }} 题</span>
              <span class="sa-avg" v-if="s.avgCorrect !== null">{{ s.avgCorrect }}% 正确率</span>
              <button class="btn-sm-icon" @click.stop="exportSubject(s.subject)" title="导出为JSON">📤</button>
              <span class="sa-actions" @click.stop>
                <button class="btn-sm-icon" @click="renameSubject(s.subject)" title="重命名">✏️</button>
                <button class="btn-sm-icon" @click="deleteSubject(s.subject)" title="删除题库">🗑️</button>
              </span>
            </div>
            <div class="sa-body" v-if="expandedSubject === s.subject">
              <div class="sa-search" v-if="allQuestionsMap[s.subject]?.length > 5">
                <input v-model="searchText" class="sa-search-input" placeholder="搜索题目..." />
              </div>
              <div class="sa-question" v-for="q in filteredQuestions(s.subject)" :key="q.id">
                <div class="sa-q-info">
                  <span class="a-type">{{ typeLabel(q.type) }}</span>
                  <span class="a-status" :class="q.status">{{ statusLabel(q.status) }}</span>
                  <span class="a-text">{{ q.question }}</span>
                  <span class="a-user" v-if="q.uploader_name">by {{ q.uploader_name }}</span>
                </div>
                <div class="sa-q-actions">
                  <button class="btn-sm-icon" @click="editQuestion(q.id)">✏️</button>
                  <button class="btn-sm-icon" @click="deleteOneQuestion(q.id)">🗑️</button>
                  <button v-if="q.status==='pending'" class="btn-xs btn-approve" @click="approveQ(q.id)">通过</button>
                  <button v-if="q.status==='pending'" class="btn-xs btn-reject" @click="rejectQ(q.id)">拒绝</button>
                </div>
              </div>
              <div v-if="!allQuestionsMap[s.subject]?.length" class="sa-empty">暂无题目</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== 个人题库（管理员可见所有用户） ====== -->
      <div v-show="tab === 'subjects'" style="margin-top:0.5rem;">
        <h2 style="font-size:1rem;font-weight:600;margin-bottom:0.5rem;">👤 用户个人题库</h2>
        <div class="sa-card" v-if="personalSubjects.length">
          <div class="sa-question" v-for="s in personalSubjects" :key="s.subject + s.uploaded_by">
            <div class="sa-q-info">
              <span class="a-subject">{{ s.subject }}</span>
              <span class="a-user">by {{ s.creator_name }}</span>
              <span class="a-text">{{ s.count }} 题</span>
            </div>
            <div class="sa-q-actions">
              <button class="btn-approve btn-xs" @click="publishPersonal(s.subject, s.uploaded_by)">🌐 发布到公共</button>
            </div>
          </div>
        </div>
        <div v-else style="font-size:0.85rem;color:var(--text-secondary);padding:0.5rem 0;">暂无个人题库</div>
      </div>

      <!-- ====== 待审核 ====== -->
      <div v-show="tab === 'pending'">
        <div v-if="pendingQuestions.length === 0" class="empty">暂无待审核题目</div>
        <div class="review-list" v-else>
          <div class="review-item" v-for="q in pendingQuestions" :key="q.id">
            <div class="review-info">
              <span class="review-subject">{{ q.subject }}</span>
              <span class="review-type">{{ typeLabel(q.type) }}</span>
              <span class="review-q">{{ q.question }}</span>
              <span class="review-user" v-if="q.uploader_name">by {{ q.uploader_name }}</span>
            </div>
            <div class="review-actions">
              <button class="btn-approve" @click="approve(q.id)">✓ 通过</button>
              <button class="btn-reject" @click="reject(q.id)">✗ 拒绝</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== 用户管理 ====== -->
      <div v-show="tab === 'users'">
        <div class="user-list">
          <div class="user-item" v-for="u in users" :key="u.id">
            <div class="user-info">
              <span class="user-name">{{ u.username }}</span>
              <span class="user-role" :class="u.role">{{ u.role === 'admin' ? '管理员' : '用户' }}</span>
              <span class="user-date">{{ u.created_at?.slice(0, 10) }}</span>
            </div>
            <div class="user-actions">
              <select v-model="u.role" @change="changeRole(u.id, u.role)" class="role-select">
                <option value="user">用户</option>
                <option value="admin">管理员</option>
              </select>
              <button class="btn-view" @click="viewUser(u.id)">📊</button>
              <button class="btn-del" @click="deleteUser(u.id)" :disabled="isSelf(u.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户详情弹窗 -->
      <div class="modal-overlay" v-if="userDetail" @click.self="userDetail = null">
        <div class="modal modal-wide">
          <h3>📊 {{ userDetail.user.username }} 的学习数据</h3>
          <div class="ud-stats">
            <div class="ud-card"><span class="ud-num">{{ userDetail.total }}</span>总答题</div>
            <div class="ud-card correct"><span class="ud-num">{{ userDetail.correct }}</span>正确</div>
            <div class="ud-card wrong"><span class="ud-num">{{ userDetail.wrong }}</span>错误</div>
          </div>
          <div v-if="userDetail.bySubject?.length" class="ud-subjects">
            <div class="ud-subj" v-for="s in userDetail.bySubject" :key="s.subject">
              <span class="ud-lbl">{{ s.subject }}</span>
              <div class="ud-bar"><div class="ud-fill" :style="{width:s.rate+'%', background:rateColor(s.rate)}"></div></div>
              <span class="ud-pct">{{ s.rate }}%（{{ s.count }}题）</span>
            </div>
          </div>
          <div v-if="userDetail.recentRecords?.length" class="ud-records">
            <h4>最近答题</h4>
            <div class="ud-rec" v-for="r in userDetail.recentRecords.slice(0, 10)" :key="r.id">
              <span class="ud-rec-icon" :class="r.is_correct ? 'ok' : 'no'">{{ r.is_correct ? '✓' : '✗' }}</span>
              <span class="ud-rec-q">{{ r.question?.slice(0, 40) }}...</span>
            </div>
          </div>
          <button class="btn btn-secondary" @click="userDetail=null" style="margin-top:0.8rem;width:100%">关闭</button>
        </div>
      </div>

      <!-- ====== 发布审核 ====== -->
      <div v-show="tab === 'pubreq'">
        <div class="pr-list" v-if="publishRequests.length">
          <div class="pr-item" v-for="pr in publishRequests" :key="pr.id">
            <div class="pr-info">
              <span class="pr-subject">{{ pr.subject }}</span>
              <span class="pr-user">by {{ pr.username }}</span>
              <span class="pr-status" :class="pr.status">{{ pr.status === 'approved' ? '已通过' : pr.status === 'rejected' ? '已拒绝' : '待审核' }}</span>
              <span class="pr-date">{{ pr.created_at?.slice(0, 16) }}</span>
            </div>
            <div class="pr-actions" v-if="pr.status === 'pending'">
              <button class="btn-approve btn-xs" @click="approvePublish(pr.id)">✓ 通过</button>
              <button class="btn-reject btn-xs" @click="rejectPublish(pr.id)">✗ 拒绝</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无发布审核请求</div>
      </div>

      <!-- ====== 题目纠错 ====== -->
      <div v-show="tab === 'reports'">
        <div class="report-list" v-if="reports.length">
          <div class="rp-item" v-for="r in reports" :key="r.id">
            <div class="rp-header">
              <span class="rp-subject">{{ r.question_subject }}</span>
              <span class="rp-user">{{ r.username }}</span>
              <span class="rp-status" :class="r.status">{{ r.status === 'resolved' ? '已处理' : r.status === 'rejected' ? '已驳回' : '待处理' }}</span>
              <span class="rp-date">{{ r.created_at?.slice(0, 16) }}</span>
            </div>
            <div class="rp-q">{{ r.question_text }}</div>
            <div class="rp-content">{{ r.content }}</div>
            <div class="rp-reply" v-if="r.reply"><span class="reply-label">回复：</span>{{ r.reply }}</div>
            <div class="rp-actions" v-if="r.status === 'pending'">
              <input v-model="replyTexts[r.id]" class="rp-input" placeholder="回复..." @keyup.enter="resolveReport(r.id, 'resolved')" />
              <button class="btn-xs btn-approve" @click="resolveReport(r.id, 'resolved')">✓ 处理</button>
              <button class="btn-xs btn-reject" @click="resolveReport(r.id, 'rejected')">✗ 驳回</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无纠错反馈</div>
      </div>

      <!-- ====== 意见反馈 ====== -->
      <div v-show="tab === 'feedbacks'">
        <div class="feedback-list" v-if="feedbackList.length">
          <div class="fb-item" v-for="item in feedbackList" :key="item.id">
            <div class="fb-header">
              <span class="fb-user">{{ item.username }}</span>
              <span class="fb-date">{{ item.created_at?.slice(0, 16) }}</span>
              <span class="fb-status" :class="item.status">{{ item.status === 'replied' ? '已回复' : '待处理' }}</span>
            </div>
            <div class="fb-content">{{ item.content }}</div>
            <div class="fb-images" v-if="item.images?.length">
              <img v-for="(img, idx) in item.images" :key="idx" :src="img" class="fb-img" @click="previewImg = img" />
            </div>
            <div class="fb-reply" v-if="item.reply"><span class="reply-label">回复：</span>{{ item.reply }}</div>
            <div class="fb-actions" v-if="item.status !== 'replied'">
              <input v-model="replyTexts[item.id]" class="reply-input" placeholder="回复..." @keyup.enter="reply(item.id)" />
              <button class="btn-reply" @click="reply(item.id)">发送</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无反馈</div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div class="modal-overlay" v-if="previewImg" @click="previewImg = null">
      <img :src="previewImg" class="preview-full" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'
import { auth } from '../stores/auth.js'

const router = useRouter()
const tab = ref('subjects')
const overview = ref(null)
const pendingQuestions = ref([])
const users = ref([])
const feedbackList = ref([])
const replyTexts = ref({})
const previewImg = ref(null)
const expandedSubject = ref(null)
const searchText = ref('')

const reports = ref([])
const personalSubjects = ref([])
const publishRequests = ref([])
const userDetail = ref(null)

function rateColor(r) { if(r>=70) return 'var(--success)'; if(r>=40) return 'var(--warning)'; return 'var(--error)' }

function typeLabel(t) { const m = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空' }; return m[t] || t }
function statusLabel(s) { const m = { approved: '已审核', pending: '待审核', rejected: '已拒绝' }; return m[s] || s }
function isSelf(id) { return auth.user?.id === id }

// 从 overview 中提取 subjects 信息
const subjects = computed(() => overview.value?.subjects || [])
const allQuestionsMap = ref({})

function filteredQuestions(subject) {
  const list = allQuestionsMap.value[subject] || []
  if (!searchText.value) return list
  return list.filter(q => q.question.includes(searchText.value))
}

function toggleSubject(subject) {
  expandedSubject.value = expandedSubject.value === subject ? null : subject
  if (expandedSubject.value === subject && !allQuestionsMap.value[subject]) {
    loadSubjectQuestions(subject)
  }
  searchText.value = ''
}

async function loadSubjectQuestions(subject) {
  try {
    const res = await api.getAllQuestions({ subject })
    allQuestionsMap.value[subject] = res.data
  } catch {}
}

async function loadAll() {
  try {
    const [ov, pq, us, fb, rp, ps, pr] = await Promise.all([
      api.getAdminOverview(), api.getPendingQuestions(), api.getAdminUsers(), api.getFeedback(), api.getReports(), api.getPersonalSubjects(), api.getPublishRequests()
    ])
    overview.value = ov.data
    pendingQuestions.value = pq.data
    users.value = us.data
    feedbackList.value = fb.data
    reports.value = rp.data
    personalSubjects.value = ps.data
    publishRequests.value = pr.data
  } catch {}
}

onMounted(loadAll)

async function viewUser(id) {
  try {
    const res = await api.getUserDetailStats(id)
    userDetail.value = res.data
  } catch {}
}

async function approvePublish(id) {
  await api.approvePublishRequest(id)
  const pr = await api.getPublishRequests()
  publishRequests.value = pr.data
}
async function rejectPublish(id) {
  await api.rejectPublishRequest(id)
  const pr = await api.getPublishRequests()
  publishRequests.value = pr.data
}

async function resolveReport(id, status) {
  const reply = replyTexts.value[id] || ''
  await api.resolveReport(id, status, reply)
  replyTexts.value[id] = ''
  const rp = await api.getReports()
  reports.value = rp.data
}

function editQuestion(id) { router.push(`/admin/edit/${id}`) }

async function deleteOneQuestion(id) {
  if (!confirm('确定删除这道题吗？')) return
  await api.deleteQuestion(id)
  // 刷新当前展开的题库
  if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value)
  loadAll()
}

async function approveQ(id) {
  await api.updateQuestionStatus(id, 'approved')
  if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value)
  loadAll()
}
async function rejectQ(id) {
  await api.updateQuestionStatus(id, 'rejected')
  if (expandedSubject.value) loadSubjectQuestions(expandedSubject.value)
  loadAll()
}

async function approve(id) {
  await api.updateQuestionStatus(id, 'approved')
  pendingQuestions.value = pendingQuestions.value.filter(q => q.id !== id)
  loadAll()
}
async function reject(id) {
  await api.updateQuestionStatus(id, 'rejected')
  pendingQuestions.value = pendingQuestions.value.filter(q => q.id !== id)
  loadAll()
}
async function changeRole(id, role) {
  if (isSelf(id)) return
  await api.updateUserRole(id, role)
}
async function exportSubject(subject) {
  try {
    const res = await api.getAllQuestions({ subject })
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = subject + '-题库.json'; a.click()
    URL.revokeObjectURL(url)
  } catch {}
}
async function deleteUser(id) {
  if (isSelf(id) || !confirm('确定删除该用户？')) return
  await api.deleteUser(id)
  users.value = users.value.filter(u => u.id !== id)
}

async function renameSubject(oldName) {
  const newName = prompt('输入新题库名称：', oldName)
  if (!newName || newName === oldName) return
  await api.renameSubject(oldName, newName)
  expandedSubject.value = null
  // 刷新 subject 列表，同时迁移缓存
  allQuestionsMap.value[newName] = allQuestionsMap.value[oldName]
  delete allQuestionsMap.value[oldName]
  loadAll()
}
async function publishPersonal(subject, userId) {
  if (!confirm(`确定将"${subject}"发布到公共题库吗？`)) return
  await api.publishPersonalSubject(subject, userId)
  const ps = await api.getPersonalSubjects()
  personalSubjects.value = ps.data
}
async function deleteSubject(name) {
  if (!confirm(`确定删除题库"${name}"及其所有题目？此操作不可撤销！`)) return
  await api.deleteSubject(name)
  expandedSubject.value = null
  loadAll()
}

async function reply(id) {
  const text = replyTexts.value[id]
  if (!text?.trim()) return
  await api.replyFeedback(id, text.trim())
  replyTexts.value[id] = ''
  const fb = await api.getFeedback()
  feedbackList.value = fb.data
}
</script>

<style scoped>
.page-header { background: var(--card); border-bottom: 1px solid var(--border); padding: 1.2rem 0; margin-bottom: 1rem; }
.page-header h1 { font-size: 1.3rem; font-weight: 700; }
.back-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; display: block; margin-bottom: 0.3rem; }
.back-btn:hover { color: var(--text); }

.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1rem; }
.ov-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 1rem; text-align: center; cursor: pointer; transition: all 0.15s; }
.ov-card:hover { border-color: var(--primary); }
.ov-num { display: block; font-size: 1.4rem; font-weight: 700; color: var(--primary); }
.ov-lbl { font-size: 0.8rem; color: var(--text-secondary); }
.ov-card.warn .ov-num { color: var(--warning); }

.tab-bar { display: flex; gap: 0; background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-bottom: 1rem; }
.tab { flex: 1; padding: 0.65rem; border: none; background: var(--card); cursor: pointer; font-size: 0.85rem; transition: all 0.15s; position: relative; }
.tab.active { background: var(--primary); color: #fff; font-weight: 600; }
.tab:not(.active):hover { background: var(--bg); }
.tab-badge { background: var(--warning); color: #fff; font-size: 0.65rem; padding: 0.05rem 0.35rem; border-radius: 8px; margin-left: 0.3rem; }

/* 题库卡片 */
.subject-admin-list { display: flex; flex-direction: column; gap: 0.5rem; }
.subject-admin-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
.sa-header { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 1rem; cursor: pointer; transition: background 0.1s; }
.sa-header:hover { background: var(--bg); }
.sa-icon { font-size: 0.7rem; color: var(--text-secondary); width: 1rem; }
.sa-name { font-weight: 600; flex: 1; }
.sa-count { font-size: 0.8rem; color: var(--text-secondary); }
.sa-avg { font-size: 0.78rem; color: var(--success); }
.sa-actions { display: flex; gap: 0.2rem; }
.btn-sm-icon { background: none; border: none; cursor: pointer; font-size: 0.85rem; padding: 0.15rem; }
.btn-sm-icon:hover { opacity: 0.7; }

.sa-body { border-top: 1px solid var(--border); padding: 0.5rem 0; }
.sa-search { padding: 0.3rem 1rem 0.5rem; }
.sa-search-input { width: 100%; padding: 0.4rem 0.6rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.8rem; }
.sa-search-input:focus { outline: none; border-color: var(--primary); }
.sa-question { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 1rem; gap: 0.5rem; font-size: 0.82rem; }
.sa-question:hover { background: var(--bg); }
.sa-q-info { display: flex; align-items: center; gap: 0.35rem; flex: 1; min-width: 0; }
.sa-q-actions { display: flex; align-items: center; gap: 0.2rem; flex-shrink: 0; }
.sa-empty { padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem; }
.a-type { font-size: 0.65rem; padding: 0.1rem 0.3rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); flex-shrink: 0; }
.a-status { font-size: 0.65rem; padding: 0.1rem 0.3rem; border-radius: 4px; flex-shrink: 0; }
.a-status.approved { background: #d4edda; color: var(--success); }
.a-status.pending { background: #fff3cd; color: #856404; }
.a-status.rejected { background: #f8d7da; color: var(--error); }
.a-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.a-user { font-size: 0.7rem; color: var(--text-secondary); flex-shrink: 0; }
.btn-xs { padding: 0.2rem 0.5rem; font-size: 0.65rem; border: none; border-radius: 4px; cursor: pointer; }
.btn-approve { background: var(--success); color: #fff; }
.btn-reject { background: var(--error); color: #fff; }

/* 待审核 */
.review-list { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
.review-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-top: 1px solid var(--border); gap: 1rem; }
.review-item:first-child { border-top: none; }
.review-info { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0; flex-wrap: wrap; }
.review-subject { font-size: 0.7rem; padding: 0.15rem 0.35rem; border-radius: 4px; background: #e8e8f0; color: #555; }
.review-type { font-size: 0.7rem; padding: 0.15rem 0.35rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); }
.review-q { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.review-user { font-size: 0.7rem; color: var(--text-secondary); }
.review-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }

/* 用户 */
.user-list { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
.user-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-top: 1px solid var(--border); }
.user-item:first-child { border-top: none; }
.user-info { display: flex; align-items: center; gap: 0.6rem; }
.user-name { font-weight: 500; }
.user-role { font-size: 0.65rem; padding: 0.15rem 0.35rem; border-radius: 4px; }
.user-role.admin { background: #e8f4fd; color: var(--primary); }
.user-role.user { background: var(--bg); color: var(--text-secondary); }
.user-date { font-size: 0.7rem; color: var(--text-secondary); }
.user-actions { display: flex; gap: 0.4rem; align-items: center; }
.role-select { padding: 0.25rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.75rem; }
.btn-del { padding: 0.25rem 0.5rem; border: 1px solid var(--error); border-radius: 6px; background: none; color: var(--error); font-size: 0.75rem; cursor: pointer; }
.btn-del:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-view { padding:0.25rem 0.4rem; border:1px solid var(--primary); border-radius:6px; background:none; color:var(--primary); font-size:0.8rem; cursor:pointer; }
.pr-list { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; }
.pr-item { display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0.8rem; border-top:1px solid var(--border); }
.pr-item:first-child { border-top:none; }
.pr-info { display:flex; align-items:center; gap:0.5rem; font-size:0.82rem; flex:1; min-width:0; }
.pr-subject { font-size:0.7rem; padding:0.1rem 0.35rem; border-radius:4px; background:#e8e8f0; color:#555; flex-shrink:0; }
.pr-user { font-weight:600; flex-shrink:0; }
.pr-status { font-size:0.65rem; padding:0.1rem 0.35rem; border-radius:4px; }
.pr-status.pending { background:#fff3cd; color:#856404; }
.pr-status.approved { background:#d4edda; color:var(--success); }
.pr-status.rejected { background:#f8d7da; color:var(--error); }
.pr-date { color:var(--text-secondary); font-size:0.75rem; margin-left:auto; }
.pr-actions { display:flex; gap:0.3rem; flex-shrink:0; }
.sa-card { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; }
.btn-view:hover { background:var(--primary); color:#fff; }

.report-list { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; }
.rp-item { padding:0.8rem; border-top:1px solid var(--border); }
.rp-item:first-child { border-top:none; }
.rp-header { display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; margin-bottom:0.3rem; flex-wrap:wrap; }
.rp-subject { font-size:0.65rem; padding:0.1rem 0.3rem; border-radius:4px; background:#e8e8f0; color:#555; }
.rp-user { font-weight:600; }
.rp-status { font-size:0.65rem; padding:0.1rem 0.35rem; border-radius:4px; }
.rp-status.pending { background:#fff3cd; color:#856404; }
.rp-status.resolved { background:#d4edda; color:var(--success); }
.rp-status.rejected { background:#f8d7da; color:var(--error); }
.rp-date { color:var(--text-secondary); margin-left:auto; }
.rp-q { font-size:0.78rem; color:var(--text-secondary); margin-bottom:0.2rem; }
.rp-content { font-size:0.85rem; padding:0.4rem; background:var(--bg); border-radius:6px; margin-bottom:0.3rem; }
.rp-reply { font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem; }
.rp-actions { display:flex; gap:0.3rem; margin-top:0.4rem; }
.rp-input { flex:1; padding:0.3rem 0.5rem; border:1px solid var(--border); border-radius:6px; font-size:0.8rem; background:var(--card); color:var(--text); }
.rp-input:focus { outline:none; border-color:var(--primary); }

.ud-stats { display:flex; gap:0.5rem; margin:0.8rem 0; }
.ud-card { flex:1; text-align:center; padding:0.6rem; background:var(--bg); border-radius:8px; font-size:0.78rem; color:var(--text-secondary); }
.ud-num { display:block; font-size:1.3rem; font-weight:700; color:var(--primary); }
.ud-card.correct .ud-num { color:var(--success); }
.ud-card.wrong .ud-num { color:var(--error); }
.ud-subjects { margin-bottom:0.8rem; }
.ud-subj { display:flex; align-items:center; gap:0.4rem; font-size:0.78rem; margin-bottom:0.3rem; }
.ud-lbl { width:4rem; flex-shrink:0; }
.ud-bar { flex:1; height:12px; background:#e8e8ec; border-radius:6px; overflow:hidden; }
.ud-fill { height:100%; border-radius:6px; min-width:4px; }
.ud-pct { width:4rem; text-align:right; flex-shrink:0; }
.ud-records h4 { font-size:0.85rem; margin-bottom:0.4rem; }
.ud-rec { display:flex; align-items:center; gap:0.4rem; font-size:0.8rem; padding:0.25rem 0; border-top:1px solid var(--border); }
.ud-rec-icon { font-weight:700; }
.ud-rec-icon.ok { color:var(--success); }
.ud-rec-icon.no { color:var(--error); }
.ud-rec-q { color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* 反馈 */
.feedback-list { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
.fb-item { padding: 0.8rem; border-top: 1px solid var(--border); }
.fb-item:first-child { border-top: none; }
.fb-header { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; margin-bottom: 0.5rem; }
.fb-user { font-weight: 600; }
.fb-date { color: var(--text-secondary); }
.fb-status { font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 4px; }
.fb-status.pending { background: #fff3cd; color: #856404; }
.fb-status.replied { background: #d4edda; color: var(--success); }
.fb-content { font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; }
.fb-images { display: flex; gap: 0.4rem; margin-top: 0.4rem; flex-wrap: wrap; }
.fb-img { width: 70px; height: 70px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid var(--border); }
.fb-reply { margin-top: 0.4rem; padding: 0.4rem; background: var(--bg); border-radius: 6px; font-size: 0.82rem; }
.reply-label { font-weight: 600; color: var(--primary); }
.fb-actions { display: flex; gap: 0.4rem; margin-top: 0.4rem; }
.reply-input { flex: 1; padding: 0.35rem 0.5rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.82rem; }
.reply-input:focus { outline: none; border-color: var(--primary); }
.btn-reply { padding: 0.35rem 0.7rem; border: none; border-radius: 6px; background: var(--primary); color: #fff; font-size: 0.75rem; cursor: pointer; }

.empty { text-align: center; padding: 2rem; color: var(--text-secondary); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; cursor: pointer; }
.modal-wide { width:90%; max-width:520px; max-height:80vh; overflow-y:auto; background:var(--card); border-radius:14px; padding:1.5rem; cursor:default; }
.modal-wide h3 { font-size:1.1rem; }
.preview-full { max-width: 90vw; max-height: 90vh; border-radius: 8px; }

@media (max-width: 640px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
  .ov-card { padding: 0.7rem; }
  .ov-num { font-size: 1.1rem; }
  .tab { font-size: 0.78rem; padding: 0.5rem; }
  .sa-header { padding: 0.6rem 0.7rem; flex-wrap: wrap; gap: 0.3rem; }
  .sa-question { flex-direction: column; align-items: flex-start; gap: 0.3rem; padding: 0.4rem 0.7rem; }
  .sa-q-info { flex-wrap: wrap; }
  .a-text { white-space: normal; }
  .review-item { flex-direction: column; align-items: flex-start; }
  .user-item { flex-direction: column; align-items: flex-start; gap: 0.3rem; }
}
</style>
