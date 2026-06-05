<template>
  <div class="lb-page">
    <div class="page-header">
      <div class="container">
        <button class="back-btn" @click="$router.push('/')">← 返回首页</button>
        <h1>🏆 排行榜</h1>
      </div>
    </div>
    <div class="container">
      <div class="tab-bar">
        <button class="tab" :class="{ active: tab === 'daily' }" @click="tab = 'daily'">📅 今日排行</button>
        <button class="tab" :class="{ active: tab === 'historical' }" @click="tab = 'historical'">🏅 历史总榜</button>
      </div>

      <div class="rank-list" v-if="list.length">
        <div class="rank-item" v-for="item in list" :key="item.rank" :class="medal(item.rank)">
          <span class="rank-num">{{ item.rank <= 3 ? ['🥇','🥈','🥉'][item.rank-1] : '#'+item.rank }}</span>
          <span class="rank-name">{{ item.username }}</span>
          <span class="rank-count">{{ item.count }} 题</span>
          <span class="rank-rate">{{ item.correct }} 正确</span>
        </div>
      </div>
      <div v-else class="empty">暂无排行数据，快去刷题吧！</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import api from '../api/index.js'

const tab = ref('daily')
const list = ref([])

async function load() {
  try {
    const res = await api.getLeaderboard(tab.value)
    list.value = res.data
  } catch { list.value = [] }
}
watch(tab, load)
onMounted(load)

function medal(rank) {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}
</script>

<style scoped>
.lb-page { padding-bottom: 3rem; }
.page-header { background: var(--card); border-bottom: 1px solid var(--border); padding: 1.2rem 0; margin-bottom: 0; }
.page-header h1 { font-size: 1.3rem; font-weight: 700; }
.back-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; display: block; margin-bottom: 0.3rem; }
.back-btn:hover { color: var(--text); }

.tab-bar { display: flex; gap: 0; background: var(--card); border-radius: var(--radius); overflow: hidden; border: 1px solid var(--border); margin-bottom: 1rem; }
.tab { flex: 1; padding: 0.75rem; border: none; background: var(--card); cursor: pointer; font-size: 0.9rem; transition: all 0.15s; }
.tab.active { background: var(--primary); color: #fff; font-weight: 600; }
.tab:not(.active):hover { background: var(--bg); }

.rank-list { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
.rank-item { display: flex; align-items: center; padding: 0.8rem 1rem; gap: 0.75rem; border-top: 1px solid var(--border); transition: background 0.1s; }
.rank-item:first-child { border-top: none; }
.rank-item.gold { background: #fffbf0; }
.rank-item.silver { background: #fafafa; }
.rank-item.bronze { background: #fff8f0; }
.rank-num { width: 2.5rem; font-size: 1.2rem; text-align: center; flex-shrink: 0; }
.rank-name { flex: 1; font-weight: 500; }
.rank-count { font-size: 0.9rem; color: var(--primary); font-weight: 600; }
.rank-rate { font-size: 0.8rem; color: var(--success); }
.empty { text-align: center; padding: 3rem; color: var(--text-secondary); background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); }

@media (max-width: 640px) {
  .rank-item { padding: 0.6rem 0.8rem; gap: 0.5rem; font-size: 0.85rem; }
  .rank-num { width: 2rem; font-size: 1rem; }
  .rank-count { font-size: 0.8rem; }
}
</style>
