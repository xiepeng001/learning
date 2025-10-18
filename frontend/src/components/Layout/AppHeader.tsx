import React from 'react'
import { Layout, Dropdown, Avatar, Space, Typography, Button } from 'antd'
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logoutUser, selectUser } from '../../store/slices/authSlice'

const { Header } = Layout
const { Text } = Typography

const AppHeader: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectUser)

  const handleLogout = async () => {
    await dispatch(logoutUser())
    navigate('/login')
  }

  const handleProfile = () => {
    navigate('/profile')
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员'
      case 'editor':
        return '编辑者'
      case 'viewer':
        return '查看者'
      default:
        return role
    }
  }

  const menuItems = [
    {
      key: 'profile',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: handleProfile,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div>
        <Text strong style={{ fontSize: 16 }}>
          团队知识库管理工具
        </Text>
      </div>

      <Space>
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" style={{ height: 'auto', padding: '4px 8px' }}>
            <Space>
              <Avatar
                size="small"
                icon={<UserOutlined />}
                src={user?.avatar_url}
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong>{user?.username}</Text>
                </div>
                <div style={{ lineHeight: 1.2 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.role && getRoleText(user.role)}
                  </Text>
                </div>
              </div>
              <DownOutlined style={{ fontSize: 12 }} />
            </Space>
          </Button>
        </Dropdown>
      </Space>
    </Header>
  )
}

export default AppHeader