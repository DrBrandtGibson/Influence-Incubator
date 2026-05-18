/**
 * Pricing CTAs: trigger Stripe Checkout via backend /billing/checkout
 * and redirect to Stripe-hosted checkout. After payment, Stripe redirects
 * to /dashboard?session_id=... where polling completes activation.
 */
import { useState } from "react";
import { authedFetch, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function useStartCheckout() {
    const [loading, setLoading] = useState(null); // 'lifetime' | 'monthly' | null
    const navigate = useNavigate();

    async function start(pkg) {
        if (loading) return;
        // Require auth
        const { data: sess } = await supabase.auth.getSession();
        if (!sess?.session?.access_token) {
            toast.message("Sign in to continue", { description: "Create an account to unlock Pro." });
            navigate("/signup");
            return;
        }
        setLoading(pkg);
        try {
            const res = await authedFetch("/billing/checkout", {
                method: "POST",
                body: JSON.stringify({
                    package: pkg,
                    origin: window.location.origin,
                }),
            });
            if (!res.ok) {
                let msg = "Could not start checkout.";
                try {
                    const j = await res.json();
                    msg = j.detail || msg;
                } catch {}
                if (res.status === 409) {
                    toast.success("You're already a Pro member!", {
                        description: "Head to your dashboard to enjoy unlimited access.",
                    });
                    navigate("/dashboard");
                    return;
                }
                throw new Error(msg);
            }
            const data = await res.json();
            if (!data.url) throw new Error("Checkout URL missing in response.");
            // Redirect to Stripe Checkout
            window.location.href = data.url;
        } catch (e) {
            toast.error(e.message || "Checkout failed.");
            setLoading(null);
        }
    }

    return { start, loading };
}
