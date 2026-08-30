import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// For handling concurrent refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and it's not a retry (avoids infinite loops)
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // If the failure happened on a login or refresh request, don't try to refresh
            if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If already refreshing, add request to queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
                const { accessToken } = data;

                setAccessToken(accessToken);
                processQueue(null, accessToken);
                
                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearAccessToken();
                // Redirect or handle logout in context
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

