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
  Upload,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  TagOutlined
} from '@ant-design/icons'
import { useAppSelector } from '../store/hooks'
import { selectUser } from '../store/slices/authSlice'
import { tagsAPI, documentsAPI } from '../services/api'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

interface Tag {
  id: number
  name: string
  description?: string
  color: string
  created_at: string
}

interface Document {
  id: number
  title: string
  description?: string
  file_name: string
  file_size: number
  file_type: string
  visibility: string
  creator_name: string
  created_at: string
  tags: Tag[]
}

const DocumentsPage: React.FC = () => {
  const user = useAppSelector(selectUser)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [stats, setStats] = useState({ total_documents: 0, my_documents: 0 })
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  const [uploadForm] = Form.useForm()
  const [editForm] = Form.useForm()

  // 加载文档列表
  const loadDocuments = async () => {
    setLoading(true)
    try {
      const searchParams = {
        q: searchText || undefined,
        visibility: visibilityFilter || undefined,
        tags: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
        page: pagination.current,
        page_size: pagination.pageSize
      }

      const data = await documentsAPI.searchDocuments(searchParams)
      setDocuments(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0
      }))
    } catch (error) {
      message.error('加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    try {
      const data = await documentsAPI.getDocumentStats()
      setStats(data)
    } catch (error) {
      console.error('加载统计信息失败:', error)
    }
  }

  // 加载可用标签
  const loadAvailableTags = async () => {
    try {
      const data = await tagsAPI.searchTags()
      setAvailableTags(data.items || [])
    } catch (error) {
      console.error('加载标签失败:', error)
    }
  }

  useEffect(() => {
    loadDocuments()
    loadStats()
    loadAvailableTags()
  }, [pagination.current, pagination.pageSize])

  // 搜索处理
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadDocuments()
  }

  // 上传文档
  const handleUpload = async (values: any) => {
    try {
      const documentData = {
        title: values.title,
        description: values.description || '',
        visibility: values.visibility,
        file: values.file.file
      }

      await documentsAPI.createDocument(documentData)
      message.success('文档上传成功')
      setUploadModalVisible(false)
      uploadForm.resetFields()
      loadDocuments()
      loadStats()
    } catch (error) {
      message.error('上传失败')
    }
  }

  // 更新文档
  const handleUpdate = async (values: any) => {
    if (!selectedDocument) return

    try {
      await documentsAPI.updateDocument(selectedDocument.id, values)
      message.success('文档更新成功')
      setEditModalVisible(false)
      editForm.resetFields()
      setSelectedDocument(null)
      loadDocuments()
    } catch (error) {
      message.error('更新失败')
    }
  }

  // 删除文档
  const handleDelete = async (documentId: number) => {
    try {
      await documentsAPI.deleteDocument(documentId)
      message.success('文档删除成功')
      loadDocuments()
      loadStats()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 下载文档
  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const blob = await documentsAPI.downloadDocument(documentId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('文档下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  // 编辑文档
  const handleEdit = (document: Document) => {
    setSelectedDocument(document)
    editForm.setFieldsValue({
      title: document.title,
      description: document.description,
      visibility: document.visibility
    })
    setEditModalVisible(true)
  }

  // 管理标签
  const handleManageTags = (document: Document) => {
    setSelectedDocument(document)
    setTagModalVisible(true)
  }

  // 添加标签
  const handleAddTag = async (tagId: number) => {
    if (!selectedDocument) return
    try {
      await documentsAPI.addDocumentTag(selectedDocument.id, tagId)
      message.success('标签添加成功')
      // 更新模态框中显示的文档数据
      const updatedDoc = await documentsAPI.getDocument(selectedDocument.id)
      setSelectedDocument(updatedDoc)
      // 更新文档列表
      loadDocuments()
    } catch (error) {
      message.error('添加标签失败')
    }
  }

  // 移除标签
  const handleRemoveTag = async (tagId: number) => {
    if (!selectedDocument) return
    try {
      await documentsAPI.removeDocumentTag(selectedDocument.id, tagId)
      message.success('标签移除成功')
      // 更新模态框中显示的文档数据
      const updatedDoc = await documentsAPI.getDocument(selectedDocument.id)
      setSelectedDocument(updatedDoc)
      // 更新文档列表
      loadDocuments()
    } catch (error) {
      message.error('移除标签失败')
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 表格列定义
  const columns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Document) => (
        <Space>
          <FileTextOutlined />
          <a>{text}</a>
        </Space>
      )
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name'
    },
    {
      title: '文件大小',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      key: 'visibility',
      render: (visibility: string) => {
        const colors = {
          public: 'green',
          team: 'blue',
          private: 'orange'
        }
        const labels = {
          public: '公开',
          team: '团队',
          private: '私有'
        }
        return <Tag color={colors[visibility as keyof typeof colors]}>{labels[visibility as keyof typeof labels]}</Tag>
      }
    },
    {
      title: '创建者',
      dataIndex: 'creator_name',
      key: 'creator_name'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: Tag[]) => (
        <Space>
          {tags?.map(tag => (
            <Tag key={tag.id} color={tag.color}>{tag.name}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Document) => (
        <Space>
          <Button type="text" icon={<EyeOutlined />} size="small">查看</Button>
          <Button
            type="text"
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => handleDownload(record.id, record.file_name)}
          >
            下载
          </Button>
          <Button
            type="text"
            icon={<TagOutlined />}
            size="small"
            onClick={() => handleManageTags(record)}
          >
            标签
          </Button>
          {(user?.role === 'admin' || record.creator_name === user?.username) && (
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
                title="确定要删除这个文档吗？"
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

  const canUpload = user?.role === 'admin' || user?.role === 'editor'

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          文档管理
        </Title>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总文档数"
              value={stats.total_documents}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="我的文档"
              value={stats.my_documents}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 工具栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Input
                placeholder="搜索文档标题..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 300 }}
              />
              <Select
                placeholder="选择可见性"
                value={visibilityFilter}
                onChange={setVisibilityFilter}
                allowClear
                style={{ width: 120 }}
              >
                <Option value="public">公开</Option>
                <Option value="team">团队</Option>
                <Option value="private">私有</Option>
              </Select>
              <Select
                mode="multiple"
                placeholder="选择标签"
                value={selectedTags}
                onChange={setSelectedTags}
                allowClear
                style={{ width: 200 }}
                options={availableTags.map(tag => ({
                  value: tag.name,
                  label: (
                    <span>
                      <Tag color={tag.color} style={{ marginRight: 4 }}>
                        {tag.name}
                      </Tag>
                    </span>
                  )
                }))}
              />
              <Button icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
            </Space>
          </Col>
          <Col>
            {canUpload && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传文档
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* 文档列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={documents}
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

      {/* 上传文档模态框 */}
      <Modal
        title="上传文档"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Form.Item
            name="title"
            label="文档标题"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="文档描述"
          >
            <TextArea placeholder="请输入文档描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="visibility"
            label="可见性"
            initialValue="team"
            rules={[{ required: true, message: '请选择可见性' }]}
          >
            <Select>
              <Option value="public">公开</Option>
              <Option value="team">团队</Option>
              <Option value="private">私有</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="file"
            label="选择文件"
            rules={[{ required: true, message: '请选择要上传的文件' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                上传
              </Button>
              <Button onClick={() => setUploadModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑文档模态框 */}
      <Modal
        title="编辑文档"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="title"
            label="文档标题"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="文档描述"
          >
            <TextArea placeholder="请输入文档描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="visibility"
            label="可见性"
            rules={[{ required: true, message: '请选择可见性' }]}
          >
            <Select>
              <Option value="public">公开</Option>
              <Option value="team">团队</Option>
              <Option value="private">私有</Option>
            </Select>
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

      {/* 标签管理模态框 */}
      <Modal
        title="管理文档标签"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>当前标签：</strong>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            {selectedDocument?.tags?.map(tag => (
              <Tag
                key={tag.id}
                color={tag.color}
                closable
                onClose={() => handleRemoveTag(tag.id)}
              >
                {tag.name}
              </Tag>
            ))}
            {selectedDocument?.tags?.length === 0 && (
              <span style={{ color: '#999' }}>暂无标签</span>
            )}
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <strong>添加标签：</strong>
        </div>
        <div>
          <Space wrap>
            {availableTags
              .filter(tag => !selectedDocument?.tags?.some(docTag => docTag.id === tag.id))
              .map(tag => (
                <Tag
                  key={tag.id}
                  color={tag.color}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleAddTag(tag.id)}
                >
                  + {tag.name}
                </Tag>
              ))}
          </Space>
        </div>
      </Modal>
    </div>
  )
}

export default DocumentsPage