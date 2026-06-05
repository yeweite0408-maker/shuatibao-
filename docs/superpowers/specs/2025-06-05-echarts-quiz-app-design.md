# ECharts 刷题网页 — 设计文档

## 概述
基于 Vue 3 + Node.js + SQLite 的刷题网页，题库为 ECharts 可视化知识，支持多种题型，开箱即用无需登录。

## 技术栈
- **前端**: Vue 3 + Vite + Vue Router
- **后端**: Node.js + Express + better-sqlite3
- **数据库**: SQLite（文件型，无需安装服务端）

## 页面结构
1. **首页** — 选择刷题数量（随机10题/20题/全部），展示上次练习记录，快速入口到题库管理
2. **刷题页** — 左侧题号导航区（对/错/未答颜色区分），右侧题目+选项，提交答案后显示对错与正确答案，底部上/下一题导航
3. **结果页** — 正确率统计、正确/错误/收藏数量卡片、错题回顾列表、再来一轮/查看错题/返回首页
4. **题库管理** — 题目列表+搜索，新增/编辑/删除题目

## 题型
- 单选题（single_choice）
- 多选题（multi_choice）
- 判断题（true_false）
- 填空题（fill_blank）

## 数据库表结构

### questions 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| type | TEXT | 题型：single_choice / multi_choice / true_false / fill_blank |
| question | TEXT | 题目内容 |
| options | TEXT | JSON数组，选择题的选项列表 |
| answer | TEXT | 正确答案 |
| explanation | TEXT | 答案解析 |
| created_at | DATETIME | 创建时间 |

### records 表（刷题记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PK | 自增主键 |
| question_id | INTEGER | 题目ID |
| user_answer | TEXT | 用户答案 |
| is_correct | INTEGER | 是否正确 (0/1) |
| is_bookmarked | INTEGER | 是否收藏 (0/1) |
| session_id | TEXT | 本次刷题会话ID |
| created_at | DATETIME | 答题时间 |

## API 接口
- `GET /api/questions` — 获取题目列表
- `GET /api/questions/random?count=N` — 随机抽取N题
- `POST /api/questions` — 新增题目
- `PUT /api/questions/:id` — 编辑题目
- `DELETE /api/questions/:id` — 删除题目
- `POST /api/records` — 提交答题记录
- `GET /api/records/stats` — 获取统计
- `POST /api/records/bookmark` — 收藏/取消收藏

## 前端路由
- `/` — 首页
- `/quiz?count=N` — 刷题页面
- `/result?session=xxx` — 结果页
- `/admin` — 题库管理
- `/admin/edit/:id` — 编辑题目
