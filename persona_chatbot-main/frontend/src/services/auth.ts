import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_URL,
});

export interface User {
    id: number;
    email: string;
    username: string;
    has_password?: boolean;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    refresh_token?: string;
    user?: User;
}

// Add response interceptor for handling auth errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Don't try to refresh token for login/register/auth endpoints - let them show errors
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                              originalRequest.url?.includes('/auth/register') ||
                              originalRequest.url?.includes('/auth/google/');
        
        // If error is 401 and we haven't tried to refresh token yet, and it's not an auth endpoint
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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
                // Only logout if we're not already on the login page
                if (window.location.pathname !== '/login') {
                    logout();
                }
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    try {
        const response = await axiosInstance.post('/auth/login', {
            email,
            password,
            remember_me: rememberMe,
        });
        
        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            if (response.data.refresh_token) {
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            // Store whether user has enabled remember me
            if (rememberMe) {
                localStorage.setItem('remember_me', 'true');
                // For remember me, refresh token expires in 30 days
                const expiryTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
                localStorage.setItem('refresh_token_expiry', expiryTime.toString());
            } else {
                localStorage.removeItem('remember_me');
                // Standard refresh token expires in 7 days
                const expiryTime = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
                localStorage.setItem('refresh_token_expiry', expiryTime.toString());
            }
            // Store access token expiry time (30 minutes from now)
            const expiryTime = new Date().getTime() + 30 * 60 * 1000;
            localStorage.setItem('token_expiry', expiryTime.toString());
        }
        
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.detail) {
            // Extract user-friendly error message from backend
            throw new Error(error.response.data.detail);
        }
        // Fallback for network errors or unexpected errors
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('refresh_token_expiry');
    localStorage.removeItem('remember_me');
    window.location.href = '/login';
};

export const isRefreshTokenValid = (): boolean => {
    const refreshTokenExpiry = localStorage.getItem('refresh_token_expiry');
    if (!refreshTokenExpiry) return false;
    
    return new Date().getTime() < parseInt(refreshTokenExpiry);
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
            code: code,
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

export const setPassword = async (
    newPassword: string,
    confirmPassword: string
): Promise<void> => {
    const token = getToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    try {
        await axiosInstance.post(
            '/auth/set-password',
            {
                new_password: newPassword,
                confirm_password: confirmPassword,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.data?.detail) {
            // Extract validation error message from Pydantic/FastAPI response
            const detail = error.response.data.detail;
            if (Array.isArray(detail)) {
                // Pydantic validation errors come as an array
                const firstError = detail[0];
                throw new Error(firstError.msg || firstError.message || 'Validation failed');
            } else if (typeof detail === 'string') {
                throw new Error(detail);
            }
        }
        throw error;
    }
};