"""
认证路由
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta

from src.types.schemas import LoginRequest, TokenResponse, UserCreate, UserResponse
from src.services.user_service import UserService
from src.utils.auth import create_access_token
from src.config.settings import settings

auth_router = APIRouter()

@auth_router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """用户登录"""
    user_service = UserService()

    # 认证用户
    user = await user_service.authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["id"]), "email": user["email"], "role": user["role"]},
        expires_delta=access_token_expires
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**user)
    )

@auth_router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """用户注册"""
    user_service = UserService()

    try:
        user = await user_service.create_user(user_data)
        return UserResponse(**user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@auth_router.post("/logout")
async def logout():
    """用户登出"""
    # 由于使用JWT令牌，登出在客户端完成
    # 这个接口主要用于记录日志或其他清理工作
    return {"message": "登出成功"}