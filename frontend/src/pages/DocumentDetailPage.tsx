import React from 'react'
import { Typography } from 'antd'

const { Title } = Typography

const DocumentDetailPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          文档详情
        </Title>
      </div>
      <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
        文档详情页面正在开发中...
      </div>
    </div>
  )
}

export default DocumentDetailPage