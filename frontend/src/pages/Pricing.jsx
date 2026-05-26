import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowLeft, ShieldCheck, Sparkles, Loader2, Infinity as InfinityIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStartCheckout } from "@/lib/useStartCheckout";

export default function Pricing() {
    const navigate = useNavigate();
    const { isAuthenticated, isPro, isUnlimited, profile } = useAuth();
    const { start, loading } = useStartCheckout();

    const currentStatus = profile?.subscription_status;
    // Upgrade is available to: free users, monthly subs, or $97 lifetime members.
    // It is NOT shown for users already on lifetime_unlimited.
    const canUpgradeToUnlimited = !isUnlimited;

    function onCta(pkg) {
        if (!isAuthenticated) {
            navigate(`/signup?return=/pricing&pkg=${pkg}`);
            return;
        }
        // For unlimited package, allow even already-Pro users (upgrade path).
        if (pkg === "lifetime_unlimited") {
            if (isUnlimited) {
                navigate("/dashboard");
                return;
            }
            start(pkg);
            return;
        }
        if (isPro) {
            navigate("/dashboard");
            return;
        }
        start(pkg);
    }

    const lifetimeCtaLabel = isUnlimited
        ? "You're on Unlimited"
        : currentStatus === "pro_lifetime"
            ? "You have Lifetime"
            : isPro
                ? "You have Pro access"
                : "Get Lifetime Access";

    const unlimitedCtaLabel = isUnlimited
        ? "You're on Unlimited"
        : currentStatus === "pro_lifetime"
            ? "Upgrade to Unlimited"
            : currentStatus === "pro_monthly"
                ? "Switch to Unlimited"
                : "Get Lifetime Unlimited";

    const monthlyCtaLabel = isUnlimited
        ? "You're on Unlimited"
        : currentStatus === "pro_monthly"
            ? "You're on Monthly"
            : isPro
                ? "You have Pro access"
                : "Start Monthly";

    return (
        <div data-testid="pricing-page" className="min-h-screen bg-background">
            <section className="bg-brand-charcoal text-brand-cream">
                <div className="container-readable py-20 md:py-24 text-center">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="text-brand-cream/70 hover:text-brand-cream mb-6" data-testid="pricing-back-button">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="label-eyebrow text-brand-gold mb-4">Pricing</div>
                    <h1 className="font-serif text-5xl md:text-6xl tracking-[-0.02em]">Unlock the full <span className="italic text-brand-gold">Influence Incubator</span> Formula.</h1>
                    <p className="mt-5 text-brand-cream/80 max-w-xl mx-auto">Steps 1 & 2 are free forever. Choose the path that fits when you’re ready to go deep through Steps 3–7.</p>
                </div>
            </section>

            <section className="container-readable py-16 md:py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
                    <Card
                        pkg="monthly"
                        title="Monthly"
                        price="$19"
                        cadence="per month, cancel anytime"
                        ctaLabel={monthlyCtaLabel}
                        features={[
                            "All 7 steps unlocked",
                            "1 active plan (add more for $10/mo each)",
                            "Unlimited AI generations",
                            "PDF + Word exports",
                            "Plan version history",
                            "7-day money-back guarantee"
                        ]}
                        loading={loading === "monthly"}
                        disabled={!!loading || (isPro && currentStatus !== "free")}
                        onClick={() => onCta("monthly")}
                    />
                    <Card
                        pkg="lifetime"
                        title="Lifetime"
                        price="$97"
                        cadence="one-time, forever"
                        ctaLabel={lifetimeCtaLabel}
                        features={[
                            "All 7 steps unlocked, forever",
                            "Up to 6 plans (add more for $19.99 each)",
                            "Unlimited AI generations",
                            "PDF + Word exports",
                            "Plan version history",
                            "7-day money-back guarantee"
                        ]}
                        loading={loading === "lifetime"}
                        disabled={!!loading || isPro}
                        onClick={() => onCta("lifetime")}
                    />
                    <Card
                        recommended
                        unlimited
                        pkg="lifetime_unlimited"
                        title="Lifetime Unlimited"
                        price="$397"
                        cadence="one-time, forever"
                        ctaLabel={unlimitedCtaLabel}
                        features={[
                            "All 7 steps unlocked, forever",
                            "Unlimited plans — build as many as you want",
                            "Priority access to new step releases",
                            "Unlimited AI generations",
                            "PDF + Word exports",
                            "Plan version history",
                            "7-day money-back guarantee",
                        ]}
                        loading={loading === "lifetime_unlimited"}
                        disabled={!!loading || !canUpgradeToUnlimited}
                        onClick={() => onCta("lifetime_unlimited")}
                    />
                </div>
                <div className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-brand-gold" />
                    7-day money-back guarantee on all plans.
                </div>
            </section>
        </div>
    );
}

function Card({ title, price, cadence, features, ctaLabel, onClick, recommended, loading, disabled, pkg, unlimited }) {
    const testIdSuffix = pkg || title.toLowerCase().replace(/\s+/g, "-");
    return (
        <div className={`relative editorial-card p-8 flex flex-col ${recommended ? "ring-2 ring-brand-gold" : ""}`} data-testid={`pricing-card-${testIdSuffix}`}>
            {recommended && (
                <span className="absolute -top-3 left-8 text-[10px] uppercase tracking-[0.18em] bg-brand-gold text-brand-charcoal px-2.5 py-1 rounded-full" data-testid="recommended-badge">Best value</span>
            )}
            <div className="label-eyebrow text-brand-bronze inline-flex items-center gap-2">
                {unlimited && <InfinityIcon className="h-3.5 w-3.5 text-brand-gold" />} {title}
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-serif text-6xl tracking-[-0.02em]">{price}</span>
                {title === "Monthly" && <span className="text-muted-foreground">/mo</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{cadence}</p>
            <div className="gold-divider my-6" />
            <ul className="space-y-3 text-sm flex-1">
                {features.map((f) => (
                    <li key={f} className="flex gap-3"><Check className="h-4 w-4 mt-0.5 text-brand-gold flex-shrink-0" /><span>{f}</span></li>
                ))}
            </ul>
            <Button
                onClick={onClick}
                disabled={disabled}
                className={`mt-7 w-full h-11 rounded-xl ${recommended ? "cta-red" : ""}`}
                data-testid={`pricing-${testIdSuffix}-cta-button`}
                data-package={pkg}
            >
                {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting to checkout…</>
                ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> {ctaLabel}</>
                )}
            </Button>
        </div>
    );
}
