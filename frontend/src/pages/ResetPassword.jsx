import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "./Login";

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters.");
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
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="reset-password-input" />
                </div>
                <Button type="submit" disabled={loading} className="cta-red w-full h-11 rounded-xl" data-testid="reset-submit-button">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update password <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
            </form>
        </AuthShell>
    );
}
