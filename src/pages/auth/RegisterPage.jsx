// =============================================================================
// File: src/pages/auth/RegisterPage.jsx
// Description: Multi-step organization registration wizard for PropVantage AI
// Features: 4-step wizard, form validation, progress tracking, animations
// Dependencies: Ant Design, React Hook Form, Framer Motion, Lucide React
// =============================================================================

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  Space
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  PhoneOutlined,
  BuildingOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { Building2, Users, Target, Award, MapPin, Phone, Mail, User } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { PROJECT_TYPES } from '../../constants'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Step } = Steps

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
}

const stepVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: -30,
    transition: { duration: 0.3, ease: "easeIn" }
  }
}

const RegisterPage = () => {
  // State management
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  
  // Auth store
  const { register, isLoading, error, clearError } = useAuthStore()

  // Clear errors when component mounts
  useEffect(() => {
    clearError()
  }, [clearError])

  // Step configuration
  const steps = [
    {
      title: 'Organization',
      icon: <BuildingOutlined />,
      description: 'Company details'
    },
    {
      title: 'Admin User',
      icon: <UserOutlined />,
      description: 'Your account'
    },
    {
      title: 'Business Info',
      icon: <TeamOutlined />,
      description: 'Business details'
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      description: 'All set!'
    }
  ]

  // Handle step navigation
  const nextStep = async () => {
    try {
      // Validate current step fields
      const currentFields = getStepFields(currentStep)
      await form.validateFields(currentFields)
      
      // Store form data
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

  // Handle final form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Get all form values
      const values = form.getFieldsValue()
      const finalData = { ...formData, ...values }
      
      // Validate all fields
      await form.validateFields()
      
      // Prepare registration data
      const registrationData = {
        // Organization data
        organizationName: finalData.organizationName,
        industry: finalData.industry,
        organizationType: finalData.organizationType,
        businessAddress: finalData.businessAddress,
        city: finalData.city,
        state: finalData.state,
        country: finalData.country,
        
        // Admin user data
        firstName: finalData.firstName,
        lastName: finalData.lastName,
        email: finalData.email,
        password: finalData.password,
        phoneNumber: finalData.phoneNumber,
        role: 'Business Head' // First user is always Business Head
      }

      // Submit registration
      const result = await register(registrationData)
      
      if (result.success) {
        setCurrentStep(3) // Move to success step
        message.success('Organization created successfully!')
        
        // Redirect to dashboard after short delay
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <Title level={3} className="mb-2">Tell us about your organization</Title>
        <Text className="text-gray-600">
          This information helps us customize PropVantage AI for your business
        </Text>
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="organizationName"
            label="Organization Name"
            rules={[
              { required: true, message: 'Please enter your organization name' },
              { min: 2, message: 'Organization name must be at least 2 characters' }
            ]}
          >
            <Input
              prefix={<BuildingOutlined className="text-gray-400" />}
              placeholder="Enter your organization name"
              size="large"
            />
          </Form.Item>
        </Col>
        
        <Col xs={24} md={12}>
          <Form.Item
            name="industry"
            label="Industry"
            rules={[{ required: true, message: 'Please select your industry' }]}
          >
            <Select placeholder="Select industry" size="large">
              <Option value="real_estate_development">Real Estate Development</Option>
              <Option value="real_estate_brokerage">Real Estate Brokerage</Option>
              <Option value="property_management">Property Management</Option>
              <Option value="construction">Construction</Option>
              <Option value="architecture">Architecture & Design</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="organizationType"
            label="Organization Type"
            rules={[{ required: true, message: 'Please select organization type' }]}
          >
            <Select placeholder="Select type" size="large">
              <Option value="private_company">Private Company</Option>
              <Option value="public_company">Public Company</Option>
              <Option value="partnership">Partnership</Option>
              <Option value="sole_proprietorship">Sole Proprietorship</Option>
              <Option value="llp">LLP</Option>
            </Select>
          </Form.Item>
        </Col>
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <Title level={3} className="mb-2">Create your admin account</Title>
        <Text className="text-gray-600">
          You'll be the primary administrator with full access to all features
        </Text>
      </div>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="firstName"
            label="First Name"
            rules={[
              { required: true, message: 'Please enter your first name' },
              { min: 2, message: 'First name must be at least 2 characters' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Enter your first name"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="lastName"
            label="Last Name"
            rules={[
              { required: true, message: 'Please enter your last name' },
              { min: 2, message: 'Last name must be at least 2 characters' }
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Enter your last name"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Enter your email address"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="phoneNumber"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please enter your phone number' },
              { pattern: /^[6-9]\d{9}$/, message: 'Please enter a valid Indian phone number' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined className="text-gray-400" />}
              placeholder="Enter your phone number"
              size="large"
              maxLength={10}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
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
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter your password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
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
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Confirm your password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              size="large"
            />
          </Form.Item>
        </Col>
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
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-purple-600" />
        </div>
        <Title level={3} className="mb-2">Business details</Title>
        <Text className="text-gray-600">
          Help us set up your workspace with location and business information
        </Text>
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="businessAddress"
            label="Business Address"
            rules={[{ required: true, message: 'Please enter your business address' }]}
          >
            <Input.TextArea
              placeholder="Enter your complete business address"
              rows={3}
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="city"
            label="City"
            rules={[{ required: true, message: 'Please enter your city' }]}
          >
            <Input
              prefix={<EnvironmentOutlined className="text-gray-400" />}
              placeholder="Enter city"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="state"
            label="State"
            rules={[{ required: true, message: 'Please enter your state' }]}
          >
            <Input
              prefix={<EnvironmentOutlined className="text-gray-400" />}
              placeholder="Enter state"
              size="large"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="country"
            label="Country"
            initialValue="India"
            rules={[{ required: true, message: 'Please select your country' }]}
          >
            <Select placeholder="Select country" size="large">
              <Option value="India">India</Option>
              <Option value="United States">United States</Option>
              <Option value="United Kingdom">United Kingdom</Option>
              <Option value="Canada">Canada</Option>
              <Option value="Australia">Australia</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={24}>
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
            <Checkbox>
              I agree to the{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
            </Checkbox>
          </Form.Item>
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
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleOutlined className="text-4xl text-green-600" />
      </div>
      
      <Title level={2} className="text-green-600 mb-4">
        Welcome to PropVantage AI!
      </Title>
      
      <Paragraph className="text-lg text-gray-600 mb-6">
        Your organization has been successfully created. You'll be redirected to your dashboard shortly.
      </Paragraph>

      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <Title level={4} className="text-blue-900 mb-4">What's next?</Title>
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-3">
            <CheckCircleOutlined className="text-green-500" />
            <Text>Set up your first project</Text>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircleOutlined className="text-green-500" />
            <Text>Invite team members</Text>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircleOutlined className="text-green-500" />
            <Text>Configure your sales pipeline</Text>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircleOutlined className="text-green-500" />
            <Text>Start capturing leads</Text>
          </div>
        </div>
      </div>

      <Progress percent={100} strokeColor="#52c41a" showInfo={false} />
      <Text className="text-gray-500 mt-2 block">Redirecting to dashboard...</Text>
    </motion.div>
  )

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="min-h-screen flex">
        {/* Left Panel - Progress and Features */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-purple-600 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white">
            {/* Logo */}
            <div className="mb-12">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
                  <RocketOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <Title level={2} className="text-white m-0 font-bold">
                    PropVantage AI
                  </Title>
                  <Text className="text-purple-100 text-sm">
                    Setting up your organization...
                  </Text>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Text className="text-white font-semibold">Setup Progress</Text>
                <Text className="text-purple-100">{currentStep + 1} of {steps.length}</Text>
              </div>
              <Progress 
                percent={((currentStep + 1) / steps.length) * 100} 
                strokeColor="#ffffff"
                trailColor="rgba(255,255,255,0.2)"
                showInfo={false}
              />
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Award className="w-6 h-6 text-purple-200 mt-1" />
                <div>
                  <Text className="text-white font-semibold block mb-1">
                    Industry Leading Platform
                  </Text>
                  <Text className="text-purple-100 text-sm">
                    Join thousands of real estate professionals using PropVantage AI
                  </Text>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Target className="w-6 h-6 text-purple-200 mt-1" />
                <div>
                  <Text className="text-white font-semibold block mb-1">
                    Complete Solution
                  </Text>
                  <Text className="text-purple-100 text-sm">
                    Everything you need from lead capture to project delivery
                  </Text>
                </div>
              </motion.div>

              <motion.div
                className="flex items-start space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <Users className="w-6 h-6 text-purple-200 mt-1" />
                <div>
                  <Text className="text-white font-semibold block mb-1">
                    Team Collaboration
                  </Text>
                  <Text className="text-purple-100 text-sm">
                    Built for teams with role-based access and real-time updates
                  </Text>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right Panel - Registration Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
                <RocketOutlined className="text-2xl text-white" />
              </div>
              <Title level={2} className="text-gray-900 m-0 font-bold">
                PropVantage AI
              </Title>
              <Text className="text-gray-600">
                Create your organization
              </Text>
            </div>

            <Card 
              className="shadow-xl border-0"
              styles={{ body: { padding: '2rem' } }}
            >
              {/* Steps Header */}
              {currentStep < 3 && (
                <div className="mb-8">
                  <Steps 
                    current={currentStep} 
                    size="small"
                    className="mb-4"
                  >
                    {steps.slice(0, 3).map((step, index) => (
                      <Step 
                        key={index}
                        title={step.title} 
                        icon={step.icon}
                        description={step.description}
                      />
                    ))}
                  </Steps>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <Alert
                    message="Registration Failed"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={clearError}
                  />
                </motion.div>
              )}

              {/* Form */}
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                autoComplete="off"
                size="large"
              >
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>

                {/* Navigation Buttons */}
                {currentStep < 3 && (
                  <div className="flex justify-between mt-8">
                    <Button
                      type="default"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      icon={<ArrowLeftOutlined />}
                      size="large"
                    >
                      Previous
                    </Button>

                    {currentStep < 2 ? (
                      <Button
                        type="primary"
                        onClick={nextStep}
                        icon={<ArrowRightOutlined />}
                        size="large"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        icon={<CheckCircleOutlined />}
                        size="large"
                      >
                        {isSubmitting ? 'Creating Organization...' : 'Complete Setup'}
                      </Button>
                    )}
                  </div>
                )}
              </Form>

              {/* Login Link */}
              {currentStep < 3 && (
                <>
                  <Divider>
                    <Text className="text-gray-400 text-sm">Already have an account?</Text>
                  </Divider>
                  <div className="text-center">
                    <Link 
                      to="/login" 
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Sign in to your account
                    </Link>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default RegisterPage