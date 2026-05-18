/**
 * Subscription summary + self-serve refund/cancel for Pro users.
 * Renders inline in Dashboard. Free users see an upgrade nudge.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authedFetch } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
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
import { Sparkles, ShieldCheck, Crown, Loader2, Calendar, BadgeCheck, Lock } from "lucide-react";
import { toast } from "sonner";

function fmtDate(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return null;
    }
}

function daysFromSeconds(s) {
    if (!s || s <= 0) return 0;
    return Math.max(1, Math.ceil(s / 86400));
}

export default function SubscriptionPanel() {
    const { isPro, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState(null); // "refund" | "cancel" | null

    async function load() {
        try {
            const res = await authedFetch("/billing/me");
            if (!res.ok) throw new Error("Could not load billing.");
            const j = await res.json();
            setData(j);
        } catch (e) {
            // silent — panel hides
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [isPro]);

    async function handleRefund() {
        setBusy("refund");
        try {
            const res = await authedFetch("/billing/refund", { method: "POST" });
            const j = await res.json();
            if (!res.ok) throw new Error(j?.detail || "Refund failed.");
            toast.success("Refund issued", {
                description: `We've issued a refund for $${(j.refunded_amount / 100).toFixed(2)}. Pro access has ended.`,
            });
            await refreshProfile();
            await load();
        } catch (e) {
            toast.error(e.message || "Refund failed.");
        } finally {
            setBusy(null);
        }
    }

    async function handleCancel() {
        setBusy("cancel");
        try {
            const res = await authedFetch("/billing/cancel-subscription", { method: "POST" });
            const j = await res.json();
            if (!res.ok) throw new Error(j?.detail || "Cancel failed.");
            toast.success("Subscription canceled", {
                description: j.ends_at
                    ? `Your access continues through ${fmtDate(j.ends_at)}.`
                    : "Your subscription will end at the period end.",
            });
            await refreshProfile();
            await load();
        } catch (e) {
            toast.error(e.message || "Cancel failed.");
        } finally {
            setBusy(null);
        }
    }

    if (loading) return null;

    // Free user nudge
    if (!data || !data.is_pro) {
        return (
            <div className="editorial-card p-6 md:p-7 mb-10 flex flex-col md:flex-row items-start md:items-center gap-5" data-testid="subscription-upgrade-nudge">
                <div className="h-12 w-12 rounded-xl bg-brand-gold/15 text-brand-gold grid place-items-center flex-shrink-0">
                    <Lock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="font-serif text-xl md:text-2xl tracking-[-0.01em]">You're on the Free plan</div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        Steps 1 & 2 are free forever. Unlock Steps 3–7, unlimited plans, full PDF + Word exports, and Pro AI — from $19/mo or $97 lifetime.
                    </p>
                </div>
                <Link to="/pricing">
                    <Button className="cta-red rounded-xl h-11 px-5" data-testid="subscription-upgrade-button">
                        <Sparkles className="h-4 w-4 mr-2" /> Upgrade
                    </Button>
                </Link>
            </div>
        );
    }

    // Pro user panel
    const isLifetime = data.subscription_status === "pro_lifetime";
    const refundDays = daysFromSeconds(data.refund_window_seconds_remaining);

    return (
        <div className="editorial-card p-6 md:p-7 mb-10" data-testid="subscription-panel">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="h-12 w-12 rounded-xl bg-brand-gold/15 text-brand-gold grid place-items-center flex-shrink-0">
                    <Crown className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-serif text-xl md:text-2xl tracking-[-0.01em]">
                            {isLifetime ? "Lifetime Pro" : "Monthly Pro"}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] bg-brand-gold/15 text-brand-gold px-2 py-1 rounded-full">
                            <BadgeCheck className="h-3 w-3" /> Active
                        </span>
                    </div>
                    <div className="mt-1.5 text-sm text-muted-foreground flex flex-wrap gap-x-5 gap-y-1">
                        {isLifetime ? (
                            <span>Forever access — every step unlocked.</span>
                        ) : (
                            <>
                                {data.pro_until && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" /> Renews {fmtDate(data.pro_until)}
                                    </span>
                                )}
                            </>
                        )}
                        {data.refund_eligible && refundDays > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-brand-bronze">
                                <ShieldCheck className="h-3.5 w-3.5" /> Refund window: {refundDays} {refundDays === 1 ? "day" : "days"} left
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-shrink-0">
                    {!isLifetime && data.has_subscription && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={!!busy} data-testid="cancel-subscription-button">
                                    {busy === "cancel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancel subscription"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Your Pro access will continue until {data.pro_until ? fmtDate(data.pro_until) : "the end of your current period"}, then you'll move to Free.
                                        No further charges will be made.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel data-testid="cancel-subscription-cancel">Keep subscription</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleCancel} data-testid="cancel-subscription-confirm">
                                        Yes, cancel
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {data.refund_eligible && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={!!busy} className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" data-testid="refund-button">
                                    {busy === "refund" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Request refund"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Request a full refund?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You're within your 7-day money-back window. We'll refund your last charge to the original payment method and cancel any active subscription.
                                        Pro access will end immediately.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel data-testid="refund-cancel">Never mind</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRefund} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="refund-confirm">
                                        Yes, refund me
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </div>
    );
}
