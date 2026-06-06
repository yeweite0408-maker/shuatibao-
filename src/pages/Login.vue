<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-brand">
        <div class="brand-icon">📚</div>
        <h1 class="brand-title">刷题宝</h1>
        <p class="brand-desc">多科目题库，随时随地刷题进步</p>
      </div>

      <div class="auth-card" :class="{ 'shake': shakeCard }">
        <h2 class="card-title">欢迎回来</h2>
        <p class="card-subtitle">登录后同步你的学习数据</p>

        <form @submit.prevent="login" class="auth-form">
          <div class="input-group">
            <div class="input-icon">👤</div>
            <input
              v-model="username"
              type="text"
              class="auth-input"
              placeholder="用户名"
              autocomplete="username"
              @focus="clearError"
            />
          </div>

          <div class="input-group">
            <div class="input-icon">🔒</div>
            <input
              v-model="password"
              type="password"
              class="auth-input"
              placeholder="密码"
              autocomplete="current-password"
              @focus="clearError"
            />
          </div>

          <Transition name="fade">
            <div class="error-msg" v-if="error">
              <span>⚠️</span> {{ error }}
            </div>
          </Transition>

          <button class="auth-btn" type="submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>登录</span>
          </button>
        </form>

        <div class="auth-footer">
          还没有账号？
          <router-link to="/register" class="auth-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api/index.js'
import { setAuth } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const shakeCard = ref(false)

function clearError() { error.value = '' }

async function login() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请填写用户名和密码'
    shakeCard.value = true; setTimeout(() => shakeCard.value = false, 500)
    return
  }
  loading.value = true
  try {
    const res = await api.login(username.value, password.value)
    setAuth(res.data.token, res.data.user)
    router.push(route.query.redirect || '/')
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败，请重试'
    shakeCard.value = true; setTimeout(() => shakeCard.value = false, 500)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f2f7;
  position: relative;
  padding: 1rem;
}

/* 背景装饰形状 */
.auth-container {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

/* 品牌区 */
.auth-brand { text-align: center; margin-bottom: 2rem; }
.brand-icon { font-size: 3.5rem; margin-bottom: 0.3rem; animation: bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55); }
@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}
.brand-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: 1px;
}
.brand-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.3rem;
}

/* 卡片 */
.auth-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
  animation: slideUp 0.5s ease-out;
  transition: transform 0.3s;
}
.auth-card.shake { animation: shake 0.4s ease-in-out; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a2e;
  text-align: center;
}
.card-subtitle {
  text-align: center;
  color: #888;
  font-size: 0.85rem;
  margin-top: 0.3rem;
  margin-bottom: 1.5rem;
}

/* 表单 */
.auth-form { display: flex; flex-direction: column; gap: 1rem; }
.input-group {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
  z-index: 1;
}
.auth-input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 3rem;
  border: 2px solid #e8e8ec;
  border-radius: 12px;
  font-size: 0.95rem;
  background: #f8f8fc;
  transition: all 0.25s ease;
  outline: none;
}
.auth-input:focus {
  border-color: #667eea;
  background: var(--card);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
}
.auth-input::placeholder { color: #bbb; }

/* 错误 */
.error-msg {
  background: rgba(255, 59, 48, 0.1);
  color: #e53e3e;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #ffd4d4;
}
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }

/* 按钮 */
.auth-btn {
  width: 100%;
  padding: 0.9rem;
  border: none;
  border-radius: 12px;
  background: var(--primary);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  margin-top: 0.5rem;
}
.auth-btn:hover:not(:disabled) {
  background: #0077ed;
}
.auth-btn:active:not(:disabled) { transform: translateY(0); }
.auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner {
  width: 22px; height: 22px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 底部 */
.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: #888;
}
.auth-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}
.auth-link:hover { text-decoration: underline; }

@media (max-width: 480px) {
  .auth-card { padding: 1.5rem 1.2rem; }
  .brand-icon { font-size: 2.5rem; }
  .brand-title { font-size: 1.5rem; }
  .card-title { font-size: 1.2rem; }
  .auth-input { padding: 0.75rem 1rem 0.75rem 2.5rem; font-size: 0.9rem; }
  .input-icon { left: 0.75rem; font-size: 0.95rem; }
  .auth-container { max-width: 95%; }
}
</style>
