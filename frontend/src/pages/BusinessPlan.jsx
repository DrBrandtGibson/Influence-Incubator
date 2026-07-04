/**
 * BusinessPlan — the final post-Step-7 summary page.
 *
 * Routes:
 *   /plans/:planId/business-plan
 *
 * Renders one summary card per step (1–7), plus an AI-generated 10-item
 * "Do This Next" list at the top. Includes Print / Save-as-PDF and a link
 * back to the dashboard or full editor.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Sparkles, Loader2, ArrowLeft, Printer, Download, ExternalLink,
    Target, Users, BookOpen, Palette as PaletteIcon, Heart, Globe, Compass,
    Layers,
} from "lucide-react";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import {
    NICHE_OPTIONS, DEMOGRAPHICS_QUESTIONS, PSYCHOGRAPHICS_QUESTIONS, MASLOW_LEVELS, SIX_NEEDS,
    HEROS_JOURNEY_STAGES, STORY_BANK_PROMPTS,
    BRAND_ARCHETYPES, POCKET_MEDIA_CHANNELS, WEBSITE_HUB_TEMPLATES,
    MARKETING_TRACKS, MARKETING_TRACK_FIELDS, CALENDAR_PHASES, CALENDAR_PILLARS,
    EVENT_TYPES,
    DELIVER_QUALITY_PROMPTS, DELIVER_FEEDBACK_PROMPTS,
} from "@/lib/framework";

function safeJSON(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

export default function BusinessPlan() {
    const { planId } = useParams();
    const navigate = useNavigate();
    const [plan, setPlan] = useState(null);
    const [inputs, setInputs] = useState({});
    const [loading, setLoading] = useState(true);
    const [todos, setTodos] = useState(null); // parsed array
    const [todosLoading, setTodosLoading] = useState(false);
    const printRef = useRef(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await authedFetch(`/plans/${planId}`);
                if (!res.ok) {
                    if (res.status === 404) { toast.error("Plan not found."); navigate("/dashboard"); return; }
                    throw new Error("Could not load plan.");
                }
                const data = await res.json();
                setPlan(data.plan);
                const map = {};
                for (const inp of data.inputs) map[`${inp.step_num}:${inp.field_key}`] = inp.value || "";
                setInputs(map);
                // If todos were already generated and persisted, parse and show them
                const persisted = map["7:business_plan_todos_json"];
                if (persisted) {
                    const parsed = safeJSON(persisted);
                    if (parsed?.todos) setTodos(parsed.todos);
                }
            } catch (e) {
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [planId, navigate]);

    useEffect(() => {
        document.title = plan?.title ? `${plan.title} — Business Plan` : "Business Plan — Influence Incubator";
    }, [plan]);

    function get(stepNum, fieldKey) { return inputs[`${stepNum}:${fieldKey}`] || ""; }

    async function generateTodos() {
        if (todosLoading) return;
        setTodosLoading(true);
        try {
            const res = await authedFetch("/ai/business-plan-todos", { method: "POST", body: JSON.stringify({ plan_id: planId }) });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.detail?.message || j?.detail || "Could not generate to-do list.");
            }
            const j = await res.json();
            let cleaned = (j.text || "").trim();
            const start = cleaned.indexOf("{");
            const end = cleaned.lastIndexOf("}");
            if (start >= 0 && end > start) cleaned = cleaned.slice(start, end + 1);
            const parsed = safeJSON(cleaned);
            if (parsed?.todos?.length) {
                setTodos(parsed.todos);
                toast.success("Your 10-step Do This Next list is ready.");
            } else {
                toast.error("AI returned an unexpected format.");
            }
        } catch (e) {
            toast.error(e.message);
        } finally {
            setTodosLoading(false);
        }
    }

    function printIt() {
        window.print();
    }

    async function downloadPdf() {
        toast.message("Generating PDF…");
        try {
            const res = await authedFetch(`/plans/${planId}/export.pdf`);
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j?.detail?.message || j?.detail || "PDF export failed.");
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${(plan?.title || "Business-Plan").replace(/\s+/g, "-")}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            toast.error(e.message);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] grid place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand-bronze" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background" data-testid="business-plan-page">
            {/* Header */}
            <div className="border-b border-border bg-card sticky top-0 z-20 print:hidden">
                <div className="container-readable py-4 flex flex-wrap items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate("/dashboard")} size="sm" data-testid="back-to-dashboard">
                        <ArrowLeft className="h-4 w-4 mr-1.5" /> Dashboard
                    </Button>
                    <div className="flex-1 min-w-0">
                        <div className="label-eyebrow text-brand-bronze">Business Plan</div>
                        <h1 className="font-serif text-2xl tracking-[-0.01em] truncate">{plan?.title || "Untitled Plan"}</h1>
                    </div>
                    <Link to={`/plans/${planId}/define`}>
                        <Button variant="outline" size="sm" data-testid="edit-plan-button"><ExternalLink className="h-4 w-4 mr-1.5" /> Edit Plan</Button>
                    </Link>
                    <Button onClick={printIt} variant="outline" size="sm" data-testid="print-business-plan"><Printer className="h-4 w-4 mr-1.5" /> Print</Button>
                    <Button onClick={downloadPdf} className="cta-red" size="sm" data-testid="download-pdf-business-plan"><Download className="h-4 w-4 mr-1.5" /> Save as PDF</Button>
                </div>
            </div>

            <div ref={printRef} className="container-readable py-10 print:py-0">
                {/* Cover */}
                <div className="text-center mb-12 print:mb-8" data-testid="business-plan-cover">
                    <div className="label-eyebrow text-brand-gold mb-3">The Complete Plan</div>
                    <h2 className="font-serif text-5xl md:text-6xl tracking-[-0.02em]">{get(1, "business_name") || plan?.title || "Your Business"}</h2>
                    {get(1, "mtp_statement") && (
                        <p className="mt-5 font-serif italic text-xl text-brand-bronze max-w-2xl mx-auto">"{get(1, "mtp_statement")}"</p>
                    )}
                </div>

                {/* AI To-Do List — pinned at the top */}
                <Card eyebrow="Do This Next · AI-prioritized" title="Your 10-Step Action List" testid="todos-card">
                    {todos && todos.length > 0 ? (
                        <ol className="space-y-3" data-testid="todos-list">
                            {todos.map((t, i) => (
                                <li key={i} className="flex gap-4 items-start rounded-xl bg-secondary/30 p-4" data-testid={`todo-item-${i}`}>
                                    <div className="font-serif text-2xl text-brand-bronze w-8 shrink-0">{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="font-serif text-lg">{t.title || t.task || "—"}</div>
                                        {t.rationale && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.rationale}</p>}
                                        {t.step && <div className="text-[10px] uppercase tracking-wider text-brand-bronze mt-1.5">Step {t.step}</div>}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">Let AI synthesize your plan and prioritize the 10 most important actions to take next.</p>
                            <Button onClick={generateTodos} disabled={todosLoading} className="cta-red rounded-full h-11 px-6" data-testid="generate-todos-button">
                                {todosLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Synthesizing…</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate my 10-step list</>}
                            </Button>
                        </div>
                    )}
                    {todos && todos.length > 0 && (
                        <div className="mt-4 flex justify-end print:hidden">
                            <Button onClick={generateTodos} disabled={todosLoading} size="sm" variant="outline" data-testid="regenerate-todos-button">
                                {todosLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Regenerate</>}
                            </Button>
                        </div>
                    )}
                </Card>

                {/* DEFINE */}
                <Card eyebrow="Step 01" title="DEFINE Your Purpose Card" icon={Target} testid="card-define">
                    <Field label="Business Name" value={get(1, "business_name")} large />
                    <Field label="Massive Transformative Purpose" value={get(1, "mtp_statement")} multiline />
                    <Field label="Deep WHY" value={get(1, "why_level_7")} multiline />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <Field label="5-Year Goal" value={get(1, "chief_y5_what")} multiline />
                        <Field label="3-Year Goal" value={get(1, "chief_y3_what")} multiline />
                        <Field label="1-Year Goal" value={get(1, "chief_y1_what")} multiline />
                        <Field label="3-Month Goal" value={get(1, "chief_q3_what")} multiline />
                    </div>
                    <Field label="Business Structure" value={get(1, "structure_chosen")} />
                </Card>

                {/* DREAM CUSTOMER */}
                <Card eyebrow="Step 02" title="Dream Customer Card" icon={Users} testid="card-dream-customer">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                        <div>
                            {get(2, "dc_photo") && (
                                <img src={get(2, "dc_photo")} alt="Dream Customer" className="w-full aspect-square object-cover rounded-2xl border-4 border-brand-gold/50" data-testid="dream-customer-photo" />
                            )}
                            <div className="font-serif text-2xl mt-3">{get(2, "dc_name") || "Your Dream Customer"}</div>
                            <div className="text-[11px] uppercase tracking-wider text-brand-bronze">{NICHE_OPTIONS.find((n) => n.key === get(2, "niche_type"))?.label || "—"}</div>
                            {get(2, "micro_niche_statement") && <p className="italic text-sm text-muted-foreground mt-2 leading-relaxed">"{get(2, "micro_niche_statement")}"</p>}
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <div className="label-eyebrow text-brand-bronze mb-1.5">Demographics</div>
                                <ul className="text-sm space-y-0.5">
                                    {DEMOGRAPHICS_QUESTIONS.map((d) => {
                                        const v = get(2, `demo_${d.key}`);
                                        return v ? <li key={d.key}><span className="text-muted-foreground">{d.q.split("?")[0]}:</span> {v}</li> : null;
                                    })}
                                </ul>
                            </div>
                            <div>
                                <div className="label-eyebrow text-brand-bronze mb-1.5">Psychographics</div>
                                <ul className="text-sm space-y-0.5">
                                    {PSYCHOGRAPHICS_QUESTIONS.map((d) => {
                                        const v = get(2, `psycho_${d.key}`);
                                        return v ? <li key={d.key}><span className="text-muted-foreground">{d.q.split("?")[0]}:</span> {v}</li> : null;
                                    })}
                                </ul>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <TagGroup label="Maslow's Hierarchy" items={MASLOW_LEVELS.filter((m) => (safeJSON(get(2, "maslow_levels")) || []).includes(m.key)).map((m) => m.label)} />
                                <TagGroup label="6 Core Needs" items={SIX_NEEDS.filter((n) => (safeJSON(get(2, "robbins_needs")) || []).includes(n.key)).map((n) => n.label)} />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* FRAME */}
                <Card eyebrow="Step 03" title="FRAME Your Story Card" icon={BookOpen} testid="card-frame">
                    <Field label="Brand Voice" value={get(3, "brand_voice_statement")} multiline />
                    {(get(3, "hero_journey_founder_narration") || get(3, "hero_journey_customer_narration")) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                            {get(3, "hero_journey_founder_narration") && (
                                <div className="rounded-xl bg-brand-charcoal text-brand-cream p-4">
                                    <div className="label-eyebrow text-brand-gold mb-1.5">Founder's Journey</div>
                                    <p className="text-sm font-serif leading-relaxed whitespace-pre-line">{get(3, "hero_journey_founder_narration")}</p>
                                </div>
                            )}
                            {get(3, "hero_journey_customer_narration") && (
                                <div className="rounded-xl bg-brand-charcoal text-brand-cream p-4">
                                    <div className="label-eyebrow text-brand-gold mb-1.5">Customer's Journey</div>
                                    <p className="text-sm font-serif leading-relaxed whitespace-pre-line">{get(3, "hero_journey_customer_narration")}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {/* Offers */}
                    {(() => {
                        const offerIds = safeJSON(get(3, "offer_ids")) || [];
                        if (!offerIds.length) return null;
                        return (
                            <div className="mt-4">
                                <div className="label-eyebrow text-brand-bronze mb-2">Offers ({offerIds.length})</div>
                                <div className="space-y-4" data-testid="bp-offers">
                                    {offerIds.map((oid, i) => {
                                        const name = get(3, `${oid}_name`) || `Offer ${i + 1}`;
                                        const price = get(3, `${oid}_price`);
                                        const hook = get(3, `${oid}_hook`);
                                        const story = get(3, `${oid}_story`);
                                        const promise = get(3, `${oid}_promise`);
                                        const elevator = get(3, `${oid}_elevator`);
                                        const stack = (safeJSON(get(3, `${oid}_stack`)) || []).filter((r) => r.item || r.benefit);
                                        return (
                                            <div key={oid} className="rounded-xl bg-secondary/30 p-4">
                                                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                                                    <div className="font-serif text-xl">{name}</div>
                                                    {price && <div className="text-brand-bronze font-serif text-lg">{price}</div>}
                                                </div>
                                                {stack.length > 0 && (
                                                    <ul className="text-sm mt-2 space-y-0.5">
                                                        {stack.map((r) => (
                                                            <li key={r._id || `${r.item}-${r.value}`}>· <span className="font-medium">{r.item}</span>{r.benefit && <> — <span className="text-muted-foreground">{r.benefit}</span></>}{r.value && <> · <span className="text-brand-bronze">{r.value}</span></>}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                                {hook && <Sub label="Hook" value={hook} />}
                                                {story && <Sub label="Story" value={story} />}
                                                {promise && <Sub label="Transformation Promise" value={promise} />}
                                                {elevator && <Sub label="Important Story · Elevator" value={elevator} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </Card>

                {/* IGNITE */}
                <Card eyebrow="Step 04" title="IGNITE Your Brand Card" icon={PaletteIcon} testid="card-ignite">
                    {(() => {
                        const primary = BRAND_ARCHETYPES.find((a) => a.key === get(4, "archetype_primary"));
                        const secondary = BRAND_ARCHETYPES.find((a) => a.key === get(4, "archetype_secondary"));
                        const palette = (() => { const ps = (safeJSON(get(4, "palettes_json")) || {}).palettes || []; return ps.find((p) => p.name === get(4, "palette_chosen")); })();
                        const typo = (() => { const ps = (safeJSON(get(4, "typography_json")) || {}).pairings || []; return ps.find((p) => p.name === get(4, "typography_chosen")); })();
                        const channels = POCKET_MEDIA_CHANNELS.filter((c) => get(4, `pm_${c.key}_enabled`) === "yes");
                        const siteTpl = WEBSITE_HUB_TEMPLATES.find((t) => t.key === get(4, "site_template"));
                        return (
                            <div className="space-y-4">
                                {primary && <Field label="Archetype" value={primary.name + (secondary ? ` · with ${secondary.name}` : "")} large />}
                                {palette && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Palette · {palette.name}</div>
                                        <div className="rounded-lg overflow-hidden max-w-xl">
                                            <div className="flex h-10">{(palette.colors || []).map((c, j) => <div key={j} className="flex-1" style={{ background: c }} title={c} />)}</div>
                                            <div className="flex bg-secondary/30">{(palette.colors || []).map((c, j) => <code key={j} className="flex-1 text-[10px] font-mono text-center py-1 border-r border-border/40 last:border-r-0">{c}</code>)}</div>
                                        </div>
                                    </div>
                                )}
                                {typo && (
                                    <Field label="Typography" value={`${typo.name} · Headline: ${typo.headline || typo.heading || "—"} · Subheadline: ${typo.subheadline || typo.heading || "—"} · Body: ${typo.body || "—"}`} />
                                )}
                                {channels.length > 0 && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Pocket Media Empire</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {channels.map((c) => (
                                                <div key={c.key} className="rounded-xl bg-secondary/30 p-3 text-sm">
                                                    <div className="font-serif text-base">{get(4, `pm_${c.key}_name`) || c.name}</div>
                                                    {get(4, `pm_${c.key}_cadence`) && <div className="text-xs text-muted-foreground">Cadence: {get(4, `pm_${c.key}_cadence`)}</div>}
                                                    {get(4, `pm_${c.key}_kpi`) && <div className="text-xs text-muted-foreground">KPI: {get(4, `pm_${c.key}_kpi`)}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {siteTpl && (
                                    <Field label="Website" value={siteTpl.name} />
                                )}
                                {/* Marketing Plan compact */}
                                {MARKETING_TRACKS.some((t) => MARKETING_TRACK_FIELDS.some((f) => get(4, `mt_${t.key}_${f.key}`))) && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Marketing Plan</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {MARKETING_TRACKS.map((t) => {
                                                const rows = MARKETING_TRACK_FIELDS.map((f) => ({ label: f.label, value: get(4, `mt_${t.key}_${f.key}`) })).filter((r) => r.value);
                                                if (!rows.length) return null;
                                                return (
                                                    <div key={t.key} className="rounded-xl bg-secondary/30 p-3 text-sm">
                                                        <div className="font-serif text-base mb-1">{t.name}</div>
                                                        {rows.map((r) => <div key={r.label} className="mt-1"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.label}</span><div>{r.value}</div></div>)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {/* Calendar compact */}
                                {CALENDAR_PILLARS.some((pl) => CALENDAR_PHASES.some((ph) => get(4, `cal_${pl.key}_${ph.key}`))) && (
                                    <div className="overflow-x-auto">
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">30/60/90 + Beyond Calendar</div>
                                        <table className="min-w-[600px] w-full text-xs">
                                            <thead>
                                                <tr>
                                                    <th className="text-left py-1 pr-2 font-serif text-sm">Pillar</th>
                                                    {CALENDAR_PHASES.map((ph) => <th key={ph.key} className="text-left py-1 px-2 font-serif text-sm">{ph.label}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {CALENDAR_PILLARS.map((pl) => (
                                                    <tr key={pl.key} className="align-top border-t border-border/40">
                                                        <td className="py-2 pr-2 font-medium">{pl.label}</td>
                                                        {CALENDAR_PHASES.map((ph) => <td key={ph.key} className="py-2 px-2 whitespace-pre-wrap leading-relaxed">{get(4, `cal_${pl.key}_${ph.key}`) || <span className="text-muted-foreground">—</span>}</td>)}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </Card>

                {/* NURTURE */}
                <Card eyebrow="Step 05" title="NURTURE The Transformation Card" icon={Heart} testid="card-nurture">
                    <Field label="Continuity Program" value={get(5, "cp_name")} large />
                    <Field label="Price" value={get(5, "cp_price")} />
                    <Field label="Monthly Value" value={get(5, "cp_what_monthly")} multiline />
                    {(() => {
                        const fw = safeJSON(get(5, "framework_json"));
                        if (!fw?.phases?.length) return null;
                        return (
                            <div className="mt-4">
                                <div className="label-eyebrow text-brand-bronze mb-2">Framework Phases</div>
                                <ol className="space-y-1.5 text-sm list-decimal pl-5">
                                    {fw.phases.map((ph, i) => (
                                        <li key={i}><span className="font-medium">{ph.verb} {ph.name}</span> — <span className="text-muted-foreground">{ph.transformation}</span></li>
                                    ))}
                                </ol>
                            </div>
                        );
                    })()}
                </Card>

                {/* EXPAND */}
                <Card eyebrow="Step 06" title="EXPAND Your Influence Card" icon={Globe} testid="card-expand">
                    {(() => {
                        const dream100 = safeJSON(get(6, "dream100_list")) || [];
                        const eventIds = safeJSON(get(6, "events_ids")) || [];
                        const outline = safeJSON(get(6, "book_outline_json"));
                        return (
                            <div className="space-y-4">
                                <Field label="Dream 100" value={`${dream100.length} entries`} />
                                {eventIds.length > 0 && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-2">Live Events ({eventIds.length})</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="bp-events">
                                            {eventIds.map((id, i) => {
                                                const t = EVENT_TYPES.find((x) => x.key === get(6, `${id}_type`));
                                                const name = get(6, `${id}_name`) || (t ? t.name : `Event ${i + 1}`);
                                                const promise = get(6, `${id}_promise`);
                                                return (
                                                    <div key={id} className="rounded-xl bg-secondary/30 p-3 text-sm">
                                                        <div className="font-serif text-base">{name}</div>
                                                        {t && <div className="text-[10px] uppercase tracking-wider text-brand-bronze mt-0.5">{t.name}</div>}
                                                        {promise && <p className="text-xs italic text-muted-foreground mt-1">{promise}</p>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {outline?.title && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1">Book</div>
                                        <div className="font-serif text-xl">{outline.title}</div>
                                        {outline.subtitle && <div className="italic text-muted-foreground text-sm">{outline.subtitle}</div>}
                                        {Array.isArray(outline.chapters) && <div className="text-xs text-muted-foreground mt-1">{outline.chapters.length} chapters outlined</div>}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </Card>

                {/* DELIVER */}
                <Card eyebrow="Step 07" title="DELIVER Exceptional Service Card" icon={Compass} testid="card-deliver">
                    {(() => {
                        const journey = safeJSON(get(7, "journey_json"));
                        const stages = journey?.stages || [];
                        const onboarding = safeJSON(get(7, "onboarding_json"));
                        const seq = onboarding?.sequence || [];
                        const retention = safeJSON(get(7, "retention_json"));
                        const plays = retention?.plays || [];
                        return (
                            <div className="space-y-5">
                                {stages.length > 0 && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Customer Journey Map</div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm bg-secondary/30 rounded-xl">
                                                <thead className="bg-brand-charcoal text-brand-cream"><tr className="text-left text-[11px] uppercase tracking-wider"><th className="py-2 px-3">Stage</th><th className="py-2 px-3">Customer does</th><th className="py-2 px-3">We do</th><th className="py-2 px-3">Risk</th></tr></thead>
                                                <tbody>
                                                    {stages.map((s, i) => (
                                                        <tr key={i} className="border-t border-border/40 align-top">
                                                            <td className="py-2 px-3 font-serif">{i + 1}. {s.name}</td>
                                                            <td className="py-2 px-3">{s.customer_does}</td>
                                                            <td className="py-2 px-3">{s.we_do}</td>
                                                            <td className="py-2 px-3 text-destructive">{s.risk}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                {seq.length > 0 && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Onboarding Sequence ({seq.length} touchpoints)</div>
                                        <ol className="space-y-2 text-sm">
                                            {seq.map((s, i) => (
                                                <li key={i} className="flex gap-3"><span className="font-serif text-brand-bronze w-12 shrink-0">{s.day ? `D${s.day}` : `#${i + 1}`}</span><span><span className="font-medium">{s.title || s.action}</span>{s.detail && <span className="text-muted-foreground"> — {s.detail}</span>}</span></li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                                {plays.length > 0 && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Surprise & Delight Playbook ({plays.length} plays)</div>
                                        <ul className="space-y-1 text-sm">
                                            {plays.map((p, i) => (
                                                <li key={i}>· <span className="font-medium">{p.name || p.trigger}</span>{p.gesture && <span className="text-muted-foreground"> — {p.gesture}</span>}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {DELIVER_QUALITY_PROMPTS.some((p) => get(7, p.key)) && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Quality Standards</div>
                                        <div className="space-y-2 text-sm">
                                            {DELIVER_QUALITY_PROMPTS.map((p) => get(7, p.key) ? (
                                                <div key={p.key}><span className="text-[10px] uppercase tracking-wider text-brand-bronze">{p.label}</span><div className="whitespace-pre-wrap">{get(7, p.key)}</div></div>
                                            ) : null)}
                                        </div>
                                    </div>
                                )}
                                {DELIVER_FEEDBACK_PROMPTS.some((p) => get(7, p.key)) && (
                                    <div>
                                        <div className="label-eyebrow text-brand-bronze mb-1.5">Feedback Loop</div>
                                        <div className="space-y-2 text-sm">
                                            {DELIVER_FEEDBACK_PROMPTS.map((p) => get(7, p.key) ? (
                                                <div key={p.key}><span className="text-[10px] uppercase tracking-wider text-brand-bronze">{p.label}</span><div className="whitespace-pre-wrap">{get(7, p.key)}</div></div>
                                            ) : null)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </Card>

                <div className="mt-8 text-center text-xs text-muted-foreground print:hidden">
                    Built with the Influence Incubator Formula · {new Date().getFullYear()}
                </div>
            </div>

            {/* Print styles */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:mb-8 { margin-bottom: 2rem !important; }
                    .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
                }
            `}</style>
        </div>
    );
}

// ===================== Small layout helpers =====================

function Card({ eyebrow, title, icon: Icon, children, testid }) {
    return (
        <section className="editorial-card p-7 md:p-9 mb-7 print:mb-5 print:break-inside-avoid" data-testid={testid}>
            <div className="flex items-center gap-3 mb-5">
                {Icon && <div className="h-10 w-10 rounded-full bg-brand-gold/15 grid place-items-center"><Icon className="h-5 w-5 text-brand-bronze" /></div>}
                <div>
                    <div className="label-eyebrow text-brand-bronze">{eyebrow}</div>
                    <h3 className="font-serif text-3xl tracking-[-0.01em]">{title}</h3>
                </div>
            </div>
            {children}
        </section>
    );
}

function Field({ label, value, multiline, large }) {
    if (!value) return null;
    return (
        <div className="py-2">
            <div className="label-eyebrow text-brand-bronze mb-1 text-[10px]">{label}</div>
            <div className={large ? "font-serif text-xl" : (multiline ? "text-sm whitespace-pre-wrap leading-relaxed" : "text-base")}>{value}</div>
        </div>
    );
}

function Sub({ label, value }) {
    return (
        <div className="mt-2 pt-2 border-t border-border/40">
            <div className="text-[10px] uppercase tracking-wider text-brand-bronze">{label}</div>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{value}</div>
        </div>
    );
}

function TagGroup({ label, items }) {
    if (!items?.length) return null;
    return (
        <div>
            <div className="label-eyebrow text-brand-bronze mb-1 text-[10px]">{label}</div>
            <div className="flex flex-wrap gap-1.5">
                {items.map((it) => <span key={it} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-bronze border border-brand-gold/30">{it}</span>)}
            </div>
        </div>
    );
}
