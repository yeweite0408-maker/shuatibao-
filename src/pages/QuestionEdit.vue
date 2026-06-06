<template>
  <div class="container">
    <div class="edit-card">
      <h2>{{ isEdit ? '编辑题目' : '新增题目' }}</h2>

      <div class="form-group">
        <label>题型</label>
        <select v-model="form.type" class="form-input">
          <option value="single_choice">单选题</option>
          <option value="multi_choice">多选题</option>
          <option value="true_false">判断题</option>
          <option value="fill_blank">填空题</option>
        </select>
      </div>

      <div class="form-group">
        <label>科目</label>
        <input v-model="form.subject" class="form-input" placeholder="如：ECharts、JavaScript、数学..." />
      </div>

      <div class="form-group">
        <label>题目内容</label>
        <textarea v-model="form.question" class="form-input" rows="3" placeholder="请输入题目"></textarea>
      </div>

      <div class="form-group" v-if="form.type !== 'fill_blank'">
        <label>选项（每行一个，如：A. 选项内容）</label>
        <textarea v-model="optionsText" class="form-input" rows="4" placeholder="A. 选项1&#10;B. 选项2&#10;C. 选项3&#10;D. 选项4"></textarea>
      </div>

      <div class="form-group">
        <label>正确答案</label>
        <input v-model="form.answer" class="form-input" :placeholder="answerPlaceholder" />
        <span class="form-hint" v-if="form.type === 'single_choice'">填写正确选项字母，如：A</span>
        <span class="form-hint" v-else-if="form.type === 'multi_choice'">填写正确选项字母，用逗号分隔，如：A,B,C</span>
        <span class="form-hint" v-else-if="form.type === 'true_false'">A 表示正确，B 表示错误</span>
        <span class="form-hint" v-else-if="form.type === 'fill_blank'">填写正确答案文本</span>
      </div>

      <div class="form-group">
        <label>答案解析（选填）</label>
        <textarea v-model="form.explanation" class="form-input" rows="2" placeholder="解析内容"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-primary" @click="save">{{ isEdit ? '保存修改' : '添加题目' }}</button>
        <button class="btn btn-secondary" @click="router.push('/admin')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/index.js'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const form = ref({ subject: '', type: 'single_choice', question: '', answer: '', explanation: '' })
const optionsText = ref('')

const answerPlaceholder = computed(() => {
  const map = {
    single_choice: '填写正确选项字母，如：A',
    multi_choice: '填写正确选项字母，用逗号分隔，如：A,B,C',
    true_false: 'A 表示正确，B 表示错误',
    fill_blank: '填写正确答案文本'
  }
  return map[form.value.type] || ''
})

onMounted(async () => {
  if (isEdit.value) {
    try {
      const res = await api.getQuestion(route.params.id)
      const q = res.data
      form.value = { subject: q.subject || '', type: q.type, question: q.question, answer: q.answer, explanation: q.explanation || '' }
      if (q.options) optionsText.value = q.options.join('\n')
    } catch { router.push('/admin') }
  }
})

async function save() {
  if (!form.value.question || !form.value.answer) {
    alert('请填写题目内容及答案')
    return
  }
  const data = { ...form.value }
  if (data.type !== 'fill_blank') {
    data.options = optionsText.value.split('\n').filter(s => s.trim())
  }

  try {
    if (isEdit.value) {
      await api.updateQuestion(route.params.id, data)
    } else {
      await api.createQuestion(data)
    }
    router.push('/admin')
  } catch (e) {
    alert('保存失败：' + (e.response?.data?.error || e.message))
  }
}
</script>

<style scoped>
.edit-card { max-width: 640px; margin: 2rem auto; background: var(--card); border-radius: 12px; padding: 2rem; border: 1px solid var(--border); }
.edit-card h2 { font-size: 1.3rem; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 0.4rem; }
.form-input { width: 100%; padding: 0.7rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.9rem; font-family: inherit; }
.form-input:focus { outline: none; border-color: var(--primary); }
select.form-input { background: var(--card); }
textarea.form-input { resize: vertical; }
.form-hint { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; }
.form-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
</style>
