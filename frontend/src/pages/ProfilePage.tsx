import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Space,
  Divider,
  message,
  Row,
  Col,
  Avatar,
  Select,
  Tag
} from 'antd'
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  SaveOutlined,
  CameraOutlined
} from '@ant-design/icons'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { selectUser, updateUser } from '../store/slices/authSlice'
import { authAPI, usersAPI } from '../services/api'

const { Title, Text } = Typography
const { Option } = Select

const ProfilePage: React.FC = () => {
  const user = useAppSelector(selectUser)
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url
      })
    }
  }, [user, profileForm])

  // 更新个人信息
  const handleProfileUpdate = async (values: any) => {
    setLoading(true)
    try {
      const updatedUser = await usersAPI.updateCurrentUser({
        username: values.username,
        email: values.email,
        avatar_url: values.avatar_url
      })

      // 更新 Redux store 中的用户信息
      dispatch(updateUser(updatedUser))
      message.success('个人信息更新成功')
    } catch (error) {
      message.error('更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改密码
  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true)
    try {
      await usersAPI.changePassword(values.current_password, values.new_password)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error('密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  // 获取角色显示文本和颜色
  const getRoleInfo = (role: string) => {
    const roleMap = {
      admin: { text: '管理员', color: 'red' },
      editor: { text: '编辑者', color: 'blue' },
      viewer: { text: '查看者', color: 'green' }
    }
    return roleMap[role as keyof typeof roleMap] || { text: role, color: 'default' }
  }

  if (!user) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          请先登录
        </div>
      </div>
    )
  }

  const roleInfo = getRoleInfo(user.role)

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          个人设置
        </Title>
      </div>

      <Row gutter={24}>
        <Col span={8}>
          {/* 个人信息概览 */}
          <Card title="个人信息" style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Avatar
                size={80}
                src={user.avatar_url}
                icon={<UserOutlined />}
                style={{ marginBottom: 8 }}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>{user.username}</Title>
                <Text type="secondary">{user.email}</Text>
              </div>
            </div>

            <Divider />

            <div style={{ marginBottom: 8 }}>
              <Text strong>角色：</Text>
              <Tag color={roleInfo.color}>{roleInfo.text}</Tag>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong>状态：</Text>
              <Tag color={user.is_active ? 'green' : 'red'}>
                {user.is_active ? '已激活' : '已禁用'}
              </Tag>
            </div>

            {user.last_login_at && (
              <div style={{ marginBottom: 8 }}>
                <Text strong>最后登录：</Text>
                <div>{new Date(user.last_login_at).toLocaleString()}</div>
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <Text strong>注册时间：</Text>
              <div>{new Date(user.created_at).toLocaleDateString()}</div>
            </div>
          </Card>
        </Col>

        <Col span={16}>
          {/* 编辑个人信息 */}
          <Card
            title={
              <Space>
                <EditOutlined />
                编辑个人信息
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileUpdate}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 4, max: 20, message: '用户名长度为4-20个字符' }
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱地址"
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱地址" />
              </Form.Item>

              <Form.Item
                name="avatar_url"
                label="头像URL"
              >
                <Input
                  placeholder="请输入头像URL（可选）"
                  prefix={<CameraOutlined />}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 修改密码 */}
          <Card
            title={
              <Space>
                <LockOutlined />
                修改密码
              </Space>
            }
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="current_password"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password placeholder="请输入当前密码" />
              </Form.Item>

              <Form.Item
                name="new_password"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, max: 50, message: '密码长度为6-50个字符' }
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>

              <Form.Item
                name="confirm_password"
                label="确认新密码"
                dependencies={['new_password']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  icon={<LockOutlined />}
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProfilePage