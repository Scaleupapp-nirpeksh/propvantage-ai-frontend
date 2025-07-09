// =============================================================================
// File: src/pages/auth/LoginPage.jsx
// Description: Magical login page with enhanced UX, animations, and interactions
// Features: Advanced animations, glassmorphism, particles, responsive design
// Dependencies: Ant Design, React Hook Form, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Checkbox, 
  Typography, 
  Space, 
  Alert,
  Divider,
  Row,
  Col,
  Progress,
  Tooltip
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  HomeOutlined,
  RocketOutlined,
  SafetyOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { 
  Building2, 
  Users, 
  Target, 
  Zap, 
  Sparkles,
  Shield,
  Award,
  TrendingUp,
  Heart,
  Star,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle,
  Globe,
  Cpu,
  BarChart3
} from 'lucide-react'
import useAuthStore from '../../store/authStore'

const { Title, Text, Paragraph } = Typography

// Enhanced Animation variants
const pageVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: {
      duration: 0.5
    }
  }
}

const leftPanelVariants = {
  initial: { 
    x: -100, 
    opacity: 0 
  },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1
    }
  }
}

const rightPanelVariants = {
  initial: { 
    x: 100, 
    opacity: 0 
  },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.2
    }
  }
}

const cardVariants = {
  initial: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.3
    }
  }
}

const featureVariants = {
  initial: { 
    opacity: 0, 
    x: -30,
    scale: 0.8
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  }
}

const inputVariants = {
  focus: {
    scale: 1.02,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 }
  },
  blur: {
    scale: 1,
    boxShadow: "0 0 0 0px rgba(59, 130, 246, 0.1)",
    transition: { duration: 0.2 }
  }
}

const buttonVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.25)",
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}

// Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => i)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%'
          }}
        />
      ))}
    </div>
  )
}

// Enhanced loading component
const EnhancedLoader = ({ loading }) => (
  <AnimatePresence>
    {loading && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          className="bg-white rounded-2xl p-8 shadow-2xl"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
        >
          <div className="flex flex-col items-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <Text className="text-gray-700 font-medium">Signing you in...</Text>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

// Enhanced form field component
const MagicalFormField = ({ children, label, name, rules, className = "" }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  
  return (
    <motion.div
      className={`relative ${className}`}
      variants={inputVariants}
      animate={isFocused ? "focus" : "blur"}
    >
      <Form.Item
        name={name}
        label={
          <motion.span
            className="text-gray-700 font-medium"
            animate={isFocused ? { color: "#3b82f6" } : { color: "#374151" }}
          >
            {label}
          </motion.span>
        }
        rules={rules}
      >
        <div className="relative">
          {React.cloneElement(children, {
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            onChange: (e) => {
              setHasValue(e.target.value.length > 0)
              if (children.props.onChange) {
                children.props.onChange(e)
              }
            }
          })}
          <motion.div
            className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: isFocused ? 1 : 0,
              scale: isFocused ? 1 : 0.95
            }}
            transition={{ duration: 0.2 }}
          />
        </div>
      </Form.Item>
    </motion.div>
  )
}

// Success checkmark animation
const SuccessCheckmark = ({ visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-lg"
      >
        <CheckCircle className="w-6 h-6 text-white" />
      </motion.div>
    )}
  </AnimatePresence>
)

const LoginPage = () => {
  // State management
  const [form] = Form.useForm()
  const [rememberMe, setRememberMe] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formProgress, setFormProgress] = useState(0)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  
  // Auth store actions and state
  const { login, isLoading, error, clearError } = useAuthStore()

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  // Calculate form progress
  useEffect(() => {
    const values = form.getFieldsValue()
    const filledFields = Object.values(values).filter(value => value && value.length > 0).length
    const totalFields = 2 // email and password
    setFormProgress((filledFields / totalFields) * 100)
  }, [form])

  // Handle form submission with enhanced feedback
  const handleLogin = async (values) => {
    try {
      setIsSuccess(false)
      const result = await login({
        email: values.email,
        password: values.password
      })

      if (result.success) {
        setIsSuccess(true)
        
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('propvantage_remember', 'true')
        }
        
        // Delay navigation for success animation
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1000)
      }
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  // Handle form field changes to clear errors
  const handleFieldChange = () => {
    if (error) {
      clearError()
    }
  }

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return 0
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  // Enhanced features with better icons and descriptions
  const features = [
    {
      icon: <Building2 className="w-5 h-5" />,
      title: "Project Management",
      description: "Manage multiple real estate projects with complete tower and unit hierarchy",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Lead Management", 
      description: "AI-powered lead scoring and automated sales pipeline management",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Sales Analytics",
      description: "Real-time dashboards with predictive analytics and revenue forecasting",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: <Cpu className="w-5 h-5" />,
      title: "AI Insights",
      description: "Smart recommendations for pricing, follow-ups, and sales strategies",
      color: "from-orange-500 to-red-500"
    }
  ]

  // Trust indicators with enhanced styling
  const trustIndicators = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Bank-Grade Security",
      subtitle: "256-bit SSL encryption",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Award className="w-5 h-5" />,
      title: "Industry Leader",
      subtitle: "Trusted by 500+ teams",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "Global Reach",
      subtitle: "Available worldwide",
      color: "from-green-500 to-teal-500"
    }
  ]

  return (
    <motion.div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Features and Branding */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
          variants={leftPanelVariants}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
        >
          {/* Floating particles */}
          <FloatingParticles />
          
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <motion.div 
              className="absolute inset-0"
              animate={{
                backgroundPosition: ['0px 0px', '60px 60px']
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Enhanced Logo and Brand */}
            <motion.div 
              className="mb-12"
              variants={featureVariants}
            >
              <motion.div 
                className="flex items-center mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mr-4 border border-white/20"
                  whileHover={{ 
                    rotate: 360,
                    boxShadow: "0 0 30px rgba(255, 255, 255, 0.3)"
                  }}
                  transition={{ duration: 0.8 }}
                >
                  <RocketOutlined className="text-3xl text-white" />
                </motion.div>
                <div>
                  <Title level={1} className="text-white m-0 font-bold text-4xl">
                    PropVantage AI
                  </Title>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Text className="text-white/80 text-lg font-medium">
                      Real Estate CRM & Analytics Platform
                    </Text>
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Paragraph className="text-white/90 text-xl leading-relaxed">
                  Transform your real estate business with AI-powered insights, 
                  automated workflows, and comprehensive project management tools.
                </Paragraph>
              </motion.div>
            </motion.div>

            {/* Enhanced Features List */}
            <div className="space-y-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group"
                  variants={featureVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                >
                  <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <motion.div 
                      className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0 0 25px rgba(255, 255, 255, 0.2)"
                      }}
                    >
                      {feature.icon}
                    </motion.div>
                    <div className="flex-1">
                      <Text className="text-white font-bold text-lg block mb-2">
                        {feature.title}
                      </Text>
                      <Text className="text-white/80 text-sm leading-relaxed">
                        {feature.description}
                      </Text>
                    </div>
                    <motion.div
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      whileHover={{ x: 5 }}
                    >
                      <ArrowRight className="w-5 h-5 text-white/60" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Trust Indicators */}
            <motion.div 
              className="mt-16 pt-8 border-t border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <div className="grid grid-cols-3 gap-4">
                {trustIndicators.map((indicator, index) => (
                  <motion.div
                    key={indicator.title}
                    className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)"
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 + index * 0.1 }}
                  >
                    <motion.div 
                      className={`inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r ${indicator.color} rounded-lg mb-2`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {indicator.icon}
                    </motion.div>
                    <Text className="text-white font-semibold text-sm block">
                      {indicator.title}
                    </Text>
                    <Text className="text-white/70 text-xs">
                      {indicator.subtitle}
                    </Text>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div 
              className="mt-8 grid grid-cols-2 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-3xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  500+
                </motion.div>
                <Text className="text-white/70 text-sm">Happy Clients</Text>
              </div>
              <div className="text-center">
                <motion.div
                  className="text-3xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  99.9%
                </motion.div>
                <Text className="text-white/70 text-sm">Uptime</Text>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Login Form */}
        <motion.div 
          className="flex-1 flex items-center justify-center px-6 py-12 relative"
          variants={rightPanelVariants}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
        >
          {/* Loading overlay */}
          <EnhancedLoader loading={isLoading} />

          <motion.div
            className="w-full max-w-md relative"
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            {/* Mobile Logo */}
            <motion.div 
              className="lg:hidden text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl mb-4 shadow-2xl"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 360,
                  boxShadow: "0 0 40px rgba(59, 130, 246, 0.4)"
                }}
                transition={{ duration: 0.8 }}
              >
                <RocketOutlined className="text-3xl text-white" />
              </motion.div>
              <Title level={2} className="text-white m-0 font-bold text-3xl">
                PropVantage AI
              </Title>
              <Text className="text-white/80 text-lg">
                Real Estate CRM & Analytics Platform
              </Text>
            </motion.div>

            {/* Enhanced Card */}
            <motion.div
              className="relative"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className="shadow-2xl border-0 backdrop-blur-lg bg-white/95 overflow-hidden"
                styles={{
                  body: { padding: '2.5rem' }
                }}
              >
                {/* Progress indicator */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${formProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Form Header */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Title level={2} className="text-gray-900 m-0 font-bold mb-2 text-3xl">
                    Welcome back
                  </Title>
                  <Text className="text-gray-600 text-lg">
                    Sign in to your PropVantage AI account
                  </Text>
                </motion.div>

                {/* Error Alert */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      className="mb-6"
                    >
                      <Alert
                        message="Login Failed"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={clearError}
                        className="rounded-lg border-red-200 bg-red-50"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Form */}
                <Form
                  form={form}
                  name="login"
                  layout="vertical"
                  onFinish={handleLogin}
                  onFieldsChange={handleFieldChange}
                  autoComplete="off"
                  size="large"
                  className="space-y-6"
                >
                  {/* Email Field */}
                  <MagicalFormField
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter your email address' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input
                      prefix={
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Mail className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      }
                      placeholder="Enter your email address"
                      autoComplete="email"
                      className="h-12 rounded-lg border-gray-300 hover:border-blue-400 transition-colors"
                    />
                  </MagicalFormField>

                  {/* Password Field */}
                  <MagicalFormField
                    name="password"
                    label="Password"
                    rules={[
                      { required: true, message: 'Please enter your password' },
                      { min: 6, message: 'Password must be at least 6 characters' }
                    ]}
                  >
                    <Input.Password
                      prefix={
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Lock className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      }
                      placeholder="Enter your password"
                      iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                      autoComplete="current-password"
                      className="h-12 rounded-lg border-gray-300 hover:border-blue-400 transition-colors"
                      onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
                    />
                  </MagicalFormField>

                  {/* Remember Me & Forgot Password */}
                  <motion.div 
                    className="flex items-center justify-between mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="text-gray-600"
                      >
                        <Text className="text-gray-600 font-medium">Remember me</Text>
                      </Checkbox>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link 
                        to="/forgot-password" 
                        className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* Enhanced Submit Button */}
                  <Form.Item className="mb-6">
                    <motion.div
                      variants={buttonVariants}
                      initial="initial"
                      animate="animate"
                      whileHover="hover"
                      whileTap="tap"
                      className="relative"
                    >
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        className="h-14 font-semibold text-lg rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 transition-all duration-300 relative overflow-hidden"
                        disabled={isLoading}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                        <span className="relative z-10 flex items-center justify-center">
                          {isLoading ? (
                            <>
                              <LoadingOutlined className="mr-2" />
                              Signing in...
                            </>
                          ) : (
                            <>
                              Sign in
                              <ArrowRight className="ml-2 w-5 h-5" />
                            </>
                          )}
                        </span>
                      </Button>
                      <SuccessCheckmark visible={isSuccess} />
                    </motion.div>
                  </Form.Item>
                </Form>

                {/* Enhanced Divider */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <Divider className="my-6">
                    <Text className="text-gray-400 text-sm font-medium">New to PropVantage AI?</Text>
                  </Divider>
                </motion.div>

                {/* Enhanced Register Link */}
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Text className="text-gray-600 text-lg">
                    Don't have an account?{' '}
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-block"
                    >
                      <Link 
                        to="/register" 
                        className="text-blue-600 hover:text-blue-700 font-bold transition-colors"
                      >
                        Create your organization
                      </Link>
                    </motion.span>
                  </Text>
                </motion.div>
              </Card>
            </motion.div>

            {/* Enhanced Footer */}
            <motion.div 
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Text className="text-white/80 text-sm">
                By signing in, you agree to our{' '}
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-block"
                >
                  <a href="#" className="text-white hover:text-white/90 font-medium underline">
                    Terms of Service
                  </a>
                </motion.span>
                {' '}and{' '}
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-block"
                >
                  <a href="#" className="text-white hover:text-white/90 font-medium underline">
                    Privacy Policy
                  </a>
                </motion.span>
              </Text>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Styles */}
      <style jsx global>{`
        .ant-form-item-label > label {
          font-weight: 600;
          color: #374151;
        }
        
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .ant-input:focus,
        .ant-input-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .ant-checkbox-wrapper:hover .ant-checkbox-inner,
        .ant-checkbox:hover .ant-checkbox-inner,
        .ant-checkbox-input:focus + .ant-checkbox-inner {
          border-color: #3b82f6;
        }
        
        .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        
        .ant-btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);
        }
        
        .ant-btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4);
        }
        
        .ant-card {
          backdrop-filter: blur(10px);
        }
        
        .ant-alert-error {
          border-radius: 8px;
          border: 1px solid #fecaca;
        }
        
        /* Custom scrollbar for mobile */
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  )
}

export default LoginPage