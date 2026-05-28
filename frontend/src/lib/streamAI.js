/**
 * streamAIText — POST to one of the SSE /api/ai/* endpoints and accumulate the
 * `event: chunk` payload into a single final string. Returns the final text.
 *
 * `endpoint`: one of `/ai/synthesize`, `/ai/generate`, `/ai/answer-question`, etc.
 * `body`: the JSON request body (matches `AIRunIn` Pydantic shape).
 * `onChunk` (optional): called with each appended chunk for streaming UI.
 *
 * Returns: final text string (trimmed). Throws on HTTP error.
 */
import { authedFetch } from "@/lib/supabase";

export async function streamAIText(endpoint, body, onChunk) {
    const res = await authedFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        let detail = "AI request failed";
        try {
            const j = await res.json();
            detail = j?.detail?.message || j?.detail || detail;
        } catch {
            /* */
        }
        throw new Error(detail);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let acc = "";
    let final = null;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop() || "";
        for (const ev of events) {
            const m = ev.match(/^event: (\w+)\ndata: (.+)$/m);
            if (!m) continue;
            const evt = m[1];
            try {
                const payload = JSON.parse(m[2]);
                if (evt === "chunk" && payload.text) {
                    acc += payload.text;
                    if (onChunk) onChunk(payload.text, acc);
                } else if (evt === "done") {
                    final = payload.text || acc;
                } else if (evt === "error") {
                    throw new Error(payload.error || "AI error");
                }
            } catch (parseErr) {
                console.warn("streamAIText parse error:", parseErr);
            }
        }
    }
    return (final ?? acc).trim();
}
