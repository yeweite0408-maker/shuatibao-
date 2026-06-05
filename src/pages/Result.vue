<template>
  <div class="container result">
    <div class="result-card" v-if="stats">
      <div class="score" :class="scoreClass">{{ stats.correctRate }}%</div>
      <p class="score-label">正确率</p>

      <div class="stat-cards">
        <div class="mini-stat">
          <span class="mini-num">{{ stats.total }}</span>
          <span class="mini-label">总题</span>
        </div>
        <div class="mini-stat correct">
          <span class="mini-num">{{ stats.correct }}</span>
          <span class="mini-label">正确</span>
        </div>
        <div class="mini-stat wrong">
          <span class="mini-num">{{ stats.wrong }}</span>
          <span class="mini-label">错误</span>
        </div>
        <div class="mini-stat bookmark">
          <span class="mini-num">{{ stats.bookmarked }}</span>
          <span class="mini-label">收藏</span>
        </div>
      </div>

      <div class="wrong-list" v-if="stats.wrongList && stats.wrongList.length">
        <h3>错题回顾</h3>
        <div class="wrong-item" v-for="item in stats.wrongList" :key="item.id">
          <div class="wrong-q">{{ item.question }}</div>
          <div class="wrong-answer">正确答案：{{ item.answer }}</div>
          <div class="wrong-explanation">{{ item.explanation }}</div>
        </div>
      </div>

      <div class="result-actions">
        <button class="btn btn-primary" @click="retry">再来一轮</button>
        <button class="btn btn-secondary" @click="router.push('/')">返回首页</button>
      </div>
    </div>
    <div v-else class="result-card loading"><p>加载中...</p></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()
const stats = ref(null)

const scoreClass = computed(() => {
  if (!stats.value) return ''
  const rate = stats.value.correctRate
  if (rate >= 80) return 'excellent'
  if (rate >= 60) return 'good'
  return 'try-again'
})

onMounted(async () => {
  const sessionId = route.query.session_id
  if (!sessionId) return
  try {
    const res = await api.getStats(sessionId)
    const data = res.data
    data.correctRate = data.total > 0 ? Math.round(data.correct / data.total * 100) : 0
    stats.value = data
  } catch {}
})

function retry() {
  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  localStorage.setItem('lastSessionId', sessionId)
  router.push({ name: 'Quiz', query: { session_id: sessionId } })
}
</script>

<style scoped>
.result-card { max-width: 600px; margin: 2rem auto; text-align: center; background: #fff; border-radius: 12px; padding: 2rem; border: 1px solid var(--border); }
.loading { display: flex; justify-content: center; align-items: center; min-height: 200px; }
.score { font-size: 3.5rem; font-weight: 800; }
.score.excellent { color: var(--success); }
.score.good { color: var(--warning); }
.score.try-again { color: var(--error); }
.score-label { color: var(--text-secondary); margin-bottom: 1.5rem; }
.stat-cards { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
.mini-stat { flex: 1; padding: 1rem 0.5rem; background: var(--bg); border-radius: 8px; }
.mini-num { display: block; font-size: 1.3rem; font-weight: 700; }
.mini-label { font-size: 0.8rem; color: var(--text-secondary); }
.mini-stat.correct .mini-num { color: var(--success); }
.mini-stat.wrong .mini-num { color: var(--error); }
.mini-stat.bookmark .mini-num { color: var(--warning); }
.wrong-list { text-align: left; margin: 1.5rem 0; }
.wrong-list h3 { font-size: 1rem; margin-bottom: 0.75rem; }
.wrong-item { padding: 0.75rem; background: var(--bg); border-radius: 8px; margin-bottom: 0.5rem; }
.wrong-q { font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem; }
.wrong-answer { font-size: 0.85rem; color: var(--error); margin-bottom: 0.2rem; }
.wrong-explanation { font-size: 0.8rem; color: var(--text-secondary); }
.result-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; }
</style>
