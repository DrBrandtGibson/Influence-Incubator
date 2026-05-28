import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sparkles, Network, CalendarRange, BookOpen, Check, Loader2,
    ArrowRight, ArrowLeft, ChevronRight, Plus, Trash2
} from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { STEPS } from "@/lib/steps";
import {
    DREAM_100_SEED_PROMPTS, DREAM_100_CHANNELS, DREAM_100_STATUSES,
    EVENT_TYPES, EVENT_FIELDS,
    BOOK_SEED_PROMPTS,
    EXPAND_INTROS, EXPAND_QUOTE
} from "@/lib/framework";

const STEP_NUM = 6;

const TAB_ORDER = ["dream100", "events", "book", "output"];
const TAB_LABELS = {
    dream100: "Dream 100 CRM",
    events:   "Live Events & Challenges",
    book:     "Book Builder",
    output:   "Your Output"
};

export default function StepExpand({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("dream100");
    const planId = plan.id;
    const goToTab = (key) => { setTab(key); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-expand">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 06 · Pro</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">EXPAND Your Influence</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                    Build the relationships, run the live events, and write the book that move your work from “known to a few” to “known to many.”
                </p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["dream100", Network,       "Dream 100 CRM"],
                        ["events",   CalendarRange, "Live Events & Challenges"],
                        ["book",     BookOpen,      "Book Builder"],
                        ["output",   Check,         "Your Output"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`expand-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="dream100"><Dream100 planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="events"><LiveEvents planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="book"><BookBuilder planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {tab !== "output" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="expand-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="expand-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="expand-next-button">
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

// =================== DREAM 100 ===================
function Dream100({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);
    const list = (() => {
        try { const r = getInput(STEP_NUM, "dream100_list"); const a = r ? JSON.parse(r) : null; return Array.isArray(a) ? a : []; } catch { return []; }
    })();

    function saveList(next) {
        const json = JSON.stringify(next);
        setInput(STEP_NUM, "dream100_list", json);
        persist(planId, "dream100_list", json);
    }
    function addRow() {
        saveList([...list, { id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: "", channel: DREAM_100_CHANNELS[0], why: "", status: "cold", next_action: "" }]);
    }
    function updateRow(i, key, value) { saveList(list.map((r, j) => j === i ? { ...r, [key]: value } : r)); }
    function removeRow(i) { saveList(list.filter((_, j) => j !== i)); }

    async function suggestList() {
        const niche = getInput(STEP_NUM, "d100_niche") || "";
        const archetypes = getInput(STEP_NUM, "d100_archetypes") || "";
        if (!niche && !archetypes) { toast.error("Sketch your niche and the archetypes first."); return; }
        setBusy(true);
        try {
            const text = await streamingGenerate({
                field_key: "dream100_suggestions", field_label: "Dream 100 suggestions",
                extra_context: { niche, archetypes, allowed_channels: DREAM_100_CHANNELS },
                instructions:
                    "Suggest 25 Dream-100 candidates for this user, returned as JSON only.\n" +
                    "Shape: {\"entries\": [{\"name\": \"\", \"channel\": \"\", \"why\": \"\", \"next_action\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- 'name' = a SPECIFIC real person, podcast, brand, conference, or publication (not a generic archetype). " +
                    "If you genuinely don't know a real name in the user's niche, use a vivid archetypal label like 'Top 3 functional medicine podcasts'.\n" +
                    "- 'channel' MUST be one of the allowed_channels strings in extra_context.\n" +
                    "- 'why' = one sentence on why their attention would change the user's business.\n" +
                    "- 'next_action' = a concrete, immediate next step (research, comment on their last post, email pitch, send a free copy, etc.).\n" +
                    "- Mix the 25 across at least 5 different channels.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: () => {}
            });
            const parsed = safeParseJSON(text);
            if (parsed?.entries?.length) {
                const merged = [
                    ...list,
                    ...parsed.entries.map((e) => ({
                        id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        name: e.name || "",
                        channel: DREAM_100_CHANNELS.includes(e.channel) ? e.channel : "Other",
                        why: e.why || "",
                        status: "cold",
                        next_action: e.next_action || ""
                    }))
                ];
                saveList(merged);
                toast.success(`Added ${parsed.entries.length} suggestions.`);
            } else {
                toast.error("AI returned no parseable entries. Try again.");
            }
        } finally { setBusy(false); }
    }

    const byStatus = DREAM_100_STATUSES.map((s) => ({ ...s, count: list.filter((r) => r.status === s.key).length }));

    return (
        <Section eyebrow="Dream 100" title="The list that changes everything." helper={EXPAND_INTROS.dream100}>
            <figure className="my-2">
                <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90 pl-6 border-l-2 border-brand-gold" data-testid="expand-quote">
                    “{EXPAND_QUOTE.text}”
                </blockquote>
                <figcaption className="mt-2 text-xs uppercase tracking-[0.18em] text-brand-bronze">— {EXPAND_QUOTE.attribution}</figcaption>
            </figure>

            <div className="space-y-5 mt-7">
                {DREAM_100_SEED_PROMPTS.map((q) => (
                    <div key={q.key}>
                        <div className="label-eyebrow mb-1">{q.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{q.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={q.key}
                            fieldLabel={q.label} subModule="Dream 100"
                            rows={2}
                            value={getInput(STEP_NUM, q.key)} onChange={(v) => setInput(STEP_NUM, q.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-wrap gap-2" data-testid="d100-status-summary">
                    {byStatus.map((s) => (
                        <span key={s.key} className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.color}`}>{s.label} · {s.count}</span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button onClick={addRow} variant="outline" className="rounded-full" data-testid="d100-add-row">
                        <Plus className="h-4 w-4 mr-1.5" /> Add row
                    </Button>
                    <Button onClick={suggestList} disabled={busy} className="cta-red rounded-full" data-testid="d100-suggest">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1.5" /> Suggest 25 candidates</>}
                    </Button>
                </div>
            </div>

            {list.length > 0 ? (
                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-sm" data-testid="d100-table">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b">
                                <th className="py-2 pr-3 font-medium">#</th>
                                <th className="py-2 pr-3 font-medium">Name</th>
                                <th className="py-2 pr-3 font-medium">Channel</th>
                                <th className="py-2 pr-3 font-medium">Why they matter</th>
                                <th className="py-2 pr-3 font-medium">Status</th>
                                <th className="py-2 pr-3 font-medium">Next action</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((r, i) => (
                                <tr key={r.id} className="border-b align-top hover:bg-secondary/30">
                                    <td className="py-2 pr-3 text-muted-foreground">{i + 1}</td>
                                    <td className="py-2 pr-3">
                                        <Input value={r.name} onChange={(e) => updateRow(i, "name", e.target.value)} className="h-9 rounded-lg" placeholder="Person / brand" data-testid={`d100-row-${i}-name`} />
                                    </td>
                                    <td className="py-2 pr-3">
                                        <select value={r.channel} onChange={(e) => updateRow(i, "channel", e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm w-full" data-testid={`d100-row-${i}-channel`}>
                                            {DREAM_100_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-2 pr-3">
                                        <Input value={r.why} onChange={(e) => updateRow(i, "why", e.target.value)} className="h-9 rounded-lg" data-testid={`d100-row-${i}-why`} />
                                    </td>
                                    <td className="py-2 pr-3">
                                        <select value={r.status} onChange={(e) => updateRow(i, "status", e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm" data-testid={`d100-row-${i}-status`}>
                                            {DREAM_100_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                                        </select>
                                    </td>
                                    <td className="py-2 pr-3">
                                        <Input value={r.next_action} onChange={(e) => updateRow(i, "next_action", e.target.value)} className="h-9 rounded-lg" data-testid={`d100-row-${i}-next`} />
                                    </td>
                                    <td className="py-2">
                                        <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive p-1.5" aria-label="Remove" data-testid={`d100-row-${i}-remove`}>
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-6 editorial-card p-6 text-center bg-secondary/30" data-testid="d100-empty">
                    <p className="text-sm text-muted-foreground">Your Dream 100 is empty. Click "Suggest 25 candidates" to seed it, or "Add row" to start by hand.</p>
                </div>
            )}
        </Section>
    );
}

// =================== LIVE EVENTS ===================
function LiveEvents({ planId, getInput, setInput }) {
    const eventIds = (() => {
        try { const r = getInput(STEP_NUM, "events_ids"); const a = r ? JSON.parse(r) : null; if (Array.isArray(a) && a.length) return a; } catch { /* */ }
        return ["event_1"];
    })();
    const [active, setActive] = useState(eventIds[0]);
    if (!eventIds.includes(active)) setActive(eventIds[0]);

    function writeIds(next) { const json = JSON.stringify(next); setInput(STEP_NUM, "events_ids", json); persist(planId, "events_ids", json); }
    function addEvent() { const id = `event_${Date.now()}`; writeIds([...eventIds, id]); setActive(id); }
    function removeEvent(id) { if (eventIds.length <= 1) { toast.error("Keep at least one event."); return; } const next = eventIds.filter((x) => x !== id); writeIds(next); setActive(next[0]); }

    return (
        <Section eyebrow="Live Events & Challenges" title="Trust accelerators." helper={EXPAND_INTROS.events}>
            <div className="flex flex-wrap items-center gap-2 mb-5" data-testid="events-chips">
                {eventIds.map((id, i) => {
                    const evType = getInput(STEP_NUM, `${id}_type`);
                    const t = EVENT_TYPES.find((x) => x.key === evType);
                    const evName = getInput(STEP_NUM, `${id}_name`) || (t ? t.name : `Event ${i + 1}`);
                    return (
                        <button key={id} onClick={() => setActive(id)}
                            className={`text-sm px-4 py-1.5 rounded-full border ${active === id ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                            data-testid={`event-chip-${id}`}>
                            {evName}
                        </button>
                    );
                })}
                <Button variant="outline" onClick={addEvent} className="rounded-full" data-testid="event-add">
                    <Plus className="h-4 w-4 mr-1.5" /> Add event
                </Button>
            </div>

            {eventIds.filter((id) => id === active).map((id, idx) => (
                <EventEditor key={id} id={id} idx={eventIds.indexOf(id)} planId={planId}
                    getInput={getInput} setInput={setInput}
                    onRemove={() => removeEvent(id)} canRemove={eventIds.length > 1} />
            ))}
        </Section>
    );
}

function EventEditor({ id, idx, planId, getInput, setInput, onRemove, canRemove }) {
    const [busy, setBusy] = useState(false);
    const evType = getInput(STEP_NUM, `${id}_type`) || "";

    function pickType(key) {
        setInput(STEP_NUM, `${id}_type`, key);
        persist(planId, `${id}_type`, key);
    }

    async function recommend() {
        const type = EVENT_TYPES.find((t) => t.key === evType);
        if (!type) { toast.error("Pick an event type first."); return; }
        setBusy(true);
        try {
            const text = await streamingGenerate({
                field_key: `${id}_recommendation_json`, field_label: `Event recommendation — ${type.name}`,
                extra_context: { event_type: type.name, event_helper: type.helper },
                instructions:
                    "Design a single live event of the given type for this user, returned as JSON only.\n" +
                    "Shape: {\"name\": \"\", \"format\": \"\", \"promise\": \"\", \"hook\": \"\", \"outcome\": \"\", \"conversion\": \"\"}\n" +
                    "Rules:\n" +
                    "- 'name' = short (2–5 words), evocative, registration-worthy.\n" +
                    "- 'format' = concrete length, cadence, delivery medium.\n" +
                    "- 'promise' = one sentence promise.\n" +
                    "- 'hook' = a registration-page headline (8–14 words).\n" +
                    "- 'outcome' = the specific shift by the end.\n" +
                    "- 'conversion' = the offer/continuity invite after.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: () => {}
            });
            const parsed = safeParseJSON(text);
            if (parsed) {
                EVENT_FIELDS.forEach((f) => {
                    if (parsed[f.key]) {
                        setInput(STEP_NUM, `${id}_${f.key}`, parsed[f.key]);
                        persist(planId, `${id}_${f.key}`, parsed[f.key]);
                    }
                });
                toast.success("Event recommendation applied.");
            }
        } finally { setBusy(false); }
    }

    return (
        <div className="editorial-card p-5 md:p-7" data-testid={`event-editor-${id}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
                <div className="flex-1">
                    <div className="label-eyebrow mb-2">Event type</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" data-testid={`event-${id}-types`}>
                        {EVENT_TYPES.map((t) => {
                            const active = evType === t.key;
                            return (
                                <button key={t.key} type="button" onClick={() => pickType(t.key)}
                                    className={`text-left p-3 rounded-xl border-2 transition ${active ? "border-brand-gold bg-brand-gold/10" : "border-border hover:border-brand-gold/60 bg-card"}`}
                                    data-testid={`event-${id}-type-${t.key}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="font-serif text-base">{t.name}</div>
                                        {active && <Check className="h-4 w-4 text-brand-gold" />}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug">{t.helper}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
                {canRemove && (
                    <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-destructive" data-testid={`event-${id}-remove`}>
                        <Trash2 className="h-4 w-4 mr-1" /> Remove event
                    </Button>
                )}
            </div>

            {evType && (
                <>
                    <div className="dark-cinematic-panel p-5 mb-6">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div>
                                <div className="label-eyebrow text-brand-gold mb-1">Recommend</div>
                                <h3 className="font-serif text-xl">Design my {EVENT_TYPES.find((t) => t.key === evType).name}.</h3>
                            </div>
                            <Button onClick={recommend} disabled={busy} className="cta-red rounded-full" data-testid={`event-${id}-recommend`}>
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1.5" /> Recommend</>}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {EVENT_FIELDS.map((f) => (
                            <div key={f.key}>
                                <div className="label-eyebrow mb-1">{f.label}</div>
                                <p className="text-[11px] text-muted-foreground mb-1.5">{f.helper}</p>
                                <AIAssistInput planId={planId} stepNum={STEP_NUM}
                                    fieldKey={`${id}_${f.key}`}
                                    fieldLabel={`${EVENT_TYPES.find((t) => t.key === evType)?.name || "Event"} — ${f.label}`}
                                    subModule="Live Events"
                                    rows={f.key === "conversion" || f.key === "outcome" || f.key === "format" ? 3 : 2}
                                    value={getInput(STEP_NUM, `${id}_${f.key}`)}
                                    onChange={(v) => setInput(STEP_NUM, `${id}_${f.key}`, v)} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// =================== BOOK BUILDER ===================
function BookBuilder({ planId, getInput, setInput }) {
    const [busy, setBusy] = useState(false);
    const [titlesBusy, setTitlesBusy] = useState(false);

    async function suggestTitles() {
        const ctx = {
            reader: getInput(STEP_NUM, "book_reader") || "",
            promise: getInput(STEP_NUM, "book_promise") || "",
            lens: getInput(STEP_NUM, "book_unique_lens") || ""
        };
        setTitlesBusy(true);
        try {
            await streamingGenerate({
                field_key: "book_title_suggestions", field_label: "Book title suggestions",
                extra_context: ctx,
                instructions:
                    "Generate 7 distinct book title candidates with subtitles, returned as a numbered list:\n" +
                    "1. MAIN TITLE: Subtitle\n2. MAIN TITLE: Subtitle\n... " +
                    "Each title 2–6 words, ownable, and provocative. Subtitle = 8–14 words clarifying the promise. " +
                    "Return only the list. No preamble.",
                planId, stepNum: STEP_NUM, mode: "generate",
                onText: (t) => setInput(STEP_NUM, "book_title_suggestions", t)
            });
        } finally { setTitlesBusy(false); }
    }

    async function buildOutline() {
        const ctx = {
            reader:  getInput(STEP_NUM, "book_reader") || "",
            promise: getInput(STEP_NUM, "book_promise") || "",
            lens:    getInput(STEP_NUM, "book_unique_lens") || "",
            chapters_n: getInput(STEP_NUM, "book_chapters_n") || "10",
            chosen_title: getInput(STEP_NUM, "book_title") || ""
        };
        if (!ctx.reader && !ctx.promise) { toast.error("Sketch the reader and the promise first."); return; }
        setBusy(true);
        try {
            await streamingGenerate({
                field_key: "book_outline_json", field_label: "Book outline",
                extra_context: ctx,
                instructions:
                    "Build a complete book outline, returned as JSON only.\n" +
                    "Shape: {\"title\": \"\", \"subtitle\": \"\", \"big_idea\": \"\", \"transformation\": \"\", \"chapters\": [{\"n\": 1, \"title\": \"\", \"hook\": \"\", \"summary\": \"\"}, ...]}\n" +
                    "Rules:\n" +
                    "- If chosen_title is provided, use it; otherwise generate a strong one.\n" +
                    "- 'big_idea' = the core thesis in one paragraph (3–4 sentences).\n" +
                    "- 'transformation' = one sentence: reader goes from X to Y by the last page.\n" +
                    "- Chapter count = chapters_n (clamp to 8–15).\n" +
                    "- Each chapter: title (3–7 words), hook (one provocative sentence that opens the chapter), summary (2–3 sentences of what's taught).\n" +
                    "- Chapter order forms a coherent arc.\n" +
                    "- Return ONLY the JSON. No preamble.",
                planId, stepNum: STEP_NUM, mode: "synthesize",
                onText: (t) => setInput(STEP_NUM, "book_outline_json", t)
            });
        } finally { setBusy(false); }
    }

    const outline = safeParseJSON(getInput(STEP_NUM, "book_outline_json"));

    return (
        <Section eyebrow="Book Builder" title="The business card raised to the tenth power." helper={EXPAND_INTROS.book}>
            <div className="space-y-5">
                {BOOK_SEED_PROMPTS.map((q) => (
                    <div key={q.key}>
                        <div className="label-eyebrow mb-1">{q.label}</div>
                        <p className="text-xs text-muted-foreground mb-1.5">{q.helper}</p>
                        <AIAssistInput planId={planId} stepNum={STEP_NUM} fieldKey={q.key}
                            fieldLabel={q.label} subModule="Book Builder"
                            rows={q.key === "book_chapters_n" ? 1 : 3}
                            placeholder={q.key === "book_chapters_n" ? "e.g. 10" : ""}
                            value={getInput(STEP_NUM, q.key)} onChange={(v) => setInput(STEP_NUM, q.key, v)} />
                    </div>
                ))}
            </div>

            <div className="mt-7 editorial-card p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div>
                        <div className="label-eyebrow mb-1">Working title</div>
                        <p className="text-[11px] text-muted-foreground">Type one yourself, or click Suggest for 7 candidates.</p>
                    </div>
                    <Button onClick={suggestTitles} disabled={titlesBusy} variant="outline" size="sm" className="rounded-full" data-testid="book-suggest-titles">
                        {titlesBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-1.5" /> Suggest titles</>}
                    </Button>
                </div>
                <Input value={getInput(STEP_NUM, "book_title") || ""} onChange={(e) => setInput(STEP_NUM, "book_title", e.target.value)} onBlur={(e) => persist(planId, "book_title", e.target.value)} className="h-11 rounded-xl font-serif text-xl" placeholder="Working title" data-testid="book-title-input" />
                {getInput(STEP_NUM, "book_title_suggestions") && (
                    <div className="mt-4 editorial-card p-3 bg-secondary/40 whitespace-pre-wrap text-sm leading-relaxed" data-testid="book-title-suggestions">
                        {getInput(STEP_NUM, "book_title_suggestions")}
                    </div>
                )}
            </div>

            <div className="mt-7 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Outline</div>
                        <h3 className="font-serif text-2xl">Build my book outline.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">Title, subtitle, big idea, transformation, plus every chapter with title, hook, and summary.</p>
                    </div>
                    <Button onClick={buildOutline} disabled={busy} className="cta-red rounded-full h-11 px-5 shrink-0" data-testid="book-build-outline">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Build outline</>}
                    </Button>
                </div>

                {outline && (
                    <div className="mt-6 rounded-xl bg-brand-cream text-brand-charcoal p-5 md:p-6" data-testid="book-outline-output">
                        <div className="font-serif text-3xl">{outline.title || "—"}</div>
                        {outline.subtitle && <div className="italic text-brand-charcoal/80 mt-1">{outline.subtitle}</div>}
                        {outline.transformation && (
                            <div className="mt-3"><div className="label-eyebrow text-brand-bronze mb-1">Transformation</div><div className="text-sm">{outline.transformation}</div></div>
                        )}
                        {outline.big_idea && (
                            <div className="mt-3"><div className="label-eyebrow text-brand-bronze mb-1">Big Idea</div><div className="text-sm leading-relaxed">{outline.big_idea}</div></div>
                        )}
                        {Array.isArray(outline.chapters) && outline.chapters.length > 0 && (
                            <div className="mt-4">
                                <div className="label-eyebrow text-brand-bronze mb-2">Chapters ({outline.chapters.length})</div>
                                <ol className="space-y-3" data-testid="book-chapters">
                                    {outline.chapters.map((ch, i) => (
                                        <li key={i} className="rounded-lg border border-brand-bronze/20 p-3 bg-brand-cream/40">
                                            <div className="flex gap-2 items-baseline">
                                                <span className="font-serif text-brand-bronze">{ch.n ?? i + 1}.</span>
                                                <span className="font-serif text-lg">{ch.title}</span>
                                            </div>
                                            {ch.hook && <p className="italic text-brand-charcoal/80 text-sm mt-1">“{ch.hook}”</p>}
                                            {ch.summary && <p className="text-sm text-brand-charcoal/80 mt-1 leading-relaxed">{ch.summary}</p>}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Section>
    );
}

// =================== OUTPUT ===================
function OutputCard({ planId, getInput, markStepStatus, gotoStep }) {
    const [marking, setMarking] = useState(false);

    const d100 = (() => { try { const r = getInput(STEP_NUM, "dream100_list"); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; } catch { return []; } })();
    const d100Stats = DREAM_100_STATUSES.map((s) => ({ ...s, count: d100.filter((r) => r.status === s.key).length }));

    const eventIds = (() => { try { const r = getInput(STEP_NUM, "events_ids"); const a = r ? JSON.parse(r) : null; if (Array.isArray(a) && a.length) return a; } catch { /* */ } return []; })();
    const outline = safeParseJSON(getInput(STEP_NUM, "book_outline_json"));

    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(STEP_NUM, "complete");
            toast.success("Step 6 marked complete.");
            const next = STEPS.find((s) => s.num === 7);
            gotoStep(next);
        } finally { setMarking(false); }
    }

    return (
        <Section eyebrow="Your Output" title="EXPAND Your Influence Card" helper="Edit anything by jumping back to the relevant tab.">
            <div className="editorial-card p-7 md:p-8" data-testid="step6-output-card">
                {/* Dream 100 */}
                <div className="py-3">
                    <div className="label-eyebrow text-brand-bronze mb-2">Dream 100 — {d100.length} entries</div>
                    {d100.length > 0 ? (
                        <div className="flex flex-wrap gap-2" data-testid="output-d100-status">
                            {d100Stats.map((s) => (
                                <span key={s.key} className={`text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.color}`}>{s.label} · {s.count}</span>
                            ))}
                        </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>

                {/* Events */}
                <div className="py-3 border-t border-border/50">
                    <div className="label-eyebrow text-brand-bronze mb-2">Live Events ({eventIds.length})</div>
                    {eventIds.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="output-events-list">
                            {eventIds.map((id, i) => {
                                const t = EVENT_TYPES.find((x) => x.key === getInput(STEP_NUM, `${id}_type`));
                                const name = getInput(STEP_NUM, `${id}_name`) || (t ? t.name : `Event ${i + 1}`);
                                const promise = getInput(STEP_NUM, `${id}_promise`);
                                return (
                                    <div key={id} className="editorial-card p-3 bg-secondary/30">
                                        <div className="font-serif text-lg">{name}</div>
                                        {t && <div className="text-[11px] uppercase tracking-wider text-brand-bronze mt-0.5">{t.name}</div>}
                                        {promise && <p className="text-xs italic text-muted-foreground mt-1 leading-snug">{promise}</p>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>

                {/* Book */}
                <div className="py-3 border-t border-border/50">
                    <div className="label-eyebrow text-brand-bronze mb-1">Book</div>
                    <div className="font-serif text-2xl">{outline?.title || getInput(STEP_NUM, "book_title") || "—"}</div>
                    {outline?.subtitle && <div className="italic text-muted-foreground text-sm mt-1">{outline.subtitle}</div>}
                    {Array.isArray(outline?.chapters) && outline.chapters.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2" data-testid="output-book-chapters-count">{outline.chapters.length} chapters outlined</p>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={complete} disabled={marking} className="cta-red rounded-full h-11 px-6" data-testid="complete-step6-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 6 → Begin Step 7 <ArrowRight className="h-4 w-4 ml-2" /></>}
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
