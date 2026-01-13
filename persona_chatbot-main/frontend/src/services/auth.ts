import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
});

export interface AuthResponse {
    access_token: string;
    token_type: string;
    refresh_token?: string;
}

export interface User {
    id: number;
    email: string;
    username: string;
}

// Add response interceptor for handling auth errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }
                
                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                });
                
                if (response.data.access_token) {
                    localStorage.setItem('token', response.data.access_token);
                    const expiryTime = new Date().getTime() + 30 * 60 * 1000;
                    localStorage.setItem('token_expiry', expiryTime.toString());
                    
                    // Update Authorization header and retry request
                    originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
                    return axiosInstance(originalRequest);
                }
            } catch (refreshError) {
                logout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const register = async (email: string, password: string): Promise<User> => {
    const response = await axiosInstance.post('/auth/register', {
        email,
        password,
    });
    return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', {
        email,
        password,
    });
    
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        if (response.data.refresh_token) {
            localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        // Store expiry time (30 minutes from now)
        const expiryTime = new Date().getTime() + 30 * 60 * 1000;
        localStorage.setItem('token_expiry', expiryTime.toString());
    }
    
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    window.location.href = '/login';
};

export const isTokenExpired = (): boolean => {
    const expiryTime = localStorage.getItem('token_expiry');
    if (!expiryTime) return true;
    
    return new Date().getTime() > parseInt(expiryTime);
};

export const getToken = (): string | null => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired()) {
        logout();
        return null;
    }
    return token;
};

export const getCurrentUser = async (): Promise<User | null> => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const response = await axiosInstance.get('/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            logout();
        }
        return null;
    }
};

export const loginWithGoogle = async (): Promise<void> => {
    try {
        // Get authorization URL from backend
        const response = await axiosInstance.get('/auth/google/login');
        const authUrl = response.data.authorization_url;
        
        // Redirect to Google OAuth
        window.location.href = authUrl;
    } catch (error) {
        throw new Error('Failed to initiate Google login');
    }
};

export const handleGoogleCallback = async (code: string): Promise<AuthResponse> => {
    try {
        const response = await axiosInstance.post('/auth/google/token', {
            code: code
        });
        
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            // Store expiry time (30 minutes from now)
            const expiryTime = new Date().getTime() + 30 * 60 * 1000;
            localStorage.setItem('token_expiry', expiryTime.toString());
        }
        
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.detail || 'Google authentication failed');
        }
        throw new Error('Google authentication failed');
    }
};