import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../stores/auth.js'
import Home from '../pages/Home.vue'
import Quiz from '../pages/Quiz.vue'
import Result from '../pages/Result.vue'
import QuizSelection from '../pages/QuizSelection.vue'
import AdminDashboard from '../pages/AdminDashboard.vue'
import Admin from '../pages/Admin.vue'
import QuestionEdit from '../pages/QuestionEdit.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Feedback from '../pages/Feedback.vue'
import Leaderboard from '../pages/Leaderboard.vue'
import Bookmarks from '../pages/Bookmarks.vue'
import Stats from '../pages/Stats.vue'
import Profile from '../pages/Profile.vue'

const routes = [
  { path: '/', name: 'Home', component: Home, meta: { requiresAuth: true } },
  { path: '/subject/:subject', name: 'QuizSelection', component: QuizSelection, meta: { requiresAuth: true } },
  { path: '/quiz', name: 'Quiz', component: Quiz },
  { path: '/result', name: 'Result', component: Result },
  { path: '/admin', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/questions', name: 'Admin', component: Admin, meta: { requiresAuth: true } },
  { path: '/admin/edit/:id?', name: 'QuestionEdit', component: QuestionEdit, meta: { requiresAuth: true } },
  { path: '/leaderboard', name: 'Leaderboard', component: Leaderboard },
  { path: '/bookmarks', name: 'Bookmarks', component: Bookmarks },
  { path: '/stats', name: 'Stats', component: Stats },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/feedback', name: 'Feedback', component: Feedback },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    next({ name: 'Home' })
  } else if ((to.name === 'Login' || to.name === 'Register') && auth.isLoggedIn) {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
