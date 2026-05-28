import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/supabase";
import { useStartCheckout } from "@/lib/useStartCheckout";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2, FileText, Lock, Sparkles, Clock, Trash2, Layers, Infinity as InfinityIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { STEPS } from "@/lib/steps";
import SubscriptionPanel from "@/components/plans/SubscriptionPanel";

export default function Dashboard() {
    const { profile, isPro, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [plans, setPlans] = useState(null);
    const [quota, setQuota] = useState(null);
    const [creating, setCreating] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const sessionPolledRef = useRef(null);
    const { start: startExtraCheckout, loading: extraLoading } = useStartCheckout();

    const loadPlans = useCallback(async () => {
        try {
            const [plansRes, quotaRes] = await Promise.all([
                authedFetch("/plans"),
                authedFetch("/plans/quota"),
            ]);
            if (!plansRes.ok) throw new Error("Failed to load plans.");
            const data = await plansRes.json();
            setPlans(data.plans || []);
            if (quotaRes.ok) setQuota(await quotaRes.json());
        } catch (e) {
            console.error("Dashboard.loadPlans failed:", e);
            toast.error(e.message || "Could not load plans.");
            setPlans([]);
        }
    }, []);

    useEffect(() => {
        document.title = "Your Plans — Influence Incubator";
        loadPlans();
    }, [loadPlans]);

    // Handle ?session_id (Pro purchase) and ?extra_session_id (extra plan slot) after returning from Stripe
    useEffect(() => {
        const sidPro = searchParams.get("session_id");
        const sidExtra = searchParams.get("extra_session_id");
        const sid = sidPro || sidExtra;
        const isExtra = Boolean(sidExtra && !sidPro);
        if (!sid || sessionPolledRef.current === sid) return;
        sessionPolledRef.current = sid;

        let cancelled = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 6; // ~12s total
        const INTERVAL_MS = 2000;

        async function poll() {
            if (cancelled) return;
            attempts += 1;
            setConfirming(true);
            try {
                const res = await authedFetch(`/billing/session/${sid}`);
                if (!res.ok) {
                    // 403/404 — clear param and stop
                    if (res.status === 403 || res.status === 404) {
                        setSearchParams({}, { replace: true });
                        setConfirming(false);
                        return;
                    }
                    throw new Error("status check failed");
                }
                const j = await res.json();
                const paid = j.payment_status === "paid";
                const success = isExtra ? paid : (paid || j.is_pro);
                if (success) {
                    if (isExtra) {
                        toast.success("Plan slot added!", {
                            description: "You can now create another plan.",
                        });
                    } else {
                        const pkg = j.package;
                        toast.success("Welcome to Pro!", {
                            description: pkg === "lifetime_unlimited"
                                ? "Lifetime Unlimited unlocked — unlimited plans, every step, forever."
                                : pkg === "lifetime"
                                    ? "Lifetime access unlocked — every step is yours, forever."
                                    : "Monthly Pro is live — all 7 steps unlocked. Cancel anytime.",
                        });
                    }
                    await refreshProfile();
                    await loadPlans();
                    setSearchParams({}, { replace: true });
                    setConfirming(false);
                    return;
                }
                if (j.status === "expired" || attempts >= MAX_ATTEMPTS) {
                    toast.error("We couldn't confirm your payment.", {
                        description: "If you completed checkout, refresh in a moment — webhooks finalize within seconds.",
                    });
                    setSearchParams({}, { replace: true });
                    setConfirming(false);
                    return;
                }
                setTimeout(poll, INTERVAL_MS);
            } catch (e) {
                console.warn("Dashboard.poll error:", e);
                if (attempts >= MAX_ATTEMPTS) {
                    setSearchParams({}, { replace: true });
                    setConfirming(false);
                    return;
                }
                setTimeout(poll, INTERVAL_MS);
            }
        }
        poll();
        return () => { cancelled = true; };
    }, [searchParams, setSearchParams, refreshProfile, loadPlans]);

    // Handle ?canceled=1 and ?extras_canceled=1 (run once on mount)
    useEffect(() => {
        if (searchParams.get("canceled")) {
            toast.message("Checkout canceled.", { description: "No charges were made. You can try again any time." });
            setSearchParams({}, { replace: true });
        }
        if (searchParams.get("extras_canceled")) {
            toast.message("Extra plan slot purchase canceled.");
            setSearchParams({}, { replace: true });
        }
        // Intentionally only runs on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function startNewPlan() {
        if (quota && !quota.unlimited && quota.remaining <= 0) {
            // Friendly inline messaging — exact CTA depends on tier
            if (quota.tier === "free") {
                toast.message("Free plan limit reached.", {
                    description: "Upgrade to Monthly or Lifetime to unlock more plans.",
                    action: { label: "View pricing", onClick: () => navigate("/pricing") },
                });
            } else {
                const isLifetime = quota.tier === "pro_lifetime";
                const price = isLifetime ? "$19.99 one-time" : "$10/mo";
                toast.message(`You've used all ${quota.limit} plan slots.`, {
                    description: `Buy an additional plan slot for ${price}.`,
                    action: {
                        label: "Buy more",
                        onClick: () => startExtraCheckout(quota.extra_package),
                    },
                });
            }
            return;
        }
        navigate("/plans/new");
    }

    async function deletePlan(planId) {
        if (deletingId) return;
        setDeletingId(planId);
        try {
            const res = await authedFetch(`/plans/${planId}`, { method: "DELETE" });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.detail || "Could not delete plan.");
            }
            toast.success("Plan deleted permanently.");
            await loadPlans();
        } catch (e) {
            toast.error(e.message || "Delete failed.");
        } finally {
            setDeletingId(null);
        }
    }

    async function buyExtraSlot() {
        if (!quota?.extra_package) return;
        await startExtraCheckout(quota.extra_package);
    }

    return (
        <div className="container-readable py-12 md:py-16" data-testid="dashboard-page">
            {confirming && (
                <div
                    className="fixed inset-x-0 top-16 z-40 flex items-center justify-center pointer-events-none"
                    data-testid="checkout-confirming-banner"
                >
                    <div className="bg-brand-charcoal text-brand-cream rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] inline-flex items-center gap-2 shadow-lg pointer-events-auto">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-gold" />
                        Confirming your payment…
                    </div>
                </div>
            )}
            <div className="flex items-end justify-between mb-10">
                <div>
                    <div className="label-eyebrow mb-2 text-brand-bronze">Your workspace</div>
                    <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</h1>
                    <p className="mt-2 text-muted-foreground">{plans === null ? "Loading…" : plans.length === 0 ? "Begin your first plan — it takes about 60 seconds to set up." : `You have ${plans.length} plan${plans.length === 1 ? "" : "s"}.`}</p>
                </div>
                <Button onClick={startNewPlan} className="cta-red rounded-xl h-11 px-5" disabled={creating} data-testid="new-plan-button">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> New Plan</>}
                </Button>
            </div>

            <SubscriptionPanel />

            {/* Quota counter */}
            {quota && plans !== null && (
                <div className="mb-6 flex items-center gap-3 text-sm text-muted-foreground" data-testid="quota-indicator">
                    <Layers className="h-4 w-4 text-brand-bronze" />
                    {quota.unlimited ? (
                        <span data-testid="quota-unlimited-label">
                            <strong className="text-foreground">{quota.used}</strong> plan{quota.used === 1 ? "" : "s"} · <span className="inline-flex items-center gap-1 text-brand-gold"><InfinityIcon className="h-3.5 w-3.5" /> Unlimited</span>
                        </span>
                    ) : (
                        <>
                            <span><strong className="text-foreground">{quota.used}</strong> of <strong className="text-foreground">{quota.limit}</strong> plan slot{quota.limit === 1 ? "" : "s"} used</span>
                            {quota.remaining === 0 && quota.tier !== "free" && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={buyExtraSlot}
                                    disabled={!!extraLoading}
                                    className="ml-2 h-7 text-xs border-brand-gold/40 text-brand-bronze hover:bg-brand-gold/10"
                                    data-testid="buy-extra-slot-button"
                                >
                                    {extraLoading ? <Loader2 className="h-3 w-3 animate-spin" /> :
                                        quota.tier === "pro_lifetime" ? "+ Buy extra slot · $19.99" : "+ Buy extra slot · $10/mo"}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Plan list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="plans-grid">
                {plans === null ? (
                    <div className="col-span-full editorial-card p-10 grid place-items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-brand-bronze" />
                    </div>
                ) : plans.length === 0 ? (
                    <EmptyState onClick={startNewPlan} />
                ) : (
                    <>
                        {plans.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className="editorial-card p-6 hover:shadow-md transition-shadow group relative"
                                data-testid={`plan-card-${p.id}`}>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <FileText className="h-5 w-5 text-brand-bronze" />
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Step {p.current_step || 1} · {STEPS.find(s => s.num === (p.current_step || 1)).short}</span>
                                </div>
                                <div className="cursor-pointer" onClick={() => navigate(`/plans/${p.id}/${STEPS.find(s => s.num === (p.current_step || 1)).key}`)}>
                                    <h3 className="font-serif text-2xl mb-1 line-clamp-2">{p.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{p.idea || p.industry || "—"}</p>
                                    <div className="gold-divider my-4" />
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {new Date(p.updated_at || p.created_at).toLocaleDateString()}</span>
                                        <span className="text-brand-bronze group-hover:text-brand-gold">Open →</span>
                                    </div>
                                </div>
                                {(p.current_step || 1) >= 7 && (
                                    <Link
                                        to={`/plans/${p.id}/business-plan`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-bronze hover:text-brand-gold"
                                        data-testid={`view-business-plan-${p.id}`}
                                    >
                                        <Layers className="h-3.5 w-3.5" /> View Business Plan →
                                    </Link>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={deletingId === p.id}
                                            className="absolute top-3 right-3 h-7 w-7 grid place-items-center rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            aria-label={`Delete plan ${p.title}`}
                                            data-testid={`delete-plan-${p.id}`}
                                        >
                                            {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete "{p.title}" permanently?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will erase the plan and all its content forever. The plan slot will be freed up so you can create a new one in its place. <strong>This action cannot be undone.</strong>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel data-testid={`delete-plan-cancel-${p.id}`}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => deletePlan(p.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                data-testid={`delete-plan-confirm-${p.id}`}
                                            >
                                                Delete permanently
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </motion.div>
                        ))}
                        {quota && quota.remaining === 0 && quota.tier === "free" && (
                            <Link to="/pricing" className="editorial-card border-dashed p-6 grid place-items-center text-center hover:border-brand-gold transition-colors" data-testid="upgrade-promo-card">
                                <div>
                                    <Lock className="h-5 w-5 mx-auto mb-3 text-brand-gold" />
                                    <div className="font-serif text-xl mb-1">Want a second plan?</div>
                                    <p className="text-xs text-muted-foreground mb-3">Upgrade to Monthly ($19/mo, 1 plan) or Lifetime ($97 one-time, 6 plans).</p>
                                    <span className="text-sm text-brand-bronze inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> View pricing</span>
                                </div>
                            </Link>
                        )}
                        {quota && quota.remaining === 0 && quota.tier !== "free" && (
                            <button
                                onClick={buyExtraSlot}
                                disabled={!!extraLoading}
                                className="editorial-card border-dashed p-6 grid place-items-center text-center hover:border-brand-gold transition-colors text-left disabled:opacity-60"
                                data-testid="buy-extra-slot-card"
                            >
                                <div>
                                    <Plus className="h-5 w-5 mx-auto mb-3 text-brand-gold" />
                                    <div className="font-serif text-xl mb-1">Need another plan slot?</div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        {quota.tier === "pro_lifetime"
                                            ? "Add one more plan to your Lifetime account for $19.99 (one-time)."
                                            : "Add one more plan slot for $10/mo. Cancel anytime."}
                                    </p>
                                    <span className="text-sm text-brand-bronze inline-flex items-center gap-1">
                                        {extraLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Buy extra slot
                                    </span>
                                </div>
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function EmptyState({ onClick }) {
    return (
        <div className="col-span-full editorial-card p-12 text-center" data-testid="empty-state">
            <div className="label-eyebrow mb-3 text-brand-bronze">Begin</div>
            <h2 className="font-serif text-3xl md:text-4xl tracking-[-0.02em]">Your first plan starts with one good idea.</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">We’ll guide you through Steps 1 & 2 — free — with AI assist on every question.</p>
            <div className="mt-7">
                <Button onClick={onClick} className="cta-red rounded-xl h-11 px-6" data-testid="empty-state-cta"><Plus className="h-4 w-4 mr-2" /> Create your first plan</Button>
            </div>
        </div>
    );
}
