<template>
  <div class="page">
    <div class="page-header"><div class="container">
      <button class="back-btn" @click="$router.push('/')">← 返回首页</button>
      <h1>⭐ 收藏的题目</h1>
    </div></div>
    <div class="container">
      <div v-if="items.length" class="q-list">
        <div class="q-item" v-for="q in items" :key="q.question_id" @click="openQuiz(q.question_id)">
          <span class="q-subject">{{ q.subject }}</span>
          <span class="q-type">{{ typeLabel(q.type) }}</span>
          <span class="q-text">{{ q.question }}</span>
          <span class="q-arrow">→</span>
        </div>
      </div>
      <div v-else class="empty">暂无收藏的题目，刷题时点击 ☆ 即可收藏</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/index.js'
const router = useRouter()
const items = ref([])
function typeLabel(t) { const m = { single_choice:'单选', multi_choice:'多选', true_false:'判断', fill_blank:'填空' }; return m[t]||t }
onMounted(async () => { try { const r = await api.getBookmarked(); items.value = r.data } catch {} })
function openQuiz(id) {
  const sid = Date.now().toString(36)+Math.random().toString(36).slice(2,6)
  router.push({ name:'Quiz', query:{ question_id:id, session_id:sid } })
}
</script>
<style scoped>
.page { padding-bottom: 2rem; }
.page-header { background:var(--card); border-bottom:1px solid var(--border); padding:1.2rem 0; margin-bottom:0; }
.page-header h1 { font-size:1.3rem; font-weight:700; }
.back-btn { background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:0.85rem; display:block; margin-bottom:0.3rem; }
.q-list { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; }
.q-item { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1rem; border-top:1px solid var(--border); cursor:pointer; transition:background 0.1s; }
.q-item:hover { background:var(--bg); }
.q-subject { font-size:0.7rem; padding:0.15rem 0.35rem; border-radius:4px; background:#e8e8f0; color:#555; flex-shrink:0; }
.q-type { font-size:0.7rem; padding:0.15rem 0.35rem; border-radius:4px; background:var(--bg); color:var(--text-secondary); flex-shrink:0; }
.q-text { flex:1; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.q-arrow { color:var(--text-secondary); }
.empty { text-align:center; padding:3rem; color:var(--text-secondary); }
</style>
