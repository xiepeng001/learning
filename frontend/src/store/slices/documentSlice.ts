import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'
import {
  DocumentState,
  Document,
  DocumentCreateRequest,
  DocumentUpdateRequest,
  DocumentSearchParams,
  PaginatedResponse,
} from '../../types'
import { documentsAPI } from '../../services/api'

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  searchParams: {
    page: 1,
    page_size: 20,
  },
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
  },
  loading: {},
  error: {},
}

// 异步 actions
export const searchDocuments = createAsyncThunk<
  PaginatedResponse<Document>,
  DocumentSearchParams
>('documents/search', async (params, { rejectWithValue }) => {
  try {
    const response = await documentsAPI.searchDocuments(params)
    return response
  } catch (error: any) {
    return rejectWithValue(error.message || '搜索文档失败')
  }
})

export const getDocument = createAsyncThunk<Document, number>(
  'documents/getDocument',
  async (id, { rejectWithValue }) => {
    try {
      const response = await documentsAPI.getDocument(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取文档失败')
    }
  }
)

export const createDocument = createAsyncThunk<Document, DocumentCreateRequest>(
  'documents/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await documentsAPI.createDocument(data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '创建文档失败')
    }
  }
)

export const updateDocument = createAsyncThunk<
  Document,
  { id: number; data: DocumentUpdateRequest }
>('documents/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await documentsAPI.updateDocument(id, data)
    return response
  } catch (error: any) {
    return rejectWithValue(error.message || '更新文档失败')
  }
})

export const deleteDocument = createAsyncThunk<number, number>(
  'documents/delete',
  async (id, { rejectWithValue }) => {
    try {
      await documentsAPI.deleteDocument(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || '删除文档失败')
    }
  }
)

export const addDocumentTag = createAsyncThunk<
  { documentId: number; tagId: number },
  { documentId: number; tagId: number }
>('documents/addTag', async ({ documentId, tagId }, { rejectWithValue }) => {
  try {
    await documentsAPI.addDocumentTag(documentId, tagId)
    return { documentId, tagId }
  } catch (error: any) {
    return rejectWithValue(error.message || '添加标签失败')
  }
})

export const removeDocumentTag = createAsyncThunk<
  { documentId: number; tagId: number },
  { documentId: number; tagId: number }
>('documents/removeTag', async ({ documentId, tagId }, { rejectWithValue }) => {
  try {
    await documentsAPI.removeDocumentTag(documentId, tagId)
    return { documentId, tagId }
  } catch (error: any) {
    return rejectWithValue(error.message || '移除标签失败')
  }
})

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setSearchParams: (state, action: PayloadAction<DocumentSearchParams>) => {
      state.searchParams = { ...state.searchParams, ...action.payload }
    },
    clearCurrentDocument: (state) => {
      state.currentDocument = null
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.error[action.payload]
    },
    setLoading: (
      state,
      action: PayloadAction<{ key: string; loading: boolean }>
    ) => {
      state.loading[action.payload.key] = action.payload.loading
    },
  },
  extraReducers: (builder) => {
    builder
      // 搜索文档
      .addCase(searchDocuments.pending, (state) => {
        state.loading.search = true
        delete state.error.search
      })
      .addCase(searchDocuments.fulfilled, (state, action) => {
        state.loading.search = false
        state.documents = action.payload.items
        state.pagination = {
          current: action.payload.page,
          pageSize: action.payload.page_size,
          total: action.payload.total,
        }
      })
      .addCase(searchDocuments.rejected, (state, action) => {
        state.loading.search = false
        state.error.search = action.payload as string
      })
      // 获取文档详情
      .addCase(getDocument.pending, (state) => {
        state.loading.detail = true
        delete state.error.detail
      })
      .addCase(getDocument.fulfilled, (state, action) => {
        state.loading.detail = false
        state.currentDocument = action.payload
      })
      .addCase(getDocument.rejected, (state, action) => {
        state.loading.detail = false
        state.error.detail = action.payload as string
      })
      // 创建文档
      .addCase(createDocument.pending, (state) => {
        state.loading.create = true
        delete state.error.create
      })
      .addCase(createDocument.fulfilled, (state, action) => {
        state.loading.create = false
        state.documents.unshift(action.payload)
        state.pagination.total += 1
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.loading.create = false
        state.error.create = action.payload as string
      })
      // 更新文档
      .addCase(updateDocument.pending, (state) => {
        state.loading.update = true
        delete state.error.update
      })
      .addCase(updateDocument.fulfilled, (state, action) => {
        state.loading.update = false
        const index = state.documents.findIndex(doc => doc.id === action.payload.id)
        if (index !== -1) {
          state.documents[index] = action.payload
        }
        if (state.currentDocument?.id === action.payload.id) {
          state.currentDocument = action.payload
        }
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading.update = false
        state.error.update = action.payload as string
      })
      // 删除文档
      .addCase(deleteDocument.pending, (state) => {
        state.loading.delete = true
        delete state.error.delete
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.loading.delete = false
        state.documents = state.documents.filter(doc => doc.id !== action.payload)
        state.pagination.total -= 1
        if (state.currentDocument?.id === action.payload) {
          state.currentDocument = null
        }
      })
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading.delete = false
        state.error.delete = action.payload as string
      })
  },
})

export const { setSearchParams, clearCurrentDocument, clearError, setLoading } =
  documentSlice.actions

// Selectors
export const selectDocuments = (state: RootState) => state.documents.documents
export const selectCurrentDocument = (state: RootState) => state.documents.currentDocument
export const selectSearchParams = (state: RootState) => state.documents.searchParams
export const selectPagination = (state: RootState) => state.documents.pagination
export const selectDocumentLoading = (state: RootState) => state.documents.loading
export const selectDocumentError = (state: RootState) => state.documents.error

export default documentSlice.reducer