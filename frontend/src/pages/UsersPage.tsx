import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Table,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Switch,
  Badge
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/slices/authSlice'
import { usersAPI } from '../services/api'

const { Title } = Typography
const { Option } = Select

interface User {
  id: number
  username: string
  email: string
  role: string
  avatar_url?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

const UsersPage: React.FC = () => {
  const currentUser = useAppSelector(selectUser)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    recent_users: 0,
    role_stats: {
      admin: 0,
      editor: 0,
      viewer: 0
    }
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersAPI.getUsers(pagination.current, pagination.pageSize)
      let filteredUsers = data.items || []

      // 前端过滤
      if (searchText) {
        filteredUsers = filteredUsers.filter(user =>
          user.username.toLowerCase().includes(searchText.toLowerCase()) ||
          user.email.toLowerCase().includes(searchText.toLowerCase())
        )
      }
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter)
      }
      if (statusFilter) {
        const isActive = statusFilter === 'active'
        filteredUsers = filteredUsers.filter(user => user.is_active === isActive)
      }

      setUsers(filteredUsers)
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }))
    } catch (error) {
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载用户统计信息
  const loadUserStats = async () => {
    try {
      const stats = await usersAPI.getUserStats()
      setUserStats(stats)
    } catch (error) {
      console.error('加载用户统计失败:', error)
    }
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers()
      loadUserStats()
    }
  }, [pagination.current, pagination.pageSize, currentUser])

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers()
  }

  // 创建用户
  const handleCreate = async (values: any) => {
    try {
      await usersAPI.createUser({
        username: values.username,
        email: values.email,
        password: values.password,
        role: values.role,
        avatar_url: values.avatar_url || null
      })
      message.success('用户创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      loadUsers()
      loadUserStats()
    } catch (error) {
      message.error('创建失败')
    }
  }

  // 更新用户
  const handleUpdate = async (values: any) => {
    if (!selectedUser) return

    try {
      await usersAPI.updateUser(selectedUser.id, values)
      message.success('用户更新成功')
      setEditModalVisible(false)
      editForm.resetFields()
      setSelectedUser(null)
      loadUsers()
      loadUserStats()
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 删除用户
  const handleDelete = async (userId: number) => {
    try {
      await usersAPI.deleteUser(userId)
      message.success('用户删除成功')
      loadUsers()
      loadUserStats()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 编辑用户
  const handleEdit = (user: User) => {
    setSelectedUser(user)
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      is_active: user.is_active
    })
    setEditModalVisible(true)
  }

  // 切换用户状态
  const handleToggleStatus = async (userId: number, isActive: boolean) => {
    try {
      await usersAPI.updateUser(userId, { is_active: !isActive })
      message.success(`用户已${!isActive ? '激活' : '禁用'}`)
      loadUsers()
      loadUserStats()
    } catch (error) {
      message.error('状态更新失败')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: User) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          {!record.is_active && <Badge status="default" text="已禁用" />}
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          editor: 'blue',
          viewer: 'green'
        }
        const labels = {
          admin: '管理员',
          editor: '编辑者',
          viewer: '查看者'
        }
        return <Tag color={colors[role as keyof typeof colors]}>{labels[role as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: User) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggleStatus(record.id, isActive)}
          disabled={record.id === currentUser?.id}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '从未登录'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: User) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.id !== currentUser?.id && (
            <Popconfirm
              title="确定要删除这个用户吗？"
              description="删除用户将同时删除其创建的所有文档"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small">删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  if (currentUser?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="page-header">
          <Title level={2} className="page-title">
            用户管理
          </Title>
        </div>
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
          只有管理员可以访问用户管理功能
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          用户管理
        </Title>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={userStats.total_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={userStats.active_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="禁用用户"
              value={userStats.inactive_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="近7天新用户"
              value={userStats.recent_users}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 角色统计 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>角色分布</strong>
        </div>
        <Space wrap>
          <Tag color="red">管理员: {userStats.role_stats.admin}</Tag>
          <Tag color="blue">编辑者: {userStats.role_stats.editor}</Tag>
          <Tag color="green">查看者: {userStats.role_stats.viewer}</Tag>
        </Space>
      </Card>

      {/* 工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="搜索用户名或邮箱..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
              />
              <Select
                placeholder="角色"
                value={roleFilter}
                onChange={setRoleFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value="admin">管理员</Option>
                <Option value="editor">编辑者</Option>
                <Option value="viewer">查看者</Option>
              </Select>
              <Select
                placeholder="状态"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value="active">启用</Option>
                <Option value="inactive">禁用</Option>
              </Select>
              <Button icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                setSearchText('')
                setRoleFilter('')
                setStatusFilter('')
                loadUsers()
              }}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建用户
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 用户列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 20
              }))
            }
          }}
        />
      </Card>

      {/* 创建用户模态框 */}
      <Modal
        title="创建用户"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
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
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 50, message: '密码长度为6-50个字符' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            initialValue="viewer"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="admin">管理员</Option>
              <Option value="editor">编辑者</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="avatar_url"
            label="头像URL"
          >
            <Input placeholder="请输入头像URL（可选）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        title="编辑用户"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
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
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="admin">管理员</Option>
              <Option value="editor">编辑者</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="avatar_url"
            label="头像URL"
          >
            <Input placeholder="请输入头像URL（可选）" />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UsersPage