<template>
  <div class="app" :class="{ dark: isDark }">
    <nav class="nav" v-if="!['Quiz','Login','Register','QuizSelection'].includes($route.name)">
      <div class="container nav-inner">
        <router-link to="/" class="nav-title">📚 刷题宝</router-link>
        <div class="nav-search" v-if="auth.isLoggedIn">
          <input v-model="searchQ" class="search-input" placeholder="搜索题目..." @input="onSearch" @focus="showSearch=true" @blur="hideSearch" />
          <div class="search-dropdown" v-if="showSearch && searchResults.length">
            <div class="search-item" v-for="r in searchResults" :key="r.id" @mousedown="goSearch(r)">
              <span class="s-subject">{{ r.subject }}</span>
              <span class="s-text">{{ r.snippet }}</span>
            </div>
          </div>
        </div>
        <div class="nav-right">
          <div class="nav-links">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/leaderboard" class="nav-link">排行榜</router-link>
            <router-link to="/feedback" class="nav-link">反馈</router-link>
            <router-link to="/admin" class="nav-link" v-if="auth.isLoggedIn && auth.user.role === 'admin'">管理</router-link>
          </div>
          <button class="theme-btn" @click="toggleTheme" :title="isDark ? '亮色模式' : '暗色模式'">{{ isDark ? '☀️' : '🌙' }}</button>
          <div class="nav-user" v-if="auth.isLoggedIn">
            <router-link to="/profile" class="user-name">{{ auth.user.username }}</router-link>
            <button class="btn-link" @click="handleLogout">退出</button>
          </div>
          <div class="nav-user" v-else>
            <router-link to="/login" class="nav-link">登录</router-link>
            <router-link to="/register" class="nav-link">注册</router-link>
          </div>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth, clearAuth, syncUser } from './stores/auth.js'
import api from './api/index.js'

const router = useRouter()
const isDark = ref(localStorage.getItem('theme') === 'dark')
const searchQ = ref('')
const searchResults = ref([])
const showSearch = ref(false)
let searchTimer = null

onMounted(() => syncUser())
if (isDark.value) document.documentElement.classList.add('dark')

function toggleTheme() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

function onSearch() {
  clearTimeout(searchTimer)
  if (!searchQ.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const res = await api.searchQuestions(searchQ.value)
      searchResults.value = res.data.slice(0, 8)
    } catch {}
  }, 300)
}

function hideSearch() { setTimeout(() => { showSearch.value = false }, 200) }

function goSearch(r) {
  showSearch.value = false
  searchQ.value = ''
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  router.push({ name: 'Quiz', query: { question_id: r.id, session_id: sid } })
}

function handleLogout() { clearAuth(); router.push('/login') }
</script>

<style scoped>
.nav { background: var(--card); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
.nav-inner { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1.5rem; gap: 0.8rem; }
.nav-title { font-weight: 700; font-size: 1.1rem; text-decoration: none; color: var(--text); flex-shrink: 0; }
.nav-search { position: relative; flex: 1; max-width: 320px; }
.search-input { width: 100%; padding: 0.4rem 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.82rem; background: var(--bg); color: var(--text); }
.search-input:focus { outline: none; border-color: var(--primary); }
.search-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-height: 300px; overflow-y: auto; z-index: 200; }
.search-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.7rem; cursor: pointer; font-size: 0.82rem; border-top: 1px solid var(--border); }
.search-item:first-child { border-top: none; }
.search-item:hover { background: var(--bg); }
.s-subject { font-size: 0.65rem; padding: 0.1rem 0.3rem; border-radius: 4px; background: #e8e8f0; color: #555; flex-shrink: 0; }
.s-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
.nav-right { display: flex; align-items: center; gap: 0.8rem; flex-shrink: 0; }
.nav-links { display: flex; gap: 1rem; }
.nav-link { text-decoration: none; color: var(--text-secondary); font-size: 0.85rem; }
.nav-link:hover { color: var(--primary); }
.theme-btn { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0; line-height: 1; }
.nav-user { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; }
.user-name { color: var(--text); font-weight: 500; text-decoration: none; }
.user-name:hover { color: var(--primary); }
.btn-link { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.82rem; }
.btn-link:hover { color: var(--error); }
@media (max-width: 640px) {
  .nav-inner { flex-wrap: wrap; padding: 0.4rem 0.8rem; gap: 0.4rem; }
  .nav-search { max-width: 100%; order: 10; flex-basis: 100%; }
  .nav-links { gap: 0.6rem; }
  .nav-link { font-size: 0.78rem; }
}
</style>
