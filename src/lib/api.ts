import axios from 'axios';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const fingerprint = await getDeviceFingerprint();
    if (fingerprint) {
      config.headers['x-device-fingerprint'] = fingerprint;
    }
  } catch (error) {
    console.error('Failed to set device fingerprint:', error);
  }
  return config;
});

// Auth APIs
export const authAPI = {
  getUser: () => api.get('/auth/getuser'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  updatePassword: (data: { newPassword: string }) => api.post('/auth/update-password', data),
  verifyOtp: (data: { token: string; otp: number }) => api.post('/auth/verify-otp', data),
  resendForgotOtp: (email: string) => api.post('/auth/resend-forgot-password-otp', { email }),
};

// Problems APIs
export const problemsAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; tags?: string[]; companies?: string[]; sortBy?: string }) => {
    if (!params) return api.get('/problems');
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.tags && params.tags.length > 0) searchParams.append('tags', params.tags.join(','));
    if (params.companies && params.companies.length > 0) searchParams.append('companies', params.companies.join(','));
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    return api.get(`/problems?${searchParams.toString()}`);
  },
  getPaginated: (params: { cursor?: string; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.cursor) searchParams.append('cursor', params.cursor);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    return api.get(`/problems/paginated?${searchParams.toString()}`);
  },
  getPopularTopics: () => api.get('/problems/popular-topics'),
  getPopularCompanies: () => api.get('/problems/popular-companies'),
  getById: (id: string) => api.get(`/problems/${id}`),
  getProgress: (problemId: string) => api.get(`/problems/progress?problemId=${problemId}`),
  saveProgress: (data: { problemId: string; visibleCodeByLanguage: Record<string, string> }) => api.post('/problems/progress', data),
  autoSaveProgress: (data: { problemId: string; language: string; code: string }) => api.put('/problems/progress/auto-save', data),
  getStats: () => api.get('/problems/stats'), // New API for acceptance rates
  getStatsByIds: (problemIds: string[]) => api.get(`/problems/stats/by-ids?problemIds=${problemIds.join(',')}`), // Optimized API for specific problem IDs
  getUserStatus: (problemIds?: string[]) => {
    const params = problemIds ? `?problemIds=${problemIds.join(',')}` : '';
    return api.get(`/problems/user-status${params}`);
  }, // New API for user problem statuses
  bulkUpload: (formData: FormData) => api.post('/problems/bulk', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getCountsByDifficulty: () => api.get('/problems/counts-by-difficulty'), // Fast endpoint for problem counts
};

// Submissions APIs
export const submissionsAPI = {
  submitSync: (data: { problemId: string; code: string; language: string }) => 
    api.post('/submissions/sync', data),
  submitAsync: (data: { problemId: string; code: string; language: string }) => 
    api.post('/submissions/', data),
  runCode: (data: { problemId: string; code: string; language: string }) => 
    api.post('/submissions/run', data),
  getById: (id: string) => api.get(`/submissions/${id}`),
  getUserSubmissions: (problemId: string) => api.get(`/submissions/user/problem/${problemId}`),
  getStatus: (id: string) => api.get(`/submissions/status/${id}`),
};

// Compiler APIs
export const compilerAPI = {
  getCode: (problemId: string) => api.get(`/compiler/code/${problemId}`),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user'),
};

// Hints APIs
export const hintsAPI = {
  getProblemsWithHintStatus: (params: { page?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    return api.get(`/hints/admin/problems?${searchParams.toString()}`);
  },
  getByProblemId: (problemId: string) => api.get(`/hints/problem/${problemId}`),
  create: (data: { problemId: string; hints: string[] }) => api.post('/hints', data),
  update: (problemId: string, data: { hints: string[] }) => api.put(`/hints/problem/${problemId}`, data),
  delete: (problemId: string) => api.delete(`/hints/problem/${problemId}`),
};

// Social Media APIs
export const socialAPI = {
  getFollowers: () => api.get('/social/getFollowers'),
  seedData: () => api.post('/social/seedData'),
};

// Newsletter APIs
export const newsletterAPI = {
  subscribe: (email: string) => api.post('/newsletter/subscribe', { 
    email, 
    apiKey: "strike_secret_2025" 
  }),
};

// Contact APIs
export const contactAPI = {
  submit: (data: { name: string; email: string; subject?: string; message: string }) =>
    api.post('/contact/submit', { ...data, apiKey: "strike_secret_2025" }),
};

// Test Case Explanation APIs
export const testCaseExplanationAPI = {
  getProblemsForExplanations: (params: { search?: string; page?: number; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    return api.get(`/admin/problems-explanations?${searchParams.toString()}`);
  },
  getProblemTestCases: (problemId: string) => api.get(`/admin/problem-testcases/${problemId}`),
  updateExplanation: (testCaseId: string, data: { explanation: string }) => 
    api.patch(`/admin/testcase-explanation/${testCaseId}`, data),
};

export { api };
export default api;
