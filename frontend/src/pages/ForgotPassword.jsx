import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "./Login";

export default function ForgotPassword() {
    const { requestPasswordReset } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await requestPasswordReset(email);
            setSent(true);
            toast.success("Reset email sent.");
        } catch (err) {
            toast.error(err.message || "Could not send reset email.");
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <AuthShell title="Check your inbox." subtitle={`We sent a reset link to ${email}.`}>
                <div className="editorial-card p-6" data-testid="reset-sent-card">
                    <p className="text-sm leading-relaxed">If you don’t see it within a minute, check your spam folder.</p>
                    <Link to="/login"><Button variant="outline" className="w-full h-11 rounded-xl mt-5" data-testid="reset-go-login-button">Back to login</Button></Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Reset your password." subtitle="We’ll email you a secure link.">
            <form onSubmit={onSubmit} className="space-y-5" data-testid="forgot-form">
                <div>
                    <Label htmlFor="email" className="label-eyebrow text-brand-bronze">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="forgot-email-input" />
                </div>
                <Button type="submit" disabled={loading} className="cta-red w-full h-11 rounded-xl" data-testid="forgot-submit-button">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send reset link <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
            </form>
            <p className="mt-6 text-sm text-muted-foreground text-center">
                Remembered it?{" "}
                <Link to="/login" className="text-brand-bronze hover:text-brand-gold font-medium" data-testid="forgot-to-login-link">Back to login</Link>
            </p>
        </AuthShell>
    );
}
