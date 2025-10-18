import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Spin, List, Tag } from 'antd'
import {
  FileTextOutlined,
  TagsOutlined,
  TeamOutlined,
  EyeOutlined,
} from '@ant-design/icons'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { selectUser } from '../store/slices/authSlice'
import { documentsAPI, tagsAPI } from '../services/api'

const { Title, Paragraph } = Typography

interface DashboardStats {
  totalDocuments: number
  myDocuments: number
  totalTags: number
}

interface RecentDocument {
  id: number
  title: string
  created_at: string
  creator_name: string
}

interface PopularTag {
  id: number
  name: string
  color: string
  document_count: number
}

const DashboardPage: React.FC = () => {
  const user = useAppSelector(selectUser)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    myDocuments: 0,
    totalTags: 0,
  })
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([])
  const [popularTags, setPopularTags] = useState<PopularTag[]>([])

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

  // 加载仪表板数据
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)

        // 并行获取所有数据
        const [
          docStats,
          tagStats,
          recentDocsRes,
          popularTagsRes
        ] = await Promise.all([
          documentsAPI.getDocumentStats(),
          tagsAPI.getTagStats(),
          documentsAPI.searchDocuments({ page: 1, page_size: 5 }),
          tagsAPI.getPopularTags(5)
        ])

        setStats({
          totalDocuments: docStats.total_documents,
          myDocuments: docStats.my_documents,
          totalTags: tagStats.total_tags,
        })

        setRecentDocuments(recentDocsRes.items || [])
        setPopularTags(popularTagsRes.items || [])

      } catch (error) {
        console.error('加载仪表板数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          工作台
        </Title>
        <Paragraph className="page-description">
          欢迎回来，{user?.username}！您的角色是{user?.role && getRoleText(user.role)}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="我的文档"
              value={loading ? 0 : stats.myDocuments}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="团队文档"
              value={loading ? 0 : stats.totalDocuments}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="标签数量"
              value={loading ? 0 : stats.totalTags}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#722ed1' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日访问"
              value={0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fa541c' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="最近文档" extra={<a href="/documents">查看全部</a>}>
            <Spin spinning={loading}>
              {recentDocuments.length > 0 ? (
                <List
                  dataSource={recentDocuments}
                  renderItem={(doc) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<FileTextOutlined style={{ color: '#1890ff' }} />}
                        title={<a href={`/documents/${doc.id}`}>{doc.title}</a>}
                        description={`${doc.creator_name} • ${new Date(doc.created_at).toLocaleDateString()}`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  暂无文档数据
                </div>
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="热门标签" extra={<a href="/tags">查看全部</a>}>
            <Spin spinning={loading}>
              {popularTags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {popularTags.map((tag) => (
                    <Tag
                      key={tag.id}
                      color={tag.color}
                      style={{ margin: '4px 0', fontSize: '14px', padding: '4px 8px' }}
                    >
                      {tag.name} ({tag.document_count})
                    </Tag>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  暂无标签数据
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="快速开始">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                  <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div style={{ marginTop: 8 }}>
                    <a href="/documents">浏览文档</a>
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>
                    查看和搜索团队文档
                  </div>
                </Card.Grid>
              </Col>
              {(user?.role === 'admin' || user?.role === 'editor') && (
                <Col xs={24} sm={8}>
                  <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                    <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <div style={{ marginTop: 8 }}>
                      <a href="/documents">上传文档</a>
                    </div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      创建和分享新文档
                    </div>
                  </Card.Grid>
                </Col>
              )}
              <Col xs={24} sm={8}>
                <Card.Grid style={{ width: '100%', textAlign: 'center' }}>
                  <TagsOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div style={{ marginTop: 8 }}>
                    <a href="/tags">管理标签</a>
                  </div>
                  <div style={{ color: '#999', fontSize: 12 }}>
                    组织和分类文档
                  </div>
                </Card.Grid>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage