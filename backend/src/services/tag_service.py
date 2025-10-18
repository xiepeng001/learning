"""
标签业务逻辑服务
"""
from typing import Optional, List, Dict, Any

from src.config.database import db_manager
from src.types.schemas import TagCreate, TagUpdate

class TagService:
    """标签服务类"""

    async def create_tag(self, tag_data: TagCreate) -> Dict[str, Any]:
        """创建新标签"""
        # 检查标签名是否已存在
        existing_tag = await self.get_tag_by_name(tag_data.name)
        if existing_tag:
            raise ValueError("标签名称已存在")

        # 插入标签数据
        query = """
            INSERT INTO tags (name, description, color)
            VALUES (?, ?, ?)
        """
        tag_id = await db_manager.execute_query(
            query,
            (tag_data.name, tag_data.description, tag_data.color)
        )

        return await self.get_tag_by_id(tag_id)

    async def get_tag_by_id(self, tag_id: int) -> Optional[Dict[str, Any]]:
        """根据ID获取标签"""
        query = "SELECT * FROM tags WHERE id = ?"
        return await db_manager.execute_query(query, (tag_id,), fetch_one=True)

    async def get_tag_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """根据名称获取标签"""
        query = "SELECT * FROM tags WHERE name = ?"
        return await db_manager.execute_query(query, (name,), fetch_one=True)

    async def update_tag(self, tag_id: int, tag_data: TagUpdate) -> Optional[Dict[str, Any]]:
        """更新标签信息"""
        # 构建更新字段
        update_fields = []
        params = []

        if tag_data.name is not None:
            # 检查标签名是否已被其他标签使用
            existing = await self.get_tag_by_name(tag_data.name)
            if existing and existing["id"] != tag_id:
                raise ValueError("标签名称已存在")
            update_fields.append("name = ?")
            params.append(tag_data.name)

        if tag_data.description is not None:
            update_fields.append("description = ?")
            params.append(tag_data.description)

        if tag_data.color is not None:
            update_fields.append("color = ?")
            params.append(tag_data.color)

        if not update_fields:
            return await self.get_tag_by_id(tag_id)

        params.append(tag_id)

        query = f"UPDATE tags SET {', '.join(update_fields)} WHERE id = ?"
        await db_manager.execute_query(query, tuple(params))

        return await self.get_tag_by_id(tag_id)

    async def delete_tag(self, tag_id: int) -> bool:
        """删除标签"""
        query = "DELETE FROM tags WHERE id = ?"
        result = await db_manager.execute_query(query, (tag_id,))
        return result is not None

    async def list_tags(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """获取标签列表"""
        offset = (page - 1) * page_size

        # 获取总数
        count_query = "SELECT COUNT(*) as total FROM tags"
        total_result = await db_manager.execute_query(count_query, fetch_one=True)
        total = total_result["total"] if total_result else 0

        # 获取标签列表
        query = """
            SELECT t.*, COUNT(dt.document_id) as document_count
            FROM tags t
            LEFT JOIN document_tags dt ON t.id = dt.tag_id
            GROUP BY t.id
            ORDER BY t.name
            LIMIT ? OFFSET ?
        """
        tags = await db_manager.execute_query(query, (page_size, offset), fetch_all=True)

        return {
            "items": tags,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }

    async def search_tags(self, q: Optional[str] = None) -> List[Dict[str, Any]]:
        """搜索标签"""
        if q:
            query = """
                SELECT t.*, COUNT(dt.document_id) as document_count
                FROM tags t
                LEFT JOIN document_tags dt ON t.id = dt.tag_id
                WHERE t.name LIKE ?
                GROUP BY t.id
                ORDER BY t.name
                LIMIT 50
            """
            return await db_manager.execute_query(query, (f"%{q}%",), fetch_all=True)
        else:
            query = """
                SELECT t.*, COUNT(dt.document_id) as document_count
                FROM tags t
                LEFT JOIN document_tags dt ON t.id = dt.tag_id
                GROUP BY t.id
                ORDER BY t.name
                LIMIT 50
            """
            return await db_manager.execute_query(query, fetch_all=True)

    async def get_popular_tags(self, limit: int = 10) -> List[Dict[str, Any]]:
        """获取热门标签"""
        query = """
            SELECT t.*, COUNT(dt.document_id) as document_count
            FROM tags t
            JOIN document_tags dt ON t.id = dt.tag_id
            GROUP BY t.id
            ORDER BY document_count DESC, t.name
            LIMIT ?
        """
        return await db_manager.execute_query(query, (limit,), fetch_all=True)

    async def get_tag_stats(self) -> Dict[str, Any]:
        """获取标签统计信息"""
        # 总标签数
        total_query = "SELECT COUNT(*) as total FROM tags"
        total_result = await db_manager.execute_query(total_query, fetch_one=True)
        total_tags = total_result["total"] if total_result else 0

        # 已使用标签数（有关联文档的标签）
        used_query = """
            SELECT COUNT(DISTINCT t.id) as used
            FROM tags t
            JOIN document_tags dt ON t.id = dt.tag_id
        """
        used_result = await db_manager.execute_query(used_query, fetch_one=True)
        used_tags = used_result["used"] if used_result else 0

        # 平均每个标签的文档数
        avg_query = """
            SELECT AVG(doc_count) as avg_docs
            FROM (
                SELECT COUNT(dt.document_id) as doc_count
                FROM tags t
                LEFT JOIN document_tags dt ON t.id = dt.tag_id
                GROUP BY t.id
            )
        """
        avg_result = await db_manager.execute_query(avg_query, fetch_one=True)
        avg_docs = round(avg_result["avg_docs"], 2) if avg_result and avg_result["avg_docs"] else 0

        return {
            "total_tags": total_tags,
            "used_tags": used_tags,
            "unused_tags": total_tags - used_tags,
            "average_documents_per_tag": avg_docs
        }