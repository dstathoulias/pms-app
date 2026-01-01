// src/api/axios.ts
import axios from 'axios';

// Base URLs for your microservices
// (In production/docker, these might change, but for now we use localhost)
const USER_API_URL = 'http://localhost:5001/api';
const TEAM_API_URL = 'http://localhost:5002/api';
const TASK_API_URL = 'http://localhost:5003/api';

// Helper to get the token
const getToken = () => localStorage.getItem('token');

// Create instances for each service
export const userApi = axios.create({ baseURL: USER_API_URL });
export const teamApi = axios.create({ baseURL: TEAM_API_URL });
export const taskApi = axios.create({ baseURL: TASK_API_URL });

// Function to add the Authorization header to requests
const authInterceptor = (config: any) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

// Apply the interceptor to all APIs
userApi.interceptors.request.use(authInterceptor);
teamApi.interceptors.request.use(authInterceptor);
taskApi.interceptors.request.use(authInterceptor);