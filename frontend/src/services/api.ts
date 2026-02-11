import axios from 'axios';

// API and image base URLs from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/FragranzaWeb/backend/api';
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || 'http://localhost/FragranzaWeb/backend';

// Helper function to get full image URL
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return '/placeholder-product.png';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
  return `${IMAGE_BASE_URL}${imagePath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
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
