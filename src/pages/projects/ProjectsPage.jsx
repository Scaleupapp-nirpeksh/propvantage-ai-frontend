// =============================================================================
// File: src/pages/projects/ProjectsPage.jsx
// Description: Magical projects page with enhanced UX, animations, and interactions
// Features: Advanced animations, glassmorphism, interactive elements, premium design
// Dependencies: Ant Design, React Query, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
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
  Statistic,
  Alert,
  Switch,
  Slider
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
  ExclamationCircleOutlined,
  StarOutlined,
  FireOutlined,
  RocketOutlined,
  CrownOutlined,
  HeartOutlined,
  BellOutlined,
  SyncOutlined,
  WarningOutlined,
  GlobalOutlined,
  SafetyOutlined,
  TrophyOutlined
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
  CheckCircle,
  Sparkles,
  Zap,
  Award,
  Shield,
  BarChart3,
  PieChart,
  Globe,
  Cpu,
  Heart,
  Star,
  Search as SearchIcon,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Sun
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

// Enhanced Animation variants
const containerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.1,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const cardVariants = {
  initial: { opacity: 0, y: 30, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const listVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.05,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const itemVariants = {
  initial: { opacity: 0, x: -30, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    rotate: [0, 5, -5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Enhanced Floating Elements
const FloatingElement = ({ children, delay = 0 }) => (
  <motion.div
    variants={floatingVariants}
    animate="animate"
    style={{ animationDelay: `${delay}s` }}
  >
    {children}
  </motion.div>
)

// Enhanced Statistics Card
const StatsCard = ({ title, value, icon, color, trend, description }) => (
  <motion.div
    whileHover={{ 
      scale: 1.03,
      y: -5,
      boxShadow: `0 20px 40px ${color}20`
    }}
    transition={{ duration: 0.3 }}
  >
    <Card className="h-full border-0 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{ 
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` 
            }}
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          {trend && (
            <motion.div
              className={`text-sm font-semibold ${
                trend > 0 ? 'text-green-500' : 'text-red-500'
              }`}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </motion.div>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600 mb-1">{title}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>
    </Card>
  </motion.div>
)

// Enhanced Project Card
const MagicalProjectCard = ({ project, onView, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false)
  const statusDisplay = getStatusDisplay(project.status)
  const completionPercentage = project.analytics?.completionPercentage || 0
  const totalUnits = project.analytics?.totalUnits || 0
  const soldUnits = project.analytics?.soldUnits || 0

  const getStatusDisplay = (status) => {
    const statusConfig = {
      [PROJECT_STATUS.PLANNING]: { 
        icon: <Clock className="w-4 h-4" />, 
        color: '#fa8c16',
        gradient: 'from-yellow-400 to-orange-500'
      },
      [PROJECT_STATUS.PRE_LAUNCH]: { 
        icon: <Zap className="w-4 h-4" />, 
        color: '#722ed1',
        gradient: 'from-purple-400 to-pink-500'
      },
      [PROJECT_STATUS.LAUNCHED]: { 
        icon: <CheckCircle className="w-4 h-4" />, 
        color: '#52c41a',
        gradient: 'from-green-400 to-emerald-500'
      },
      [PROJECT_STATUS.UNDER_CONSTRUCTION]: { 
        icon: <Activity className="w-4 h-4" />, 
        color: '#1890ff',
        gradient: 'from-blue-400 to-cyan-500'
      },
      [PROJECT_STATUS.READY_TO_MOVE]: { 
        icon: <Home className="w-4 h-4" />, 
        color: '#13c2c2',
        gradient: 'from-teal-400 to-blue-500'
      },
      [PROJECT_STATUS.COMPLETED]: { 
        icon: <Award className="w-4 h-4" />, 
        color: '#52c41a',
        gradient: 'from-green-500 to-emerald-600'
      },
      [PROJECT_STATUS.ON_HOLD]: { 
        icon: <AlertCircle className="w-4 h-4" />, 
        color: '#faad14',
        gradient: 'from-yellow-500 to-orange-600'
      }
    }
    return statusConfig[status] || { 
      icon: <Clock className="w-4 h-4" />, 
      color: '#8c8c8c',
      gradient: 'from-gray-400 to-gray-500'
    }
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
      }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="h-full border-0 shadow-lg relative overflow-hidden cursor-pointer group"
        onClick={onView}
        style={{
          background: isHovered 
            ? 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)'
            : 'white'
        }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0px 0px', '100px 100px']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${statusDisplay.color.replace('#', '')}' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <motion.div
                  className={`px-3 py-1 rounded-full text-white text-sm font-medium shadow-lg bg-gradient-to-r ${statusDisplay.gradient}`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center space-x-2">
                    {statusDisplay.icon}
                    <span>{project.status}</span>
                  </div>
                </motion.div>
                <motion.div
                  className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  {project.type}
                </motion.div>
              </div>
              <Title level={4} className="m-0 mb-2 text-gray-900 group-hover:text-gray-700 transition-colors">
                {project.name}
              </Title>
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'view',
                    label: 'View Details',
                    icon: <Eye className="w-4 h-4" />,
                    onClick: () => onView()
                  },
                  {
                    key: 'edit',
                    label: 'Edit Project',
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => onEdit()
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: <Trash2 className="w-4 h-4" />,
                    danger: true,
                    onClick: () => onDelete()
                  }
                ]
              }}
              trigger={['click']}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button 
                  type="text" 
                  icon={<MoreVertical className="w-4 h-4" />}
                  size="small"
                  className="text-gray-400 hover:text-gray-600"
                />
              </motion.div>
            </Dropdown>
          </div>

          {/* Location */}
          <div className="flex items-center space-x-2 mb-4 text-gray-600">
            <MapPin className="w-4 h-4" />
            <Text className="text-sm">{project.location || 'Location not specified'}</Text>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <motion.div 
              className="text-center p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl font-bold text-blue-600">{totalUnits}</div>
              <div className="text-xs text-gray-500">Total Units</div>
            </motion.div>
            <motion.div 
              className="text-center p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-2xl font-bold text-green-600">{soldUnits}</div>
              <div className="text-xs text-gray-500">Sold Units</div>
            </motion.div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Text className="text-sm font-medium">Progress</Text>
              <motion.div
                className="text-sm text-gray-500"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {completionPercentage}%
              </motion.div>
            </div>
            <div className="relative">
              <Progress 
                percent={completionPercentage} 
                size="small" 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                showInfo={false}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-20"
                animate={{ 
                  scaleX: [0, completionPercentage / 100, 0],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <Text className="text-sm text-gray-500">
                {formatDate(project.createdAt, 'MMM yyyy')}
              </Text>
            </div>
            {project.revenue && (
              <motion.div
                className="text-sm font-semibold text-green-600"
                whileHover={{ scale: 1.05 }}
              >
                {formatCurrencyShort(project.revenue)}
              </motion.div>
            )}
          </div>

          {/* Hover overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          />
        </div>
      </Card>
    </motion.div>
  )
}

// Enhanced Header Component
const MagicalHeader = ({ 
  viewMode, 
  setViewMode, 
  onCreateProject, 
  onExport, 
  hasPermission, 
  isManagement 
}) => (
  <motion.div variants={cardVariants}>
    <Card 
      className="border-0 shadow-lg relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)' }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 p-8">
        <Row align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                >
                  <Building2 className="w-8 h-8 text-white" />
                </motion.div>
                <Title level={1} className="text-white m-0">
                  Projects
                </Title>
              </div>
              <Paragraph className="text-blue-100 text-lg m-0 leading-relaxed">
                Manage your real estate projects and track their progress with advanced analytics
              </Paragraph>
            </motion.div>
          </Col>
          <Col xs={24} md={12}>
            <motion.div
              className="text-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Space wrap size="large">
                {/* View Mode Toggle */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Radio.Group 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    buttonStyle="solid"
                    className="bg-white/10 rounded-lg p-1"
                  >
                    <Radio.Button value="grid" className="border-0 bg-transparent">
                      <Grid3X3 className="w-4 h-4" />
                    </Radio.Button>
                    <Radio.Button value="list" className="border-0 bg-transparent">
                      <List className="w-4 h-4" />
                    </Radio.Button>
                  </Radio.Group>
                </motion.div>

                {/* Export */}
                {isManagement() && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      icon={<Download className="w-4 h-4" />}
                      onClick={onExport}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Export
                    </Button>
                  </motion.div>
                )}

                {/* Create Project */}
                {hasPermission('project_management') && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      type="primary" 
                      icon={<Plus className="w-4 h-4" />}
                      onClick={onCreateProject}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 border-0 shadow-lg"
                    >
                      Create Project
                    </Button>
                  </motion.div>
                )}
              </Space>
            </motion.div>
          </Col>
        </Row>
      </div>
    </Card>
  </motion.div>
)

// Enhanced Search and Filter Component
const SearchAndFilter = ({ 
  searchQuery, 
  setSearchQuery, 
  sortBy, 
  setSortBy, 
  sortOrder, 
  setSortOrder,
  onFilterClick,
  filterCount
}) => (
  <motion.div variants={cardVariants}>
    <Card className="border-0 shadow-lg">
      <Row gutter={[24, 24]} align="middle">
        <Col xs={24} md={12}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Search
              placeholder="Search projects by name, location, or type..."
              allowClear
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={setSearchQuery}
              className="shadow-sm"
              prefix={<SearchIcon className="w-4 h-4 text-gray-400" />}
            />
          </motion.div>
        </Col>
        <Col xs={24} md={12}>
          <div className="flex items-center justify-end space-x-4">
            {/* Sort Options */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(value) => {
                  const [field, order] = value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
                style={{ width: 200 }}
                className="shadow-sm"
              >
                <Option value="createdAt-desc">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Newest First</span>
                  </div>
                </Option>
                <Option value="createdAt-asc">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Oldest First</span>
                  </div>
                </Option>
                <Option value="name-asc">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>Name A-Z</span>
                  </div>
                </Option>
                <Option value="name-desc">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>Name Z-A</span>
                  </div>
                </Option>
                <Option value="status-asc">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4" />
                    <span>Status</span>
                  </div>
                </Option>
              </Select>
            </motion.div>

            {/* Filter Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge 
                count={filterCount}
                size="small"
                className="shadow-sm"
              >
                <Button 
                  icon={<Filter className="w-4 h-4" />}
                  onClick={onFilterClick}
                  className="shadow-sm"
                >
                  Filters
                </Button>
              </Badge>
            </motion.div>
          </div>
        </Col>
      </Row>
    </Card>
  </motion.div>
)

// Enhanced Empty State
const EmptyState = ({ onCreateProject, hasPermission }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="border-0 shadow-lg">
      <div className="text-center py-16">
        <motion.div
          className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 360]
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
        >
          <Building2 className="w-12 h-12 text-white" />
        </motion.div>
        <Title level={3} className="text-gray-600 mb-4">
          No projects found
        </Title>
        <Paragraph className="text-gray-500 mb-8 max-w-md mx-auto">
          Get started by creating your first project. You can manage all your real estate projects from here.
        </Paragraph>
        {hasPermission('project_management') && (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              icon={<Plus className="w-4 h-4" />}
              onClick={onCreateProject}
              size="large"
              className="shadow-lg"
            >
              Create Your First Project
            </Button>
          </motion.div>
        )}
      </div>
    </Card>
  </motion.div>
)

// Enhanced Loading Component
const LoadingState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center h-96"
  >
    <div className="text-center">
      <motion.div
        className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>
      <Text className="text-gray-600">Loading your magical projects...</Text>
    </div>
  </motion.div>
)

const ProjectsPage = () => {
  // Hooks
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  
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
  const [viewMode, setViewMode] = useState('grid')
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
    staleTime: 5 * 60 * 1000
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
      onOk: () => deleteProjectMutation.mutate(projectId),
      className: 'magical-confirm'
    })
  }

  // Handle export
  const handleExport = () => {
    message.success('Export functionality will be implemented soon!')
  }

  // Calculate filter count
  const filterCount = Object.values(projectFilters).filter(v => v && v !== 'all').length

  // Enhanced Create Project Modal
  const CreateProjectModal = () => (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Plus className="w-5 h-5 text-blue-500" />
          </motion.div>
          <span>Create New Project</span>
        </div>
      }
      open={createModalVisible}
      onCancel={() => {
        setCreateModalVisible(false)
        form.resetFields()
      }}
      footer={null}
      width={700}
      className="magical-modal"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleCreateProject}
        autoComplete="off"
      >
        <Row gutter={[24, 16]}>
          <Col span={24}>
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
              <Select size="large">
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
        </Row>

        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setCreateModalVisible(false)}
              size="large"
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              htmlType="submit"
              loading={createProjectMutation.isPending}
              size="large"
              className="shadow-lg"
            >
              Create Project
            </Button>
          </motion.div>
        </div>
      </Form>
    </Modal>
  )

  // Enhanced Filter Drawer
  const FilterDrawer = () => (
    <Drawer
      title={
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Filter className="w-5 h-5 text-blue-500" />
          </motion.div>
          <span>Filter Projects</span>
        </div>
      }
      placement="right"
      onClose={() => setFilterDrawerVisible(false)}
      open={filterDrawerVisible}
      width={400}
      className="magical-drawer"
    >
      <div className="space-y-8">
        {/* Status Filter */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Text className="block font-semibold mb-3 text-gray-700">Status</Text>
          <Select
            value={projectFilters.status}
            onChange={(value) => setProjectFilters({ status: value })}
            placeholder="Select status"
            className="w-full"
            size="large"
            allowClear
          >
            <Option value="all">All Statuses</Option>
            {Object.values(PROJECT_STATUS).map(status => (
              <Option key={status} value={status}>{status}</Option>
            ))}
          </Select>
        </motion.div>

        {/* Type Filter */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Text className="block font-semibold mb-3 text-gray-700">Project Type</Text>
          <Select
            value={projectFilters.type}
            onChange={(value) => setProjectFilters({ type: value })}
            placeholder="Select type"
            className="w-full"
            size="large"
            allowClear
          >
            <Option value="all">All Types</Option>
            {Object.entries(PROJECT_TYPES).map(([key, value]) => (
              <Option key={key} value={value}>
                {value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Option>
            ))}
          </Select>
        </motion.div>

        {/* Location Filter */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Text className="block font-semibold mb-3 text-gray-700">Location</Text>
          <Input
            value={projectFilters.location}
            onChange={(e) => setProjectFilters({ location: e.target.value })}
            placeholder="Enter location"
            size="large"
            prefix={<MapPin className="w-4 h-4 text-gray-400" />}
          />
        </motion.div>

        {/* Date Range Filter */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Text className="block font-semibold mb-3 text-gray-700">Created Date</Text>
          <RangePicker
            value={projectFilters.dateRange}
            onChange={(dates) => setProjectFilters({ dateRange: dates })}
            className="w-full"
            size="large"
          />
        </motion.div>

        {/* Clear Filters */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              block 
              size="large"
              onClick={() => {
                setProjectFilters({
                  status: 'all',
                  type: 'all',
                  location: 'all',
                  dateRange: null
                })
                setSearchQuery('')
              }}
              className="shadow-sm"
            >
              Clear All Filters
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </Drawer>
  )

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="border-0 shadow-lg">
          <Alert
            message="Failed to load projects"
            description="Something went wrong while loading your projects. Please try again."
            type="error"
            action={
              <Button 
                type="primary" 
                onClick={() => window.location.reload()}
                className="shadow-sm"
              >
                Retry
              </Button>
            }
          />
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={containerRef}
      variants={containerVariants}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      className="space-y-8"
    >
      {/* Enhanced Header */}
      <MagicalHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onCreateProject={() => setCreateModalVisible(true)}
        onExport={handleExport}
        hasPermission={hasPermission}
        isManagement={isManagement}
      />

      {/* Enhanced Search and Filters */}
      <SearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        onFilterClick={() => setFilterDrawerVisible(true)}
        filterCount={filterCount}
      />

      {/* Enhanced Projects List/Grid */}
      <AnimatePresence mode="wait">
        {projects.length === 0 ? (
          <EmptyState
            onCreateProject={() => setCreateModalVisible(true)}
            hasPermission={hasPermission}
          />
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
                {projects.map((project, index) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={project._id}>
                    <FloatingElement delay={index * 0.1}>
                      <MagicalProjectCard
                        project={project}
                        onView={() => {
                          setCurrentProject(project)
                          navigate(`/projects/${project._id}`)
                        }}
                        onEdit={() => navigate(`/projects/${project._id}/edit`)}
                        onDelete={() => handleDeleteProject(project._id, project.name)}
                      />
                    </FloatingElement>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="space-y-4">
                {projects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    variants={itemVariants}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MagicalProjectCard
                      project={project}
                      onView={() => {
                        setCurrentProject(project)
                        navigate(`/projects/${project._id}`)
                      }}
                      onEdit={() => navigate(`/projects/${project._id}/edit`)}
                      onDelete={() => handleDeleteProject(project._id, project.name)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Drawers and Modals */}
      <FilterDrawer />
      <CreateProjectModal />

      {/* Enhanced Global Styles */}
      <style jsx global>{`
        .magical-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .magical-modal .ant-modal-header {
          background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
          border-bottom: 1px solid #e8e8e8;
        }
        
        .magical-drawer .ant-drawer-content {
          background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
        }
        
        .magical-drawer .ant-drawer-header {
          background: linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%);
          border-bottom: 1px solid #e8e8e8;
        }
        
        .magical-confirm .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .ant-card {
          border-radius: 16px;
          overflow: hidden;
        }
        
        .ant-card-head {
          background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
        }
        
        .ant-input,
        .ant-select-selector {
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .ant-input:focus,
        .ant-input-focused,
        .ant-select-focused .ant-select-selector {
          border-color: #1890ff;
          box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
        }
        
        .ant-btn {
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .ant-btn-primary {
          background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
          border: none;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }
        
        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #40a9ff 0%, #9254de 100%);
          box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
        }
        
        .ant-progress-bg {
          background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
        }
        
        .ant-tag {
          border-radius: 12px;
          font-weight: 500;
        }
        
        .ant-radio-button-wrapper {
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .ant-radio-button-wrapper-checked {
          background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
          border-color: #1890ff;
        }
        
        .ant-empty-description {
          color: #666;
        }
        
        .ant-statistic-content {
          color: #262626;
        }
        
        .ant-modal-mask {
          backdrop-filter: blur(4px);
        }
        
        .ant-drawer-mask {
          backdrop-filter: blur(4px);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #40a9ff 0%, #9254de 100%);
        }
      `}</style>
    </motion.div>
  )
}

export default ProjectsPage