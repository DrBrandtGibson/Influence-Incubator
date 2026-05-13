import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Sparkles, Map, Inbox, Gift, ShieldCheck, MessagesSquare, Check, Loader2,
    ArrowRight, ArrowLeft, ChevronRight
} from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { STEPS } from "@/lib/steps";
import {
    DELIVER_JOURNEY_PROMPTS, DELIVER_QUALITY_PROMPTS, DELIVER_FEEDBACK_PROMPTS,
    DELIVER_INTROS, DELIVER_QUOTE
} from "@/lib/framework";

const STEP_NUM = 7;

const TAB_ORDER = ["journey", "onboarding", "retention", "quality", "feedback", "output"];
const TAB_LABELS = {
    journey:    "Customer Journey",
    onboarding: "Onboarding Sequence",
    retention:  "Surprise & Delight",
    quality:    "Quality Standards",
    feedback:   "Feedback Loop",
    output:     "Your Output"
};

export default function StepDeliver({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("journey");
    const planId = plan.id;
    const goToTab = (key) => { setTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-deliver">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 07 · Pro</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">DELIVER Exceptional Service</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                    The promise becomes real here. Map the journey, design onboarding, codify your surprise-and-delight, set the quality bar, and close the feedback loop.
                </p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["journey",    Map,             "Customer Journey"],
                        ["onboarding", Inbox,           "Onboarding Sequence"],
                        ["retention",  Gift,            "Surprise & Delight"],
                        ["quality",    ShieldCheck,     "Quality Standards"],
                        ["feedback",   MessagesSquare,  "Feedback Loop"],
                        ["output",     Check,           "Your Output"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`deliver-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="journey"><CustomerJourney planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="onboarding"><Onboarding planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="retention"><Retention planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="quality"><Quality planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="feedback"><Feedback planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {tab !== "output" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="deliver-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="deliver-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="deliver-next-button">
                            Next: {TAB_LABELS[nextTab]} <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

function Section({ title, helper, children, eyebrow }) {
    return (
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="editorial-card p-7 md:p-8 mb-6">
            {eyebrow && <div className="label-eyebrow text-brand-bronze mb-2">{eyebrow}</div>}
            <h2 className="font-serif text-2xl md:text-3xl tracking-[-0.02em]">{title}</h2>
            {helper && <p className="mt-2 text-sm text-muted-foreground max-w-3xl">{helper}</p>}
            <div className="gold-divider my-5" />
            {children}
        </motion.section>
    );
}

function persist(planId, fieldKey, value) {
    if (!planId) return;
    authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: fieldKey, value }) }).catch(() => {});
}
function safeParseJSON(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { /* */ }
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* */ } }
    return null;
}

// =================== CUSTOMER JOURNEY ===================
function CustomerJourney({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function buildJourney() {
        const ctx = {
            first_touch: getInput(STEP_NUM, "dj_first_touch") || "",
            decision:    getInput(STEP_NUM, "dj_decision") || "",
            first_24h:   getInput(STEP_NUM, "dj_first_24h") || ""
        };
        if (!ctx.first_touch && !ctx.decision) { toast.error("Sketch at least the first touch or decision moment first."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "journey_json", field_label: "Customer Journey Map",
                extra_context: ctx,
                instructions:
                    "Map a customer journey for this user's business in JSON only.\n" +
                    "Shape: {\"stages\": [{\"name\": \"\", \"customer_does\": \"\", \"customer_feels\": \"\", \"we_do\": \"\", \"risk\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- 6 stages: Awareness → Consideration → Decision → Onboarding → Delivery → Renewal/Referral.\n" +
                    "- Each stage: 'customer_does' = one concrete action; 'customer_feels' = one emotional word/phrase; 'we_do' = one or two specific actions WE take to meet them there; 'risk' = the single biggest risk we lose them at this stage.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "journey_json", t)
            });
        } finally { setBusy(false); }
    }

    const parsed = safeParseJSON(getInput(STEP_NUM, "journey_json"));
    const stages = parsed?.stages || [];

    return (
        <Section eyebrow="Customer Journey" title="Map the river." helper={DELIVER_INTROS.journey}>
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="deliver-quote">
                    “{DELIVER_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {DELIVER_QUOTE.attribution}</figcaption>
            </figure>

            <div className="space-y-5 mt-7">
                {DELIVER_JOURNEY_PROMPTS.map((p) => (
                    <div key={p.key}>
                        <div className="label-eyebrow mb-1">{p.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{p.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key}
                            fieldLabel={p.label} subModule="Customer Journey"
                            rows={3} value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Build</div>
                        <h3 className="font-serif text-2xl">Map my customer journey.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">6 stages from awareness to advocacy — with their actions, feelings, our response, and the risk at each stage.</p>
                    </div>
                    <Button onClick={buildJourney} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="build-journey-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Map my journey</>}
                    </Button>
                </div>

                {stages.length > 0 && (
                    <div className="mt-6 overflow-x-auto" data-testid="journey-output">
                        <table className="min-w-full text-sm bg-brand-cream text-brand-charcoal rounded-xl overflow-hidden">
                            <thead className="bg-brand-charcoal text-brand-cream">
                                <tr className="text-left text-[11px] uppercase tracking-wider">
                                    <th className="py-2 px-3">Stage</th>
                                    <th className="py-2 px-3">Customer does</th>
                                    <th className="py-2 px-3">Customer feels</th>
                                    <th className="py-2 px-3">We do</th>
                                    <th className="py-2 px-3">Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stages.map((s, i) => (
                                    <tr key={i} className="border-b border-brand-bronze/20 align-top" data-testid={`journey-stage-${i}`}>
                                        <td className="py-3 px-3 font-serif text-base">{i + 1}. {s.name}</td>
                                        <td className="py-3 px-3">{s.customer_does}</td>
                                        <td className="py-3 px-3 italic">{s.customer_feels}</td>
                                        <td className="py-3 px-3">{s.we_do}</td>
                                        <td className="py-3 px-3 text-destructive">{s.risk}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== ONBOARDING ===================
function Onboarding({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function buildSequence() {
        const ctx = {
            first_24h: getInput(STEP_NUM, "dj_first_24h") || "",
            decision:  getInput(STEP_NUM, "dj_decision") || ""
        };
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "onboarding_json", field_label: "30-day onboarding sequence",
                extra_context: ctx,
                instructions:
                    "Design a 30-day onboarding sequence for a new customer of this business, returned as JSON only.\n" +
                    "Shape: {\"sequence\": [{\"when\": \"\", \"channel\": \"\", \"action\": \"\", \"purpose\": \"\", \"content_snippet\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- 8 touchpoints across Day 0 (signup), Day 1, Day 3, Day 7, Day 14, Day 21, Day 30, plus one Quick Win moment within the first 72 hours.\n" +
                    "- 'channel' = email / in-app / SMS / phone call / handwritten note / community post / Loom video.\n" +
                    "- 'action' = a one-line description of what we send/do.\n" +
                    "- 'purpose' = the emotional or strategic goal of this touch.\n" +
                    "- 'content_snippet' = a 1–2 sentence example of the actual copy or content.\n" +
                    "- Mix channels intentionally — vary the medium.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "onboarding_json", t)
            });
        } finally { setBusy(false); }
    }

    const parsed = safeParseJSON(getInput(STEP_NUM, "onboarding_json"));
    const seq = parsed?.sequence || [];

    return (
        <Section eyebrow="Onboarding" title="The first 30 days." helper={DELIVER_INTROS.onboarding}>
            <div className="dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Generate</div>
                        <h3 className="font-serif text-2xl">Design my 30-day onboarding.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">8 touchpoints across email, SMS, calls, community — each with purpose and copy.</p>
                    </div>
                    <Button onClick={buildSequence} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="build-onboarding-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Build sequence</>}
                    </Button>
                </div>

                {seq.length > 0 && (
                    <div className="mt-6 space-y-3" data-testid="onboarding-output">
                        {seq.map((s, i) => (
                            <div key={i} className="rounded-xl bg-brand-cream text-brand-charcoal p-4" data-testid={`onboarding-step-${i}`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-serif text-brand-bronze">{s.when}</div>
                                        <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-bronze/15">{s.channel}</span>
                                    </div>
                                </div>
                                <div className="font-serif text-base">{s.action}</div>
                                {s.purpose && <p className="text-xs italic text-brand-charcoal/70 mt-1">{s.purpose}</p>}
                                {s.content_snippet && <p className="text-sm mt-2 leading-relaxed bg-brand-cream/60 p-2 rounded-md border-l-2 border-brand-bronze/40">{s.content_snippet}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== RETENTION ===================
function Retention({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function buildPlaybook() {
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "retention_json", field_label: "Surprise & Delight Playbook",
                extra_context: {},
                instructions:
                    "Generate a Surprise-and-Delight Playbook of 8 specific gestures, returned as JSON only.\n" +
                    "Shape: {\"plays\": [{\"trigger\": \"\", \"gesture\": \"\", \"cost\": \"\", \"impact\": \"\", \"who_owns\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- 'trigger' = the moment that fires the play (e.g. '30 days in', 'after first big win', 'birthday', 'their book launches').\n" +
                    "- 'gesture' = the specific concrete action (handwritten card, voice memo, surprise upgrade, gift box, intro to another member).\n" +
                    "- 'cost' = realistic dollar range per occurrence.\n" +
                    "- 'impact' = short phrase on what it unlocks (referrals, lifetime extension, viral testimonial, etc).\n" +
                    "- 'who_owns' = role/person responsible.\n" +
                    "- Mix low-cost personal gestures with 1–2 higher-investment moments.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "retention_json", t)
            });
        } finally { setBusy(false); }
    }

    const parsed = safeParseJSON(getInput(STEP_NUM, "retention_json"));
    const plays = parsed?.plays || [];

    return (
        <Section eyebrow="Surprise & Delight" title="The cheapest marketing you have." helper={DELIVER_INTROS.retention}>
            <div className="dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Generate</div>
                        <h3 className="font-serif text-2xl">Build my Surprise-and-Delight Playbook.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">8 trigger-based plays with cost, impact, and ownership.</p>
                    </div>
                    <Button onClick={buildPlaybook} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="build-retention-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Build playbook</>}
                    </Button>
                </div>

                {plays.length > 0 && (
                    <div className="mt-6 overflow-x-auto" data-testid="retention-output">
                        <table className="min-w-full text-sm bg-brand-cream text-brand-charcoal rounded-xl overflow-hidden">
                            <thead className="bg-brand-charcoal text-brand-cream">
                                <tr className="text-left text-[11px] uppercase tracking-wider">
                                    <th className="py-2 px-3">Trigger</th>
                                    <th className="py-2 px-3">Gesture</th>
                                    <th className="py-2 px-3">Cost</th>
                                    <th className="py-2 px-3">Impact</th>
                                    <th className="py-2 px-3">Owner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plays.map((p, i) => (
                                    <tr key={i} className="border-b border-brand-bronze/20 align-top" data-testid={`retention-play-${i}`}>
                                        <td className="py-3 px-3 font-medium">{p.trigger}</td>
                                        <td className="py-3 px-3">{p.gesture}</td>
                                        <td className="py-3 px-3 text-brand-bronze">{p.cost}</td>
                                        <td className="py-3 px-3 italic">{p.impact}</td>
                                        <td className="py-3 px-3">{p.who_owns}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== QUALITY ===================
function Quality({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Quality Standards" title="Set the bar." helper={DELIVER_INTROS.quality}>
            <div className="space-y-6">
                {DELIVER_QUALITY_PROMPTS.map((p) => (
                    <div key={p.key}>
                        <div className="label-eyebrow mb-1">{p.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{p.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key}
                            fieldLabel={p.label} subModule="Quality Standards"
                            rows={4} value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

// =================== FEEDBACK ===================
function Feedback({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Feedback Loop" title="Close the loop." helper={DELIVER_INTROS.feedback}>
            <div className="space-y-6">
                {DELIVER_FEEDBACK_PROMPTS.map((p) => (
                    <div key={p.key}>
                        <div className="label-eyebrow mb-1">{p.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{p.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key}
                            fieldLabel={p.label} subModule="Feedback Loop"
                            rows={3} value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

// =================== OUTPUT ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const [marking, setMarking] = useState(false);

    const journey = safeParseJSON(getInput(STEP_NUM, "journey_json"));
    const stages = journey?.stages || [];
    const onboarding = safeParseJSON(getInput(STEP_NUM, "onboarding_json"));
    const seq = onboarding?.sequence || [];
    const retention = safeParseJSON(getInput(STEP_NUM, "retention_json"));
    const plays = retention?.plays || [];
    const responseSla = getInput(STEP_NUM, "dq_response_sla");
    const nps = getInput(STEP_NUM, "df_nps_cadence");

    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(STEP_NUM, "complete");
            toast.success("Step 7 marked complete. The Formula is yours.");
        } finally { setMarking(false); }
    }

    return (
        <Section eyebrow="Your Output" title="DELIVER Card" helper="The final card. Edit anything by jumping back. When you're satisfied, mark the step complete to finish your 7-Step plan.">
            <div className="editorial-card p-7 md:p-8" data-testid="step7-output-card">
                <Stat label="Journey stages mapped" value={`${stages.length}`} testId="output-journey-count" />
                <Stat label="Onboarding touchpoints" value={`${seq.length}`} testId="output-onboarding-count" />
                <Stat label="Surprise & delight plays" value={`${plays.length}`} testId="output-retention-count" />

                {responseSla && (
                    <div className="py-3 border-t border-border/50">
                        <div className="label-eyebrow text-brand-bronze mb-1">Response SLA</div>
                        <div className="text-sm whitespace-pre-wrap">{responseSla}</div>
                    </div>
                )}
                {nps && (
                    <div className="py-3 border-t border-border/50">
                        <div className="label-eyebrow text-brand-bronze mb-1">NPS / Pulse Cadence</div>
                        <div className="text-sm whitespace-pre-wrap">{nps}</div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={complete} disabled={marking} className="cta-red rounded-full h-11 px-6" data-testid="complete-step7-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 7 — Finish my Plan <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
            </div>
        </Section>
    );
}

function Stat({ label, value, testId }) {
    return (
        <div className="py-3 border-t border-border/50 first:border-t-0 flex items-baseline justify-between" data-testid={testId}>
            <div className="label-eyebrow text-brand-bronze">{label}</div>
            <div className="font-serif text-2xl">{value}</div>
        </div>
    );
}

// Helper: streaming generate
async function streamingGenerate({ field_key, field_label, instructions, planId, stepNum, mode = "generate", extra_context, onText, persist: shouldPersist = true }) {
    try {
        const url = `/ai/${mode === "synthesize" ? "synthesize" : "generate"}`;
        const res = await authedFetch(url, {
            method: "POST",
            body: JSON.stringify({ plan_id: planId, step_num: stepNum, field_key, field_label, instructions, extra_context })
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.detail?.message || j?.detail || "AI request failed");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = ""; let acc = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buffer.indexOf("\n\n")) !== -1) {
                const evt = buffer.slice(0, idx); buffer = buffer.slice(idx + 2);
                const lines = evt.split("\n"); let event = "message"; let dataStr = "";
                for (const ln of lines) {
                    if (ln.startsWith("event:")) event = ln.slice(6).trim();
                    else if (ln.startsWith("data:")) dataStr += ln.slice(5).trim();
                }
                if (!dataStr) continue;
                let payload = {}; try { payload = JSON.parse(dataStr); } catch { /* */ }
                if (event === "chunk" && payload.text) { acc += payload.text; onText && onText(acc); }
                else if (event === "done") { acc = payload.text || acc; onText && onText(acc); }
                else if (event === "error") { throw new Error(payload.error || "Generation error"); }
            }
        }
        if (shouldPersist && planId && acc) {
            authedFetch(`/plans/${planId}/inputs`, {
                method: "POST", keepalive: true,
                body: JSON.stringify({ step_num: stepNum, field_key, value: acc })
            }).catch(() => { /* */ });
        }
        return acc;
    } catch (e) { toast.error(e.message || "AI failed"); }
}
