import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import Landing from './components/Landing';
import Explore from './components/Explore';
import Chat from './components/Chat';
import Auth from './components/Auth';
import SetPassword from './components/SetPassword';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import CreatorStudio from './components/CreatorStudio';
import { getToken, handleGoogleCallback, AuthResponse } from './services/auth';
import './index.css';

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = getToken();
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Google OAuth Callback handler
const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleGoogleCallback(code)
                .then((response: AuthResponse) => {
                    const hasPassword = response.user?.has_password;
                    if (hasPassword) {
                        navigate('/chat', { replace: true });
                    } else {
                        navigate('/set-password', { replace: true });
                    }
                })
                .catch((error) => {
                    console.error('Google OAuth callback error:', error);
                    navigate('/login?error=oauth_failed', { replace: true });
                });
        } else {
            navigate('/login?error=no_code', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="font-outfit text-sm text-gray-400">Completing Google sign-in...</p>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-[#0B0F19]">
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/login" element={<Auth />} />
                    <Route
                        path="/set-password"
                        element={
                            <ProtectedRoute>
                                <SetPassword />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/auth/google/callback" element={<GoogleCallback />} />
                    <Route
                        path="/chat"
                        element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/create"
                        element={
                            <ProtectedRoute>
                                <CreatorStudio />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
};

export default App;