import axios, { AxiosError } from 'axios';
import { getRuntimeConfig } from './runtimeConfig';

const apiClient = axios.create({
  baseURL: getRuntimeConfig('API_BASE_URL'),
  timeout: 300_000, // 5 minutes — accommodate large file transcription
});

// Request interceptor — inject X-App-Id header from env
apiClient.interceptors.request.use(
  (config) => {
    const appId = getRuntimeConfig('APP_ID');
    if (appId) {
      config.headers['X-App-Id'] = appId;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor — normalize backend error shape to standard Error
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string } }>) => {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
