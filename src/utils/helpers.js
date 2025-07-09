//src/utils/helpers.js
import { format, parseISO, isValid, differenceInDays, addDays, subDays } from 'date-fns'
import { CURRENCY_SYMBOL, STATUS_COLORS } from '../constants'

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format currency amount in Indian format
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (!amount && amount !== 0) return showSymbol ? `${CURRENCY_SYMBOL}0` : '0'
  
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount)) return showSymbol ? `${CURRENCY_SYMBOL}0` : '0'
  
  // Indian number format with commas
  const formatted = numAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  
  return showSymbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted
}

/**
 * Format currency in short form (K, L, Cr)
 * @param {number} amount - Amount to format
 * @param {boolean} showSymbol - Whether to show currency symbol
 * @returns {string} Short formatted currency string
 */
export const formatCurrencyShort = (amount, showSymbol = true) => {
  if (!amount && amount !== 0) return showSymbol ? `${CURRENCY_SYMBOL}0` : '0'
  
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount)) return showSymbol ? `${CURRENCY_SYMBOL}0` : '0'
  
  let formatted = ''
  const prefix = showSymbol ? CURRENCY_SYMBOL : ''
  
  if (numAmount >= 10000000) { // 1 Crore or more
    formatted = `${prefix}${(numAmount / 10000000).toFixed(1)}Cr`
  } else if (numAmount >= 100000) { // 1 Lakh or more
    formatted = `${prefix}${(numAmount / 100000).toFixed(1)}L`
  } else if (numAmount >= 1000) { // 1 Thousand or more
    formatted = `${prefix}${(numAmount / 1000).toFixed(1)}K`
  } else {
    formatted = `${prefix}${numAmount.toLocaleString('en-IN')}`
  }
  
  return formatted.replace('.0', '') // Remove .0 for whole numbers
}

/**
 * Format percentage
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return '0%'
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return '0%'
  return `${numValue.toFixed(decimals)}%`
}

/**
 * Format date in Indian format
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: 'dd/MM/yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Date formatting error:', error)
    return ''
  }
}

/**
 * Format date and time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm')
}

/**
 * Format relative date (e.g., "2 days ago", "in 3 days")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative date string
 */
export const formatRelativeDate = (date) => {
  if (!date) return ''
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    if (!isValid(dateObj)) return ''
    
    const today = new Date()
    const diffDays = differenceInDays(dateObj, today)
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0) return `In ${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  } catch (error) {
    console.error('Relative date formatting error:', error)
    return ''
  }
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalizeWords = (str) => {
  if (!str) return ''
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Generate random ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate Indian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/
  return phoneRegex.test(phone?.replace(/\D/g, ''))
}

/**
 * Validate PAN number
 * @param {string} pan - PAN to validate
 * @returns {boolean} Is valid PAN
 */
export const isValidPAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return panRegex.test(pan?.toUpperCase())
}

/**
 * Validate Aadhar number
 * @param {string} aadhar - Aadhar to validate
 * @returns {boolean} Is valid Aadhar
 */
export const isValidAadhar = (aadhar) => {
  const aadharRegex = /^\d{12}$/
  return aadharRegex.test(aadhar?.replace(/\D/g, ''))
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

/**
 * Remove duplicates from array
 * @param {Array} array - Array with duplicates
 * @param {string} key - Key to check for duplicates (optional)
 * @returns {Array} Array without duplicates
 */
export const removeDuplicates = (array, key = null) => {
  if (!key) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

/**
 * Sort array by multiple keys
 * @param {Array} array - Array to sort
 * @param {Array} sortKeys - Array of sort configurations
 * @returns {Array} Sorted array
 */
export const multiSort = (array, sortKeys) => {
  return array.sort((a, b) => {
    for (const { key, order = 'asc' } of sortKeys) {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
    }
    return 0
  })
}

// =============================================================================
// STATUS UTILITIES
// =============================================================================

/**
 * Get status color
 * @param {string} status - Status value
 * @returns {string} Color code
 */
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || '#8c8c8c'
}

/**
 * Get lead priority badge props
 * @param {string} priority - Lead priority
 * @returns {Object} Badge props
 */
export const getLeadPriorityProps = (priority) => {
  const props = {
    Hot: { color: 'red', text: 'Hot' },
    Warm: { color: 'orange', text: 'Warm' },
    Cold: { color: 'blue', text: 'Cold' },
  }
  return props[priority] || { color: 'default', text: priority }
}

/**
 * Get unit type badge props
 * @param {string} type - Unit type
 * @returns {Object} Badge props
 */
export const getUnitTypeProps = (type) => {
  const colors = {
    '1BHK': 'blue',
    '2BHK': 'green',
    '3BHK': 'orange',
    '3BHK+Study': 'purple',
    '4BHK': 'red',
    '5BHK': 'magenta',
    'Penthouse': 'gold',
    'Villa': 'cyan',
  }
  return { color: colors[type] || 'default', text: type }
}

// =============================================================================
// CALCULATION UTILITIES
// =============================================================================

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0
  return Math.round((value / total) * 100)
}

/**
 * Calculate growth percentage
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Growth percentage
 */
export const calculateGrowth = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Calculate EMI
 * @param {number} principal - Principal amount
 * @param {number} rate - Annual interest rate
 * @param {number} tenure - Tenure in months
 * @returns {number} EMI amount
 */
export const calculateEMI = (principal, rate, tenure) => {
  if (!principal || !rate || !tenure) return 0
  
  const monthlyRate = rate / 12 / 100
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
              (Math.pow(1 + monthlyRate, tenure) - 1)
  
  return Math.round(emi)
}

// =============================================================================
// LOCAL STORAGE UTILITIES
// =============================================================================

/**
 * Set item in localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Error setting localStorage:', error)
  }
}

/**
 * Get item from localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Stored value or default
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error getting localStorage:', error)
    return defaultValue
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing localStorage:', error)
  }
}

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} URL with parameters
 */
export const buildUrl = (baseUrl, params) => {
  if (!params || Object.keys(params).length === 0) return baseUrl
  
  const url = new URL(baseUrl, window.location.origin)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.append(key, value)
    }
  })
  
  return url.toString()
}

/**
 * Parse URL query parameters
 * @param {string} search - URL search string
 * @returns {Object} Parsed parameters
 */
export const parseQuery = (search) => {
  const params = new URLSearchParams(search)
  const result = {}
  
  for (const [key, value] of params) {
    result[key] = value
  }
  
  return result
}

// =============================================================================
// FILE UTILITIES
// =============================================================================

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

export default {
  formatCurrency,
  formatCurrencyShort,
  formatPercentage,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  capitalizeWords,
  getInitials,
  truncateText,
  generateId,
  isValidEmail,
  isValidPhone,
  isValidPAN,
  isValidAadhar,
  groupBy,
  removeDuplicates,
  multiSort,
  getStatusColor,
  getLeadPriorityProps,
  getUnitTypeProps,
  calculatePercentage,
  calculateGrowth,
  calculateEMI,
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  buildUrl,
  parseQuery,
  formatFileSize,
  getFileExtension,
}