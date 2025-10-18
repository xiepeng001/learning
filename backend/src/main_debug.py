"""
调试版本的main.py - 用于测试JWT认证中间件
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config.database import init_db
from src.config.settings import settings
from src.routes.auth import auth_router
from src.routes.documents import documents_router
from src.middleware.auth import auth_middleware

app = FastAPI(
    title="团队知识库管理工具 - 调试版",
    description="用于调试JWT认证中间件",
    version="1.0.0-debug",
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 调试模式允许所有来源
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# 认证中间件 - 简化版本
@app.middleware("http")
async def debug_auth_middleware(request: Request, call_next):
    print(f"DEBUG: Middleware called for path: {request.url.path}")
    print(f"DEBUG: Request method: {request.method}")
    print(f"DEBUG: Request headers: {dict(request.headers)}")

    # 调用原始认证中间件
    response = await auth_middleware(request, call_next)

    print(f"DEBUG: Middleware completed for path: {request.url.path}")
    return response

# 注册路由
app.include_router(auth_router, prefix="/api/auth", tags=["认证"])
app.include_router(documents_router, prefix="/api/documents", tags=["文档管理"])

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    print("DEBUG: Starting application...")
    await init_db()
    print("DEBUG: Database initialized")

@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "团队知识库管理工具 API - 调试版",
        "version": "1.0.0-debug",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "debug": True
    }