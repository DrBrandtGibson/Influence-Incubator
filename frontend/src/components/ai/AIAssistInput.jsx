import { useEffect, useRef, useState } from "react";
import { Sparkles, Plus, RefreshCcw, Square, Copy, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { authedFetch } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/**
 * AIAssistInput — wraps an Input or Textarea with a floating toolbar (Answer / Expand / Refine).
 * Streams from /api/ai/<mode> via SSE-like fetch ReadableStream.
 * Props:
 *  - planId: string | null
 *  - stepNum: 1..7
 *  - fieldKey: stable identifier for the field (used as input upsert key)
 *  - fieldLabel: the question text being answered (sent as context to the AI)
 *  - subModule: optional human-readable sub-module label
 *  - extraContext: optional JSON object
 *  - value, onChange: controlled value (string)
 *  - multiline (default true)
 *  - placeholder, autoSave (auto-saves to plan_inputs on blur, default true)
 *  - locked (boolean) — if true, AI buttons disabled
 *  - rows (number) — default 4
 *  - testIdPrefix — used to compose data-testid values
 */
export const AIAssistInput = ({
    planId,
    stepNum,
    fieldKey,
    fieldLabel,
    subModule = "",
    extraContext = null,
    value,
    onChange,
    multiline = true,
    placeholder = "Type your answer…",
    autoSave = true,
    locked = false,
    rows = 4,
    testIdPrefix
}) => {
    const [busy, setBusy] = useState(false);
    const [streamed, setStreamed] = useState("");
    const [refineOpen, setRefineOpen] = useState(false);
    const [refineText, setRefineText] = useState("");
    const abortRef = useRef(null);
    const lastSavedRef = useRef(value);

    const tid = (slug) => `${testIdPrefix || `field-${stepNum}-${fieldKey}`}-${slug}`;

    async function persist(currentValue) {
        if (!planId || !autoSave) return;
        if (currentValue === lastSavedRef.current) return;
        try {
            const res = await authedFetch(`/plans/${planId}/inputs`, {
                method: "POST",
                body: JSON.stringify({ step_num: stepNum, field_key: fieldKey, value: currentValue || "" })
            });
            if (res.ok) lastSavedRef.current = currentValue;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("persist failed", e);
        }
    }

    async function runAI(mode, instructions = "") {
        if (locked) {
            toast.error("This step is locked. Upgrade to use AI here.");
            return;
        }
        if (busy) return;
        setBusy(true);
        setStreamed("");
        const controller = new AbortController();
        abortRef.current = controller;
        try {
            const url = `/ai/${mode === "answer" ? "answer-question" : mode === "expand" ? "expand-answer" : "refine"}`;
            const res = await authedFetch(url, {
                method: "POST",
                signal: controller.signal,
                body: JSON.stringify({
                    plan_id: planId,
                    step_num: stepNum,
                    field_key: fieldKey,
                    field_label: fieldLabel,
                    user_text: value || "",
                    instructions,
                    sub_module: subModule,
                    extra_context: extraContext
                })
            });
            if (!res.ok) {
                let detail = `HTTP ${res.status}`;
                try { const j = await res.json(); detail = j?.detail?.message || j?.detail || detail; } catch {}
                throw new Error(detail);
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            let acc = "";
            while (true) {
                const { value: chunk, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(chunk, { stream: true });
                // SSE split by "\n\n"
                let idx;
                while ((idx = buffer.indexOf("\n\n")) !== -1) {
                    const evt = buffer.slice(0, idx);
                    buffer = buffer.slice(idx + 2);
                    const lines = evt.split("\n");
                    let event = "message";
                    let dataStr = "";
                    for (const ln of lines) {
                        if (ln.startsWith("event:")) event = ln.slice(6).trim();
                        else if (ln.startsWith("data:")) dataStr += ln.slice(5).trim();
                    }
                    if (!dataStr) continue;
                    let payload = {};
                    try { payload = JSON.parse(dataStr); } catch {}
                    if (event === "chunk" && payload.text) {
                        acc += payload.text;
                        setStreamed(acc);
                    } else if (event === "done") {
                        acc = payload.text || acc;
                        setStreamed(acc);
                    } else if (event === "error") {
                        throw new Error(payload.error || "Generation failed");
                    }
                }
            }
            // Apply: replace field with the generated text
            onChange(acc);
            persist(acc);
        } catch (e) {
            if (e.name === "AbortError") return;
            toast.error(e.message || "AI generation failed", { description: "Please try again." });
        } finally {
            setBusy(false);
            abortRef.current = null;
            setRefineOpen(false);
            setRefineText("");
        }
    }

    function stop() {
        abortRef.current?.abort();
        setBusy(false);
    }

    return (
        <div className="relative" data-testid={testIdPrefix || `field-${stepNum}-${fieldKey}`}>
            <Toolbar
                busy={busy}
                locked={locked}
                onAnswer={() => runAI("answer")}
                onExpand={() => runAI("expand")}
                refineOpen={refineOpen}
                setRefineOpen={setRefineOpen}
                refineText={refineText}
                setRefineText={setRefineText}
                onRefine={(instr) => runAI("refine", instr)}
                onStop={stop}
                tid={tid}
            />
            {multiline ? (
                <Textarea
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => persist(value)}
                    rows={rows}
                    placeholder={placeholder}
                    className={cn("rounded-xl min-h-[110px] leading-relaxed font-sans", busy && "opacity-90")}
                    data-testid={tid("textarea")}
                />
            ) : (
                <Input
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={() => persist(value)}
                    placeholder={placeholder}
                    className="rounded-xl h-11"
                    data-testid={tid("input")}
                />
            )}
            <AnimatePresence>
                {(busy || streamed) && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-2 rounded-xl border border-brand-gold/40 bg-brand-charcoal/95 text-brand-cream p-4 relative"
                        data-testid={tid("stream-panel")}
                    >
                        <div className="flex items-center justify-between mb-2 text-[11px] uppercase tracking-[0.18em] text-brand-gold">
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3" /> {busy ? "Generating…" : "Generated"}
                            </span>
                            <div className="flex items-center gap-1">
                                {busy && (
                                    <button onClick={stop} className="text-xs hover:text-white p-1" data-testid={tid("stop-button")}><Square className="h-3 w-3" /></button>
                                )}
                                {!busy && streamed && (
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(streamed); toast.success("Copied."); }}
                                        className="text-xs hover:text-white p-1" data-testid={tid("copy-button")}><Copy className="h-3 w-3" /></button>
                                )}
                                <button onClick={() => { setStreamed(""); }} className="text-xs hover:text-white p-1" data-testid={tid("close-stream-button")}><X className="h-3 w-3" /></button>
                            </div>
                        </div>
                        <div className="text-sm leading-relaxed font-sans whitespace-pre-wrap" data-testid={tid("stream-text")}>
                            {streamed}{busy && <span className="inline-block w-1.5 h-4 align-middle ml-0.5 bg-brand-gold animate-pulse" />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function Toolbar({ busy, locked, onAnswer, onExpand, refineOpen, setRefineOpen, refineText, setRefineText, onRefine, onStop, tid }) {
    return (
        <div className="absolute -top-3 right-3 z-10 flex items-center gap-1 rounded-full border bg-card shadow-sm px-1 py-1 text-xs">
            <ToolButton disabled={locked || busy} onClick={onAnswer} data-testid={tid("answer-button")}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span>Answer</span>
            </ToolButton>
            <ToolButton disabled={locked || busy} onClick={onExpand} data-testid={tid("expand-button")}>
                <Plus className="h-3.5 w-3.5" /><span>Expand</span>
            </ToolButton>
            <Popover open={refineOpen} onOpenChange={setRefineOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={locked || busy}
                        className={cn("px-2.5 h-7 rounded-full inline-flex items-center gap-1 text-xs hover:bg-secondary disabled:opacity-50")}
                        data-testid={tid("refine-button")}
                    >
                        <RefreshCcw className="h-3.5 w-3.5" /><span>Refine</span>
                    </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[320px] p-3">
                    <div className="label-eyebrow mb-2 text-brand-bronze">Refine</div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {["shorter", "more specific", "more emotional", "more professional", "sharper opener", "warmer tone"].map((s) => (
                            <button key={s} onClick={() => onRefine(s)} className="text-[11px] px-2 py-1 rounded-full border hover:bg-secondary" data-testid={tid(`refine-quick-${s.replace(/\s+/g, '-')}`)}>{s}</button>
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1.5">Or write a custom instruction:</div>
                    <Input value={refineText} onChange={(e) => setRefineText(e.target.value)} placeholder="Make it more vivid…" className="h-9 text-sm" data-testid={tid("refine-input")} />
                    <div className="flex justify-end mt-2 gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setRefineOpen(false)} data-testid={tid("refine-cancel")}>Cancel</Button>
                        <Button size="sm" onClick={() => refineText && onRefine(refineText)} disabled={!refineText} className="cta-red" data-testid={tid("refine-apply")}><Check className="h-3.5 w-3.5 mr-1" /> Apply</Button>
                    </div>
                </PopoverContent>
            </Popover>
            {busy && (
                <button type="button" onClick={onStop} className="ml-1 px-2 h-7 rounded-full bg-secondary hover:bg-muted text-xs" data-testid={tid("toolbar-stop")}>Stop</button>
            )}
        </div>
    );
}

function ToolButton({ children, disabled, onClick, ...rest }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="px-2.5 h-7 rounded-full inline-flex items-center gap-1 text-xs hover:bg-secondary disabled:opacity-50"
            {...rest}
        >
            {children}
        </button>
    );
}
