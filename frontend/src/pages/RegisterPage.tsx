import React, { useEffect } from 'react'
import { Form, Input, Button, Card, Typography, Alert, Select, Divider, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { registerUser, clearError, selectAuthLoading, selectAuthError } from '../store/slices/authSlice'
import { RegisterRequest } from '../types'

const { Title, Text } = Typography
const { Option } = Select

const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const loading = useAppSelector(selectAuthLoading)
  const error = useAppSelector(selectAuthError)

  useEffect(() => {
    // 清除之前的错误
    dispatch(clearError())
  }, [dispatch])

  const onFinish = async (values: RegisterRequest) => {
    try {
      await dispatch(registerUser(values)).unwrap()
      message.success('注册成功！请登录您的账户')
      navigate('/login')
    } catch (error) {
      // 错误已经在 store 中处理
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            注册账户
          </Title>
          <Text type="secondary">加入团队知识库</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
            closable
            onClose={() => dispatch(clearError())}
          />
        )}

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{ role: 'viewer' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 4, message: '用户名至少4个字符!' },
              { max: 20, message: '用户名最多20个字符!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名 (4-20字符)"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6个字符!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码 (至少6字符)"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="role"
            label="申请角色"
            rules={[{ required: true, message: '请选择角色!' }]}
          >
            <Select placeholder="请选择您的角色">
              <Option value="viewer">查看者 - 可查看公开和团队文档</Option>
              <Option value="editor">编辑者 - 可创建和编辑文档</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 40 }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">已有账户?</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
            <Button type="link" style={{ padding: 0 }}>
              立即登录
            </Button>
          </Link>
        </div>

        <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 6 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>角色说明:</strong><br />
            • 查看者: 可查看公开和团队文档<br />
            • 编辑者: 可创建、编辑和管理文档<br />
            • 管理员: 由系统管理员授予
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage