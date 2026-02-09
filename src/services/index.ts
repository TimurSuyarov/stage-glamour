import { message } from 'antd';
import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { i18n } from 'i18next';

const BASE_URL = import.meta.env.VITE_BASE_URL;

interface RequestConfig extends InternalAxiosRequestConfig {
	i18n?: i18n;
}

const request = axios.create({
	baseURL: BASE_URL,
	timeout: 30000,
});

request.interceptors.request.use(
	(config: RequestConfig) => {
		const token = sessionStorage.getItem('token');

		let rawLang = config.headers?.['Accept-Language']
			? config.headers?.['Accept-Language']
			: localStorage.getItem('i18nextLng');

		config.headers['Accept-Language'] = rawLang?.toUpperCase();

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

// ✅ Response Interceptor - Handle errors globally
request.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error) => {
		const status = error.response?.status;

		if (window.location.pathname !== '/') {
			if (status === 401 || status === 403) {
				message.error('Please login again.');
				sessionStorage.clear();
				window.location.pathname = '/';
			}
		}

		return Promise.reject(error);
	},
);

export default request;
