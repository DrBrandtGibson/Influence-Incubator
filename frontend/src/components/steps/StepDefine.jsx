import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2, Compass, Target, Heart, Loader2, Check, Image as ImgIcon } from "lucide-react";
import { AIAssistInput } from "@/components/ai/AIAssistInput";
import { authedFetch } from "@/lib/supabase";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { DRIVEN_QUESTIONS, MTP_CATEGORIES, SEVEN_LEVELS_DEEP, CHIEF_AIM_PROMPTS, CHIEF_AIM_HORIZONS, BUSINESS_STRUCTURES } from "@/lib/framework";
import { STEPS } from "@/lib/steps";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const STEP_NUM = 1;

export default function StepDefine({ plan, getInput, setInput, markStepStatus, gotoStep }) {
    const [tab, setTab] = useState("identity");
    const planId = plan.id;

    return (
        <div data-testid="step-define">
            <header className="mb-8">
                <div className="label-eyebrow text-brand-bronze mb-2">Step 01 · Free</div>
                <h1 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">DEFINE Your Purpose</h1>
                <p className="mt-3 text-muted-foreground max-w-2xl">Mission, Massive Transformative Purpose, Deep WHY, Definite Chief Aim. The foundation everything else stands on.</p>
            </header>

            <Tabs value={tab} onValueChange={setTab} className="">
                <TabsList className="mb-8 flex-wrap h-auto p-1 bg-secondary/60 rounded-xl">
                    {[
                        ["identity", Building2, "Identity"],
                        ["driven", Compass, "Driven, not Drifter"],
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

                <TabsContent value="identity"><BusinessIdentity planId={planId} plan={plan} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="driven"><DrivenSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="mtp"><MTPSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="why"><DeepWhySection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="chief"><ChiefAimSection planId={planId} getInput={getInput} setInput={setInput} /></TabsContent>
                <TabsContent value="output"><OutputCard planId={planId} plan={plan} getInput={getInput} setInput={setInput} markStepStatus={markStepStatus} gotoStep={gotoStep} /></TabsContent>
            </Tabs>
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

function BusinessIdentity({ planId, plan, getInput, setInput }) {
    const [genBusy, setGenBusy] = useState(false);
    const [logoBusy, setLogoBusy] = useState(false);
    const [structBusy, setStructBusy] = useState(false);

    async function generateNames() {
        setGenBusy(true);
        try {
            await streamingGenerate({
                field_key: "business_names",
                field_label: "Business name brainstorm",
                instructions: "Generate exactly 5 distinct business name candidates for this venture. For each: 1) the name, 2) a one-line rationale (memorable / meaningful), 3) memorability score (1-10), 4) a 1-line domain hint (.com availability heuristic + alternatives). Format as a clean numbered list. Be original and specific to this user's plan context.",
                planId, stepNum: 1,
                onText: (t) => setInput(1, "business_names", t)
            });
        } finally {
            setGenBusy(false);
        }
    }

    async function generateLogoPrompts() {
        setLogoBusy(true);
        try {
            await streamingGenerate({
                field_key: "logo_prompts",
                field_label: "Logo prompts (Midjourney/DALL·E)",
                instructions: "Generate exactly 5 detailed image-generation prompts (for Midjourney/DALL·E) for the logo. Each prompt should be vivid, technically specific (style, composition, palette, mood), and tied to the brand's likely identity. Numbered list.",
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
                instructions: "Recommend the best business structure (Sole Prop / LLC / S-Corp / Non-Profit) for this user. Provide: 1) recommended structure, 2) reasoning grounded in their stage and likely revenue, 3) EIN guidance (1-2 sentences), 4) a generic state-registration link suggestion (e.g. 'search [your state] Secretary of State business registration'). Be concrete and brief.",
                planId, stepNum: 1,
                onText: (t) => setInput(1, "structure_recommendation", t)
            });
        } finally { setStructBusy(false); }
    }

    async function uploadLogo(file) {
        if (!file) return;
        setLogoBusy(true);
        try {
            const path = `${planId}/${Date.now()}_${file.name.replace(/[^A-Za-z0-9._-]/g, "_")}`;
            const { error } = await supabase.storage.from("iif-logos").upload(path, file, { cacheControl: "3600", upsert: false });
            if (error) throw error;
            const { data } = supabase.storage.from("iif-logos").getPublicUrl(path);
            setInput(1, "logo_url", data.publicUrl);
            await authedFetch(`/plans/${planId}/inputs`, { method: "POST", body: JSON.stringify({ step_num: 1, field_key: "logo_url", value: data.publicUrl }) });
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
                        <input type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files?.[0])} className="text-sm" data-testid="logo-upload-input" />
                        {getInput(1, "logo_url") && (
                            <div className="mt-4">
                                <img src={getInput(1, "logo_url")} alt="logo" className="max-h-32 rounded-md" data-testid="logo-preview" />
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

            <Section eyebrow="Structure" title="Pick the right business structure." helper="Get an AI recommendation based on your stage — then validate with your accountant.">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {BUSINESS_STRUCTURES.map((s) => (
                        <Card key={s.key} className="p-4">
                            <div className="font-serif text-base">{s.name}</div>
                            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{s.best}</p>
                        </Card>
                    ))}
                </div>
                <Button onClick={suggestStructure} disabled={structBusy} variant="outline" className="rounded-full" data-testid="suggest-structure-button">
                    {structBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Recommend a structure for me</>}
                </Button>
                {getInput(1, "structure_recommendation") && (
                    <div className="mt-5 editorial-card p-5 whitespace-pre-wrap text-sm leading-relaxed" data-testid="structure-output">{getInput(1, "structure_recommendation")}</div>
                )}
            </Section>
        </>
    );
}

function DrivenSection({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Driven, not Drifter" title="Five questions to wake up your direction." helper="Answer each. Use AI to help when the page feels blank.">
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

function MTPSection({ planId, getInput, setInput }) {
    const [active, setActive] = useState(MTP_CATEGORIES[0].key);
    const [synthBusy, setSynthBusy] = useState(false);

    async function synthesizeMTP() {
        setSynthBusy(true);
        try {
            // Collect all answers
            const all = MTP_CATEGORIES.flatMap((cat) => cat.questions.map((q, i) => ({ cat: cat.label, q, a: getInput(1, `mtp_${cat.key}_${i + 1}`) })));
            const ctx = all.filter((x) => x.a).map((x) => `[${x.cat}] ${x.q}\n=> ${x.a}`).join("\n\n");
            await streamingGenerate({
                field_key: "mtp_statement",
                field_label: "Massive Transformative Purpose statement",
                extra_context: { reflections: ctx },
                instructions: "From these reflections across Passions, Values, Strengths, Patterns and Impact, synthesize a single Massive Transformative Purpose (MTP) statement that is 8–10 words. It should be inspirational, action-oriented, and uniquely the user's. Return ONLY the MTP statement — nothing else.",
                planId, stepNum: 1, mode: "synthesize",
                onText: (t) => setInput(1, "mtp_statement", t)
            });
        } finally { setSynthBusy(false); }
    }

    return (
        <Section eyebrow="MTP Discovery" title="Massive Transformative Purpose." helper="Five categories, 50 reflections. Don't answer all at once — answer the ones that pull you. Then synthesize.">
            <div className="flex flex-wrap gap-2 mb-5">
                {MTP_CATEGORIES.map((c) => (
                    <button key={c.key} onClick={() => setActive(c.key)}
                        className={`text-xs uppercase tracking-[0.18em] px-3 py-1.5 rounded-full border ${active === c.key ? "bg-brand-charcoal text-brand-cream border-brand-charcoal" : "hover:bg-secondary"}`}
                        data-testid={`mtp-cat-${c.key}-button`}>{c.label}</button>
                ))}
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
                </div>
            ))}
            <div className="mt-8 dark-cinematic-panel p-7 md:p-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                    <div>
                        <div className="label-eyebrow text-brand-gold mb-1">Synthesize</div>
                        <h3 className="font-serif text-2xl">Distill all reflections into your MTP.</h3>
                        <p className="text-brand-cream/70 text-sm mt-1">8–10 words. Inspirational. Uniquely yours.</p>
                    </div>
                    <Button onClick={synthesizeMTP} disabled={synthBusy} className="cta-red rounded-full h-11 px-5" data-testid="synthesize-mtp-button">
                        {synthBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" /> Synthesize my MTP</>}
                    </Button>
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

function DeepWhySection({ planId, getInput, setInput }) {
    const levels = [1, 2, 3, 4, 5, 6, 7];
    return (
        <Section eyebrow="7 Levels Deep WHY" title="Find your real WHY." helper={SEVEN_LEVELS_DEEP.intro}>
            <div>
                <div className="font-serif text-lg mb-2">Starter prompt</div>
                <AIAssistInput planId={planId} stepNum={1} fieldKey="why_starter" fieldLabel={SEVEN_LEVELS_DEEP.starterPrompt}
                    rows={3}
                    value={getInput(1, "why_starter")} onChange={(v) => setInput(1, "why_starter", v)}
                    placeholder="e.g. Building a wellness practice that gives me freedom to choose my schedule…" />
                <div className="gold-divider my-7" />
                <div className="space-y-5">
                    {levels.map((lv) => (
                        <div key={lv} className="editorial-card p-5">
                            <div className="label-eyebrow text-brand-bronze mb-2">Level {lv}</div>
                            <div className="font-serif text-base mb-2">Why is that important?</div>
                            <AIAssistInput planId={planId} stepNum={1} fieldKey={`why_level_${lv}`} fieldLabel={`Level ${lv}: Why is that important?`} subModule="7 Levels Deep WHY"
                                rows={2}
                                value={getInput(1, `why_level_${lv}`)} onChange={(v) => setInput(1, `why_level_${lv}`, v)} />
                        </div>
                    ))}
                </div>
                <div className="gold-divider my-7" />
                <div className="font-serif text-lg mb-2">Your distilled Deep WHY (one sentence)</div>
                <AIAssistInput planId={planId} stepNum={1} fieldKey="deep_why" fieldLabel="Distilled Deep WHY (one sentence)" subModule="7 Levels Deep WHY"
                    rows={2}
                    placeholder="Because…"
                    value={getInput(1, "deep_why")} onChange={(v) => setInput(1, "deep_why", v)} />
            </div>
        </Section>
    );
}

function ChiefAimSection({ planId, getInput, setInput }) {
    return (
        <Section eyebrow="Definite Chief Aim" title="Your aim, in writing." helper="Answer the four prompts for each horizon: 1 year, 3 years, 5 years.">
            <div className="space-y-8">
                {CHIEF_AIM_HORIZONS.map((h) => (
                    <div key={h.key} className="editorial-card p-6">
                        <div className="font-serif text-2xl mb-1">{h.label}</div>
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

function OutputCard({ planId, plan, getInput, setInput, markStepStatus, gotoStep }) {
    const data = {
        name: getInput(1, "business_name"),
        logo: getInput(1, "logo_url"),
        mtp: getInput(1, "mtp_statement"),
        why: getInput(1, "deep_why"),
        aim_y1_what: getInput(1, "chief_y1_what"),
        structure: getInput(1, "structure_recommendation")
    };

    const [marking, setMarking] = useState(false);
    async function complete() {
        setMarking(true);
        try {
            await markStepStatus(1, "complete");
            toast.success("Step 1 marked complete.");
            const next = STEPS.find((s) => s.num === 2);
            gotoStep(next);
        } finally { setMarking(false); }
    }

    return (
        <Section eyebrow="Your Output" title="Your Step 1 plan card." helper="Edit anything by jumping back to the relevant tab. This is your living source-of-truth.">
            <div className="editorial-card p-7 md:p-8" data-testid="step1-output-card">
                <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                        <div className="label-eyebrow text-brand-bronze">Business</div>
                        <div className="font-serif text-3xl mt-1">{data.name || "—"}</div>
                    </div>
                    {data.logo && <img src={data.logo} alt="logo" className="h-20 w-20 object-contain rounded" />}
                </div>
                <div className="gold-divider my-6" />
                <Field label="Massive Transformative Purpose" value={data.mtp} />
                <Field label="Deep WHY" value={data.why} />
                <Field label="1-Year Chief Aim (WHAT)" value={data.aim_y1_what} />
                <Field label="Recommended Structure" value={data.structure} multiline />
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={complete} disabled={marking} className="cta-red rounded-full h-11 px-6" data-testid="complete-step1-button">
                    {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Complete Step 1 → Begin Step 2</>}
                </Button>
            </div>
        </Section>
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

// Helper: streaming generate using same SSE pattern as AIAssistInput
async function streamingGenerate({ field_key, field_label, instructions, planId, stepNum, mode = "generate", extra_context, onText }) {
    try {
        const url = `/ai/${mode === "synthesize" ? "synthesize" : "generate"}`;
        const res = await authedFetch(url, {
            method: "POST",
            body: JSON.stringify({
                plan_id: planId, step_num: stepNum, field_key, field_label, instructions, extra_context
            })
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
                let payload = {}; try { payload = JSON.parse(dataStr); } catch {}
                if (event === "chunk" && payload.text) { acc += payload.text; onText && onText(acc); }
                else if (event === "done") { acc = payload.text || acc; onText && onText(acc); }
                else if (event === "error") { throw new Error(payload.error || "Generation error"); }
            }
        }
        return acc;
    } catch (e) { toast.error(e.message || "AI failed"); }
}
