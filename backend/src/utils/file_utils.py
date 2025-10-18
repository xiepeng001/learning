"""
文件处理工具函数
"""
import os
import mimetypes
from pathlib import Path
from typing import Optional


def get_file_type(filename: str) -> str:
    """根据文件名获取文件类型"""
    mime_type, _ = mimetypes.guess_type(filename)
    if mime_type:
        return mime_type

    # 根据扩展名判断
    ext = Path(filename).suffix.lower()
    ext_mapping = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.md': 'text/markdown',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
    }
    return ext_mapping.get(ext, 'application/octet-stream')


def validate_file(filename: str, file_size: int, allowed_types: list, max_size: int) -> tuple[bool, str]:
    """验证文件是否符合要求"""
    # 检查文件类型
    file_type = get_file_type(filename)
    if file_type not in allowed_types:
        return False, f"不支持的文件类型: {file_type}"

    # 检查文件大小
    if file_size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        return False, f"文件大小超过限制，最大允许 {max_size_mb:.1f}MB"

    return True, "文件验证通过"


def get_safe_filename(filename: str) -> str:
    """获取安全的文件名"""
    # 移除不安全的字符
    safe_chars = "-_.() abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    safe_filename = ''.join(c for c in filename if c in safe_chars)

    # 确保文件名不为空
    if not safe_filename:
        safe_filename = "unnamed_file"

    return safe_filename


def format_file_size(size_bytes: int) -> str:
    """格式化文件大小显示"""
    if size_bytes == 0:
        return "0B"

    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1

    return f"{size_bytes:.1f}{size_names[i]}"


def get_file_extension(filename: str) -> str:
    """获取文件扩展名"""
    return Path(filename).suffix.lower()


def is_image_file(filename: str) -> bool:
    """判断是否为图片文件"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
    return get_file_extension(filename) in image_extensions


def is_document_file(filename: str) -> bool:
    """判断是否为文档文件"""
    doc_extensions = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'}
    return get_file_extension(filename) in doc_extensions