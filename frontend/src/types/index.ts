// API 数据类型定义

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar_url?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: number
  title: string
  description?: string
  file_path: string
  file_name: string
  file_size: number
  file_type: string
  visibility: 'public' | 'team' | 'private'
  creator_id: number
  creator_name?: string
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface Tag {
  id: number
  name: string
  description?: string
  color: string
  created_at: string
  document_count?: number
}

export interface DocumentPermission {
  id: number
  document_id: number
  user_id: number
  permission: 'read' | 'write' | 'admin'
  granted_by: number
  created_at: string
}

// API 请求/响应类型
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  role?: 'admin' | 'editor' | 'viewer'
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface DocumentCreateRequest {
  title: string
  description?: string
  visibility: 'public' | 'team' | 'private'
  file: File
}

export interface DocumentUpdateRequest {
  title?: string
  description?: string
  visibility?: 'public' | 'team' | 'private'
}

export interface DocumentSearchParams {
  q?: string
  tags?: string[]
  visibility?: 'public' | 'team' | 'private'
  creator_id?: number
  page?: number
  page_size?: number
}

export interface TagCreateRequest {
  name: string
  description?: string
  color?: string
}

export interface TagUpdateRequest {
  name?: string
  description?: string
  color?: string
}

export interface UserUpdateRequest {
  username?: string
  email?: string
  role?: 'admin' | 'editor' | 'viewer'
  avatar_url?: string
  is_active?: boolean
}

// UI 状态类型
export interface LoadingState {
  [key: string]: boolean
}

export interface ErrorState {
  [key: string]: string | null
}

// 应用状态类型
export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export interface DocumentState {
  documents: Document[]
  currentDocument: Document | null
  searchParams: DocumentSearchParams
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  loading: LoadingState
  error: ErrorState
}

export interface TagState {
  tags: Tag[]
  popularTags: Tag[]
  loading: LoadingState
  error: ErrorState
}

export interface UserState {
  users: User[]
  currentUser: User | null
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  loading: LoadingState
  error: ErrorState
}

// 组件 Props 类型
export interface SearchFormProps {
  onSearch: (params: DocumentSearchParams) => void
  loading?: boolean
}

export interface DocumentCardProps {
  document: Document
  onEdit?: (document: Document) => void
  onDelete?: (id: number) => void
  onTagClick?: (tag: Tag) => void
}

export interface TagSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
}

export interface UploadProps {
  onUpload: (data: DocumentCreateRequest) => Promise<void>
  loading?: boolean
}

// API 错误类型
export interface ApiError {
  message: string
  status: number
  details?: any
}