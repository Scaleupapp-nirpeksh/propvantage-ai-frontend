// =============================================================================
// File: src/components/layout/DashboardLayout.jsx
// Description: Magical dashboard layout with enhanced UX, animations, and interactions
// Features: Advanced animations, micro-interactions, glassmorphism, responsive design
// Dependencies: Ant Design, React Router, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
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
  Divider,
  Card,
  Progress
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
  CreditCardOutlined,
  FileTextOutlined,
  ToolOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined
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
  ChevronRight,
  Sparkles,
  Zap,
  Moon,
  Sun,
  Search,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useAppStore from '../../store/appStore'
import { USER_ROLES, ROLE_CATEGORIES } from '../../constants'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

// Enhanced Animation Variants
const layoutVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { 
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const contentVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.5, 
      delay: 0.1,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 }
  }
}

const sidebarVariants = {
  collapsed: { 
    width: 80,
    transition: { 
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  expanded: { 
    width: 280,
    transition: { 
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const menuItemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
}

const headerVariants = {
  initial: { y: -80, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: { 
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const notificationVariants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// Enhanced Floating Action Button
const FloatingActionButton = ({ onClick, icon, tooltip, className = "" }) => (
  <motion.div
    whileHover={{ 
      scale: 1.1,
      boxShadow: "0 10px 30px rgba(24, 144, 255, 0.3)"
    }}
    whileTap={{ scale: 0.95 }}
    className={`fixed bottom-6 right-6 z-50 ${className}`}
  >
    <Tooltip title={tooltip} placement="left">
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={icon}
        onClick={onClick}
        className="shadow-lg backdrop-blur-sm bg-gradient-to-r from-blue-500 to-purple-600 border-none"
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
        }}
      />
    </Tooltip>
  </motion.div>
)

// Enhanced Loading Component
const LoadingSpinner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center p-8"
  >
    <motion.div
      animate={{
        rotate: 360,
        scale: [1, 1.2, 1]
      }}
      transition={{
        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
        scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      }}
      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </motion.div>
)

// Enhanced Search Component
const QuickSearch = ({ isVisible, onClose }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-lg border border-gray-200 p-4 z-50"
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, leads, or navigate..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)

const DashboardLayout = ({ children }) => {
  // Hooks
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const headerRef = useRef(null)

  // Enhanced State
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)
  const [quickSearchVisible, setQuickSearchVisible] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [notifications] = useState([
    { id: 1, title: 'New lead assigned', type: 'info', time: '2 min ago', priority: 'high' },
    { id: 2, title: 'Payment overdue', type: 'warning', time: '1 hour ago', priority: 'medium' },
    { id: 3, title: 'Project milestone completed', type: 'success', time: '3 hours ago', priority: 'low' }
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

  // Enhanced scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
          path: index === pathSegments.length - 2 ? null : path,
        })
      })
    }

    setBreadcrumbs(newBreadcrumbs)
  }, [location.pathname, setBreadcrumbs])

  // Enhanced Navigation menu items
  const getMenuItems = () => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: null,
        badge: null
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
            icon: <BankOutlined />
          }
        ] : []
      },
      {
        key: '/towers',
        icon: <BankOutlined />,
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
        permission: 'lead_management',
        badge: 'New'
      },
      {
        key: '/payments',
        icon: <CreditCardOutlined />,
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
            icon: <BankOutlined />
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

    return items.filter(item => {
      if (!item.permission) return true
      return hasPermission(item.permission) || hasPermission('all')
    })
  }

  // Handle logout with enhanced feedback
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // Enhanced User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile Settings',
      onClick: () => navigate('/settings/profile')
    },
    {
      key: 'organization',
      icon: <BankOutlined />,
      label: 'Organization',
      onClick: () => navigate('/settings/organization')
    },
    {
      key: 'preferences',
      icon: <SettingOutlined />,
      label: 'Preferences',
      onClick: () => navigate('/settings/preferences')
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

  // Enhanced Notifications dropdown
  const notificationMenuItems = notifications.map(notification => ({
    key: notification.id,
    label: (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="py-2 px-1"
      >
        <div className="flex items-start space-x-3">
          <div className={`w-2 h-2 rounded-full mt-2 ${
            notification.type === 'info' ? 'bg-blue-500' :
            notification.type === 'warning' ? 'bg-yellow-500' :
            'bg-green-500'
          }`} />
          <div className="flex-1">
            <Text strong className="block text-sm">{notification.title}</Text>
            <Text className="text-gray-500 text-xs">{notification.time}</Text>
            {notification.priority === 'high' && (
              <Badge status="error" text="High Priority" className="text-xs" />
            )}
          </div>
        </div>
      </motion.div>
    )
  }))

  // Enhanced Mobile sidebar
  const MobileSidebar = () => (
    <Drawer
      title={
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center"
        >
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
            className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3"
          >
            <RocketOutlined className="text-white" />
          </motion.div>
          <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PropVantage AI
          </span>
        </motion.div>
      }
      placement="left"
      onClose={() => setMobileDrawerVisible(false)}
      open={mobileDrawerVisible}
      bodyStyle={{ padding: 0 }}
      width={280}
      className="backdrop-blur-sm"
    >
      <div className="p-4 space-y-4">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          onClick={({ key }) => {
            navigate(key)
            setMobileDrawerVisible(false)
          }}
          style={{ border: 'none' }}
          className="bg-transparent"
        />
      </div>
    </Drawer>
  )

  // Enhanced Desktop sidebar
  const DesktopSidebar = () => (
    <motion.div
      variants={sidebarVariants}
      animate={sidebarCollapsed ? "collapsed" : "expanded"}
      className="relative"
    >
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        trigger={null}
        width={280}
        collapsedWidth={80}
        className="shadow-xl backdrop-blur-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          backdropFilter: 'blur(10px)',
          borderRadius: '0 16px 16px 0'
        }}
      >
        {/* Enhanced Logo */}
        <motion.div 
          className="h-16 flex items-center justify-center border-b border-gray-200 relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
          {sidebarCollapsed ? (
            <motion.div 
              whileHover={{ 
                rotate: 360,
                scale: 1.1,
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
              }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center relative"
            >
              <RocketOutlined className="text-white text-lg" />
              <motion.div
                className="absolute inset-0 bg-white rounded-xl opacity-0"
                whileHover={{ opacity: 0.2 }}
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <motion.div 
                whileHover={{ 
                  rotate: 360,
                  scale: 1.1,
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)"
                }}
                transition={{ duration: 0.5 }}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 relative"
              >
                <RocketOutlined className="text-white text-lg" />
                <motion.div
                  className="absolute inset-0 bg-white rounded-xl opacity-0"
                  whileHover={{ opacity: 0.2 }}
                />
              </motion.div>
              <Title level={4} className="m-0 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PropVantage AI
              </Title>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Navigation Menu */}
        <div className="mt-4 px-2">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={sidebarCollapsed ? [] : undefined}
            items={getMenuItems().map(item => ({
              ...item,
              label: (
                <motion.div
                  variants={menuItemVariants}
                  whileHover="hover"
                  className="flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-2"
                    >
                      <Badge 
                        size="small" 
                        status="processing" 
                        text={item.badge}
                        className="text-xs"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )
            }))}
            onClick={({ key }) => navigate(key)}
            style={{ 
              border: 'none',
              background: 'transparent'
            }}
            className="enhanced-menu"
          />
        </div>

        {/* Enhanced User info at bottom */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-4 right-4"
            >
              <motion.div
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)"
                }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 backdrop-blur-sm border border-blue-100"
              >
                <div className="flex items-center space-x-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative"
                  >
                    <Avatar 
                      size="default" 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                      icon={<UserOutlined />}
                    >
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </Avatar>
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <Text className="block text-sm font-semibold text-gray-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </Text>
                    <Text className="block text-xs text-gray-500 truncate">
                      {user?.role}
                    </Text>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"
                  >
                    <StarOutlined className="text-white text-xs" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Sider>
    </motion.div>
  )

  return (
    <motion.div
      variants={layoutVariants}
      initial="initial"
      animate="animate"
      className="relative"
    >
      {/* Floating background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/10 to-pink-400/10 rounded-full blur-3xl" />
      </div>

      <Layout className="min-h-screen relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <DesktopSidebar />
        </div>

        {/* Mobile Sidebar */}
        <MobileSidebar />

        <Layout>
          {/* Enhanced Header */}
          <motion.div
            ref={headerRef}
            variants={headerVariants}
            initial="initial"
            animate="animate"
          >
            <Header
              className={`backdrop-blur-sm transition-all duration-300 ${
                isScrolled 
                  ? 'bg-white/80 shadow-lg border-b border-gray-200/50' 
                  : 'bg-white/90 shadow-sm border-b border-gray-200'
              }`}
              style={{ 
                padding: '0 24px',
                height: '72px',
                lineHeight: '72px',
                position: 'sticky',
                top: 0,
                zIndex: 100
              }}
            >
              <div className="flex items-center justify-between h-full">
                {/* Left side - Menu trigger and breadcrumbs */}
                <div className="flex items-center space-x-6">
                  {/* Mobile menu trigger */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      type="text"
                      icon={<MenuUnfoldOutlined />}
                      onClick={() => setMobileDrawerVisible(true)}
                      className="lg:hidden hover:bg-blue-50 rounded-xl"
                    />
                  </motion.div>

                  {/* Desktop sidebar toggle */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      type="text"
                      icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="hidden lg:flex hover:bg-blue-50 rounded-xl"
                    />
                  </motion.div>

                  {/* Enhanced Breadcrumbs */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden md:flex relative"
                  >
                    <Breadcrumb
                      separator={
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className="text-gray-400"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      }
                      items={breadcrumbs.map((crumb, index) => ({
                        title: crumb.path ? (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link 
                              to={crumb.path} 
                              className="flex items-center space-x-2 hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-blue-50"
                            >
                              {crumb.icon && (
                                <motion.span
                                  whileHover={{ rotate: 360 }}
                                  transition={{ duration: 0.5 }}
                                >
                                  {crumb.icon}
                                </motion.span>
                              )}
                              <span className="font-medium">{crumb.title}</span>
                            </Link>
                          </motion.div>
                        ) : (
                          <span className="text-gray-500 font-medium px-2 py-1">
                            {crumb.title}
                          </span>
                        )
                      }))}
                    />
                    <QuickSearch 
                      isVisible={quickSearchVisible}
                      onClose={() => setQuickSearchVisible(false)}
                    />
                  </motion.div>
                </div>

                {/* Right side - Actions and user menu */}
                <div className="flex items-center space-x-4">
                  {/* Quick Search */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="text"
                      icon={<Search className="w-4 h-4" />}
                      onClick={() => setQuickSearchVisible(!quickSearchVisible)}
                      className="hidden md:flex hover:bg-blue-50 rounded-xl"
                    />
                  </motion.div>

                  {/* Current project indicator */}
                  <AnimatePresence>
                    {currentProject && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        className="hidden md:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </motion.div>
                        <Text className="text-blue-600 font-semibold text-sm">
                          {currentProject.name}
                        </Text>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-green-500 rounded-full"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Enhanced Notifications */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Dropdown
                      menu={{ items: notificationMenuItems }}
                      trigger={['click']}
                      placement="bottomRight"
                      dropdownRender={(menu) => (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                            <Text className="font-semibold text-gray-900">Notifications</Text>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {menu}
                          </div>
                        </motion.div>
                      )}
                    >
                      <div className="relative">
                        <Badge count={notifications.length} size="small">
                          <Button
                            type="text"
                            icon={<BellOutlined />}
                            className="flex items-center justify-center hover:bg-blue-50 rounded-xl"
                          />
                        </Badge>
                        <motion.div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </Dropdown>
                  </motion.div>

                  {/* Enhanced User menu */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Dropdown
                      menu={{ items: userMenuItems }}
                      trigger={['click']}
                      placement="bottomRight"
                      dropdownRender={(menu) => (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                            <Text className="font-semibold text-gray-900">
                              {user?.firstName} {user?.lastName}
                            </Text>
                            <Text className="text-sm text-gray-500">{user?.role}</Text>
                          </div>
                          {menu}
                        </motion.div>
                      )}
                    >
                      <div className="flex items-center space-x-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-xl px-3 py-2 transition-all duration-200">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="relative"
                        >
                          <Avatar 
                            size="default" 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg"
                            icon={<UserOutlined />}
                          >
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </Avatar>
                          <motion.div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </motion.div>
                        <div className="hidden md:block">
                          <Text className="block text-sm font-semibold text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </Text>
                          <Text className="block text-xs text-gray-500">
                            {user?.role}
                          </Text>
                        </div>
                      </div>
                    </Dropdown>
                  </motion.div>
                </div>
              </div>
            </Header>
          </motion.div>

          {/* Enhanced Main Content */}
          <Content
            className="relative"
            style={{
              minHeight: 'calc(100vh - 72px)',
              padding: '32px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={contentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full relative"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Content>
        </Layout>
      </Layout>

      {/* Enhanced Floating Action Button */}
      <FloatingActionButton
        onClick={() => setQuickSearchVisible(true)}
        icon={<Sparkles className="w-5 h-5" />}
        tooltip="Quick Actions"
      />

      {/* Enhanced Styles */}
      <style jsx global>{`
        .enhanced-menu .ant-menu-item {
          margin: 4px 0;
          border-radius: 12px;
          transition: all 0.3s ease;
          border: none;
          height: 48px;
          line-height: 48px;
          overflow: hidden;
          position: relative;
        }
        
        .enhanced-menu .ant-menu-item:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .enhanced-menu .ant-menu-item-selected {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%);
          border-left: 4px solid #3b82f6;
          font-weight: 600;
          color: #3b82f6;
        }
        
        .enhanced-menu .ant-menu-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .enhanced-menu .ant-menu-item:hover::before {
          opacity: 1;
        }
        
        .enhanced-menu .ant-menu-submenu-title {
          margin: 4px 0;
          border-radius: 12px;
          transition: all 0.3s ease;
          height: 48px;
          line-height: 48px;
        }
        
        .enhanced-menu .ant-menu-submenu-title:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          transform: translateX(4px);
        }
        
        .ant-dropdown {
          backdrop-filter: blur(10px);
        }
        
        .ant-layout-header {
          backdrop-filter: blur(10px);
        }
        
        .ant-drawer-body {
          backdrop-filter: blur(10px);
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
        }
      `}</style>
    </motion.div>
  )
}

export default DashboardLayout