import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Sparkles, Mic, BookOpen, Compass, Megaphone, Quote, Check, Loader2,
    ArrowRight, ArrowLeft, ChevronRight, ChevronDown, ChevronUp, User as UserIcon, Users
} from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { STEPS } from "@/lib/steps";
import {
    BRAND_VOICE_PROMPTS, STORY_BANK_PROMPTS, HEROS_JOURNEY_STAGES,
    HSO_FIELDS, DISTILLATION_PROMPTS,
    FRAME_BRAND_VOICE_QUOTE, FRAME_HEROS_JOURNEY_INTRO, HSO_INTRO
} from "@/lib/framework";

const STEP_NUM = 3;

const TAB_ORDER = ["voice", "stories", "journey", "hso", "distill", "output"];
const TAB_LABELS = {
    voice: "Brand Voice",
    stories: "Story Bank",
    journey: "Hero's Journey",
    hso: "Hook · Story · Offer",
    distill: "Important Stories",
    output: "Your Output"
};

export default function StepFrame({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("voice");
    const planId = plan.id;

    const goToTab = (key) => {
        setTab(key);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-frame">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 03 · Pro</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">FRAME Your Story</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                    Voice. Stories. The Hero's Journey. Hook → Story → Offer. The narrative engine that powers every piece of marketing you ever make.
                </p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["voice",    Mic,       "Brand Voice"],
                        ["stories",  BookOpen,  "Story Bank"],
                        ["journey",  Compass,   "Hero's Journey"],
                        ["hso",      Megaphone, "Hook · Story · Offer"],
                        ["distill",  Quote,     "Important Stories"],
                        ["output",   Check,     "Your Output"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`frame-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="voice"><BrandVoice planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="stories"><StoryBank planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="journey"><HeroJourney planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="hso"><HookStoryOffer planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="distill"><Distillation planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {tab !== "output" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="frame-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="frame-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="frame-next-button">
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

// =================== BRAND VOICE ===================
function BrandVoice({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);
    const synth = getInput(STEP_NUM, "brand_voice_statement");

    async function synthesizeVoice() {
        const answers = BRAND_VOICE_PROMPTS.map((p, i) => {
            const v = getInput(STEP_NUM, p.key);
            return v ? `Q${i + 1}: ${p.q}\n=> ${v}` : null;
        }).filter(Boolean).join("\n\n");

        if (!answers) {
            toast.error("Answer a few questions before synthesizing your Brand Voice.");
            return;
        }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "brand_voice_statement",
                field_label: "Synthesized Brand Voice Profile",
                extra_context: { answers },
                instructions:
                    "From these reflections, write a Brand Voice Profile in 3 parts (each part separated by a blank line, no markdown headings):\n" +
                    "PART 1 — VOICE IN ONE LINE: a single sentence capturing the brand's voice (10–18 words).\n" +
                    "PART 2 — VOICE PROFILE: a tight 4-sentence paragraph describing tone, cadence, vocabulary, and emotional register. " +
                    "Weave in the user's own adjectives, pet phrases, and metaphors when present.\n" +
                    "PART 3 — WE SAY / WE DON'T SAY: two parallel mini-lists, exactly 4 items each, prefixed with 'We say:' and 'We don't say:'. " +
                    "Concrete, specific phrases — not abstractions. Use the user's avoided words for 'We don't say'.\n" +
                    "Return only the three parts in order. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "brand_voice_statement", t)
            });
        } finally { setBusy(false); }
    }

    return (
        <Section eyebrow="Brand Voice" title="How your brand sounds out loud." helper="Ten short reflections. Answer the ones that pull you. When you're ready, synthesize a voice profile you can reuse on every page.">
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="brand-voice-quote">
                    “{FRAME_BRAND_VOICE_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {FRAME_BRAND_VOICE_QUOTE.attribution}</figcaption>
            </figure>

            <div className="space-y-7 mt-7">
                {BRAND_VOICE_PROMPTS.map((p, i) => (
                    <div key={p.key}>
                        <div className="label-eyebrow mb-1.5">Q{i + 1}</div>
                        <div className="font-serif text-lg mb-2">{p.q}</div>
                        {p.helper && <p className="text-xs text-muted-foreground mb-2">{p.helper}</p>}
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key} fieldLabel={p.q} subModule="Brand Voice"
                            rows={3}
                            value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Synthesize</div>
                        <h3 className="font-serif text-2xl">Distill your reflections into a Brand Voice profile.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">A one-line voice + 4-sentence profile + a we-say/we-don't-say list.</p>
                    </div>
                    <Button onClick={synthesizeVoice} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="synthesize-brand-voice-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Synthesize my Brand Voice</>}
                    </Button>
                </div>

                <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="label-eyebrow text-brand-gold mb-2">Your Brand Voice</div>
                    <div className="rounded-xl bg-brand-cream text-brand-charcoal p-4 md:p-5">
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey="brand_voice_statement"
                            fieldLabel="Your Brand Voice profile"
                            subModule="Brand Voice"
                            rows={10}
                            placeholder="Click 'Synthesize my Brand Voice' above, or write it yourself. You can refine with the AI tools."
                            value={synth} onChange={(v) => setInput(STEP_NUM, "brand_voice_statement", v)}
                            testIdPrefix="brand-voice-profile-field"
                        />
                    </div>
                </div>
            </div>
        </Section>
    );
}

// =================== STORY BANK ===================
function StoryBank({ planId, getInput, setInput }) {
    const [open, setOpen] = useState(() => Object.fromEntries(STORY_BANK_PROMPTS.map((p, i) => [p.key, i === 0])));

    function toggle(key) {
        setOpen((s) => ({ ...s, [key]: !s[key] }));
    }

    return (
        <Section eyebrow="Story Bank" title="The reservoir." helper="Nine categories. Each one a vein of raw material you'll mine for the rest of your career. Don't polish — get it on the page.">
            <div className="space-y-3">
                {STORY_BANK_PROMPTS.map((p, i) => {
                    const filled = (getInput(STEP_NUM, p.key) || "").trim().length > 0;
                    const isOpen = !!open[p.key];
                    return (
                        <div key={p.key} className={`editorial-card transition-colors ${filled ? "border-brand-gold/40" : ""}`} data-testid={`story-${p.key}`}>
                            <button
                                type="button"
                                onClick={() => toggle(p.key)}
                                className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-secondary/40 rounded-2xl"
                                data-testid={`story-${p.key}-toggle`}
                            >
                                <div className="label-eyebrow text-brand-bronze pt-1.5 shrink-0 min-w-[2ch]">{String(i + 1).padStart(2, "0")}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="font-serif text-xl">{p.label}</div>
                                        {filled && <Check className="h-4 w-4 text-brand-gold" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.helper}</p>
                                </div>
                                <div className="pt-2 shrink-0 text-muted-foreground">
                                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </button>
                            {isOpen && (
                                <div className="px-5 pb-5 -mt-1">
                                    <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key} fieldLabel={`${p.label} — ${p.helper}`} subModule="Story Bank"
                                        rows={5}
                                        placeholder="Write what comes. Raw is fine."
                                        value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

// =================== HERO'S JOURNEY ===================
function HeroJourney({ planId, getInput, setInput }) {
    // Two parallel journeys: founder + customer
    const [persona, setPersona] = useState("founder"); // 'founder' | 'customer'
    const keyFor = (stage) => `${stage.key}__${persona}`;
    const labelFor = (stage) => persona === "founder" ? stage.label : stage.label.replace(/your|you/gi, "their");

    const filledCount = HEROS_JOURNEY_STAGES.filter((s) => (getInput(STEP_NUM, keyFor(s)) || "").trim().length > 0).length;

    return (
        <Section eyebrow="Hero's Journey" title="The 12-stage arc." helper={FRAME_HEROS_JOURNEY_INTRO}>
            {/* Persona switch */}
            <div className="flex flex-wrap items-center gap-2 mb-6" data-testid="hj-persona-switch">
                <button
                    onClick={() => setPersona("founder")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${persona === "founder" ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                    data-testid="hj-persona-founder"
                >
                    <UserIcon className="h-4 w-4" /> Founder's Journey
                </button>
                <button
                    onClick={() => setPersona("customer")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${persona === "customer" ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                    data-testid="hj-persona-customer"
                >
                    <Users className="h-4 w-4" /> Customer's Journey
                </button>
                <span className="text-xs text-muted-foreground self-center ml-2" data-testid="hj-progress">{filledCount} of 12 stages drafted</span>
            </div>

            {/* SVG wheel + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                <div className="lg:col-span-5">
                    <HeroJourneyWheel
                        stages={HEROS_JOURNEY_STAGES}
                        filled={(s) => (getInput(STEP_NUM, keyFor(s)) || "").trim().length > 0}
                    />
                </div>
                <div className="lg:col-span-7 space-y-5" data-testid="hj-stages-list">
                    {HEROS_JOURNEY_STAGES.map((s) => (
                        <div key={s.key} className="editorial-card p-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-7 w-7 rounded-full bg-brand-gold/20 text-brand-bronze grid place-items-center font-serif text-sm shrink-0">{s.stage}</div>
                                <div className="font-serif text-lg">{labelFor(s)}</div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{s.helper}</p>
                            <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                fieldKey={keyFor(s)}
                                fieldLabel={`${labelFor(s)} — ${s.helper}`}
                                subModule={`Hero's Journey · ${persona === "founder" ? "Founder" : "Customer"}`}
                                rows={3}
                                value={getInput(STEP_NUM, keyFor(s))} onChange={(v) => setInput(STEP_NUM, keyFor(s), v)} />
                        </div>
                    ))}
                </div>
            </div>
        </Section>
    );
}

function HeroJourneyWheel({ stages, filled }) {
    // 12 segments around a circle. Each highlights when filled.
    const cx = 200, cy = 200, rOuter = 180, rInner = 70;
    const segments = stages.map((s, i) => {
        const a0 = ((i / 12) * 2 * Math.PI) - Math.PI / 2;
        const a1 = (((i + 1) / 12) * 2 * Math.PI) - Math.PI / 2;
        const x0 = cx + rOuter * Math.cos(a0), y0 = cy + rOuter * Math.sin(a0);
        const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1);
        const x2 = cx + rInner * Math.cos(a1), y2 = cy + rInner * Math.sin(a1);
        const x3 = cx + rInner * Math.cos(a0), y3 = cy + rInner * Math.sin(a0);
        const d = `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${rInner} ${rInner} 0 0 0 ${x3} ${y3} Z`;
        // Label position (midpoint angle)
        const mid = (a0 + a1) / 2;
        const lr = (rOuter + rInner) / 2;
        const lx = cx + lr * Math.cos(mid);
        const ly = cy + lr * Math.sin(mid);
        const isFilled = filled(s);
        return { d, lx, ly, num: s.stage, isFilled, key: s.key };
    });
    return (
        <div className="editorial-card p-4 sticky top-32" data-testid="hj-wheel">
            <div className="aspect-square w-full">
                <svg viewBox="0 0 400 400" className="w-full h-full">
                    <defs>
                        <radialGradient id="hj-center" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="hsl(var(--brand-gold))" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="hsl(var(--brand-gold))" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    {segments.map((seg) => (
                        <g key={seg.key}>
                            <path
                                d={seg.d}
                                fill={seg.isFilled ? "hsl(var(--brand-gold) / 0.28)" : "hsl(var(--secondary))"}
                                stroke="hsl(var(--border))"
                                strokeWidth="1"
                            />
                            <text x={seg.lx} y={seg.ly + 4} textAnchor="middle" className="font-serif" fontSize="14" fill="hsl(var(--foreground))">
                                {seg.num}
                            </text>
                        </g>
                    ))}
                    <circle cx={cx} cy={cy} r={rInner} fill="url(#hj-center)" stroke="hsl(var(--brand-gold))" strokeOpacity="0.5" strokeWidth="1.5" />
                    <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fill="hsl(var(--brand-bronze))" className="uppercase tracking-[0.18em]">
                        Hero's
                    </text>
                    <text x={cx} y={cy + 14} textAnchor="middle" fontSize="14" fill="hsl(var(--foreground))" className="font-serif">
                        Journey
                    </text>
                </svg>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">Gold segments are drafted. Click any stage card to edit.</p>
        </div>
    );
}

// =================== HOOK-STORY-OFFER ===================
function HookStoryOffer({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function generateHSO() {
        const voice = getInput(STEP_NUM, "brand_voice_statement") || "";
        const storyHighlights = STORY_BANK_PROMPTS.map((p) => {
            const v = getInput(STEP_NUM, p.key);
            return v ? `${p.label}: ${v}` : null;
        }).filter(Boolean).join("\n");
        const journey = HEROS_JOURNEY_STAGES.map((s) => {
            const v = getInput(STEP_NUM, `${s.key}__founder`);
            return v ? `Stage ${s.stage} ${s.label}: ${v}` : null;
        }).filter(Boolean).join("\n");

        if (!voice && !storyHighlights) {
            toast.error("Draft your Brand Voice and a few stories first — the generator needs raw material.");
            return;
        }

        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "hso_bundle",
                field_label: "Hook · Story · Offer bundle",
                extra_context: { voice, storyHighlights, journey },
                instructions:
                    "Generate a complete Hook · Story · Offer bundle for this user's brand, in three labeled sections separated by blank lines:\n" +
                    "HOOK:\n— 3 distinct one-line hooks. Each labeled (a), (b), (c). " +
                    "Each ≤ 16 words. Use pattern-interrupt, contrarian claim, or specific stat/promise.\n\n" +
                    "STORY:\n— A 4–6 sentence story bridging hook to offer. Pull from the user's actual stories above. " +
                    "Calm, deliberate, vivid. Use the user's voice from the Brand Voice profile.\n\n" +
                    "OFFER:\n— One paragraph (3–4 sentences). Name the transformation, the method, and the single clear next step. " +
                    "End with a specific, gentle call-to-action.\n\n" +
                    "Return only those three sections. No preamble.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, "hso_bundle", t)
            });
        } finally { setBusy(false); }
    }

    return (
        <Section eyebrow="Hook · Story · Offer" title="Assemble the message." helper={HSO_INTRO}>
            {/* AI generator */}
            <div className="dark-cinematic-panel p-7 md:p-8 mb-7">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Generate</div>
                        <h3 className="font-serif text-2xl">Auto-compose a Hook · Story · Offer from your inputs.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">Uses your Brand Voice + Story Bank + Hero's Journey. Then refine each piece below.</p>
                    </div>
                    <Button onClick={generateHSO} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="generate-hso-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate HSO bundle</>}
                    </Button>
                </div>
                {getInput(STEP_NUM, "hso_bundle") && (
                    <div className="mt-6 border-t border-white/10 pt-5">
                        <div className="label-eyebrow text-brand-gold mb-2">Generated bundle</div>
                        <div className="rounded-xl bg-brand-cream text-brand-charcoal p-4 md:p-5">
                            <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey="hso_bundle"
                                fieldLabel="Hook · Story · Offer bundle (editable)"
                                subModule="Hook-Story-Offer"
                                rows={10}
                                value={getInput(STEP_NUM, "hso_bundle")} onChange={(v) => setInput(STEP_NUM, "hso_bundle", v)}
                                testIdPrefix="hso-bundle-field"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Per-field refinement */}
            <div className="space-y-7">
                {HSO_FIELDS.map((f) => (
                    <div key={f.key}>
                        <div className="label-eyebrow mb-1.5">{f.label}</div>
                        <p className="text-xs text-muted-foreground mb-2">{f.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={f.key} fieldLabel={`${f.label} — ${f.helper}`} subModule="Hook-Story-Offer"
                            rows={f.key === "hso_story" ? 5 : 3}
                            value={getInput(STEP_NUM, f.key)} onChange={(v) => setInput(STEP_NUM, f.key, v)} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

// =================== IMPORTANT STORIES (Distillation) ===================
function Distillation({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);

    async function synthesizeElevator() {
        const voice = getInput(STEP_NUM, "brand_voice_statement") || "";
        const storyHighlights = STORY_BANK_PROMPTS.map((p) => {
            const v = getInput(STEP_NUM, p.key);
            return v ? `${p.label}: ${v}` : null;
        }).filter(Boolean).join("\n");
        const transformation = getInput(STEP_NUM, "dist_transformation_promise") || "";
        const hso = getInput(STEP_NUM, "hso_bundle") || "";

        if (!storyHighlights && !transformation) {
            toast.error("Draft a transformation promise and a few stories first.");
            return;
        }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "dist_elevator",
                field_label: "200-word Elevator Pitch",
                extra_context: { voice, storyHighlights, transformation, hso },
                instructions:
                    "Write a single 200-word elevator pitch (180–220 words) for this brand. " +
                    "Present-tense, in the user's Brand Voice. Use this arc: the world I serve → the rupture I name → the new path I offer → the result. " +
                    "Weave in concrete details from the user's stories. End with a single, specific invitation. Return only the paragraph.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "dist_elevator", t)
            });
        } finally { setBusy(false); }
    }

    return (
        <Section eyebrow="Important Stories" title="Distill the whole." helper="Two artifacts you'll reuse forever: a one-line transformation promise, and a 200-word elevator pitch.">
            <div className="space-y-8">
                {DISTILLATION_PROMPTS.map((p) => {
                    const isElevator = p.key === "dist_elevator";
                    return (
                        <div key={p.key}>
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                                <div className="label-eyebrow">{p.label}</div>
                                {isElevator && (
                                    <Button onClick={synthesizeElevator} disabled={busy} variant="outline" className="rounded-full" data-testid="synthesize-elevator-button">
                                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Synthesize</>}
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{p.helper}</p>
                            <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={p.key} fieldLabel={`${p.label} — ${p.helper}`} subModule="Important Stories"
                                rows={isElevator ? 8 : 3}
                                value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

// =================== OUTPUT ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const [marking, setMarking] = useState(false);
    const data = {
        voice: getInput(STEP_NUM, "brand_voice_statement"),
        promise: getInput(STEP_NUM, "dist_transformation_promise"),
        elevator: getInput(STEP_NUM, "dist_elevator"),
        hso: getInput(STEP_NUM, "hso_bundle"),
        hook: getInput(STEP_NUM, "hso_hook"),
        story: getInput(STEP_NUM, "hso_story"),
        offer: getInput(STEP_NUM, "hso_offer")
    };

    const storiesFilled = STORY_BANK_PROMPTS.filter((p) => (getInput(STEP_NUM, p.key) || "").trim().length > 0).length;
    const founderStages = HEROS_JOURNEY_STAGES.filter((s) => (getInput(STEP_NUM, `${s.key}__founder`) || "").trim().length > 0).length;
    const customerStages = HEROS_JOURNEY_STAGES.filter((s) => (getInput(STEP_NUM, `${s.key}__customer`) || "").trim().length > 0).length;

    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(STEP_NUM, "complete");
            toast.success("Step 3 marked complete.");
            const next = STEPS.find((s) => s.num === 4);
            gotoStep(next);
        } finally { setMarking(false); }
    }

    return (
        <Section eyebrow="Your Output" title="FRAME Your Story Card" helper="Edit anything by jumping back to the relevant tab. This card is your story HQ.">
            <div className="editorial-card p-7 md:p-8" data-testid="step3-output-card">
                <Field label="Transformation Promise" value={data.promise} />
                <Field label="Brand Voice" value={data.voice} multiline />

                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Hook · Story · Offer</div>
                    {(data.hook || data.story || data.offer) ? (
                        <div className="space-y-3">
                            {data.hook && <BlockRow label="Hook" value={data.hook} />}
                            {data.story && <BlockRow label="Story" value={data.story} />}
                            {data.offer && <BlockRow label="Offer" value={data.offer} />}
                        </div>
                    ) : data.hso ? (
                        <div className="editorial-card p-4 bg-secondary/30 whitespace-pre-wrap text-sm leading-relaxed" data-testid="output-hso-bundle">{data.hso}</div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Generate or write your HSO bundle on the Hook · Story · Offer tab.</p>
                    )}
                </div>

                <Field label="200-word Elevator Pitch" value={data.elevator} multiline />

                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Coverage</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <Stat label="Story Bank" value={`${storiesFilled} / 9`} testId="output-stat-stories" />
                        <Stat label="Founder Journey" value={`${founderStages} / 12`} testId="output-stat-founder" />
                        <Stat label="Customer Journey" value={`${customerStages} / 12`} testId="output-stat-customer" />
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={complete} disabled={marking} className="cta-red rounded-full h-11 px-6" data-testid="complete-step3-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 3 → Begin Step 4 <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
            </div>
        </Section>
    );
}

function Field({ label, value, multiline }) {
    return (
        <div className="py-3">
            <div className="label-eyebrow text-brand-bronze mb-1">{label}</div>
            <div className={multiline ? "text-sm leading-relaxed whitespace-pre-wrap" : "font-serif text-lg italic"}>
                {value || <span className="text-muted-foreground">—</span>}
            </div>
        </div>
    );
}

function BlockRow({ label, value }) {
    return (
        <div className="editorial-card p-4 bg-secondary/30">
            <div className="label-eyebrow text-brand-bronze mb-1">{label}</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{value}</div>
        </div>
    );
}

function Stat({ label, value, testId }) {
    return (
        <div className="editorial-card p-3 text-center" data-testid={testId}>
            <div className="font-serif text-2xl">{value}</div>
            <div className="label-eyebrow text-brand-bronze mt-1 text-[10px]">{label}</div>
        </div>
    );
}

// Helper: streaming generate (mirrors StepDefine.streamingGenerate)
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
