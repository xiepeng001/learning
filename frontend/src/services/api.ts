import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  Document,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentSearchParams,
  Tag,
  TagCreateRequest,
  TagUpdateRequest,
  UserUpdateRequest,
  PaginatedResponse,
} from '../types'

// API 基础配置 - 使用相对路径让所有请求走代理
const API_BASE_URL = ''

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器 - 添加认证 token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器 - 统一错误处理
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response.data
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token 过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          window.location.href = '/login'
        }

        const message =
          error.response?.data?.detail ||
          error.message ||
          '请求失败'

        return Promise.reject(new Error(message))
      }
    )
  }

  // 通用请求方法
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.api.request<T>(config)
    return response as T
  }
}

// 认证相关 API
class AuthAPI extends ApiService {
  async login(data: LoginRequest): Promise<TokenResponse> {
    return this.request<TokenResponse>({
      method: 'POST',
      url: '/api/auth/login',
      data,
    })
  }

  async register(data: RegisterRequest): Promise<User> {
    return this.request<User>({
      method: 'POST',
      url: '/api/auth/register',
      data,
    })
  }

  async logout(): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: '/api/auth/logout',
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>({
      method: 'GET',
      url: '/api/users/me',
    })
  }
}

// 文档相关 API
class DocumentsAPI extends ApiService {
  async searchDocuments(params: DocumentSearchParams): Promise<PaginatedResponse<Document>> {
    return this.request<PaginatedResponse<Document>>({
      method: 'GET',
      url: '/api/documents/',
      params,
    })
  }

  async getDocument(id: number): Promise<Document> {
    return this.request<Document>({
      method: 'GET',
      url: `/api/documents/${id}`,
    })
  }

  async createDocument(data: DocumentCreateRequest): Promise<Document> {
    const formData = new FormData()
    formData.append('title', data.title)
    formData.append('visibility', data.visibility)
    if (data.description) {
      formData.append('description', data.description)
    }
    formData.append('file', data.file)

    return this.request<Document>({
      method: 'POST',
      url: '/api/documents/',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  async updateDocument(id: number, data: DocumentUpdateRequest): Promise<Document> {
    return this.request<Document>({
      method: 'PUT',
      url: `/api/documents/${id}`,
      data,
    })
  }

  async deleteDocument(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/documents/${id}`,
    })
  }

  async addDocumentTag(documentId: number, tagId: number): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: `/api/documents/${documentId}/tags/${tagId}`,
    })
  }

  async removeDocumentTag(documentId: number, tagId: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/documents/${documentId}/tags/${tagId}`,
    })
  }

  async getDocumentStats(): Promise<{ total_documents: number; my_documents: number }> {
    return this.request<{ total_documents: number; my_documents: number }>({
      method: 'GET',
      url: '/api/documents/stats',
    })
  }

  async downloadDocument(documentId: number): Promise<Blob> {
    const response = await this.api.request({
      method: 'GET',
      url: `/api/documents/${documentId}/download`,
      responseType: 'blob',
    })
    return response as Blob
  }
}

// 标签相关 API
class TagsAPI extends ApiService {
  async getTags(page = 1, pageSize = 20): Promise<PaginatedResponse<Tag>> {
    return this.request<PaginatedResponse<Tag>>({
      method: 'GET',
      url: '/api/tags/',
      params: { page, page_size: pageSize },
    })
  }

  async getTag(id: number): Promise<Tag> {
    return this.request<Tag>({
      method: 'GET',
      url: `/api/tags/${id}`,
    })
  }

  async searchTags(q?: string): Promise<{ items: Tag[] }> {
    return this.request<{ items: Tag[] }>({
      method: 'GET',
      url: '/api/tags/search',
      params: { q },
    })
  }

  async getPopularTags(limit = 10): Promise<{ items: Tag[] }> {
    return this.request<{ items: Tag[] }>({
      method: 'GET',
      url: '/api/tags/popular',
      params: { limit },
    })
  }

  async getTagStats(): Promise<{
    total_tags: number
    used_tags: number
    unused_tags: number
    average_documents_per_tag: number
  }> {
    return this.request({
      method: 'GET',
      url: '/api/tags/stats',
    })
  }

  async batchCreateTags(tags: TagCreateRequest[]): Promise<{
    message: string
    tags: Tag[]
  }> {
    return this.request({
      method: 'POST',
      url: '/api/tags/batch',
      data: tags,
    })
  }

  async batchDeleteTags(tagIds: number[]): Promise<{
    message: string
  }> {
    return this.request({
      method: 'DELETE',
      url: '/api/tags/batch',
      data: tagIds,
    })
  }

  async createTag(data: TagCreateRequest): Promise<Tag> {
    return this.request<Tag>({
      method: 'POST',
      url: '/api/tags/',
      data,
    })
  }

  async updateTag(id: number, data: TagUpdateRequest): Promise<Tag> {
    return this.request<Tag>({
      method: 'PUT',
      url: `/api/tags/${id}`,
      data,
    })
  }

  async deleteTag(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/tags/${id}`,
    })
  }
}

// 用户相关 API
class UsersAPI extends ApiService {
  async getUsers(page = 1, pageSize = 20): Promise<PaginatedResponse<User>> {
    return this.request<PaginatedResponse<User>>({
      method: 'GET',
      url: '/api/users/',
      params: { page, page_size: pageSize },
    })
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>({
      method: 'GET',
      url: `/api/users/${id}`,
    })
  }

  async updateUser(id: number, data: UserUpdateRequest): Promise<User> {
    return this.request<User>({
      method: 'PUT',
      url: `/api/users/${id}`,
      data,
    })
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/api/users/${id}`,
    })
  }

  async getUserStats(): Promise<{
    total_users: number
    active_users: number
    inactive_users: number
    recent_users: number
    role_stats: {
      admin: number
      editor: number
      viewer: number
    }
  }> {
    return this.request({
      method: 'GET',
      url: '/api/users/stats',
    })
  }

  async createUser(data: any): Promise<User> {
    return this.request<User>({
      method: 'POST',
      url: '/api/users/',
      data,
    })
  }

  async updateCurrentUser(data: UserUpdateRequest): Promise<User> {
    return this.request<User>({
      method: 'PUT',
      url: '/api/users/me',
      data,
    })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{message: string}> {
    return this.request<{message: string}>({
      method: 'PUT',
      url: '/api/users/me/password',
      data: {
        current_password: currentPassword,
        new_password: newPassword,
      },
    })
  }
}

// 导出 API 实例
export const authAPI = new AuthAPI()
export const documentsAPI = new DocumentsAPI()
export const tagsAPI = new TagsAPI()
export const usersAPI = new UsersAPI()