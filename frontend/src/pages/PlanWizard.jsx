import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authedFetch } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const STAGES = ["Just an idea", "Working on it part-time", "Already have customers", "Established and growing"];

export default function PlanWizard() {
    const { isPro } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [data, setData] = useState({
        idea: "",
        title: "",
        founder_backstory: "",
        industry: "",
        stage: ""
    });

    const slides = [
        { key: "idea", label: "What’s the spark?", helper: "Describe your business idea in plain language. One sentence is enough.", required: true, type: "textarea", placeholder: "e.g. A wellness coaching practice helping high-achieving women stop burning out." },
        { key: "title", label: "Give your plan a working title.", helper: "Optional. You can change this later.", type: "input", placeholder: "e.g. The Inner Compass Practice" },
        { key: "founder_backstory", label: "What’s your story?", helper: "Two or three sentences about you and why you care about this.", type: "textarea", placeholder: "e.g. After 10 years as a therapist I saw the gap between awareness and action…" },
        { key: "industry", label: "What industry is this in?", helper: "Pick the closest fit.", type: "input", placeholder: "e.g. Wellness, Coaching, Education, SaaS…" },
        { key: "stage", label: "Where are you today?", helper: "Be honest — we’ll meet you where you are.", type: "select", options: STAGES }
    ];

    const cur = slides[step];

    function next() {
        if (cur.required && !data[cur.key].trim()) {
            toast.error("This field is required.");
            return;
        }
        setStep((s) => Math.min(slides.length - 1, s + 1));
    }
    function prev() { setStep((s) => Math.max(0, s - 1)); }

    async function submit() {
        if (!data.idea.trim()) { toast.error("Please describe your idea."); setStep(0); return; }
        setSubmitting(true);
        try {
            const res = await authedFetch("/plans", {
                method: "POST",
                body: JSON.stringify({
                    idea: data.idea,
                    title: data.title || autoTitle(data.idea),
                    founder_backstory: data.founder_backstory,
                    industry: data.industry,
                    stage: data.stage
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 402 || err?.code === "plan_limit_reached") {
                    toast.error("Free plan limit reached.", { description: "Upgrade to Pro for unlimited plans." });
                    navigate("/pricing");
                    return;
                }
                throw new Error(err?.detail || "Could not create plan.");
            }
            const plan = await res.json();
            toast.success("Plan created.");
            navigate(`/plans/${plan.id}/define`);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12" data-testid="plan-wizard">
            <div className="w-full max-w-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="label-eyebrow text-brand-bronze">Plan setup · {step + 1} / {slides.length}</div>
                    <div className="text-xs text-muted-foreground">~60 seconds</div>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden mb-10">
                    <div className="h-full bg-brand-gold transition-[width] duration-500" style={{ width: `${((step + 1) / slides.length) * 100}%` }} />
                </div>
                <AnimatePresence mode="wait">
                    <motion.div key={cur.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                        <h1 className="font-serif text-3xl md:text-4xl tracking-[-0.02em]">{cur.label}</h1>
                        {cur.helper && <p className="mt-2 text-muted-foreground text-sm">{cur.helper}</p>}
                        <div className="mt-7">
                            {cur.type === "textarea" && (
                                <Textarea autoFocus value={data[cur.key]} onChange={(e) => setData({ ...data, [cur.key]: e.target.value })} className="min-h-[150px] rounded-xl" placeholder={cur.placeholder} data-testid={`wizard-${cur.key}-input`} />
                            )}
                            {cur.type === "input" && (
                                <Input autoFocus value={data[cur.key]} onChange={(e) => setData({ ...data, [cur.key]: e.target.value })} className="h-12 rounded-xl text-base" placeholder={cur.placeholder} data-testid={`wizard-${cur.key}-input`} />
                            )}
                            {cur.type === "select" && (
                                <Select value={data[cur.key]} onValueChange={(v) => setData({ ...data, [cur.key]: v })}>
                                    <SelectTrigger className="h-12 rounded-xl" data-testid={`wizard-${cur.key}-input`}>
                                        <SelectValue placeholder="Choose one…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cur.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
                <div className="mt-10 flex items-center justify-between">
                    <Button variant="ghost" onClick={step === 0 ? () => navigate("/dashboard") : prev} className="rounded-full" data-testid="wizard-back-button">
                        <ArrowLeft className="h-4 w-4 mr-2" /> {step === 0 ? "Cancel" : "Back"}
                    </Button>
                    {step < slides.length - 1 ? (
                        <Button onClick={next} className="cta-red rounded-full h-11 px-6" data-testid="wizard-next-button">
                            Continue <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={submit} disabled={submitting} className="cta-red rounded-full h-11 px-6" data-testid="wizard-submit-button">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Begin Step 1</>}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function autoTitle(idea) {
    const words = idea.trim().split(/\s+/).slice(0, 6).join(" ");
    return words.charAt(0).toUpperCase() + words.slice(1);
}
