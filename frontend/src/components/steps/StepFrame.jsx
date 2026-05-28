import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sparkles, Mic, BookOpen, Compass, Megaphone, Quote, Check, Loader2,
    ArrowRight, ArrowLeft, ChevronRight, User as UserIcon, Users, Plus, Trash2, Wand2, DollarSign
} from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { streamAIText } from "@/lib/streamAI";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { STEPS } from "@/lib/steps";
import {
    BRAND_VOICE_PROMPTS, STORY_BANK_PROMPTS, HEROS_JOURNEY_STAGES, HEROS_JOURNEY_IMAGE,
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

    const goToTab = (key) => { setTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); };
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

function persist(planId, fieldKey, value) {
    if (!planId) return;
    authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: fieldKey, value }) }).catch(() => {});
}

// =================== BRAND VOICE (unchanged from prior) ===================
function BrandVoice({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);
    const synth = getInput(STEP_NUM, "brand_voice_statement");

    async function synthesizeVoice() {
        const answers = BRAND_VOICE_PROMPTS.map((p, i) => {
            const v = getInput(STEP_NUM, p.key);
            return v ? `Q${i + 1}: ${p.q}\n=> ${v}` : null;
        }).filter(Boolean).join("\n\n");
        if (!answers) { toast.error("Answer a few questions before synthesizing your Brand Voice."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "brand_voice_statement", field_label: "Synthesized Brand Voice Profile",
                extra_context: { answers },
                instructions:
                    "From these reflections, write a Brand Voice Profile in 3 parts (each part separated by a blank line, no markdown headings):\n" +
                    "PART 1 — VOICE IN ONE LINE: a single sentence capturing the brand's voice (10–18 words).\n" +
                    "PART 2 — VOICE PROFILE: a tight 4-sentence paragraph describing tone, cadence, vocabulary, and emotional register.\n" +
                    "PART 3 — WE SAY / WE DON'T SAY: two parallel mini-lists, exactly 4 items each, prefixed with 'We say:' and 'We don't say:'.\n" +
                    "Return only the three parts in order. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "brand_voice_statement", t)
            });
        } finally { setBusy(false); }
    }

    return (
        <Section eyebrow="Brand Voice" title="How your brand sounds out loud." helper="Ten short reflections. When you're ready, synthesize a voice profile you can reuse on every page.">
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
                            rows={3} value={getInput(STEP_NUM, p.key)} onChange={(v) => setInput(STEP_NUM, p.key, v)} />
                    </div>
                ))}
            </div>
            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Synthesize</div>
                        <h3 className="font-serif text-2xl">Distill your reflections into a Brand Voice profile.</h3>
                    </div>
                    <Button onClick={synthesizeVoice} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="synthesize-brand-voice-button">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Synthesize my Brand Voice</>}
                    </Button>
                </div>
                <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="label-eyebrow text-brand-gold mb-2">Your Brand Voice</div>
                    <div className="rounded-xl bg-brand-cream text-brand-charcoal p-4 md:p-5">
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey="brand_voice_statement"
                            fieldLabel="Your Brand Voice profile" subModule="Brand Voice"
                            rows={10}
                            placeholder="Click 'Synthesize my Brand Voice' above, or write it yourself."
                            value={synth} onChange={(v) => setInput(STEP_NUM, "brand_voice_statement", v)}
                            testIdPrefix="brand-voice-profile-field"
                        />
                    </div>
                </div>
            </div>
        </Section>
    );
}

// =================== STORY BANK — MTP-style tabs ===================
function StoryBank({ planId, getInput, setInput }) {
    const [active, setActive] = useState(STORY_BANK_PROMPTS[0].key);

    const statuses = STORY_BANK_PROMPTS.map((cat) => {
        const filled = cat.questions.filter((q) => (getInput(STEP_NUM, `${cat.key}_${q.key}`) || "").trim().length > 0).length;
        return { key: cat.key, label: cat.short, done: filled >= 1, filled, total: cat.questions.length };
    });
    const completedCount = statuses.filter((s) => s.done).length;

    const activeIdx = STORY_BANK_PROMPTS.findIndex((c) => c.key === active);
    const nextCat = activeIdx < STORY_BANK_PROMPTS.length - 1 ? STORY_BANK_PROMPTS[activeIdx + 1] : null;

    return (
        <Section eyebrow="Story Bank" title="The reservoir." helper="Nine categories. Each question is its own field — break your memories into small, specific pieces. Raw is fine.">
            <div className="flex flex-wrap gap-2 mb-5" data-testid="story-category-chips">
                {statuses.map((s) => (
                    <button key={s.key} onClick={() => setActive(s.key)}
                        className={`text-xs uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${active === s.key ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : s.done ? "bg-brand-gold/10 border-brand-gold text-brand-bronze" : "hover:bg-secondary"}`}
                        data-testid={`story-cat-${s.key}-button`}>
                        {s.done && <Check className="h-3 w-3" />}
                        {s.label}
                    </button>
                ))}
                <span className="text-xs text-muted-foreground self-center ml-2" data-testid="story-completion-counter">{completedCount} of {STORY_BANK_PROMPTS.length} touched</span>
            </div>

            {STORY_BANK_PROMPTS.filter((c) => c.key === active).map((c) => (
                <div key={c.key}>
                    <p className="text-sm text-muted-foreground mb-5">{c.intro}</p>
                    <div className="space-y-5">
                        {c.questions.map((q, i) => (
                            <div key={q.key}>
                                <div className="font-serif text-base mb-1.5">{i + 1}. {q.q}</div>
                                <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                    fieldKey={`${c.key}_${q.key}`}
                                    fieldLabel={`${c.label} — ${q.q}`}
                                    subModule={`Story Bank · ${c.label}`}
                                    rows={3}
                                    value={getInput(STEP_NUM, `${c.key}_${q.key}`)}
                                    onChange={(v) => setInput(STEP_NUM, `${c.key}_${q.key}`, v)} />
                            </div>
                        ))}
                    </div>
                    {nextCat && (
                        <div className="mt-7 flex justify-end" data-testid="story-category-nav">
                            <Button onClick={() => { setActive(nextCat.key); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full" variant="outline" data-testid={`story-next-cat-${nextCat.key}-button`}>
                                Next: {nextCat.label} <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>
            ))}
        </Section>
    );
}

// =================== HERO'S JOURNEY — image-anchored with wedge highlights ===================
function HeroJourney({ planId, getInput, setInput }) {
    const [persona, setPersona] = useState("founder");
    const [synthesizing, setSynthesizing] = useState(false);
    const keyFor = (stage) => `${stage.key}__${persona}`;
    const filledCount = HEROS_JOURNEY_STAGES.filter((s) => (getInput(STEP_NUM, keyFor(s)) || "").trim().length > 0).length;
    const narrationKey = `hero_journey_${persona}_narration`;
    const narration = getInput(STEP_NUM, narrationKey) || "";

    async function synthesizeNarration() {
        if (synthesizing) return;
        if (filledCount < 3) {
            toast.message("Add a few stages first", { description: "Draft at least 3 stages before synthesizing the narration." });
            return;
        }
        setSynthesizing(true);
        try {
            const stages = HEROS_JOURNEY_STAGES.map((s) => {
                const v = (getInput(STEP_NUM, keyFor(s)) || "").trim();
                return v ? `Stage ${s.stage} — ${s.label}: ${v}` : null;
            }).filter(Boolean).join("\n");
            const who = persona === "founder" ? "the founder's own journey" : "the dream customer's transformation journey";
            const final = await streamAIText("/ai/synthesize", {
                plan_id: planId,
                step_num: STEP_NUM,
                field_key: narrationKey,
                field_label: `Hero's Journey narration — ${persona === "founder" ? "Founder" : "Customer"}`,
                sub_module: `Hero's Journey · ${persona === "founder" ? "Founder" : "Customer"}`,
                instructions: `Synthesize a 4-paragraph cinematic narration of ${who}, woven from the 12 hero's journey stages below. Use second person ("you") and present tense for the customer journey; use third or first person for the founder journey — pick whichever feels most authentic. Each paragraph should cover 3 stages. Premium editorial tone. No headings, no bullet points — just flowing prose. STAGES:\n${stages}`,
            });
            if (final) {
                setInput(STEP_NUM, narrationKey, final);
                authedFetch(`/plans/${planId}/inputs`, { method: "POST", body: JSON.stringify({ step_num: STEP_NUM, field_key: narrationKey, value: final }) });
                toast.success(`${persona === "founder" ? "Founder" : "Customer"} narration synthesized.`);
            }
        } catch (e) {
            toast.error(e.message || "Could not synthesize narration.");
        } finally {
            setSynthesizing(false);
        }
    }

    return (
        <Section eyebrow="Hero's Journey" title="12-Stages of Discovery" helper={FRAME_HEROS_JOURNEY_INTRO}>
            <div className="flex flex-wrap items-center gap-2 mb-6" data-testid="hj-persona-switch">
                <button onClick={() => setPersona("founder")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${persona === "founder" ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                    data-testid="hj-persona-founder">
                    <UserIcon className="h-4 w-4" /> Founder's Journey
                </button>
                <button onClick={() => setPersona("customer")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition ${persona === "customer" ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                    data-testid="hj-persona-customer">
                    <Users className="h-4 w-4" /> Customer's Journey
                </button>
                <span className="text-xs text-muted-foreground self-center ml-2" data-testid="hj-progress">{filledCount} of 12 stages drafted</span>
                <Button onClick={synthesizeNarration} disabled={synthesizing} size="sm" className="ml-auto rounded-full" variant="outline" data-testid={`hj-synthesize-${persona}-button`}>
                    {synthesizing ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Synthesizing…</> : <><Sparkles className="h-3.5 w-3.5 mr-2" /> Synthesize {persona === "founder" ? "Founder" : "Customer"} Narration</>}
                </Button>
            </div>

            {narration && (
                <div className="editorial-card p-5 md:p-6 mb-6 bg-brand-charcoal text-brand-cream" data-testid={`hj-narration-${persona}`}>
                    <div className="label-eyebrow text-brand-gold mb-2">{persona === "founder" ? "Your Founder's Journey" : "Your Customer's Journey"} · AI synthesis</div>
                    <p className="font-serif text-base md:text-lg leading-relaxed whitespace-pre-line">{narration}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                <div className="lg:col-span-5">
                    <div className="editorial-card p-3 sticky top-32" data-testid="hj-image-card">
                        <HeroJourneyImageWithOverlay
                            stages={HEROS_JOURNEY_STAGES}
                            isFilled={(s) => (getInput(STEP_NUM, keyFor(s)) || "").trim().length > 0}
                        />
                        <p className="text-[11px] text-muted-foreground text-center mt-2">© 2023 Dr. Brandt R. Gibson</p>
                    </div>
                </div>
                <div className="lg:col-span-7 space-y-5" data-testid="hj-stages-list">
                    {HEROS_JOURNEY_STAGES.map((s) => (
                        <div key={s.key} className="editorial-card p-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-7 w-7 rounded-full bg-brand-gold/20 text-brand-bronze grid place-items-center font-serif text-sm shrink-0">{s.stage}</div>
                                <div className="font-serif text-lg">{s.label}</div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{s.helper}</p>
                            <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                fieldKey={keyFor(s)}
                                fieldLabel={`${s.label} — ${s.helper}`}
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

/**
 * HeroJourneyImageWithOverlay
 * Renders the Hero's Journey artwork with a 13-wedge SVG overlay aligned to the wheel.
 * Wedges are each 27.69° (= 360° / 13). Wedge 1 is centered at NORTH (12 o'clock), then
 * clockwise through wedge 13. Wedges 1–12 highlight gold when the matching stage field
 * is filled; wedge 13 stays decorative.
 */
function HeroJourneyImageWithOverlay({ stages, isFilled }) {
    const cx = 50, cy = 50;
    const rInner = 21;   // inside the inner mentor disc
    const rOuter = 50;   // matches the wheel rim
    const NUM = 12;
    const wedgeDeg = 360 / NUM; // 30°

    // SVG coordinate convention: 0° points east. We want wedge 1 centered at north,
    // so we offset by -90° (= 270°) and rotate clockwise.
    function wedgePath(idx /* 1-indexed */) {
        const centerSvg = (idx - 1) * wedgeDeg - 90; // degrees
        const startSvg = centerSvg - wedgeDeg / 2;
        const endSvg = centerSvg + wedgeDeg / 2;
        const sa = (startSvg * Math.PI) / 180;
        const ea = (endSvg * Math.PI) / 180;
        const x1 = cx + rOuter * Math.cos(sa);
        const y1 = cy + rOuter * Math.sin(sa);
        const x2 = cx + rOuter * Math.cos(ea);
        const y2 = cy + rOuter * Math.sin(ea);
        const x3 = cx + rInner * Math.cos(ea);
        const y3 = cy + rInner * Math.sin(ea);
        const x4 = cx + rInner * Math.cos(sa);
        const y4 = cy + rInner * Math.sin(sa);
        return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 0 0 ${x4} ${y4} Z`;
    }

    return (
        <div className="relative" data-testid="hj-overlay-wrap">
            <img src={HEROS_JOURNEY_IMAGE} alt="The Hero's Journey — 12 stages" className="w-full h-auto rounded-md block" data-testid="hj-image" />
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
                data-testid="hj-overlay-svg"
            >
                <defs>
                    <radialGradient id="hj-wedge-active" cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor="rgb(212, 175, 55)" stopOpacity="0.55" />
                        <stop offset="100%" stopColor="rgb(212, 175, 55)" stopOpacity="0.30" />
                    </radialGradient>
                </defs>
                {Array.from({ length: NUM }, (_, i) => {
                    const idx = i + 1; // 1..12
                    const stage = stages[i];
                    const active = stage ? isFilled(stage) : false;
                    return (
                        <path
                            key={idx}
                            d={wedgePath(idx)}
                            fill={active ? "url(#hj-wedge-active)" : "transparent"}
                            stroke={active ? "rgba(20, 16, 12, 0.95)" : "transparent"}
                            strokeWidth={active ? 1.2 : 0}
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            data-testid={`hj-wedge-${idx}${active ? "-active" : ""}`}
                        />
                    );
                })}
            </svg>
        </div>
    );
}

// =================== Offers shared helpers ===================
function readOfferIds(getInput) {
    try {
        const raw = getInput(STEP_NUM, "offer_ids");
        const arr = raw ? JSON.parse(raw) : null;
        if (Array.isArray(arr) && arr.length > 0) return arr;
    } catch { /* fall through */ }
    return ["offer_1"];
}

function writeOfferIds(ids, planId, setInput) {
    const json = JSON.stringify(ids);
    setInput(STEP_NUM, "offer_ids", json);
    persist(planId, "offer_ids", json);
}

function offerName(id, getInput, idx) {
    const n = getInput(STEP_NUM, `${id}_name`);
    return n && n.trim() ? n : `Offer ${idx + 1}`;
}

function _newRowId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `r_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Parse raw stack JSON into row objects, ensuring each row has a stable _id. */
function parseStackJson(rawJson) {
    let arr = null;
    try {
        const parsed = rawJson ? JSON.parse(rawJson) : null;
        if (Array.isArray(parsed) && parsed.length > 0) arr = parsed;
    } catch { /* fall through */ }
    if (!arr) arr = [{ item: "", benefit: "", value: "" }];
    return arr.map((r) => (r && r._id ? r : { ...r, _id: _newRowId() }));
}

function readStack(getInput, id) {
    return parseStackJson(getInput(STEP_NUM, `${id}_stack`));
}

// =================== HOOK-STORY-OFFER (multi-offer) ===================
function HookStoryOffer({ planId, getInput, setInput }) {
    const offerIds = readOfferIds(getInput);
    const [active, setActive] = useState(offerIds[0]);
    if (!offerIds.includes(active)) setActive(offerIds[0]);

    function addOffer() {
        const id = `offer_${Date.now()}`;
        writeOfferIds([...offerIds, id], planId, setInput);
        setActive(id);
        toast.success("New offer added.");
    }
    function removeOffer(id) {
        if (offerIds.length <= 1) { toast.error("Keep at least one offer."); return; }
        const next = offerIds.filter((x) => x !== id);
        writeOfferIds(next, planId, setInput);
        setActive(next[0]);
    }

    return (
        <Section eyebrow="Hook · Story · Offer" title="Build offers, then assemble the message." helper={HSO_INTRO}>
            <div className="flex flex-wrap items-center gap-2 mb-5" data-testid="offers-chips">
                {offerIds.map((id, i) => (
                    <button key={id} onClick={() => setActive(id)}
                        className={`text-sm px-4 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${active === id ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                        data-testid={`offer-chip-${id}`}>
                        {offerName(id, getInput, i)}
                    </button>
                ))}
                <Button variant="outline" onClick={addOffer} className="rounded-full" data-testid="offer-add-button">
                    <Plus className="h-4 w-4 mr-1.5" /> Add offer
                </Button>
            </div>

            {offerIds.filter((id) => id === active).map((id, idx) => (
                <OfferEditor key={id} id={id} idx={offerIds.indexOf(id)} planId={planId}
                    getInput={getInput} setInput={setInput}
                    onRemove={() => removeOffer(id)}
                    canRemove={offerIds.length > 1}
                />
            ))}
        </Section>
    );
}

function OfferEditor({ id, idx, planId, getInput, setInput, onRemove, canRemove }) {
    const [pane, setPane] = useState("details"); // details | message
    const stackJson = getInput(STEP_NUM, `${id}_stack`) || "";
    // Memoize on the raw JSON so _id values stay stable across re-renders.
    const stack = useMemo(() => parseStackJson(stackJson), [stackJson]);

    function updateStack(next) {
        const json = JSON.stringify(next);
        setInput(STEP_NUM, `${id}_stack`, json);
        persist(planId, `${id}_stack`, json);
    }
    function updateStackRow(rowId, field, value) {
        const next = stack.map((r) => r._id === rowId ? { ...r, [field]: value } : r);
        updateStack(next);
    }
    function addStackRow() {
        updateStack([...stack, { item: "", benefit: "", value: "", _id: _newRowId() }]);
    }
    function removeStackRow(rowId) {
        updateStack(stack.filter((r) => r._id !== rowId));
    }

    const [busy, setBusy] = useState(false);
    const [suggestingStack, setSuggestingStack] = useState(false);
    const [suggestingPrice, setSuggestingPrice] = useState(false);

    async function suggestStack() {
        if (suggestingStack) return;
        setSuggestingStack(true);
        try {
            const offerN = offerName(id, getInput, idx);
            const offerDesc = getInput(STEP_NUM, `${id}_description`) || "";
            const voice = getInput(STEP_NUM, "brand_voice_statement") || "";
            const json = await streamAIText("/ai/generate", {
                plan_id: planId,
                step_num: STEP_NUM,
                field_key: `${id}_stack`,
                field_label: `Offer stack for ${offerN}`,
                sub_module: "Hook-Story-Offer",
                extra_context: { offer_name: offerN, description: offerDesc, brand_voice: voice },
                instructions:
                    "Generate 5–7 stack items that make up this offer's full deliverable bundle. " +
                    "Each item must be concrete (a thing they get), have a tangible benefit, and a dollar value. " +
                    "Return ONLY a JSON array of objects with keys `item` (string, max 60 chars), `benefit` (string, max 120 chars), `value` (string, e.g. \"$497\"). No markdown, no prose, no commentary — pure JSON array starting with [ and ending with ].",
            });
            // Strip code fences / commentary if model added any
            let cleaned = json.trim();
            const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]+?)```/);
            if (fenceMatch) cleaned = fenceMatch[1].trim();
            const startIdx = cleaned.indexOf("[");
            const endIdx = cleaned.lastIndexOf("]");
            if (startIdx >= 0 && endIdx > startIdx) cleaned = cleaned.slice(startIdx, endIdx + 1);
            let parsed;
            try { parsed = JSON.parse(cleaned); } catch (parseErr) { console.warn("stack JSON parse failed:", parseErr); }
            if (!Array.isArray(parsed) || parsed.length === 0) {
                toast.error("AI returned an unexpected format. Try again.");
                return;
            }
            const next = parsed.slice(0, 8).map((r) => ({
                item: String(r.item || "").slice(0, 120),
                benefit: String(r.benefit || "").slice(0, 200),
                value: String(r.value || "").slice(0, 40),
                _id: _newRowId(),
            }));
            updateStack(next);
            toast.success(`AI built a ${next.length}-item stack.`);
        } catch (e) {
            toast.error(e.message || "Could not suggest a stack.");
        } finally {
            setSuggestingStack(false);
        }
    }

    async function suggestPrice() {
        if (suggestingPrice) return;
        setSuggestingPrice(true);
        try {
            const offerN = offerName(id, getInput, idx);
            const stackText = stack.filter((r) => r.item || r.benefit || r.value).map((r, i) => `${i + 1}. ${r.item || "?"} — ${r.benefit || "?"} — value: ${r.value || "?"}`).join("\n") || "(empty)";
            const final = await streamAIText("/ai/synthesize", {
                plan_id: planId,
                step_num: STEP_NUM,
                field_key: `${id}_price`,
                field_label: `Smart price recommendation for ${offerN}`,
                sub_module: "Hook-Story-Offer",
                extra_context: { offer_name: offerN, stack: stackText },
                instructions:
                    "You are a premium offer pricing strategist. Analyze the offer and its stack using the user's full plan context (niche, dream customer demographics including income, psychographics, brand positioning). Output EXACTLY this format on three lines, no markdown:\n" +
                    "Range: $X – $Y\n" +
                    "Recommended: $Z\n" +
                    "Why: <one short sentence rationale, max 25 words>\n" +
                    "Use whole numbers, no decimals. Recommended must sit within Range. Pick prices that reflect the audience's income level and the total value of the stack.",
            });
            const recoMatch = final.match(/Recommended:\s*(\$?[\d,.]+)/i);
            if (recoMatch && recoMatch[1]) {
                const price = recoMatch[1].startsWith("$") ? recoMatch[1] : `$${recoMatch[1]}`;
                setInput(STEP_NUM, `${id}_price`, price);
                persist(planId, `${id}_price`, price);
            }
            // Persist the full rationale separately for the output card
            setInput(STEP_NUM, `${id}_price_rationale`, final);
            persist(planId, `${id}_price_rationale`, final);
            toast.success("AI suggested a price.", { description: final.split("\n").slice(0, 2).join(" · ") });
        } catch (e) {
            toast.error(e.message || "Could not suggest a price.");
        } finally {
            setSuggestingPrice(false);
        }
    }

    async function generateHookStory() {
        const stackText = stack.filter((r) => r.item || r.benefit || r.value).map((r, i) => `${i + 1}. ${r.item || "?"} — ${r.benefit || "?"} — value: ${r.value || "?"}`).join("\n");
        const price = getInput(STEP_NUM, `${id}_price`) || "";
        const offerN = offerName(id, getInput, idx);
        if (!stackText && !price) { toast.error("Fill in the stack and price first."); return; }
        const voice = getInput(STEP_NUM, "brand_voice_statement") || "";
        setBusy(true);
        try {
            const ctx = { offer_name: offerN, stack: stackText, price, voice };
            // Generate hook then story sequentially using two AI calls so each persists into its own field
            await streamingGenerate({
                field_key: `${id}_hook`, field_label: `Hook for offer ${offerN}`,
                extra_context: ctx,
                instructions:
                    "Write a single one-sentence HOOK for the offer described in extra_context. " +
                    "Maximum 16 words. Pattern-interrupt, contrarian claim, or specific stat/promise. " +
                    "Use the user's Brand Voice profile. Return only the sentence — no preamble, no quotes.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, `${id}_hook`, t)
            });
            await streamingGenerate({
                field_key: `${id}_story`, field_label: `Story for offer ${offerN}`,
                extra_context: ctx,
                instructions:
                    "Write a 4–6 sentence STORY that bridges hook to offer. " +
                    "Make it personal, vivid and emotionally resonant. " +
                    "Anchor it in the value stack and the price-vs-value gap. " +
                    "Use the user's Brand Voice. Return only the paragraph.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, `${id}_story`, t)
            });
            setPane("message");
        } finally { setBusy(false); }
    }

    return (
        <div className="editorial-card p-5 md:p-7" data-testid={`offer-editor-${id}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                <div className="flex-1 min-w-0">
                    <div className="label-eyebrow mb-1">Offer name</div>
                    <Input
                        value={getInput(STEP_NUM, `${id}_name`) || ""}
                        onChange={(e) => setInput(STEP_NUM, `${id}_name`, e.target.value)}
                        onBlur={(e) => persist(planId, `${id}_name`, e.target.value)}
                        placeholder={`Offer ${idx + 1}`}
                        className="rounded-xl h-11 max-w-md font-serif text-lg"
                        data-testid={`offer-${id}-name`}
                    />
                </div>
                {canRemove && (
                    <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-destructive" data-testid={`offer-${id}-remove`}>
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                )}
            </div>

            <div className="inline-flex p-1 rounded-full bg-secondary/60 mb-5" data-testid={`offer-${id}-pane-switch`}>
                <button onClick={() => setPane("details")}
                    className={`px-4 py-1.5 rounded-full text-sm ${pane === "details" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                    data-testid={`offer-${id}-pane-details`}>
                    1 · Stack & Price
                </button>
                <button onClick={() => setPane("message")}
                    className={`px-4 py-1.5 rounded-full text-sm ${pane === "message" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                    data-testid={`offer-${id}-pane-message`}>
                    2 · Hook & Story
                </button>
            </div>

            {pane === "details" && (
                <div>
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                        <div>
                            <div className="label-eyebrow">Offer Stack</div>
                            <p className="text-xs text-muted-foreground">Break the offer into items. For each: what they get, the benefit, and the dollar value of that piece.</p>
                        </div>
                        <Button onClick={suggestStack} disabled={suggestingStack} size="sm" variant="outline" className="rounded-full" data-testid={`offer-${id}-suggest-stack`}>
                            {suggestingStack ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Suggesting…</> : <><Wand2 className="h-3.5 w-3.5 mr-2" /> Suggest stack with AI</>}
                        </Button>
                    </div>
                    <div className="space-y-2 mt-2" data-testid={`offer-${id}-stack`}>
                        <div className="grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                            <div className="col-span-4">Item</div>
                            <div className="col-span-5">Benefit</div>
                            <div className="col-span-2">Value</div>
                            <div className="col-span-1"></div>
                        </div>
                        {stack.map((r, i) => (
                            <div key={r._id} className="grid grid-cols-12 gap-2">
                                <Input className="col-span-4 h-10 rounded-lg" value={r.item} onChange={(e) => updateStackRow(r._id, "item", e.target.value)} placeholder="e.g. 8-week coaching" data-testid={`offer-${id}-stack-item-${i}`} />
                                <Input className="col-span-5 h-10 rounded-lg" value={r.benefit} onChange={(e) => updateStackRow(r._id, "benefit", e.target.value)} placeholder="e.g. Done-with-you brand voice" data-testid={`offer-${id}-stack-benefit-${i}`} />
                                <Input className="col-span-2 h-10 rounded-lg" value={r.value} onChange={(e) => updateStackRow(r._id, "value", e.target.value)} placeholder="$2,000" data-testid={`offer-${id}-stack-value-${i}`} />
                                <button onClick={() => removeStackRow(r._id)} disabled={stack.length <= 1} className="col-span-1 grid place-items-center text-muted-foreground hover:text-destructive disabled:opacity-30" aria-label="Remove row" data-testid={`offer-${id}-stack-remove-${i}`}>
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addStackRow} className="rounded-full mt-2" data-testid={`offer-${id}-stack-add`}>
                            <Plus className="h-4 w-4 mr-1" /> Add line
                        </Button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="label-eyebrow">Final Price</div>
                                <Button onClick={suggestPrice} disabled={suggestingPrice} size="sm" variant="ghost" className="h-6 px-2 text-xs text-brand-bronze hover:text-brand-gold" data-testid={`offer-${id}-suggest-price`}>
                                    {suggestingPrice ? <Loader2 className="h-3 w-3 animate-spin" /> : <><DollarSign className="h-3 w-3 mr-1" /> Suggest with AI</>}
                                </Button>
                            </div>
                            <Input
                                value={getInput(STEP_NUM, `${id}_price`) || ""}
                                onChange={(e) => setInput(STEP_NUM, `${id}_price`, e.target.value)}
                                onBlur={(e) => persist(planId, `${id}_price`, e.target.value)}
                                placeholder="$997"
                                className="h-11 rounded-xl"
                                data-testid={`offer-${id}-price`}
                            />
                            {getInput(STEP_NUM, `${id}_price_rationale`) && (
                                <p className="text-[11px] text-muted-foreground mt-1.5 whitespace-pre-line">{getInput(STEP_NUM, `${id}_price_rationale`)}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-7 flex justify-end">
                        <Button onClick={generateHookStory} disabled={busy} className="cta-red rounded-full h-11 px-5" data-testid={`offer-${id}-next`}>
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next: Generate Hook & Story <ChevronRight className="h-4 w-4 ml-1" /></>}
                        </Button>
                    </div>
                </div>
            )}

            {pane === "message" && (
                <div className="space-y-6">
                    <div>
                        <div className="label-eyebrow mb-1.5">HOOK</div>
                        <p className="text-xs text-muted-foreground mb-2">One-sentence attention-grabber. Edit freely.</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM}
                            fieldKey={`${id}_hook`}
                            fieldLabel={`Hook for offer ${offerName(id, getInput, idx)}`}
                            subModule="Hook-Story-Offer"
                            rows={2}
                            value={getInput(STEP_NUM, `${id}_hook`)}
                            onChange={(v) => setInput(STEP_NUM, `${id}_hook`, v)} />
                    </div>
                    <div>
                        <div className="label-eyebrow mb-1.5">STORY</div>
                        <p className="text-xs text-muted-foreground mb-2">4–6 sentence bridge. Edit freely.</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM}
                            fieldKey={`${id}_story`}
                            fieldLabel={`Story for offer ${offerName(id, getInput, idx)}`}
                            subModule="Hook-Story-Offer"
                            rows={5}
                            value={getInput(STEP_NUM, `${id}_story`)}
                            onChange={(v) => setInput(STEP_NUM, `${id}_story`, v)} />
                    </div>
                    <div className="flex justify-between">
                        <Button variant="ghost" onClick={() => setPane("details")} data-testid={`offer-${id}-back`}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stack
                        </Button>
                        <Button onClick={generateHookStory} disabled={busy} variant="outline" className="rounded-full" data-testid={`offer-${id}-regenerate`}>
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Regenerate from Stack</>}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// =================== IMPORTANT STORIES — per-offer ===================
function Distillation({ planId, getInput, setInput }) {
    const offerIds = readOfferIds(getInput);
    const [active, setActive] = useState(offerIds[0]);
    if (!offerIds.includes(active)) setActive(offerIds[0]);

    return (
        <Section eyebrow="Important Stories" title="Distill each offer." helper="For every offer, generate a one-line Transformation Promise and a 200-word Elevator Pitch from everything you've entered. Always editable.">
            <div className="flex flex-wrap items-center gap-2 mb-6" data-testid="dist-offer-chips">
                {offerIds.map((id, i) => (
                    <button key={id} onClick={() => setActive(id)}
                        className={`text-sm px-4 py-1.5 rounded-full border inline-flex items-center gap-1.5 ${active === id ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                        data-testid={`dist-offer-chip-${id}`}>
                        {offerName(id, getInput, i)}
                    </button>
                ))}
            </div>

            {offerIds.filter((id) => id === active).map((id) => (
                <DistillationFor key={id} id={id} idx={offerIds.indexOf(id)} planId={planId} getInput={getInput} setInput={setInput} />
            ))}
        </Section>
    );
}

function DistillationFor({ id, idx, planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);
    const offerN = offerName(id, getInput, idx);

    async function autoFill() {
        const voice = getInput(STEP_NUM, "brand_voice_statement") || "";
        const storyHighlights = STORY_BANK_PROMPTS.flatMap((cat) => cat.questions.map((q) => {
            const v = getInput(STEP_NUM, `${cat.key}_${q.key}`);
            return v ? `[${cat.label}] ${q.q}\n=> ${v}` : null;
        })).filter(Boolean).join("\n");
        const stack = readStack(getInput, id).filter((r) => r.item || r.benefit || r.value).map((r, i) => `${i + 1}. ${r.item} — ${r.benefit} — value: ${r.value}`).join("\n");
        const price = getInput(STEP_NUM, `${id}_price`) || "";
        const hook = getInput(STEP_NUM, `${id}_hook`) || "";
        const story = getInput(STEP_NUM, `${id}_story`) || "";

        setBusy(true);
        try {
            const ctx = { offer_name: offerN, voice, storyHighlights, stack, price, hook, story };
            await streamingGenerate({
                field_key: `${id}_promise`, field_label: `Transformation Promise — ${offerN}`,
                extra_context: ctx,
                instructions:
                    "Write a single-sentence Transformation Promise for this offer. " +
                    "Format: from [old identity/state] to [new identity/state] — vivid and specific. " +
                    "Use the Brand Voice. Return only the sentence.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, `${id}_promise`, t)
            });
            await streamingGenerate({
                field_key: `${id}_elevator`, field_label: `200-word Elevator Pitch — ${offerN}`,
                extra_context: ctx,
                instructions:
                    "Write a 200-word elevator pitch (180–220 words) for this offer. " +
                    "Arc: world I serve → the rupture I name → the new path I offer → the result → a single specific invitation. " +
                    "Present-tense, in the user's Brand Voice. Weave in concrete story details. Return only the paragraph.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, `${id}_elevator`, t)
            });
        } finally { setBusy(false); }
    }

    return (
        <div className="editorial-card p-5 md:p-7" data-testid={`dist-for-${id}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <div className="font-serif text-2xl">{offerN}</div>
                <Button onClick={autoFill} disabled={busy} className="cta-red rounded-full" data-testid={`dist-${id}-autofill`}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> AI auto-fill from my plan</>}
                </Button>
            </div>
            <div className="space-y-7">
                <div>
                    <div className="label-eyebrow mb-1.5">Transformation Promise (1 line)</div>
                    <p className="text-xs text-muted-foreground mb-2">From [old identity/state] to [new identity/state].</p>
                    <AIAssistInput planId={planId} stepNum={STEP_NUM}
                        fieldKey={`${id}_promise`}
                        fieldLabel={`Transformation Promise — ${offerN}`}
                        subModule="Important Stories"
                        rows={3}
                        value={getInput(STEP_NUM, `${id}_promise`)}
                        onChange={(v) => setInput(STEP_NUM, `${id}_promise`, v)} />
                </div>
                <div>
                    <div className="label-eyebrow mb-1.5">200-word Elevator Pitch</div>
                    <p className="text-xs text-muted-foreground mb-2">A condensed, present-tense narrative.</p>
                    <AIAssistInput planId={planId} stepNum={STEP_NUM}
                        fieldKey={`${id}_elevator`}
                        fieldLabel={`Elevator Pitch — ${offerN}`}
                        subModule="Important Stories"
                        rows={8}
                        value={getInput(STEP_NUM, `${id}_elevator`)}
                        onChange={(v) => setInput(STEP_NUM, `${id}_elevator`, v)} />
                </div>
            </div>
        </div>
    );
}

// =================== OUTPUT — multi-offer ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const [marking, setMarking] = useState(false);
    const offerIds = readOfferIds(getInput);

    const storiesFilled = STORY_BANK_PROMPTS.filter((c) => c.questions.some((q) => (getInput(STEP_NUM, `${c.key}_${q.key}`) || "").trim().length > 0)).length;
    const founderStages = HEROS_JOURNEY_STAGES.filter((s) => (getInput(STEP_NUM, `${s.key}__founder`) || "").trim().length > 0).length;
    const customerStages = HEROS_JOURNEY_STAGES.filter((s) => (getInput(STEP_NUM, `${s.key}__customer`) || "").trim().length > 0).length;
    const voice = getInput(STEP_NUM, "brand_voice_statement");
    const founderNarration = getInput(STEP_NUM, "hero_journey_founder_narration") || "";
    const customerNarration = getInput(STEP_NUM, "hero_journey_customer_narration") || "";

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
                <Field label="Brand Voice" value={voice} multiline />

                {(founderNarration || customerNarration) && (
                    <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="output-journeys">
                        {founderNarration && (
                            <div className="rounded-xl bg-brand-charcoal text-brand-cream p-5">
                                <div className="label-eyebrow text-brand-gold mb-2">Founder's Journey</div>
                                <p className="text-sm leading-relaxed whitespace-pre-line font-serif">{founderNarration}</p>
                            </div>
                        )}
                        {customerNarration && (
                            <div className="rounded-xl bg-brand-charcoal text-brand-cream p-5">
                                <div className="label-eyebrow text-brand-gold mb-2">Customer's Journey</div>
                                <p className="text-sm leading-relaxed whitespace-pre-line font-serif">{customerNarration}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Offers ({offerIds.length})</div>
                    <div className="space-y-5" data-testid="output-offers">
                        {offerIds.map((id, idx) => {
                            const stack = readStack(getInput, id).filter((r) => r.item || r.benefit || r.value);
                            const price = getInput(STEP_NUM, `${id}_price`);
                            const priceRationale = getInput(STEP_NUM, `${id}_price_rationale`);
                            const hook = getInput(STEP_NUM, `${id}_hook`);
                            const story = getInput(STEP_NUM, `${id}_story`);
                            const promise = getInput(STEP_NUM, `${id}_promise`);
                            const elevator = getInput(STEP_NUM, `${id}_elevator`);
                            return (
                                <div key={id} className="editorial-card p-5 bg-secondary/30" data-testid={`output-offer-${id}`}>
                                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                        <div className="font-serif text-2xl">{offerName(id, getInput, idx)}</div>
                                        {price && <div className="text-brand-bronze font-serif text-xl">{price}</div>}
                                    </div>
                                    {priceRationale && <p className="text-[11px] text-muted-foreground mt-1 italic whitespace-pre-line">{priceRationale}</p>}
                                    {stack.length > 0 && (
                                        <div className="mt-3">
                                            <div className="label-eyebrow text-brand-bronze mb-1.5">Stack</div>
                                            <ul className="text-sm space-y-1">
                                                {stack.map((r) => (
                                                    <li key={r._id || `${r.item}-${r.benefit}-${r.value}`} className="flex gap-2"><span className="text-brand-bronze">·</span><span className="flex-1"><span className="font-medium">{r.item}</span>{r.benefit && <> — <span className="text-muted-foreground">{r.benefit}</span></>}{r.value && <> · <span className="text-brand-bronze">{r.value}</span></>}</span></li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {hook && <Sub label="Hook" value={hook} />}
                                    {story && <Sub label="Story" value={story} />}
                                    {promise && <Sub label="Transformation Promise" value={promise} />}
                                    {elevator && <Sub label="Important Story — Elevator Pitch" value={elevator} />}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Coverage</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <Stat label="Story Bank" value={`${storiesFilled} / 9`} testId="output-stat-stories" />
                        <Stat label="Founder Journey" value={`${founderStages} / 12`} testId="output-stat-founder" />
                        <Stat label="Customer Journey" value={`${customerStages} / 12`} testId="output-stat-customer" />
                    </div>
                </div>

                {/* Full Story Bank — 9 sections */}
                <div className="py-3 mt-2 border-t border-border pt-6" data-testid="output-story-bank">
                    <div className="label-eyebrow text-brand-bronze mb-3">Story Bank · Full Archive</div>
                    <div className="space-y-5">
                        {STORY_BANK_PROMPTS.map((cat) => {
                            const entries = cat.questions.map((q) => ({ q: q.q || q.prompt || q.label, v: getInput(STEP_NUM, `${cat.key}_${q.key}`) || "" })).filter((e) => e.v.trim().length > 0);
                            if (entries.length === 0) return null;
                            return (
                                <div key={cat.key} className="rounded-xl bg-secondary/30 p-4" data-testid={`story-bank-section-${cat.key}`}>
                                    <div className="font-serif text-lg mb-2">{cat.label || cat.title || cat.key}</div>
                                    <ul className="space-y-2">
                                        {entries.map((e, i) => (
                                            <li key={i} className="text-sm">
                                                {e.q && <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-0.5">{e.q}</div>}
                                                <div className="leading-relaxed whitespace-pre-wrap">{e.v}</div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                        {STORY_BANK_PROMPTS.every((cat) => cat.questions.every((q) => !(getInput(STEP_NUM, `${cat.key}_${q.key}`) || "").trim())) && (
                            <p className="text-sm text-muted-foreground italic">No stories drafted yet — fill in the Story Bank tab to populate this archive.</p>
                        )}
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

function Sub({ label, value }) {
    return (
        <div className="mt-3 pt-3 border-t border-border/50">
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
