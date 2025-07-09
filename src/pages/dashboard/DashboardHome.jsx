// =============================================================================
// File: src/pages/dashboard/DashboardHome.jsx
// Description: Main dashboard home page with analytics, metrics, and quick actions
// Features: Role-based dashboards, real-time metrics, charts, activity feeds
// Dependencies: Ant Design, Recharts, React Query, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Button,
  Avatar,
  List,
  Badge,
  Progress,
  Space,
  Dropdown,
  Select,
  DatePicker,
  Spin,
  Empty,
  Tag,
  Tooltip
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  EyeOutlined,
  UserAddOutlined,
  DollarOutlined,
  HomeOutlined,
  ProjectOutlined,
  TeamOutlined,
  TrophyOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MailOutlined,
  MoreOutlined
} from '@ant-design/icons'
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Users,
  Target,
  DollarSign,
  Home,
  Calendar,
  Phone,
  Mail,
  Plus,
  Eye,
  Activity,
  Clock,
  MapPin
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { analyticsAPI, leadAPI, projectAPI } from '../../services/api'
import { formatCurrency, formatCurrencyShort, formatDate, getStatusColor } from '../../utils/helpers'
import { LEAD_STATUS, UNIT_STATUS, STATUS_COLORS } from '../../constants'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

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

const DashboardHome = () => {
  // Hooks
  const navigate = useNavigate()
  
  // Store state
  const { user, hasPermission, isManagement, isSalesRole } = useAuthStore()
  const { currentProject, setCurrentProject } = useAppStore()
  
  // Local state
  const [dateRange, setDateRange] = useState(null)
  const [selectedProject, setSelectedProject] = useState('all')

  // API Queries
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard', selectedProject, dateRange],
    queryFn: () => analyticsAPI.getDashboard({ 
      projectId: selectedProject !== 'all' ? selectedProject : undefined,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD')
    })
  })

  const { data: recentLeads } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => leadAPI.getLeads({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects({ limit: 10 })
  })

  // Sample data (replace with real API data)
  const sampleRevenueData = [
    { month: 'Jan', revenue: 45000000, target: 50000000 },
    { month: 'Feb', revenue: 52000000, target: 50000000 },
    { month: 'Mar', revenue: 48000000, target: 55000000 },
    { month: 'Apr', revenue: 61000000, target: 55000000 },
    { month: 'May', revenue: 55000000, target: 60000000 },
    { month: 'Jun', revenue: 67000000, target: 60000000 }
  ]

  const sampleUnitStatusData = [
    { name: 'Available', value: 145, color: STATUS_COLORS[UNIT_STATUS.AVAILABLE] },
    { name: 'Booked', value: 67, color: STATUS_COLORS[UNIT_STATUS.BOOKED] },
    { name: 'Sold', value: 234, color: STATUS_COLORS[UNIT_STATUS.SOLD] },
    { name: 'Blocked', value: 12, color: STATUS_COLORS[UNIT_STATUS.BLOCKED] }
  ]

  const sampleLeadPipelineData = [
    { stage: 'New', count: 45 },
    { stage: 'Qualified', count: 32 },
    { stage: 'Site Visit', count: 28 },
    { stage: 'Negotiation', count: 18 },
    { stage: 'Booked', count: 12 }
  ]

  // Quick action items based on user role
  const getQuickActions = () => {
    const actions = []

    if (hasPermission('lead_management')) {
      actions.push({
        key: 'add-lead',
        title: 'Add New Lead',
        description: 'Capture a new potential customer',
        icon: <UserAddOutlined />,
        color: '#1890ff',
        action: () => navigate('/leads/new')
      })
    }

    if (hasPermission('project_management')) {
      actions.push({
        key: 'create-project',
        title: 'Create Project',
        description: 'Start a new real estate project',
        icon: <ProjectOutlined />,
        color: '#52c41a',
        action: () => navigate('/projects/new')
      })
    }

    if (hasPermission('unit_management')) {
      actions.push({
        key: 'view-inventory',
        title: 'View Inventory',
        description: 'Check available units',
        icon: <HomeOutlined />,
        color: '#722ed1',
        action: () => navigate('/units')
      })
    }

    if (hasPermission('financial_management')) {
      actions.push({
        key: 'payment-report',
        title: 'Payment Reports',
        description: 'View financial analytics',
        icon: <DollarOutlined />,
        color: '#fa8c16',
        action: () => navigate('/reports/financial')
      })
    }

    return actions
  }

  // Recent activities (sample data)
  const recentActivities = [
    {
      id: 1,
      type: 'lead',
      title: 'New lead: Rajesh Kumar',
      description: 'Interested in 3BHK unit in Skyline Towers',
      time: '2 hours ago',
      avatar: 'RK',
      color: '#1890ff'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received: ₹5,00,000',
      description: 'From Priya Sharma for unit ST-1205',
      time: '4 hours ago',
      avatar: 'PS',
      color: '#52c41a'
    },
    {
      id: 3,
      type: 'milestone',
      title: 'Milestone completed',
      description: 'Foundation work for Tower B completed',
      time: '1 day ago',
      avatar: 'TB',
      color: '#722ed1'
    },
    {
      id: 4,
      type: 'booking',
      title: 'Unit booked: GV-Villa-12',
      description: 'Amit Singh booked villa in Green Valley',
      time: '2 days ago',
      avatar: 'AS',
      color: '#fa8c16'
    }
  ]

  // Role-specific dashboard cards
  const getDashboardCards = () => {
    const cards = []

    // Universal cards
    cards.push({
      key: 'total-projects',
      title: 'Total Projects',
      value: dashboardData?.data?.totalProjects || 8,
      change: 12.5,
      changeType: 'increase',
      icon: <ProjectOutlined />,
      color: '#1890ff'
    })

    if (hasPermission('lead_management')) {
      cards.push({
        key: 'total-leads',
        title: 'Active Leads',
        value: dashboardData?.data?.totalLeads || 234,
        change: 8.2,
        changeType: 'increase',
        icon: <TeamOutlined />,
        color: '#52c41a'
      })
    }

    if (hasPermission('unit_management')) {
      cards.push({
        key: 'available-units',
        title: 'Available Units',
        value: dashboardData?.data?.availableUnits || 145,
        change: -5.2,
        changeType: 'decrease',
        icon: <HomeOutlined />,
        color: '#722ed1'
      })
    }

    if (hasPermission('financial_management')) {
      cards.push({
        key: 'monthly-revenue',
        title: 'Monthly Revenue',
        value: formatCurrencyShort(dashboardData?.data?.monthlyRevenue || 67000000),
        change: 15.3,
        changeType: 'increase',
        icon: <DollarOutlined />,
        color: '#fa8c16'
      })
    }

    // Management-specific cards
    if (isManagement()) {
      cards.push({
        key: 'conversion-rate',
        title: 'Lead Conversion',
        value: `${dashboardData?.data?.conversionRate || 23.5}%`,
        change: 3.2,
        changeType: 'increase',
        icon: <TrophyOutlined />,
        color: '#13c2c2'
      })
    }

    return cards
  }

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={cardVariants}>
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <Row align="middle" justify="space-between">
            <Col xs={24} md={16}>
              <div>
                <Title level={2} className="text-white m-0 mb-2">
                  Welcome back, {user?.firstName}! 👋
                </Title>
                <Paragraph className="text-blue-100 text-lg m-0">
                  Here's what's happening with your real estate business today.
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8} className="text-right">
              <div className="space-y-2">
                <Text className="text-blue-100 block">
                  {formatDate(new Date(), 'EEEE, MMMM do, yyyy')}
                </Text>
                <Space wrap>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    className="bg-white/10 border-white/20"
                  />
                  {hasPermission('project_management') && (
                    <Select
                      value={selectedProject}
                      onChange={setSelectedProject}
                      className="min-w-40"
                      placeholder="All Projects"
                    >
                      <Option value="all">All Projects</Option>
                      {projects?.data?.projects?.map(project => (
                        <Option key={project._id} value={project._id}>
                          {project.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Key Metrics Cards */}
      <motion.div variants={cardVariants}>
        <Row gutter={[16, 16]}>
          {getDashboardCards().map((card, index) => (
            <Col xs={24} sm={12} lg={6} xl={4} key={card.key}>
              <motion.div
                variants={cardVariants}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <Statistic
                    title={card.title}
                    value={card.value}
                    prefix={
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white mr-2"
                        style={{ backgroundColor: card.color }}
                      >
                        {card.icon}
                      </div>
                    }
                    suffix={
                      <div className="flex items-center space-x-1">
                        {card.changeType === 'increase' ? (
                          <ArrowUpOutlined className="text-green-500" />
                        ) : (
                          <ArrowDownOutlined className="text-red-500" />
                        )}
                        <Text 
                          className={`text-sm ${
                            card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {card.change}%
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Main Content Row */}
      <Row gutter={[24, 24]}>
        {/* Left Column - Charts and Analytics */}
        <Col xs={24} xl={16}>
          <div className="space-y-6">
            {/* Revenue Chart */}
            {hasPermission('financial_management') && (
              <motion.div variants={cardVariants}>
                <Card 
                  title={
                    <div className="flex items-center justify-between">
                      <span>Revenue vs Target</span>
                      <Button type="link" onClick={() => navigate('/reports/financial')}>
                        View Details
                      </Button>
                    </div>
                  }
                  className="h-96"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sampleRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCurrencyShort(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#1890ff" 
                        fill="#1890ff" 
                        fillOpacity={0.3}
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#52c41a" 
                        fill="#52c41a" 
                        fillOpacity={0.2}
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            )}

            {/* Lead Pipeline Chart */}
            {hasPermission('lead_management') && (
              <motion.div variants={cardVariants}>
                <Card 
                  title="Sales Pipeline"
                  extra={<Button type="link" onClick={() => navigate('/leads')}>View All Leads</Button>}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sampleLeadPipelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Bar dataKey="count" fill="#1890ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </motion.div>
            )}
          </div>
        </Col>

        {/* Right Column - Quick Actions and Activities */}
        <Col xs={24} xl={8}>
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div variants={cardVariants}>
              <Card title="Quick Actions" className="h-fit">
                <div className="space-y-3">
                  {getQuickActions().map(action => (
                    <Button
                      key={action.key}
                      type="default"
                      block
                      size="large"
                      onClick={action.action}
                      className="text-left h-auto py-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: action.color }}
                        >
                          {action.icon}
                        </div>
                        <div className="flex-1">
                          <Text className="block font-medium">{action.title}</Text>
                          <Text className="block text-gray-500 text-sm">{action.description}</Text>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Unit Status Distribution */}
            {hasPermission('unit_management') && (
              <motion.div variants={cardVariants}>
                <Card 
                  title="Unit Status Distribution"
                  extra={<Button type="link" onClick={() => navigate('/units')}>View Units</Button>}
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={sampleUnitStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {sampleUnitStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {sampleUnitStatusData.map(item => (
                      <div key={item.name} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <Text className="text-sm">{item.name}: {item.value}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Recent Activities */}
            <motion.div variants={cardVariants}>
              <Card title="Recent Activities" className="h-fit">
                <List
                  dataSource={recentActivities}
                  renderItem={activity => (
                    <List.Item className="px-0">
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: activity.color }}
                            size="small"
                          >
                            {activity.avatar}
                          </Avatar>
                        }
                        title={
                          <Text className="text-sm font-medium">{activity.title}</Text>
                        }
                        description={
                          <div>
                            <Text className="text-xs text-gray-500 block">{activity.description}</Text>
                            <Text className="text-xs text-gray-400">{activity.time}</Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </motion.div>
          </div>
        </Col>
      </Row>

      {/* Recent Leads Table (for sales roles) */}
      {isSalesRole() && recentLeads?.data?.leads && (
        <motion.div variants={cardVariants}>
          <Card 
            title="Recent Leads"
            extra={<Button type="primary" onClick={() => navigate('/leads')}>View All Leads</Button>}
          >
            <List
              dataSource={recentLeads.data.leads}
              renderItem={lead => (
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
                    >
                      Call
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ backgroundColor: '#1890ff' }}>
                        {lead.firstName?.[0]}{lead.lastName?.[0]}
                      </Avatar>
                    }
                    title={
                      <div className="flex items-center space-x-2">
                        <Text className="font-medium">{lead.firstName} {lead.lastName}</Text>
                        <Tag color={getStatusColor(lead.status)}>{lead.status}</Tag>
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
                          Budget: {formatCurrencyShort(lead.budget?.min)} - {formatCurrencyShort(lead.budget?.max)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

export default DashboardHome