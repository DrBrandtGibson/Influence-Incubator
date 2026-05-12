import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "./Login";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasRecovery, setHasRecovery] = useState(false);

    // Detect the password-recovery auth event Supabase emits when the user lands here from the email link.
    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") setHasRecovery(true);
        });
        // Also check current session in case the event fired before this mounted
        supabase.auth.getSession().then(({ data }) => {
            if (data?.session) setHasRecovery(true);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    async function onSubmit(e) {
        e.preventDefault();
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            toast.error("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            toast.success("Password updated. Welcome back.");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.message || "Could not update password.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Set a new password." subtitle="Choose something you’ll actually remember.">
            <form onSubmit={onSubmit} className="space-y-5" data-testid="reset-form">
                <div>
                    <Label htmlFor="password" className="label-eyebrow text-brand-bronze">New password</Label>
                    <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="reset-password-input" />
                    <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <div>
                    <Label htmlFor="confirm" className="label-eyebrow text-brand-bronze">Confirm new password</Label>
                    <PasswordInput id="confirm" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="reset-confirm-input" />
                </div>
                {!hasRecovery && (
                    <p className="text-xs text-muted-foreground" data-testid="reset-no-recovery-hint">
                        Tip: open this page from the link in your reset email. Without an active recovery session, the update may fail.
                    </p>
                )}
                <Button type="submit" disabled={loading} className="cta-red w-full h-11 rounded-xl" data-testid="reset-submit-button">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update password <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
            </form>
        </AuthShell>
    );
}
