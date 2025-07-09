// =============================================================================
// File: src/pages/projects/ProjectsPage.jsx
// Description: Advanced project management page with grid/list views, filtering, and analytics
// Features: Project CRUD, advanced filtering, search, role-based actions, export capabilities
// Dependencies: Ant Design, React Query, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect } from 'react'
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
  DatePicker,
  Space,
  Typography,
  Tag,
  Progress,
  Avatar,
  Dropdown,
  Badge,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  message,
  Spin,
  Empty,
  Drawer,
  Radio,
  Divider,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  BarsOutlined,
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExportOutlined,
  SettingOutlined,
  TeamOutlined,
  HomeOutlined,
  DollarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Home,
  DollarSign,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { projectAPI } from '../../services/api'
import { formatCurrency, formatCurrencyShort, formatDate, getStatusColor } from '../../utils/helpers'
import { PROJECT_TYPES, PROJECT_STATUS, STATUS_COLORS } from '../../constants'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { Search } = Input
const { confirm } = Modal

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

const listVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3
    }
  }
}

const ProjectsPage = () => {
  // Hooks
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Store state
  const { user, hasPermission, isManagement } = useAuthStore()
  const { 
    projectFilters, 
    setProjectFilters, 
    searchQuery, 
    setSearchQuery,
    setCurrentProject 
  } = useAppStore()

  // Local state
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedProjects, setSelectedProjects] = useState([])
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [form] = Form.useForm()

  // API Queries
  const { 
    data: projectsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['projects', projectFilters, searchQuery, sortBy, sortOrder],
    queryFn: () => projectAPI.getProjects({
      ...projectFilters,
      search: searchQuery,
      sortBy,
      sortOrder,
      page: 1,
      limit: 50
    }),
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: projectAPI.createProject,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateModalVisible(false)
      form.resetFields()
      message.success('Project created successfully!')
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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      message.success('Project deleted successfully!')
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete project')
    }
  })

  const projects = projectsData?.data?.projects || []

  // Handle create project
  const handleCreateProject = async (values) => {
    try {
      await createProjectMutation.mutateAsync(values)
    } catch (error) {
      console.error('Create project error:', error)
    }
  }

  // Handle delete project
  const handleDeleteProject = (projectId, projectName) => {
    confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => deleteProjectMutation.mutate(projectId)
    })
  }

  // Handle export
  const handleExport = () => {
    // In a real app, this would generate and download a file
    message.success('Export functionality will be implemented soon!')
  }

  // Get project status icon and color
  const getStatusDisplay = (status) => {
    const statusConfig = {
      [PROJECT_STATUS.PLANNING]: { 
        icon: <ClockCircleOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.PLANNING] 
      },
      [PROJECT_STATUS.PRE_LAUNCH]: { 
        icon: <ThunderboltOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.PRE_LAUNCH] 
      },
      [PROJECT_STATUS.LAUNCHED]: { 
        icon: <CheckCircleOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.LAUNCHED] 
      },
      [PROJECT_STATUS.UNDER_CONSTRUCTION]: { 
        icon: <BarChartOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.UNDER_CONSTRUCTION] 
      },
      [PROJECT_STATUS.READY_TO_MOVE]: { 
        icon: <HomeOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.READY_TO_MOVE] 
      },
      [PROJECT_STATUS.COMPLETED]: { 
        icon: <CheckCircleOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.COMPLETED] 
      },
      [PROJECT_STATUS.ON_HOLD]: { 
        icon: <ExclamationCircleOutlined />, 
        color: STATUS_COLORS[PROJECT_STATUS.ON_HOLD] 
      }
    }
    return statusConfig[status] || { icon: <ClockCircleOutlined />, color: '#8c8c8c' }
  }

  // Project action menu
  const getProjectActions = (project) => {
    const actions = [
      {
        key: 'view',
        label: 'View Details',
        icon: <EyeOutlined />,
        onClick: () => {
          setCurrentProject(project)
          navigate(`/projects/${project._id}`)
        }
      }
    ]

    if (hasPermission('project_management')) {
      actions.push(
        {
          key: 'edit',
          label: 'Edit Project',
          icon: <EditOutlined />,
          onClick: () => navigate(`/projects/${project._id}/edit`)
        },
        {
          key: 'analytics',
          label: 'View Analytics',
          icon: <BarChartOutlined />,
          onClick: () => navigate(`/projects/${project._id}/analytics`)
        }
      )
    }

    if (isManagement()) {
      actions.push(
        { type: 'divider' },
        {
          key: 'delete',
          label: 'Delete Project',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDeleteProject(project._id, project.name)
        }
      )
    }

    return { items: actions }
  }

  // Project Card Component
  const ProjectCard = ({ project }) => {
    const statusDisplay = getStatusDisplay(project.status)
    const completionPercentage = project.analytics?.completionPercentage || 0
    const totalUnits = project.analytics?.totalUnits || 0
    const soldUnits = project.analytics?.soldUnits || 0

    return (
      <motion.div variants={cardVariants}>
        <Card
          className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer"
          bodyStyle={{ padding: '20px' }}
          onClick={() => {
            setCurrentProject(project)
            navigate(`/projects/${project._id}`)
          }}
        >
          {/* Header with status and actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Tag 
                  icon={statusDisplay.icon} 
                  color={statusDisplay.color}
                  className="mb-0"
                >
                  {project.status}
                </Tag>
                <Tag color="blue">{project.type}</Tag>
              </div>
              <Title level={4} className="m-0 mb-2 line-clamp-2">
                {project.name}
              </Title>
            </div>
            <Dropdown
              menu={getProjectActions(project)}
              trigger={['click']}
              onClick={(e) => e.stopPropagation()}
            >
              <Button 
                type="text" 
                icon={<MoreOutlined />} 
                size="small"
                className="text-gray-400 hover:text-gray-600"
              />
            </Dropdown>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2 mb-3 text-gray-600">
            <MapPin className="w-4 h-4" />
            <Text className="text-sm">{project.location || 'Location not specified'}</Text>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalUnits}</div>
              <div className="text-xs text-gray-500">Total Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{soldUnits}</div>
              <div className="text-xs text-gray-500">Sold Units</div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-sm font-medium">Progress</Text>
              <Text className="text-sm text-gray-500">{completionPercentage}%</Text>
            </div>
            <Progress 
              percent={completionPercentage} 
              size="small" 
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              showInfo={false}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Text className="text-sm text-gray-500">
                {formatDate(project.createdAt, 'MMM yyyy')}
              </Text>
            </div>
            {project.revenue && (
              <Text className="text-sm font-semibold text-green-600">
                {formatCurrencyShort(project.revenue)}
              </Text>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  // Project List Item Component
  const ProjectListItem = ({ project }) => {
    const statusDisplay = getStatusDisplay(project.status)

    return (
      <motion.div variants={itemVariants}>
        <Card 
          className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
          bodyStyle={{ padding: '16px' }}
          onClick={() => {
            setCurrentProject(project)
            navigate(`/projects/${project._id}`)
          }}
        >
          <Row align="middle" gutter={16}>
            {/* Project Info */}
            <Col xs={24} md={8}>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Title level={5} className="m-0">{project.name}</Title>
                  <Tag 
                    icon={statusDisplay.icon} 
                    color={statusDisplay.color}
                    size="small"
                  >
                    {project.status}
                  </Tag>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <Text className="text-sm">{project.location}</Text>
                </div>
              </div>
            </Col>

            {/* Metrics */}
            <Col xs={24} md={12}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic 
                    title="Units" 
                    value={project.analytics?.totalUnits || 0}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Sold" 
                    value={project.analytics?.soldUnits || 0}
                    valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="Revenue" 
                    value={formatCurrencyShort(project.revenue || 0)}
                    valueStyle={{ fontSize: '16px', color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Progress</div>
                    <Progress 
                      percent={project.analytics?.completionPercentage || 0}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Actions */}
            <Col xs={24} md={4} className="text-right">
              <Dropdown
                menu={getProjectActions(project)}
                trigger={['click']}
                onClick={(e) => e.stopPropagation()}
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            </Col>
          </Row>
        </Card>
      </motion.div>
    )
  }

  // Filter Drawer
  const FilterDrawer = () => (
    <Drawer
      title="Filter Projects"
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={350}
    >
      <div className="space-y-6">
        {/* Status Filter */}
        <div>
          <Text className="block font-medium mb-2">Status</Text>
          <Select
            value={projectFilters.status}
            onChange={(value) => setProjectFilters({ status: value })}
            placeholder="Select status"
            className="w-full"
            allowClear
          >
            <Option value="all">All Statuses</Option>
            {Object.values(PROJECT_STATUS).map(status => (
              <Option key={status} value={status}>{status}</Option>
            ))}
          </Select>
        </div>

        {/* Type Filter */}
        <div>
          <Text className="block font-medium mb-2">Project Type</Text>
          <Select
            value={projectFilters.type}
            onChange={(value) => setProjectFilters({ type: value })}
            placeholder="Select type"
            className="w-full"
            allowClear
          >
            <Option value="all">All Types</Option>
            {Object.entries(PROJECT_TYPES).map(([key, value]) => (
              <Option key={key} value={value}>
                {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Option>
            ))}
          </Select>
        </div>

        {/* Location Filter */}
        <div>
          <Text className="block font-medium mb-2">Location</Text>
          <Input
            value={projectFilters.location}
            onChange={(e) => setProjectFilters({ location: e.target.value })}
            placeholder="Enter location"
          />
        </div>

        {/* Date Range Filter */}
        <div>
          <Text className="block font-medium mb-2">Created Date</Text>
          <RangePicker
            value={projectFilters.dateRange}
            onChange={(dates) => setProjectFilters({ dateRange: dates })}
            className="w-full"
          />
        </div>

        {/* Clear Filters */}
        <div>
          <Button 
            block 
            onClick={() => {
              setProjectFilters({
                status: 'all',
                type: 'all',
                location: 'all',
                dateRange: null
              })
              setSearchQuery('')
            }}
          >
            Clear All Filters
          </Button>
        </div>
      </div>
    </Drawer>
  )

  // Create Project Modal
  const CreateProjectModal = () => (
    <Modal
      title="Create New Project"
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
        onFinish={handleCreateProject}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Project Name"
              rules={[
                { required: true, message: 'Please enter project name' },
                { min: 3, message: 'Project name must be at least 3 characters' }
              ]}
            >
              <Input placeholder="Enter project name" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="type"
              label="Project Type"
              rules={[{ required: true, message: 'Please select project type' }]}
            >
              <Select placeholder="Select type">
                {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                  <Option key={key} value={value}>
                    {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
              <Select>
                {Object.values(PROJECT_STATUS).map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="location"
              label="Location"
              rules={[{ required: true, message: 'Please enter location' }]}
            >
              <Input placeholder="Enter project location" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Enter project description" 
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
                formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/₹\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <div className="flex justify-end space-x-2 mt-6">
          <Button onClick={() => setCreateModalVisible(false)}>
            Cancel
          </Button>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={createProjectMutation.isPending}
          >
            Create Project
          </Button>
        </div>
      </Form>
    </Modal>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Loading projects..." />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <Empty
          description="Failed to load projects"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Empty>
      </Card>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Page Header */}
      <motion.div variants={cardVariants}>
        <Card>
          <Row align="middle" justify="space-between">
            <Col xs={24} md={12}>
              <div>
                <Title level={2} className="m-0 mb-2">
                  Projects
                </Title>
                <Text className="text-gray-600">
                  Manage your real estate projects and track their progress
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12} className="text-right">
              <Space wrap>
                {/* View Mode Toggle */}
                <Radio.Group 
                  value={viewMode} 
                  onChange={(e) => setViewMode(e.target.value)}
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="grid">
                    <Grid3X3 className="w-4 h-4" />
                  </Radio.Button>
                  <Radio.Button value="list">
                    <List className="w-4 h-4" />
                  </Radio.Button>
                </Radio.Group>

                {/* Export */}
                {isManagement() && (
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                )}

                {/* Create Project */}
                {hasPermission('project_management') && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    Create Project
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={cardVariants}>
        <Card>
          <Row gutter={16} align="middle">
            <Col xs={24} md={12}>
              <Search
                placeholder="Search projects by name, location..."
                allowClear
                size="large"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={setSearchQuery}
              />
            </Col>
            <Col xs={24} md={12} className="text-right">
              <Space wrap>
                {/* Sort Options */}
                <Select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(value) => {
                    const [field, order] = value.split('-')
                    setSortBy(field)
                    setSortOrder(order)
                  }}
                  style={{ width: 200 }}
                >
                  <Option value="createdAt-desc">Newest First</Option>
                  <Option value="createdAt-asc">Oldest First</Option>
                  <Option value="name-asc">Name A-Z</Option>
                  <Option value="name-desc">Name Z-A</Option>
                  <Option value="status-asc">Status</Option>
                </Select>

                {/* Filter Button */}
                <Badge 
                  count={Object.values(projectFilters).filter(v => v && v !== 'all').length}
                  size="small"
                >
                  <Button 
                    icon={<FilterOutlined />}
                    onClick={() => setFilterDrawerVisible(true)}
                  >
                    Filters
                  </Button>
                </Badge>
              </Space>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Projects List/Grid */}
      <AnimatePresence mode="wait">
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <Empty
                description="No projects found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {hasPermission('project_management') && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                  >
                    Create Your First Project
                  </Button>
                )}
              </Empty>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            variants={listVariants}
            initial="initial"
            animate="animate"
            exit="initial"
          >
            {viewMode === 'grid' ? (
              <Row gutter={[24, 24]}>
                {projects.map(project => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={project._id}>
                    <ProjectCard project={project} />
                  </Col>
                ))}
              </Row>
            ) : (
              <div>
                {projects.map(project => (
                  <ProjectListItem key={project._id} project={project} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers and Modals */}
      <FilterDrawer />
      <CreateProjectModal />
    </motion.div>
  )
}

export default ProjectsPage