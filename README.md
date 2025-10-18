# 团队知识库管理工具

一个基于 Web 的团队知识库管理系统，支持文档上传、搜索、标签化管理和团队协作。

## 🚀 功能特性

### 核心功能
- **📁 文档管理**: 支持多种格式文档的上传、预览和管理
- **🔍 智能搜索**: 全文搜索和高级筛选功能
- **🏷️ 标签系统**: 灵活的文档标签化和分类管理
- **👥 用户管理**: 完整的用户注册、登录和角色管理
- **🔒 权限控制**: 细粒度的文档访问权限控制
- **💬 协作功能**: 文档评论、收藏和分享

### 技术特性
- **🏗️ 三层架构**: 前端 + API服务 + 数据库的清晰分层
- **📱 响应式设计**: 支持桌面和移动端访问
- **⚡ 高性能**: 优化的查询和文件处理
- **🔐 安全保障**: 完善的认证授权和数据保护

## 🛠️ 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit
- **UI组件**: Ant Design
- **构建工具**: Vite
- **路由**: React Router

### 后端
- **运行时**: Python 3.9+
- **框架**: FastAPI + Pydantic
- **数据库**: SQLite 3 (支持全文搜索)
- **认证**: JWT + PassLib (bcrypt)
- **文件处理**: aiofiles + python-magic

## 📁 项目结构

```
team-knowledge-base/
├── docs/                    # 项目文档
│   ├── 需求文档/             # 需求文档
│   ├── 架构设计/             # 架构设计
│   ├── API文档/             # API文档
│   └── 设计文档/             # 设计文档
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── store/          # 状态管理
│   │   └── utils/          # 工具函数
│   └── package.json
├── backend/                # 后端API服务
│   ├── src/
│   │   ├── routers/        # 路由处理器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── schemas/        # Pydantic模式
│   │   └── core/           # 核心配置
│   ├── requirements.txt
│   └── pyproject.toml
├── database/               # 数据库文件
└── README.md
```

## 🚦 快速开始

### 环境要求
- Python 3.9+
- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd team-knowledge-base
```

2. **安装后端依赖**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# 编辑 .env 文件配置环境变量
```

3. **初始化数据库**
```bash
python -m src.scripts.migrate
python -m src.scripts.seed
```

4. **启动后端服务**
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
# 后端服务运行在 http://localhost:8000
```

5. **安装前端依赖**
```bash
cd ../frontend
npm install
```

6. **启动前端应用**
```bash
npm run dev
# 前端应用运行在 http://localhost:3000
```

### 默认账户
- **管理员**: admin@example.com / admin123
- **编辑者**: editor@example.com / editor123
- **查看者**: viewer@example.com / viewer123

## 📖 使用指南

### 文档管理
1. 登录系统后，点击「上传文档」
2. 选择文件并填写标题和描述
3. 添加相关标签，设置可见性
4. 点击上传完成

### 搜索功能
1. 在搜索框输入关键词
2. 使用高级搜索筛选条件
3. 支持按标签、文件类型、作者等筛选

### 权限管理
1. 管理员可以管理所有用户和文档
2. 编辑者可以上传和编辑文档
3. 查看者只能查看有权限的文档

## 🔧 开发指南

### 后端开发
```bash
cd backend
uvicorn src.main:app --reload    # 开发模式
python -m pytest               # 运行测试
black src/ tests/              # 代码格式化
isort src/ tests/              # 导入排序
flake8 src/ tests/             # 代码检查
mypy src/                      # 类型检查
```

### 前端开发
```bash
cd frontend
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run lint         # 代码检查
npm run type-check   # 类型检查
```

### API测试
使用 Postman 或其他工具测试 API：
- API文档: `docs/API文档/API接口文档.md`
- 基础URL: `http://localhost:8000/api`

## 📊 数据库

项目使用 SQLite 数据库，包含以下主要表：
- `users` - 用户信息
- `documents` - 文档元数据
- `tags` - 标签管理
- `document_tags` - 文档标签关联
- `document_permissions` - 文档权限
- `access_logs` - 访问日志

详细设计见 `docs/设计文档/数据库设计文档.md`

## 🚀 部署

### 生产环境部署

1. **构建前端**
```bash
cd frontend
npm run build
```

2. **构建后端**
```bash
cd backend
npm run build
```

3. **部署配置**
```bash
# 使用 PM2 管理进程
npm install -g pm2
pm2 start dist/index.js --name "knowledge-base-api"

# 使用 Nginx 代理
# 配置文件参考 docs/deployment/nginx.conf
```

### Docker 部署
```bash
# TODO: 添加 Docker 配置
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 开发规范

### 代码风格
- 使用 ESLint 和 Prettier 保证代码风格统一
- 遵循 TypeScript 最佳实践
- 组件和函数使用有意义的命名

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建或依赖更新
```

## ⚠️ 注意事项

- 首次运行需要初始化数据库
- 确保 uploads 目录有写入权限
- 生产环境需要更改默认的 JWT 密钥
- 建议使用 HTTPS 部署

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 获取帮助

- 📖 查看文档: `docs/` 目录
- 🐛 报告问题: [GitHub Issues](issues)
- 💬 讨论交流: [Discussions](discussions)

---

**项目状态**: 🚧 开发中

**最后更新**: 2025-09-20