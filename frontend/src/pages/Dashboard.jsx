import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { authedFetch } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FileText, Lock, Sparkles, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { STEPS } from "@/lib/steps";

export default function Dashboard() {
    const { profile, isPro } = useAuth();
    const navigate = useNavigate();
    const [plans, setPlans] = useState(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        document.title = "Your Plans — Influence Incubator";
        loadPlans();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadPlans() {
        try {
            const res = await authedFetch("/plans");
            if (!res.ok) throw new Error("Failed to load plans.");
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (e) {
            toast.error(e.message || "Could not load plans.");
            setPlans([]);
        }
    }

    function startNewPlan() {
        if (!isPro && (plans?.length ?? 0) >= 1) {
            toast.message("Free plan limit reached.", { description: "Upgrade to Pro for unlimited plans.", action: { label: "View pricing", onClick: () => navigate("/pricing") } });
            return;
        }
        navigate("/plans/new");
    }

    return (
        <div className="container-readable py-12 md:py-16" data-testid="dashboard-page">
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
                                className="editorial-card p-6 hover:shadow-md transition-shadow group cursor-pointer"
                                onClick={() => navigate(`/plans/${p.id}/${STEPS.find(s => s.num === (p.current_step || 1)).key}`)}
                                data-testid={`plan-card-${p.id}`}>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <FileText className="h-5 w-5 text-brand-bronze" />
                                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Step {p.current_step || 1} · {STEPS.find(s => s.num === (p.current_step || 1)).short}</span>
                                </div>
                                <h3 className="font-serif text-2xl mb-1 line-clamp-2">{p.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{p.idea || p.industry || "—"}</p>
                                <div className="gold-divider my-4" />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {new Date(p.updated_at || p.created_at).toLocaleDateString()}</span>
                                    <span className="text-brand-bronze group-hover:text-brand-gold">Open →</span>
                                </div>
                            </motion.div>
                        ))}
                        {!isPro && plans.length >= 1 && (
                            <Link to="/pricing" className="editorial-card border-dashed p-6 grid place-items-center text-center hover:border-brand-gold transition-colors" data-testid="upgrade-promo-card">
                                <div>
                                    <Lock className="h-5 w-5 mx-auto mb-3 text-brand-gold" />
                                    <div className="font-serif text-xl mb-1">Want a second plan?</div>
                                    <p className="text-xs text-muted-foreground mb-3">Pro lets you create unlimited plans.</p>
                                    <span className="text-sm text-brand-bronze inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> Upgrade to Pro</span>
                                </div>
                            </Link>
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
