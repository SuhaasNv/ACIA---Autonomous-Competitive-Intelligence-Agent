import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const ProtectedRoute = () => {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="h-8 w-8 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in -> Redirect to Landing
    if (!session) {
        return <Navigate to="/" replace state={{ from: location }} />;
    }

    // Logged in, but no profile -> Redirect to Onboarding
    // Allow them to stay if they are already on /onboarding
    if (!profile && location.pathname !== '/onboarding') {
        return <Navigate to="/onboarding" replace />;
    }

    // Logged in, profile exists, trying to access onboarding -> redirect to dashboard
    if (profile && location.pathname === '/onboarding') {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export const PublicRoute = () => {
    const { session, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;

    if (session) {
        if (!profile) {
            return <Navigate to="/onboarding" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
