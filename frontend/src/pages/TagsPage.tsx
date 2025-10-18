import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Button,
  Space,
  Table,
  Input,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  ColorPicker
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  TagOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/slices/authSlice'
import { tagsAPI } from '../services/api'

const { Title } = Typography
const { TextArea } = Input

interface TagItem {
  id: number
  name: string
  description?: string
  color: string
  document_count: number
  created_at: string
}

const TagsPage: React.FC = () => {
  const user = useAppSelector(selectUser)
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null)
  const [popularTags, setPopularTags] = useState<TagItem[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [tagStats, setTagStats] = useState({
    total_tags: 0,
    used_tags: 0,
    unused_tags: 0,
    average_documents_per_tag: 0
  })
  const [batchCreateModalVisible, setBatchCreateModalVisible] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // 加载标签列表
  const loadTags = async () => {
    setLoading(true)
    try {
      const data = await tagsAPI.getTags(pagination.current, pagination.pageSize)
      setTags(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }))
    } catch (error) {
      message.error('加载标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载热门标签
  const loadPopularTags = async () => {
    try {
      const data = await tagsAPI.getPopularTags(5)
      setPopularTags(data.items || [])
    } catch (error) {
      console.error('加载热门标签失败:', error)
    }
  }

  // 加载标签统计信息
  const loadTagStats = async () => {
    try {
      const stats = await tagsAPI.getTagStats()
      setTagStats(stats)
    } catch (error) {
      console.error('加载标签统计失败:', error)
    }
  }

  // 批量删除标签
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的标签')
      return
    }

    try {
      await tagsAPI.batchDeleteTags(selectedRowKeys as number[])
      message.success(`成功删除 ${selectedRowKeys.length} 个标签`)
      setSelectedRowKeys([])
      loadTags()
      loadPopularTags()
      loadTagStats()
    } catch (error) {
      message.error('批量删除失败')
    }
  }

  // 搜索标签
  const searchTags = async () => {
    if (!searchText.trim()) {
      loadTags()
      return
    }

    setLoading(true)
    try {
      const data = await tagsAPI.searchTags(searchText)
      setTags(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.items?.length || 0
      }))
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTags()
    loadPopularTags()
    loadTagStats()
  }, [pagination.current, pagination.pageSize])

  // 创建标签
  const handleCreate = async (values: any) => {
    try {
      await tagsAPI.createTag({
        name: values.name,
        description: values.description || '',
        color: values.color || '#1890ff'
      })
      message.success('标签创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      loadTags()
      loadPopularTags()
      loadTagStats()
    } catch (error) {
      message.error('创建失败')
    }
  }

  // 更新标签
  const handleUpdate = async (values: any) => {
    if (!selectedTag) return

    try {
      await tagsAPI.updateTag(selectedTag.id, {
        name: values.name,
        description: values.description || '',
        color: values.color
      })
      message.success('标签更新成功')
      setEditModalVisible(false)
      editForm.resetFields()
      setSelectedTag(null)
      loadTags()
      loadPopularTags()
      loadTagStats()
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 删除标签
  const handleDelete = async (tagId: number) => {
    try {
      await tagsAPI.deleteTag(tagId)
      message.success('标签删除成功')
      loadTags()
      loadPopularTags()
      loadTagStats()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 编辑标签
  const handleEdit = (tag: TagItem) => {
    setSelectedTag(tag)
    editForm.setFieldsValue({
      name: tag.name,
      description: tag.description,
      color: tag.color
    })
    setEditModalVisible(true)
  }

  // 表格列定义
  const columns = [
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TagItem) => (
        <Space>
          <TagOutlined />
          <Tag color={record.color}>{text}</Tag>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-'
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              backgroundColor: color,
              borderRadius: 4,
              border: '1px solid #d9d9d9'
            }}
          />
          {color}
        </div>
      )
    },
    {
      title: '文档数量',
      dataIndex: 'document_count',
      key: 'document_count',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#1890ff' : '#999' }}>
          {count} 个文档
        </span>
      )
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
      render: (_, record: TagItem) => (
        <Space>
          {(user?.role === 'admin' || user?.role === 'editor') && (
            <>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个标签吗？"
                description="删除标签将同时移除所有文档的此标签关联"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small">删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ]

  const canManage = user?.role === 'admin' || user?.role === 'editor'

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          标签管理
        </Title>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总标签数"
              value={tagStats.total_tags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已使用标签"
              value={tagStats.used_tags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="未使用标签"
              value={tagStats.unused_tags}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均文档数"
              value={tagStats.average_documents_per_tag}
              precision={1}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 热门标签 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>热门标签</strong>
        </div>
        <Space wrap>
          {popularTags.map(tag => (
            <Tag key={tag.id} color={tag.color}>
              {tag.name} ({tag.document_count})
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="搜索标签名称..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={searchTags}
                style={{ width: 300 }}
              />
              <Button icon={<SearchOutlined />} onClick={searchTags}>
                搜索
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              {canManage && (
                <>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    创建标签
                  </Button>
                  {selectedRowKeys.length > 0 && (
                    <Popconfirm
                      title="确定要批量删除这些标签吗？"
                      onConfirm={handleBatchDelete}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button danger>
                        批量删除 ({selectedRowKeys.length})
                      </Button>
                    </Popconfirm>
                  )}
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 标签列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: !canManage,
            }),
          }}
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

      {/* 创建标签模态框 */}
      <Modal
        title="创建标签"
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
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="标签描述"
          >
            <TextArea placeholder="请输入标签描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="color"
            label="标签颜色"
            initialValue="#1890ff"
          >
            <ColorPicker format="hex" />
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

      {/* 编辑标签模态框 */}
      <Modal
        title="编辑标签"
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
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="标签描述"
          >
            <TextArea placeholder="请输入标签描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="color"
            label="标签颜色"
            rules={[{ required: true, message: '请选择标签颜色' }]}
          >
            <ColorPicker format="hex" />
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

export default TagsPage