import axios from 'axios';

// Detect if we're on Vercel (production)
const isProduction = typeof window !== 'undefined' && 
  window.location.hostname.includes('vercel.app');

// For development only - never use in production
const devApiUrl = 'http://localhost/FragranzaWeb/backend/api';

// Direct backend URL for file uploads (bypasses Vercel proxy size limits)
const DIRECT_BACKEND_URL = 'https://developers-affiliated-contributor-anti.trycloudflare.com/backend/api';

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
    
    // Extract the PHP file and any path after it
    // Handle patterns like: /admin_users.php, /admin_users.php/stats, /admin_users.php/role/ojt
    const phpMatch = pathname.match(/\/([^/]+\.php)(\/.*)?$/);
    let endpoint = '';
    if (phpMatch) {
      endpoint = phpMatch[1] + (phpMatch[2] || ''); // e.g., "admin_users.php/stats"
    } else {
      endpoint = pathname.split('/').pop() || '';
    }
    
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

// Helper to get auth headers
const getAuthInfo = () => {
  try {
    const token = localStorage.getItem('fragranza_session');
    const userStr = localStorage.getItem('fragranza_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, email: user?.email };
  } catch {
    return { token: null, email: null };
  }
};

// Request interceptor - transform URLs for production proxy
api.interceptors.request.use(
  (config) => {
    // Add auth headers
    const { token, email } = getAuthInfo();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (email) {
      config.headers = config.headers || {};
      config.headers['X-Admin-Email'] = email;
    }
    
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

/**
 * Upload files directly to backend (bypasses Vercel proxy size limits)
 * Use this for file uploads > 4MB
 */
export const uploadFile = async (
  endpoint: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> => {
  const url = isProduction 
    ? `${DIRECT_BACKEND_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
    : `${devApiUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        try {
          reject(JSON.parse(xhr.responseText));
        } catch {
          reject({ message: xhr.statusText || 'Upload failed' });
        }
      }
    });
    
    xhr.addEventListener('error', () => {
      reject({ message: 'Network error during upload' });
    });
    
    xhr.open('POST', url);
    
    // Add auth headers
    const authInfo = getAuthInfo();
    if (authInfo.token) {
      xhr.setRequestHeader('Authorization', `Bearer ${authInfo.token}`);
    }
    if (authInfo.email) {
      xhr.setRequestHeader('X-Admin-Email', authInfo.email);
    }
    
    xhr.send(formData);
  });
};

export default api;