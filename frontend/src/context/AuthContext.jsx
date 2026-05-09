import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, authedFetch } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const res = await authedFetch("/profile/me");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("refreshProfile failed", e);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return;
            setSession(data.session);
            setLoading(false);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
        });
        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (session?.access_token) {
            refreshProfile();
        } else {
            setProfile(null);
        }
    }, [session?.access_token, refreshProfile]);

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signUp = async (email, password, fullName) => {
        // Use backend admin endpoint so the user is created with email auto-confirmed.
        // This works inside iframe previews where verification email links don't.
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, full_name: fullName })
        });
        if (!res.ok) {
            let msg = "Signup failed.";
            try { const j = await res.json(); msg = j.detail || msg; } catch {}
            const err = new Error(msg);
            err.status = res.status;
            throw err;
        }
        // Then sign the user in via Supabase to get a real session
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    const requestPasswordReset = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
    };

    const value = {
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAuthenticated: !!session,
        isPro: profile?.subscription_status === "pro_lifetime" || profile?.subscription_status === "pro_monthly",
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        refreshProfile
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
