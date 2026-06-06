<template>
  <div class="app" :class="{ dark: isDark }">
    <nav class="nav" v-if="!['Quiz','Login','Register','QuizSelection'].includes($route.name)">
      <div class="nav-inner">
        <router-link to="/" class="nav-brand">
          <span class="nav-logo">📚</span>
          <span class="nav-brand-text">刷题宝</span>
        </router-link>

        <div class="nav-search" v-if="auth.isLoggedIn">
          <input v-model="searchQ" class="search-input" placeholder="搜索题目..." @input="onSearch" @focus="showSearch=true" @blur="hideSearch" />
          <div class="search-drop" v-if="showSearch && searchResults.length">
            <div class="search-item" v-for="r in searchResults" :key="r.id" @mousedown="goSearch(r)">
              <span class="ss-subject">{{ r.subject }}</span>
              <span class="ss-text">{{ r.snippet }}</span>
            </div>
          </div>
        </div>

        <div class="nav-actions">
          <router-link to="/leaderboard" class="nav-icon-btn" title="排行榜">🏆</router-link>
          <router-link to="/feedback" class="nav-icon-btn" title="反馈">💬</router-link>
          <button class="nav-icon-btn" @click="toggleTheme" :title="isDark ? '亮色' : '暗色'">{{ isDark ? '☀️' : '🌙' }}</button>

          <template v-if="auth.isLoggedIn">
            <router-link to="/profile" class="nav-avatar" :title="auth.user.username">{{ auth.user.username[0].toUpperCase() }}</router-link>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-btn-link">登录</router-link>
            <router-link to="/register" class="nav-btn-reg">注册</router-link>
          </template>
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
    try { const res = await api.searchQuestions(searchQ.value); searchResults.value = res.data.slice(0, 8) } catch {}
  }, 300)
}
function hideSearch() { setTimeout(() => { showSearch.value = false }, 200) }
function goSearch(r) {
  showSearch.value = false; searchQ.value = ''
  const sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  router.push({ name: 'Quiz', query: { question_id: r.id, session_id: sid } })
}
function handleLogout() { clearAuth(); router.push('/login') }
</script>

<style scoped>
.nav { position:sticky; top:0; z-index:100; background:var(--card); border-bottom:1px solid var(--border); backdrop-filter:blur(10px); }
.nav-inner { max-width:960px; margin:0 auto; display:flex; align-items:center; gap:0.8rem; padding:0.55rem 1.2rem; }

.nav-brand { display:flex; align-items:center; gap:0.4rem; text-decoration:none; flex-shrink:0; }
.nav-logo { font-size:1.2rem; }
.nav-brand-text { font-size:1rem; font-weight:700; color:var(--text); }

.nav-search { position:relative; flex:1; max-width:280px; }
.search-input { width:100%; padding:0.35rem 0.7rem; border:1px solid var(--border); border-radius:8px; font-size:0.8rem; background:var(--bg); color:var(--text); }
.search-input:focus { outline:none; border-color:var(--primary); }
.search-drop { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--card); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,0.1); max-height:280px; overflow-y:auto; z-index:200; }
.search-item { display:flex; align-items:center; gap:0.35rem; padding:0.4rem 0.6rem; cursor:pointer; font-size:0.8rem; border-top:1px solid var(--border); }
.search-item:first-child { border-top:none; }
.search-item:hover { background:var(--bg); }
.ss-subject { font-size:0.6rem; padding:0.1rem 0.3rem; border-radius:4px; background:#e8e8f0; color:#555; flex-shrink:0; }
.ss-text { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text); }

.nav-actions { display:flex; align-items:center; gap:0.4rem; flex-shrink:0; }
.nav-icon-btn { background:none; border:none; cursor:pointer; font-size:1rem; padding:0.3rem 0.4rem; border-radius:8px; text-decoration:none; line-height:1; transition:background 0.15s; }
.nav-icon-btn:hover { background:var(--bg); }

.nav-avatar { width:30px; height:30px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:700; text-decoration:none; transition:opacity 0.15s; }
.nav-avatar:hover { opacity:0.8; }

.nav-btn-link { font-size:0.82rem; padding:0.3rem 0.6rem; border-radius:6px; text-decoration:none; color:var(--text-secondary); }
.nav-btn-link:hover { color:var(--primary); }
.nav-btn-reg { font-size:0.82rem; padding:0.3rem 0.8rem; border-radius:6px; background:var(--primary); color:#fff; text-decoration:none; }
.nav-btn-reg:hover { opacity:0.85; }

@media(max-width:640px) {
  .nav-inner { flex-wrap:wrap; gap:0.3rem; padding:0.4rem 0.8rem; }
  .nav-search { max-width:100%; flex-basis:100%; order:10; }
  .nav-icon-btn { font-size:0.9rem; padding:0.2rem 0.3rem; }
}
</style>
