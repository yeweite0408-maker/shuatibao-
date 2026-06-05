# 📚 刷题宝

多科目在线刷题平台，支持单选题、多选题、判断题、填空题，含题库管理和答题统计。

## 技术栈

- **前端**: Vue 3 + Vite + Vue Router
- **后端**: Node.js + Express
- **数据库**: SQLite (sql.js)

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库 + 导入测试数据
npm run seed

# 3. 启动后端 (端口 3000)
npm run server

# 4. 新终端，启动前端 (端口 5173)
npm run dev
```

访问 http://localhost:5173

## 生产部署

```bash
# 1. 安装依赖 + 初始化数据 + 构建前端
npm run setup

# 2. 启动服务
npm start
```

访问 http://服务器IP:3000

### 使用 PM2 进程管理（推荐）

```bash
npm install -g pm2
pm2 start npm --name "shuati-bao" -- start
pm2 save
pm2 startup
```

### Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

## 端口

| 服务 | 环境变量 | 默认端口 |
|------|---------|---------|
| HTTP | `PORT` | 3000 |
