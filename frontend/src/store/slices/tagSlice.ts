import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { RootState } from '../index'
import {
  TagState,
  Tag,
  TagCreateRequest,
  TagUpdateRequest,
  PaginatedResponse,
} from '../../types'
import { tagsAPI } from '../../services/api'

const initialState: TagState = {
  tags: [],
  popularTags: [],
  loading: {},
  error: {},
}

// 异步 actions
export const fetchTags = createAsyncThunk<
  PaginatedResponse<Tag>,
  { page?: number; page_size?: number }
>('tags/fetch', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await tagsAPI.getTags(params.page, params.page_size)
    return response
  } catch (error: any) {
    return rejectWithValue(error.message || '获取标签失败')
  }
})

export const searchTags = createAsyncThunk<Tag[], string | undefined>(
  'tags/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await tagsAPI.searchTags(query)
      return response.items
    } catch (error: any) {
      return rejectWithValue(error.message || '搜索标签失败')
    }
  }
)

export const fetchPopularTags = createAsyncThunk<Tag[], number>(
  'tags/fetchPopular',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await tagsAPI.getPopularTags(limit)
      return response.items
    } catch (error: any) {
      return rejectWithValue(error.message || '获取热门标签失败')
    }
  }
)

export const createTag = createAsyncThunk<Tag, TagCreateRequest>(
  'tags/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await tagsAPI.createTag(data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '创建标签失败')
    }
  }
)

export const updateTag = createAsyncThunk<
  Tag,
  { id: number; data: TagUpdateRequest }
>('tags/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await tagsAPI.updateTag(id, data)
    return response
  } catch (error: any) {
    return rejectWithValue(error.message || '更新标签失败')
  }
})

export const deleteTag = createAsyncThunk<number, number>(
  'tags/delete',
  async (id, { rejectWithValue }) => {
    try {
      await tagsAPI.deleteTag(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || '删除标签失败')
    }
  }
)

const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    clearError: (state, action) => {
      delete state.error[action.payload]
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取标签列表
      .addCase(fetchTags.pending, (state) => {
        state.loading.fetch = true
        delete state.error.fetch
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading.fetch = false
        state.tags = action.payload.items
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading.fetch = false
        state.error.fetch = action.payload as string
      })
      // 搜索标签
      .addCase(searchTags.pending, (state) => {
        state.loading.search = true
        delete state.error.search
      })
      .addCase(searchTags.fulfilled, (state, action) => {
        state.loading.search = false
        state.tags = action.payload
      })
      .addCase(searchTags.rejected, (state, action) => {
        state.loading.search = false
        state.error.search = action.payload as string
      })
      // 获取热门标签
      .addCase(fetchPopularTags.pending, (state) => {
        state.loading.popular = true
        delete state.error.popular
      })
      .addCase(fetchPopularTags.fulfilled, (state, action) => {
        state.loading.popular = false
        state.popularTags = action.payload
      })
      .addCase(fetchPopularTags.rejected, (state, action) => {
        state.loading.popular = false
        state.error.popular = action.payload as string
      })
      // 创建标签
      .addCase(createTag.pending, (state) => {
        state.loading.create = true
        delete state.error.create
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.loading.create = false
        state.tags.unshift(action.payload)
      })
      .addCase(createTag.rejected, (state, action) => {
        state.loading.create = false
        state.error.create = action.payload as string
      })
      // 更新标签
      .addCase(updateTag.pending, (state) => {
        state.loading.update = true
        delete state.error.update
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        state.loading.update = false
        const index = state.tags.findIndex(tag => tag.id === action.payload.id)
        if (index !== -1) {
          state.tags[index] = action.payload
        }
      })
      .addCase(updateTag.rejected, (state, action) => {
        state.loading.update = false
        state.error.update = action.payload as string
      })
      // 删除标签
      .addCase(deleteTag.pending, (state) => {
        state.loading.delete = true
        delete state.error.delete
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.loading.delete = false
        state.tags = state.tags.filter(tag => tag.id !== action.payload)
        state.popularTags = state.popularTags.filter(tag => tag.id !== action.payload)
      })
      .addCase(deleteTag.rejected, (state, action) => {
        state.loading.delete = false
        state.error.delete = action.payload as string
      })
  },
})

export const { clearError } = tagSlice.actions

// Selectors
export const selectTags = (state: RootState) => state.tags.tags
export const selectPopularTags = (state: RootState) => state.tags.popularTags
export const selectTagLoading = (state: RootState) => state.tags.loading
export const selectTagError = (state: RootState) => state.tags.error

export default tagSlice.reducer