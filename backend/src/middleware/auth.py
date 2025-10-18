"""
认证中间件
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional

from src.utils.auth import verify_token, extract_token_from_header
from src.services.user_service import UserService

# 不需要认证的路径
EXEMPT_PATHS = [
    "/",
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/docs",
    "/api/redoc",
    "/uploads"
]

async def auth_middleware(request: Request, call_next):
    """认证中间件"""
    path = request.url.path

    # 检查是否为豁免路径
    # 根路径需要完全匹配，其他路径用前缀匹配
    if path == "/" or any(path.startswith(exempt_path) for exempt_path in EXEMPT_PATHS[1:]):
        return await call_next(request)

    # 提取Authorization头
    authorization = request.headers.get("Authorization")
    print(f"DEBUG: Authorization header: {authorization}")
    if not authorization:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "未提供认证令牌"}
        )

    # 提取令牌
    token = extract_token_from_header(authorization)
    print(f"DEBUG: Extracted token: {token[:50] if token else None}...")
    if not token:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "令牌格式错误"}
        )

    # 验证令牌
    payload = verify_token(token)
    print(f"DEBUG: Token payload: {payload}")
    if not payload:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "令牌无效或已过期"}
        )

    # 获取用户信息
    user_id = payload.get("sub")
    print(f"DEBUG: User ID from token: {user_id}")
    if not user_id:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "令牌中缺少用户信息"}
        )

    try:
        user_service = UserService()
        user = await user_service.get_user_by_id(int(user_id))
        print(f"DEBUG: User lookup result: {user}")
        if not user or not user.get("is_active"):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "用户不存在或已被禁用"}
            )

        # 将用户信息添加到请求状态
        request.state.current_user = user
        print(f"DEBUG: Authentication successful for user: {user.get('username')}")
    except Exception as e:
        print(f"DEBUG: Exception in auth middleware: {e}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"认证过程中发生错误: {str(e)}"}
        )

    return await call_next(request)