import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { LOGO_URL } from "@/lib/brand";

export default function Login() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const loc = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn(email, password);
            toast.success("Welcome back.");
            const dest = loc.state?.from || "/dashboard";
            navigate(dest, { replace: true });
        } catch (err) {
            toast.error(err.message || "Could not sign in.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Welcome back." subtitle="Sign in to continue your plan.">
            <form onSubmit={onSubmit} className="space-y-5" data-testid="login-form">
                <div>
                    <Label htmlFor="email" className="label-eyebrow text-brand-bronze">Email</Label>
                    <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="login-email-input" />
                </div>
                <div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="label-eyebrow text-brand-bronze">Password</Label>
                        <Link to="/forgot-password" className="text-xs text-brand-bronze hover:text-brand-gold" data-testid="login-forgot-link">Forgot?</Link>
                    </div>
                    <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 rounded-xl" data-testid="login-password-input" />
                </div>
                <Button type="submit" disabled={loading} className="cta-red w-full h-11 rounded-xl" data-testid="login-submit-button">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
            </form>
            <p className="mt-6 text-sm text-muted-foreground text-center">
                New here?{" "}
                <Link to="/signup" className="text-brand-bronze hover:text-brand-gold font-medium" data-testid="login-to-signup-link">Create an account</Link>
            </p>
        </AuthShell>
    );
}

export function AuthShell({ title, subtitle, children }) {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2" data-testid="auth-shell">
            <div className="relative bg-brand-charcoal text-brand-cream hidden lg:flex flex-col p-10 overflow-hidden">
                <Link to="/" className="flex items-center gap-2.5" data-testid="auth-logo-link">
                    <img src={LOGO_URL} alt="Influence Incubator" className="h-11 w-11 rounded-md object-contain" />
                    <span className="font-serif text-lg">Influence Incubator</span>
                </Link>
                <div className="mt-auto">
                    <div className="label-eyebrow text-brand-gold mb-3">A 7-step formula by Dr. Brandt R. Gibson</div>
                    <h2 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em]">Marketing Your <span className="italic text-brand-gold">Extraordinary.</span></h2>
                    <p className="mt-5 text-brand-cream/75 max-w-md leading-relaxed">From spark to a complete plan — with AI as your co-author and Hero’s Journey as your spine.</p>
                </div>
                <div className="absolute -top-32 -right-20 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(closest-side, hsl(var(--brand-gold) / 0.5), transparent)" }} />
            </div>
            <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden flex items-center gap-2.5 mb-10">
                        <img src={LOGO_URL} alt="Influence Incubator" className="h-10 w-10 rounded-md object-contain" />
                        <span className="font-serif text-lg">Influence Incubator</span>
                    </div>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-[-0.02em]" data-testid="auth-title">{title}</h1>
                    {subtitle && <p className="mt-2 text-muted-foreground text-sm" data-testid="auth-subtitle">{subtitle}</p>}
                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
