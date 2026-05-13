import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
    Sparkles, Palette, Mail, FileText, Mic, Video, Users, Globe,
    Wrench, Bot, Calendar as CalendarIcon, Check, Loader2,
    ArrowRight, ArrowLeft, ChevronRight, Crown
} from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { Input } from "@/components/ui/input";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { STEPS } from "@/lib/steps";
import {
    BRAND_ARCHETYPES, POCKET_MEDIA_CHANNELS, POCKET_MEDIA_FIELDS,
    WEBSITE_HUB_TEMPLATES, MARKETING_TRACKS, MARKETING_TRACK_FIELDS,
    CALENDAR_PHASES, CALENDAR_PILLARS, IGNITE_INTROS, IGNITE_JUNG_QUOTE
} from "@/lib/framework";

const STEP_NUM = 4;

const CHANNEL_ICON = { newsletter: Mail, blog: FileText, podcast: Mic, video: Video, events: Users };

const TAB_ORDER = ["personality", "media", "site", "plan", "calendar", "output"];
const TAB_LABELS = {
    personality: "Brand Personality",
    media: "Pocket Media Empire",
    site: "Website Hub",
    plan: "Marketing Plan",
    calendar: "30/60/90 Calendar",
    output: "Your Output"
};

export default function StepIgnite({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("personality");
    const planId = plan.id;

    const goToTab = (key) => { setTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-ignite">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 04 · Pro</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">IGNITE Your Brand</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                    Archetype. Channels. Website. Marketing tracks. A 90-day cadence. The visible body of your brand — designed on purpose, not by accident.
                </p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["personality", Crown,        "Brand Personality"],
                        ["media",       Mic,          "Pocket Media Empire"],
                        ["site",        Globe,        "Website Hub"],
                        ["plan",        Wrench,       "Marketing Plan"],
                        ["calendar",    CalendarIcon, "30/60/90 Calendar"],
                        ["output",      Check,        "Your Output"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`ignite-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="personality"><BrandPersonality planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="media"><PocketMediaEmpire planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="site"><WebsiteHub planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="plan"><MarketingPlan planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="calendar"><ContentCalendar planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {tab !== "output" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="ignite-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="ignite-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="ignite-next-button">
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

// =================== BRAND PERSONALITY ===================
function BrandPersonality({ planId, getInput, setInput }) {
    const primary = getInput(STEP_NUM, "archetype_primary");
    const secondary = getInput(STEP_NUM, "archetype_secondary");
    const [paletteBusy, setPaletteBusy] = useState(false);
    const [typoBusy, setTypoBusy] = useState(false);

    function pickArchetype(slot, key) {
        const field = slot === "primary" ? "archetype_primary" : "archetype_secondary";
        setInput(STEP_NUM, field, key);
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: field, value: key }) }).catch(() => {});
    }

    async function generatePalettes() {
        if (!primary) { toast.error("Pick a primary archetype first."); return; }
        setPaletteBusy(true);
        try {
            const primaryArch = BRAND_ARCHETYPES.find((a) => a.key === primary);
            const secondaryArch = BRAND_ARCHETYPES.find((a) => a.key === secondary);
            await streamingGenerate({
                field_key: "palettes_json",
                field_label: "Three color palette options",
                extra_context: { primary: primaryArch, secondary: secondaryArch },
                instructions:
                    "Generate exactly 3 distinct color palettes for this brand, returned as JSON only (no markdown). " +
                    "Each palette must have: name (string, 1–3 words), mood (string, 1 sentence), colors (array of exactly 5 hex strings: primary, secondary, accent, neutral_dark, neutral_light). " +
                    "Palettes should feel deliberate and editorial (not generic). Anchor in the archetype's vibe. " +
                    "Return as: {\"palettes\": [{\"name\": \"\", \"mood\": \"\", \"colors\": [\"#...\", ...]}, ...]}. JSON only.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, "palettes_json", t)
            });
        } finally { setPaletteBusy(false); }
    }

    async function generateTypography() {
        if (!primary) { toast.error("Pick a primary archetype first."); return; }
        setTypoBusy(true);
        try {
            const primaryArch = BRAND_ARCHETYPES.find((a) => a.key === primary);
            await streamingGenerate({
                field_key: "typography_json",
                field_label: "Three typography pairings",
                extra_context: { primary: primaryArch },
                instructions:
                    "Generate exactly 3 distinct typography pairings for this brand, returned as JSON only (no markdown). " +
                    "Each pairing must have: name (1–3 words describing the feel), heading (Google Font family name), body (Google Font family name), rationale (1 sentence on why it fits the archetype). " +
                    "Only use widely available Google Fonts. Avoid system-ui. " +
                    "Return: {\"pairings\": [{\"name\": \"\", \"heading\": \"\", \"body\": \"\", \"rationale\": \"\"}, ...]}. JSON only.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, "typography_json", t)
            });
        } finally { setTypoBusy(false); }
    }

    return (
        <Section eyebrow="Brand Personality" title="Archetype, palette, typography." helper={IGNITE_INTROS.archetypes}>
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="jung-quote">
                    “{IGNITE_JUNG_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {IGNITE_JUNG_QUOTE.attribution}</figcaption>
            </figure>

            <div className="mt-7">
                <div className="label-eyebrow mb-2">Pick your archetypes</div>
                <p className="text-xs text-muted-foreground mb-4">Choose a <span className="text-brand-bronze">primary</span> archetype (the dominant energy of your brand) and a <span className="text-brand-bronze">secondary</span> (the shading). They should feel true, not aspirational.</p>

                <ArchetypePicker slot="primary"   selected={primary}   otherSelected={secondary} onPick={(k) => pickArchetype("primary", k)} testIdPrefix="archetype-primary" />
                <div className="mt-6">
                    <ArchetypePicker slot="secondary" selected={secondary} otherSelected={primary}   onPick={(k) => pickArchetype("secondary", k)} testIdPrefix="archetype-secondary" />
                </div>
            </div>

            {/* Color palettes */}
            <div className="mt-10 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Color</div>
                        <h3 className="font-serif text-2xl">Generate 3 palettes from your archetype.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">Pick the one that feels most true. You can refine or regenerate.</p>
                    </div>
                    <Button onClick={generatePalettes} disabled={paletteBusy || !primary} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="generate-palettes-button">
                        {paletteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate palettes</>}
                    </Button>
                </div>
                <PalettesDisplay raw={getInput(STEP_NUM, "palettes_json")} selectedName={getInput(STEP_NUM, "palette_chosen")} onPick={(name) => {
                    setInput(STEP_NUM, "palette_chosen", name);
                    authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: "palette_chosen", value: name }) }).catch(() => {});
                }} />
            </div>

            {/* Typography */}
            <div className="mt-7 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Type</div>
                        <h3 className="font-serif text-2xl">Generate 3 typography pairings.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">Heading + body Google Fonts that resonate with your archetype.</p>
                    </div>
                    <Button onClick={generateTypography} disabled={typoBusy || !primary} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="generate-typography-button">
                        {typoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate typography</>}
                    </Button>
                </div>
                <TypographyDisplay raw={getInput(STEP_NUM, "typography_json")} selectedName={getInput(STEP_NUM, "typography_chosen")} onPick={(name) => {
                    setInput(STEP_NUM, "typography_chosen", name);
                    authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: "typography_chosen", value: name }) }).catch(() => {});
                }} />
            </div>
        </Section>
    );
}

function ArchetypePicker({ slot, selected, otherSelected, onPick, testIdPrefix }) {
    return (
        <div>
            <div className="text-xs uppercase tracking-[0.18em] text-brand-bronze mb-2 font-medium">{slot}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-testid={testIdPrefix}>
                {BRAND_ARCHETYPES.map((a) => {
                    const active = selected === a.key;
                    const dim = otherSelected === a.key;
                    return (
                        <button
                            key={a.key}
                            type="button"
                            disabled={dim}
                            onClick={() => onPick(a.key)}
                            className={`text-left p-4 rounded-2xl border-2 transition-all ${active ? "border-brand-gold bg-brand-gold/10 shadow-md" : dim ? "border-border opacity-40 cursor-not-allowed" : "border-border hover:border-brand-gold/60 bg-card"}`}
                            data-testid={`${testIdPrefix}-${a.key}`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="font-serif text-lg">{a.name}</div>
                                {active && <Check className="h-4 w-4 text-brand-gold" />}
                            </div>
                            <p className="text-xs text-muted-foreground italic mb-2">“{a.motto}”</p>
                            <p className="text-[11px] text-muted-foreground leading-snug">{a.vibe}</p>
                            <p className="text-[10px] text-brand-bronze uppercase tracking-wider mt-2">{a.examples.join(" · ")}</p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function safeParseJSON(raw) {
    if (!raw) return null;
    // Try direct, then extract first {...} block
    try { return JSON.parse(raw); } catch {}
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch {} }
    return null;
}

function PalettesDisplay({ raw, selectedName, onPick }) {
    const parsed = safeParseJSON(raw);
    const palettes = parsed?.palettes || [];
    if (!raw) return null;
    if (palettes.length === 0) {
        return <div className="mt-5 text-xs text-brand-cream/60 whitespace-pre-wrap" data-testid="palettes-raw">Parsing… raw:&#10;{raw}</div>;
    }
    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="palettes-grid">
            {palettes.map((p, i) => {
                const active = selectedName === p.name;
                return (
                    <button
                        key={p.name || i}
                        type="button"
                        onClick={() => onPick(p.name)}
                        className={`text-left rounded-2xl p-4 transition-all bg-brand-cream text-brand-charcoal ${active ? "ring-4 ring-brand-gold" : "hover:ring-2 hover:ring-brand-gold/60"}`}
                        data-testid={`palette-option-${i}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-serif text-lg">{p.name || `Palette ${i + 1}`}</div>
                            {active && <Check className="h-4 w-4 text-brand-bronze" />}
                        </div>
                        {p.mood && <p className="text-xs text-brand-charcoal/70 mb-3 leading-snug">{p.mood}</p>}
                        <div className="flex h-12 rounded-lg overflow-hidden shadow-sm">
                            {(p.colors || []).map((c, j) => (
                                <div key={j} className="flex-1" style={{ background: c }} title={c} />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {(p.colors || []).map((c, j) => (
                                <code key={j} className="text-[10px] font-mono text-brand-charcoal/60">{c}</code>
                            ))}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function TypographyDisplay({ raw, selectedName, onPick }) {
    const parsed = safeParseJSON(raw);
    const pairings = parsed?.pairings || [];
    if (!raw) return null;
    if (pairings.length === 0) {
        return <div className="mt-5 text-xs text-brand-cream/60 whitespace-pre-wrap" data-testid="typo-raw">Parsing… raw:&#10;{raw}</div>;
    }
    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="typo-grid">
            {pairings.map((p, i) => {
                const active = selectedName === p.name;
                const gfHeading = (p.heading || "").trim();
                const gfBody = (p.body || "").trim();
                const fontHrefs = [gfHeading, gfBody].filter(Boolean).map((f) => `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;700&display=swap`);
                return (
                    <button
                        key={p.name || i}
                        type="button"
                        onClick={() => onPick(p.name)}
                        className={`text-left rounded-2xl p-4 transition-all bg-brand-cream text-brand-charcoal ${active ? "ring-4 ring-brand-gold" : "hover:ring-2 hover:ring-brand-gold/60"}`}
                        data-testid={`typo-option-${i}`}
                    >
                        {fontHrefs.map((href) => (
                            <link key={href} rel="stylesheet" href={href} />
                        ))}
                        <div className="flex items-center justify-between mb-2">
                            <div className="font-serif text-lg">{p.name || `Pairing ${i + 1}`}</div>
                            {active && <Check className="h-4 w-4 text-brand-bronze" />}
                        </div>
                        <div className="mb-3">
                            <div className="text-xs text-brand-charcoal/60 mb-1">Heading · {gfHeading}</div>
                            <div className="text-2xl leading-tight" style={{ fontFamily: gfHeading ? `'${gfHeading}', serif` : undefined, fontWeight: 700 }}>Marketing Your Extraordinary.</div>
                        </div>
                        <div className="mb-3">
                            <div className="text-xs text-brand-charcoal/60 mb-1">Body · {gfBody}</div>
                            <div className="text-sm leading-relaxed" style={{ fontFamily: gfBody ? `'${gfBody}', sans-serif` : undefined }}>
                                Turn the spark inside you into a complete, structured business plan with AI as co-author.
                            </div>
                        </div>
                        {p.rationale && <p className="text-[11px] text-brand-charcoal/70 italic leading-snug">{p.rationale}</p>}
                    </button>
                );
            })}
        </div>
    );
}

// =================== POCKET MEDIA EMPIRE ===================
function PocketMediaEmpire({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Pocket Media Empire" title="Your owned channels." helper={IGNITE_INTROS.pocket_media}>
            <div className="space-y-6">
                {POCKET_MEDIA_CHANNELS.map((c) => {
                    const Icon = CHANNEL_ICON[c.key] || Mic;
                    const enabled = getInput(STEP_NUM, `pm_${c.key}_enabled`) === "yes";
                    return (
                        <div key={c.key} className="editorial-card p-5 md:p-6" data-testid={`pm-channel-${c.key}`}>
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <Icon className="h-6 w-6 text-brand-bronze mt-1 shrink-0" />
                                    <div className="min-w-0">
                                        <div className="font-serif text-2xl">{c.name}</div>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.helper}</p>
                                    </div>
                                </div>
                                <Button
                                    variant={enabled ? "default" : "outline"}
                                    onClick={() => {
                                        const next = enabled ? "no" : "yes";
                                        setInput(STEP_NUM, `pm_${c.key}_enabled`, next);
                                        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: `pm_${c.key}_enabled`, value: next }) }).catch(() => {});
                                    }}
                                    className="rounded-full shrink-0"
                                    data-testid={`pm-${c.key}-toggle`}
                                >
                                    {enabled ? <><Check className="h-4 w-4 mr-1" /> In my mix</> : "Add to my mix"}
                                </Button>
                            </div>

                            {enabled && (
                                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {POCKET_MEDIA_FIELDS.map((f) => (
                                        <div key={f.key} className={f.key === "first_5_ideas" ? "md:col-span-2" : ""}>
                                            <div className="label-eyebrow mb-1">{f.label}</div>
                                            <p className="text-[11px] text-muted-foreground mb-1.5">{f.helper}</p>
                                            {f.key === "url" ? (
                                                <Input
                                                    type="url"
                                                    placeholder="https://"
                                                    value={getInput(STEP_NUM, `pm_${c.key}_${f.key}`) || ""}
                                                    onChange={(e) => setInput(STEP_NUM, `pm_${c.key}_${f.key}`, e.target.value)}
                                                    onBlur={(e) => {
                                                        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: `pm_${c.key}_${f.key}`, value: e.target.value }) }).catch(() => {});
                                                    }}
                                                    className="h-10 rounded-xl"
                                                    data-testid={`pm-${c.key}-url`}
                                                />
                                            ) : (
                                                <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                                    fieldKey={`pm_${c.key}_${f.key}`}
                                                    fieldLabel={`${c.name} — ${f.label}`}
                                                    subModule={`Pocket Media · ${c.name}`}
                                                    rows={f.key === "first_5_ideas" ? 5 : 2}
                                                    value={getInput(STEP_NUM, `pm_${c.key}_${f.key}`)}
                                                    onChange={(v) => setInput(STEP_NUM, `pm_${c.key}_${f.key}`, v)} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

// =================== WEBSITE HUB ===================
function WebsiteHub({ planId, getInput, setInput }) {
    const chosen = getInput(STEP_NUM, "site_template") || "";
    const tpl = WEBSITE_HUB_TEMPLATES.find((t) => t.key === chosen);
    const [busy, setBusy] = useState(false);

    function pickTemplate(key) {
        setInput(STEP_NUM, "site_template", key);
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", keepalive: true, body: JSON.stringify({ step_num: STEP_NUM, field_key: "site_template", value: key }) }).catch(() => {});
    }

    async function generateAllPages() {
        if (!tpl) { toast.error("Pick a template first."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: `site_pages_${tpl.key}`,
                field_label: `Website spine (${tpl.name})`,
                extra_context: { template: tpl.name, pages: tpl.pages.map((p) => p.name) },
                instructions:
                    `Draft a clean ${tpl.name} website spine using the user's brand context. ` +
                    "For EACH page below, return exactly 3 lines in this exact format, with a blank line between pages:\n" +
                    "PAGE: <page name>\n" +
                    "META: <55-char SEO title> | <150-char meta description>\n" +
                    "COPY: <one-paragraph 80–110 word page body in the user's brand voice>\n\n" +
                    "Be specific to this user's plan. No markdown decoration. No preamble.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, `site_pages_${tpl.key}`, t)
            });
        } finally { setBusy(false); }
    }

    return (
        <Section eyebrow="Website Hub" title="The gravitational center." helper={IGNITE_INTROS.website_hub}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WEBSITE_HUB_TEMPLATES.map((t) => {
                    const active = chosen === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => pickTemplate(t.key)}
                            className={`text-left rounded-2xl p-5 border-2 transition-all ${active ? "border-brand-gold bg-brand-gold/10" : "border-border hover:border-brand-gold/60 bg-card"}`}
                            data-testid={`site-template-${t.key}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-serif text-xl">{t.name}</div>
                                {active && <Check className="h-5 w-5 text-brand-gold" />}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {t.pages.map((p) => (
                                    <span key={p.key} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-secondary text-foreground/80">{p.name}</span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {tpl && (
                <div className="mt-7 dark-cinematic-panel p-7 md:p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                        <div>
                            <div className="label-eyebrow text-brand-gold mb-1">Draft</div>
                            <h3 className="font-serif text-2xl">Draft your full {tpl.name} spine in one go.</h3>
                            <p className="text-brand-cream/70 text-sm mt-1">AI writes title, meta, and a paragraph for each page in your brand voice.</p>
                        </div>
                        <Button onClick={generateAllPages} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="generate-site-pages-button">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Generate site spine</>}
                        </Button>
                    </div>
                    {getInput(STEP_NUM, `site_pages_${tpl.key}`) && (
                        <div className="mt-6 border-t border-white/10 pt-5">
                            <div className="label-eyebrow text-brand-gold mb-2">Drafted pages (editable)</div>
                            <div className="rounded-xl bg-brand-cream text-brand-charcoal p-4">
                                <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                    fieldKey={`site_pages_${tpl.key}`}
                                    fieldLabel={`${tpl.name} spine — drafted pages`}
                                    subModule="Website Hub"
                                    rows={14}
                                    value={getInput(STEP_NUM, `site_pages_${tpl.key}`)}
                                    onChange={(v) => setInput(STEP_NUM, `site_pages_${tpl.key}`, v)}
                                    testIdPrefix="site-pages-field"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Section>
    );
}

// =================== TWO-TRACK MARKETING PLAN ===================
function MarketingPlan({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Marketing Plan" title="Two tracks. Pick your blend." helper={IGNITE_INTROS.marketing_plan}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {MARKETING_TRACKS.map((t) => {
                    const Icon = t.key === "diy" ? Wrench : Bot;
                    return (
                        <div key={t.key} className="editorial-card p-6" data-testid={`track-${t.key}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-5 w-5 text-brand-bronze" />
                                <div className="font-serif text-2xl">{t.name}</div>
                            </div>
                            <p className="text-sm text-foreground/80 italic mb-2">{t.subtitle}</p>
                            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{t.helper}</p>
                            <div className="space-y-4">
                                {MARKETING_TRACK_FIELDS.map((f) => (
                                    <div key={f.key}>
                                        <div className="label-eyebrow mb-1">{f.label}</div>
                                        <p className="text-[11px] text-muted-foreground mb-1.5">{f.helper}</p>
                                        <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                            fieldKey={`mt_${t.key}_${f.key}`}
                                            fieldLabel={`${t.name} — ${f.label}`}
                                            subModule={`Marketing Plan · ${t.name}`}
                                            rows={2}
                                            value={getInput(STEP_NUM, `mt_${t.key}_${f.key}`)}
                                            onChange={(v) => setInput(STEP_NUM, `mt_${t.key}_${f.key}`, v)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Section>
    );
}

// =================== 30/60/90 CALENDAR ===================
function ContentCalendar({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="30/60/90 + Beyond" title="Your cadence on a single page." helper={IGNITE_INTROS.calendar}>
            <div className="overflow-x-auto">
                <div className="min-w-[900px] grid gap-3" style={{ gridTemplateColumns: "180px repeat(4, minmax(0, 1fr))" }}>
                    {/* Header row */}
                    <div></div>
                    {CALENDAR_PHASES.map((ph) => (
                        <div key={ph.key} className="editorial-card p-3 bg-brand-charcoal text-brand-cream" data-testid={`cal-phase-header-${ph.key}`}>
                            <div className="label-eyebrow text-brand-gold mb-1">{ph.subtitle}</div>
                            <div className="font-serif text-lg leading-tight">{ph.label}</div>
                            <p className="text-[11px] text-brand-cream/70 mt-1 leading-snug">{ph.desc}</p>
                        </div>
                    ))}
                    {/* Pillar rows */}
                    {CALENDAR_PILLARS.map((pl) => (
                        <FragmentRow key={pl.key} pillar={pl} planId={planId} getInput={getInput} setInput={setInput} />
                    ))}
                </div>
            </div>
        </Section>
    );
}

function FragmentRow({ pillar, planId, getInput, setInput }) {
    return (
        <>
            <div className="editorial-card p-3 bg-secondary/40">
                <div className="font-serif text-lg">{pillar.label}</div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{pillar.helper}</p>
            </div>
            {CALENDAR_PHASES.map((ph) => {
                const fieldKey = `cal_${pillar.key}_${ph.key}`;
                return (
                    <div key={fieldKey} className="editorial-card p-3" data-testid={`cal-cell-${pillar.key}-${ph.key}`}>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM}
                            fieldKey={fieldKey}
                            fieldLabel={`${pillar.label} — ${ph.label}`}
                            subModule="Content Calendar"
                            rows={3}
                            placeholder=" "
                            value={getInput(STEP_NUM, fieldKey)}
                            onChange={(v) => setInput(STEP_NUM, fieldKey, v)} />
                    </div>
                );
            })}
        </>
    );
}

// =================== OUTPUT ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const [marking, setMarking] = useState(false);

    const primary = getInput(STEP_NUM, "archetype_primary");
    const secondary = getInput(STEP_NUM, "archetype_secondary");
    const primaryArch = BRAND_ARCHETYPES.find((a) => a.key === primary);
    const secondaryArch = BRAND_ARCHETYPES.find((a) => a.key === secondary);

    const palette = (() => {
        const raw = getInput(STEP_NUM, "palettes_json");
        const chosen = getInput(STEP_NUM, "palette_chosen");
        const parsed = safeParseJSON(raw);
        return parsed?.palettes?.find((p) => p.name === chosen) || null;
    })();
    const typo = (() => {
        const raw = getInput(STEP_NUM, "typography_json");
        const chosen = getInput(STEP_NUM, "typography_chosen");
        const parsed = safeParseJSON(raw);
        return parsed?.pairings?.find((p) => p.name === chosen) || null;
    })();

    const channels = POCKET_MEDIA_CHANNELS.filter((c) => getInput(STEP_NUM, `pm_${c.key}_enabled`) === "yes");
    const siteTpl = WEBSITE_HUB_TEMPLATES.find((t) => t.key === getInput(STEP_NUM, "site_template"));

    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(STEP_NUM, "complete");
            toast.success("Step 4 marked complete.");
            const next = STEPS.find((s) => s.num === 5);
            gotoStep(next);
        } finally { setMarking(false); }
    }

    return (
        <Section eyebrow="Your Output" title="IGNITE Your Brand Card" helper="Edit anything by jumping back to the relevant tab.">
            <div className="editorial-card p-7 md:p-8" data-testid="step4-output-card">
                {/* Archetype */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-1">Archetype</div>
                    <div className="font-serif text-xl">
                        {primaryArch ? primaryArch.name : "—"}{secondaryArch && <span className="text-muted-foreground"> · with {secondaryArch.name}</span>}
                    </div>
                </div>

                {/* Palette */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Palette</div>
                    {palette ? (
                        <div data-testid="output-palette">
                            <div className="font-serif text-lg mb-1">{palette.name}</div>
                            {palette.mood && <p className="text-xs text-muted-foreground mb-2">{palette.mood}</p>}
                            <div className="flex h-10 rounded-lg overflow-hidden max-w-md">
                                {(palette.colors || []).map((c, j) => <div key={j} className="flex-1" style={{ background: c }} title={c} />)}
                            </div>
                        </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>

                {/* Typography */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Typography</div>
                    {typo ? (
                        <div data-testid="output-typography">
                            <div className="font-serif text-lg mb-1">{typo.name}</div>
                            <div className="text-xs text-muted-foreground">Heading: {typo.heading} · Body: {typo.body}</div>
                        </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>

                {/* Channels */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Pocket Media Mix</div>
                    {channels.length > 0 ? (
                        <div className="flex flex-wrap gap-2" data-testid="output-channels">
                            {channels.map((c) => {
                                const Icon = CHANNEL_ICON[c.key] || Mic;
                                return (
                                    <span key={c.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-gold/15 text-foreground border border-brand-gold/30 text-sm">
                                        <Icon className="h-3.5 w-3.5 text-brand-bronze" /> {c.name}
                                    </span>
                                );
                            })}
                        </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>

                {/* Site */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-1">Website Template</div>
                    <div className="font-serif text-lg">{siteTpl ? siteTpl.name : "—"}</div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={complete} disabled={marking} className="cta-red rounded-full h-11 px-6" data-testid="complete-step4-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 4 → Begin Step 5 <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
            </div>
        </Section>
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
