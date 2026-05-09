import { useEffect, useRef } from "react";
import { authedFetch } from "@/lib/supabase";

/**
 * usePersistedField — keeps a plan_input field in sync with backend.
 * Persists immediately (debounced) whenever value changes.
 */
export function usePersistedField({ planId, stepNum, fieldKey, value, debounceMs = 300 }) {
    const lastSentRef = useRef(undefined);
    useEffect(() => {
        if (!planId || value === undefined) return;
        const t = setTimeout(() => {
            const serialized = typeof value === "string" ? value : JSON.stringify(value);
            if (serialized === lastSentRef.current) return;
            lastSentRef.current = serialized;
            authedFetch(`/plans/${planId}/inputs`, {
                method: "POST",
                body: JSON.stringify({ step_num: stepNum, field_key: fieldKey, value: serialized })
            }).catch(() => { /* swallow; will retry on next change */ });
        }, debounceMs);
        return () => clearTimeout(t);
    }, [planId, stepNum, fieldKey, value, debounceMs]);
}
