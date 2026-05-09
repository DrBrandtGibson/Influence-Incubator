import { Lock, Check, ChevronRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { STEPS } from "@/lib/steps";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const StepNavigator = ({ planId, currentStepNum, stepStatuses = {}, onClickStep }) => {
    const { isPro } = useAuth();
    const navigate = useNavigate();
    const completedCount = Object.values(stepStatuses).filter((s) => s === "complete").length;

    return (
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 border-r border-white/10 bg-brand-charcoal text-brand-cream sticky top-16 h-[calc(100vh-4rem)]" data-testid="step-navigator">
            <div className="px-5 pt-6 pb-4">
                <div className="label-eyebrow text-brand-gold mb-1">7-Step Formula</div>
                <div className="font-serif text-xl">Your Plan</div>
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden" data-testid="plan-progress-bar">
                    <div className="h-full bg-brand-gold transition-[width] duration-300" style={{ width: `${(completedCount / 7) * 100}%` }} />
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-brand-cream/60">{completedCount} of 7 complete</div>
            </div>
            <div className="px-3 flex-1 overflow-y-auto">
                <ul className="space-y-0.5">
                    {STEPS.map((s) => {
                        const status = stepStatuses[s.num] || "not_started";
                        const locked = !isPro && s.tier === "pro";
                        const active = currentStepNum === s.num;
                        return (
                            <li key={s.num}>
                                <NavItem
                                    s={s}
                                    status={status}
                                    locked={locked}
                                    active={active}
                                    onClickStep={onClickStep}
                                    planId={planId}
                                />
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div className="px-5 pb-5 pt-3 text-xs text-brand-cream/60 border-t border-white/10">
                {!isPro ? (
                    <button onClick={() => navigate("/pricing")} className="text-brand-gold hover:text-white" data-testid="sidebar-upgrade-link">Upgrade to unlock Steps 3–7 →</button>
                ) : (
                    <span>Pro · all steps unlocked</span>
                )}
            </div>
        </aside>
    );
};

function NavItem({ s, status, locked, active, onClickStep, planId }) {
    const navigate = useNavigate();
    const item = (
        <button
            type="button"
            onClick={() => onClickStep ? onClickStep(s) : navigate(`/plans/${planId}/${s.key}`)}
            className={cn(
                "w-full text-left flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active ? "bg-white/8 border border-brand-gold/40" : "hover:bg-white/5 border border-transparent"
            )}
            data-testid={`step-navigator-step-${s.num}-link`}
        >
            <span className={cn(
                "h-7 w-7 shrink-0 rounded-full grid place-items-center text-[11px] border",
                status === "complete" ? "border-brand-gold text-brand-gold bg-brand-gold/10" : "border-white/15"
            )}>
                {status === "complete" ? <Check className="h-3.5 w-3.5" /> : String(s.num).padStart(2, "0")}
            </span>
            <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-brand-cream/60">Step {s.num}</span>
                    {s.tier === "free" ? (
                        <span className="text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full border border-brand-gold/40 text-brand-gold">Free</span>
                    ) : locked ? (
                        <Lock className="h-3 w-3 text-brand-gold" />
                    ) : (
                        <span className="text-[9px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold">Pro</span>
                    )}
                </span>
                <span className="block font-serif text-sm leading-snug mt-0.5">{s.title}</span>
            </span>
            <ChevronRight className="h-4 w-4 mt-1 text-white/30" />
        </button>
    );

    if (!locked) return item;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <span className="block" data-testid={`step-navigator-locked-step-${s.num}-button`}>{item}</span>
            </DialogTrigger>
            <DialogContent data-testid="upgrade-dialog">
                <DialogHeader>
                    <div className="label-eyebrow text-brand-bronze mb-1">Locked</div>
                    <DialogTitle className="font-serif text-2xl">Step {s.num} is part of Pro.</DialogTitle>
                    <DialogDescription>{s.oneLiner}</DialogDescription>
                </DialogHeader>
                <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                    <div className="editorial-card p-4">
                        <div className="label-eyebrow mb-1">Lifetime</div>
                        <div className="font-serif text-3xl">$97</div>
                        <div className="text-muted-foreground">one-time</div>
                    </div>
                    <div className="editorial-card p-4">
                        <div className="label-eyebrow mb-1">Monthly</div>
                        <div className="font-serif text-3xl">$19<span className="text-sm text-muted-foreground">/mo</span></div>
                        <div className="text-muted-foreground">cancel anytime</div>
                    </div>
                </div>
                <Button onClick={() => navigate("/pricing")} className="cta-red w-full h-11 rounded-xl mt-3" data-testid="upgrade-dialog-cta">View pricing</Button>
                <p className="text-[11px] text-muted-foreground text-center">7-day money-back guarantee</p>
            </DialogContent>
        </Dialog>
    );
}
