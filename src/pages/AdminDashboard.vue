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

      <!-- 待审核 -->
      <div class="section">
        <h2>待审核题目 <span v-if="pendingQuestions.length" class="badge">{{ pendingQuestions.length }}</span></h2>
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'
import { auth } from '../stores/auth.js'

const overview = ref(null)
const pendingQuestions = ref([])
const users = ref([])

function typeLabel(t) {
  const m = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空' }
  return m[t] || t
}
function isSelf(id) { return auth.user?.id === id }

onMounted(async () => {
  try {
    const [ov, pq, us] = await Promise.all([
      api.getAdminOverview(), api.getPendingQuestions(), api.getAdminUsers()
    ])
    overview.value = ov.data
    pendingQuestions.value = pq.data
    users.value = us.data
  } catch {}
})

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
</style>
