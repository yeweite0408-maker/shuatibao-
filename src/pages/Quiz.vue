<template>
  <div class="quiz-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="progress-text">{{ answeredCount }}/{{ questions.length }}</span>
        <button class="btn btn-secondary btn-sm" @click="finishQuiz">完成</button>
      </div>
      <div class="question-numbers">
        <button
          v-for="(q, idx) in questions"
          :key="q.id"
          class="q-num"
          :class="{
            answered: answers[q.id] !== undefined,
            correct: results[q.id] === true,
            wrong: results[q.id] === false,
            active: currentIndex === idx
          }"
          @click="goTo(idx)"
        >{{ idx + 1 }}</button>
      </div>
    </aside>

    <main class="quiz-main">
      <div class="quiz-card" v-if="currentQuestion">
        <div class="q-header">
          <span class="q-type">{{ typeLabel }}</span>
          <span class="q-index">第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
          <button
            class="btn-icon"
            :class="{ bookmarked: bookmarkedSet.has(currentQuestion.id) }"
            @click="toggleBookmark"
          >{{ bookmarkedSet.has(currentQuestion.id) ? '★' : '☆' }}</button>
        </div>

        <div class="q-text">{{ currentQuestion.question }}</div>

        <!-- 单选题 & 判断题：点击即提交 -->
        <div class="options" v-if="currentQuestion.type === 'single_choice' || currentQuestion.type === 'true_false'">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option"
            :class="{
              selected: answers[currentQuestion.id] === optionValue(idx) && !submitted,
              correct: submitted && currentQuestion.answer === optionValue(idx),
              wrong: submitted && answers[currentQuestion.id] === optionValue(idx) && currentQuestion.answer !== optionValue(idx),
              disabled: submitted
            }"
            @click="quickAnswer(idx)"
          >{{ opt }}</button>
        </div>

        <!-- 多选题 -->
        <div class="options" v-else-if="currentQuestion.type === 'multi_choice'">
          <button
            v-for="(opt, idx) in currentQuestion.options"
            :key="idx"
            class="option"
            :class="{
              selected: multiSelected.includes(optionValue(idx)),
              correct: submitted && currentQuestion.answer.split(',').includes(optionValue(idx)),
              wrong: submitted && multiSelected.includes(optionValue(idx)) && !currentQuestion.answer.split(',').includes(optionValue(idx)),
              disabled: submitted
            }"
            @click="toggleMultiSelect(optionValue(idx))"
          >{{ opt }}</button>
          <button class="btn btn-primary btn-sm" @click="submitMultiAnswer" v-if="!submitted && multiSelected.length > 0">确认选择</button>
        </div>

        <!-- 填空题 -->
        <div class="fill-area" v-else-if="currentQuestion.type === 'fill_blank'">
          <input
            v-model="fillAnswer"
            class="fill-input"
            :disabled="submitted"
            placeholder="请输入答案"
            @keyup.enter="submitFillAnswer"
          />
          <button class="btn btn-primary btn-sm" @click="submitFillAnswer" v-if="!submitted && fillAnswer.trim()">确认</button>
        </div>

        <!-- 反馈区域：对错 + 解析 + 整体统计 -->
        <Transition name="fade">
          <div class="feedback" v-if="submitted">
            <div class="feedback-row">
              <div class="result-badge" :class="isCurrentCorrect ? 'correct' : 'wrong'">
                {{ isCurrentCorrect ? '✓ 正确' : '✗ 错误' }}
              </div>
              <div class="correct-answer" v-if="!isCurrentCorrect">
                正确答案：<strong>{{ currentQuestion.answer }}</strong>
              </div>
            </div>
            <div class="explanation">{{ currentQuestion.explanation }}</div>

            <!-- 整体统计 -->
            <div class="global-stats" v-if="questionStats">
              <div class="stats-header">
                <span>📊 全站答题统计</span>
                <span class="stats-rate">正确率 {{ questionStats.correctRate }}%（{{ questionStats.total }} 人作答）</span>
              </div>
              <div class="bar-chart" v-if="questionStats.distribution.length">
                <div class="bar-item" v-for="item in questionStats.distribution" :key="item.answer">
                  <span class="bar-label">{{ item.answer }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: barWidth(item.count) }"></div>
                  </div>
                  <span class="bar-count">{{ item.count }}人</span>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <div class="q-footer" v-if="!submitted || autoAdvancing">
          <button class="btn btn-secondary btn-sm" @click="prev" :disabled="currentIndex === 0">上一题</button>
          <div v-if="!submitted && currentQuestion.type === 'multi_choice'"></div>
          <div v-else-if="!submitted && currentQuestion.type === 'fill_blank'"></div>
        </div>
        <div class="q-footer next-bar" v-else>
          <button class="btn btn-text" @click="prev" :disabled="currentIndex === 0">← 上一题</button>
          <button class="btn-next" @click="next">
            {{ currentIndex === questions.length - 1 ? '查看结果 →' : '下一题 →' }}
          </button>
        </div>
      </div>

      <div class="quiz-card empty" v-else>
        <p>暂无题目，请先<a href="/admin">添加题目</a></p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})
const results = ref({})
const submitted = ref(false)
const fillAnswer = ref('')
const multiSelected = ref([])
const bookmarkedSet = ref(new Set())
const questionStats = ref(null)
const autoAdvancing = ref(false)
const sessionId = ref(route.query.session_id || Date.now().toString(36))

const typeLabel = computed(() => {
  const map = { single_choice: '单选题', multi_choice: '多选题', true_false: '判断题', fill_blank: '填空题' }
  return map[currentQuestion.value?.type] || ''
})

const currentQuestion = computed(() => questions.value[currentIndex.value])
const isCurrentCorrect = computed(() => results.value[currentQuestion.value?.id])
const answeredCount = computed(() => Object.keys(answers.value).length)
const maxDistCount = computed(() => {
  if (!questionStats.value?.distribution.length) return 1
  return Math.max(...questionStats.value.distribution.map(d => d.count))
})

function optionValue(idx) { return String.fromCharCode(65 + idx) }
function barWidth(count) { return (count / maxDistCount.value * 100) + '%' }

// 单选/判断：点击即提交
async function quickAnswer(idx) {
  if (submitted.value) return
  const val = optionValue(idx)
  answers.value[currentQuestion.value.id] = val
  await submitAnswer()
  await fetchStats()
}

function toggleMultiSelect(val) {
  if (submitted.value) return
  const i = multiSelected.value.indexOf(val)
  if (i >= 0) multiSelected.value.splice(i, 1)
  else multiSelected.value.push(val)
}

async function submitMultiAnswer() {
  const sorted = [...multiSelected.value].sort().join(',')
  answers.value[currentQuestion.value.id] = sorted
  await submitAnswer()
  await fetchStats()
}

function submitFillAnswer() {
  if (!fillAnswer.value.trim()) return
  answers.value[currentQuestion.value.id] = fillAnswer.value.trim()
  submitAnswer()
  fetchStats()
}

async function submitAnswer() {
  const q = currentQuestion.value
  const userAnswer = answers.value[q.id]
  if (!userAnswer) { return }

  let correct = false
  if (q.type === 'multi_choice') {
    const sorted = userAnswer.split(',').sort().join(',')
    const correctSorted = q.answer.split(',').sort().join(',')
    correct = sorted === correctSorted
  } else if (q.type === 'fill_blank') {
    correct = userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim()
  } else {
    correct = userAnswer === q.answer
  }
  results.value[q.id] = correct
  submitted.value = true

  try {
    await api.submitRecord({
      question_id: q.id,
      user_answer: userAnswer,
      is_correct: correct,
      session_id: sessionId.value
    })
  } catch {}
}

async function fetchStats() {
  try {
    const res = await api.getQuestionStats(currentQuestion.value.id)
    questionStats.value = res.data
  } catch {}
}

async function toggleBookmark() {
  if (!submitted.value) return
  try {
    await api.toggleBookmark({
      question_id: currentQuestion.value.id,
      session_id: sessionId.value
    })
    if (bookmarkedSet.value.has(currentQuestion.value.id)) {
      bookmarkedSet.value.delete(currentQuestion.value.id)
    } else {
      bookmarkedSet.value.add(currentQuestion.value.id)
    }
  } catch {}
}

function goTo(idx) { currentIndex.value = idx; resetAnswerState() }
function prev() { if (currentIndex.value > 0) { currentIndex.value--; resetAnswerState() } }
function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    resetAnswerState()
  } else {
    finishQuiz()
  }
}

function resetAnswerState() {
  submitted.value = false
  fillAnswer.value = ''
  multiSelected.value = []
  questionStats.value = null
  autoAdvancing.value = false
}

function finishQuiz() {
  router.push({ name: 'Result', query: { session_id: sessionId.value } })
}

onMounted(async () => {
  try {
    const count = parseInt(route.query.count)
    const questionId = parseInt(route.query.question_id)
    if (questionId) {
      const res = await api.getQuestion(questionId)
      if (res.data) questions.value = [res.data]
    } else if (route.query.wrong) {
      const wrongRes = await api.getWrongQuestions()
      const ids = wrongRes.data.map(r => r.question_id)
      if (ids.length === 0) { alert('暂无错题'); router.push('/'); return }
      const allRes = await api.getQuestions()
      questions.value = allRes.data.filter(q => ids.includes(q.id))
    } else if (route.query.sequential) {
      const res = await api.getQuestions({ subject: route.query.subject || undefined })
      questions.value = res.data
    } else if (count > 0) {
      const res = await api.getRandomQuestions(count, route.query.subject)
      questions.value = res.data
    } else {
      const res = await api.getRandomQuestions(999, route.query.subject)
      questions.value = res.data
    }
  } catch {
    questions.value = []
  }
})
</script>

<style scoped>
.quiz-layout { display: flex; height: calc(100vh - 50px); }
.sidebar { width: 80px; background: #fff; border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1rem 0.75rem; flex-shrink: 0; overflow-y: auto; }
.sidebar-header { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
.progress-text { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.question-numbers { display: flex; flex-direction: column; gap: 0.35rem; align-items: center; }
.q-num { width: 36px; height: 36px; border: 1px solid var(--border); border-radius: 6px; background: #fff; font-size: 0.8rem; cursor: pointer; transition: all 0.1s; }
.q-num.active { border-color: var(--primary); background: var(--primary); color: #fff; }
.q-num.answered { border-color: var(--text-secondary); }
.q-num.correct { border-color: var(--success); background: #d4edda; color: var(--success); }
.q-num.wrong { border-color: var(--error); background: #f8d7da; color: var(--error); }
.quiz-main { flex: 1; display: flex; justify-content: center; padding: 2rem; overflow-y: auto; }
.quiz-card { background: #fff; border-radius: 12px; border: 1px solid var(--border); padding: 2rem; max-width: 640px; width: 100%; align-self: flex-start; }
.quiz-card.empty { display: flex; justify-content: center; align-items: center; min-height: 300px; }
.q-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.q-type { font-size: 0.75rem; background: var(--bg); padding: 0.2rem 0.6rem; border-radius: 4px; color: var(--text-secondary); }
.q-index { font-size: 0.85rem; color: var(--text-secondary); flex: 1; }
.btn-icon { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-secondary); }
.btn-icon.bookmarked { color: var(--warning); }
.q-text { font-size: 1.05rem; font-weight: 500; margin-bottom: 1.5rem; line-height: 1.6; }

.options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
.option { display: block; width: 100%; text-align: left; padding: 0.8rem 1rem; border: 2px solid var(--border); border-radius: 10px; background: #fff; font-size: 0.95rem; cursor: pointer; transition: all 0.15s; }
.option:hover:not(.disabled) { border-color: var(--primary); transform: translateX(3px); }
.option.selected { border-color: var(--primary); background: #e8f4fd; }
.option.correct { border-color: var(--success); background: #d4edda; }
.option.wrong { border-color: var(--error); background: #f8d7da; }
.option.disabled { cursor: default; opacity: 0.85; }

.fill-area { margin-bottom: 1rem; }
.fill-input { width: 100%; padding: 0.8rem; border: 2px solid var(--border); border-radius: 10px; font-size: 1rem; margin-bottom: 0.5rem; }
.fill-input:focus { outline: none; border-color: var(--primary); }

/* 反馈 */
.feedback { margin: 1rem 0; padding: 1rem; border-radius: 10px; background: var(--bg); }
.feedback-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.result-badge { font-weight: 700; font-size: 1rem; }
.result-badge.correct { color: var(--success); }
.result-badge.wrong { color: var(--error); }
.correct-answer { font-size: 0.9rem; color: var(--text-secondary); }
.explanation { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }

/* 全站统计 */
.global-stats { margin-top: 1rem; padding-top: 0.8rem; border-top: 1px solid var(--border); }
.stats-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.6rem; }
.stats-rate { color: var(--primary); font-weight: 600; }
.bar-chart { display: flex; flex-direction: column; gap: 0.35rem; }
.bar-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; }
.bar-label { width: 2rem; font-weight: 600; color: var(--text); flex-shrink: 0; }
.bar-track { flex: 1; height: 18px; background: #e8e8ec; border-radius: 9px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 9px; transition: width 0.5s ease; min-width: 4px; }
.bar-count { width: 3rem; text-align: right; color: var(--text-secondary); flex-shrink: 0; }

/* 底部导航 */
.q-footer { display: flex; justify-content: space-between; margin-top: 1.5rem; }
.next-bar { padding-top: 1rem; border-top: 1px solid var(--border); }
.btn-sm { padding: 0.4rem 1rem; font-size: 0.85rem; }
.btn-text { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; padding: 0.4rem 0.5rem; }
.btn-text:hover { color: var(--text); }
.btn-next { background: var(--primary); color: #fff; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: 500; transition: all 0.15s; }
.btn-next:hover { opacity: 0.85; transform: translateX(2px); }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* 手机端适配 */
@media (max-width: 640px) {
  .quiz-layout { flex-direction: column; height: auto; min-height: 100vh; }
  .sidebar { width: 100%; flex-direction: row; padding: 0.5rem 0.6rem; border-right: none; border-bottom: 1px solid var(--border); overflow-x: auto; }
  .sidebar-header { flex-direction: row; gap: 0.5rem; margin-bottom: 0; flex-shrink: 0; }
  .question-numbers { flex-direction: row; gap: 0.3rem; }
  .q-num { width: 32px; height: 32px; font-size: 0.75rem; flex-shrink: 0; }
  .quiz-main { padding: 0.6rem; }
  .quiz-card { padding: 1rem; }
  .q-text { font-size: 0.95rem; }
  .option { padding: 0.7rem 0.8rem; font-size: 0.9rem; }
  .q-header { flex-wrap: wrap; }
  .q-footer { flex-wrap: wrap; gap: 0.5rem; }
  .bar-chart { gap: 0.25rem; }
  .bar-item { font-size: 0.75rem; }
}
</style>
