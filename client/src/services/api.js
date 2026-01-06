import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  getMe: () => api.get('/me'),
  getGoogleAuthUrl: () => `${API_BASE_URL}/google`,
};

// Toilets API
export const toiletsAPI = {
  getAll: (params) => api.get('/toilets', { params }),
  getById: (id) => api.get(`/toilets/${id}`),
  create: (data) => {
    const formData = new FormData();
    formData.append('toilet[title]', data.title);
    formData.append('toilet[location]', data.location);
    formData.append('toilet[description]', data.description || '');
    formData.append('toilet[genderAccess]', data.genderAccess);
    formData.append('toilet[isPaid]', data.isPaid);
    formData.append('toilet[price]', data.price || 0);
    formData.append('toilet[isAccessible]', data.isAccessible);
    formData.append('toilet[hasSanitaryPadDisposal]', data.hasSanitaryPadDisposal);
    formData.append('toilet[cleanlinessRating]', data.cleanlinessRating || 0);
    
    if (data.images && data.images.length > 0) {
      data.images.forEach((file) => {
        formData.append('image', file);
      });
    }
    
    return api.post('/toilets/new', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data) => {
    const formData = new FormData();
    formData.append('toilet[title]', data.title);
    formData.append('toilet[location]', data.location);
    formData.append('toilet[description]', data.description || '');
    formData.append('toilet[genderAccess]', data.genderAccess);
    formData.append('toilet[isPaid]', data.isPaid);
    formData.append('toilet[price]', data.price || 0);
    formData.append('toilet[isAccessible]', data.isAccessible);
    formData.append('toilet[hasSanitaryPadDisposal]', data.hasSanitaryPadDisposal);
    formData.append('toilet[cleanlinessRating]', data.cleanlinessRating || 0);
    
    if (data.deleteImages) {
      if (Array.isArray(data.deleteImages)) {
        data.deleteImages.forEach((filename) => {
          formData.append('deleteImages', filename);
        });
      } else {
        formData.append('deleteImages', data.deleteImages);
      }
    }
    
    if (data.images && data.images.length > 0) {
      data.images.forEach((file) => {
        formData.append('image', file);
      });
    }
    
    return api.put(`/toilets/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => api.delete(`/toilets/${id}`),
  getAdmin: () => api.get('/toilets/admin'),
  approve: (id) => api.post(`/toilets/${id}/approve`),
  reject: (id) => api.post(`/toilets/${id}/reject`),
};

// Reviews API
export const reviewsAPI = {
  create: (toiletId, data) => api.post(`/toilets/${toiletId}/reviews`, data),
  update: (toiletId, reviewId, data) => api.put(`/toilets/${toiletId}/reviews/${reviewId}`, data),
  delete: (toiletId, reviewId) => api.delete(`/toilets/${toiletId}/reviews/${reviewId}`),
};

export default api;
