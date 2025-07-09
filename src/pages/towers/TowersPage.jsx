// =============================================================================
// File: src/pages/towers/TowersPage.jsx
// Description: Complete tower management interface with floor plans and analytics
// Features: Tower cards, floor visualization, unit distribution, construction tracking
// Dependencies: Ant Design, React Query, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  Switch,
  Tag,
  Empty,
  Spin,
  Tooltip,
  Avatar,
  Divider,
  message,
  Popconfirm,
  Timeline,
  Steps,
  Collapse,
  List,
  Descriptions,
  Tabs,
  Radio,
  Slider,
  DatePicker,
  Alert,
  Drawer
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
  BuildOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  DollarOutlined,
  TrophyOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FireOutlined,
  StarOutlined,
  CrownOutlined,
  ToolOutlined,
  SlidersOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FundProjectionScreenOutlined,
  ApartmentOutlined,
  UpOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined
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
  BarChart3,
  PieChart,
  Layers,
  Construction,
  Wrench,
  Crown,
  Flame,
  Rocket,
  Grid,
  List as ListIcon,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  RotateCcw,
  Move3D
} from 'lucide-react'

import { towerAPI, projectAPI, unitAPI, analyticsAPI } from '../../services/api'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { 
  PROJECT_STATUS,
  UNIT_STATUS,
  UNIT_TYPES,
  STATUS_COLORS 
} from '../../constants'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor,
  calculatePercentage 
} from '../../utils/helpers'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Panel } = Collapse
const { TabPane } = Tabs

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

const floorVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
}

const TowersPage = () => {
  // Hooks
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  
  // Store state
  const { user, hasPermission } = useAuthStore()
  const { setPageTitle, setPageLoading } = useAppStore()
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || 'all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('grid') // grid, list, floor-plan
  const [showFilters, setShowFilters] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [selectedTower, setSelectedTower] = useState(null)
  const [floorPlanDrawerVisible, setFloorPlanDrawerVisible] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [floorZoom, setFloorZoom] = useState(1)
  
  // Advanced filters
  const [completionRange, setCompletionRange] = useState([0, 100])
  const [unitsRange, setUnitsRange] = useState([0, 1000])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Set page title
  useEffect(() => {
    setPageTitle('Tower Management')
  }, [setPageTitle])

  // API Queries
  const { 
    data: towers = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['towers', searchTerm, selectedProject, selectedStatus, sortBy, sortOrder],
    queryFn: () => towerAPI.getTowers({
      search: searchTerm,
      projectId: selectedProject !== 'all' ? selectedProject : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      sortBy,
      sortOrder,
      limit: 100
    }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  })

  const { 
    data: projects = [] 
  } = useQuery({
    queryKey: ['projects-for-filter'],
    queryFn: () => projectAPI.getProjects({ limit: 100 }),
    staleTime: 10 * 60 * 1000 // 10 minutes
  })

  const { 
    data: towerUnits = [] 
  } = useQuery({
    queryKey: ['tower-units', selectedTower?._id],
    queryFn: () => unitAPI.getUnits({ towerId: selectedTower._id }),
    enabled: !!selectedTower,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })

  // Create tower mutation
  const createTowerMutation = useMutation({
    mutationFn: towerAPI.createTower,
    onSuccess: (data) => {
      message.success('Tower created successfully!')
      setCreateModalVisible(false)
      form.resetFields()
      queryClient.invalidateQueries(['towers'])
      
      // Navigate to tower details
      navigate(`/towers/${data.data._id}`)
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to create tower')
    }
  })

  // Delete tower mutation
  const deleteTowerMutation = useMutation({
    mutationFn: towerAPI.deleteTower,
    onSuccess: () => {
      message.success('Tower deleted successfully!')
      queryClient.invalidateQueries(['towers'])
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete tower')
    }
  })

  // Filter and sort towers
  const filteredTowers = useMemo(() => {
    let filtered = towers.data || []
    
    // Apply advanced filters
    if (completionRange[0] > 0 || completionRange[1] < 100) {
      filtered = filtered.filter(tower => {
        const completion = tower.completionPercentage || 0
        return completion >= completionRange[0] && completion <= completionRange[1]
      })
    }
    
    if (unitsRange[0] > 0 || unitsRange[1] < 1000) {
      filtered = filtered.filter(tower => {
        const units = tower.totalUnits || 0
        return units >= unitsRange[0] && units <= unitsRange[1]
      })
    }
    
    return filtered
  }, [towers.data, completionRange, unitsRange])

  // Calculate tower statistics
  const towerStats = useMemo(() => {
    const data = filteredTowers || []
    const totalUnits = data.reduce((sum, tower) => sum + (tower.totalUnits || 0), 0)
    const soldUnits = data.reduce((sum, tower) => sum + (tower.soldUnits || 0), 0)
    const totalFloors = data.reduce((sum, tower) => sum + (tower.totalFloors || 0), 0)
    
    return {
      totalTowers: data.length,
      totalUnits,
      soldUnits,
      totalFloors,
      averageCompletion: data.length > 0 ? 
        data.reduce((sum, tower) => sum + (tower.completionPercentage || 0), 0) / data.length : 0,
      salesProgress: totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0
    }
  }, [filteredTowers])

  // Handle tower creation
  const handleCreateTower = async (values) => {
    try {
      setPageLoading(true)
      await createTowerMutation.mutateAsync(values)
    } catch (error) {
      console.error('Create tower error:', error)
    } finally {
      setPageLoading(false)
    }
  }

  // Handle tower deletion
  const handleDeleteTower = async (towerId) => {
    try {
      await deleteTowerMutation.mutateAsync(towerId)
    } catch (error) {
      console.error('Delete tower error:', error)
    }
  }

  // Get tower status icon
  const getTowerStatusIcon = (status) => {
    const icons = {
      'planning': <ClockCircleOutlined className="text-orange-500" />,
      'under_construction': <BuildOutlined className="text-blue-500" />,
      'completed': <CheckCircleOutlined className="text-green-500" />,
      'on_hold': <ExclamationCircleOutlined className="text-yellow-500" />
    }
    return icons[status] || <ClockCircleOutlined />
  }

  // Generate floor plan grid
  const generateFloorPlan = (tower, floor) => {
    const unitsPerFloor = tower.unitsPerFloor || 4
    const floorUnits = towerUnits?.data?.filter(unit => unit.floorNumber === floor) || []
    
    // Create grid layout (assuming rectangular layout)
    const rows = Math.ceil(Math.sqrt(unitsPerFloor))
    const cols = Math.ceil(unitsPerFloor / rows)
    
    const grid = []
    for (let row = 0; row < rows; row++) {
      const rowUnits = []
      for (let col = 0; col < cols; col++) {
        const unitIndex = row * cols + col
        if (unitIndex < unitsPerFloor) {
          const unit = floorUnits.find(u => u.unitNumber.endsWith(`${String(unitIndex + 1).padStart(2, '0')}`))
          rowUnits.push(unit)
        }
      }
      grid.push(rowUnits)
    }
    
    return grid
  }

  // Render unit cell in floor plan
  const renderUnitCell = (unit, index) => {
    if (!unit) {
      return (
        <div 
          key={index}
          className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center opacity-50"
        >
          <Text type="secondary" className="text-xs">Empty</Text>
        </div>
      )
    }

    const statusColors = {
      [UNIT_STATUS.AVAILABLE]: 'bg-green-100 border-green-300 text-green-800',
      [UNIT_STATUS.BLOCKED]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      [UNIT_STATUS.SOLD]: 'bg-blue-100 border-blue-300 text-blue-800',
      [UNIT_STATUS.BOOKED]: 'bg-purple-100 border-purple-300 text-purple-800'
    }

    return (
      <Tooltip
        key={unit._id}
        title={
          <div>
            <div className="font-medium">{unit.unitNumber}</div>
            <div className="text-sm">{unit.unitType}</div>
            <div className="text-sm">{formatCurrency(unit.currentPrice)}</div>
            <div className="text-sm">Status: {unit.status}</div>
          </div>
        }
      >
        <div 
          className={`
            w-16 h-16 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
            hover:scale-105 transition-transform duration-200
            ${statusColors[unit.status] || 'bg-gray-100 border-gray-300'}
          `}
          onClick={() => navigate(`/units/${unit._id}`)}
        >
          <Text className="text-xs font-medium truncate w-full text-center px-1">
            {unit.unitNumber.split('-').pop()}
          </Text>
          <Text className="text-xs opacity-75">
            {unit.unitType}
          </Text>
        </div>
      </Tooltip>
    )
  }

  // Render floor plan
  const renderFloorPlan = () => {
    if (!selectedTower) return null

    const floorGrid = generateFloorPlan(selectedTower, selectedFloor)
    
    return (
      <div className="flex flex-col items-center space-y-4">
        {/* Floor Navigation */}
        <div className="flex items-center space-x-4">
          <Button
            icon={<DownOutlined />}
            onClick={() => setSelectedFloor(Math.max(1, selectedFloor - 1))}
            disabled={selectedFloor <= 1}
          />
          <Text strong className="text-lg">
            Floor {selectedFloor} of {selectedTower.totalFloors}
          </Text>
          <Button
            icon={<UpOutlined />}
            onClick={() => setSelectedFloor(Math.min(selectedTower.totalFloors, selectedFloor + 1))}
            disabled={selectedFloor >= selectedTower.totalFloors}
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="small"
            icon={<Minimize />}
            onClick={() => setFloorZoom(Math.max(0.5, floorZoom - 0.1))}
          />
          <Text className="text-sm">{Math.round(floorZoom * 100)}%</Text>
          <Button
            size="small"
            icon={<Maximize />}
            onClick={() => setFloorZoom(Math.min(2, floorZoom + 0.1))}
          />
        </div>

        {/* Floor Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: floorZoom }}
          transition={{ duration: 0.3 }}
          className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200"
        >
          <div className="space-y-4">
            {floorGrid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex space-x-4 justify-center">
                {row.map((unit, colIndex) => renderUnitCell(unit, `${rowIndex}-${colIndex}`))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Legend */}
        <div className="flex items-center space-x-6 bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <Text className="text-sm">Available</Text>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <Text className="text-sm">Sold</Text>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
            <Text className="text-sm">Booked</Text>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <Text className="text-sm">Blocked</Text>
          </div>
        </div>
      </div>
    )
  }

  // Render tower card
  const renderTowerCard = (tower) => {
    const progress = tower.completionPercentage || 0
    const statusColor = getStatusColor(tower.status)
    const salesProgress = tower.totalUnits > 0 ? ((tower.soldUnits || 0) / tower.totalUnits) * 100 : 0
    
    return (
      <motion.div
        key={tower._id}
        variants={cardVariants}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card
          className="h-full shadow-lg hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden"
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
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Title level={4} className="text-white mb-1">
                    {tower.towerName}
                  </Title>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Text className="text-white/80 text-sm">
                      {tower.towerCode}
                    </Text>
                    <Divider type="vertical" className="bg-white/40" />
                    <Text className="text-white/80 text-sm">
                      {tower.project?.name}
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
                      onClick: () => navigate(`/towers/${tower._id}`)
                    },
                    {
                      key: 'floorplan',
                      label: 'Floor Plan',
                      icon: <ApartmentOutlined />,
                      onClick: () => {
                        setSelectedTower(tower)
                        setFloorPlanDrawerVisible(true)
                      }
                    },
                    {
                      key: 'units',
                      label: 'Manage Units',
                      icon: <HomeOutlined />,
                      onClick: () => navigate(`/units?tower=${tower._id}`)
                    },
                    {
                      key: 'edit',
                      label: 'Edit Tower',
                      icon: <EditOutlined />,
                      disabled: !hasPermission('project_management')
                    },
                    {
                      type: 'divider'
                    },
                    {
                      key: 'delete',
                      label: 'Delete Tower',
                      icon: <DeleteOutlined />,
                      danger: true,
                      onClick: () => {
                        Modal.confirm({
                          title: 'Delete Tower',
                          content: `Are you sure you want to delete "${tower.towerName}"? This action cannot be undone.`,
                          okText: 'Delete',
                          okType: 'danger',
                          cancelText: 'Cancel',
                          onOk: () => handleDeleteTower(tower._id)
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
                {getTowerStatusIcon(tower.status)}
                <span className="ml-1">{tower.status}</span>
              </Tag>
              
              {tower.featured && (
                <Badge.Ribbon text="Featured" color="gold">
                  <StarOutlined className="text-yellow-300" />
                </Badge.Ribbon>
              )}
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text className="text-white/80 text-sm">Construction</Text>
                  <Text className="text-white font-medium text-sm">{progress}%</Text>
                </div>
                <Progress
                  percent={progress}
                  showInfo={false}
                  strokeColor={{
                    '0%': '#52c41a',
                    '100%': '#1890ff'
                  }}
                  trailColor="rgba(255,255,255,0.2)"
                  strokeWidth={4}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Text className="text-white/80 text-sm">Sales</Text>
                  <Text className="text-white font-medium text-sm">{salesProgress.toFixed(1)}%</Text>
                </div>
                <Progress
                  percent={salesProgress}
                  showInfo={false}
                  strokeColor={{
                    '0%': '#faad14',
                    '100%': '#ff7a45'
                  }}
                  trailColor="rgba(255,255,255,0.2)"
                  strokeWidth={4}
                />
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="bg-white p-6">
            {/* Key Metrics */}
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={8}>
                <Statistic
                  title="Floors"
                  value={tower.totalFloors || 0}
                  prefix={<Layers className="text-blue-500 w-4 h-4" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Units"
                  value={tower.totalUnits || 0}
                  prefix={<Home className="text-green-500 w-4 h-4" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Sold"
                  value={tower.soldUnits || 0}
                  prefix={<CheckCircle className="text-purple-500 w-4 h-4" />}
                  valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </Col>
            </Row>

            {/* Tower Details */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Tag color="blue" className="rounded-full">
                  {tower.towerType}
                </Tag>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <CalendarOutlined />
                  <span>Created {formatDate(tower.createdAt, 'MMM dd, yyyy')}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="small"
                  icon={<FundProjectionScreenOutlined />}
                  onClick={() => {
                    setSelectedTower(tower)
                    setFloorPlanDrawerVisible(true)
                  }}
                  className="rounded-full"
                >
                  Floor Plan
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(`/towers/${tower._id}`)}
                  className="rounded-full"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Create tower modal
  const renderCreateModal = () => (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span>Create New Tower</span>
        </div>
      }
      open={createModalVisible}
      onCancel={() => setCreateModalVisible(false)}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateTower}
        className="mt-6"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="project"
              label="Project"
              rules={[{ required: true, message: 'Please select project' }]}
            >
              <Select placeholder="Select project" size="large">
                {projects.data?.map(project => (
                  <Option key={project._id} value={project._id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="towerName"
              label="Tower Name"
              rules={[
                { required: true, message: 'Please enter tower name' },
                { min: 2, message: 'Tower name must be at least 2 characters' }
              ]}
            >
              <Input
                placeholder="e.g., Tower A"
                size="large"
                prefix={<Building2 className="w-4 h-4 text-gray-400" />}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="towerCode"
              label="Tower Code"
              rules={[
                { required: true, message: 'Please enter tower code' },
                { max: 10, message: 'Tower code cannot exceed 10 characters' }
              ]}
            >
              <Input
                placeholder="e.g., T-A"
                size="large"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="towerType"
              label="Tower Type"
              rules={[{ required: true, message: 'Please select tower type' }]}
            >
              <Select placeholder="Select type" size="large">
                <Option value="residential">Residential</Option>
                <Option value="commercial">Commercial</Option>
                <Option value="mixed_use">Mixed Use</Option>
                <Option value="parking">Parking</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="totalFloors"
              label="Total Floors"
              rules={[
                { required: true, message: 'Please enter total floors' },
                { type: 'number', min: 1, max: 200, message: 'Floors must be between 1 and 200' }
              ]}
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

          <Col xs={24} md={12}>
            <Form.Item
              name="unitsPerFloor"
              label="Units per Floor"
              rules={[
                { required: true, message: 'Please enter units per floor' },
                { type: 'number', min: 1, max: 50, message: 'Units must be between 1 and 50' }
              ]}
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

          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Enter tower description (optional)"
                className="resize-none"
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
                  loading={createTowerMutation.isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                >
                  Create Tower
                </Button>
              </div>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )

  // Floor plan drawer
  const renderFloorPlanDrawer = () => (
    <Drawer
      title={
        <div className="flex items-center space-x-2">
          <ApartmentOutlined className="text-blue-500" />
          <span>{selectedTower?.towerName} - Floor Plan</span>
        </div>
      }
      open={floorPlanDrawerVisible}
      onClose={() => setFloorPlanDrawerVisible(false)}
      width="90%"
      placement="right"
      extra={
        <Button
          type="primary"
          onClick={() => navigate(`/units?tower=${selectedTower?._id}`)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
        >
          Manage Units
        </Button>
      }
    >
      {renderFloorPlan()}
    </Drawer>
  )

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <Title level={3} className="text-gray-800 mb-2">
            Failed to load towers
          </Title>
          <Text className="text-gray-600 mb-4">
            {error.message || 'Something went wrong while loading towers'}
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
                Tower Management
              </Title>
              <Text className="text-gray-600">
                Manage towers, floor plans, and unit distribution
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
                Create Tower
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
                title="Total Towers"
                value={towerStats.totalTowers}
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
                title="Total Units"
                value={towerStats.totalUnits}
                prefix={<Home className="text-green-500" />}
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
                title="Units Sold"
                value={towerStats.soldUnits}
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
                title="Avg. Completion"
                value={towerStats.averageCompletion}
                prefix={<TrendingUp className="text-orange-500" />}
                suffix="%"
                precision={1}
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
                placeholder="Search towers..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </Col>
            
            <Col xs={24} md={4}>
              <Select
                placeholder="Project"
                value={selectedProject}
                onChange={setSelectedProject}
                size="large"
                className="w-full"
              >
                <Option value="all">All Projects</Option>
                {projects.data?.map(project => (
                  <Option key={project._id} value={project._id}>
                    {project.name}
                  </Option>
                ))}
              </Select>
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
                <Option value="planning">Planning</Option>
                <Option value="under_construction">Under Construction</Option>
                <Option value="completed">Completed</Option>
                <Option value="on_hold">On Hold</Option>
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
                <Option value="towerName">Tower Name</Option>
                <Option value="completionPercentage">Completion</Option>
                <Option value="totalUnits">Total Units</Option>
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
                  <Radio.Button value="grid">
                    <Grid className="w-4 h-4" />
                  </Radio.Button>
                  <Radio.Button value="list">
                    <ListIcon className="w-4 h-4" />
                  </Radio.Button>
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
                  <Text strong className="block mb-2">Completion Percentage</Text>
                  <Slider
                    range
                    value={completionRange}
                    onChange={setCompletionRange}
                    min={0}
                    max={100}
                    tooltip={{
                      formatter: (value) => `${value}%`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{completionRange[0]}%</span>
                    <span>{completionRange[1]}%</span>
                  </div>
                </Col>
                
                <Col xs={24} md={12}>
                  <Text strong className="block mb-2">Total Units Range</Text>
                  <Slider
                    range
                    value={unitsRange}
                    onChange={setUnitsRange}
                    min={0}
                    max={1000}
                    step={10}
                    tooltip={{
                      formatter: (value) => `${value} units`
                    }}
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{unitsRange[0]} units</span>
                    <span>{unitsRange[1]} units</span>
                  </div>
                </Col>
              </Row>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Towers Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" tip="Loading towers..." />
            </div>
          ) : filteredTowers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No towers found"
              >
                {hasPermission('project_management') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 border-0"
                  >
                    Create Your First Tower
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
                {filteredTowers.map((tower) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={tower._id}>
                    {renderTowerCard(tower)}
                  </Col>
                ))}
              </Row>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals and Drawers */}
      {renderCreateModal()}
      {renderFloorPlanDrawer()}
    </motion.div>
  )
}

export default TowersPage
