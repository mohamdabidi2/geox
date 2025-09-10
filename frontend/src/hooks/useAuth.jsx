import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile and update state/localStorage
    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/auth/me');
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
            console.error('Error fetching user profile:', error);
            logout();
        }
    }, []);

    useEffect(() => {
        // Check if user is logged in on app start
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
                // Optionally verify token is still valid by fetching user profile
                // Don't call fetchUserProfile here to avoid dependency issues
            } catch (error) {
                console.error('Error parsing saved user:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await axiosInstance.post('/auth/login', {
                email,
                password
            });

            const { token, user: userData, message, needsEmailVerification } = response.data;
console.log(response.data)
alert(response.data)
            if (needsEmailVerification) {
                return {
                    needsEmailVerification: true,
                    message: message || 'Please check your email to confirm your account.'
                };
            }

            if (token && userData) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                // Do NOT reload or redirect here; let the caller handle navigation
                return { success: true };
            }

            return { error: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response?.status === 403) {
                // User needs profile verification
                return {
                    error: error.response.data.message || 'Your profile is not yet fully validated. Please wait until RH and Direction confirm it.'
                };
            }
            
            return {
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const verifyEmail = async (token) => {
        try {
            const response = await axiosInstance.get(`/auth/verify-email/${token}`);
            const { needsPasswordCreation, userId } = response.data;
            
            return {
                needsPasswordCreation,
                userId
            };
        } catch (error) {
            console.error('Email verification error:', error);
            throw new Error(error.response?.data?.message || 'Email verification failed');
        }
    };

    const createPassword = async (userId, password) => {
        try {
            await axiosInstance.post('/auth/create-password', {
                userId,
                password
            });
        } catch (error) {
            console.error('Create password error:', error);
            throw new Error(error.response?.data?.message || 'Failed to create password');
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const response = await axiosInstance.put('/auth/profile', profileData);
            const updatedUser = response.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Update profile error:', error);
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    };

    const uploadPhoto = async (file) => {
        try {
            const formData = new FormData();
            formData.append('photo', file);

            const response = await axiosInstance.post('/upload/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const updatedUser = { ...user, photo: response.data.filename };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Upload photo error:', error);
            throw new Error(error.response?.data?.message || 'Failed to upload photo');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        // Do NOT reload or redirect here; let the caller handle navigation
    };

    const isAuthenticated = () => {
        return !!user && !!localStorage.getItem('token');
    };

    const isFullyVerified = () => {
        return user?.validEmail && user?.verifiedProfileRh && user?.verifiedProfileDirection;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        verifyEmail,
        createPassword,
        updateProfile,
        uploadPhoto,
        isAuthenticated,
        isFullyVerified
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
