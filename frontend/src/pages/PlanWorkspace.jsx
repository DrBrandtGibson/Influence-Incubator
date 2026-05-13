import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { authedFetch } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { StepNavigator } from "@/components/plans/StepNavigator";
import { LockedStepPreview } from "@/components/locked/LockedStepPreview";
import { STEPS } from "@/lib/steps";
import { Loader2, ChevronsLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

import StepDefine from "@/components/steps/StepDefine";
import StepExtract from "@/components/steps/StepExtract";
import StepFrame from "@/components/steps/StepFrame";
import StepIgnite from "@/components/steps/StepIgnite";
import StepNurture from "@/components/steps/StepNurture";
import StepExpand from "@/components/steps/StepExpand";
import StepDeliver from "@/components/steps/StepDeliver";
import { ExportMenu } from "@/components/plans/ExportMenu";

export default function PlanWorkspace() {
    const { planId, stepKey } = useParams();
    const { isPro } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [steps, setSteps] = useState([]);
    const [inputs, setInputs] = useState({});

    const currentStep = useMemo(() => STEPS.find((s) => s.key === stepKey) || STEPS[0], [stepKey]);
    const stepStatuses = useMemo(() => {
        const m = {};
        for (const s of steps) m[s.step_num] = s.status;
        return m;
    }, [steps]);

    const loadPlan = useCallback(async () => {
        try {
            const res = await authedFetch(`/plans/${planId}`);
            if (!res.ok) {
                if (res.status === 404) { toast.error("Plan not found."); navigate("/dashboard"); return; }
                throw new Error("Could not load plan.");
            }
            const data = await res.json();
            setPlan(data.plan);
            setSteps(data.steps);
            const map = {};
            for (const inp of data.inputs) {
                map[`${inp.step_num}:${inp.field_key}`] = inp.value || "";
            }
            setInputs(map);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, [planId, navigate]);

    useEffect(() => { loadPlan(); }, [loadPlan]);

    useEffect(() => {
        document.title = `${currentStep.title} — Influence Incubator`;
    }, [currentStep]);

    function getInput(stepNum, fieldKey) {
        return inputs[`${stepNum}:${fieldKey}`] || "";
    }
    function setInput(stepNum, fieldKey, value) {
        setInputs((prev) => ({ ...prev, [`${stepNum}:${fieldKey}`]: value }));
    }

    async function markStepStatus(stepNum, status) {
        try {
            await authedFetch(`/plans/${planId}/step-status`, { method: "POST", body: JSON.stringify({ step_num: stepNum, status }) });
            setSteps((prev) => {
                const exists = prev.some((s) => s.step_num === stepNum);
                if (exists) return prev.map((s) => s.step_num === stepNum ? { ...s, status } : s);
                return [...prev, { plan_id: planId, step_num: stepNum, status }];
            });
            await authedFetch(`/plans/${planId}`, { method: "PATCH", body: JSON.stringify({ current_step: stepNum }) });
        } catch (e) {
            toast.error("Could not update step status");
        }
    }

    if (loading) {
        return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-bronze" /></div>;
    }
    if (!plan) return <Navigate to="/dashboard" replace />;

    const locked = !isPro && currentStep.tier === "pro";

    function gotoStep(s) { navigate(`/plans/${planId}/${s.key}`); }

    const stepIdx = STEPS.findIndex((s) => s.key === currentStep.key);

    return (
        <div className="flex" data-testid="plan-workspace">
            <StepNavigator planId={planId} currentStepNum={currentStep.num} stepStatuses={stepStatuses} />
            <div className="flex-1 min-w-0">
                {/* Top bar */}
                <div className="sticky top-16 z-30 bg-background/85 backdrop-blur border-b border-border">
                    <div className="container-readable flex items-center justify-between h-12">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <button onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-1 hover:text-foreground" data-testid="workspace-back-link"><ChevronsLeft className="h-3.5 w-3.5" /> Plans</button>
                            <span>/</span>
                            <span className="text-foreground font-medium truncate max-w-[260px]">{plan.title}</span>
                            <span>/</span>
                            <span>Step {currentStep.num} · {currentStep.short}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ExportMenu planId={planId} planTitle={plan.title} />
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="lg:hidden" data-testid="mobile-steps-trigger">Steps</Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[300px] p-0 bg-brand-charcoal text-brand-cream">
                                    <div className="pt-4">
                                        <StepNavigatorMobile planId={planId} currentStepNum={currentStep.num} stepStatuses={stepStatuses} onClickStep={gotoStep} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>

                <div className="container-readable py-10">
                    {locked ? (
                        <LockedStepPreview
                            step={currentStep}
                            features={LOCKED_FEATURES[currentStep.key] || []}
                        />
                    ) : (
                        <StepRouter
                            stepKey={currentStep.key}
                            plan={plan}
                            getInput={getInput}
                            setInput={setInput}
                            markStepStatus={markStepStatus}
                            gotoStep={gotoStep}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

function StepRouter({ stepKey, plan, getInput, setInput, markStepStatus, gotoStep }) {
    const common = { plan, getInput, setInput, markStepStatus, gotoStep };
    if (stepKey === "define") return <StepDefine {...common} />;
    if (stepKey === "extract") return <StepExtract {...common} />;
    if (stepKey === "frame") return <StepFrame {...common} />;
    if (stepKey === "ignite") return <StepIgnite {...common} />;
    if (stepKey === "nurture") return <StepNurture {...common} />;
    if (stepKey === "expand") return <StepExpand {...common} />;
    if (stepKey === "deliver") return <StepDeliver {...common} />;
    return <ComingSoon stepKey={stepKey} />;
}

function ComingSoon({ stepKey }) {
    const step = STEPS.find((s) => s.key === stepKey);
    return (
        <div className="editorial-card p-10 text-center" data-testid="step-coming-soon">
            <div className="label-eyebrow text-brand-bronze mb-3">Step {step?.num}</div>
            <h2 className="font-serif text-4xl tracking-[-0.02em]">{step?.title}</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">{step?.oneLiner}</p>
            <p className="mt-6 text-sm text-muted-foreground">This step’s full pro experience is being assembled. For now, mark it complete to keep moving.</p>
        </div>
    );
}

// Inline mobile nav (re-uses StepNavigator-like UI with nav routing)
function StepNavigatorMobile({ planId, currentStepNum, stepStatuses, onClickStep }) {
    return <StepNavigator planId={planId} currentStepNum={currentStepNum} stepStatuses={stepStatuses} onClickStep={onClickStep} />;
}

const LOCKED_FEATURES = {
    frame: [
        "Brand Voice generator from 10 verbatim prompts",
        "Story Bank Builder — 20 prompts as expandable cards with AI brainstorm",
        "Hero’s Journey Builder — 12-stage SVG wheel × 2 journeys",
        "HOOK → STORY → OFFER generator",
        "Important Stories distillation — 200-word elevator + transformation promise"
    ],
    ignite: [
        "Brand Personality Recommender — archetypes + voice + 3 palettes + 3 typography pairings",
        "Pocket Media Empire — newsletter, blog, podcast, video, events",
        "Website Hub — InfluencerHub or MedicalHub sitemap with AI-drafted copy",
        "Two-Track Marketing Plan — DIY and 10X-with-AI tracks",
        "30/60/90 + Beyond drag-and-drop content calendar"
    ],
    nurture: [
        "Transformative Framework wizard with branded SVG diagram",
        "Continuity program designer",
        "SaaS Opportunity Generator — 3 scoped ideas",
        "Engaged Community blueprint"
    ],
    expand: [
        "Channel Amplification 90-day sprint",
        "Live Event Planner (virtual + in-person)",
        "Challenge / Summit Launcher",
        "Dream 100 CRM with outreach sequence",
        "Book Builder — outline wizard, 12-week timeline, KDP launch checklist"
    ],
    deliver: [
        "Show Up Filled Up SOP Builder",
        "Active Listening Engine + AI Voice-of-Customer dashboard",
        "Engagement Scorecard (5 KPIs)",
        "Customer Onboarding 7-touch sequence",
        "Retention & Surprise-and-Delight Playbook"
    ]
};
