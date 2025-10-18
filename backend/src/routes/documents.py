"""
文档管理路由
"""
import os
from fastapi import APIRouter, HTTPException, status, Request, Depends, UploadFile, File, Form
from typing import List, Optional

from src.types.schemas import (
    DocumentResponse, DocumentCreate, DocumentUpdate, PaginatedResponse,
    DocumentSearchParams
)
from src.services.document_service import DocumentService
from src.config.settings import settings

documents_router = APIRouter()

def get_current_user(request: Request):
    """获取当前用户"""
    print(f"DEBUG: get_current_user called")
    print(f"DEBUG: request.state attributes: {dir(request.state)}")
    print(f"DEBUG: hasattr current_user: {hasattr(request.state, 'current_user')}")
    if hasattr(request.state, 'current_user'):
        print(f"DEBUG: current_user value: {request.state.current_user}")

    if not hasattr(request.state, 'current_user') or not request.state.current_user:
        print(f"DEBUG: Authentication failed - no current_user in request.state")
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

@documents_router.post("/", response_model=DocumentResponse)
async def create_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    visibility: str = Form("team"),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_editor_or_admin)
):
    """创建新文档"""
    # 验证文件类型
    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件类型: {file.content_type}"
        )

    # 验证文件大小
    file_content = await file.read()
    if len(file_content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"文件大小超过限制: {settings.MAX_FILE_SIZE} bytes"
        )

    document_service = DocumentService()

    try:
        document = await document_service.create_document(
            title=title,
            description=description,
            visibility=visibility,
            creator_id=current_user["id"],
            file_name=file.filename,
            file_content=file_content,
            file_type=file.content_type
        )
        return DocumentResponse(**document)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档创建失败: {str(e)}"
        )

@documents_router.get("/test-auth")
async def test_auth(request: Request):
    """测试认证中间件"""
    print(f"DEBUG: Test auth endpoint called")
    print(f"DEBUG: request.state attributes: {dir(request.state)}")

    if hasattr(request.state, 'current_user'):
        print(f"DEBUG: current_user exists: {request.state.current_user}")
        return {"message": "Authentication working", "user": request.state.current_user}
    else:
        print(f"DEBUG: No current_user in request.state")
        return {"message": "No user in request.state", "state_attrs": str(dir(request.state))}

@documents_router.get("/stats")
async def get_document_stats(
    current_user: dict = Depends(get_current_user)
):
    """获取文档统计信息"""
    document_service = DocumentService()
    stats = await document_service.get_document_stats(current_user["id"])
    return stats

@documents_router.get("/", response_model=PaginatedResponse)
async def search_documents(
    q: Optional[str] = None,
    tags: Optional[str] = None,
    visibility: Optional[str] = None,
    creator_id: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """搜索文档"""
    print(f"DEBUG: Route called with current_user: {current_user}")
    # 解析标签参数
    tag_list = tags.split(",") if tags else None

    document_service = DocumentService()
    result = await document_service.search_documents(
        user_id=current_user["id"],
        q=q,
        tags=tag_list,
        visibility=visibility,
        creator_id=creator_id,
        page=page,
        page_size=page_size
    )

    return PaginatedResponse(**result)

@documents_router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: dict = Depends(get_current_user)
):
    """获取指定文档"""
    document_service = DocumentService()
    document = await document_service.get_document_by_id(document_id, current_user["id"])

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在或无访问权限"
        )

    return DocumentResponse(**document)

@documents_router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    document_data: DocumentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """更新文档信息"""
    document_service = DocumentService()

    try:
        updated_document = await document_service.update_document(
            document_id=document_id,
            title=document_data.title,
            description=document_data.description,
            visibility=document_data.visibility,
            user_id=current_user["id"]
        )

        if not updated_document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="文档不存在或无编辑权限"
            )

        return DocumentResponse(**updated_document)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文档更新失败: {str(e)}"
        )

@documents_router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: dict = Depends(get_current_user)
):
    """删除文档"""
    document_service = DocumentService()
    success = await document_service.delete_document(document_id, current_user["id"])

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在或无删除权限"
        )

    return {"message": "文档删除成功"}

@documents_router.post("/{document_id}/tags/{tag_id}")
async def add_document_tag(
    document_id: int,
    tag_id: int,
    current_user: dict = Depends(get_current_user)
):
    """为文档添加标签"""
    document_service = DocumentService()

    # 检查文档写入权限
    if not await document_service._check_document_write_access(document_id, current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限编辑此文档"
        )

    success = await document_service.add_document_tag(document_id, tag_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="添加标签失败"
        )

    return {"message": "标签添加成功"}

@documents_router.delete("/{document_id}/tags/{tag_id}")
async def remove_document_tag(
    document_id: int,
    tag_id: int,
    current_user: dict = Depends(get_current_user)
):
    """从文档移除标签"""
    document_service = DocumentService()

    # 检查文档写入权限
    if not await document_service._check_document_write_access(document_id, current_user["id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限编辑此文档"
        )

    success = await document_service.remove_document_tag(document_id, tag_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="移除标签失败"
        )

    return {"message": "标签移除成功"}

@documents_router.get("/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: dict = Depends(get_current_user)
):
    """下载文档"""
    document_service = DocumentService()
    document = await document_service.get_document_by_id(document_id, current_user["id"])

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文档不存在或无访问权限"
        )

    file_path = document["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="文件不存在"
        )

    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        filename=document["file_name"],
        media_type='application/octet-stream'
    )