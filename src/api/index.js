import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export default {
  // Auth
  register(username, password) { return api.post('/auth/register', { username, password }) },
  login(username, password) { return api.post('/auth/login', { username, password }) },
  getMe() { return api.get('/auth/me') },

  // Questions
  getQuestions(params) { return api.get('/questions', { params }) },
  getRandomQuestions(count, subject) {
    let url = `/questions/random?count=${count}`
    if (subject) url += `&subject=${encodeURIComponent(subject)}`
    return api.get(url)
  },
  getQuestion(id) { return api.get(`/questions/${id}`) },
  getQuestionStats(id) { return api.get(`/questions/${id}/stats`) },
  getSubjectQuestions(subject) { return api.get(`/questions/subject/${encodeURIComponent(subject)}/stats`) },
  createQuestion(data) { return api.post('/questions', data) },
  updateQuestion(id, data) { return api.put(`/questions/${id}`, data) },
  deleteQuestion(id) { return api.delete(`/questions/${id}`) },
  batchImportQuestions(questions) { return api.post('/questions/batch', { questions }) },
  getSubjects() { return api.get('/questions/subjects') },

  // Records
  submitRecord(data) { return api.post('/records', data) },
  getStats(sessionId) { return api.get(`/records/stats?session_id=${sessionId}`) },
  toggleBookmark(data) { return api.post('/records/bookmark', data) },
  getWrongQuestions() { return api.get('/records/wrong') },

  // Leaderboard
  getLeaderboard(type) { return api.get(`/leaderboard/${type}`) },

  // Feedback
  getFeedback() { return api.get('/feedback') },
  replyFeedback(id, reply) { return api.patch(`/feedback/${id}/reply`, { reply }) },

  // Admin
  getAdminUsers() { return api.get('/admin/users') },
  updateUserRole(id, role) { return api.patch(`/admin/users/${id}/role`, { role }) },
  deleteUser(id) { return api.delete(`/admin/users/${id}`) },
  getPendingQuestions() { return api.get('/admin/questions/pending') },
  updateQuestionStatus(id, status) { return api.patch(`/admin/questions/${id}/status`, { status }) },
  getAdminOverview() { return api.get('/admin/stats/overview') },
  getAllQuestions(params) { return api.get('/admin/questions/all', { params }) },
}
