// =============================================================================
// File: src/pages/projects/ProjectsPage.jsx
// Description: Complete project management hub with advanced features
// Features: Project cards, filtering, search, analytics, creation wizard
// Dependencies: Ant Design, React Query, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Badge,
  Progress,
  Statistic,
  Dropdown,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Tag,
  Empty,
  Spin,
  Tooltip,
  Avatar,
  Divider,
  message,
  Popconfirm,
  Drawer,
  Radio,
  Slider,
  Collapse
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  HomeOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PauseCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  CopyOutlined,
  StarOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  FireOutlined,
  BankOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  UserOutlined,
  BuildOutlined,
  ShoppingOutlined
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
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Star,
  Award,
  Zap,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Settings,
  Copy,
  BarChart3,
  PieChart,
  Layers,
  Globe,
  ChevronRight,
  Sparkles,
  Crown,
  Flame,
  Rocket
} from 'lucide-react'
import { projectAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { 
  PROJECT_TYPES, 
  PROJECT_STATUS, 
  STATUS_COLORS,
  USER_ROLES 
} from '../../constants'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor,
  truncateText 
} from '../../utils/helpers'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Panel } = Collapse

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

const ProjectsPage = () => {
  // Hooks
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form] = Form.useForm()
  
  // Store state
  const { user, hasPermission } = useAuthStore()
  const { setPageTitle, setPageLoading } = useAppStore()
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [showFilters, setShowFilters] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  
  // Advanced filters
  const [priceRange, setPriceRange] = useState([0, 10000000000])
  const [dateRange, setDateRange] = useState(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Set page title
  useEffect(() => {
    setPageTitle('Project Management')
  }, [setPageTitle])

  // API Queries
  const { 
    data: projects = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['projects', searchTerm, selectedStatus, selectedType, sortBy, sortOrder],
    queryFn: () => projectAPI.getProjects({
      search: searchTerm,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      sortBy,
      sortOrder,
      limit: 100
    }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: projectAPI.createProject,
    onSuccess: (data) => {
      message.success('Project created successfully!')
      setCreateModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries(['projects'])
      
      // Navigate to project details
      navigate(`/projects/${data.data._id}`)
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create project')
    }
  })

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: projectAPI.deleteProject,
    onSuccess: () => {
      message.success('Project deleted successfully!')
      queryClient.invalidateQueries(['projects'])
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete project')
    }
  })

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.data || []
    
    // Apply advanced filters
    if (dateRange) {
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.createdAt)
        return projectDate >= dateRange[0] && projectDate <= dateRange[1]
      })
    }
    
    if (priceRange[0] > 0 || priceRange[1] < 10000000000) {
      filtered = filtered.filter(project => {
        const revenue = project.revenueTarget || 0
        return revenue >= priceRange[0] && revenue <= priceRange[1]
      })
    }
    
    return filtered
  }, [projects.data, dateRange, priceRange])

  // Handle project creation
  const handleCreateProject = async (values) => {
    try {
      setPageLoading(true)
      await createProjectMutation.mutateAsync(values)
    } catch (error) {
      console.error('Create project error:', error)
    } finally {
      setPageLoading(false)
    }
  }

  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProjectMutation.mutateAsync(projectId)
    } catch (error) {
      console.error('Delete project error:', error)
    }
  }

  // Project statistics
  const projectStats = useMemo(() => {
    const data = projects.data || []
    return {
      total: data.length,
      active: data.filter(p => p.status === PROJECT_STATUS.LAUNCHED).length,
      completed: data.filter(p => p.status === PROJECT_STATUS.COMPLETED).length,
      totalRevenue: data.reduce((sum, p) => sum + (p.revenueTarget || 0), 0),
      averageRevenue: data.length > 0 ? data.reduce((sum, p) => sum + (p.revenueTarget || 0), 0) / data.length : 0
    }
  }, [projects.data])

  // Get project status icon
  const getProjectStatusIcon = (status) => {
    const icons = {
      [PROJECT_STATUS.PLANNING]: <ClockCircleOutlined />,
      [PROJECT_STATUS.PRE_LAUNCH]: <RocketOutlined />,
      [PROJECT_STATUS.LAUNCHED]: <CheckCircleOutlined />,
      [PROJECT_STATUS.UNDER_CONSTRUCTION]: <BuildOutlined />,
      [PROJECT_STATUS.READY_TO_MOVE]: <HomeOutlined />,
      [PROJECT_STATUS.COMPLETED]: <TrophyOutlined />,
      [PROJECT_STATUS.ON_HOLD]: <PauseCircleOutlined />,
      [PROJECT_STATUS.CANCELLED]: <ExclamationCircleOutlined />
    }
    return icons[status] || <ClockCircleOutlined />
  }

  // Project type icons
  const getProjectTypeIcon = (type) => {
    const icons = {
      [PROJECT_TYPES.RESIDENTIAL]: <HomeOutlined />,
      [PROJECT_TYPES.COMMERCIAL]: <BankOutlined />,
      [PROJECT_TYPES.MIXED_USE]: <ShoppingOutlined />,
      [PROJECT_TYPES.INDUSTRIAL]: <BuildOutlined />,
      [PROJECT_TYPES.HOSPITALITY]: <GlobalOutlined />
    }
    return icons[type] || <HomeOutlined />
  }

  // Render project card
  const renderProjectCard = (project) => {
    const progress = project.completionPercentage || 0
    const statusColor = getStatusColor(project.status)
    
    return (
      <motion.div
        key={project._id}
        variants={cardVariants}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card
          className="h-full shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px'
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Card Header */}
          <div className="relative p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {getProjectTypeIcon(project.type)}
                </div>
                <div>
                  <Title level={4} className="text-white mb-1 truncate max-w-[200px]">
                    {project.name}
                  </Title>
                  <div className="flex items-center space-x-2 text-white/80">
                    <MapPin className="w-4 h-4" />
                    <Text className="text-white/80 text-sm">
                      {truncateText(project.location, 25)}
                    </Text>
                  </div>
                </div>
              </div>
              
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'view',
                      label: 'View Details',
                      icon: <EyeOutlined />,
                      onClick: () => navigate(`/projects/${project._id}`)
                    },
                    {
                      key: 'edit',
                      label: 'Edit Project',
                      icon: <EditOutlined />,
                      onClick: () => setSelectedProject(project),
                      disabled: !hasPermission('project_management')
                    },
                    {
                      key: 'analytics',
                      label: 'View Analytics',
                      icon: <BarChartOutlined />,
                      onClick: () => navigate(`/projects/${project._id}/analytics`)
                    },
                    {
                      key: 'duplicate',
                      label: 'Duplicate',
                      icon: <CopyOutlined />,
                      disabled: !hasPermission('project_management')
                    },
                    {
                      type: 'divider'
                    },
                    {
                      key: 'delete',
                      label: 'Delete Project',
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => {
                        Modal.confirm({
                          title: 'Delete Project',
                          content: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
                          okText: 'Delete',
                          okType: 'danger',
                          cancelText: 'Cancel',
                          onOk: () => handleDeleteProject(project._id)
                        })
                      },
                      disabled: !hasPermission('project_management')
                    }
                  ]
                }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  className="text-white hover:bg-white/10 border-0"
                  size="small"
                />
              </Dropdown>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-between mb-4">
              <Tag 
                color={statusColor} 
                className="px-3 py-1 rounded-full border-0 text-sm font-medium"
              >
                {getProjectStatusIcon(project.status)}
                <span className="ml-1">{project.status}</span>
              </Tag>
              
              {project.featured && (
                <Badge.Ribbon text="Featured" color="gold">
                  <StarOutlined className="text-yellow-300" />
                </Badge.Ribbon>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Text className="text-white/80 text-sm">Completion</Text>
                <Text className="text-white font-medium">{progress}%</Text>
              </div>
              <Progress
                percent={progress}
                showInfo={false}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#1890ff'
                }}
                trailColor="rgba(255,255,255,0.2)"
                strokeWidth={6}
              />
            </div>
          </div>

          {/* Card Content */}
          <div className="bg-white p-6">
            {/* Key Metrics */}
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={8}>
                <Statistic
                  title="Total Units"
                  value={project.totalUnits || 0}
                  prefix={<HomeOutlined className="text-blue-500" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Revenue Target"
                  value={project.revenueTarget || 0}
                  prefix={<DollarOutlined className="text-green-500" />}
                  formatter={value => formatCurrency(value, true)}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Towers"
                  value={project.towersCount || 0}
                  prefix={<BankOutlined className="text-purple-500" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </Col>
            </Row>

            {/* Project Type and Timeline */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Tag color="blue" className="rounded-full">
                  {project.type?.replace('_', ' ')}
                </Tag>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <CalendarOutlined />
                  <span>Created {formatDate(project.createdAt, 'MMM DD, yyyy')}</span>
                </div>
              </div>
              
              <Button
                type="primary"
                size="small"
                onClick={() => navigate(`/projects/${project._id}`)}
                className="rounded-full"
              >
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Create project modal
  const renderCreateModal = () => (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span>Create New Project</span>
        </div>
      }
      open={createModalVisible}
      onCancel={() => setCreateModalVisible(false)}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateProject}
        className="mt-6"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="name"
              label="Project Name"
              rules={[
                { required: true, message: 'Please enter project name' },
                { min: 3, message: 'Project name must be at least 3 characters' }
              ]}
            >
              <Input
                placeholder="Enter project name"
                size="large"
                prefix={<Building2 className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="type"
              label="Project Type"
              rules={[{ required: true, message: 'Please select project type' }]}
            >
              <Select placeholder="Select type" size="large">
                {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                  <Option key={key} value={value}>
                    <div className="flex items-center space-x-2">
                      {getProjectTypeIcon(value)}
                      <span>{value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="status"
              label="Status"
              initialValue={PROJECT_STATUS.PLANNING}
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select size="large">
                {Object.values(PROJECT_STATUS).map(status => (
                  <Option key={status} value={status}>
                    <div className="flex items-center space-x-2">
                      {getProjectStatusIcon(status)}
                      <span>{status}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please enter location' }]}
            >
              <Input 
                placeholder="Enter project location"
                size="large"
                prefix={<MapPin className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea 
                rows={4} 
                placeholder="Enter project description"
                className="resize-none"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="totalUnits"
              label="Total Units (Estimated)"
            >
              <InputNumber 
                min={1} 
                placeholder="Enter total units"
                className="w-full"
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="revenueTarget"
              label="Revenue Target"
            >
              <InputNumber 
                min={0} 
                placeholder="Enter revenue target"
                className="w-full"
                size="large"
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setCreateModalVisible(false)}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={createProjectMutation.isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                >
                  Create Project
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <Title level={3} className="text-gray-800 mb-2">
            Failed to load projects
          </Title>
          <Text className="text-gray-600 mb-4">
            {error.message || 'Something went wrong while loading projects'}
          </Text>
          <Button type="primary" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
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
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="mb-2 text-gray-800">
                Project Management
              </Title>
              <Text className="text-gray-600">
                Manage your real estate projects efficiently
              </Text>
            </div>
            
            {hasPermission('project_management') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                size="large"
                className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center shadow-lg border-0 rounded-xl">
              <Statistic
                title="Total Projects"
                value={projectStats.total}
                prefix={<Building2 className="text-blue-500" />}
                valueStyle={{ 
                  color: '#1890ff', 
                  fontSize: '24px', 
                  fontWeight: 'bold' 
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center shadow-lg border-0 rounded-xl">
              <Statistic
                title="Active Projects"
                value={projectStats.active}
                prefix={<Rocket className="text-green-500" />}
                valueStyle={{ 
                  color: '#52c41a', 
                  fontSize: '24px', 
                  fontWeight: 'bold' 
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center shadow-lg border-0 rounded-xl">
              <Statistic
                title="Completed"
                value={projectStats.completed}
                prefix={<CheckCircle className="text-purple-500" />}
                valueStyle={{ 
                  color: '#722ed1', 
                  fontSize: '24px', 
                  fontWeight: 'bold' 
                }}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="text-center shadow-lg border-0 rounded-xl">
              <Statistic
                title="Total Revenue Target"
                value={projectStats.totalRevenue}
                prefix={<DollarSign className="text-orange-500" />}
                formatter={value => formatCurrency(value, true)}
                valueStyle={{ 
                  color: '#fa8c16', 
                  fontSize: '24px', 
                  fontWeight: 'bold' 
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <Card className="shadow-lg border-0 rounded-xl">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Input
                placeholder="Search projects..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </Col>
            
            <Col xs={24} md={4}>
              <Select
                placeholder="Status"
                value={selectedStatus}
                onChange={setSelectedStatus}
                size="large"
                className="w-full"
              >
                <Option value="all">All Status</Option>
                {Object.values(PROJECT_STATUS).map(status => (
                  <Option key={status} value={status}>
                    {status}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} md={4}>
              <Select
                placeholder="Type"
                value={selectedType}
                onChange={setSelectedType}
                size="large"
                className="w-full"
              >
                <Option value="all">All Types</Option>
                {Object.values(PROJECT_TYPES).map(type => (
                  <Option key={type} value={type}>
                    {type.replace('_', ' ')}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} md={4}>
              <Select
                placeholder="Sort by"
                value={sortBy}
                onChange={setSortBy}
                size="large"
                className="w-full"
              >
                <Option value="createdAt">Date Created</Option>
                <Option value="name">Name</Option>
                <Option value="revenueTarget">Revenue Target</Option>
                <Option value="completionPercentage">Progress</Option>
              </Select>
            </Col>
            
            <Col xs={24} md={4}>
              <div className="flex items-center space-x-2">
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex-1"
                  size="large"
                >
                  Filters
                </Button>
                
                <Radio.Group
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  size="large"
                >
                  <Radio.Button value="grid">Grid</Radio.Button>
                  <Radio.Button value="list">List</Radio.Button>
                </Radio.Group>
              </div>
            </Col>
          </Row>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong className="block mb-2">Revenue Target Range</Text>
                  <Slider
                    range
                    value={priceRange}
                    onChange={setPriceRange}
                    min={0}
                    max={10000000000}
                    step={1000000}
                    tooltip={{
                      formatter: (value) => formatCurrency(value, true)
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{formatCurrency(priceRange[0], true)}</span>
                    <span>{formatCurrency(priceRange[1], true)}</span>
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  <Text strong className="block mb-2">Date Range</Text>
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    className="w-full"
                    size="large"
                  />
                </Col>
              </Row>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" tip="Loading projects..." />
            </div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No projects found"
              >
                {hasPermission('project_management') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                  >
                    Create Your First Project
                  </Button>
                )}
              </Empty>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
            >
              <Row gutter={[24, 24]}>
                {filteredProjects.map((project) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={project._id}>
                    {renderProjectCard(project)}
                  </Col>
                ))}
              </Row>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Project Modal */}
      {renderCreateModal()}
    </motion.div>
  )
}

export default ProjectsPage
