// =============================================================================
// File: src/pages/auth/LoginPage.jsx
// Description: Professional login page for PropVantage AI with modern design
// Features: Form validation, loading states, responsive design, forgot password
// Dependencies: Ant Design, React Hook Form, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  Col 
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  BuildingOutlined,
  RocketOutlined,
  SafetyOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { Building2, Users, Target, Zap } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const { Title, Text, Paragraph } = Typography

// Animation variants for smooth page transitions
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3
    }
  }
}

const cardVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.95 
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      delay: 0.2,
      ease: "easeOut"
    }
  }
}

const featureVariants = {
  initial: { 
    opacity: 0, 
    x: -30 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.5,
      delay: 0.4
    }
  }
}

const LoginPage = () => {
  // State management
  const [form] = Form.useForm()
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  
  // Auth store actions and state
  const { login, isLoading, error, clearError } = useAuthStore()

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  // Handle form submission
  const handleLogin = async (values) => {
    try {
      const result = await login({
        email: values.email,
        password: values.password
      })

      if (result.success) {
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('propvantage_remember', 'true')
        }
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true })
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

  // Feature highlights for the left side
  const features = [
    {
      icon: <Building2 className="w-5 h-5" />,
      title: "Project Management",
      description: "Manage multiple real estate projects with complete tower and unit hierarchy"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Lead Management", 
      description: "AI-powered lead scoring and automated sales pipeline management"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Sales Analytics",
      description: "Real-time dashboards with predictive analytics and revenue forecasting"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI Insights",
      description: "Smart recommendations for pricing, follow-ups, and sales strategies"
    }
  ]

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="min-h-screen flex">
        {/* Left Panel - Features and Branding */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 relative overflow-hidden"
          variants={featureVariants}
          initial="initial"
          animate="animate"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Logo and Brand */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                  <RocketOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <Title level={2} className="text-white m-0 font-bold">
                    PropVantage AI
                  </Title>
                  <Text className="text-blue-100 text-sm">
                    Real Estate CRM & Analytics Platform
                  </Text>
                </div>
              </div>
              
              <Paragraph className="text-blue-100 text-lg leading-relaxed">
                Transform your real estate business with AI-powered insights, 
                automated workflows, and comprehensive project management tools.
              </Paragraph>
            </div>

            {/* Features List */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="flex items-start space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <div>
                    <Text className="text-white font-semibold block mb-1">
                      {feature.title}
                    </Text>
                    <Text className="text-blue-100 text-sm leading-relaxed">
                      {feature.description}
                    </Text>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <div className="flex items-center justify-center text-white mb-2">
                    <SafetyOutlined className="text-xl mr-2" />
                    <Text className="text-white font-semibold">Secure</Text>
                  </div>
                  <Text className="text-blue-100 text-xs">
                    Enterprise-grade security
                  </Text>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-white mb-2">
                    <TrophyOutlined className="text-xl mr-2" />
                    <Text className="text-white font-semibold">Trusted</Text>
                  </div>
                  <Text className="text-blue-100 text-xs">
                    By 500+ real estate teams
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            className="w-full max-w-md"
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                <RocketOutlined className="text-2xl text-white" />
              </div>
              <Title level={2} className="text-gray-900 m-0 font-bold">
                PropVantage AI
              </Title>
              <Text className="text-gray-600">
                Real Estate CRM & Analytics Platform
              </Text>
            </div>

            <Card 
              className="shadow-xl border-0"
              styles={{
                body: { padding: '2rem' }
              }}
            >
              {/* Form Header */}
              <div className="text-center mb-8">
                <Title level={3} className="text-gray-900 m-0 font-bold mb-2">
                  Welcome back
                </Title>
                <Text className="text-gray-600">
                  Sign in to your PropVantage AI account
                </Text>
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Alert
                    message="Login Failed"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={clearError}
                  />
                </motion.div>
              )}

              {/* Login Form */}
              <Form
                form={form}
                name="login"
                layout="vertical"
                onFinish={handleLogin}
                onFieldsChange={handleFieldChange}
                autoComplete="off"
                size="large"
              >
                {/* Email Field */}
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email address' },
                    { type: 'email', message: 'Please enter a valid email address' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Enter your email address"
                    autoComplete="email"
                  />
                </Form.Item>

                {/* Password Field */}
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter your password"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    autoComplete="current-password"
                  />
                </Form.Item>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between mb-6">
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  >
                    <Text className="text-gray-600">Remember me</Text>
                  </Checkbox>
                  <Link 
                    to="/forgot-password" 
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Form.Item className="mb-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isLoading}
                    block
                    className="h-12 font-semibold"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </Form.Item>
              </Form>

              {/* Divider */}
              <Divider>
                <Text className="text-gray-400 text-sm">New to PropVantage AI?</Text>
              </Divider>

              {/* Register Link */}
              <div className="text-center">
                <Text className="text-gray-600">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Create your organization
                  </Link>
                </Text>
              </div>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8">
              <Text className="text-gray-500 text-sm">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </a>
              </Text>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default LoginPage