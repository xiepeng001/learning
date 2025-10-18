"""
文档业务逻辑服务
"""
from typing import Optional, List, Dict, Any
from pathlib import Path
import os
import aiofiles
from datetime import datetime

from src.config.database import db_manager
from src.config.settings import settings

class DocumentService:
    """文档服务类"""

    async def create_document(
        self,
        title: str,
        description: Optional[str],
        visibility: str,
        creator_id: int,
        file_name: str,
        file_content: bytes,
        file_type: str
    ) -> Dict[str, Any]:
        """创建新文档"""
        # 生成文件路径
        file_size = len(file_content)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file_name}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        # 确保上传目录存在
        Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

        # 保存文件
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)

        # 插入文档记录
        query = """
            INSERT INTO documents (title, description, file_path, file_name, file_size, file_type, visibility, creator_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        document_id = await db_manager.execute_query(
            query,
            (title, description, file_path, file_name, file_size, file_type, visibility, creator_id)
        )

        return await self.get_document_by_id(document_id)

    async def get_document_by_id(self, document_id: int, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """根据ID获取文档"""
        query = """
            SELECT d.*, u.username as creator_name
            FROM documents d
            LEFT JOIN users u ON d.creator_id = u.id
            WHERE d.id = ?
        """
        document = await db_manager.execute_query(query, (document_id,), fetch_one=True)

        if not document:
            return None

        # 检查权限
        if user_id and not await self._check_document_access(document_id, user_id):
            return None

        # 获取文档标签
        document["tags"] = await self.get_document_tags(document_id)
        return document

    async def update_document(
        self,
        document_id: int,
        title: Optional[str] = None,
        description: Optional[str] = None,
        visibility: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """更新文档信息"""
        # 检查文档是否存在和权限
        if user_id and not await self._check_document_write_access(document_id, user_id):
            return None

        # 构建更新字段
        update_fields = []
        params = []

        if title is not None:
            update_fields.append("title = ?")
            params.append(title)

        if description is not None:
            update_fields.append("description = ?")
            params.append(description)

        if visibility is not None:
            update_fields.append("visibility = ?")
            params.append(visibility)

        if not update_fields:
            return await self.get_document_by_id(document_id)

        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(document_id)

        query = f"UPDATE documents SET {', '.join(update_fields)} WHERE id = ?"
        await db_manager.execute_query(query, tuple(params))

        return await self.get_document_by_id(document_id)

    async def delete_document(self, document_id: int, user_id: Optional[int] = None) -> bool:
        """删除文档"""
        # 获取文档信息
        document = await self.get_document_by_id(document_id)
        if not document:
            return False

        # 检查权限
        if user_id and not await self._check_document_write_access(document_id, user_id):
            return False

        # 删除文件
        file_path = document["file_path"]
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"删除文件失败: {e}")

        # 删除数据库记录
        query = "DELETE FROM documents WHERE id = ?"
        result = await db_manager.execute_query(query, (document_id,))
        return result is not None

    async def search_documents(
        self,
        user_id: int,
        q: Optional[str] = None,
        tags: Optional[List[str]] = None,
        visibility: Optional[str] = None,
        creator_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """搜索文档"""
        offset = (page - 1) * page_size

        # 构建WHERE条件
        where_conditions = []
        params = []

        # 添加可见性权限检查
        visibility_condition = """
            (d.visibility = 'public' OR
             d.creator_id = ? OR
             EXISTS (SELECT 1 FROM document_permissions dp WHERE dp.document_id = d.id AND dp.user_id = ?))
        """
        where_conditions.append(visibility_condition)
        params.extend([user_id, user_id])

        # 标题搜索
        if q:
            where_conditions.append("d.title LIKE ?")
            params.append(f"%{q}%")

        # 可见性过滤
        if visibility:
            where_conditions.append("d.visibility = ?")
            params.append(visibility)

        # 创建者过滤
        if creator_id:
            where_conditions.append("d.creator_id = ?")
            params.append(creator_id)

        # 标签过滤
        if tags:
            tag_placeholders = ",".join("?" * len(tags))
            where_conditions.append(f"""
                EXISTS (
                    SELECT 1 FROM document_tags dt
                    JOIN tags t ON dt.tag_id = t.id
                    WHERE dt.document_id = d.id AND t.name IN ({tag_placeholders})
                )
            """)
            params.extend(tags)

        where_clause = " AND ".join(where_conditions)

        # 获取总数
        count_query = f"""
            SELECT COUNT(DISTINCT d.id) as total
            FROM documents d
            LEFT JOIN users u ON d.creator_id = u.id
            WHERE {where_clause}
        """
        total_result = await db_manager.execute_query(count_query, tuple(params), fetch_one=True)
        total = total_result["total"] if total_result else 0

        # 获取文档列表
        query = f"""
            SELECT DISTINCT d.*, u.username as creator_name
            FROM documents d
            LEFT JOIN users u ON d.creator_id = u.id
            WHERE {where_clause}
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
        """
        documents = await db_manager.execute_query(
            query, tuple(params + [page_size, offset]), fetch_all=True
        )

        # 为每个文档获取标签
        for doc in documents:
            doc["tags"] = await self.get_document_tags(doc["id"])

        return {
            "items": documents,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def get_document_tags(self, document_id: int) -> List[Dict[str, Any]]:
        """获取文档标签"""
        query = """
            SELECT t.id, t.name, t.description, t.color, t.created_at
            FROM tags t
            JOIN document_tags dt ON t.id = dt.tag_id
            WHERE dt.document_id = ?
            ORDER BY t.name
        """
        return await db_manager.execute_query(query, (document_id,), fetch_all=True)

    async def add_document_tag(self, document_id: int, tag_id: int) -> bool:
        """为文档添加标签"""
        query = """
            INSERT OR IGNORE INTO document_tags (document_id, tag_id)
            VALUES (?, ?)
        """
        result = await db_manager.execute_query(query, (document_id, tag_id))
        return result is not None

    async def remove_document_tag(self, document_id: int, tag_id: int) -> bool:
        """从文档移除标签"""
        query = "DELETE FROM document_tags WHERE document_id = ? AND tag_id = ?"
        result = await db_manager.execute_query(query, (document_id, tag_id))
        return result is not None

    async def _check_document_access(self, document_id: int, user_id: int) -> bool:
        """检查用户是否有文档访问权限"""
        query = """
            SELECT 1 FROM documents d
            WHERE d.id = ? AND (
                d.visibility = 'public' OR
                d.creator_id = ? OR
                EXISTS (
                    SELECT 1 FROM document_permissions dp
                    WHERE dp.document_id = d.id AND dp.user_id = ?
                )
            )
        """
        result = await db_manager.execute_query(query, (document_id, user_id, user_id), fetch_one=True)
        return result is not None

    async def _check_document_write_access(self, document_id: int, user_id: int) -> bool:
        """检查用户是否有文档写入权限"""
        # 获取用户角色
        user_query = "SELECT role FROM users WHERE id = ?"
        user = await db_manager.execute_query(user_query, (user_id,), fetch_one=True)
        if not user:
            return False

        # 管理员有所有权限
        if user["role"] == "admin":
            return True

        # 检查是否为文档创建者或有写入权限
        query = """
            SELECT 1 FROM documents d
            WHERE d.id = ? AND (
                d.creator_id = ? OR
                EXISTS (
                    SELECT 1 FROM document_permissions dp
                    WHERE dp.document_id = d.id AND dp.user_id = ? AND dp.permission IN ('write', 'admin')
                )
            )
        """
        result = await db_manager.execute_query(query, (document_id, user_id, user_id), fetch_one=True)
        return result is not None
    async def get_document_stats(self, user_id: int) -> Dict[str, Any]:
        """获取文档统计信息"""
        # 总文档数（用户可见的）
        total_query = """
            SELECT COUNT(*) as total FROM documents d
            WHERE d.visibility = 'public'
               OR d.visibility = 'team'
               OR d.creator_id = ?
               OR EXISTS (
                   SELECT 1 FROM document_permissions dp
                   WHERE dp.document_id = d.id AND dp.user_id = ? AND dp.permission IN ('read', 'write', 'admin')
               )
        """
        total_result = await db_manager.execute_query(total_query, (user_id, user_id), fetch_one=True)
        total_documents = total_result["total"] if total_result else 0

        # 我的文档数
        my_query = """
            SELECT COUNT(*) as my_count FROM documents d
            WHERE d.creator_id = ?
        """
        my_result = await db_manager.execute_query(my_query, (user_id,), fetch_one=True)
        my_documents = my_result["my_count"] if my_result else 0

        return {
            "total_documents": total_documents,
            "my_documents": my_documents
        }

