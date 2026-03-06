import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { i18n } from 'i18next';
import {
  getStoredRefreshToken,
  getStoredEmployee,
  setStoredAuth,
  clearStoredAuth,
} from '@/lib/authStorage';

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface RequestConfig extends InternalAxiosRequestConfig {
  i18n?: i18n;
  /** Marks the request as already retried after a token refresh */
  _retry?: boolean;
}

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ─── Token refresh queue ──────────────────────────────────────────────────────
// Prevents multiple simultaneous refresh calls when several requests 401 at once
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

/** Calls POST /auth/refresh using a bare axios instance (bypasses our interceptors) */
async function doRefreshToken(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token stored');

  const response = await axios.post<{ token: string; refreshToken: string }>(
    `${BASE_URL}/auth/refresh`,
    { refreshToken },
  );

  const { token: newToken, refreshToken: newRefreshToken } = response.data;
  const employee = getStoredEmployee();

  if (employee) {
    setStoredAuth(newToken, newRefreshToken, employee);
  } else {
    // Fallback: persist tokens without employee info
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('refreshToken', newRefreshToken);
  }

  return newToken;
}

// ─── Request interceptor ──────────────────────────────────────────────────────
request.interceptors.request.use(
  (config: RequestConfig) => {
    const token = sessionStorage.getItem('token');

    const rawLang = config.headers?.['Accept-Language']
      ?? localStorage.getItem('i18nextLng');
    config.headers['Accept-Language'] = rawLang?.toUpperCase();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor ────────────────────────────────────────────────────
request.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as RequestConfig;
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry) {
      // Never retry auth endpoints — prevents infinite loops
      if (originalRequest.url?.includes('/auth/')) {
        clearStoredAuth();
        window.location.pathname = '/';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Another refresh is already in progress — queue this request and wait
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers!.Authorization = `Bearer ${token}`;
            return request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Start the refresh
      isRefreshing = true;
      try {
        const newToken = await doRefreshToken();
        processQueue(null, newToken);
        originalRequest.headers!.Authorization = `Bearer ${newToken}`;
        return request(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear auth and send to login
        processQueue(refreshError, null);
        clearStoredAuth();
        window.location.pathname = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default request;
