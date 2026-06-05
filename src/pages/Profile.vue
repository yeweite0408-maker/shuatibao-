<template>
  <div class="profile-page">
    <div class="page-header"><div class="container">
      <button class="back-btn" @click="$router.push('/')">← 返回首页</button>
      <h1>👤 个人中心</h1>
    </div></div>
    <div class="container">
      <div class="user-card">
        <div class="user-avatar">{{ auth.user?.username?.charAt(0)?.toUpperCase() || '?' }}</div>
        <div class="user-meta">
          <div class="user-name">{{ auth.user?.username }}</div>
          <div class="user-badge" v-if="auth.user?.role === 'admin'">管理员</div>
        </div>
      </div>

      <div class="menu-list">
        <div class="menu-item" @click="$router.push('/stats')">
          <span class="menu-icon">📊</span>
          <span class="menu-text">学习统计</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="startWrongQuiz">
          <span class="menu-icon">❌</span>
          <span class="menu-text">错题练习</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="$router.push('/bookmarks')">
          <span class="menu-icon">⭐</span>
          <span class="menu-text">我的收藏</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="startRandomQuiz">
          <span class="menu-icon">🎲</span>
          <span class="menu-text">随机刷题</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="showExamModal = true">
          <span class="menu-icon">📝</span>
          <span class="menu-text">模拟考试</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="$router.push('/leaderboard')">
          <span class="menu-icon">🏆</span>
          <span class="menu-text">排行榜</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="$router.push('/admin')" v-if="auth.user?.role === 'admin'">
          <span class="menu-icon">⚙️</span>
          <span class="menu-text">管理后台</span>
          <span class="menu-arrow">→</span>
        </div>
        <div class="menu-item" @click="$router.push('/feedback')">
          <span class="menu-icon">💬</span>
          <span class="menu-text">意见反馈</span>
          <span class="menu-arrow">→</span>
        </div>
      </div>

      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <!-- 模拟考试设置 -->
    <div class="modal-overlay" v-if="showExamModal" @click.self="showExamModal = false">
      <div class="modal">
        <h3>📝 模拟考试</h3>
        <div class="exam-form">
          <div class="exam-field"><label>时间限制</label>
            <select v-model.number="examConfig.timeLimit" class="exam-select">
              <option :value="5">5分钟</option><option :value="10">10分钟</option><option :value="15">15分钟</option>
              <option :value="30">30分钟</option><option :value="60">60分钟</option><option :value="0">不限时</option>
            </select>
          </div>
          <div class="exam-type-grid">
            <div class="exam-type-row" v-for="t in examConfig.types" :key="t.type">
              <span class="et-label">{{ t.label }}</span>
              <div class="et-inputs">
                <label class="et-col"><span class="et-col-label">题数</span><input type="number" v-model.number="t.count" min="0" max="50" class="et-input" /></label>
                <label class="et-col"><span class="et-col-label">分值</span><input type="number" v-model.number="t.score" min="0" max="100" class="et-input" /></label>
              </div>
            </div>
            <div class="exam-total">总分：<strong>{{ totalScore }}</strong> 分 | 题数：<strong>{{ totalCount }}</strong> 题</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn exam-start" @click="startExam" :disabled="totalCount===0">开始考试</button>
          <button class="btn btn-secondary" @click="showExamModal=false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { auth, clearAuth } from '../stores/auth.js'
import api from '../api/index.js'

const router = useRouter()
const showExamModal = ref(false)
const examConfig = ref({ timeLimit: 10, types: [
  { type:'single_choice', label:'单选题', count:5, score:5 },
  { type:'multi_choice', label:'多选题', count:3, score:5 },
  { type:'true_false', label:'判断题', count:2, score:3 },
  { type:'fill_blank', label:'填空题', count:0, score:3 },
]})
const totalScore = computed(() => examConfig.value.types.reduce((s,t) => s + t.count*t.score, 0))
const totalCount = computed(() => examConfig.value.types.reduce((s,t) => s + t.count, 0))

function handleLogout() { clearAuth(); router.push('/login') }

async function startWrongQuiz() {
  try {
    const res = await api.getWrongQuestions()
    if (res.data.length === 0) { alert('暂无错题！'); return }
    const sid = 'wrong-' + Date.now().toString(36)
    localStorage.setItem('lastSessionId', sid)
    router.push({ name: 'Quiz', query: { session_id: sid, wrong: 1 } })
  } catch { alert('暂无错题！') }
}

function startRandomQuiz() {
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sid)
  router.push({ name: 'Quiz', query: { count: 10, session_id: sid } })
}

function startExam() {
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sid)
  localStorage.setItem('examConfig', JSON.stringify({
    types: examConfig.value.types.map(t => ({ type:t.type, count:t.count, score:t.score })),
    totalScore: totalScore.value
  }))
  showExamModal.value = false
  router.push({ name:'Quiz', query: {
    session_id: sid, exam: 1, timeLimit: examConfig.value.timeLimit || undefined,
    examTypes: examConfig.value.types.filter(t=>t.count>0).map(t=>`${t.type}:${t.count}:${t.score}`).join(',')
  }})
}
</script>

<style scoped>
.profile-page { padding-bottom: 2rem; }
.page-header { background:var(--card); border-bottom:1px solid var(--border); padding:1rem 0; }
.page-header h1 { font-size:1.2rem; font-weight:700; }
.back-btn { background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:0.85rem; display:block; margin-bottom:0.2rem; }

.user-card { display:flex; align-items:center; gap:1rem; padding:1.2rem; background:var(--card); border-radius:var(--radius); border:1px solid var(--border); margin-bottom:1rem; }
.user-avatar { width:48px; height:48px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700; flex-shrink:0; }
.user-meta { flex:1; }
.user-name { font-weight:600; font-size:1rem; }
.user-badge { display:inline-block; font-size:0.65rem; background:#e8f4fd; color:var(--primary); padding:0.1rem 0.4rem; border-radius:4px; margin-top:0.2rem; }

.menu-list { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; margin-bottom:1rem; }
.menu-item { display:flex; align-items:center; padding:0.8rem 1rem; border-top:1px solid var(--border); cursor:pointer; transition:background 0.1s; gap:0.6rem; }
.menu-item:first-child { border-top:none; }
.menu-item:hover { background:var(--bg); }
.menu-icon { font-size:1.1rem; width:1.6rem; text-align:center; }
.menu-text { flex:1; font-size:0.9rem; }
.menu-arrow { color:var(--text-secondary); }

.logout-btn { width:100%; padding:0.7rem; border:1px solid var(--error); border-radius:10px; background:none; color:var(--error); font-size:0.9rem; cursor:pointer; }
.logout-btn:hover { background:var(--error); color:#fff; }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:1000; }
.modal { background:var(--card); border-radius:14px; padding:1.5rem; width:90%; max-width:460px; }
.modal h3 { font-size:1.1rem; margin-bottom:0.5rem; }
.exam-form { display:flex; flex-direction:column; gap:0.8rem; }
.exam-field label { display:block; font-size:0.8rem; font-weight:500; margin-bottom:0.25rem; }
.exam-select { width:100%; padding:0.4rem; border:1px solid var(--border); border-radius:8px; font-size:0.85rem; background:var(--card); color:var(--text); }
.exam-type-grid { border:1px solid var(--border); border-radius:8px; overflow:hidden; }
.exam-type-row { display:flex; align-items:center; justify-content:space-between; padding:0.4rem 0.6rem; border-top:1px solid var(--border); }
.exam-type-row:first-child { border-top:none; }
.et-label { font-weight:500; font-size:0.82rem; min-width:3.5rem; }
.et-inputs { display:flex; gap:0.5rem; }
.et-col { display:flex; flex-direction:column; align-items:center; gap:0.15rem; }
.et-col-label { font-size:0.6rem; color:var(--text-secondary); }
.et-input { width:50px; padding:0.2rem 0.3rem; border:1px solid var(--border); border-radius:6px; font-size:0.82rem; text-align:center; background:var(--card); color:var(--text); }
.et-input:focus { outline:none; border-color:var(--primary); }
.exam-total { padding:0.4rem 0.6rem; text-align:right; font-size:0.82rem; color:var(--text-secondary); border-top:1px solid var(--border); }
.modal-actions { display:flex; gap:0.5rem; margin-top:0.8rem; }
.exam-start { background:var(--error); color:#fff; flex:1; }
.btn { padding:0.5rem 1rem; border:none; border-radius:8px; font-size:0.85rem; cursor:pointer; }
.btn-secondary { background:var(--bg); color:var(--text); border:1px solid var(--border); }
</style>
