"""
数据库迁移脚本
"""
import asyncio
import sys
from pathlib import Path

# 添加src目录到Python路径
sys.path.append(str(Path(__file__).parent.parent))

from src.config.database import init_db

async def main():
    """运行数据库迁移"""
    print("开始初始化数据库...")
    try:
        await init_db()
        print("数据库初始化成功!")
    except Exception as e:
        print(f"数据库初始化失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())