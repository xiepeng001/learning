"""
标签管理路由
"""
from fastapi import APIRouter, HTTPException, status, Request, Depends
from typing import List, Optional

from src.types.schemas import TagResponse, TagCreate, TagUpdate, PaginatedResponse
from src.services.tag_service import TagService

tags_router = APIRouter()

def get_current_user(request: Request):
    """获取当前用户"""
    if not hasattr(request.state, 'current_user'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户未认证"
        )
    return request.state.current_user

def require_editor_or_admin(current_user: dict = Depends(get_current_user)):
    """要求编辑者或管理员权限"""
    if current_user.get("role") not in ["editor", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要编辑者或管理员权限"
        )
    return current_user

@tags_router.post("/", response_model=TagResponse)
async def create_tag(
    tag_data: TagCreate,
    current_user: dict = Depends(require_editor_or_admin)
):
    """创建新标签"""
    tag_service = TagService()

    try:
        tag = await tag_service.create_tag(tag_data)
        return TagResponse(**tag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"标签创建失败: {str(e)}"
        )

@tags_router.get("/", response_model=PaginatedResponse)
async def list_tags(
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """获取标签列表"""
    tag_service = TagService()
    result = await tag_service.list_tags(page, page_size)
    return PaginatedResponse(**result)

@tags_router.get("/search")
async def search_tags(
    q: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """搜索标签"""
    tag_service = TagService()
    tags = await tag_service.search_tags(q)
    return {"items": tags}

@tags_router.get("/popular")
async def get_popular_tags(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """获取热门标签"""
    tag_service = TagService()
    tags = await tag_service.get_popular_tags(limit)
    return {"items": tags}

@tags_router.get("/stats")
async def get_tag_stats(
    current_user: dict = Depends(get_current_user)
):
    """获取标签统计信息"""
    tag_service = TagService()
    stats = await tag_service.get_tag_stats()
    return stats

@tags_router.post("/batch")
async def batch_create_tags(
    tags_data: List[TagCreate],
    current_user: dict = Depends(require_editor_or_admin)
):
    """批量创建标签"""
    tag_service = TagService()

    try:
        created_tags = []
        for tag_data in tags_data:
            tag = await tag_service.create_tag(tag_data)
            created_tags.append(tag)
        return {"message": f"成功创建 {len(created_tags)} 个标签", "tags": created_tags}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"批量创建标签失败: {str(e)}"
        )

@tags_router.delete("/batch")
async def batch_delete_tags(
    tag_ids: List[int],
    current_user: dict = Depends(require_editor_or_admin)
):
    """批量删除标签"""
    tag_service = TagService()

    try:
        deleted_count = 0
        for tag_id in tag_ids:
            if await tag_service.delete_tag(tag_id):
                deleted_count += 1
        return {"message": f"成功删除 {deleted_count} 个标签"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"批量删除标签失败: {str(e)}"
        )

@tags_router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    current_user: dict = Depends(get_current_user)
):
    """获取指定标签"""
    tag_service = TagService()
    tag = await tag_service.get_tag_by_id(tag_id)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )

    return TagResponse(**tag)

@tags_router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    current_user: dict = Depends(require_editor_or_admin)
):
    """更新标签信息"""
    tag_service = TagService()

    try:
        updated_tag = await tag_service.update_tag(tag_id, tag_data)
        if not updated_tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="标签不存在"
            )
        return TagResponse(**updated_tag)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@tags_router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    current_user: dict = Depends(require_editor_or_admin)
):
    """删除标签"""
    tag_service = TagService()
    success = await tag_service.delete_tag(tag_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )

    return {"message": "标签删除成功"}