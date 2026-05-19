import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2, Compass, Target, Heart, Loader2, Check, Image as ImgIcon, BookOpen, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import {
    DRIVEN_QUESTIONS, MTP_CATEGORIES, SEVEN_LEVELS_DEEP,
    CHIEF_AIM_PROMPTS, CHIEF_AIM_HORIZONS, CHIEF_AIM_QUOTE, BUSINESS_STRUCTURES,
    FINDING_PURPOSE_QUESTIONS, FINDING_PURPOSE_PRIORITIES, NAPOLEON_HILL_LEARN_MORE,
    BECOME_DRIVEN_QUOTE, BECOME_DRIVEN_LEARN_MORE,
    MTP_CHURCHILL_QUOTE, MTP_LEARN_MORE, MTP_KEY_ASPECTS, MTP_EXAMPLES
} from "@/lib/framework";
import { STEPS } from "@/lib/steps";
import { motion } from "framer-motion";
import { SortableRanking } from "@/components/ui/SortableRanking";
import { InfoDialog } from "@/components/ui/InfoDialog";
import { Dialog as RawDialog, DialogContent as RawDialogContent, DialogHeader as RawDialogHeader, DialogTitle as RawDialogTitle, DialogTrigger as RawDialogTrigger } from "@/components/ui/dialog";

const TAB_ORDER = ["identity", "purpose", "driven", "mtp", "why", "chief", "output"];
const TAB_LABELS = {
    identity: "Identity",
    purpose: "Finding Your Purpose",
    driven: "Become Driven",
    mtp: "MTP Discovery",
    why: "7 Levels Deep WHY",
    chief: "Chief Aim",
    output: "Your Output"
};

export default function StepDefine({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("identity");
    const planId = plan.id;

    const goToTab = (key) => {
        setTab(key);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-define">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 01 · Free</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">DEFINE Your Purpose</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">Mission, Massive Transformative Purpose, Deep WHY, Definite Chief Aim. The foundation everything else stands on.</p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["identity", Building2, "Identity"],
                        ["purpose", BookOpen, "Finding Your Purpose"],
                        ["driven", Compass, "Become Driven"],
                        ["mtp", Sparkles, "MTP Discovery"],
                        ["why", Heart, "7 Levels Deep WHY"],
                        ["chief", Target, "Chief Aim"],
                        ["output", Check, "Your Output"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`define-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="identity"><BusinessIdentity planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="purpose"><FindingPurpose planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="driven"><BecomeDriven planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="mtp"><MTPSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="why"><DeepWhySection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="chief"><ChiefAimSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {/* Section nav: Prev / Next within Step 1 */}
            {tab !== "output" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="define-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="define-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="define-next-button">
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
            {helper && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{helper}</p>}
            <div className="gold-divider my-5" />
            {children}
        </motion.section>
    );
}

// =================== IDENTITY ===================
function BusinessIdentity({ planId, getInput, setInput }) {
    const [genBusy, setGenBusy] = useState(false);
    const [logoBusy, setLogoBusy] = useState(false);
    const [structBusy, setStructBusy] = useState(false);
    const chosenStructure = getInput(1, "structure_chosen");

    function pickStructure(key) {
        setInput(1, "structure_chosen", key);
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: 1, field_key: "structure_chosen", value: key }) });
    }

    async function generateNames() {
        setGenBusy(true);
        try {
            await streamingGenerate({
                field_key: "business_names",
                field_label: "Business name brainstorm",
                instructions: "Generate exactly 5 distinct business name candidates. For each: 1) the name, 2) a one-line rationale, 3) memorability score (1-10), 4) a 1-line domain hint. Numbered list. Be original and specific to this user's plan context.",
                planId, stepNum: 1,
                onText: (t) => setInput(1, "business_names", t)
            });
        } finally { setGenBusy(false); }
    }

    async function generateLogoPrompts() {
        setLogoBusy(true);
        try {
            await streamingGenerate({
                field_key: "logo_prompts",
                field_label: "Logo prompts (Midjourney/DALL·E)",
                instructions: "Generate exactly 5 detailed image-generation prompts (for Midjourney/DALL·E) for the logo. Vivid, technically specific. Numbered list.",
                planId, stepNum: 1,
                onText: (t) => setInput(1, "logo_prompts", t)
            });
        } finally { setLogoBusy(false); }
    }

    async function suggestStructure() {
        setStructBusy(true);
        try {
            await streamingGenerate({
                field_key: "structure_recommendation",
                field_label: "Recommended business structure",
                instructions: "Recommend the best business structure (Sole Prop / LLC / S-Corp / Non-Profit) for this user. Provide: 1) recommended structure, 2) reasoning grounded in their stage and likely revenue, 3) EIN guidance (1-2 sentences), 4) state-registration link suggestion. Be concrete and brief.",
                planId, stepNum: 1,
                onText: (t) => setInput(1, "structure_recommendation", t)
            });
        } finally { setStructBusy(false); }
    }

    async function uploadLogo(file) {
        if (!file) return;
        setLogoBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await authedFetch(`/uploads/logo?plan_id=${encodeURIComponent(planId)}`, { method: "POST", body: fd });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.detail || `Upload failed (HTTP ${res.status})`);
            }
            const data = await res.json();
            setInput(1, "logo_url", data.url);
            toast.success("Logo uploaded.");
        } catch (e) { toast.error(e.message || "Logo upload failed."); }
        finally { setLogoBusy(false); }
    }

    return (
        <>
            <Section eyebrow="Business Identity" title="Your business name." helper="Already have one? Type it. Want options? Generate 5 names with rationale.">
                <AIAssistInput planId={planId} stepNum={1} fieldKey="business_name" fieldLabel="What is your business name?"
                    multiline={false}
                    placeholder="e.g. The Inner Compass Practice"
                    value={getInput(1, "business_name")} onChange={(v) => setInput(1, "business_name", v)} />
                <div className="mt-5">
                    <Button onClick={generateNames} disabled={genBusy} className="rounded-full" variant="outline" data-testid="generate-business-names-button">
                        {genBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate 5 name options</>}
                    </Button>
                </div>
                {getInput(1, "business_names") && (
                    <div className="mt-5">
                        <div className="label-eyebrow mb-2">AI suggestions</div>
                        <div className="editorial-card p-5 whitespace-pre-wrap text-sm leading-relaxed" data-testid="business-names-output">{getInput(1, "business_names")}</div>
                    </div>
                )}
            </Section>

            <Section eyebrow="Logo" title="Upload a logo, or generate AI prompts." helper="You can come back to this anytime.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="editorial-card p-5">
                        <div className="flex items-center gap-2 mb-3"><ImgIcon className="h-4 w-4 text-brand-bronze" /><div className="font-serif text-lg">Upload existing</div></div>
                        <input type="file" accept="image/*" disabled={logoBusy} onChange={(e) => uploadLogo(e.target.files?.[0])} className="text-sm" data-testid="logo-upload-input" />
                        <p className="text-[11px] text-muted-foreground mt-2">PNG, JPG, WEBP, GIF, SVG · max 5 MB.</p>
                        {logoBusy && <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Uploading…</div>}
                        {getInput(1, "logo_url") && (
                            <div className="mt-4">
                                <img src={getInput(1, "logo_url")} alt="logo" className="max-h-32 rounded-md border bg-white p-2" data-testid="logo-preview" />
                            </div>
                        )}
                    </div>
                    <div className="editorial-card p-5">
                        <div className="flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-brand-gold" /><div className="font-serif text-lg">Or generate prompts</div></div>
                        <p className="text-xs text-muted-foreground mb-3">Use these in Midjourney, DALL·E, or your favorite designer.</p>
                        <Button onClick={generateLogoPrompts} disabled={logoBusy} variant="outline" className="rounded-full" data-testid="generate-logo-prompts-button">
                            {logoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Generate 5 logo prompts</>}
                        </Button>
                        {getInput(1, "logo_prompts") && (
                            <div className="mt-4 text-xs whitespace-pre-wrap leading-relaxed" data-testid="logo-prompts-output">{getInput(1, "logo_prompts")}</div>
                        )}
                    </div>
                </div>
            </Section>

            <Section eyebrow="Structure" title="Pick your business structure." helper="Choose the structure that fits — or get an AI recommendation if you're unsure. A choice is required to proceed.">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {BUSINESS_STRUCTURES.map((s) => {
                        const active = chosenStructure === s.key;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => pickStructure(s.key)}
                                className={`text-left p-4 rounded-2xl border-2 transition-all ${active ? "border-brand-gold bg-brand-gold/10 shadow-md" : "border-border hover:border-brand-gold/60 bg-card"}`}
                                data-testid={`structure-pick-${s.key}-button`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-serif text-base">{s.name}</div>
                                    {active && <Check className="h-4 w-4 text-brand-gold" />}
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-snug">{s.best}</p>
                            </button>
                        );
                    })}
                </div>
                {!chosenStructure && (
                    <p className="text-xs text-destructive mb-3" data-testid="structure-required-hint">Pick one of the four structures above to continue.</p>
                )}
                <div className="editorial-card p-5 bg-secondary/30">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <div className="label-eyebrow text-brand-bronze mb-1">Optional</div>
                            <div className="font-serif text-lg">Not sure which fits? Get an AI recommendation.</div>
                            <p className="text-xs text-muted-foreground mt-1">Skip this if you've already discussed it with your accountant or have a structure in mind.</p>
                        </div>
                        <Button onClick={suggestStructure} disabled={structBusy} variant="outline" className="rounded-full shrink-0" data-testid="suggest-structure-button">
                            {structBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Recommend a structure</>}
                        </Button>
                    </div>
                    {getInput(1, "structure_recommendation") && (
                        <div className="mt-5 editorial-card p-5 whitespace-pre-wrap text-sm leading-relaxed" data-testid="structure-output">{getInput(1, "structure_recommendation")}</div>
                    )}
                </div>
            </Section>
        </>
    );
}

// =================== FINDING YOUR PURPOSE ===================
function FindingPurpose({ planId, getInput, setInput }) {
    const stored = getInput(1, "fp_q4");
    let priorities = FINDING_PURPOSE_PRIORITIES;
    try {
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length === FINDING_PURPOSE_PRIORITIES.length) priorities = parsed;
        }
    } catch { /* keep default */ }

    function updateRanking(next) {
        setInput(1, "fp_q4", JSON.stringify(next));
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: 1, field_key: "fp_q4", value: JSON.stringify(next) }) });
    }

    const [synthBusy, setSynthBusy] = useState(false);
    const purpose = getInput(1, "purpose_statement");

    async function synthesizePurpose() {
        // Build context from the 5 questions
        const answers = FINDING_PURPOSE_QUESTIONS.map((fq, i) => {
            let val = getInput(1, fq.key);
            if (fq.key === "fp_q4") {
                try { const arr = JSON.parse(val); if (Array.isArray(arr)) val = arr.join(" > "); } catch { /* keep raw */ }
            }
            return val ? `Q${i + 1}: ${fq.q}\n=> ${val}` : null;
        }).filter(Boolean).join("\n\n");

        if (!answers) {
            toast.error("Answer at least one of the questions before synthesizing.");
            return;
        }

        setSynthBusy(true);
        try {
            await streamingGenerate({
                field_key: "purpose_statement",
                field_label: "Synthesized Purpose statement",
                extra_context: { answers },
                instructions:
                    "From the user's answers, write a concise paragraph (4–6 sentences, ~80–120 words) describing the PURPOSE of their business. " +
                    "The paragraph must clearly reflect each of these qualities (woven naturally, not labeled): " +
                    "(1) Clarity of Goal — a specific, well-defined objective; " +
                    "(2) Persistence and Commitment — unwavering effort; " +
                    "(3) Burning Desire — intense motivational pull; " +
                    "(4) Action-Oriented Approach — a clear plan combined with continuous action; " +
                    "(5) Influence on Subconscious Mind — a vision impressed deeply enough to shape decisions; " +
                    "(6) Positive Influence on Others — the ability to inspire and rally cooperation. " +
                    "Write in the user's voice, calm and editorial. Return ONLY the paragraph, no headings or bullets.",
                planId, stepNum: 1, mode: "synthesize",
                onText: (t) => setInput(1, "purpose_statement", t)
            });
        } finally { setSynthBusy(false); }
    }

    return (
        <Section eyebrow="Finding Your Purpose" title="Definiteness of purpose.">
            <figure className="my-2">
                <blockquote className="font-serif text-2xl md:text-3xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="napoleon-hill-quote">
                    “Definiteness of purpose is the starting point of all achievement.”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— Napoleon Hill</figcaption>
            </figure>

            <div className="mt-5 mb-7 flex flex-wrap gap-2">
                <InfoDialog
                    trigger={<Button variant="outline" className="rounded-full" data-testid="learn-more-purpose-button"><BookOpen className="h-4 w-4 mr-2" /> Learn more</Button>}
                    eyebrow="Napoleon Hill"
                    title={NAPOLEON_HILL_LEARN_MORE.title}
                    intro={NAPOLEON_HILL_LEARN_MORE.intro}
                    points={NAPOLEON_HILL_LEARN_MORE.points}
                    testIdPrefix="learn-more-purpose"
                />
            </div>

            <div className="space-y-7">
                {FINDING_PURPOSE_QUESTIONS.map((fq, i) => (
                    <div key={fq.key}>
                        <div className="label-eyebrow mb-1.5">Q{i + 1}</div>
                        <div className="font-serif text-lg mb-2">{fq.q}</div>
                        {fq.helper && <p className="text-xs text-muted-foreground mb-2">{fq.helper}</p>}
                        {fq.key === "fp_q4" ? (
                            <div className="editorial-card p-4">
                                <p className="text-xs text-muted-foreground mb-3">Drag to reorder these life priorities. 1 = highest priority.</p>
                                <SortableRanking items={priorities} onChange={updateRanking} testIdPrefix="fp-priorities" />
                            </div>
                        ) : (
                            <AIAssistInput planId={planId} stepNum={1} fieldKey={fq.key} fieldLabel={fq.q} subModule="Finding Your Purpose"
                                rows={3}
                                value={getInput(1, fq.key)} onChange={(v) => setInput(1, fq.key, v)} />
                        )}
                    </div>
                ))}
            </div>

            {/* Synthesize Purpose */}
            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Synthesize</div>
                        <h3 className="font-serif text-2xl">Distill your answers into your Purpose.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">A short paragraph that reflects clarity, commitment, desire, action, conviction, and influence on others.</p>
                    </div>
                    <Button onClick={synthesizePurpose} disabled={synthBusy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="synthesize-purpose-button">
                        {synthBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Synthesize my Purpose</>}
                    </Button>
                </div>

                {/* Editable / refinable purpose box */}
                <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="label-eyebrow text-brand-gold mb-2">Your Purpose</div>
                    <div className="rounded-xl bg-brand-cream text-brand-charcoal p-4 md:p-5">
                        <AIAssistInput planId={planId} stepNum={1} fieldKey="purpose_statement"
                            fieldLabel="Your business Purpose paragraph"
                            subModule="Finding Your Purpose"
                            rows={5}
                            placeholder="Click ‘Synthesize my Purpose’ above, or write your own. You can refine with the AI tools."
                            value={purpose} onChange={(v) => setInput(1, "purpose_statement", v)}
                            testIdPrefix="purpose-statement-field"
                        />
                    </div>
                </div>
            </div>
        </Section>
    );
}

// =================== BECOME DRIVEN ===================
function BecomeDriven({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Become Driven" title="Drift, or drive." helper="Russell Brunson articulates the choice that defines every entrepreneur. Reflect on these five questions in that light.">
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="russell-brunson-quote">
                    “{BECOME_DRIVEN_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {BECOME_DRIVEN_QUOTE.attribution}</figcaption>
            </figure>

            <div className="my-6">
                <BecomeDrivenLearnMore />
            </div>

            <div className="space-y-6">
                {DRIVEN_QUESTIONS.map((q, i) => (
                    <div key={i}>
                        <div className="label-eyebrow mb-2">Q{i + 1}</div>
                        <div className="font-serif text-lg mb-2">{q}</div>
                        <AIAssistInput planId={planId} stepNum={1} fieldKey={`driven_q${i + 1}`} fieldLabel={q}
                            value={getInput(1, `driven_q${i + 1}`)} onChange={(v) => setInput(1, `driven_q${i + 1}`, v)} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

function BecomeDrivenLearnMore() {
    return (
        <RawDialog>
            <RawDialogTrigger asChild>
                <Button variant="outline" className="rounded-full" data-testid="learn-more-driven-button">
                    <BookOpen className="h-4 w-4 mr-2" /> Learn more
                </Button>
            </RawDialogTrigger>
            <RawDialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="learn-more-driven-dialog">
                <RawDialogHeader>
                    <div className="label-eyebrow text-brand-bronze mb-1">From Napoleon Hill’s Outwitting the Devil</div>
                    <RawDialogTitle className="font-serif text-3xl tracking-[-0.02em]">{BECOME_DRIVEN_LEARN_MORE.title}</RawDialogTitle>
                </RawDialogHeader>
                <p className="text-sm leading-relaxed text-muted-foreground mt-2">{BECOME_DRIVEN_LEARN_MORE.intro}</p>
                <div className="my-5 grid grid-cols-2 gap-3">
                    <div className="editorial-card p-4 text-center">
                        <div className="font-serif text-4xl text-destructive">{BECOME_DRIVEN_LEARN_MORE.stat.drifters}</div>
                        <div className="label-eyebrow mt-1">Drifters</div>
                    </div>
                    <div className="editorial-card p-4 text-center">
                        <div className="font-serif text-4xl text-brand-bronze">{BECOME_DRIVEN_LEARN_MORE.stat.driven}</div>
                        <div className="label-eyebrow mt-1">Driven</div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground -mt-2 mb-5 text-center">{BECOME_DRIVEN_LEARN_MORE.stat.note}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <div className="font-serif text-xl mb-3">{BECOME_DRIVEN_LEARN_MORE.drifter.title}</div>
                        <ul className="space-y-3">
                            {BECOME_DRIVEN_LEARN_MORE.drifter.items.map((it, i) => (
                                <li key={i}>
                                    <div className="text-sm font-medium">{it.name}</div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">{it.body}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <div className="font-serif text-xl mb-3 text-brand-bronze">{BECOME_DRIVEN_LEARN_MORE.driven.title}</div>
                        <ul className="space-y-3">
                            {BECOME_DRIVEN_LEARN_MORE.driven.items.map((it, i) => (
                                <li key={i}>
                                    <div className="text-sm font-medium">{it.name}</div>
                                    <div className="text-xs text-muted-foreground leading-relaxed">{it.body}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <p className="mt-5 text-sm leading-relaxed border-t pt-4 border-border italic text-foreground/80">{BECOME_DRIVEN_LEARN_MORE.takeaway}</p>
            </RawDialogContent>
        </RawDialog>
    );
}

// =================== MTP ===================
function MTPSection({ planId, getInput, setInput }) {
    const [active, setActive] = useState(MTP_CATEGORIES[0].key);
    const [synthBusy, setSynthBusy] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Compute completion: a category is "done" if at least 3 of its 10 questions are answered.
    const categoryStatuses = MTP_CATEGORIES.map((cat) => {
        const filled = cat.questions.filter((q, i) => (getInput(1, `mtp_${cat.key}_${i + 1}`) || "").trim().length > 0).length;
        const done = filled >= 3;
        return { key: cat.key, label: cat.label, filled, done };
    });
    const completedCount = categoryStatuses.filter((s) => s.done).length;

    const activeIdx = MTP_CATEGORIES.findIndex((c) => c.key === active);
    const nextCat = activeIdx < MTP_CATEGORIES.length - 1 ? MTP_CATEGORIES[activeIdx + 1] : null;

    async function doSynthesize() {
        const all = MTP_CATEGORIES.flatMap((cat) => cat.questions.map((q, i) => ({ cat: cat.label, q, a: getInput(1, `mtp_${cat.key}_${i + 1}`) })));
        const ctx = all.filter((x) => x.a).map((x) => `[${x.cat}] ${x.q}\n=> ${x.a}`).join("\n\n");
        const purpose = getInput(1, "purpose_statement") || "";

        if (!ctx) {
            toast.error("Answer at least a few reflections before synthesizing.");
            return;
        }
        setSynthBusy(true);
        try {
            await streamingGenerate({
                field_key: "mtp_statement",
                field_label: "Massive Transformative Purpose statement",
                extra_context: { reflections: ctx, existing_purpose: purpose },
                instructions:
                    "From these reflections across Passions, Values, Strengths, Patterns and Impact, synthesize a single Massive Transformative Purpose (MTP) statement that is 8–10 words. " +
                    "It must be inspirational, action-oriented, and uniquely the user’s. " +
                    (purpose ? "CRITICAL: the MTP must align with and emerge naturally from the existing PURPOSE paragraph already articulated. Use the same core direction; do not contradict it. " : "") +
                    "Return ONLY the MTP statement — nothing else.",
                planId, stepNum: 1, mode: "synthesize",
                onText: (t) => setInput(1, "mtp_statement", t)
            });
        } finally { setSynthBusy(false); setConfirmOpen(false); }
    }

    return (
        <Section eyebrow="MTP Discovery" title="Massive Transformative Purpose." helper="Five categories. Don’t answer every question — answer the ones that pull you. When you’re ready, synthesize.">
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="churchill-quote">
                    “{MTP_CHURCHILL_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {MTP_CHURCHILL_QUOTE.attribution}</figcaption>
            </figure>

            <div className="mt-5 mb-7 flex flex-wrap gap-2">
                <InfoDialog
                    trigger={<Button variant="outline" className="rounded-full" data-testid="mtp-learn-more-button"><BookOpen className="h-4 w-4 mr-2" /> Learn more</Button>}
                    eyebrow="Steven Kotler"
                    title={MTP_LEARN_MORE.title}
                    intro={MTP_LEARN_MORE.intro}
                    points={MTP_LEARN_MORE.points}
                    testIdPrefix="mtp-learn-more"
                />
                <InfoDialog
                    trigger={<Button variant="outline" className="rounded-full" data-testid="mtp-key-aspects-button"><Sparkles className="h-4 w-4 mr-2" /> Key Aspects</Button>}
                    eyebrow="MTP · 6 Characteristics"
                    title={MTP_KEY_ASPECTS.title}
                    intro={MTP_KEY_ASPECTS.intro}
                    points={MTP_KEY_ASPECTS.points}
                    testIdPrefix="mtp-key-aspects"
                />
                <InfoDialog
                    trigger={<Button variant="outline" className="rounded-full" data-testid="mtp-examples-button"><Target className="h-4 w-4 mr-2" /> Examples</Button>}
                    eyebrow="Famous MTPs"
                    title={MTP_EXAMPLES.title}
                    intro={MTP_EXAMPLES.intro}
                    points={MTP_EXAMPLES.points}
                    closing={MTP_EXAMPLES.closing}
                    testIdPrefix="mtp-examples"
                />
            </div>

            {/* Category chips with progress */}
            <div className="flex flex-wrap gap-2 mb-5" data-testid="mtp-category-chips">
                {categoryStatuses.map((s, i) => (
                    <button key={s.key} onClick={() => setActive(s.key)}
                        className={`text-xs uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${active === s.key ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : s.done ? "bg-brand-gold/10 border-brand-gold text-brand-bronze" : "hover:bg-secondary"}`}
                        data-testid={`mtp-cat-${s.key}-button`}>
                        {s.done && <Check className="h-3 w-3" />}
                        {s.label}
                    </button>
                ))}
                <span className="text-xs text-muted-foreground self-center ml-2" data-testid="mtp-completion-counter">{completedCount} of 5 categories complete</span>
            </div>

            {MTP_CATEGORIES.filter((c) => c.key === active).map((c) => (
                <div key={c.key}>
                    <p className="text-sm text-muted-foreground mb-5">{c.helper}</p>
                    <div className="space-y-5">
                        {c.questions.map((q, i) => (
                            <div key={i}>
                                <div className="font-serif text-base mb-1.5">{i + 1}. {q}</div>
                                <AIAssistInput planId={planId} stepNum={1} fieldKey={`mtp_${c.key}_${i + 1}`} fieldLabel={q} subModule={`MTP · ${c.label}`}
                                    rows={3}
                                    value={getInput(1, `mtp_${c.key}_${i + 1}`)} onChange={(v) => setInput(1, `mtp_${c.key}_${i + 1}`, v)} />
                            </div>
                        ))}
                    </div>

                    {/* Per-category Next button */}
                    {nextCat && (
                        <div className="mt-7 flex justify-end" data-testid="mtp-category-nav">
                            <Button onClick={() => { setActive(nextCat.key); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full" variant="outline" data-testid={`mtp-next-cat-${nextCat.key}-button`}>
                                Next: {nextCat.label} <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            ))}

            {/* Synthesize MTP */}
            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Synthesize</div>
                        <h3 className="font-serif text-2xl">Distill all reflections into your MTP.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">8–10 words. Inspirational. Aligned with your already-defined Purpose.</p>
                    </div>
                    <RawDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <RawDialogTrigger asChild>
                            <Button disabled={synthBusy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="synthesize-mtp-button">
                                {synthBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Synthesize my MTP</>}
                            </Button>
                        </RawDialogTrigger>
                        <RawDialogContent data-testid="synthesize-mtp-confirm-dialog">
                            <RawDialogHeader>
                                <div className="label-eyebrow text-brand-bronze mb-1">Synthesize MTP</div>
                                <RawDialogTitle className="font-serif text-2xl">Ready to create your MTP?</RawDialogTitle>
                            </RawDialogHeader>
                            <p className="text-sm leading-relaxed">
                                You’ve completed <span className="font-semibold text-brand-bronze" data-testid="synthesize-mtp-counter">{completedCount} of 5</span> categories
                                {completedCount < 3 ? " — we recommend completing at least 3 for a richer MTP, but you can proceed with what you have." : completedCount === 5 ? " — wonderful, you’ve done all five." : " — a solid foundation."}
                            </p>
                            <p className="text-xs text-muted-foreground mt-3">
                                The MTP will be aligned with your Purpose paragraph from the previous section.
                            </p>
                            <div className="flex justify-end gap-2 mt-5">
                                <Button variant="ghost" onClick={() => setConfirmOpen(false)} data-testid="synthesize-mtp-cancel-button">Cancel</Button>
                                <Button onClick={doSynthesize} disabled={synthBusy} className="cta-red rounded-full" data-testid="synthesize-mtp-confirm-button">
                                    {synthBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Yes, create my MTP</>}
                                </Button>
                            </div>
                        </RawDialogContent>
                    </RawDialog>
                </div>
                {getInput(1, "mtp_statement") && (
                    <div className="mt-5 border-t border-white/10 pt-5">
                        <div className="label-eyebrow text-brand-gold mb-2">Your MTP</div>
                        <div className="font-serif text-2xl md:text-3xl italic leading-tight" data-testid="mtp-statement-output">“{getInput(1, "mtp_statement")}”</div>
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== DEEP WHY (Progressive Reveal) ===================
function DeepWhySection({ planId, getInput, setInput }) {
    const mtp = getInput(1, "mtp_statement") || "";

    // Initialize starter from MTP once (only if user hasn't already saved their own).
    // Intentionally runs on mount only — we read the latest MTP via the
    // getInput closure at mount-time to pre-fill the starter.
    useEffect(() => {
        const cur = getInput(1, "why_starter");
        if (!cur && mtp) {
            setInput(1, "why_starter", mtp);
            authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: 1, field_key: "why_starter", value: mtp }) }).catch((e) => {
                console.warn("DeepWhy starter persist failed:", e);
            });
        }
    // Mount-only: we deliberately do not re-run when MTP or planId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const revealedStr = getInput(1, "why_revealed_level");
    const revealed = Math.max(0, Math.min(7, parseInt(revealedStr || "0", 10) || 0));
    const [genBusy, setGenBusy] = useState(false);

    function persistRevealed(n) {
        setInput(1, "why_revealed_level", String(n));
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: 1, field_key: "why_revealed_level", value: String(n) }) });
    }

    async function generateNextQuestion(nextLevel) {
        const prevAnswer = nextLevel === 1
            ? (getInput(1, "why_starter") || "")
            : (getInput(1, `why_level_${nextLevel - 1}`) || "");
        if (!prevAnswer.trim()) {
            toast.error(nextLevel === 1 ? "Edit the starter prompt first." : `Answer Level ${nextLevel - 1} before continuing.`);
            return;
        }
        // If a question already exists, just reveal and return
        const existingQ = getInput(1, `why_question_${nextLevel}`);
        if (existingQ) { persistRevealed(nextLevel); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); return; }

        setGenBusy(true);
        try {
            await streamingGenerate({
                field_key: `why_question_${nextLevel}`,
                field_label: `Generate Why-question for Level ${nextLevel}`,
                extra_context: { previous_answer: prevAnswer, level: nextLevel },
                instructions:
                    "You are guiding a 7 Levels Deep WHY cascade. Read the user's previous answer below. " +
                    "Write a single short question (ONE sentence, no preamble, no quotes) that asks WHY the previous answer matters — reworded in fresh, specific language drawn from their own words. " +
                    "Examples of style: “Why does that freedom matter to you?”, “Why is it important that your clients feel seen?”. " +
                    "Return ONLY the single question.",
                planId, stepNum: 1, mode: "generate",
                onText: (t) => setInput(1, `why_question_${nextLevel}`, t)
            });
            persistRevealed(nextLevel);
            setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 250);
        } finally { setGenBusy(false); }
    }

    return (
        <Section eyebrow="7 Levels Deep WHY" title="Find your real WHY." helper={SEVEN_LEVELS_DEEP.intro}>
            <div>
                <div className="font-serif text-lg mb-1">Starter prompt</div>
                <p className="text-xs text-muted-foreground mb-3">We’ve seeded this with your MTP. Edit as needed before beginning the cascade.</p>
                <AIAssistInput planId={planId} stepNum={1} fieldKey="why_starter" fieldLabel="Starter prompt (begin from your MTP)" subModule="7 Levels Deep WHY"
                    rows={3}
                    placeholder={mtp ? "" : "Tip: synthesize your MTP first on the previous tab, then come back."}
                    value={getInput(1, "why_starter")} onChange={(v) => setInput(1, "why_starter", v)} />

                {revealed < 1 && (
                    <div className="mt-5 flex justify-end">
                        <Button onClick={() => generateNextQuestion(1)} disabled={genBusy} className="cta-red rounded-full h-11 px-5" data-testid="why-next-level-1-button">
                            {genBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next: Begin Level 1 <ChevronRight className="h-4 w-4 ml-1" /></>}
                        </Button>
                    </div>
                )}

                {Array.from({ length: 7 }, (_, i) => i + 1).filter((lv) => lv <= revealed).map((lv) => {
                    const isLast = lv === 7;
                    const question = getInput(1, `why_question_${lv}`) || "Why is that important?";
                    const answered = (getInput(1, `why_level_${lv}`) || "").trim().length > 0;
                    const isFinal = lv === revealed;
                    return (
                        <div key={lv} className="editorial-card p-5 mt-5" data-testid={`why-level-${lv}-card`}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="label-eyebrow text-brand-bronze">Level {lv}{isLast && " — Big Why"}</div>
                                {answered && <Check className="h-3.5 w-3.5 text-brand-gold" />}
                            </div>
                            <div className="font-serif text-lg mb-3" data-testid={`why-level-${lv}-question`}>{question}</div>
                            <AIAssistInput planId={planId} stepNum={1} fieldKey={`why_level_${lv}`} fieldLabel={question} subModule="7 Levels Deep WHY"
                                rows={isLast ? 4 : 2}
                                placeholder={isLast ? "Your Big Why — the truth that lives beneath everything." : "Because\u2026"}
                                value={getInput(1, `why_level_${lv}`)} onChange={(v) => {
                                    setInput(1, `why_level_${lv}`, v);
                                    if (isLast) setInput(1, "deep_why", v);
                                }} />

                            {isFinal && !isLast && (
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={() => generateNextQuestion(lv + 1)} disabled={genBusy || !answered} className="cta-red rounded-full h-10 px-5" data-testid={`why-next-level-${lv + 1}-button`}>
                                        {genBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next: Level {lv + 1} <ChevronRight className="h-4 w-4 ml-1" /></>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    );
                })}

                {revealed >= 7 && (getInput(1, "why_level_7") || "").trim() && (
                    <div className="mt-7 dark-cinematic-panel p-7 md:p-8">
                        <div className="label-eyebrow text-brand-gold mb-2">Your Big Why</div>
                        <div className="font-serif text-2xl md:text-3xl italic leading-snug" data-testid="big-why-output">“{getInput(1, "why_level_7")}”</div>
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== CHIEF AIM ===================
function ChiefAimSection({ planId, getInput, setInput }) {
    const mtp = getInput(1, "mtp_statement") || "";
    return (
        <Section eyebrow="Definite Chief Aim" title="Your aim, in writing." helper="Set High Hard Goals at four horizons: 3 months, 1 year, 3 years, 5 years.">
            {/* MTP read-only banner */}
            <div className="editorial-card p-5 mb-6 bg-secondary/40" data-testid="chief-mtp-banner">
                <div className="label-eyebrow text-brand-bronze mb-1">Your MTP</div>
                {mtp ? (
                    <div className="font-serif text-xl italic leading-snug">“{mtp}”</div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">Synthesize your MTP on the MTP Discovery tab first — your Chief Aim should serve it.</p>
                )}
            </div>

            {/* Dr Brandt Gibson quote */}
            <figure className="my-5">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="brandt-gibson-quote">
                    “{CHIEF_AIM_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {CHIEF_AIM_QUOTE.attribution}</figcaption>
            </figure>

            <div className="space-y-8 mt-7">
                {CHIEF_AIM_HORIZONS.map((h) => (
                    <div key={h.key} className="editorial-card p-6" data-testid={`chief-horizon-${h.key}`}>
                        <div className="font-serif text-2xl">{h.label}</div>
                        {h.helper && <p className="text-xs text-muted-foreground mt-1">{h.helper}</p>}
                        <div className="gold-divider my-3" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {CHIEF_AIM_PROMPTS.map((p) => (
                                <div key={p.key}>
                                    <div className="label-eyebrow mb-1.5">{p.label}</div>
                                    <div className="text-xs text-muted-foreground mb-2">{p.helper}</div>
                                    <AIAssistInput planId={planId} stepNum={1} fieldKey={`chief_${h.key}_${p.key}`} fieldLabel={`${h.label} — ${p.label}`} subModule={`Chief Aim · ${h.label}`}
                                        rows={3}
                                        value={getInput(1, `chief_${h.key}_${p.key}`)} onChange={(v) => setInput(1, `chief_${h.key}_${p.key}`, v)} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Section>
    );
}

// =================== OUTPUT ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const data = {
        name: getInput(1, "business_name"),
        logo: getInput(1, "logo_url"),
        purpose: getInput(1, "fp_q5"),
        mtp: getInput(1, "mtp_statement"),
        why: getInput(1, "why_level_7") || getInput(1, "deep_why"),
        aim_q3_what: getInput(1, "chief_q3_what"),
        aim_y1_what: getInput(1, "chief_y1_what"),
        aim_y3_what: getInput(1, "chief_y3_what"),
        aim_y5_what: getInput(1, "chief_y5_what"),
        structure_chosen: getInput(1, "structure_chosen"),
        structure_rec: getInput(1, "structure_recommendation")
    };

    const [marking, setMarking] = useState(false);
    async function complete() {
        if (!data.structure_chosen) {
            toast.error("Please pick a business structure on the Identity tab to continue.");
            return;
        }
        setMarking(true);
        try {
            await markStepStatus(1, "complete");
            toast.success("Step 1 marked complete.");
            const next = STEPS.find((s) => s.num === 2);
            gotoStep(next);
        } finally { setMarking(false); }
    }

    const structName = BUSINESS_STRUCTURES.find((b) => b.key === data.structure_chosen)?.name || null;

    return (
        <Section eyebrow="Your Output" title="DEFINE Your Purpose Card" helper="Edit anything by jumping back to the relevant tab. This is your living source-of-truth.">
            <div className="editorial-card p-7 md:p-8" data-testid="step1-output-card">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="label-eyebrow text-brand-bronze">Business</div>
                        <div className="font-serif text-3xl mt-1">{data.name || "—"}</div>
                    </div>
                    {data.logo && <img src={data.logo} alt="logo" className="h-20 w-20 object-contain rounded bg-white p-1.5" />}
                </div>
                <div className="gold-divider my-6" />
                <Field label="Purpose" value={data.purpose} multiline />
                <Field label="Massive Transformative Purpose" value={data.mtp} />
                <Field label="Deep WHY" value={data.why} />

                {/* Chief Aim — all four horizons (WHAT) */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Chief Aim (WHAT)</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="output-chief-aim-grid">
                        <ChiefAimRow horizon="3-Month Goal" value={data.aim_q3_what} testId="output-chief-q3-what" />
                        <ChiefAimRow horizon="1-Year Goal" value={data.aim_y1_what} testId="output-chief-y1-what" />
                        <ChiefAimRow horizon="3-Year Goal" value={data.aim_y3_what} testId="output-chief-y3-what" />
                        <ChiefAimRow horizon="5-Year Goal" value={data.aim_y5_what} testId="output-chief-y5-what" />
                    </div>
                </div>

                <Field label="Business Structure" value={structName} />
                {data.structure_rec && <Field label="AI Recommendation Notes" value={data.structure_rec} multiline />}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
                {!data.structure_chosen && (
                    <p className="text-xs text-destructive sm:mr-auto" data-testid="step1-missing-structure-warn">A business structure must be picked on the Identity tab before completing Step 1.</p>
                )}
                <Button onClick={complete} disabled={marking || !data.structure_chosen} className="cta-red rounded-full h-11 px-6" data-testid="complete-step1-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 1 → Begin Step 2 <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
            </div>
        </Section>
    );
}

function ChiefAimRow({ horizon, value, testId }) {
    return (
        <div className="editorial-card p-4 bg-secondary/30" data-testid={testId}>
            <div className="label-eyebrow text-brand-bronze mb-1">{horizon}</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {value || <span className="text-muted-foreground italic">—</span>}
            </div>
        </div>
    );
}

function Field({ label, value, multiline }) {
    return (
        <div className="py-3">
            <div className="label-eyebrow text-brand-bronze mb-1">{label}</div>
            <div className={multiline ? "text-sm leading-relaxed whitespace-pre-wrap" : "font-serif text-lg italic"}>{value || <span className="text-muted-foreground">—</span>}</div>
        </div>
    );
}

// Helper: streaming generate
async function streamingGenerate({ field_key, field_label, instructions, planId, stepNum, mode = "generate", extra_context, onText, persist = true }) {
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
        // Persist generated value to plan_inputs so it survives refresh
        if (persist && planId && acc) {
            authedFetch(`/plans/${planId}/inputs`, {
                method: "POST",
                keepalive: true,
                body: JSON.stringify({ step_num: stepNum, field_key, value: acc })
            }).catch(() => { /* swallow */ });
        }
        return acc;
    } catch (e) { toast.error(e.message || "AI failed"); }
}
