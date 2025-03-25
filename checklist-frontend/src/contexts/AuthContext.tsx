// src/contexts/AuthContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';
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
}




const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | undefined>(undefined);
    const [userGroup, setUserGroup] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    return (
        <AuthContext.Provider value={{ user, setUser, userGroup, setUserGroup, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

// 自定义 Hook 用于访问 Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};