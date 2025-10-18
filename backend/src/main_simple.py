"""
简化版主应用用于调试
"""
from fastapi import FastAPI

def create_app() -> FastAPI:
    """创建简化的FastAPI应用实例"""
    app = FastAPI(
        title="测试应用",
        description="用于调试的简化版本",
        version="1.0.0",
    )

    @app.get("/")
    async def root():
        return {"message": "简化版应用正常运行"}

    @app.post("/api/test-login")
    async def test_login():
        return {"message": "测试登录端点"}

    return app

# 创建应用实例
app = create_app()