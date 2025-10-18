"""
数据模型定义
"""
from typing import Optional, List
from datetime import datetime
from dataclasses import dataclass

@dataclass
class User:
    """用户模型"""
    id: Optional[int] = None
    username: str = ""
    email: str = ""
    password_hash: str = ""
    role: str = "viewer"  # admin, editor, viewer
    avatar_url: Optional[str] = None
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class Document:
    """文档模型"""
    id: Optional[int] = None
    title: str = ""
    description: Optional[str] = None
    file_path: str = ""
    file_name: str = ""
    file_size: int = 0
    file_type: str = ""
    visibility: str = "team"  # public, team, private
    creator_id: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class Tag:
    """标签模型"""
    id: Optional[int] = None
    name: str = ""
    description: Optional[str] = None
    color: str = "#1890ff"
    created_at: Optional[datetime] = None

@dataclass
class DocumentTag:
    """文档标签关联模型"""
    id: Optional[int] = None
    document_id: int = 0
    tag_id: int = 0
    created_at: Optional[datetime] = None

@dataclass
class DocumentPermission:
    """文档权限模型"""
    id: Optional[int] = None
    document_id: int = 0
    user_id: int = 0
    permission: str = "read"  # read, write, admin
    granted_by: int = 0
    created_at: Optional[datetime] = None

@dataclass
class OperationLog:
    """操作日志模型"""
    id: Optional[int] = None
    user_id: Optional[int] = None
    operation: str = ""
    resource_type: str = ""
    resource_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None