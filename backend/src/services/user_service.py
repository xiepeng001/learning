"""
用户业务逻辑服务
"""
from typing import Optional, List, Dict, Any
from datetime import datetime

from src.config.database import db_manager
from src.utils.auth import get_password_hash, verify_password
from src.types.schemas import UserCreate, UserUpdate

class UserService:
    """用户服务类"""

    async def create_user(self, user_data: UserCreate) -> Dict[str, Any]:
        """创建新用户"""
        # 检查用户名和邮箱是否已存在
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("邮箱地址已被使用")

        existing_username = await self.get_user_by_username(user_data.username)
        if existing_username:
            raise ValueError("用户名已被使用")

        # 加密密码
        password_hash = get_password_hash(user_data.password)

        # 插入用户数据
        query = """
            INSERT INTO users (username, email, password_hash, role, avatar_url)
            VALUES (?, ?, ?, ?, ?)
        """
        user_id = await db_manager.execute_query(
            query,
            (user_data.username, user_data.email, password_hash, user_data.role, user_data.avatar_url)
        )

        # 返回创建的用户信息
        return await self.get_user_by_id(user_id)

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取用户"""
        query = """
            SELECT id, username, email, role, avatar_url, is_active,
                   last_login_at, created_at, updated_at
            FROM users WHERE id = ?
        """
        return await db_manager.execute_query(query, (user_id,), fetch_one=True)

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """根据邮箱获取用户"""
        query = """
            SELECT id, username, email, password_hash, role, avatar_url, is_active,
                   last_login_at, created_at, updated_at
            FROM users WHERE email = ?
        """
        return await db_manager.execute_query(query, (email,), fetch_one=True)

    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """根据用户名获取用户"""
        query = """
            SELECT id, username, email, role, avatar_url, is_active,
                   last_login_at, created_at, updated_at
            FROM users WHERE username = ?
        """
        return await db_manager.execute_query(query, (username,), fetch_one=True)

    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """用户认证"""
        user = await self.get_user_by_email(email)
        if not user or not user.get("is_active"):
            return None

        if not verify_password(password, user["password_hash"]):
            return None

        # 更新最后登录时间
        await self.update_last_login(user["id"])

        # 移除密码哈希字段
        user_data = {k: v for k, v in user.items() if k != "password_hash"}
        return user_data

    async def update_last_login(self, user_id: int) -> None:
        """更新用户最后登录时间"""
        query = "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?"
        await db_manager.execute_query(query, (user_id,))

    async def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[Dict[str, Any]]:
        """更新用户信息"""
        # 构建更新字段
        update_fields = []
        params = []

        if user_data.username is not None:
            # 检查用户名是否已被其他用户使用
            existing = await self.get_user_by_username(user_data.username)
            if existing and existing["id"] != user_id:
                raise ValueError("用户名已被使用")
            update_fields.append("username = ?")
            params.append(user_data.username)

        if user_data.email is not None:
            # 检查邮箱是否已被其他用户使用
            existing = await self.get_user_by_email(user_data.email)
            if existing and existing["id"] != user_id:
                raise ValueError("邮箱地址已被使用")
            update_fields.append("email = ?")
            params.append(user_data.email)

        if user_data.role is not None:
            update_fields.append("role = ?")
            params.append(user_data.role)

        if user_data.avatar_url is not None:
            update_fields.append("avatar_url = ?")
            params.append(user_data.avatar_url)

        if user_data.is_active is not None:
            update_fields.append("is_active = ?")
            params.append(user_data.is_active)

        if not update_fields:
            return await self.get_user_by_id(user_id)

        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(user_id)

        query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?"
        await db_manager.execute_query(query, tuple(params))

        return await self.get_user_by_id(user_id)

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> bool:
        """修改用户密码"""
        # 先获取用户的当前密码哈希
        user = await self.get_user_by_email_with_password(user_id)
        if not user:
            raise ValueError("用户不存在")

        # 验证当前密码
        if not verify_password(current_password, user["password_hash"]):
            raise ValueError("当前密码错误")

        # 加密新密码
        new_password_hash = get_password_hash(new_password)

        # 更新密码
        query = "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        await db_manager.execute_query(query, (new_password_hash, user_id))
        return True

    async def get_user_by_email_with_password(self, user_id: int) -> Optional[Dict[str, Any]]:
        """根据用户ID获取包含密码哈希的用户信息"""
        query = """
            SELECT id, username, email, password_hash, role, avatar_url, is_active,
                   last_login_at, created_at, updated_at
            FROM users WHERE id = ?
        """
        return await db_manager.execute_query(query, (user_id,), fetch_one=True)

    async def delete_user(self, user_id: int) -> bool:
        """删除用户"""
        query = "DELETE FROM users WHERE id = ?"
        result = await db_manager.execute_query(query, (user_id,))
        return result is not None

    async def list_users(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """获取用户列表"""
        offset = (page - 1) * page_size

        # 获取总数
        count_query = "SELECT COUNT(*) as total FROM users"
        total_result = await db_manager.execute_query(count_query, fetch_one=True)
        total = total_result["total"] if total_result else 0

        # 获取用户列表
        query = """
            SELECT id, username, email, role, avatar_url, is_active,
                   last_login_at, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        users = await db_manager.execute_query(query, (page_size, offset), fetch_all=True)

        return {
            "items": users,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def get_user_stats(self) -> Dict[str, Any]:
        """获取用户统计信息"""
        # 总用户数
        total_query = "SELECT COUNT(*) as total FROM users"
        total_result = await db_manager.execute_query(total_query, fetch_one=True)
        total_users = total_result["total"] if total_result else 0

        # 活跃用户数
        active_query = "SELECT COUNT(*) as active FROM users WHERE is_active = 1"
        active_result = await db_manager.execute_query(active_query, fetch_one=True)
        active_users = active_result["active"] if active_result else 0

        # 各角色用户数
        role_query = """
            SELECT role, COUNT(*) as count
            FROM users
            GROUP BY role
        """
        role_stats = await db_manager.execute_query(role_query, fetch_all=True)

        role_counts = {
            "admin": 0,
            "editor": 0,
            "viewer": 0
        }
        for role_stat in role_stats:
            role_counts[role_stat["role"]] = role_stat["count"]

        # 最近7天新注册用户数
        recent_query = """
            SELECT COUNT(*) as recent
            FROM users
            WHERE created_at >= datetime('now', '-7 days')
        """
        recent_result = await db_manager.execute_query(recent_query, fetch_one=True)
        recent_users = recent_result["recent"] if recent_result else 0

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "recent_users": recent_users,
            "role_stats": role_counts
        }