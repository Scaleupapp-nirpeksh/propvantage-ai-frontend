// =============================================================================
// File: src/pages/auth/RegisterPage.jsx
// Description: Magical multi-step registration wizard with enhanced UX
// Features: Advanced animations, glassmorphism, particles, smooth transitions
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
  Typography, 
  Steps,
  Row,
  Col,
  Alert,
  Select,
  Checkbox,
  message,
  Progress,
  Divider,
  Space,
  Tooltip,
  Badge
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  SafetyOutlined,
  GlobalOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import { 
  Building2, 
  Users, 
  Target, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Sparkles,
  Shield,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Crown,
  Star,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Cpu,
  BarChart3,
  TrendingUp,
  Heart,
  Clock,
  Palette
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { PROJECT_TYPES } from '../../constants'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Step } = Steps

// Enhanced Animation variants
const pageVariants = {
  initial: { opacity: 0, scale: 0.95 },
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
    transition: { duration: 0.5 }
  }
}

const leftPanelVariants = {
  initial: { x: -100, opacity: 0 },
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
  initial: { x: 100, opacity: 0 },
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

const stepVariants = {
  initial: { opacity: 0, x: 50, scale: 0.95 },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: { 
      duration: 0.5, 
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: { 
    opacity: 0, 
    x: -50,
    scale: 0.95,
    transition: { 
      duration: 0.3, 
      ease: [0.22, 1, 0.36, 1]
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

// Enhanced Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => i)
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            background: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`,
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%'
          }}
          animate={{
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: Math.random() * 8 + 8,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  )
}

// Enhanced progress circle
const ProgressCircle = ({ percent, color = "#3b82f6", size = 60 }) => {
  const circumference = 2 * Math.PI * 18
  const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`
  
  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={18}
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="4"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={18}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-white">{Math.round(percent)}%</span>
      </div>
    </div>
  )
}

// Enhanced form field component
const MagicalFormField = ({ children, label, name, rules, className = "", span = 24 }) => {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const [isValid, setIsValid] = useState(null)
  
  return (
    <Col span={span}>
      <motion.div
        className={`relative ${className}`}
        variants={inputVariants}
        animate={isFocused ? "focus" : "blur"}
      >
        <Form.Item
          name={name}
          label={
            <motion.span
              className="text-gray-700 font-semibold flex items-center"
              animate={isFocused ? { color: "#3b82f6" } : { color: "#374151" }}
            >
              {label}
              {isValid === true && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </motion.span>
              )}
            </motion.span>
          }
          rules={rules}
        >
          <div className="relative">
            {React.cloneElement(children, {
              onFocus: () => setIsFocused(true),
              onBlur: () => setIsFocused(false),
              onChange: (e) => {
                const value = e.target ? e.target.value : e
                setHasValue(value && value.length > 0)
                if (children.props.onChange) {
                  children.props.onChange(e)
                }
              },
              className: `${children.props.className || ''} transition-all duration-300`
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
    </Col>
  )
}

// Enhanced step indicator
const StepIndicator = ({ steps, currentStep }) => (
  <div className="flex justify-between items-center mb-8">
    {steps.slice(0, 3).map((step, index) => (
      <div key={index} className="flex items-center">
        <motion.div
          className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 ${
            index <= currentStep 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 text-white' 
              : 'bg-gray-100 border-gray-300 text-gray-400'
          }`}
          whileHover={{ scale: 1.1 }}
          animate={{
            backgroundColor: index <= currentStep ? '#3b82f6' : '#f3f4f6',
            borderColor: index <= currentStep ? '#3b82f6' : '#d1d5db'
          }}
          transition={{ duration: 0.3 }}
        >
          {index < currentStep ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle className="w-6 h-6" />
            </motion.div>
          ) : (
            step.icon
          )}
          {index <= currentStep && (
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: `0 0 0 ${index === currentStep ? 4 : 2}px rgba(59, 130, 246, 0.3)`
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
        <div className="ml-3">
          <div className={`font-semibold ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
            {step.title}
          </div>
          <div className="text-xs text-gray-500">{step.description}</div>
        </div>
        {index < steps.length - 2 && (
          <motion.div
            className={`flex-1 h-0.5 mx-4 ${index < currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: index < currentStep ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>
    ))}
  </div>
)

const RegisterPage = () => {
  // State management
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [formProgress, setFormProgress] = useState(0)
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 })
  
  // Auth store
  const { register, isLoading, error, clearError } = useAuthStore()

  // Clear errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  // Calculate form progress
  useEffect(() => {
    const values = form.getFieldsValue()
    const allFields = [
      'organizationName', 'industry', 'organizationType',
      'firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phoneNumber',
      'businessAddress', 'city', 'state', 'country', 'termsAccepted'
    ]
    const filledFields = allFields.filter(field => values[field] && values[field] !== '').length
    setFormProgress((filledFields / allFields.length) * 100)
  }, [form])

  // Step configuration
  const steps = [
    {
      title: 'Organization',
      icon: <Building2 className="w-6 h-6" />,
      description: 'Company details',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Admin User',
      icon: <User className="w-6 h-6" />,
      description: 'Your account',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Business Info',
      icon: <MapPin className="w-6 h-6" />,
      description: 'Business details',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Complete',
      icon: <CheckCircle className="w-6 h-6" />,
      description: 'All set!',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  // Handle step navigation
  const nextStep = async () => {
    try {
      const currentFields = getStepFields(currentStep)
      await form.validateFields(currentFields)
      
      const values = form.getFieldsValue()
      setFormData(prev => ({ ...prev, ...values }))
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Get fields for current step validation
  const getStepFields = (step) => {
    switch (step) {
      case 0:
        return ['organizationName', 'industry', 'organizationType']
      case 1:
        return ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'phoneNumber']
      case 2:
        return ['businessAddress', 'city', 'state', 'country', 'termsAccepted']
      default:
        return []
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

  // Handle final form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      const values = form.getFieldsValue()
      const finalData = { ...formData, ...values }
      
      await form.validateFields()
      
      const registrationData = {
        organizationName: finalData.organizationName,
        industry: finalData.industry,
        organizationType: finalData.organizationType,
        businessAddress: finalData.businessAddress,
        city: finalData.city,
        state: finalData.state,
        country: finalData.country,
        firstName: finalData.firstName,
        lastName: finalData.lastName,
        email: finalData.email,
        password: finalData.password,
        phoneNumber: finalData.phoneNumber,
        role: 'Business Head'
      }

      const result = await register(registrationData)
      
      if (result.success) {
        setCurrentStep(3)
        message.success('Organization created successfully!')
        
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 2000)
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <OrganizationStep />
      case 1:
        return <AdminUserStep />
      case 2:
        return <BusinessInfoStep />
      case 3:
        return <SuccessStep />
      default:
        return null
    }
  }

  // Step 1: Organization Details
  const OrganizationStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center mb-8">
        <motion.div 
          className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          whileHover={{ 
            scale: 1.1,
            rotate: 360,
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)"
          }}
          transition={{ duration: 0.8 }}
        >
          <Building2 className="w-10 h-10 text-white" />
        </motion.div>
        <Title level={2} className="mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Tell us about your organization
        </Title>
        <Text className="text-gray-600 text-lg">
          This information helps us customize PropVantage AI for your business
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <MagicalFormField
          name="organizationName"
          label="Organization Name"
          rules={[
            { required: true, message: 'Please enter your organization name' },
            { min: 2, message: 'Organization name must be at least 2 characters' }
          ]}
          span={24}
        >
          <Input
            prefix={
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <Building2 className="w-4 h-4 text-gray-400" />
              </motion.div>
            }
            placeholder="Enter your organization name"
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-blue-400 transition-colors"
          />
        </MagicalFormField>
        
        <MagicalFormField
          name="industry"
          label="Industry"
          rules={[{ required: true, message: 'Please select your industry' }]}
          span={12}
        >
          <Select 
            placeholder="Select industry" 
            size="large"
            className="h-12"
          >
            <Option value="real_estate_development">Real Estate Development</Option>
            <Option value="real_estate_brokerage">Real Estate Brokerage</Option>
            <Option value="property_management">Property Management</Option>
            <Option value="construction">Construction</Option>
            <Option value="architecture">Architecture & Design</Option>
            <Option value="other">Other</Option>
          </Select>
        </MagicalFormField>

        <MagicalFormField
          name="organizationType"
          label="Organization Type"
          rules={[{ required: true, message: 'Please select organization type' }]}
          span={12}
        >
          <Select 
            placeholder="Select type" 
            size="large"
            className="h-12"
          >
            <Option value="private_company">Private Company</Option>
            <Option value="public_company">Public Company</Option>
            <Option value="partnership">Partnership</Option>
            <Option value="sole_proprietorship">Sole Proprietorship</Option>
            <Option value="llp">LLP</Option>
          </Select>
        </MagicalFormField>
      </Row>
    </motion.div>
  )

  // Step 2: Admin User Details
  const AdminUserStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center mb-8">
        <motion.div 
          className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          whileHover={{ 
            scale: 1.1,
            rotate: 360,
            boxShadow: "0 0 30px rgba(34, 197, 94, 0.4)"
          }}
          transition={{ duration: 0.8 }}
        >
          <User className="w-10 h-10 text-white" />
        </motion.div>
        <Title level={2} className="mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Create your admin account
        </Title>
        <Text className="text-gray-600 text-lg">
          You'll be the primary administrator with full access to all features
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <MagicalFormField
          name="firstName"
          label="First Name"
          rules={[
            { required: true, message: 'Please enter your first name' },
            { min: 2, message: 'First name must be at least 2 characters' }
          ]}
          span={12}
        >
          <Input
            prefix={
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <User className="w-4 h-4 text-gray-400" />
              </motion.div>
            }
            placeholder="Enter your first name"
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="lastName"
          label="Last Name"
          rules={[
            { required: true, message: 'Please enter your last name' },
            { min: 2, message: 'Last name must be at least 2 characters' }
          ]}
          span={12}
        >
          <Input
            prefix={
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <User className="w-4 h-4 text-gray-400" />
              </motion.div>
            }
            placeholder="Enter your last name"
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter your email address' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
          span={12}
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
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="phoneNumber"
          label="Phone Number"
          rules={[
            { required: true, message: 'Please enter your phone number' },
            { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid Indian phone number' }
          ]}
          span={12}
        >
          <Input
            prefix={
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <Phone className="w-4 h-4 text-gray-400" />
              </motion.div>
            }
            placeholder="Enter your phone number"
            size="large"
            maxLength={10}
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 8, message: 'Password must be at least 8 characters' },
            {
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
              message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            }
          ]}
          span={12}
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
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 transition-colors"
            onChange={(e) => setPasswordStrength(calculatePasswordStrength(e.target.value))}
          />
        </MagicalFormField>

        <MagicalFormField
          name="confirmPassword"
          label="Confirm Password"
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Passwords do not match'))
              }
            })
          ]}
          span={12}
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
            placeholder="Confirm your password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-green-400 transition-colors"
          />
        </MagicalFormField>

        {/* Password strength indicator */}
        {passwordStrength > 0 && (
          <Col span={24}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Text className="text-sm font-medium">Password Strength</Text>
                <Text className="text-sm">
                  {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Good' : 'Strong'}
                </Text>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${
                    passwordStrength < 50 ? 'bg-red-500' : 
                    passwordStrength < 75 ? 'bg-yellow-500' : 
                    'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${passwordStrength}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </Col>
        )}
      </Row>
    </motion.div>
  )

  // Step 3: Business Information
  const BusinessInfoStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center mb-8">
        <motion.div 
          className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          whileHover={{ 
            scale: 1.1,
            rotate: 360,
            boxShadow: "0 0 30px rgba(147, 51, 234, 0.4)"
          }}
          transition={{ duration: 0.8 }}
        >
          <MapPin className="w-10 h-10 text-white" />
        </motion.div>
        <Title level={2} className="mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Business details
        </Title>
        <Text className="text-gray-600 text-lg">
          Help us set up your workspace with location and business information
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <MagicalFormField
          name="businessAddress"
          label="Business Address"
          rules={[{ required: true, message: 'Please enter your business address' }]}
          span={24}
        >
          <Input.TextArea
            placeholder="Enter your complete business address"
            rows={3}
            size="large"
            className="rounded-lg border-gray-300 hover:border-purple-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="city"
          label="City"
          rules={[{ required: true, message: 'Please enter your city' }]}
          span={8}
        >
          <Input
            prefix={
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <MapPin className="w-4 h-4 text-gray-400" />
              </motion.div>
            }
            placeholder="Enter city"
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-purple-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="state"
          label="State"
          rules={[{ required: true, message: 'Please enter your state' }]}
          span={8}
        >
          <Input
            prefix={
              <motion.div
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.2 }}
              >
                <MapPin className="w-4 h-4 text-gray-400" />
              </motion.div>
            }
            placeholder="Enter state"
            size="large"
            className="h-12 rounded-lg border-gray-300 hover:border-purple-400 transition-colors"
          />
        </MagicalFormField>

        <MagicalFormField
          name="country"
          label="Country"
          rules={[{ required: true, message: 'Please select your country' }]}
          span={8}
        >
          <Select 
            placeholder="Select country" 
            size="large"
            className="h-12"
            defaultValue="India"
          >
            <Option value="India">India</Option>
            <Option value="United States">United States</Option>
            <Option value="United Kingdom">United Kingdom</Option>
            <Option value="Canada">Canada</Option>
            <Option value="Australia">Australia</Option>
            <Option value="Other">Other</Option>
          </Select>
        </MagicalFormField>

        <Col span={24}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100"
          >
            <Form.Item
              name="termsAccepted"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions'))
                }
              ]}
            >
              <Checkbox className="text-gray-700">
                I agree to the{' '}
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-block"
                >
                  <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Terms of Service
                  </a>
                </motion.span>
                {' '}and{' '}
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="inline-block"
                >
                  <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                    Privacy Policy
                  </a>
                </motion.span>
              </Checkbox>
            </Form.Item>
          </motion.div>
        </Col>
      </Row>
    </motion.div>
  )

  // Step 4: Success
  const SuccessStep = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      className="text-center"
    >
      <motion.div 
        className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 0 0px rgba(34, 197, 94, 0.3)",
            "0 0 0 20px rgba(34, 197, 94, 0.1)",
            "0 0 0 0px rgba(34, 197, 94, 0.3)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <CheckCircle className="w-12 h-12 text-white" />
      </motion.div>
      
      <Title level={1} className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
        Welcome to PropVantage AI!
      </Title>
      
      <Paragraph className="text-xl text-gray-600 mb-8">
        Your organization has been successfully created. You'll be redirected to your dashboard shortly.
      </Paragraph>

      <motion.div 
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8 border border-blue-100"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Title level={3} className="text-gray-800 mb-6">What's next?</Title>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <Building2 className="w-5 h-5" />, text: "Set up your first project", color: "text-blue-600" },
            { icon: <Users className="w-5 h-5" />, text: "Invite team members", color: "text-green-600" },
            { icon: <TrendingUp className="w-5 h-5" />, text: "Configure sales pipeline", color: "text-purple-600" },
            { icon: <Target className="w-5 h-5" />, text: "Start capturing leads", color: "text-orange-600" }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="flex items-center space-x-3 p-3 rounded-lg bg-white shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className={`${item.color}`}>
                {item.icon}
              </div>
              <Text className="text-sm font-medium">{item.text}</Text>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="mb-6"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 2 }}
      >
        <Progress 
          percent={100} 
          strokeColor={{
            '0%': '#10b981',
            '100%': '#059669'
          }}
          showInfo={false}
          strokeWidth={8}
        />
      </motion.div>
      
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Text className="text-gray-500 text-lg">Redirecting to dashboard...</Text>
      </motion.div>
    </motion.div>
  )

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
        {/* Left Panel - Progress and Features */}
        <motion.div 
          className="hidden lg:flex lg:w-2/5 relative overflow-hidden"
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
            {/* Enhanced Logo */}
            <motion.div 
              className="mb-12"
              variants={stepVariants}
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
                      Setting up your organization...
                    </Text>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            {/* Enhanced Progress Section */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Text className="text-white font-bold text-lg">Setup Progress</Text>
                  <Text className="text-white/70">Step {currentStep + 1} of {steps.length}</Text>
                </div>
                <ProgressCircle 
                  percent={((currentStep + 1) / steps.length) * 100}
                  color="#ffffff"
                />
              </div>
              
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      index <= currentStep ? 'bg-white/10' : 'bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < currentStep ? 'bg-green-500' :
                      index === currentStep ? 'bg-white' : 'bg-white/20'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${
                          index === currentStep ? 'bg-purple-600' : 'bg-white/40'
                        }`} />
                      )}
                    </div>
                    <div>
                      <Text className={`font-semibold ${
                        index <= currentStep ? 'text-white' : 'text-white/60'
                      }`}>
                        {step.title}
                      </Text>
                      <Text className="text-white/60 text-sm">{step.description}</Text>
                    </div>
                    {index === currentStep && (
                      <motion.div
                        className="ml-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5 text-white/80" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Enhanced Benefits */}
            <div className="space-y-6">
              {[
                {
                  icon: <Award className="w-6 h-6" />,
                  title: "Industry Leading Platform",
                  description: "Join thousands of real estate professionals using PropVantage AI",
                  color: "from-yellow-400 to-orange-400"
                },
                {
                  icon: <Target className="w-6 h-6" />,
                  title: "Complete Solution",
                  description: "Everything you need from lead capture to project delivery",
                  color: "from-green-400 to-blue-400"
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Team Collaboration",
                  description: "Built for teams with role-based access and real-time updates",
                  color: "from-purple-400 to-pink-400"
                }
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                >
                  <div className="flex items-start space-x-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <motion.div 
                      className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${benefit.color} rounded-xl flex items-center justify-center shadow-lg`}
                      whileHover={{ 
                        scale: 1.1,
                        boxShadow: "0 0 25px rgba(255, 255, 255, 0.2)"
                      }}
                    >
                      {benefit.icon}
                    </motion.div>
                    <div className="flex-1">
                      <Text className="text-white font-bold text-lg block mb-2">
                        {benefit.title}
                      </Text>
                      <Text className="text-white/80 text-sm leading-relaxed">
                        {benefit.description}
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

            {/* Enhanced Stats */}
            <motion.div 
              className="mt-12 grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              {[
                { value: "500+", label: "Happy Clients", icon: <Users className="w-5 h-5" /> },
                { value: "99.9%", label: "Uptime", icon: <Shield className="w-5 h-5" /> },
                { value: "24/7", label: "Support", icon: <Heart className="w-5 h-5" /> }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)"
                  }}
                  animate={{ 
                    scale: [1, 1.02, 1],
                  }}
                  transition={{ 
                    scale: { duration: 3, repeat: Infinity, delay: index * 0.5 }
                  }}
                >
                  <div className="flex items-center justify-center mb-2">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <Text className="text-white/70 text-sm">{stat.label}</Text>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right Panel - Registration Form */}
        <motion.div 
          className="flex-1 flex items-center justify-center px-6 py-12 relative"
          variants={rightPanelVariants}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
        >
          <motion.div
            className="w-full max-w-3xl relative"
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            {/* Mobile Header */}
            <motion.div 
              className="lg:hidden text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-600 rounded-3xl mb-4 shadow-2xl"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 360,
                  boxShadow: "0 0 40px rgba(147, 51, 234, 0.4)"
                }}
                transition={{ duration: 0.8 }}
              >
                <RocketOutlined className="text-3xl text-white" />
              </motion.div>
              <Title level={1} className="text-white m-0 font-bold text-3xl">
                PropVantage AI
              </Title>
              <Text className="text-white/80 text-lg">
                Create your organization
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
                styles={{ body: { padding: '3rem' } }}
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

                {/* Enhanced Steps Header */}
                {currentStep < 3 && (
                  <div className="mb-8">
                    <StepIndicator steps={steps} currentStep={currentStep} />
                  </div>
                )}

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
                        message="Registration Failed"
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

                {/* Enhanced Form */}
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSubmit}
                  autoComplete="off"
                  size="large"
                  className="space-y-6"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Enhanced Navigation Buttons */}
                  {currentStep < 3 && (
                    <motion.div 
                      className="flex justify-between mt-8 pt-6 border-t border-gray-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <motion.div
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        whileHover={currentStep === 0 ? {} : "hover"}
                        whileTap={currentStep === 0 ? {} : "tap"}
                      >
                        <Button
                          type="default"
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          icon={<ArrowLeft className="w-4 h-4" />}
                          size="large"
                          className="h-12 px-8 rounded-lg font-semibold"
                        >
                          Previous
                        </Button>
                      </motion.div>

                      <motion.div
                        variants={buttonVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        whileTap="tap"
                        className="relative"
                      >
                        {currentStep < 2 ? (
                          <Button
                            type="primary"
                            onClick={nextStep}
                            icon={<ArrowRight className="w-4 h-4" />}
                            size="large"
                            className="h-12 px-8 rounded-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 relative overflow-hidden"
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: "100%" }}
                              transition={{ duration: 0.5 }}
                            />
                            <span className="relative z-10">Next</span>
                          </Button>
                        ) : (
                          <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            icon={<CheckCircle className="w-4 h-4" />}
                            size="large"
                            className="h-12 px-8 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 border-none hover:from-green-600 hover:to-emerald-700 relative overflow-hidden"
                            disabled={isSubmitting}
                          >
                            <motion.div
                              className="absolute inset-0 bg-white/20"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: "100%" }}
                              transition={{ duration: 0.5 }}
                            />
                            <span className="relative z-10">
                              {isSubmitting ? 'Creating Organization...' : 'Complete Setup'}
                            </span>
                          </Button>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </Form>

                {/* Enhanced Login Link */}
                {currentStep < 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Divider className="my-8">
                      <Text className="text-gray-400 text-sm font-medium">Already have an account?</Text>
                    </Divider>
                    <div className="text-center">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                      >
                        <Link 
                          to="/login" 
                          className="text-blue-600 hover:text-blue-700 font-bold text-lg transition-colors"
                        >
                          Sign in to your account
                        </Link>
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </Card>
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
        
        .ant-select:focus,
        .ant-select-focused {
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
        
        .ant-steps-item-process .ant-steps-item-icon {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        
        .ant-steps-item-finish .ant-steps-item-icon {
          background-color: #10b981;
          border-color: #10b981;
        }
        
        .ant-card {
          backdrop-filter: blur(10px);
        }
        
        .ant-alert-error {
          border-radius: 8px;
          border: 1px solid #fecaca;
        }
        
        /* Custom scrollbar */
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

export default RegisterPage