// File: src/utils/formatters.js
// Description: Utility functions for formatting currency, dates, numbers, and other data types
// Version: 1.0 - Production-grade formatters for PropVantage AI
// Location: src/utils/formatters.js

/**
 * Format currency values with proper Indian Rupee formatting
 * @param {number} amount - The amount to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
    const {
      currency = 'INR',
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      showSymbol = true,
      compact = false,
    } = options;
  
    if (amount === null || amount === undefined || isNaN(amount)) {
      return showSymbol ? '₹0' : '0';
    }
  
    const numAmount = Number(amount);
  
    // Handle compact formatting for large numbers
    if (compact && Math.abs(numAmount) >= 1000) {
      if (Math.abs(numAmount) >= 10000000) { // 1 Crore
        const crores = numAmount / 10000000;
        return `₹${crores.toFixed(1)}Cr`;
      } else if (Math.abs(numAmount) >= 100000) { // 1 Lakh
        const lakhs = numAmount / 100000;
        return `₹${lakhs.toFixed(1)}L`;
      } else if (Math.abs(numAmount) >= 1000) { // 1 Thousand
        const thousands = numAmount / 1000;
        return `₹${thousands.toFixed(1)}K`;
      }
    }
  
    // Standard formatting
    try {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(numAmount);
  
      // Remove currency symbol if not wanted
      if (!showSymbol) {
        return formatted.replace(/₹|INR|\s/g, '').trim();
      }
  
      return formatted;
    } catch (error) {
      console.warn('Error formatting currency:', error);
      return `₹${numAmount.toLocaleString('en-IN', {
        minimumFractionDigits,
        maximumFractionDigits,
      })}`;
    }
  };
  
  /**
   * Format numbers with Indian number system (lakhs, crores)
   * @param {number} number - The number to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted number string
   */
  export const formatNumber = (number, options = {}) => {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      compact = false,
    } = options;
  
    if (number === null || number === undefined || isNaN(number)) {
      return '0';
    }
  
    const numValue = Number(number);
  
    // Handle compact formatting
    if (compact && Math.abs(numValue) >= 1000) {
      if (Math.abs(numValue) >= 10000000) { // 1 Crore
        const crores = numValue / 10000000;
        return `${crores.toFixed(1)}Cr`;
      } else if (Math.abs(numValue) >= 100000) { // 1 Lakh
        const lakhs = numValue / 100000;
        return `${lakhs.toFixed(1)}L`;
      } else if (Math.abs(numValue) >= 1000) { // 1 Thousand
        const thousands = numValue / 1000;
        return `${thousands.toFixed(1)}K`;
      }
    }
  
    // Standard formatting
    try {
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(numValue);
    } catch (error) {
      console.warn('Error formatting number:', error);
      return numValue.toLocaleString('en-IN', {
        minimumFractionDigits,
        maximumFractionDigits,
      });
    }
  };
  
  /**
   * Format date in a readable format
   * @param {string|Date} date - The date to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted date string
   */
  export const formatDate = (date, options = {}) => {
    const {
      format = 'short', // 'short', 'medium', 'long', 'full'
      includeTime = false,
      locale = 'en-IN',
    } = options;
  
    if (!date) return '-';
  
    try {
      const dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
  
      let formatOptions = {};
  
      switch (format) {
        case 'short':
          formatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          };
          break;
        case 'medium':
          formatOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          };
          break;
        case 'long':
          formatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          };
          break;
        case 'full':
          formatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          };
          break;
        default:
          formatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          };
      }
  
      if (includeTime) {
        formatOptions.hour = '2-digit';
        formatOptions.minute = '2-digit';
        formatOptions.hour12 = true;
      }
  
      return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return new Date(date).toLocaleDateString('en-IN');
    }
  };
  
  /**
   * Format date and time in a readable format
   * @param {string|Date} date - The date to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted date and time string
   */
  export const formatDateTime = (date, options = {}) => {
    return formatDate(date, { ...options, includeTime: true });
  };
  
  /**
   * Format time in a readable format
   * @param {string|Date} date - The date to extract time from
   * @param {object} options - Formatting options
   * @returns {string} Formatted time string
   */
  export const formatTime = (date, options = {}) => {
    const {
      format = '12', // '12' or '24'
      locale = 'en-IN',
    } = options;
  
    if (!date) return '-';
  
    try {
      const dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
  
      const formatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: format === '12',
      };
  
      return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(dateObj);
    } catch (error) {
      console.warn('Error formatting time:', error);
      return new Date(date).toLocaleTimeString('en-IN');
    }
  };
  
  /**
   * Format relative time (e.g., "2 hours ago", "3 days ago")
   * @param {string|Date} date - The date to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted relative time string
   */
  export const formatRelativeTime = (date, options = {}) => {
    const {
      locale = 'en-IN',
      numeric = 'auto', // 'always' or 'auto'
    } = options;
  
    if (!date) return '-';
  
    try {
      const dateObj = new Date(date);
      
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
  
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInSeconds = Math.floor(diffInMs / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
  
      // Use Intl.RelativeTimeFormat if available
      if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric });
  
        if (diffInDays > 0) {
          return rtf.format(-diffInDays, 'day');
        } else if (diffInHours > 0) {
          return rtf.format(-diffInHours, 'hour');
        } else if (diffInMinutes > 0) {
          return rtf.format(-diffInMinutes, 'minute');
        } else {
          return 'just now';
        }
      }
  
      // Fallback for older browsers
      if (diffInDays > 0) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else if (diffInHours > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInMinutes > 0) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'just now';
      }
    } catch (error) {
      console.warn('Error formatting relative time:', error);
      return '-';
    }
  };
  
  /**
   * Format percentage values
   * @param {number} value - The percentage value (0-100)
   * @param {object} options - Formatting options
   * @returns {string} Formatted percentage string
   */
  export const formatPercentage = (value, options = {}) => {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 1,
      showSign = true,
    } = options;
  
    if (value === null || value === undefined || isNaN(value)) {
      return '0%';
    }
  
    const numValue = Number(value);
  
    try {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'percent',
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(numValue / 100);
  
      return formatted;
    } catch (error) {
      console.warn('Error formatting percentage:', error);
      return `${numValue.toFixed(maximumFractionDigits)}%`;
    }
  };
  
  /**
   * Format phone numbers
   * @param {string} phoneNumber - The phone number to format
   * @param {object} options - Formatting options
   * @returns {string} Formatted phone number string
   */
  export const formatPhoneNumber = (phoneNumber, options = {}) => {
    const {
      countryCode = '+91',
      format = 'international', // 'national' or 'international'
    } = options;
  
    if (!phoneNumber) return '-';
  
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');
  
    // Handle Indian phone numbers (10 digits)
    if (digitsOnly.length === 10) {
      const formatted = digitsOnly.replace(/(\d{5})(\d{5})/, '$1 $2');
      return format === 'international' ? `${countryCode} ${formatted}` : formatted;
    }
  
    // Handle international format (with country code)
    if (digitsOnly.length > 10) {
      const countryCodeLength = digitsOnly.length - 10;
      const cc = digitsOnly.slice(0, countryCodeLength);
      const number = digitsOnly.slice(countryCodeLength);
      const formatted = number.replace(/(\d{5})(\d{5})/, '$1 $2');
      return `+${cc} ${formatted}`;
    }
  
    return phoneNumber;
  };
  
  /**
   * Format file size in bytes to human readable format
   * @param {number} bytes - The file size in bytes
   * @param {object} options - Formatting options
   * @returns {string} Formatted file size string
   */
  export const formatFileSize = (bytes, options = {}) => {
    const {
      decimals = 2,
    } = options;
  
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return '-';
  
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
  
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  };
  
  /**
   * Format address for display
   * @param {object} address - The address object
   * @param {object} options - Formatting options
   * @returns {string} Formatted address string
   */
  export const formatAddress = (address, options = {}) => {
    const {
      format = 'full', // 'short', 'medium', 'full'
      separator = ', ',
    } = options;
  
    if (!address || typeof address !== 'object') {
      return '-';
    }
  
    const parts = [];
  
    switch (format) {
      case 'short':
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        break;
      case 'medium':
        if (address.area) parts.push(address.area);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        break;
      case 'full':
      default:
        if (address.addressLine1) parts.push(address.addressLine1);
        if (address.addressLine2) parts.push(address.addressLine2);
        if (address.area) parts.push(address.area);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.pincode) parts.push(address.pincode);
        if (address.country) parts.push(address.country);
        break;
    }
  
    return parts.filter(Boolean).join(separator) || '-';
  };
  
  /**
   * Truncate text to specified length
   * @param {string} text - The text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @param {string} suffix - Suffix to add when truncated
   * @returns {string} Truncated text
   */
  export const truncateText = (text, maxLength = 100, suffix = '...') => {
    if (!text || typeof text !== 'string') return '-';
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  };
  
  /**
   * Format name from first and last name
   * @param {string} firstName - First name
   * @param {string} lastName - Last name
   * @param {object} options - Formatting options
   * @returns {string} Formatted full name
   */
  export const formatName = (firstName, lastName, options = {}) => {
    const {
      format = 'full', // 'first', 'last', 'full', 'initials'
      separator = ' ',
    } = options;
  
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
  
    switch (format) {
      case 'first':
        return first || '-';
      case 'last':
        return last || '-';
      case 'initials':
        return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '-';
      case 'full':
      default:
        if (first && last) {
          return `${first}${separator}${last}`;
        } else if (first) {
          return first;
        } else if (last) {
          return last;
        } else {
          return '-';
        }
    }
  };
  
  /**
   * Compact currency shortcut - the format used on most dashboard/list pages.
   * ₹7Cr, ₹45.2L, ₹8.5K, ₹500
   * @param {number} amount
   * @returns {string}
   */
  export const fmtCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    const n = Number(amount);
    if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  /**
   * Default export object with all formatters
   */
  const formatters = {
    formatCurrency,
    fmtCurrency,
    formatNumber,
    formatDate,
    formatDateTime,
    formatTime,
    formatRelativeTime,
    formatPercentage,
    formatPhoneNumber,
    formatFileSize,
    formatAddress,
    truncateText,
    formatName,
  };

  export default formatters;