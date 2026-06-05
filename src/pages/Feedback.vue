<template>
  <div class="feedback-page">
    <div class="page-header">
      <div class="container">
        <button class="back-btn" @click="$router.push('/')">← 返回首页</button>
        <h1>💬 意见反馈</h1>
        <p class="header-desc">帮助我们做得更好</p>
      </div>
    </div>

    <div class="container">
      <div class="feedback-form">
        <div class="form-group">
          <label>反馈内容</label>
          <textarea v-model="content" class="form-textarea" rows="5" placeholder="请输入您的意见、建议或遇到的问题..." maxlength="1000"></textarea>
          <span class="char-count">{{ content.length }}/1000</span>
        </div>

        <div class="form-group">
          <label>截图（选填，最多 5 张）</label>
          <div class="upload-area" @click="fileInput.click()">
            <span class="upload-icon">📷</span>
            <span>点击上传图片</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFileChange" />
          <div class="preview-list" v-if="previews.length">
            <div class="preview-item" v-for="(p, idx) in previews" :key="idx">
              <img :src="p.url" class="preview-img" />
              <button class="preview-del" @click="removeImage(idx)">×</button>
            </div>
          </div>
          <div class="upload-error" v-if="uploadError">{{ uploadError }}</div>
        </div>

        <Transition name="fade">
          <div class="success-msg" v-if="submitted">
            ✅ 感谢您的反馈！我们会尽快处理。
          </div>
        </Transition>

        <button class="submit-btn" @click="submit" :disabled="submitting || submitted">
          {{ submitting ? '提交中...' : submitted ? '已提交' : '提交反馈' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { auth } from '../stores/auth.js'

const content = ref('')
const files = ref([])
const previews = ref([])
const submitting = ref(false)
const submitted = ref(false)
const uploadError = ref('')
const fileInput = ref(null)

function onFileChange(e) {
  uploadError.value = ''
  const selected = Array.from(e.target.files || [])
  const remaining = 5 - files.value.length
  if (selected.length > remaining) {
    uploadError.value = `最多上传 5 张图，还能上传 ${remaining} 张`
    return
  }
  for (const f of selected) {
    if (f.size > 5 * 1024 * 1024) {
      uploadError.value = '每张图片不能超过 5MB'
      continue
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(f.type)) {
      uploadError.value = '仅支持 jpg、png、gif、webp 格式'
      continue
    }
    files.value.push(f)
    previews.value.push({ url: URL.createObjectURL(f), name: f.name })
  }
  fileInput.value.value = ''
}

function removeImage(idx) {
  URL.revokeObjectURL(previews.value[idx].url)
  files.value.splice(idx, 1)
  previews.value.splice(idx, 1)
}

async function submit() {
  if (!content.value.trim()) { alert('请输入反馈内容'); return }
  submitting.value = true
  try {
    const form = new FormData()
    form.append('content', content.value.trim())
    files.value.forEach(f => form.append('images', f))
    const token = auth.token
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: form
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
    submitted.value = true
  } catch (e) {
    alert('提交失败：' + e.message)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.feedback-page { padding-bottom: 3rem; }
.page-header { background: #fff; border-bottom: 1px solid var(--border); padding: 1.2rem 0; margin-bottom: 1.5rem; }
.page-header h1 { font-size: 1.3rem; font-weight: 700; }
.back-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.85rem; display: block; margin-bottom: 0.3rem; }
.back-btn:hover { color: var(--text); }
.header-desc { font-size: 0.85rem; color: var(--text-secondary); }

.feedback-form { background: #fff; border-radius: 14px; padding: 2rem; border: 1px solid var(--border); max-width: 600px; margin: 0 auto; }
.form-group { margin-bottom: 1.25rem; }
.form-group label { display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.4rem; }
.form-textarea { width: 100%; padding: 0.8rem; border: 2px solid var(--border); border-radius: 10px; font-size: 0.95rem; resize: vertical; font-family: inherit; }
.form-textarea:focus { outline: none; border-color: var(--primary); }
.char-count { float: right; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; }

.upload-area { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; border: 2px dashed var(--border); border-radius: 10px; cursor: pointer; color: var(--text-secondary); transition: all 0.15s; }
.upload-area:hover { border-color: var(--primary); color: var(--primary); }
.upload-icon { font-size: 1.3rem; }
.upload-error { font-size: 0.8rem; color: var(--error); margin-top: 0.3rem; }

.preview-list { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.preview-item { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.preview-del { position: absolute; top: 2px; right: 2px; width: 20px; height: 20px; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }

.submit-btn { width: 100%; padding: 0.85rem; border: none; border-radius: 10px; background: var(--primary); color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.success-msg { text-align: center; padding: 1rem; background: #d4edda; color: var(--success); border-radius: 10px; margin-bottom: 1rem; font-weight: 500; }
.fade-enter-active, .fade-leave-active { transition: all 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-5px); }

@media (max-width: 640px) {
  .feedback-form { padding: 1rem; }
  .form-textarea { font-size: 0.9rem; }
  .preview-item { width: 60px; height: 60px; }
}
</style>
