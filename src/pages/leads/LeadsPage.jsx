// =============================================================================
// File: src/pages/leads/LeadsPage.jsx  
// Description: Simple leads management page that ACTUALLY WORKS
// Features: Lead listing, filtering, basic actions - NO DRAG DROP FOR NOW
// Dependencies: Only Ant Design, React Query - MINIMAL DEPENDENCIES
// =============================================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Avatar,
  List,
  Badge,
  Modal,
  Form,
  message,
  Spin,
  Empty
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined
} from '@ant-design/icons'
import {
  Phone,
  Mail,
  Star,
  Plus,
  Eye
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { leadAPI } from '../../services/api'
import { formatCurrencyShort } from '../../utils/helpers'
import { LEAD_STATUS, LEAD_SOURCES } from '../../constants'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const LeadsPage = () => {
  const navigate = useNavigate()
  const { hasPermission } = useAuthStore()
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()

  // API Query
  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['leads', searchQuery, statusFilter],
    queryFn: () => leadAPI.getLeads({
      search: searchQuery,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      limit: 50
    }),
    staleTime: 2 * 60 * 1000
  })

  const leads = leadsData?.data?.leads || []

  // Handle create lead
  const handleCreateLead = async (values) => {
    try {
      const response = await leadAPI.createLead(values)
      if (response.data) {
        setCreateModalVisible(false)
        form.resetFields()
        message.success('Lead created successfully!')
        navigate(`/leads/${response.data._id}`)
      }
    } catch (error) {
      message.error('Failed to create lead')
    }
  }

  // Get priority color
  const getPriorityColor = (score) => {
    if (score >= 80) return 'red'    // Hot
    if (score >= 60) return 'orange' // Warm
    return 'blue'                    // Cold
  }

  // Get priority text
  const getPriorityText = (score) => {
    if (score >= 80) return 'Hot'
    if (score >= 60) return 'Warm'
    return 'Cold'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Loading leads..." />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <Card>
        <Row align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <div>
              <Title level={2} className="m-0 mb-2">
                Leads Management
              </Title>
              <Text className="text-gray-600">
                Track and manage your sales prospects
              </Text>
            </div>
          </Col>
          <Col xs={24} md={12} className="text-right">
            <Space wrap>
              {hasPermission('lead_management') && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  Add Lead
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Search and Filters */}
      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} md={12}>
            <Search
              placeholder="Search leads by name, email, phone..."
              allowClear
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={setSearchQuery}
            />
          </Col>
          <Col xs={24} md={12} className="text-right">
            <Space>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 200 }}
              >
                <Option value="all">All Status</Option>
                {Object.values(LEAD_STATUS).map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Leads List */}
      <Card>
        {leads.length === 0 ? (
          <Empty
            description="No leads found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {hasPermission('lead_management') && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                Add Your First Lead
              </Button>
            )}
          </Empty>
        ) : (
          <List
            dataSource={leads}
            renderItem={lead => {
              const score = lead.score || 0
              const priorityColor = getPriorityColor(score)
              const priorityText = getPriorityText(score)
              
              return (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/leads/${lead._id}`)}
                    >
                      View
                    </Button>,
                    <Button 
                      type="link" 
                      icon={<PhoneOutlined />}
                      onClick={() => window.open(`tel:${lead.phoneNumber}`)}
                    >
                      Call
                    </Button>,
                    <Button 
                      type="link" 
                      icon={<MailOutlined />}
                      onClick={() => window.open(`mailto:${lead.email}`)}
                    >
                      Email
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: priorityColor }}>
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </Avatar>
                    }
                    title={
                      <div className="flex items-center space-x-2">
                        <Text className="font-medium">{lead.firstName} {lead.lastName}</Text>
                        <Tag color="blue">{lead.status}</Tag>
                        <Badge color={priorityColor} text={priorityText} />
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{lead.email}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{lead.phoneNumber}</span>
                          </span>
                        </div>
                        <Text className="text-sm text-gray-600">
                          Budget: {lead.budget ? 
                            `${formatCurrencyShort(lead.budget.min)} - ${formatCurrencyShort(lead.budget.max)}` : 
                            'Not specified'
                          }
                        </Text>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <Text className="text-sm">Score: {score}</Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        )}
      </Card>

      {/* Create Lead Modal */}
      <Modal
        title="Add New Lead"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateLead}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input placeholder="Enter first name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: 'Please enter last name' }]}
              >
                <Input placeholder="Enter last name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^[6-9]\d{9}$/, message: 'Please enter valid phone number' }
                ]}
              >
                <Input placeholder="Enter phone number" maxLength={10} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="source"
                label="Lead Source"
                rules={[{ required: true, message: 'Please select lead source' }]}
              >
                <Select placeholder="Select source">
                  {Object.values(LEAD_SOURCES).map(source => (
                    <Option key={source} value={source}>{source}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name={['requirements', 'unitType']}
                label="Unit Type Preference"
              >
                <Select placeholder="Select unit type" allowClear>
                  <Option value="1BHK">1BHK</Option>
                  <Option value="2BHK">2BHK</Option>
                  <Option value="3BHK">3BHK</Option>
                  <Option value="4BHK">4BHK</Option>
                  <Option value="Villa">Villa</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="notes"
                label="Notes"
              >
                <Input.TextArea 
                  rows={3} 
                  placeholder="Any additional information" 
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end space-x-2 mt-6">
            <Button onClick={() => setCreateModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Lead
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  )
}

export default LeadsPage