import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { AuthShell } from "./Login";

export default function Signup() {
    const { signUp, signIn } = useAuth();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showVerifyMsg, setShowVerifyMsg] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        if (password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password, fullName);
            const { track } = await import("@/lib/telemetry");
            track("signup_completed", { has_name: Boolean(fullName) });
            toast.success("Welcome aboard.");
            navigate("/dashboard");
        } catch (err) {
            if (err.status === 409) {
                toast.error("An account with this email already exists.", { description: "Please sign in instead." });
            } else {
                toast.error(err.message || "Could not create account.");
            }
        } finally {
            setLoading(false);
        }
    }

    if (showVerifyMsg) {
        return (
            <AuthShell title="Check your email." subtitle="We sent a verification link to confirm your account.">
                <div className="editorial-card p-6 text-sm leading-relaxed" data-testid="verify-email-card">
                    <p>We sent a verification email to <span className="font-medium">{email}</span>. Click the link, then return to log in.</p>
                    <Link to="/login"><Button className="cta-red w-full h-11 rounded-xl mt-5" data-testid="verify-go-login-button">Go to login <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Begin the formula." subtitle="Steps 1 & 2 are free, forever. No credit card.">
            <form onSubmit={onSubmit} className="space-y-5" data-testid="signup-form">
                <div>
                    <Label htmlFor="name" className="label-eyebrow text-brand-bronze">Full name</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="signup-name-input" />
                </div>
                <div>
                    <Label htmlFor="email" className="label-eyebrow text-brand-bronze">Email</Label>
                    <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="signup-email-input" />
                </div>
                <div>
                    <Label htmlFor="password" className="label-eyebrow text-brand-bronze">Password</Label>
                    <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="signup-password-input" />
                    <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <Button type="submit" disabled={loading} className="cta-red w-full h-11 rounded-xl" data-testid="signup-submit-button">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
            </form>
            <p className="mt-6 text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-brand-bronze hover:text-brand-gold font-medium" data-testid="signup-to-login-link">Sign in</Link>
            </p>
        </AuthShell>
    );
}
