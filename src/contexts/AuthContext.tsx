import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from '@/lib/api';

interface User {
    id: string;
    email: string;
}

interface Session {
    token: string;
}

interface Profile {
    user_id: string;
    full_name: string | null;
    company_name: string | null;
    company_url: string | null;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data } = await api.getProfile();
            setProfile(data);
        } catch {
            setProfile(null);
        }
    };

    useEffect(() => {
        const bootstrap = async () => {
            const token = getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.getMe();
                setSession({ token });
                setUser(data.user);
                await fetchProfile();
            } catch {
                clearToken();
                setSession(null);
                setUser(null);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const signInWithEmail = async (email: string, password: string) => {
        const { data } = await api.login(email, password);
        setToken(data.token);
        setSession({ token: data.token });
        setUser(data.user);
        await fetchProfile();
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const { data } = await api.register(email, password);
        setToken(data.token);
        setSession({ token: data.token });
        setUser(data.user);
        setProfile(null);
    };

    const signOut = async () => {
        clearToken();
        setSession(null);
        setUser(null);
        setProfile(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile();
        }
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profile,
                loading,
                signInWithEmail,
                signUpWithEmail,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
