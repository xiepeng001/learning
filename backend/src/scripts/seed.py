"""
数据库种子数据脚本
"""
import asyncio
import sys
from pathlib import Path

# 添加src目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from src.config.database import db_manager
from src.utils.auth import get_password_hash

async def seed_users():
    """创建默认用户"""
    print("创建默认用户...")

    users = [
        {
            "username": "admin",
            "email": "admin@example.com",
            "password": "admin123",
            "role": "admin"
        },
        {
            "username": "editor",
            "email": "editor@example.com",
            "password": "editor123",
            "role": "editor"
        },
        {
            "username": "viewer",
            "email": "viewer@example.com",
            "password": "viewer123",
            "role": "viewer"
        }
    ]

    for user in users:
        # 检查用户是否已存在
        existing_query = "SELECT id FROM users WHERE email = ?"
        existing = await db_manager.execute_query(existing_query, (user["email"],), fetch_one=True)

        if not existing:
            password_hash = get_password_hash(user["password"])
            insert_query = """
                INSERT INTO users (username, email, password_hash, role)
                VALUES (?, ?, ?, ?)
            """
            await db_manager.execute_query(
                insert_query,
                (user["username"], user["email"], password_hash, user["role"])
            )
            print(f"创建用户: {user['username']} ({user['email']})")
        else:
            print(f"用户已存在: {user['username']} ({user['email']})")

async def seed_tags():
    """创建默认标签"""
    print("创建默认标签...")

    tags = [
        {"name": "技术文档", "description": "技术相关的文档资料", "color": "#1890ff"},
        {"name": "产品需求", "description": "产品需求文档", "color": "#52c41a"},
        {"name": "会议纪要", "description": "会议记录和纪要", "color": "#faad14"},
        {"name": "培训资料", "description": "培训和学习资料", "color": "#eb2f96"},
        {"name": "流程规范", "description": "工作流程和规范文档", "color": "#722ed1"},
        {"name": "项目管理", "description": "项目管理相关文档", "color": "#fa541c"},
    ]

    for tag in tags:
        # 检查标签是否已存在
        existing_query = "SELECT id FROM tags WHERE name = ?"
        existing = await db_manager.execute_query(existing_query, (tag["name"],), fetch_one=True)

        if not existing:
            insert_query = """
                INSERT INTO tags (name, description, color)
                VALUES (?, ?, ?)
            """
            await db_manager.execute_query(
                insert_query,
                (tag["name"], tag["description"], tag["color"])
            )
            print(f"创建标签: {tag['name']}")
        else:
            print(f"标签已存在: {tag['name']}")

async def main():
    """运行种子数据创建"""
    print("开始创建种子数据...")
    try:
        await seed_users()
        await seed_tags()
        print("种子数据创建完成!")
        print("\n默认用户账号:")
        print("管理员: admin@example.com / admin123")
        print("编辑者: editor@example.com / editor123")
        print("查看者: viewer@example.com / viewer123")
    except Exception as e:
        print(f"种子数据创建失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())