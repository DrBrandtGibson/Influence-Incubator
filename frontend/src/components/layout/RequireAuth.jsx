import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const RequireAuth = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const loc = useLocation();
    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-6 w-6 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
                    <span className="text-sm font-sans">Loading…</span>
                </div>
            </div>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
    }
    return children;
};
