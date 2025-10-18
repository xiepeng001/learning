"""
Pydantic数据验证模型
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """用户角色枚举"""
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class DocumentVisibility(str, Enum):
    """文档可见性枚举"""
    PUBLIC = "public"
    TEAM = "team"
    PRIVATE = "private"

class Permission(str, Enum):
    """权限枚举"""
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"

# 用户相关schemas
class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=4, max_length=20, description="用户名")
    email: EmailStr = Field(..., description="邮箱地址")
    role: UserRole = Field(UserRole.VIEWER, description="用户角色")
    avatar_url: Optional[str] = Field(None, description="头像URL")

class UserCreate(UserBase):
    """用户创建模型"""
    password: str = Field(..., min_length=6, max_length=50, description="密码")

class UserUpdate(BaseModel):
    """用户更新模型"""
    username: Optional[str] = Field(None, min_length=4, max_length=20)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordChangeRequest(BaseModel):
    """密码修改请求模型"""
    current_password: str = Field(..., description="当前密码")
    new_password: str = Field(..., min_length=6, max_length=50, description="新密码")

class UserResponse(UserBase):
    """用户响应模型"""
    id: int
    is_active: bool
    last_login_at: Optional[str] = None  # 改为字符串类型
    created_at: str  # 改为字符串类型
    updated_at: str  # 改为字符串类型

    class Config:
        from_attributes = True

# 认证相关schemas
class LoginRequest(BaseModel):
    """登录请求模型"""
    email: EmailStr = Field(..., description="邮箱地址")
    password: str = Field(..., description="密码")

class TokenResponse(BaseModel):
    """Token响应模型"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

# 文档相关schemas
class DocumentBase(BaseModel):
    """文档基础模型"""
    title: str = Field(..., min_length=1, max_length=200, description="文档标题")
    description: Optional[str] = Field(None, description="文档描述")
    visibility: DocumentVisibility = Field(DocumentVisibility.TEAM, description="可见性")

class DocumentCreate(DocumentBase):
    """文档创建模型"""
    pass

class DocumentUpdate(BaseModel):
    """文档更新模型"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    visibility: Optional[DocumentVisibility] = None

class DocumentResponse(DocumentBase):
    """文档响应模型"""
    id: int
    file_name: str
    file_size: int
    file_type: str
    creator_id: int
    created_at: datetime
    updated_at: datetime
    tags: List["TagResponse"] = []

    class Config:
        from_attributes = True

# 标签相关schemas
class TagBase(BaseModel):
    """标签基础模型"""
    name: str = Field(..., min_length=1, max_length=50, description="标签名称")
    description: Optional[str] = Field(None, description="标签描述")
    color: str = Field("#1890ff", pattern=r"^#[0-9A-Fa-f]{6}$", description="标签颜色")

class TagCreate(TagBase):
    """标签创建模型"""
    pass

class TagUpdate(BaseModel):
    """标签更新模型"""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")

class TagResponse(TagBase):
    """标签响应模型"""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# 文档权限相关schemas
class DocumentPermissionBase(BaseModel):
    """文档权限基础模型"""
    user_id: int = Field(..., description="用户ID")
    permission: Permission = Field(..., description="权限类型")

class DocumentPermissionCreate(DocumentPermissionBase):
    """文档权限创建模型"""
    pass

class DocumentPermissionResponse(DocumentPermissionBase):
    """文档权限响应模型"""
    id: int
    document_id: int
    granted_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# 分页相关schemas
class PaginationParams(BaseModel):
    """分页参数模型"""
    page: int = Field(1, ge=1, description="页码")
    page_size: int = Field(20, ge=1, le=100, description="每页数量")

class PaginatedResponse(BaseModel):
    """分页响应模型"""
    items: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int

# 搜索相关schemas
class DocumentSearchParams(BaseModel):
    """文档搜索参数"""
    q: Optional[str] = Field(None, description="搜索关键词")
    tags: Optional[List[str]] = Field(None, description="标签过滤")
    visibility: Optional[DocumentVisibility] = Field(None, description="可见性过滤")
    creator_id: Optional[int] = Field(None, description="创建者过滤")

# 统计相关schemas
class StatsResponse(BaseModel):
    """统计信息响应模型"""
    total_documents: int
    total_users: int
    total_tags: int
    storage_used: int  # 字节

# 更新正向引用
DocumentResponse.model_rebuild()