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
        <div class="ov-card"><span class="ov-num">{{ overview.users }}</span><span class="ov-lbl">用户</span></div>
        <div class="ov-card"><span class="ov-num">{{ overview.questions }}</span><span class="ov-lbl">题目</span></div>
        <div class="ov-card warn"><span class="ov-num">{{ overview.pending }}</span><span class="ov-lbl">待审核</span></div>
        <div class="ov-card"><span class="ov-num">{{ overview.records }}</span><span class="ov-lbl">答题记录</span></div>
      </div>

      <!-- 题库管理（管理员） -->
      <div class="section">
        <div class="section-header">
          <h2>📝 题库管理 ({{ allQuestions.length }})</h2>
          <div class="filter-group">
            <select v-model="filterStatus" @change="loadAllQuestions" class="filter-select">
              <option value="">全部状态</option>
              <option value="approved">已审核</option>
              <option value="pending">待审核</option>
              <option value="rejected">已拒绝</option>
            </select>
            <input v-model="searchQ" class="filter-input" placeholder="搜索题目..." />
          </div>
        </div>
        <div class="admin-q-list" v-if="filteredQuestions.length">
          <div class="admin-q-item" v-for="q in filteredQuestions" :key="q.id">
            <div class="admin-q-info">
              <span class="a-subject">{{ q.subject }}</span>
              <span class="a-type">{{ typeLabel(q.type) }}</span>
              <span class="a-status" :class="q.status">{{ statusLabel(q.status) }}</span>
              <span class="a-text">{{ q.question }}</span>
              <span class="a-user" v-if="q.uploader_name">by {{ q.uploader_name }}</span>
            </div>
            <div class="admin-q-actions">
              <button class="btn-icon" @click="editQuestion(q.id)" title="编辑">✏️</button>
              <button class="btn-icon" @click="deleteQuestion(q.id)" title="删除">🗑️</button>
              <template v-if="q.status === 'pending'">
                <button class="btn-approve btn-xs" @click="approveQ(q.id)">通过</button>
                <button class="btn-reject btn-xs" @click="rejectQ(q.id)">拒绝</button>
              </template>
            </div>
          </div>
        </div>
        <div v-else class="empty">暂无题目</div>
      </div>

      <!-- 待审核 -->
      <div class="section">
        <h2>待审核 <span v-if="pendingQuestions.length" class="badge">{{ pendingQuestions.length }}</span></h2>
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

      <!-- 用户管理 -->
      <div class="section">
        <h2>用户管理 ({{ users.length }})</h2>
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
              <button class="btn-del" @click="deleteUser(u.id)" :disabled="isSelf(u.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 意见反馈 -->
      <div class="section">
        <h2>意见反馈 ({{ feedbackList.length }})</h2>
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
            <div class="fb-reply" v-if="item.reply">
              <span class="reply-label">回复：</span>{{ item.reply }}
            </div>
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

const overview = ref(null)
const pendingQuestions = ref([])
const users = ref([])
const feedbackList = ref([])
const replyTexts = ref({})
const previewImg = ref(null)
const allQuestions = ref([])
const searchQ = ref('')
const filterStatus = ref('')

function typeLabel(t) {
  const m = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空' }
  return m[t] || t
}
function statusLabel(s) {
  const m = { approved: '已审核', pending: '待审核', rejected: '已拒绝' }
  return m[s] || s
}
function isSelf(id) { return auth.user?.id === id }

const filteredQuestions = computed(() => {
  let list = allQuestions.value
  if (searchQ.value) list = list.filter(q => q.question.includes(searchQ.value))
  return list
})

onMounted(async () => {
  try {
    const [ov, pq, us, fb, aq] = await Promise.all([
      api.getAdminOverview(), api.getPendingQuestions(), api.getAdminUsers(), api.getFeedback(), api.getAllQuestions({ status: filterStatus.value || undefined })
    ])
    overview.value = ov.data
    pendingQuestions.value = pq.data
    users.value = us.data
    feedbackList.value = fb.data
    allQuestions.value = aq.data
  } catch {}
})

async function loadAllQuestions() {
  try {
    const res = await api.getAllQuestions({ status: filterStatus.value || undefined })
    allQuestions.value = res.data
  } catch {}
}

function editQuestion(id) { router.push(`/admin/edit/${id}`) }
async function deleteQuestion(id) {
  if (!confirm('确定删除这道题吗？')) return
  await api.deleteQuestion(id)
  allQuestions.value = allQuestions.value.filter(q => q.id !== id)
}
async function approveQ(id) {
  await api.updateQuestionStatus(id, 'approved')
  await loadAllQuestions()
}
async function rejectQ(id) {
  await api.updateQuestionStatus(id, 'rejected')
  await loadAllQuestions()
}

async function reply(id) {
  const text = replyTexts.value[id]
  if (!text?.trim()) return
  await api.replyFeedback(id, text.trim())
  replyTexts.value[id] = ''
  const fb = await api.getFeedback()
  feedbackList.value = fb.data
}

async function approve(id) {
  await api.updateQuestionStatus(id, 'approved')
  pendingQuestions.value = pendingQuestions.value.filter(q => q.id !== id)
}
async function reject(id) {
  await api.updateQuestionStatus(id, 'rejected')
  pendingQuestions.value = pendingQuestions.value.filter(q => q.id !== id)
}
async function changeRole(id, role) {
  if (isSelf(id)) return
  await api.updateUserRole(id, role)
}
async function deleteUser(id) {
  if (isSelf(id) || !confirm('确定删除该用户？关联的答题记录不会被删除。')) return
  await api.deleteUser(id)
  users.value = users.value.filter(u => u.id !== id)
}
</script>

<style scoped>
.page-header { background: #fff; border-bottom: 1px solid var(--border); padding: 1.2rem 0; margin-bottom: 1rem; }
.page-header h1 { font-size: 1.3rem; font-weight: 700; }
.back-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; display: block; margin-bottom: 0.3rem; }
.back-btn:hover { color: var(--text); }

.overview-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
.ov-card { background: #fff; border-radius: 12px; border: 1px solid var(--border); padding: 1.2rem; text-align: center; }
.ov-num { display: block; font-size: 1.5rem; font-weight: 700; color: var(--primary); }
.ov-lbl { font-size: 0.8rem; color: var(--text-secondary); }
.ov-card.warn .ov-num { color: var(--warning); }

.section { margin-bottom: 1.5rem; }
.section h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
.badge { background: var(--warning); color: #fff; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 10px; }
.empty { text-align: center; padding: 2rem; color: var(--text-secondary); background: #fff; border-radius: 12px; border: 1px solid var(--border); }

.review-list { background: #fff; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
.review-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-top: 1px solid var(--border); gap: 1rem; }
.review-item:first-child { border-top: none; }
.review-info { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
.review-subject { font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; background: #e8e8f0; color: #555; flex-shrink: 0; }
.review-type { font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); flex-shrink: 0; }
.review-q { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.review-user { font-size: 0.75rem; color: var(--text-secondary); flex-shrink: 0; }
.review-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
.btn-approve { padding: 0.3rem 0.7rem; border: none; border-radius: 6px; background: var(--success); color: #fff; font-size: 0.78rem; cursor: pointer; }
.btn-reject { padding: 0.3rem 0.7rem; border: none; border-radius: 6px; background: var(--error); color: #fff; font-size: 0.78rem; cursor: pointer; }

.user-list { background: #fff; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
.user-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-top: 1px solid var(--border); }
.user-item:first-child { border-top: none; }
.user-info { display: flex; align-items: center; gap: 0.75rem; }
.user-name { font-weight: 500; }
.user-role { font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; }
.user-role.admin { background: #e8f4fd; color: var(--primary); }
.user-role.user { background: var(--bg); color: var(--text-secondary); }
.user-date { font-size: 0.75rem; color: var(--text-secondary); }
.user-actions { display: flex; gap: 0.5rem; align-items: center; }
.role-select { padding: 0.3rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.8rem; }
.btn-del { padding: 0.3rem 0.6rem; border: 1px solid var(--error); border-radius: 6px; background: none; color: var(--error); font-size: 0.78rem; cursor: pointer; }
.btn-del:disabled { opacity: 0.3; cursor: not-allowed; }

.feedback-list { background: #fff; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
.fb-item { padding: 1rem; border-top: 1px solid var(--border); }
.fb-item:first-child { border-top: none; }
.fb-header { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; margin-bottom: 0.5rem; }
.fb-user { font-weight: 600; }
.fb-date { color: var(--text-secondary); }
.fb-status { font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 4px; }
.fb-status.pending { background: #fff3cd; color: #856404; }
.fb-status.replied { background: #d4edda; color: var(--success); }
.fb-content { font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap; }
.fb-images { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
.fb-img { width: 80px; height: 80px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 1px solid var(--border); }
.fb-img:hover { opacity: 0.85; }
.fb-reply { margin-top: 0.5rem; padding: 0.5rem; background: var(--bg); border-radius: 6px; font-size: 0.85rem; }
.reply-label { font-weight: 600; color: var(--primary); }
.fb-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.reply-input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem; }
.reply-input:focus { outline: none; border-color: var(--primary); }
.btn-reply { padding: 0.4rem 0.8rem; border: none; border-radius: 6px; background: var(--primary); color: #fff; font-size: 0.8rem; cursor: pointer; }

@media (max-width: 640px) {
  .overview-cards { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
  .ov-card { padding: 0.8rem; }
  .ov-num { font-size: 1.2rem; }
  .review-item { flex-direction: column; align-items: flex-start; gap: 0.5rem; padding: 0.6rem; }
  .review-info { flex-wrap: wrap; }
  .review-q { white-space: normal; }
  .admin-q-item { flex-direction: column; align-items: flex-start; gap: 0.3rem; padding: 0.5rem 0.6rem; }
  .admin-q-info { flex-wrap: wrap; }
  .a-text { white-space: normal; }
  .section-header { flex-direction: column; align-items: flex-start; }
  .filter-group { width: 100%; }
  .filter-input { flex: 1; }
  .user-item { flex-direction: column; align-items: flex-start; gap: 0.4rem; padding: 0.6rem; }
  .fb-item { padding: 0.6rem; }
  .fb-header { flex-wrap: wrap; }
}

.section-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.section-header h2 { margin-bottom: 0; }
.filter-group { display: flex; gap: 0.5rem; }
.filter-select { padding: 0.35rem 0.5rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.8rem; background: #fff; }
.filter-input { padding: 0.35rem 0.5rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.8rem; width: 160px; }
.filter-input:focus { outline: none; border-color: var(--primary); }
.admin-q-list { background: #fff; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
.admin-q-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; border-top: 1px solid var(--border); gap: 0.5rem; font-size: 0.85rem; }
.admin-q-item:first-child { border-top: none; }
.admin-q-item:hover { background: #f8f8ff; }
.admin-q-info { display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 0; }
.a-subject { font-size: 0.7rem; padding: 0.15rem 0.35rem; border-radius: 4px; background: #e8e8f0; color: #555; flex-shrink: 0; }
.a-type { font-size: 0.7rem; padding: 0.15rem 0.35rem; border-radius: 4px; background: var(--bg); color: var(--text-secondary); flex-shrink: 0; }
.a-status { font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 4px; flex-shrink: 0; }
.a-status.approved { background: #d4edda; color: var(--success); }
.a-status.pending { background: #fff3cd; color: #856404; }
.a-status.rejected { background: #f8d7da; color: var(--error); }
.a-text { font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.a-user { font-size: 0.7rem; color: var(--text-secondary); flex-shrink: 0; }
.admin-q-actions { display: flex; align-items: center; gap: 0.3rem; flex-shrink: 0; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 0.9rem; padding: 0.15rem; }
.btn-xs { padding: 0.2rem 0.5rem; font-size: 0.7rem; border: none; border-radius: 4px; cursor: pointer; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; cursor: pointer; }
.preview-full { max-width: 90vw; max-height: 90vh; border-radius: 8px; }
</style>
