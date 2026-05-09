import { Lock, Check, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LockedStepPreview = ({ step, features = [] }) => {
    return (
        <div className="max-w-3xl mx-auto py-10" data-testid={`locked-preview-step-${step.num}`}>
            <div className="label-eyebrow text-brand-bronze mb-3">Step {step.num} · Pro</div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">{step.title}</h1>
            <p className="mt-3 text-muted-foreground max-w-xl">{step.oneLiner}</p>

            {/* Blurred preview */}
            <div className="mt-8 relative overflow-hidden rounded-2xl border bg-card">
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="editorial-card p-5">
                            <div className="h-3 w-16 bg-secondary rounded mb-3" />
                            <div className="h-6 w-2/3 bg-secondary rounded mb-3" />
                            <div className="space-y-1.5">
                                <div className="h-2.5 w-full bg-secondary rounded" />
                                <div className="h-2.5 w-11/12 bg-secondary rounded" />
                                <div className="h-2.5 w-9/12 bg-secondary rounded" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="absolute inset-0 backdrop-blur-md bg-background/55 grid place-items-center">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-gold/15 border border-brand-gold/40 mb-3">
                            <Lock className="h-6 w-6 text-brand-gold" />
                        </div>
                        <div className="font-serif text-2xl tracking-[-0.02em]">Unlock to continue</div>
                        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">All 7 steps. Unlimited AI. Clean PDF & Word exports.</p>
                    </div>
                </div>
                <div aria-hidden="true" className="absolute top-6 -right-12 rotate-[-12deg] text-brand-gold/10 font-serif text-7xl tracking-widest pointer-events-none select-none">PRO</div>
            </div>

            {/* Features */}
            {features.length > 0 && (
                <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="locked-preview-feature-list">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3 editorial-card p-4">
                            <Check className="h-4 w-4 text-brand-gold mt-0.5" />
                            <span className="text-sm leading-relaxed">{f}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* CTA */}
            <div className="mt-10 dark-cinematic-panel p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <div className="font-serif text-2xl md:text-3xl">Ready to go deep?</div>
                    <p className="text-brand-cream/75 text-sm mt-1">Lifetime $97 · Monthly $19 · 7-day money-back</p>
                </div>
                <Link to="/pricing">
                    <Button className="cta-red rounded-full h-11 px-6" data-testid="locked-preview-upgrade-button">
                        <Sparkles className="h-4 w-4 mr-2" /> Unlock all 7 steps <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};
