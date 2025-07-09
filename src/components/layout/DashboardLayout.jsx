// =============================================================================
// File: src/components/layout/DashboardLayout.jsx
// Description: Main dashboard layout component with sidebar navigation, header, and content area
// Features: Responsive design, role-based navigation, user profile, notifications, breadcrumbs
// Dependencies: Ant Design, React Router, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Button,
  Badge,
  Typography,
  Space,
  Breadcrumb,
  Drawer,
  theme,
  Tooltip,
  Divider
} from 'antd'
import {
  DashboardOutlined,
  ProjectOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  BankOutlined,
  ContactsOutlined,
  CreditCardOutlined,    // CHANGED: PaymentOutlined → CreditCardOutlined
  FileTextOutlined,
  ToolOutlined,
  RocketOutlined
} from '@ant-design/icons'
import {
  Building2,
  Users,
  Home,
  CreditCard,
  TrendingUp,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronRight
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { USER_ROLES, ROLE_CATEGORIES } from '../../constants'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

// Animation variants
const layoutVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

const contentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, delay: 0.1 }
  }
}

const DashboardLayout = ({ children }) => {
  // Hooks
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = theme.useToken()

  // State
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)
  const [notifications] = useState([
    { id: 1, title: 'New lead assigned', type: 'info', time: '2 min ago' },
    { id: 2, title: 'Payment overdue', type: 'warning', time: '1 hour ago' },
    { id: 3, title: 'Project milestone completed', type: 'success', time: '3 hours ago' }
  ])

  // Store state and actions
  const { user, logout, hasPermission, isManagement, isSalesRole } = useAuthStore()
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    currentProject,
    breadcrumbs,
    setBreadcrumbs 
  } = useAppStore()

  // Update breadcrumbs based on current route
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const newBreadcrumbs = []

    // Always start with Dashboard
    newBreadcrumbs.push({
      title: 'Dashboard',
      path: '/dashboard',
      icon: <HomeOutlined />
    })

    // Add breadcrumbs based on path
    if (pathSegments.length > 1) {
      pathSegments.slice(1).forEach((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 2).join('/')
        const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ')
        
        newBreadcrumbs.push({
          title,
          path: index === pathSegments.length - 2 ? null : path, // Last item is not clickable
        })
      })
    }

    setBreadcrumbs(newBreadcrumbs)
  }, [location.pathname, setBreadcrumbs])

  // Navigation menu items based on user role
  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: null // Available to all
      },
      {
        key: '/projects',
        icon: <ProjectOutlined />,
        label: 'Projects',
        permission: 'project_management',
        children: currentProject ? [
          {
            key: `/projects/${currentProject._id}`,
            label: currentProject.name,
            icon: <BankOutlined />       // CHANGED: BuildingOutlined → BankOutlined
          }
        ] : []
      },
      {
        key: '/towers',
        icon: <BankOutlined />,        // CHANGED: BuildingOutlined → BankOutlined
        label: 'Towers',
        permission: 'project_management'
      },
      {
        key: '/units',
        icon: <HomeOutlined />,
        label: 'Units',
        permission: 'unit_management'
      },
      {
        key: '/leads',
        icon: <ContactsOutlined />,
        label: 'Leads',
        permission: 'lead_management'
      },
      {
        key: '/payments',
        icon: <CreditCardOutlined />,    // CHANGED: PaymentOutlined → CreditCardOutlined
        label: 'Payments',
        permission: 'financial_management',
        children: [
          {
            key: '/payments/plans',
            label: 'Payment Plans',
            icon: <FileTextOutlined />
          },
          {
            key: '/payments/transactions',
            label: 'Transactions',
            icon: <DollarOutlined />
          },
          {
            key: '/payments/overdue',
            label: 'Overdue',
            icon: <BellOutlined />
          }
        ]
      },
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: 'Reports & Analytics',
        permission: 'analytics',
        children: [
          {
            key: '/reports/sales',
            label: 'Sales Analytics',
            icon: <TrendingUp className="w-4 h-4" />
          },
          {
            key: '/reports/financial',
            label: 'Financial Reports',
            icon: <DollarOutlined />
          },
          {
            key: '/reports/projects',
            label: 'Project Reports',
            icon: <ProjectOutlined />
          }
        ]
      }
    ]

    // Add management-only items
    if (isManagement()) {
      items.push({
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        permission: null,
        children: [
          {
            key: '/settings/organization',
            label: 'Organization',
            icon: <BankOutlined />        // CHANGED: BuildingOutlined → BankOutlined
          },
          {
            key: '/settings/users',
            label: 'Users & Roles',
            icon: <TeamOutlined />
          },
          {
            key: '/settings/preferences',
            label: 'Preferences',
            icon: <ToolOutlined />
          }
        ]
      })
    }

    // Filter items based on permissions
    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission) || hasPermission('all')
    })
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile Settings',
      onClick: () => navigate('/settings/profile')
    },
    {
      key: 'organization',
      icon: <BankOutlined />,         // CHANGED: BuildingOutlined → BankOutlined
      label: 'Organization',
      onClick: () => navigate('/settings/organization')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
      danger: true
    }
  ]

  // Notifications dropdown
  const notificationMenuItems = notifications.map(notification => ({
    key: notification.id,
    label: (
      <div className="py-2">
        <Text strong className="block">{notification.title}</Text>
        <Text className="text-gray-500 text-xs">{notification.time}</Text>
      </div>
    )
  }))

  // Mobile sidebar
  const MobileSidebar = () => (
    <Drawer
      title={
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
            <RocketOutlined className="text-white" />
          </div>
          <span className="font-bold">PropVantage AI</span>
        </div>
      }
      placement="left"
      onClose={() => setMobileDrawerVisible(false)}
      open={mobileDrawerVisible}
      bodyStyle={{ padding: 0 }}
      width={280}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={({ key }) => {
          navigate(key)
          setMobileDrawerVisible(false)
        }}
        style={{ border: 'none' }}
      />
    </Drawer>
  )

  // Desktop sidebar
  const DesktopSidebar = () => (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={setSidebarCollapsed}
      trigger={null}
      width={280}
      collapsedWidth={80}
      className="shadow-lg"
      style={{
        background: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorderSecondary}`
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        {sidebarCollapsed ? (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <RocketOutlined className="text-white" />
          </div>
        ) : (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <RocketOutlined className="text-white" />
            </div>
            <Title level={4} className="m-0 font-bold text-gray-900">
              PropVantage AI
            </Title>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        openKeys={sidebarCollapsed ? [] : undefined}
        items={getMenuItems()}
        onClick={({ key }) => navigate(key)}
        style={{ 
          border: 'none',
          background: 'transparent'
        }}
        className="mt-4"
      />

      {/* User info at bottom (when not collapsed) */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <Avatar 
                size="small" 
                style={{ backgroundColor: '#1890ff' }}
                icon={<UserOutlined />}
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
              <div className="flex-1 min-w-0">
                <Text className="block text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="block text-xs text-gray-500 truncate">
                  {user?.role}
                </Text>
              </div>
            </div>
          </div>
        </div>
      )}
    </Sider>
  )

  return (
    <motion.div
      variants={layoutVariants}
      initial="initial"
      animate="animate"
    >
      <Layout className="min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DesktopSidebar />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar />

        <Layout>
          {/* Header */}
          <Header
            className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6"
            style={{ 
              padding: '0 16px',
              height: '64px',
              lineHeight: '64px'
            }}
          >
            <div className="flex items-center justify-between h-full">
              {/* Left side - Menu trigger and breadcrumbs */}
              <div className="flex items-center space-x-4">
                {/* Mobile menu trigger */}
                <Button
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  onClick={() => setMobileDrawerVisible(true)}
                  className="lg:hidden"
                />

                {/* Desktop sidebar toggle */}
                <Button
                  type="text"
                  icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex"
                />

                {/* Breadcrumbs */}
                <Breadcrumb
                  className="hidden md:flex"
                  separator={<ChevronRight className="w-4 h-4 text-gray-400" />}
                  items={breadcrumbs.map(crumb => ({
                    title: crumb.path ? (
                      <Link to={crumb.path} className="flex items-center space-x-1">
                        {crumb.icon && <span>{crumb.icon}</span>}
                        <span>{crumb.title}</span>
                      </Link>
                    ) : (
                      <span className="text-gray-500">{crumb.title}</span>
                    )
                  }))}
                />
              </div>

              {/* Right side - Notifications and user menu */}
              <div className="flex items-center space-x-4">
                {/* Current project indicator */}
                {currentProject && (
                  <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <Text className="text-blue-600 font-medium text-sm">
                      {currentProject.name}
                    </Text>
                  </div>
                )}

                {/* Notifications */}
                <Dropdown
                  menu={{ items: notificationMenuItems }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Badge count={notifications.length} size="small">
                    <Button
                      type="text"
                      icon={<BellOutlined />}
                      className="flex items-center justify-center"
                    />
                  </Badge>
                </Dropdown>

                {/* User menu */}
                <Dropdown
                  menu={{ items: userMenuItems }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1">
                    <Avatar 
                      size="small" 
                      style={{ backgroundColor: '#1890ff' }}
                      icon={<UserOutlined />}
                    >
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Avatar>
                    <div className="hidden md:block">
                      <Text className="block text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </Text>
                    </div>
                  </div>
                </Dropdown>
              </div>
            </div>
          </Header>

          {/* Main Content */}
          <Content
            className="bg-gray-50"
            style={{
              minHeight: 'calc(100vh - 64px)',
              padding: '24px'
            }}
          >
            <motion.div
              variants={contentVariants}
              initial="initial"
              animate="animate"
              className="h-full"
            >
              {children}
            </motion.div>
          </Content>
        </Layout>
      </Layout>
    </motion.div>
  )
}

export default DashboardLayout