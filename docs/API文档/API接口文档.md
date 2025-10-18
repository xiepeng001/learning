# API 接口文档

## 基本信息

- **基础URL**: `http://localhost:8000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`
- **时间格式**: ISO 8601 (`2025-09-20T10:30:00Z`)

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}  // 详细错误信息，可选
  }
}
```

### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [],  // 数据列表
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## 1. 认证接口

### 1.1 用户注册
```
POST /auth/register
```

**请求体**:
```json
{
  "username": "string",      // 4-20字符
  "email": "string",         // 邮箱格式
  "password": "string"       // 8-50字符
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "viewer",
      "isActive": true,
      "createdAt": "2025-09-20T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 用户登录
```
POST /auth/login
```

**请求体**:
```json
{
  "usernameOrEmail": "string",  // 用户名或邮箱
  "password": "string"
}
```

**响应**: 同注册接口

### 1.3 刷新Token
```
POST /auth/refresh
```

**Headers**: `Authorization: Bearer <refresh_token>`

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "refreshToken": "new_refresh_token"
  }
}
```

## 2. 文档管理接口

### 2.1 获取文档列表
```
GET /documents?page=1&size=20&search=keyword&visibility=all&tags=tag1,tag2
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `size`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词（标题搜索）
- `visibility`: 可见性筛选 (public|team|private|all)
- `tags`: 标签筛选 (逗号分隔的标签ID)
- `authorId`: 作者ID筛选
- `mimeType`: 文件类型筛选

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "项目文档",
        "filename": "project.pdf",
        "originalFilename": "项目文档.pdf",
        "fileSize": 1024000,
        "mimeType": "application/pdf",
        "description": "项目相关文档",
        "visibility": "team",
        "viewCount": 15,
        "downloadCount": 5,
        "author": {
          "id": 1,
          "username": "john_doe"
        },
        "tags": [
          {"id": 1, "name": "项目", "color": "#1890ff"}
        ],
        "createdAt": "2025-09-20T10:00:00Z",
        "updatedAt": "2025-09-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

### 2.2 上传文档
```
POST /documents
```

**请求类型**: `multipart/form-data`

**表单字段**:
- `file`: 文件 (必需，最大10MB)
- `title`: 标题 (可选，默认使用文件名)
- `description`: 描述 (可选)
- `visibility`: 可见性 (public|team|private，默认: team)
- `tagIds`: 标签ID数组，JSON字符串 (可选，如: "[1,2,3]")

**响应**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": 1,
      "title": "新文档",
      "filename": "document_uuid.pdf",
      "originalFilename": "文档.pdf",
      "filePath": "/uploads/2025/09/20/document_uuid.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "fileHash": "abc123def456...",
      "description": "文档描述",
      "visibility": "team",
      "viewCount": 0,
      "downloadCount": 0,
      "authorId": 1,
      "createdAt": "2025-09-20T10:00:00Z",
      "updatedAt": "2025-09-20T10:00:00Z"
    }
  }
}
```

### 2.3 获取文档详情
```
GET /documents/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": 1,
      "title": "项目文档",
      "filename": "project.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "description": "项目相关文档",
      "visibility": "team",
      "content": "文档提取的文本内容...",
      "author": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com"
      },
      "tags": [
        {"id": 1, "name": "项目", "color": "#1890ff"}
      ],
      "permissions": ["read", "write"],
      "createdAt": "2025-09-20T10:00:00Z",
      "updatedAt": "2025-09-20T10:00:00Z"
    }
  }
}
```

### 2.4 更新文档信息
```
PUT /documents/:id
```

**请求体**:
```json
{
  "title": "string",
  "description": "string",
  "visibility": "public|team|private",
  "tags": [1, 2, 3]
}
```

### 2.5 删除文档
```
DELETE /documents/:id
```

### 2.6 下载文档
```
GET /documents/:id/download
```

**响应**: 文件流

## 3. 搜索接口

### 3.1 全文搜索
```
GET /search?q=keyword&tags=tag1,tag2&type=pdf&author=1&page=1&limit=20
```

**查询参数**:
- `q`: 搜索关键词 (必需)
- `tags`: 标签筛选 (可选)
- `type`: 文件类型筛选 (可选)
- `author`: 作者筛选 (可选)
- `visibility`: 可见性筛选 (可选)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "document": {
          "id": 1,
          "title": "项目文档",
          "filename": "project.pdf",
          "description": "项目相关文档",
          "author": {"id": 1, "username": "john_doe"},
          "tags": [{"id": 1, "name": "项目"}],
          "createdAt": "2025-09-20T10:00:00Z"
        },
        "highlights": [
          "这是一个关于<em>关键词</em>的文档...",
          "另一个包含<em>关键词</em>的段落..."
        ],
        "score": 0.85
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    },
    "queryTime": 120
  }
}
```

## 4. 标签管理接口

### 4.1 获取所有标签
```
GET /tags
```

**响应**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "项目",
        "color": "#1890ff",
        "documentCount": 5,
        "createdAt": "2025-09-20T10:00:00Z"
      }
    ]
  }
}
```

### 4.2 创建标签
```
POST /tags
```

**请求体**:
```json
{
  "name": "string",
  "color": "#1890ff"
}
```

### 4.3 更新标签
```
PUT /tags/:id
```

**请求体**:
```json
{
  "name": "string",
  "color": "#1890ff"
}
```

### 4.4 删除标签
```
DELETE /tags/:id
```

## 5. 用户管理接口

### 5.1 获取用户信息
```
GET /users/profile
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "editor",
      "createdAt": "2025-09-20T10:00:00Z",
      "stats": {
        "documentsUploaded": 10,
        "documentsViewed": 50,
        "storageUsed": 10485760
      }
    }
  }
}
```

### 5.2 更新用户信息
```
PUT /users/profile
```

**请求体**:
```json
{
  "username": "string",
  "email": "string"
}
```

### 5.3 修改密码
```
POST /users/change-password
```

**请求体**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

## 6. 权限管理接口

### 6.1 获取文档权限列表
```
GET /documents/:id/permissions
```

### 6.2 添加文档权限
```
POST /documents/:id/permissions
```

**请求体**:
```json
{
  "userId": 2,
  "permission": "read|write|admin"
}
```

### 6.3 删除文档权限
```
DELETE /documents/:id/permissions/:userId
```

## 7. 统计接口

### 7.1 获取仪表板统计
```
GET /stats/dashboard
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalDocuments": 100,
    "totalUsers": 25,
    "totalTags": 15,
    "storageUsed": 104857600,
    "recentDocuments": [...],
    "popularTags": [...],
    "activeUsers": [...]
  }
}
```

## 错误代码

| 代码 | 说明 |
|------|------|
| INVALID_CREDENTIALS | 无效的认证信息 |
| TOKEN_EXPIRED | Token已过期 |
| TOKEN_INVALID | Token无效或格式错误 |
| INSUFFICIENT_PERMISSIONS | 权限不足 |
| USER_NOT_FOUND | 用户不存在 |
| USERNAME_EXISTS | 用户名已存在 |
| EMAIL_EXISTS | 邮箱已存在 |
| DOCUMENT_NOT_FOUND | 文档不存在 |
| FILE_TOO_LARGE | 文件过大 |
| INVALID_FILE_TYPE | 不支持的文件类型 |
| UPLOAD_FAILED | 文件上传失败 |
| TAG_NOT_FOUND | 标签不存在 |
| TAG_NAME_EXISTS | 标签名已存在 |
| VALIDATION_ERROR | 参数验证失败 |
| INTERNAL_ERROR | 服务器内部错误 |
| RESOURCE_NOT_FOUND | 资源不存在 |

## HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复创建） |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

---

**文档版本**: v1.0
**创建日期**: 2025-09-20
**最后更新**: 2025-09-20