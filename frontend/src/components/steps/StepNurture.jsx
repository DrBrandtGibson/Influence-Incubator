import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sparkles, Layers, Repeat, Cpu, Users, Check, Loader2,
    ArrowRight, ArrowLeft, ChevronRight, Plus, Trash2
} from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { STEPS } from "@/lib/steps";
import {
    FRAMEWORK_SEED_QUESTIONS, CONTINUITY_PROMPTS, SAAS_INPUT_PROMPTS,
    COMMUNITY_INPUT_PROMPTS, NURTURE_INTROS, NURTURE_QUOTE
} from "@/lib/framework";

const STEP_NUM = 5;

const TAB_ORDER = ["framework", "continuity", "saas", "community", "output"];
const TAB_LABELS = {
    framework:  "Transformative Framework",
    continuity: "Continuity Program",
    saas:       "SaaS Opportunity",
    community:  "Community Design",
    output:     "Your Output"
};

export default function StepNurture({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("framework");
    const planId = plan.id;
    const goToTab = (key) => { setTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-nurture">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 05 · Pro</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">NURTURE The Transformation</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                    Name your method. Design your continuity. Spot the SaaS hidden inside your process. Build the community that multiplies it all.
                </p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["framework",  Layers, "Transformative Framework"],
                        ["continuity", Repeat, "Continuity Program"],
                        ["saas",       Cpu,    "SaaS Opportunity"],
                        ["community",  Users,  "Community Design"],
                        ["output",     Check,  "Your Output"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`nurture-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="framework"><TransformativeFramework planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="continuity"><Continuity planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="saas"><SaasOpportunity planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="community"><CommunityDesign planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {tab !== "output" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="nurture-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="nurture-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="nurture-next-button">
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

// =================== TRANSFORMATIVE FRAMEWORK ===================
function TransformativeFramework({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function buildFramework() {
        const ctx = {
            framework_who:  getInput(STEP_NUM, "fw_who") || "",
            framework_from: getInput(STEP_NUM, "fw_from") || "",
            framework_to:   getInput(STEP_NUM, "fw_to") || "",
            phases_n:       getInput(STEP_NUM, "fw_phases_n") || "5"
        };
        if (!ctx.framework_from && !ctx.framework_to) { toast.error("Sketch the starting and ending state first."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "framework_json", field_label: "Transformative Framework",
                extra_context: ctx,
                instructions:
                    "Design a signature, named Transformative Framework for this user, returned as JSON only (no markdown).\n" +
                    "Shape: {\"name\": \"\", \"tagline\": \"\", \"phases\": [{\"verb\": \"\", \"name\": \"\", \"transformation\": \"\", \"description\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- The framework name should be short (1–4 words), ownable, and evocative — not generic. Try alliteration or a 'The ___ Method' construction.\n" +
                    "- 'tagline' = a single 8–14 word promise.\n" +
                    "- Phase count = the number the user requested (default 5; clamp to 3–7).\n" +
                    "- Each phase: verb = a single imperative verb (UPPERCASE), name = 1–2 words, transformation = a short 'from X to Y' line, description = one sentence of what happens.\n" +
                    "- The phase order must form a journey from the starting state to the ending state.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "framework_json", t)
            });
        } finally { setBusy(false); }
    }

    const parsed = safeParseJSON(getInput(STEP_NUM, "framework_json"));
    const phases = parsed?.phases || [];

    return (
        <Section eyebrow="Transformative Framework" title="Name your method." helper={NURTURE_INTROS.framework}>
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="nurture-quote">
                    “{NURTURE_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {NURTURE_QUOTE.attribution}</figcaption>
            </figure>

            <div className="space-y-6 mt-7">
                {FRAMEWORK_SEED_QUESTIONS.map((q) => (
                    <div key={q.key}>
                        <div className="label-eyebrow mb-1">{q.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{q.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={q.key}
                            fieldLabel={q.label} subModule="Transformative Framework"
                            rows={q.key === "fw_phases_n" ? 1 : 3}
                            placeholder={q.key === "fw_phases_n" ? "e.g. 5" : ""}
                            value={getInput(STEP_NUM, q.key)} onChange={(v) => setInput(STEP_NUM, q.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Build</div>
                        <h3 className="font-serif text-2xl">Build my Transformative Framework.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">AI will name it, tagline it, and propose your phases. Always editable.</p>
                    </div>
                    <Button onClick={buildFramework} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="build-framework-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Build my Framework</>}
                    </Button>
                </div>

                {parsed && (
                    <div className="mt-6 border-t border-white/10 pt-5" data-testid="framework-output">
                        <div className="rounded-xl bg-brand-cream text-brand-charcoal p-5 md:p-6">
                            <FrameworkDisplay
                                parsed={parsed}
                                phases={phases}
                                onChange={(next) => {
                                    const json = JSON.stringify(next);
                                    setInput(STEP_NUM, "framework_json", json);
                                    persist(planId, "framework_json", json);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </Section>
    );
}

function FrameworkDisplay({ parsed, phases, onChange }) {
    function updateField(key, val) { onChange({ ...parsed, [key]: val }); }
    function updatePhase(i, key, val) {
        const next = phases.map((p, j) => j === i ? { ...p, [key]: val } : p);
        onChange({ ...parsed, phases: next });
    }
    function addPhase() { onChange({ ...parsed, phases: [...phases, { verb: "", name: "", transformation: "", description: "" }] }); }
    function removePhase(i) { onChange({ ...parsed, phases: phases.filter((_, j) => j !== i) }); }

    return (
        <div className="space-y-5">
            <div>
                <div className="label-eyebrow text-brand-bronze mb-1">Framework Name</div>
                <Input value={parsed.name || ""} onChange={(e) => updateField("name", e.target.value)} className="h-11 rounded-xl font-serif text-xl" data-testid="framework-name" />
            </div>
            <div>
                <div className="label-eyebrow text-brand-bronze mb-1">Tagline</div>
                <Input value={parsed.tagline || ""} onChange={(e) => updateField("tagline", e.target.value)} className="h-10 rounded-xl italic" data-testid="framework-tagline" />
            </div>
            <div className="pt-2">
                <div className="label-eyebrow text-brand-bronze mb-2">Phases ({phases.length})</div>
                <div className="space-y-3" data-testid="framework-phases">
                    {phases.map((p, i) => (
                        <div key={i} className="rounded-xl border-2 border-brand-bronze/30 p-4 bg-brand-cream/50" data-testid={`framework-phase-${i}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-8 w-8 rounded-full bg-brand-bronze/20 text-brand-bronze grid place-items-center font-serif text-sm shrink-0">{i + 1}</div>
                                <Input value={p.verb || ""} onChange={(e) => updatePhase(i, "verb", e.target.value.toUpperCase())} placeholder="VERB" className="h-9 rounded-lg font-serif uppercase max-w-[7rem] tracking-wider" data-testid={`framework-phase-${i}-verb`} />
                                <Input value={p.name || ""} onChange={(e) => updatePhase(i, "name", e.target.value)} placeholder="Phase name" className="h-9 rounded-lg flex-1 font-serif" data-testid={`framework-phase-${i}-name`} />
                                <button onClick={() => removePhase(i)} disabled={phases.length <= 1} className="text-brand-charcoal/60 hover:text-destructive disabled:opacity-30 p-1.5" aria-label="Remove phase" data-testid={`framework-phase-${i}-remove`}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <Input value={p.transformation || ""} onChange={(e) => updatePhase(i, "transformation", e.target.value)} placeholder="From X to Y" className="h-9 rounded-lg italic mb-2" data-testid={`framework-phase-${i}-transformation`} />
                            <Input value={p.description || ""} onChange={(e) => updatePhase(i, "description", e.target.value)} placeholder="What happens in this phase (one sentence)" className="h-9 rounded-lg" data-testid={`framework-phase-${i}-description`} />
                        </div>
                    ))}
                </div>
                <Button variant="outline" size="sm" onClick={addPhase} className="rounded-full mt-3" data-testid="framework-add-phase">
                    <Plus className="h-4 w-4 mr-1" /> Add phase
                </Button>
            </div>
        </div>
    );
}

// =================== CONTINUITY PROGRAM ===================
function Continuity({ planId, getInput, setInput }) {
    const [namesBusy, setNamesBusy] = useState(false);

    async function suggestNames() {
        const transformation = getInput(STEP_NUM, "fw_to") || "";
        const framework = (() => { const p = safeParseJSON(getInput(STEP_NUM, "framework_json")); return p?.name || ""; })();
        setNamesBusy(true);
        try {
            await streamingGenerate({
                field_key: "cp_name_suggestions", field_label: "Continuity name suggestions",
                extra_context: { framework, transformation, monthly: getInput(STEP_NUM, "cp_what_monthly") || "" },
                instructions:
                    "Generate 5 distinct membership/continuity program name candidates for this brand. " +
                    "Each name should be 1–4 words, evocative, and ownable. Return as a simple numbered list:\n" +
                    "1. NAME — short hook (5–10 words)\n2. NAME — short hook\n... " +
                    "No preamble.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, "cp_name_suggestions", t)
            });
        } finally { setNamesBusy(false); }
    }

    return (
        <Section eyebrow="Continuity Program" title="Design the gravity." helper={NURTURE_INTROS.continuity}>
            <div className="space-y-6">
                {CONTINUITY_PROMPTS.map((p) => {
                    const isName = p.key === "cp_name";
                    return (
                        <div key={p.key}>
                            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                <div className="label-eyebrow">{p.label}</div>
                                {isName && (
                                    <Button onClick={suggestNames} disabled={namesBusy} variant="outline" size="sm" className="rounded-full" data-testid="cp-suggest-names">
                                        {namesBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1.5" /> Suggest names</>}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1.5">{p.helper}</p>
                            <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key}
                                fieldLabel={p.label} subModule="Continuity Program"
                                rows={p.key === "cp_churn_rituals" || p.key === "cp_what_monthly" ? 4 : 2}
                                value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                        </div>
                    );
                })}

                {getInput(STEP_NUM, "cp_name_suggestions") && (
                    <div className="editorial-card p-4 bg-secondary/40">
                        <div className="label-eyebrow text-brand-bronze mb-2">Name suggestions</div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="cp-name-suggestions">{getInput(STEP_NUM, "cp_name_suggestions")}</div>
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== SAAS OPPORTUNITY ===================
function SaasOpportunity({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function recommend() {
        const ctx = {
            framework: (() => { const p = safeParseJSON(getInput(STEP_NUM, "framework_json")); return p?.name || ""; })(),
            transformation: getInput(STEP_NUM, "fw_to") || "",
            painful_step:        getInput(STEP_NUM, "saas_painful_step") || "",
            who_loses_sleep:     getInput(STEP_NUM, "saas_who_loses_sleep") || "",
            current_workaround:  getInput(STEP_NUM, "saas_current_workaround") || ""
        };
        if (!ctx.painful_step && !ctx.who_loses_sleep) { toast.error("Sketch the painful manual step and who suffers from it first."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "saas_options_json", field_label: "SaaS Opportunity options",
                extra_context: ctx,
                instructions:
                    "Recommend 1–3 SaaS product opportunities for this user, returned as JSON only (no markdown).\n" +
                    "Shape: {\"options\": [{\"name\": \"\", \"problem\": \"\", \"mvp_features\": [\"\", ...], \"pricing\": [{\"tier\": \"Starter\", \"price\": \"\", \"includes\": \"\"}, {\"tier\": \"Pro\", \"price\": \"\", \"includes\": \"\"}, {\"tier\": \"Premium\", \"price\": \"\", \"includes\": \"\"}], \"gtm\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- Each option must collapse the painful manual step into a software workflow.\n" +
                    "- Name is short (1–3 words), evocative, and ownable. Avoid generic '.io' clones.\n" +
                    "- 'problem' = a one-line statement of the pain it removes.\n" +
                    "- 'mvp_features' = 5–8 concrete features. No generic 'dashboard'/'analytics'. Be specific.\n" +
                    "- 3 pricing tiers (Starter / Pro / Premium) with realistic monthly prices and 1-line 'includes' string each.\n" +
                    "- 'gtm' = a 1–2 sentence go-to-market angle (who you target first, channel, hook).\n" +
                    "- NO references to specific coding stacks or tech.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "saas_options_json", t)
            });
        } finally { setBusy(false); }
    }

    const parsed = safeParseJSON(getInput(STEP_NUM, "saas_options_json"));
    const options = parsed?.options || [];

    return (
        <Section eyebrow="SaaS Opportunity" title="Productize your method." helper={NURTURE_INTROS.saas}>
            <div className="space-y-6">
                {SAAS_INPUT_PROMPTS.map((p) => (
                    <div key={p.key}>
                        <div className="label-eyebrow mb-1">{p.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{p.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key}
                            fieldLabel={p.label} subModule="SaaS Opportunity"
                            rows={3}
                            value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Recommend</div>
                        <h3 className="font-serif text-2xl">Recommend 1–3 SaaS products from my method.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">Each with MVP features, a 3-tier pricing sketch, and a go-to-market angle.</p>
                    </div>
                    <Button onClick={recommend} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="recommend-saas-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Recommend SaaS options</>}
                    </Button>
                </div>

                {options.length > 0 && (
                    <div className="mt-6 space-y-5" data-testid="saas-options">
                        {options.map((o, i) => (
                            <div key={i} className="rounded-xl bg-brand-cream text-brand-charcoal p-5" data-testid={`saas-option-${i}`}>
                                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                                    <div className="font-serif text-2xl">{o.name || `Option ${i + 1}`}</div>
                                    <span className="text-xs uppercase tracking-wider text-brand-bronze">Option {i + 1}</span>
                                </div>
                                {o.problem && <p className="italic text-brand-charcoal/80 mb-3">“{o.problem}”</p>}
                                {Array.isArray(o.mvp_features) && o.mvp_features.length > 0 && (
                                    <div className="mb-3">
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">MVP Features</div>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            {o.mvp_features.map((f, j) => (
                                                <li key={j} className="flex gap-2"><span className="text-brand-bronze">·</span><span>{f}</span></li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {Array.isArray(o.pricing) && o.pricing.length > 0 && (
                                    <div className="mb-3">
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Pricing</div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {o.pricing.map((t, j) => (
                                                <div key={j} className="rounded-lg border border-brand-bronze/30 p-3" data-testid={`saas-option-${i}-tier-${j}`}>
                                                    <div className="font-serif text-base">{t.tier || `Tier ${j + 1}`}</div>
                                                    <div className="text-brand-bronze font-serif text-xl">{t.price || "—"}</div>
                                                    {t.includes && <div className="text-[11px] text-brand-charcoal/70 mt-1 leading-snug">{t.includes}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {o.gtm && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1">Go-to-Market</div>
                                        <p className="text-sm leading-relaxed">{o.gtm}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== COMMUNITY DESIGN ===================
function CommunityDesign({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function recommend() {
        const ctx = {
            framework:    (() => { const p = safeParseJSON(getInput(STEP_NUM, "framework_json")); return p?.name || ""; })(),
            transformation: getInput(STEP_NUM, "fw_to") || "",
            continuity_name: getInput(STEP_NUM, "cp_name") || "",
            identity: getInput(STEP_NUM, "com_identity") || "",
            problem:  getInput(STEP_NUM, "com_problem") || "",
            success:  getInput(STEP_NUM, "com_success") || ""
        };
        if (!ctx.identity && !ctx.problem) { toast.error("Sketch the shared identity and the problem first."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "community_json", field_label: "Community Design",
                extra_context: ctx,
                instructions:
                    "Design a community for this user, anchored in the ClickFunnels Communities structure (Rooms, Posts, Events, Courses, Leaderboards). Return JSON only.\n" +
                    "Shape: {\"name\": \"\", \"member_archetype\": \"\", \"rooms\": [\"\", ...], \"weekly_rituals\": [\"\", ...], \"monthly_rituals\": [\"\", ...], \"content_cadence\": \"\", \"moderator_model\": \"\", \"launch_play\": \"\"}\n" +
                    "Rules:\n" +
                    "- 'name' = 1–3 words, ownable, evocative.\n" +
                    "- 'member_archetype' = one vivid sentence describing the ideal member.\n" +
                    "- 'rooms' = 4–7 ClickFunnels-style room names (e.g. 'The Lounge', 'Wins of the Week', 'Office Hours', etc).\n" +
                    "- 'weekly_rituals' = 3–5 concrete weekly recurring practices (specific day/time templates fine).\n" +
                    "- 'monthly_rituals' = 2–4 monthly events (call, challenge, ceremony).\n" +
                    "- 'content_cadence' = one paragraph describing the rhythm of content drops, member posts, and host appearances.\n" +
                    "- 'moderator_model' = one paragraph on who moderates (you, co-leaders, member ambassadors).\n" +
                    "- 'launch_play' = one paragraph on how to seed the first 50–100 members.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "community_json", t)
            });
        } finally { setBusy(false); }
    }

    const parsed = safeParseJSON(getInput(STEP_NUM, "community_json"));

    return (
        <Section eyebrow="Community Design" title="Design the gathering." helper={NURTURE_INTROS.community}>
            <div className="space-y-6">
                {COMMUNITY_INPUT_PROMPTS.map((p) => (
                    <div key={p.key}>
                        <div className="label-eyebrow mb-1">{p.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{p.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key}
                            fieldLabel={p.label} subModule="Community Design"
                            rows={3}
                            value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Recommend</div>
                        <h3 className="font-serif text-2xl">Design my Community (ClickFunnels-style).</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">Name, rooms, rituals, cadence, moderator model, and a launch play to seed your first 100 members.</p>
                    </div>
                    <Button onClick={recommend} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="recommend-community-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Design my Community</>}
                    </Button>
                </div>

                {parsed && (
                    <div className="mt-6 rounded-xl bg-brand-cream text-brand-charcoal p-5 md:p-6" data-testid="community-output">
                        <div className="font-serif text-3xl mb-1">{parsed.name || "—"}</div>
                        {parsed.member_archetype && <p className="italic text-brand-charcoal/80 mb-4">{parsed.member_archetype}</p>}
                        {Array.isArray(parsed.rooms) && parsed.rooms.length > 0 && (
                            <div className="mb-4">
                                <div className="label-eyebrow text-brand-bronze mb-1.5">Rooms</div>
                                <div className="flex flex-wrap gap-2">{parsed.rooms.map((r, i) => <span key={i} className="px-3 py-1 rounded-full bg-brand-bronze/15 text-brand-charcoal text-sm">{r}</span>)}</div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                            {Array.isArray(parsed.weekly_rituals) && parsed.weekly_rituals.length > 0 && (
                                <div>
                                    <div className="label-eyebrow text-brand-bronze mb-1.5">Weekly Rituals</div>
                                    <ul className="text-sm space-y-1">{parsed.weekly_rituals.map((r, i) => <li key={i} className="flex gap-2"><span className="text-brand-bronze">·</span><span>{r}</span></li>)}</ul>
                                </div>
                            )}
                            {Array.isArray(parsed.monthly_rituals) && parsed.monthly_rituals.length > 0 && (
                                <div>
                                    <div className="label-eyebrow text-brand-bronze mb-1.5">Monthly Rituals</div>
                                    <ul className="text-sm space-y-1">{parsed.monthly_rituals.map((r, i) => <li key={i} className="flex gap-2"><span className="text-brand-bronze">·</span><span>{r}</span></li>)}</ul>
                                </div>
                            )}
                        </div>
                        {parsed.content_cadence && <DetailBlock label="Content Cadence" value={parsed.content_cadence} />}
                        {parsed.moderator_model && <DetailBlock label="Moderator Model" value={parsed.moderator_model} />}
                        {parsed.launch_play && <DetailBlock label="Launch Play (First 100)" value={parsed.launch_play} />}
                    </div>
                )}
            </div>
        </Section>
    );
}

function DetailBlock({ label, value }) {
    return (
        <div className="mt-3 pt-3 border-t border-brand-bronze/20">
            <div className="label-eyebrow text-brand-bronze mb-1">{label}</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{value}</div>
        </div>
    );
}

// =================== OUTPUT ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const [marking, setMarking] = useState(false);

    const framework = safeParseJSON(getInput(STEP_NUM, "framework_json"));
    const phases = framework?.phases || [];
    const cpName = getInput(STEP_NUM, "cp_name");
    const cpMonthly = getInput(STEP_NUM, "cp_what_monthly");
    const cpPrice = getInput(STEP_NUM, "cp_price");
    const saas = safeParseJSON(getInput(STEP_NUM, "saas_options_json"));
    const saasOptions = saas?.options || [];
    const community = safeParseJSON(getInput(STEP_NUM, "community_json"));

    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(STEP_NUM, "complete");
            toast.success("Step 5 marked complete.");
            const next = STEPS.find((s) => s.num === 6);
            gotoStep(next);
        } finally { setMarking(false); }
    }

    return (
        <Section eyebrow="Your Output" title="NURTURE Card" helper="Edit anything by jumping back to the relevant tab.">
            <div className="editorial-card p-7 md:p-8" data-testid="step5-output-card">
                {/* Framework */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-1">Transformative Framework</div>
                    <div className="font-serif text-2xl">{framework?.name || "—"}</div>
                    {framework?.tagline && <div className="italic text-muted-foreground">{framework.tagline}</div>}
                    {phases.length > 0 && (
                        <ol className="mt-3 space-y-1.5 text-sm" data-testid="output-framework-phases">
                            {phases.map((p, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="font-serif text-brand-bronze min-w-[1.5rem]">{i + 1}.</span>
                                    <span><span className="font-serif uppercase tracking-wider text-brand-bronze">{p.verb}</span> {p.name && <span className="font-serif">{p.name}</span>}{p.transformation && <> — <span className="italic text-muted-foreground">{p.transformation}</span></>}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* Continuity */}
                <div className="py-3 border-t border-border/50">
                    <div className="label-eyebrow text-brand-bronze mb-1">Continuity Program</div>
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <div className="font-serif text-xl">{cpName || "—"}</div>
                        {cpPrice && <div className="text-brand-bronze font-serif">{cpPrice}</div>}
                    </div>
                    {cpMonthly && <p className="text-sm whitespace-pre-wrap text-muted-foreground mt-1">{cpMonthly}</p>}
                </div>

                {/* SaaS */}
                <div className="py-3 border-t border-border/50">
                    <div className="label-eyebrow text-brand-bronze mb-2">SaaS Opportunities</div>
                    {saasOptions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-testid="output-saas-list">
                            {saasOptions.map((o, i) => (
                                <div key={i} className="editorial-card p-3 bg-secondary/30">
                                    <div className="font-serif text-lg">{o.name || `Option ${i + 1}`}</div>
                                    {o.problem && <p className="text-xs italic text-muted-foreground mt-1 leading-snug">“{o.problem}”</p>}
                                    {Array.isArray(o.pricing) && o.pricing.length > 0 && (
                                        <div className="text-xs text-brand-bronze mt-2">{o.pricing.map((t) => t.price).filter(Boolean).join(" · ")}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>

                {/* Community */}
                <div className="py-3 border-t border-border/50">
                    <div className="label-eyebrow text-brand-bronze mb-1">Community</div>
                    <div className="font-serif text-xl">{community?.name || "—"}</div>
                    {community?.member_archetype && <p className="italic text-muted-foreground text-sm mt-1">{community.member_archetype}</p>}
                    {Array.isArray(community?.rooms) && community.rooms.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2" data-testid="output-community-rooms">
                            {community.rooms.map((r, i) => <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30">{r}</span>)}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={complete} disabled={marking} className="cta-red rounded-full h-11 px-6" data-testid="complete-step5-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 5 → Begin Step 6 <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
            </div>
        </Section>
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
                let payload = {}; try { payload = JSON.parse(dataStr); } catch { /* ignore */ }
                if (event === "chunk" && payload.text) { acc += payload.text; onText && onText(acc); }
                else if (event === "done") { acc = payload.text || acc; onText && onText(acc); }
                else if (event === "error") { throw new Error(payload.error || "Generation error"); }
            }
        }
        if (shouldPersist && planId && acc) {
            authedFetch(`/plans/${planId}/inputs`, {
                method: "POST", keepalive: true,
                body: JSON.stringify({ step_num: stepNum, field_key, value: acc })
            }).catch(() => { /* swallow */ });
        }
        return acc;
    } catch (e) { toast.error(e.message || "AI failed"); }
}
