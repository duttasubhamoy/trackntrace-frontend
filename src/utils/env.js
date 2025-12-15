// src/utils/env.js

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Debug environment during build
if (!BACKEND_URL || BACKEND_URL.includes('localhost')) {
  console.warn('WARNING: Backend URL is not set correctly:', BACKEND_URL);
  console.warn('NODE_ENV:', process.env.NODE_ENV);
  console.warn('All env vars:', process.env);
}

export default BACKEND_URL;
