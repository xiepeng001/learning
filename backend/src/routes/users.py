"""
用户管理路由
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import List

from src.types.schemas import UserResponse, UserUpdate, UserCreate, PaginatedResponse, PaginationParams, PasswordChangeRequest
from src.services.user_service import UserService

users_router = APIRouter()

def get_current_user(request: Request):
    """获取当前用户"""
    if not hasattr(request.state, 'current_user'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户未认证"
        )
    return request.state.current_user

def require_admin(current_user: dict = Depends(get_current_user)):
    """要求管理员权限"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user

@users_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    return UserResponse(**current_user)

@users_router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """更新当前用户信息"""
    user_service = UserService()

    try:
        # 普通用户不能修改角色和激活状态
        if user_data.role is not None and current_user.get("role") != "admin":
            user_data.role = None
        if user_data.is_active is not None and current_user.get("role") != "admin":
            user_data.is_active = None

        updated_user = await user_service.update_user(current_user["id"], user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        return UserResponse(**updated_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@users_router.put("/me/password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: dict = Depends(get_current_user)
):
    """修改当前用户密码"""
    user_service = UserService()

    try:
        success = await user_service.change_password(
            current_user["id"],
            password_data.current_password,
            password_data.new_password
        )
        if success:
            return {"message": "密码修改成功"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="密码修改失败"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@users_router.get("/stats")
async def get_user_stats(
    admin_user: dict = Depends(require_admin)
):
    """获取用户统计信息（仅管理员）"""
    user_service = UserService()
    stats = await user_service.get_user_stats()
    return stats

@users_router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    admin_user: dict = Depends(require_admin)
):
    """创建新用户（仅管理员）"""
    user_service = UserService()

    try:
        new_user = await user_service.create_user(user_data)
        return UserResponse(**new_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"用户创建失败: {str(e)}"
        )

@users_router.get("/", response_model=PaginatedResponse)
async def list_users(
    page: int = 1,
    page_size: int = 20,
    admin_user: dict = Depends(require_admin)
):
    """获取用户列表（仅管理员）"""
    user_service = UserService()
    result = await user_service.list_users(page, page_size)
    return PaginatedResponse(**result)

@users_router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    admin_user: dict = Depends(require_admin)
):
    """获取指定用户信息（仅管理员）"""
    user_service = UserService()
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return UserResponse(**user)

@users_router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    admin_user: dict = Depends(require_admin)
):
    """更新指定用户信息（仅管理员）"""
    user_service = UserService()

    try:
        updated_user = await user_service.update_user(user_id, user_data)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )
        return UserResponse(**updated_user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@users_router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    admin_user: dict = Depends(require_admin)
):
    """删除用户（仅管理员）"""
    # 不能删除自己
    if user_id == admin_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账户"
        )

    user_service = UserService()
    success = await user_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    return {"message": "用户删除成功"}