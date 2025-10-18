"""
数据库配置和初始化
"""
import sqlite3
import aiosqlite
from pathlib import Path
from typing import Optional
import asyncio

from src.config.settings import settings

# 数据库文件路径
DB_PATH = Path("database/knowledge_base.db")

async def get_db_connection() -> aiosqlite.Connection:
    """获取数据库连接"""
    # 确保数据库目录存在
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = await aiosqlite.connect(str(DB_PATH))
    # 启用外键约束
    await conn.execute("PRAGMA foreign_keys = ON")
    # 设置row_factory以返回字典
    conn.row_factory = aiosqlite.Row
    await conn.commit()
    return conn

async def init_db():
    """初始化数据库表结构"""
    conn = await get_db_connection()

    try:
        # 创建用户表
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'viewer' NOT NULL,
                avatar_url VARCHAR(255) DEFAULT NULL,
                is_active BOOLEAN DEFAULT 1 NOT NULL,
                last_login_at DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT chk_role CHECK (role IN ('admin', 'editor', 'viewer')),
                CONSTRAINT chk_username_length CHECK (LENGTH(username) >= 4 AND LENGTH(username) <= 20),
                CONSTRAINT chk_email_format CHECK (email LIKE '%@%.%')
            );
        """)

        # 创建文档表
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                file_path VARCHAR(500) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size INTEGER NOT NULL,
                file_type VARCHAR(100) NOT NULL,
                visibility VARCHAR(20) DEFAULT 'team' NOT NULL,
                creator_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT chk_visibility CHECK (visibility IN ('public', 'team', 'private')),
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 创建标签表
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                color VARCHAR(7) DEFAULT '#1890ff',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT chk_tag_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 50)
            );
        """)

        # 创建文档标签关联表
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS document_tags (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                tag_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
                UNIQUE(document_id, tag_id)
            );
        """)

        # 创建文档权限表
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS document_permissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                permission VARCHAR(20) NOT NULL,
                granted_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT chk_permission CHECK (permission IN ('read', 'write', 'admin')),
                FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (granted_by) REFERENCES users(id),
                UNIQUE(document_id, user_id)
            );
        """)

        # 创建操作日志表
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS operation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                operation VARCHAR(50) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                resource_id INTEGER,
                details TEXT,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # 创建索引
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_creator ON documents(creator_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_document_tags_document ON document_tags(document_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at DESC);")

        await conn.commit()
        print("数据库初始化完成")

    except Exception as e:
        print(f"数据库初始化失败: {e}")
        raise
    finally:
        await conn.close()


class DatabaseManager:
    """数据库管理器"""

    def __init__(self):
        self.db_path = DB_PATH

    async def execute_query(self, query: str, params: tuple = (), fetch_one: bool = False, fetch_all: bool = False):
        """执行SQL查询"""
        conn = await get_db_connection()
        try:
            cursor = await conn.execute(query, params)
            await conn.commit()

            if fetch_one:
                result = await cursor.fetchone()
                if result:
                    # aiosqlite.Row 可以直接转换为字典
                    return dict(result)
                return None
            elif fetch_all:
                results = await cursor.fetchall()
                if results:
                    # 将每个 aiosqlite.Row 转换为字典
                    return [dict(row) for row in results]
                return []
            else:
                return cursor.lastrowid
        finally:
            await conn.close()

# 全局数据库管理器实例
db_manager = DatabaseManager()