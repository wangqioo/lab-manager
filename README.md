# 实验室测试申请管理系统

> 南昌航空大学 · 杨丽霞课题组

一套面向课题组内部使用的测试申请与费用管理 Web 系统。学生在线提交测试申请，教师审批并追踪费用，管理员负责账户与系统维护。

---

## 功能概览

### 学生端
- 注册（推荐使用学号）并登录
- 提交测试申请：选择测试类型（EPR、IR、BET、Raman 等）、填写样品信息、预计费用、紧急程度
- 查看申请状态（待审批 / 已批准 / 已拒绝 / 已完成）
- 申请批准后填写实际发生费用
- 查看个人费用统计

### 教师端
- 查看所有学生的申请，一键批准或填写意见拒绝
- 每条审批记录自动标注审批人姓名
- 费用统计（支持按学生 / 年度 / 测试项目多维度汇总，含图表展示）
- 账户管理：查看、删除学生账户及其申请记录

### 管理员端
- 系统概览：用户数、申请数、费用总计、数据库状态等实时指标
- 教师管理：添加 / 删除教师账户

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Recharts |
| 后端 | Node.js + Express |
| 数据库 | SQLite（`better-sqlite3`） |
| 认证 | JWT（30 天有效期）+ bcryptjs |
| 部署 | Docker（单容器，Express 同时服务 API 和静态文件） |

---

## 快速部署

### 前提条件

- 已安装 Docker

### 使用 Docker 运行

```bash
# 克隆仓库
git clone <repo-url>
cd lab-manager

# 构建镜像
docker build -t lab-manager .

# 启动容器（数据持久化到 lab_data 卷）
docker run -d \
  --name lab-manager \
  -p 8089:3000 \
  -v lab_data:/data \
  --restart unless-stopped \
  lab-manager
```

访问 `http://<服务器IP>:8089` 即可使用。

### 本地开发

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd backend && npm install && cd ..

# 启动后端（端口 3000）
cd backend && node server.js &

# 启动前端开发服务器（端口 5173，自动代理 /api 到后端）
npm run dev
```

---

## 默认账户

系统首次启动时自动创建以下账户：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `152535` |
| 教师 | `陈政霖` | `13870655072` |
| 教师 | `杨丽霞` | `15979119610` |

> 学生账户通过注册页面自行创建，推荐使用学号作为用户名。

---

## 数据持久化

数据库文件存储于 `/data/lab.db`，通过 Docker volume `lab_data` 挂载，容器重启或更新镜像后数据不丢失。

---

## 目录结构

```
lab-manager/
├── backend/
│   ├── db.js          # 数据库初始化、迁移、种子数据
│   ├── server.js      # Express API 路由
│   └── package.json
├── src/
│   ├── components/    # 各角色界面组件
│   ├── context/       # 全局状态（AppContext）
│   ├── utils/api.js   # 前端 API 封装
│   └── App.jsx        # 路由入口
├── Dockerfile
├── vite.config.js
└── package.json
```

---

## 许可

仅供课题组内部使用。
