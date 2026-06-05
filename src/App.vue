<template>
  <div class="app">
    <nav class="nav" v-if="!['Quiz','Login','Register','QuizSelection'].includes($route.name)">
      <div class="container nav-inner">
        <router-link to="/" class="nav-title">📚 刷题宝</router-link>
        <div class="nav-right">
          <div class="nav-links">
            <router-link to="/" class="nav-link">首页</router-link>
            <router-link to="/feedback" class="nav-link">意见反馈</router-link>
            <router-link to="/admin" class="nav-link" v-if="auth.isLoggedIn && auth.user.role === 'admin'">管理后台</router-link>
          </div>
          <div class="nav-user" v-if="auth.isLoggedIn">
            <span class="user-name">{{ auth.user.username }}</span>
            <span class="user-role-badge" v-if="auth.user.role === 'admin'">管理员</span>
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
import { auth, clearAuth, syncUser } from './stores/auth.js'
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'

const router = useRouter()
onMounted(() => syncUser())

function handleLogout() {
  clearAuth()
  router.push('/login')
}
</script>

<style scoped>
.nav { background: #fff; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
.nav-inner { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; }
.nav-title { font-weight: 700; font-size: 1.1rem; text-decoration: none; color: var(--text); }
.nav-right { display: flex; align-items: center; gap: 1.5rem; }
.nav-links { display: flex; gap: 1.5rem; }
.nav-link { text-decoration: none; color: var(--text-secondary); font-size: 0.9rem; }
.nav-link:hover { color: var(--primary); }
.nav-user { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; }
.user-name { color: var(--text); font-weight: 500; }
.user-role-badge { font-size: 0.65rem; background: #e8f4fd; color: var(--primary); padding: 0.1rem 0.4rem; border-radius: 4px; }
.btn-link { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; }
.btn-link:hover { color: var(--error); }

@media (max-width: 640px) {
  .nav-inner { flex-wrap: wrap; gap: 0.4rem; padding: 0.5rem 0.8rem; }
  .nav-links { gap: 0.8rem; }
  .nav-right { gap: 0.6rem; }
  .nav-link { font-size: 0.8rem; }
  .nav-title { font-size: 1rem; }
  .user-name { font-size: 0.8rem; }
}
</style>
