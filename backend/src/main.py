"""
团队知识库管理工具 - FastAPI主应用
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
from pathlib import Path
import traceback

from src.config.database import init_db
from src.config.settings import settings
from src.routes.auth import auth_router
from src.routes.documents import documents_router
from src.routes.tags import tags_router
from src.routes.users import users_router
from src.middleware.auth import auth_middleware

def create_app() -> FastAPI:
    """创建FastAPI应用实例"""
    app = FastAPI(
        title="团队知识库管理工具",
        description="基于FastAPI的团队文档管理和知识共享平台",
        version="1.0.0",
        docs_url="/api/docs" if settings.DEBUG else None,
        redoc_url="/api/redoc" if settings.DEBUG else None,
    )

    # CORS中间件配置
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )

    # 全局异常处理
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        error_msg = f"全局异常捕获: {exc}\n异常类型: {type(exc)}\n异常堆栈: {traceback.format_exc()}"
        print(error_msg)

        # 写入错误日志文件
        with open("error.log", "a", encoding="utf-8") as f:
            f.write(f"\n=== {request.method} {request.url} ===\n")
            f.write(error_msg + "\n")

        return JSONResponse(
            status_code=500,
            content={"detail": f"内部服务器错误: {str(exc)}"}
        )

    # 认证中间件 - 修复版本
    @app.middleware("http")
    async def auth_middleware_wrapper(request: Request, call_next):
        print(f"AUTH_DEBUG: Processing request: {request.method} {request.url.path}")
        response = await auth_middleware(request, call_next)
        print(f"AUTH_DEBUG: Request completed: {request.url.path}")
        return response

    # 注册路由
    app.include_router(auth_router, prefix="/api/auth", tags=["认证"])
    app.include_router(users_router, prefix="/api/users", tags=["用户管理"])
    app.include_router(documents_router, prefix="/api/documents", tags=["文档管理"])
    app.include_router(tags_router, prefix="/api/tags", tags=["标签管理"])

    # 静态文件服务 (文件上传)
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

    return app

# 创建应用实例
app = create_app()

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    await init_db()

@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "团队知识库管理工具 API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }