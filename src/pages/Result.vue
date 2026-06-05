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

      <!-- 考试模式：显示得分 -->
      <!-- 考试回顾：逐题查看 -->
      <div class="exam-review" v-if="reviewList.length">
        <h3>📋 答题回顾</h3>
        <div class="rv-item" v-for="(item, idx) in reviewList" :key="idx">
          <div class="rv-header">
            <span class="rv-num">{{ idx + 1 }}</span>
            <span class="rv-type">{{ item.typeLabel }}</span>
            <span class="rv-badge" :class="item.correct ? 'correct' : 'wrong'">{{ item.correct ? '✓' : '✗' }}</span>
          </div>
          <div class="rv-q">{{ item.question }}</div>
          <div class="rv-answer" v-if="!item.correct">
            你的答案：<span class="rv-wrong">{{ item.userAnswer }}</span>
            正确答案：<span class="rv-right">{{ item.correctAnswer }}</span>
          </div>
          <div class="rv-explanation" v-if="item.explanation">{{ item.explanation }}</div>
        </div>
      </div>

      <div class="exam-score" v-if="examScore !== null">
        <div class="score-big">{{ examScore.correct }}/{{ examScore.total }}</div>
        <p class="score-sub">得分</p>
        <div class="exam-breakdown" v-if="examScore.breakdown.length">
          <div class="eb-row" v-for="b in examScore.breakdown" :key="b.type">
            <span class="eb-label">{{ typeLabel(b.type) }}</span>
            <span class="eb-bar">
              <span class="eb-fill" :style="{ width: (b.total > 0 ? b.correct/b.total*100 : 0) + '%' }"></span>
            </span>
            <span class="eb-num">{{ b.correct }}/{{ b.total }} ({{ b.earned }}分)</span>
          </div>
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
const examScore = ref(null)
const reviewList = ref([])

function typeLabel(t) { const m = { single_choice: '单选', multi_choice: '多选', true_false: '判断', fill_blank: '填空' }; return m[t] || t }

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

    // 加载答题回顾
    const review = JSON.parse(localStorage.getItem('examReview') || '[]')
    if (review.length) reviewList.value = review.map(r => ({ ...r, typeLabel: typeLabel(r.type) }))

    // 计算考试得分
    const config = JSON.parse(localStorage.getItem('examConfig') || 'null')
    if (config && data.total > 0) {
      const scoreMap = {}
      config.types.forEach(t => { scoreMap[t.type] = { score: t.score, count: t.count } })
      const breakdown = []
      let totalScore = 0, earnedScore = 0
      for (const t of config.types) {
        const typeQuestions = data.wrongList.filter(w => w.type === t.type)
        const typeTotal = t.count
        const typeCorrect = typeTotal - typeQuestions.length
        const earned = typeCorrect * t.score
        const possible = t.count * t.score
        breakdown.push({ type: t.type, total: typeTotal, correct: typeCorrect, earned, possible })
        totalScore += possible
        earnedScore += earned
      }
      examScore.value = { total: totalScore, correct: earnedScore, breakdown }
    }
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
.exam-score { margin: 1rem 0; padding: 1rem; background: var(--bg); border-radius: 10px; }
.score-big { font-size: 2rem; font-weight: 800; color: var(--primary); }
.score-sub { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.8rem; }
.exam-breakdown { display: flex; flex-direction: column; gap: 0.4rem; }
.eb-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
.eb-label { width: 3rem; flex-shrink: 0; color: var(--text-secondary); }
.eb-bar { flex: 1; height: 14px; background: #e8e8ec; border-radius: 7px; overflow: hidden; }
.eb-fill { display: block; height: 100%; background: var(--primary); border-radius: 7px; transition: width 0.5s; }
.eb-num { width: 5rem; text-align: right; flex-shrink: 0; font-weight: 500; }
.wrong-q { font-weight: 500; margin-bottom: 0.3rem; font-size: 0.9rem; }
.wrong-answer { font-size: 0.85rem; color: var(--error); margin-bottom: 0.2rem; }
.wrong-explanation { font-size: 0.8rem; color: var(--text-secondary); }
.exam-review { margin:1rem 0; background:var(--card); border-radius:var(--radius); border:1px solid var(--border); padding:1rem; text-align:left; }
.exam-review h3 { font-size:0.95rem; margin-bottom:0.7rem; }
.rv-item { padding:0.6rem 0; border-top:1px solid var(--border); }
.rv-item:first-child { border-top:none; }
.rv-header { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem; }
.rv-num { width:1.5rem; height:1.5rem; border-radius:50%; background:var(--bg); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:600; }
.rv-type { font-size:0.7rem; padding:0.1rem 0.35rem; border-radius:4px; background:var(--bg); color:var(--text-secondary); }
.rv-badge { font-size:0.75rem; font-weight:700; }
.rv-badge.correct { color:var(--success); }
.rv-badge.wrong { color:var(--error); }
.rv-q { font-size:0.85rem; margin-bottom:0.25rem; }
.rv-answer { font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.2rem; }
.rv-wrong { color:var(--error); font-weight:600; margin-right:0.5rem; }
.rv-right { color:var(--success); font-weight:600; }
.rv-explanation { font-size:0.78rem; color:var(--text-secondary); }
.result-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; }

@media (max-width: 640px) {
  .result-card { margin: 0.5rem; padding: 1.2rem; }
  .score { font-size: 2.5rem; }
  .stat-cards { gap: 0.4rem; }
  .mini-stat { padding: 0.5rem; }
  .mini-num { font-size: 1rem; }
  .result-actions { flex-direction: column; }
  .result-actions .btn { width: 100%; text-align: center; }
}
</style>
