import axios from 'axios';

// Detect if we're on Vercel (production)
const isProduction = typeof window !== 'undefined' && 
  window.location.hostname.includes('vercel.app');

// For development only - never use in production
const devApiUrl = 'http://localhost/FragranzaWeb/backend/api';

// API and image base URLs - in production, always use proxy (no external URLs)
export const API_BASE_URL = isProduction ? '' : devApiUrl;

// Images: In production, use the ngrok proxy for images too
export const IMAGE_BASE_URL = isProduction
  ? '' // Images will be handled differently or use placeholder
  : (import.meta.env.VITE_IMAGE_URL || 'http://localhost/FragranzaWeb/backend');

// Helper to build proxy URL for production
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  if (isProduction) {
    // In production, use the proxy with path parameter
    const url = new URL('/api/proxy', window.location.origin);
    url.searchParams.set('path', endpoint);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  } else {
    // In development, use direct API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost/FragranzaWeb/backend/api';
    const url = new URL(`${baseUrl}/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }
};

/**
 * Fetch wrapper that automatically uses proxy in production
 * @param url - URL like "${API_BASE_URL}/auth.php?action=login"
 * @param options - Fetch options
 */
export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  if (isProduction) {
    // Parse the URL and extract path and query params
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;
    
    // Extract the PHP file and action from the path
    // Handle both /api/auth.php and /FragranzaWeb/backend/api/auth.php
    const phpFileMatch = pathname.match(/\/([^/]+\.php)$/);
    const endpoint = phpFileMatch ? phpFileMatch[1] : pathname.split('/').pop() || '';
    
    // Build proxy URL
    const proxyUrl = new URL('/api/proxy', window.location.origin);
    proxyUrl.searchParams.set('path', endpoint);
    
    // Copy all query params
    urlObj.searchParams.forEach((value, key) => {
      proxyUrl.searchParams.set(key, value);
    });
    
    return fetch(proxyUrl.toString(), options);
  }
  return fetch(url, options);
};

// Helper function to get full image URL
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '/placeholder-product.png';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) return imagePath;
  
  if (isProduction) {
    // In production, use the image proxy
    const proxyUrl = new URL('/api/image', window.location.origin);
    proxyUrl.searchParams.set('path', imagePath);
    return proxyUrl.toString();
  }
  
  return `${IMAGE_BASE_URL}${imagePath}`;
};

const api = axios.create({
  baseURL: isProduction ? '' : devApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - transform URLs for production proxy
api.interceptors.request.use(
  (config) => {
    if (isProduction && config.url) {
      // Extract the PHP file from URL like "/supervisor.php/dashboard" or "supervisor.php?action=x"
      const urlStr = config.url;
      const phpFileMatch = urlStr.match(/\/?([^/]+\.php)/);
      
      if (phpFileMatch) {
        const phpFile = phpFileMatch[1];
        
        // Get everything after the .php file as additional path
        const afterPhp = urlStr.split(phpFile)[1] || '';
        
        // Parse query string if exists
        const [pathPart, queryString] = afterPhp.split('?');
        
        // Build the full path including sub-path like "supervisor.php/dashboard"
        const fullPath = pathPart ? `${phpFile}${pathPart}` : phpFile;
        
        // Build proxy URL
        const proxyUrl = new URL('/api/proxy', window.location.origin);
        proxyUrl.searchParams.set('path', fullPath);
        
        // Add query params
        if (queryString) {
          const params = new URLSearchParams(queryString);
          params.forEach((value, key) => {
            proxyUrl.searchParams.set(key, value);
          });
        }
        
        // Also add any params from config.params
        if (config.params) {
          Object.entries(config.params).forEach(([key, value]) => {
            proxyUrl.searchParams.set(key, String(value));
          });
          delete config.params; // Clear params since we added them to URL
        }
        
        config.url = proxyUrl.pathname + proxyUrl.search;
        config.baseURL = ''; // Clear baseURL since we have full path
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default api;