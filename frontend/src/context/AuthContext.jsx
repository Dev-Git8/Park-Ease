import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/api';
import { setAccessToken, clearAccessToken } from '../api/authStore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const getInitialUser = () => {
        try {
            const savedUser = localStorage.getItem('user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error('Failed to parse user from localStorage', error);
            localStorage.removeItem('user');
            return null;
        }
    };

    const [user, setUser] = useState(getInitialUser());
    const [loading, setLoading] = useState(true);
    const hasRestoredSessionRef = useRef(false);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout failed', error);
        } finally {
            setUser(null);
            clearAccessToken();
            localStorage.removeItem('user');
        }
    }, []);

    // Initial check for session. Guarded against StrictMode's dev-only
    // double-invoke of mount effects: the backend rotates the refresh
    // token on every /auth/refresh call, so two concurrent calls race -
    // whichever loses gets a 401 for a token the winner already rotated
    // away, which would otherwise silently log the UI out on load.
    useEffect(() => {
        if (hasRestoredSessionRef.current) return;
        hasRestoredSessionRef.current = true;

        const restoreSession = async () => {
            try {
                // Try to refresh token on app load
                const { data } = await api.post('/auth/refresh');
                setAccessToken(data.accessToken);
                
                // If we don't have user info but token is valid, we might need a /me endpoint
                // For now, let's assume if refresh works, the user in localStorage is valid
                // or the refresh response could return user info too.
                if (data.user) {
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
            } catch {
                console.log('No active session found.');
                setUser(null);
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const { accessToken, ...userData } = data.data;
        
        setUser(userData);
        setAccessToken(accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return userData;
    };


    const register = async (name, email, password, role) => {
        await api.post('/auth/register', { name, email, password, role });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components -- consumer hook co-located with its provider, standard React context pattern
export const useAuth = () => useContext(AuthContext);

