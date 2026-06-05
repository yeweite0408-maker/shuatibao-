<template>
  <div class="page">
    <div class="page-header"><div class="container">
      <button class="back-btn" @click="$router.push('/')">← 返回首页</button>
      <h1>📊 学习统计</h1>
    </div></div>
    <div class="container">
      <div v-if="stats" class="stats-wrap">
        <div class="stat-cards">
          <div class="s-card"><span class="s-num">{{ stats.total }}</span><span class="s-lbl">总答题</span></div>
          <div class="s-card s-correct"><span class="s-num">{{ stats.correct }}</span><span class="s-lbl">正确</span></div>
          <div class="s-card s-wrong"><span class="s-num">{{ stats.wrong }}</span><span class="s-lbl">错误</span></div>
          <div class="s-card"><span class="s-num">{{ stats.rate }}%</span><span class="s-lbl">正确率</span></div>
          <div class="s-card"><span class="s-num">{{ stats.streak }} 天</span><span class="s-lbl">连续打卡</span></div>
        </div>

        <div class="sec" v-if="stats.bySubject && stats.bySubject.length">
          <h3>各科目正确率</h3>
          <div class="subj-bar" v-for="s in stats.bySubject" :key="s.subject">
            <span class="subj-lbl">{{ s.subject }}</span>
            <div class="subj-track"><div class="subj-fill" :style="{width:s.rate+'%', background: rateColor(s.rate)}"></div></div>
            <span class="subj-num">{{ s.rate }}%（{{ s.count }}题）</span>
          </div>
        </div>

        <div class="sec" v-if="stats.daily && stats.daily.length">
          <h3>近30天答题</h3>
          <div class="daily-grid">
            <div class="daily-cell" v-for="d in stats.daily" :key="d.day"
              :style="{opacity: Math.min(1, d.count/10+0.2)}"
              :title="d.day + ': ' + d.count + '题'">
              <span class="daily-count">{{ d.count }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty">暂无数据，快去刷题吧！</div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/index.js'
const stats = ref(null)
function rateColor(r) { if(r>=70) return 'var(--success)'; if(r>=40) return 'var(--warning)'; return 'var(--error)' }
onMounted(async () => {
  try { const r = await api.getUserStats(); stats.value = r.data } catch {}
})
</script>
<style scoped>
.page { padding-bottom:2rem; }
.page-header { background:var(--card); border-bottom:1px solid var(--border); padding:1.2rem 0; }
.page-header h1 { font-size:1.3rem; font-weight:700; }
.back-btn { background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:0.85rem; display:block; margin-bottom:0.3rem; }
.stat-cards { display:grid; grid-template-columns:repeat(5,1fr); gap:0.5rem; margin-bottom:1.5rem; }
.s-card { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); padding:0.8rem; text-align:center; }
.s-num { display:block; font-size:1.3rem; font-weight:700; color:var(--primary); }
.s-lbl { font-size:0.75rem; color:var(--text-secondary); }
.s-card.s-correct .s-num { color:var(--success); }
.s-card.s-wrong .s-num { color:var(--error); }
.sec { background:var(--card); border-radius:var(--radius); border:1px solid var(--border); padding:1rem; margin-bottom:1rem; }
.sec h3 { font-size:0.95rem; margin-bottom:0.7rem; }
.subj-bar { display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem; font-size:0.82rem; }
.subj-lbl { width:5rem; flex-shrink:0; }
.subj-track { flex:1; height:14px; background:#e8e8ec; border-radius:7px; overflow:hidden; }
.subj-fill { height:100%; border-radius:7px; transition:width 0.5s; min-width:4px; }
.subj-num { width:5rem; text-align:right; flex-shrink:0; }
.daily-grid { display:flex; flex-wrap:wrap; gap:3px; }
.daily-cell { width:24px; height:24px; border-radius:3px; background:var(--primary); display:flex; align-items:center; justify-content:center; font-size:0.6rem; color:#fff; }
.empty { text-align:center; padding:3rem; color:var(--text-secondary); }
@media(max-width:640px){ .stat-cards{grid-template-columns:repeat(3,1fr)} }
</style>
