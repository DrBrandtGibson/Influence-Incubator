import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock, Check, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Pricing() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <Card
                        recommended
                        title="Lifetime"
                        price="$97"
                        cadence="one-time, forever"
                        ctaLabel="Get Lifetime Access"
                        features={[
                            "All 7 steps unlocked, forever",
                            "Unlimited plans",
                            "Unlimited AI generations",
                            "PDF + Word exports",
                            "Plan version history",
                            "7-day money-back guarantee"
                        ]}
                        onClick={() => isAuthenticated ? alert("Stripe checkout enabled in Phase 11.") : navigate("/signup")}
                    />
                    <Card
                        title="Monthly"
                        price="$19"
                        cadence="per month, cancel anytime"
                        ctaLabel="Start Monthly"
                        features={[
                            "All 7 steps unlocked",
                            "Unlimited plans",
                            "Unlimited AI generations",
                            "PDF + Word exports",
                            "Plan version history",
                            "7-day money-back guarantee"
                        ]}
                        onClick={() => isAuthenticated ? alert("Stripe checkout enabled in Phase 11.") : navigate("/signup")}
                    />
                </div>
                <div className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-brand-gold" />
                    7-day money-back guarantee on both plans.
                </div>
            </section>
        </div>
    );
}

function Card({ title, price, cadence, features, ctaLabel, onClick, recommended }) {
    return (
        <div className={`relative editorial-card p-8 ${recommended ? "ring-2 ring-brand-gold" : ""}`} data-testid={`pricing-card-${title.toLowerCase()}`}>
            {recommended && (
                <span className="absolute -top-3 left-8 text-[10px] uppercase tracking-[0.18em] bg-brand-gold text-brand-charcoal px-2.5 py-1 rounded-full" data-testid="recommended-badge">Most popular</span>
            )}
            <div className="label-eyebrow text-brand-bronze">{title}</div>
            <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-serif text-6xl tracking-[-0.02em]">{price}</span>
                {title === "Monthly" && <span className="text-muted-foreground">/mo</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{cadence}</p>
            <div className="gold-divider my-6" />
            <ul className="space-y-3 text-sm">
                {features.map((f, i) => (
                    <li key={i} className="flex gap-3"><Check className="h-4 w-4 mt-0.5 text-brand-gold" /><span>{f}</span></li>
                ))}
            </ul>
            <Button onClick={onClick} className={`mt-7 w-full h-11 rounded-xl ${recommended ? "cta-red" : ""}`} data-testid={`pricing-${title.toLowerCase()}-cta-button`}>
                <Sparkles className="h-4 w-4 mr-2" /> {ctaLabel}
            </Button>
        </div>
    );
}
