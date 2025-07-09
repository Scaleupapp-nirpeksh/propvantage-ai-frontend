// =============================================================================
// File: src/pages/projects/ProjectDetailsPage.jsx
// Description: Comprehensive project details page with towers, units, analytics
// Features: Tabbed interface, real-time data, charts, tower management
// Dependencies: Ant Design, React Query, Recharts, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Row,
  Col,
  Card,
  Tabs,
  Typography,
  Button,
  Space,
  Statistic,
  Progress,
  Tag,
  Table,
  Empty,
  Spin,
  Alert,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Dropdown,
  Popconfirm,
  Timeline,
  Steps,
  Collapse,
  List,
  Descriptions,
  Image
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  SettingOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  MoreOutlined,
  HomeOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
  BankOutlined,
  BuildOutlined,
  TrophyOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  LineChartOutlined,
  PieChartOutlined,
  FunnelPlotOutlined,
  WalletOutlined,
  PayCircleOutlined,
  BulbOutlined,
  FlagOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import {
  Building2,
  MapPin,
  Users,
  Target,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  Edit,
  Settings,
  Plus,
  Eye,
  Trash2,
  ArrowLeft,
  Home,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  BarChart3,
  PieChart,
  Layers,
  CreditCard,
  Wallet,
  FileText,
  Phone,
  Mail,
  Globe,
  Award,
  Flag,
  Lightbulb,
  AlertTriangle,
  Info,
  Construction,
  Wrench
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts'

import { projectAPI, towerAPI, unitAPI, analyticsAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { 
  PROJECT_STATUS, 
  PROJECT_TYPES,
  UNIT_STATUS,
  STATUS_COLORS,
  UNIT_TYPES
} from '../../constants'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor,
  calculatePercentage 
} from '../../utils/helpers'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Panel } = Collapse

// Chart colors
const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']

// Animation variants
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const ProjectDetailsPage = () => {
  // Hooks
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  
  // Store state
  const { user, hasPermission } = useAuthStore()
  const { setPageTitle, setPageLoading } = useAppStore()
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [createTowerModalVisible, setCreateTowerModalVisible] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')

  // API Queries
  const { 
    data: project, 
    isLoading: projectLoading, 
    error: projectError 
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectAPI.getProject(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })

  const { 
    data: towers = [], 
    isLoading: towersLoading 
  } = useQuery({
    queryKey: ['towers', id],
    queryFn: () => towerAPI.getTowers({ projectId: id }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const { 
    data: projectAnalytics, 
    isLoading: analyticsLoading 
  } = useQuery({
    queryKey: ['project-analytics', id, selectedTimeRange],
    queryFn: () => analyticsAPI.getProjectAnalytics(id, { timeRange: selectedTimeRange }),
    enabled: !!id,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })

  const { 
    data: units = [], 
    isLoading: unitsLoading 
  } = useQuery({
    queryKey: ['units', id],
    queryFn: () => unitAPI.getUnits({ projectId: id, limit: 100 }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Set page title
  useEffect(() => {
    if (project?.data?.name) {
      setPageTitle(project.data.name)
    }
  }, [project, setPageTitle])

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => projectAPI.updateProject(id, data),
    onSuccess: () => {
      message.success('Project updated successfully!')
      setEditModalVisible(false)
      queryClient.invalidateQueries(['project', id])
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to update project')
    }
  })

  // Create tower mutation
  const createTowerMutation = useMutation({
    mutationFn: towerAPI.createTower,
    onSuccess: () => {
      message.success('Tower created successfully!')
      setCreateTowerModalVisible(false)
      queryClient.invalidateQueries(['towers', id])
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create tower')
    }
  })

  // Calculate project metrics
  const projectMetrics = useMemo(() => {
    if (!project?.data || !units?.data || !towers?.data) return null

    const projectData = project.data
    const unitsData = units.data || []
    const towersData = towers.data || []

    const totalUnits = unitsData.length
    const soldUnits = unitsData.filter(unit => unit.status === UNIT_STATUS.SOLD).length
    const availableUnits = unitsData.filter(unit => unit.status === UNIT_STATUS.AVAILABLE).length
    const blockedUnits = unitsData.filter(unit => unit.status === UNIT_STATUS.BLOCKED).length

    const totalRevenue = unitsData.reduce((sum, unit) => sum + (unit.salePrice || 0), 0)
    const totalInventoryValue = unitsData.reduce((sum, unit) => sum + (unit.currentPrice || 0), 0)

    const completionPercentage = projectData.completionPercentage || 0
    const salesPercentage = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0

    return {
      totalUnits,
      soldUnits,
      availableUnits,
      blockedUnits,
      totalTowers: towersData.length,
      totalRevenue,
      totalInventoryValue,
      completionPercentage,
      salesPercentage,
      averageUnitPrice: totalUnits > 0 ? totalInventoryValue / totalUnits : 0
    }
  }, [project, units, towers])

  // Prepare chart data
  const unitStatusData = useMemo(() => {
    if (!projectMetrics) return []
    
    return [
      { name: 'Available', value: projectMetrics.availableUnits, color: '#52c41a' },
      { name: 'Sold', value: projectMetrics.soldUnits, color: '#1890ff' },
      { name: 'Blocked', value: projectMetrics.blockedUnits, color: '#faad14' }
    ]
  }, [projectMetrics])

  const towerData = useMemo(() => {
    if (!towers?.data) return []
    
    return towers.data.map(tower => ({
      name: tower.towerName,
      units: tower.totalUnits,
      sold: tower.soldUnits || 0,
      available: tower.availableUnits || 0,
      completion: tower.completionPercentage || 0
    }))
  }, [towers])

  // Handle project update
  const handleUpdateProject = async (values) => {
    try {
      await updateProjectMutation.mutateAsync({ id, data: values })
    } catch (error) {
      console.error('Update project error:', error)
    }
  }

  // Handle tower creation
  const handleCreateTower = async (values) => {
    try {
      await createTowerMutation.mutateAsync({
        ...values,
        project: id
      })
    } catch (error) {
      console.error('Create tower error:', error)
    }
  }

  // Get project status icon
  const getProjectStatusIcon = (status) => {
    const icons = {
      [PROJECT_STATUS.PLANNING]: <ClockCircleOutlined className="text-orange-500" />,
      [PROJECT_STATUS.PRE_LAUNCH]: <RocketOutlined className="text-blue-500" />,
      [PROJECT_STATUS.LAUNCHED]: <CheckCircleOutlined className="text-green-500" />,
      [PROJECT_STATUS.UNDER_CONSTRUCTION]: <BuildOutlined className="text-purple-500" />,
      [PROJECT_STATUS.READY_TO_MOVE]: <HomeOutlined className="text-cyan-500" />,
      [PROJECT_STATUS.COMPLETED]: <TrophyOutlined className="text-gold" />,
      [PROJECT_STATUS.ON_HOLD]: <ExclamationCircleOutlined className="text-yellow-500" />,
      [PROJECT_STATUS.CANCELLED]: <ExclamationCircleOutlined className="text-red-500" />
    }
    return icons[status] || <ClockCircleOutlined />
  }

  // Tower table columns
  const towerColumns = [
    {
      title: 'Tower',
      dataIndex: 'towerName',
      key: 'towerName',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text strong>{text}</Text>
            <br />
            <Text type="secondary" className="text-sm">
              {record.towerCode}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Floors',
      dataIndex: 'totalFloors',
      key: 'totalFloors',
      render: (floors) => (
        <div className="text-center">
          <Text strong className="text-lg">{floors}</Text>
          <br />
          <Text type="secondary" className="text-sm">floors</Text>
        </div>
      )
    },
    {
      title: 'Total Units',
      dataIndex: 'totalUnits',
      key: 'totalUnits',
      render: (units) => (
        <div className="text-center">
          <Text strong className="text-lg">{units}</Text>
          <br />
          <Text type="secondary" className="text-sm">units</Text>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="rounded-full">
          {status}
        </Tag>
      )
    },
    {
      title: 'Progress',
      dataIndex: 'completionPercentage',
      key: 'completionPercentage',
      render: (percentage = 0) => (
        <div className="w-24">
          <Progress
            percent={percentage}
            size="small"
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#1890ff'
            }}
          />
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                icon: <EyeOutlined />,
                onClick: () => navigate(`/towers/${record._id}`)
              },
              {
                key: 'edit',
                label: 'Edit Tower',
                icon: <EditOutlined />,
                disabled: !hasPermission('project_management')
              },
              {
                key: 'units',
                label: 'Manage Units',
                icon: <HomeOutlined />,
                onClick: () => navigate(`/units?tower=${record._id}`)
              },
              {
                type: 'divider'
              },
              {
                key: 'delete',
                label: 'Delete Tower',
                icon: <DeleteOutlined />,
                danger: true,
                disabled: !hasPermission('project_management')
              }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ]

  // Render project overview
  const renderOverview = () => (
    <motion.div variants={containerVariants}>
      <Row gutter={[24, 24]}>
        {/* Key Metrics */}
        <Col span={24}>
          <Card className="shadow-lg border-0 rounded-xl">
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Statistic
                  title="Total Units"
                  value={projectMetrics?.totalUnits || 0}
                  prefix={<HomeOutlined className="text-blue-500" />}
                  valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Statistic
                  title="Units Sold"
                  value={projectMetrics?.soldUnits || 0}
                  prefix={<CheckCircleOutlined className="text-green-500" />}
                  valueStyle={{ color: '#52c41a', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Statistic
                  title="Total Revenue"
                  value={projectMetrics?.totalRevenue || 0}
                  prefix={<DollarOutlined className="text-orange-500" />}
                  formatter={value => formatCurrency(value, true)}
                  valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Statistic
                  title="Completion"
                  value={projectMetrics?.completionPercentage || 0}
                  prefix={<TrophyOutlined className="text-purple-500" />}
                  suffix="%"
                  valueStyle={{ color: '#722ed1', fontSize: '24px', fontWeight: 'bold' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Charts Section */}
        <Col xs={24} lg={12}>
          <Card 
            title="Unit Status Distribution" 
            className="shadow-lg border-0 rounded-xl h-full"
          >
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={unitStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {unitStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title="Tower Performance" 
            className="shadow-lg border-0 rounded-xl h-full"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={towerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="sold" fill="#1890ff" name="Sold Units" />
                <Bar dataKey="available" fill="#52c41a" name="Available Units" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Project Details */}
        <Col span={24}>
          <Card 
            title="Project Information" 
            className="shadow-lg border-0 rounded-xl"
          >
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Project Name">
                {project?.data?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                <Space>
                  <MapPin className="w-4 h-4" />
                  {project?.data?.location}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">
                  {project?.data?.type?.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(project?.data?.status)}>
                  {getProjectStatusIcon(project?.data?.status)}
                  <span className="ml-1">{project?.data?.status}</span>
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Towers">
                {projectMetrics?.totalTowers || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {formatDate(project?.data?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Revenue Target">
                {formatCurrency(project?.data?.revenueTarget || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="Average Unit Price">
                {formatCurrency(projectMetrics?.averageUnitPrice || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="Sales Progress">
                <Progress
                  percent={projectMetrics?.salesPercentage || 0}
                  size="small"
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#1890ff'
                  }}
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </motion.div>
  )

  // Render towers section
  const renderTowers = () => (
    <motion.div variants={containerVariants}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card 
            title="Tower Management"
            className="shadow-lg border-0 rounded-xl"
            extra={
              hasPermission('project_management') && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateTowerModalVisible(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                >
                  Add Tower
                </Button>
              )
            }
          >
            <Table
              columns={towerColumns}
              dataSource={towers?.data || []}
              loading={towersLoading}
              rowKey="_id"
              pagination={false}
              className="rounded-lg"
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  )

  // Render analytics section
  const renderAnalytics = () => (
    <motion.div variants={containerVariants}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card className="shadow-lg border-0 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <Title level={4} className="mb-0">Project Analytics</Title>
              <Select
                value={selectedTimeRange}
                onChange={setSelectedTimeRange}
                className="w-32"
              >
                <Select.Option value="7d">Last 7 Days</Select.Option>
                <Select.Option value="30d">Last 30 Days</Select.Option>
                <Select.Option value="90d">Last 90 Days</Select.Option>
                <Select.Option value="1y">Last Year</Select.Option>
              </Select>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center items-center py-20">
                <Spin size="large" tip="Loading analytics..." />
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="Revenue Trend" className="h-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={projectAnalytics?.revenueData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#1890ff"
                          fill="url(#colorRevenue)"
                        />
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="Sales Pipeline" className="h-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={projectAnalytics?.salesData || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <RechartsTooltip />
                        <Line
                          type="monotone"
                          dataKey="leads"
                          stroke="#52c41a"
                          strokeWidth={2}
                          name="Leads"
                        />
                        <Line
                          type="monotone"
                          dataKey="conversions"
                          stroke="#1890ff"
                          strokeWidth={2}
                          name="Conversions"
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </motion.div>
  )

  // Render settings section
  const renderSettings = () => (
    <motion.div variants={containerVariants}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Alert
            message="Settings Panel"
            description="Project settings and configuration options will be implemented here."
            type="info"
            showIcon
            className="mb-6"
          />
        </Col>
      </Row>
    </motion.div>
  )

  // Edit project modal
  const renderEditModal = () => (
    <Modal
      title="Edit Project"
      open={editModalVisible}
      onCancel={() => setEditModalVisible(false)}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleUpdateProject}
        initialValues={project?.data}
      >
        <Form.Item
          name="name"
          label="Project Name"
          rules={[{ required: true, message: 'Please enter project name' }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true, message: 'Please enter location' }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select status' }]}
        >
          <Select size="large">
            {Object.values(PROJECT_STATUS).map(status => (
              <Select.Option key={status} value={status}>
                {status}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setEditModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={updateProjectMutation.isLoading}
            >
              Update Project
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )

  // Create tower modal
  const renderCreateTowerModal = () => (
    <Modal
      title="Create New Tower"
      open={createTowerModalVisible}
      onCancel={() => setCreateTowerModalVisible(false)}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        layout="vertical"
        onFinish={handleCreateTower}
      >
        <Form.Item
          name="towerName"
          label="Tower Name"
          rules={[{ required: true, message: 'Please enter tower name' }]}
        >
          <Input size="large" placeholder="e.g., Tower A" />
        </Form.Item>

        <Form.Item
          name="towerCode"
          label="Tower Code"
          rules={[{ required: true, message: 'Please enter tower code' }]}
        >
          <Input size="large" placeholder="e.g., T-A" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="totalFloors"
              label="Total Floors"
              rules={[{ required: true, message: 'Please enter total floors' }]}
            >
              <InputNumber
                min={1}
                max={200}
                className="w-full"
                size="large"
                placeholder="e.g., 20"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unitsPerFloor"
              label="Units per Floor"
              rules={[{ required: true, message: 'Please enter units per floor' }]}
            >
              <InputNumber
                min={1}
                max={50}
                className="w-full"
                size="large"
                placeholder="e.g., 4"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setCreateTowerModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={createTowerMutation.isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
            >
              Create Tower
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )

  if (projectError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <Title level={3} className="text-gray-800 mb-2">
            Project not found
          </Title>
          <Text className="text-gray-600 mb-4">
            The project you're looking for doesn't exist or has been deleted.
          </Text>
          <Button type="primary" onClick={() => navigate('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading project details..." />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/projects')}
                className="flex items-center"
              >
                Back to Projects
              </Button>
              
              <Divider type="vertical" />
              
              <div>
                <Title level={2} className="mb-1">
                  {project?.data?.name}
                </Title>
                <div className="flex items-center space-x-4">
                  <Tag color={getStatusColor(project?.data?.status)}>
                    {getProjectStatusIcon(project?.data?.status)}
                    <span className="ml-1">{project?.data?.status}</span>
                  </Tag>
                  <Space>
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <Text type="secondary">{project?.data?.location}</Text>
                  </Space>
                </div>
              </div>
            </div>
            
            {hasPermission('project_management') && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditModalVisible(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
              >
                Edit Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="bg-white rounded-xl shadow-lg"
          tabBarStyle={{ 
            padding: '0 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px 12px 0 0'
          }}
        >
          <TabPane
            tab={
              <span className="flex items-center space-x-2 text-white">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </span>
            }
            key="overview"
          >
            <div className="p-6">
              {renderOverview()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center space-x-2 text-white">
                <Building2 className="w-4 h-4" />
                <span>Towers</span>
              </span>
            }
            key="towers"
          >
            <div className="p-6">
              {renderTowers()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center space-x-2 text-white">
                <PieChart className="w-4 h-4" />
                <span>Analytics</span>
              </span>
            }
            key="analytics"
          >
            <div className="p-6">
              {renderAnalytics()}
            </div>
          </TabPane>

          <TabPane
            tab={
              <span className="flex items-center space-x-2 text-white">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </span>
            }
            key="settings"
          >
            <div className="p-6">
              {renderSettings()}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* Modals */}
      {renderEditModal()}
      {renderCreateTowerModal()}
    </motion.div>
  )
}

export default ProjectDetailsPage
