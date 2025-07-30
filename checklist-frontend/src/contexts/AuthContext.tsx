// src/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import Logger from '../utils/logger';

interface User {
    [key: string]: string;
}

interface AuthContextType {
    user: User | undefined;
    setUser: (user: User | undefined) => void;
    userGroup: string | null;
    setUserGroup: (userGroup: string | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | undefined>(undefined);
    const [userGroup, setUserGroup] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Add useEffect for development bypass (OPTIONAL - only if you want to keep dev mode)
    useEffect(() => {
        Logger.info('🔍 AuthContext: Initializing authentication...');
        
        // OPTIONAL: Keep development mode bypass for local testing
        // Remove this entire if block if you want to force Okta authentication everywhere
        if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SKIP_AUTH === 'true') {
            Logger.info('🚀 AuthContext: Development mode with auth skip detected - setting mock user');
            
            const mockUser: User = {
                id: 'dev-user',
                name: 'Development User',
                email: 'dev@localhost',
                groups: 'ALL_SITES'
            };

            setUser(mockUser);
            setUserGroup('ALL_SITES');
            setLoading(false);
            
            Logger.info('✅ AuthContext: Mock user set:', mockUser);
            return;
        }

        // Production mode - Let ProtectedRoutes handle the authentication
        Logger.info('🔒 AuthContext: Production mode - authentication will be handled by ProtectedRoutes');
        // Don't set loading to false here - let ProtectedRoutes handle it
        
    }, []);

    // Helper to check if user is authenticated
    const isAuthenticated = user !== undefined && user !== null;

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser, 
            userGroup, 
            setUserGroup, 
            loading, 
            setLoading,
            isAuthenticated 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom Hook to access Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};