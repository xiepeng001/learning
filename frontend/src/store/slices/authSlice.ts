import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../index'
import { AuthState, LoginRequest, RegisterRequest, TokenResponse, User } from '../../types'
import { authAPI } from '../../services/api'

// 从 localStorage 获取初始状态
const getInitialState = (): AuthState => {
  const token = localStorage.getItem('auth_token')
  const userStr = localStorage.getItem('auth_user')
  let user: User | null = null

  try {
    user = userStr ? JSON.parse(userStr) : null
  } catch {
    localStorage.removeItem('auth_user')
  }

  return {
    user,
    token,
    isAuthenticated: !!(token && user),
    loading: false,
    error: null,
  }
}

// 异步 actions
export const loginUser = createAsyncThunk<TokenResponse, LoginRequest>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      // 保存到 localStorage
      localStorage.setItem('auth_token', response.access_token)
      localStorage.setItem('auth_user', JSON.stringify(response.user))
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败')
    }
  }
)

export const registerUser = createAsyncThunk<User, RegisterRequest>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败')
    }
  }
)

export const logoutUser = createAsyncThunk<void, void>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout()
    } catch (error: any) {
      // 即使登出接口失败，也要清除本地状态
      console.warn('登出接口调用失败:', error)
    } finally {
      // 清除 localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  }
)

export const getCurrentUser = createAsyncThunk<User, void>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser()
      // 更新 localStorage 中的用户信息
      localStorage.setItem('auth_user', JSON.stringify(response))
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('auth_user', JSON.stringify(state.user))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.access_token
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      // 注册
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 登出
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.loading = false
        state.error = null
      })
      // 获取当前用户
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // 如果获取用户信息失败，可能是token过期，清除认证状态
        state.isAuthenticated = false
        state.user = null
        state.token = null
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      })
  },
})

export const { clearError, updateUser } = authSlice.actions

// Selectors
export const selectUser = (state: RootState) => state.auth.user
export const selectToken = (state: RootState) => state.auth.token
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthError = (state: RootState) => state.auth.error

export default authSlice.reducer