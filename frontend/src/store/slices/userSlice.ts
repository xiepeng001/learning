import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { RootState } from '../index'
import {
  UserState,
  User,
  UserUpdateRequest,
  PaginatedResponse,
} from '../../types'
import { usersAPI } from '../../services/api'

const initialState: UserState = {
  users: [],
  currentUser: null,
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0,
  },
  loading: {},
  error: {},
}

// 异步 actions
export const fetchUsers = createAsyncThunk<
  PaginatedResponse<User>,
  { page?: number; page_size?: number }
>('users/fetch', async (params = {}, { rejectWithValue }) => {
  try {
    const response = await usersAPI.getUsers(params.page, params.page_size)
    return response
  } catch (error: any) {
    return rejectWithValue(error.message || '获取用户列表失败')
  }
})

export const getUser = createAsyncThunk<User, number>(
  'users/getUser',
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUser(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败')
    }
  }
)

export const updateUser = createAsyncThunk<
  User,
  { id: number; data: UserUpdateRequest }
>('users/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await usersAPI.updateUser(id, data)
    return response
  } catch (error: any) {
    return rejectWithValue(error.message || '更新用户失败')
  }
})

export const deleteUser = createAsyncThunk<number, number>(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await usersAPI.deleteUser(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.message || '删除用户失败')
    }
  }
)

export const updateCurrentUser = createAsyncThunk<User, UserUpdateRequest>(
  'users/updateCurrent',
  async (data, { rejectWithValue }) => {
    try {
      const response = await usersAPI.updateCurrentUser(data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '更新个人信息失败')
    }
  }
)

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state, action) => {
      delete state.error[action.payload]
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取用户列表
      .addCase(fetchUsers.pending, (state) => {
        state.loading.fetch = true
        delete state.error.fetch
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.fetch = false
        state.users = action.payload.items
        state.pagination = {
          current: action.payload.page,
          pageSize: action.payload.page_size,
          total: action.payload.total,
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.fetch = false
        state.error.fetch = action.payload as string
      })
      // 获取用户详情
      .addCase(getUser.pending, (state) => {
        state.loading.detail = true
        delete state.error.detail
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.loading.detail = false
        state.currentUser = action.payload
      })
      .addCase(getUser.rejected, (state, action) => {
        state.loading.detail = false
        state.error.detail = action.payload as string
      })
      // 更新用户
      .addCase(updateUser.pending, (state) => {
        state.loading.update = true
        delete state.error.update
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading.update = false
        const index = state.users.findIndex(user => user.id === action.payload.id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.update = false
        state.error.update = action.payload as string
      })
      // 删除用户
      .addCase(deleteUser.pending, (state) => {
        state.loading.delete = true
        delete state.error.delete
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading.delete = false
        state.users = state.users.filter(user => user.id !== action.payload)
        state.pagination.total -= 1
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.delete = false
        state.error.delete = action.payload as string
      })
      // 更新当前用户
      .addCase(updateCurrentUser.pending, (state) => {
        state.loading.updateCurrent = true
        delete state.error.updateCurrent
      })
      .addCase(updateCurrentUser.fulfilled, (state, action) => {
        state.loading.updateCurrent = false
        state.currentUser = action.payload
      })
      .addCase(updateCurrentUser.rejected, (state, action) => {
        state.loading.updateCurrent = false
        state.error.updateCurrent = action.payload as string
      })
  },
})

export const { clearError, setCurrentUser } = userSlice.actions

// Selectors
export const selectUsers = (state: RootState) => state.users.users
export const selectCurrentUserDetail = (state: RootState) => state.users.currentUser
export const selectUserPagination = (state: RootState) => state.users.pagination
export const selectUserLoading = (state: RootState) => state.users.loading
export const selectUserError = (state: RootState) => state.users.error

export default userSlice.reducer