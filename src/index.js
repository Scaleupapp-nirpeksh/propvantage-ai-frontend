// File: src/index.js
// Description: Main entry point for PropVantage AI React application
// Version: 1.0 - Complete React app initialization with Material-UI and routing
// Location: src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';

// Import main App component
import App from './App';

// Import global styles (if any)
import './styles/index.css';

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <CssBaseline />
      <App />
    </StyledEngineProvider>
  </React.StrictMode>
);

// Performance monitoring (optional)
// You can add performance monitoring here
// Example: reportWebVitals(console.log);