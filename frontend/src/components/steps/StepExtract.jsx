import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Check, Target, Users, Compass, Layers, IdCard, Download, ArrowLeft, ArrowRight, ChevronRight, Wand2, ImageIcon } from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SIX_NEEDS, MASLOW_LEVELS, NICHE_OPTIONS, NICHE_QUESTIONS, DEMOGRAPHICS_QUESTIONS, PSYCHOGRAPHICS_QUESTIONS } from "@/lib/framework";
import { STEPS } from "@/lib/steps";
import { toPng } from "html-to-image";
import { MaslowImagePyramid } from "./MaslowImagePyramid";

const TAB_ORDER = ["maslow", "needs", "niche", "demo", "psycho", "card"];
const TAB_LABELS = {
    maslow: "Maslow",
    needs: "6 Needs",
    niche: "Niche (WHAT)",
    demo: "Demographics (WHO)",
    psycho: "Psychographics (WHERE)",
    card: "Dream Customer Card"
};

export default function StepExtract({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("maslow");
    const planId = plan.id;
    const goToTab = (k) => { setTab(k); window.scrollTo({ top: 0, behavior: "smooth" }); };
    const idx = TAB_ORDER.indexOf(tab);
    const prevTab = idx > 0 ? TAB_ORDER[idx - 1] : null;
    const nextTab = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;

    return (
        <div data-testid="step-extract">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 02 · Free</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">EXTRACT Your Audience</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">Maslow + Tony Robbins’ Six Needs + Niche + Demographics + Psychographics → your Dream Customer trading card.</p>
            </header>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["maslow", Layers, "Maslow"],
                        ["needs", Compass, "6 Needs"],
                        ["niche", Target, "Niche (WHAT)"],
                        ["demo", Users, "Demographics (WHO)"],
                        ["psycho", Sparkles, "Psychographics (WHERE)"],
                        ["card", IdCard, "Dream Customer Card"]
                    ].map(([k, Icon, label]) => (
                        <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card data-[state=active]:shadow-sm rounded-lg gap-2" data-testid={`extract-tab-${k}`}>
                            <Icon className="h-4 w-4" /> {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="maslow"><MaslowSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="needs"><NeedsSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="niche"><NicheSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="demo"><DemoSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="psycho"><PsychoSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="card"><DreamCard planId={planId} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>

            {tab !== "card" && (
                <div className="mt-12 flex items-center justify-between border-t pt-6" data-testid="extract-section-nav">
                    {prevTab ? (
                        <Button variant="ghost" onClick={() => goToTab(prevTab)} data-testid="extract-prev-button">
                            <ArrowLeft className="h-4 w-4 mr-2" /> {TAB_LABELS[prevTab]}
                        </Button>
                    ) : <span />}
                    {nextTab && (
                        <Button onClick={() => goToTab(nextTab)} className="cta-red rounded-full h-11 px-5" data-testid="extract-next-button">
                            Next: {TAB_LABELS[nextTab]} <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}

function Section({ title, helper, eyebrow, children }) {
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

function MaslowSection({ planId, getInput, setInput }) {
    const selected = parseList(getInput(2, "maslow_levels"));
    function toggle(key) {
        const next = selected.includes(key) ? selected.filter((x) => x !== key) : [...selected, key];
        setInput(2, "maslow_levels", JSON.stringify(next));
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", body: JSON.stringify({ step_num: 2, field_key: "maslow_levels", value: JSON.stringify(next) }) });
    }
    return (
        <Section eyebrow="Maslow’s Hierarchy" title="Where does your customer live on the pyramid?" helper="Click any tier on the pyramid to mark which level(s) of need your work serves. Selecting more than one is normal — most powerful work touches several at once.">
            <MaslowImagePyramid selected={selected} onToggle={toggle} />
        </Section>
    );
}

function NeedsSection({ planId, getInput, setInput }) {
    const selected = parseList(getInput(2, "robbins_needs"));
    function toggle(key) {
        const next = selected.includes(key) ? selected.filter((x) => x !== key) : [...selected, key];
        setInput(2, "robbins_needs", JSON.stringify(next));
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", body: JSON.stringify({ step_num: 2, field_key: "robbins_needs", value: JSON.stringify(next) }) });
    }
    // Six segments around a circle
    const cx = 220, cy = 220, r = 160;
    return (
        <Section eyebrow="Tony Robbins’ Six Needs" title="Which needs does your offer fulfill?" helper="Pick at least 3. Most powerful brands hit 3–4 needs at once.">
            <div className="flex flex-col md:flex-row items-center gap-8">
                <svg viewBox="0 0 440 440" className="w-full max-w-[440px]" aria-hidden="true">
                    {SIX_NEEDS.map((n, i) => {
                        const a0 = (-Math.PI / 2) + (i * Math.PI / 3);
                        const a1 = a0 + Math.PI / 3;
                        const x0 = cx + r * Math.cos(a0); const y0 = cy + r * Math.sin(a0);
                        const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
                        const am = a0 + (Math.PI / 6);
                        const lx = cx + (r * 0.62) * Math.cos(am);
                        const ly = cy + (r * 0.62) * Math.sin(am);
                        const active = selected.includes(n.key);
                        return (
                            <g key={n.key} onClick={() => toggle(n.key)} style={{ cursor: "pointer" }} data-testid={`six-needs-segment-${n.key}-button"`}>
                                <path d={`M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`}
                                    fill={active ? "hsl(var(--brand-gold) / 0.18)" : "hsl(var(--card))"}
                                    stroke="hsl(var(--brand-gold))" strokeWidth="1.5" />
                                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontFamily="EB Garamond, serif" fontSize="15" fill={active ? "hsl(var(--brand-bronze))" : "hsl(var(--foreground))"}>{n.label}</text>
                            </g>
                        );
                    })}
                    <circle cx={cx} cy={cy} r="36" fill="hsl(var(--brand-charcoal))" />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--brand-gold))" fontSize="11" fontFamily="Inter" letterSpacing="2">CORE</text>
                </svg>
                <div className="flex-1">
                    <div className="label-eyebrow mb-3">Selected ({selected.length})</div>
                    <ul className="space-y-2">
                        {SIX_NEEDS.map((n) => {
                            const active = selected.includes(n.key);
                            return (
                                <li key={n.key}>
                                    <button onClick={() => toggle(n.key)} className={`w-full text-left p-3 rounded-xl border transition-colors ${active ? "border-brand-gold bg-brand-gold/10" : "border-border hover:bg-secondary"}`} data-testid={`six-needs-list-${n.key}-button`}>
                                        <div className="font-serif text-base">{n.label}</div>
                                        <div className="text-xs text-muted-foreground">{n.helper}</div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </Section>
    );
}

function NicheSection({ planId, getInput, setInput }) {
    const chosen = getInput(2, "niche_type");
    function pick(key) {
        setInput(2, "niche_type", key);
        authedFetch(`/plans/${planId}/inputs`, { method: "POST", body: JSON.stringify({ step_num: 2, field_key: "niche_type", value: key }) });
    }
    return (
        <>
            <Section eyebrow="Niche (WHAT)" title="What kind of niche are you?" helper="Pick the closest fit. You can change later.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {NICHE_OPTIONS.map((o) => (
                        <button key={o.key} onClick={() => pick(o.key)} className={`text-left editorial-card p-5 transition-shadow ${chosen === o.key ? "ring-2 ring-brand-gold" : "hover:shadow-md"}`} data-testid={`niche-card-${o.key}`}>
                            <div className="font-serif text-xl">{o.label}</div>
                            <p className="text-sm text-muted-foreground mt-1">{o.desc}</p>
                        </button>
                    ))}
                </div>
            </Section>
            <Section eyebrow="Niche Questions" title="Ten questions to sharpen your micro-niche." helper="AI assist will use your earlier answers to keep this consistent.">
                <div className="space-y-5">
                    {NICHE_QUESTIONS.map((q, i) => (
                        <div key={i}>
                            <div className="label-eyebrow mb-1.5">Q{i + 1}</div>
                            <div className="font-serif text-base mb-2">{q}</div>
                            <AIAssistInput planId={planId} stepNum={2} fieldKey={`niche_q${i + 1}`} fieldLabel={q} subModule="Niche"
                                rows={3}
                                value={getInput(2, `niche_q${i + 1}`)} onChange={(v) => setInput(2, `niche_q${i + 1}`, v)} />
                        </div>
                    ))}
                </div>
                <div className="gold-divider my-6" />
                <div className="font-serif text-lg mb-2">Your micro-niche statement (one sentence)</div>
                <AIAssistInput planId={planId} stepNum={2} fieldKey="micro_niche_statement" fieldLabel="Single-sentence micro-niche statement" subModule="Niche"
                    rows={2}
                    placeholder="I help [who] go from [before] to [after] using [unique method]."
                    value={getInput(2, "micro_niche_statement")} onChange={(v) => setInput(2, "micro_niche_statement", v)} />
            </Section>
        </>
    );
}

function DemoSection({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Demographics (WHO)" title="Who are they, factually?" helper="Use AI to suggest specific values that match your prior answers.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {DEMOGRAPHICS_QUESTIONS.map((d) => (
                    <div key={d.key}>
                        <div className="label-eyebrow mb-1.5">{d.q}</div>
                        <AIAssistInput planId={planId} stepNum={2} fieldKey={`demo_${d.key}`} fieldLabel={d.q} subModule="Demographics"
                            rows={2}
                            value={getInput(2, `demo_${d.key}`)} onChange={(v) => setInput(2, `demo_${d.key}`, v)} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

function PsychoSection({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Psychographics (WHERE)" title="Where do they live, inwardly?" helper="This is where your message will land. AI assist is most powerful here.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {PSYCHOGRAPHICS_QUESTIONS.map((d) => (
                    <div key={d.key}>
                        <div className="label-eyebrow mb-1.5">{d.q}</div>
                        <AIAssistInput planId={planId} stepNum={2} fieldKey={`psycho_${d.key}`} fieldLabel={d.q} subModule="Psychographics"
                            rows={3}
                            value={getInput(2, `psycho_${d.key}`)} onChange={(v) => setInput(2, `psycho_${d.key}`, v)} />
                    </div>
                ))}
            </div>
        </Section>
    );
}

function DreamCard({ planId, getInput, setInput, markStepStatus, gotoStep }) {
    const cardRef = useRef(null);
    const [downloading, setDownloading] = useState(false);
    const [marking, setMarking] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [generatingName, setGeneratingName] = useState(false);
    const [generatingPortrait, setGeneratingPortrait] = useState(false);

    const maslowKeys = parseList(getInput(2, "maslow_levels"));
    const needsKeys = parseList(getInput(2, "robbins_needs"));
    const maslowLabels = MASLOW_LEVELS.filter((m) => maslowKeys.includes(m.key)).map((m) => m.label);
    const needsLabels = SIX_NEEDS.filter((n) => needsKeys.includes(n.key)).map((n) => n.label);

    const data = {
        name: getInput(2, "dc_name") || "Your Dream Customer",
        photoUrl: getInput(2, "dc_photo") || "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&q=80",
        nicheLabel: NICHE_OPTIONS.find((n) => n.key === getInput(2, "niche_type"))?.label || "—",
        microNiche: getInput(2, "micro_niche_statement"),
        demographics: DEMOGRAPHICS_QUESTIONS.map((d) => ({ k: d.q, v: getInput(2, `demo_${d.key}`) })).filter((x) => x.v).slice(0, 5),
        psychographics: PSYCHOGRAPHICS_QUESTIONS.map((d) => ({ k: d.q, v: getInput(2, `psycho_${d.key}`) })).filter((x) => x.v).slice(0, 5),
        maslow: maslowLabels,
        needs: needsLabels,
    };

    async function suggestName() {
        setGeneratingName(true);
        try {
            const demoSummary = DEMOGRAPHICS_QUESTIONS.map((d) => `${d.q}: ${getInput(2, `demo_${d.key}`) || ""}`).filter((s) => !s.endsWith(": ")).join(" | ").slice(0, 800);
            const psychoSummary = PSYCHOGRAPHICS_QUESTIONS.map((d) => `${d.q}: ${getInput(2, `psycho_${d.key}`) || ""}`).filter((s) => !s.endsWith(": ")).join(" | ").slice(0, 800);
            const res = await authedFetch("/ai/synthesize", {
                method: "POST",
                body: JSON.stringify({
                    plan_id: planId,
                    step_num: 2,
                    field_key: "dc_name",
                    field_label: "Dream Customer Persona Name",
                    sub_module: "Dream Customer Card",
                    instructions: `Suggest ONE memorable persona name for this dream customer, in the format "<First Name> the <Identity>" (e.g., "Maya the High-Achiever", "Daniel the Quiet Founder"). Use ONLY the name — no quotes, no explanation, no punctuation around it. Base the identity on the strongest demographic + psychographic signals. Demographics: ${demoSummary}. Psychographics: ${psychoSummary}.`,
                }),
            });
            if (!res.ok) throw new Error("AI request failed");
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            let final = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const events = buf.split("\n\n");
                buf = events.pop() || "";
                for (const ev of events) {
                    const m = ev.match(/^event: (\w+)\ndata: (.+)$/m);
                    if (!m) continue;
                    if (m[1] === "done") {
                        try { final = JSON.parse(m[2]).text || ""; } catch { /* */ }
                    }
                }
            }
            const cleaned = final.trim().replace(/^["“'']|["”'']$/g, "").split("\n")[0].trim();
            if (cleaned) {
                setInput(2, "dc_name", cleaned);
                authedFetch(`/plans/${planId}/inputs`, { method: "POST", body: JSON.stringify({ step_num: 2, field_key: "dc_name", value: cleaned }) });
                toast.success(`Name suggested: ${cleaned}`);
            }
        } catch (e) {
            toast.error("Could not suggest a name. Try again.");
        } finally {
            setGeneratingName(false);
        }
    }

    async function generatePortrait() {
        setGeneratingPortrait(true);
        toast.message("Painting your customer…", { description: "This usually takes 5–15 seconds." });
        try {
            const res = await authedFetch("/ai/generate-portrait", {
                method: "POST",
                body: JSON.stringify({ plan_id: planId, style: "editorial-portrait" }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.detail || "Portrait generation failed.");
            }
            const j = await res.json();
            if (j.url) {
                setInput(2, "dc_photo", j.url);
                toast.success("Portrait generated.");
            }
        } catch (e) {
            toast.error(e.message || "Could not generate portrait.");
        } finally {
            setGeneratingPortrait(false);
        }
    }

    async function exportPng() {
        if (!cardRef.current) return;
        setDownloading(true);
        try {
            const url = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: "#ffffff" });
            const a = document.createElement("a");
            a.href = url; a.download = `${(data.name || "dream-customer").replace(/\s+/g, "-").toLowerCase()}-card.png`; a.click();
            toast.success("Card downloaded.");
        } catch (e) { toast.error("Could not export card."); }
        finally { setDownloading(false); }
    }

    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(2, "complete");
            setShowCelebration(true);
        } finally { setMarking(false); }
    }

    if (showCelebration) return <Celebration onContinue={() => { gotoStep(STEPS[2]); }} onSkip={() => setShowCelebration(false)} />;

    return (
        <Section eyebrow="Trading Card" title="Your Dream Customer." helper="AI can suggest a persona name and paint a portrait — both grounded in your Demographics & Psychographics answers. Update those tabs to change the card.">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
                <div className="lg:col-span-1 space-y-4">
                    <div>
                        <div className="label-eyebrow mb-1.5">Customer name (or alias)</div>
                        <Input value={getInput(2, "dc_name")} onChange={(e) => setInput(2, "dc_name", e.target.value)} placeholder="e.g. Maya the High-Achiever" data-testid="dc-name-input" />
                        <Button onClick={suggestName} disabled={generatingName} size="sm" variant="outline" className="mt-2 w-full rounded-lg" data-testid="dc-suggest-name-button">
                            {generatingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Wand2 className="h-3.5 w-3.5 mr-2" /> Suggest a name with AI</>}
                        </Button>
                    </div>
                    <div>
                        <div className="label-eyebrow mb-1.5">Photo</div>
                        <Input value={getInput(2, "dc_photo")} onChange={(e) => setInput(2, "dc_photo", e.target.value)} placeholder="https://…" data-testid="dc-photo-input" />
                        <Button onClick={generatePortrait} disabled={generatingPortrait} size="sm" variant="outline" className="mt-2 w-full rounded-lg" data-testid="dc-generate-portrait-button">
                            {generatingPortrait ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Painting…</> : <><ImageIcon className="h-3.5 w-3.5 mr-2" /> Generate portrait with AI</>}
                        </Button>
                        <p className="text-[11px] text-muted-foreground mt-1">Or paste any public image URL.</p>
                    </div>
                    <Button onClick={exportPng} disabled={downloading} className="w-full rounded-full" variant="outline" data-testid="dream-customer-export-png-button">
                        {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-2" /> Export as PNG (300dpi)</>}
                    </Button>
                    <Button onClick={complete} disabled={marking} className="cta-red w-full rounded-full h-11" data-testid="complete-step2-button">
                        {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 2</>}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">Tip: edit any field in the Demographics or Psychographics tabs above to update the card.</p>
                </div>
                <div className="lg:col-span-2 flex justify-center">
                    <div ref={cardRef} className="shrink-0" style={{ width: 460 }} data-testid="dream-customer-trading-card">
                        <CardArtwork data={data} />
                    </div>
                </div>
            </div>
        </Section>
    );
}

function CardArtwork({ data }) {
    return (
        <div className="rounded-[20px] p-3" style={{ background: "linear-gradient(135deg, #D2B56A 0%, #86653A 50%, #D2B56A 100%)" }}>
            <div className="rounded-[16px] bg-[#FAF7F0] p-4 relative overflow-hidden" style={{ aspectRatio: "5/7.6" }}>
                {/* Top bar */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#86653A] font-sans">Dream Customer</div>
                        <div className="font-serif text-2xl text-[#292822] leading-tight">{data.name}</div>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-full bg-[#031A01] text-[#D2B56A] whitespace-nowrap">{data.nicheLabel}</div>
                </div>
                {/* Art window */}
                <div className="relative rounded-md overflow-hidden border-2 border-[#D2B56A]" style={{ aspectRatio: "4/3" }}>
                    <img src={data.photoUrl} alt={data.name} crossOrigin="anonymous" className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop"; }} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,255,255,0.05) 0%, rgba(210,181,106,0.06) 50%, rgba(255,255,255,0.05) 100%)" }} />
                </div>
                {/* Maslow & Needs strip */}
                <div className="mt-2 grid grid-cols-2 gap-2 text-[9px] text-[#2F2F2F]">
                    <div>
                        <div className="uppercase tracking-[0.18em] text-[#86653A] mb-0.5">Maslow</div>
                        <div className="flex flex-wrap gap-1">
                            {data.maslow.length === 0 && <span className="text-[#86653A]/70">—</span>}
                            {data.maslow.map((m) => (<span key={m} className="px-1.5 py-0.5 rounded bg-[#031A01]/90 text-[#D2B56A] leading-tight">{m}</span>))}
                        </div>
                    </div>
                    <div>
                        <div className="uppercase tracking-[0.18em] text-[#86653A] mb-0.5">Core Needs</div>
                        <div className="flex flex-wrap gap-1">
                            {data.needs.length === 0 && <span className="text-[#86653A]/70">—</span>}
                            {data.needs.map((n) => (<span key={n} className="px-1.5 py-0.5 rounded bg-[#D2B56A]/30 text-[#5a4520] leading-tight">{n}</span>))}
                        </div>
                    </div>
                </div>
                {/* Two columns */}
                <div className="mt-2 grid grid-cols-2 gap-3 text-[10px] text-[#2F2F2F]">
                    <div>
                        <div className="text-[9px] uppercase tracking-[0.18em] text-[#86653A] mb-1">Demographics</div>
                        <ul className="space-y-0.5">
                            {data.demographics.length === 0 && <li className="text-[#86653A]/70">Fill in WHO they are…</li>}
                            {data.demographics.map((x, i) => (<li key={i} className="line-clamp-2">• {x.v}</li>))}
                        </ul>
                    </div>
                    <div>
                        <div className="text-[9px] uppercase tracking-[0.18em] text-[#86653A] mb-1">Psychographics</div>
                        <ul className="space-y-0.5">
                            {data.psychographics.length === 0 && <li className="text-[#86653A]/70">Fill in WHERE they live…</li>}
                            {data.psychographics.map((x, i) => (<li key={i} className="line-clamp-2">• {x.v}</li>))}
                        </ul>
                    </div>
                </div>
                {/* Flavor text */}
                {data.microNiche && (
                    <div className="absolute left-4 right-4 bottom-3 italic font-serif text-[#86653A] text-xs leading-snug border-t border-[#D2B56A]/40 pt-2">“{data.microNiche}”</div>
                )}
            </div>
        </div>
    );
}

function Celebration({ onContinue, onSkip }) {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-3xl mx-auto py-10" data-testid="step2-celebration">
            <div className="dark-cinematic-panel p-10 md:p-14 text-center relative overflow-hidden">
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 -left-16 h-[400px] w-[400px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(closest-side, hsl(var(--brand-gold) / 0.55), transparent)" }} />
                </div>
                <div className="label-eyebrow text-brand-gold mb-3">You’ve completed the foundation</div>
                <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">Beautiful work.</h2>
                <p className="mt-4 text-brand-cream/80 max-w-xl mx-auto">You’ve defined your purpose and extracted the human at the center of your work. Most coaches don’t get this clear in their first year. Steps 3–7 take this clarity and turn it into a complete brand and business.</p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button onClick={onContinue} className="cta-red rounded-full h-12 px-7" data-testid="celebration-upgrade-button">
                        <Sparkles className="h-4 w-4 mr-2" /> See what comes next →
                    </Button>
                    <Button onClick={onSkip} variant="outline" className="rounded-full h-12 px-7 bg-transparent text-brand-cream border-white/20 hover:bg-white/5" data-testid="celebration-stay-button">
                        Stay here
                    </Button>
                </div>
                <p className="mt-6 text-xs text-brand-cream/60">7-day money-back guarantee · Lifetime $97 · Monthly $19</p>
            </div>
        </motion.div>
    );
}

function parseList(s) {
    if (!s) return [];
    try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}
