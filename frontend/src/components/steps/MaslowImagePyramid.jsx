import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const LOGO = "https://customer-assets.emergentagent.com/job_pro-unlock-3/artifacts/qnyxp0y6_Maslow%27s%20Hierarchy%20of%20Needs.png";

// Tier hit-zones expressed as % of the image (top -> bottom).
// Image is square; pyramid tip at top, base at bottom.
// These percentages were measured visually against the supplied artwork.
const TIERS = [
    { key: "self_actualization", label: "Self-Actualization", topPct: 5,  bottomPct: 35, color: "#F47174" },
    { key: "esteem",             label: "Esteem",             topPct: 35, bottomPct: 50, color: "#4F6BFF" },
    { key: "belonging",          label: "Love & Belonging",   topPct: 50, bottomPct: 67, color: "#FF9755" },
    { key: "safety",             label: "Safety & Security",  topPct: 67, bottomPct: 84, color: "#7BC74D" },
    { key: "physiological",      label: "Physiological",      topPct: 84, bottomPct: 99, color: "#7152D6" }
];

export const MaslowImagePyramid = ({ selected = [], onToggle }) => {
    return (
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative w-full max-w-[520px] mx-auto select-none">
                <img src={LOGO} alt="Maslow’s Hierarchy of Needs" className="w-full h-auto rounded-md" data-testid="maslow-image" />
                {/* Hit zones — each is a horizontal band over the corresponding tier */}
                {TIERS.map((t) => {
                    const active = selected.includes(t.key);
                    return (
                        <button
                            key={t.key}
                            type="button"
                            onClick={() => onToggle?.(t.key)}
                            aria-label={`Toggle ${t.label}`}
                            data-testid={`maslow-tier-${t.key}-button`}
                            className="absolute left-0 right-0 group cursor-pointer"
                            style={{ top: `${t.topPct}%`, height: `${t.bottomPct - t.topPct}%` }}
                        >
                            {/* Subtle hover highlight */}
                            <span
                                className={cn(
                                    "absolute inset-0 transition-all",
                                    active ? "ring-4 ring-brand-gold rounded-sm" : "group-hover:bg-white/10"
                                )}
                                style={active ? { boxShadow: `inset 0 0 0 4px ${t.color}, 0 0 0 4px hsl(var(--brand-gold))` } : undefined}
                            />
                            {active && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-brand-gold text-brand-charcoal grid place-items-center shadow-md">
                                    <Check className="h-4 w-4" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
                <div className="label-eyebrow text-brand-bronze mb-2">Selected ({selected.length})</div>
                <ul className="space-y-2">
                    {TIERS.map((t) => {
                        const active = selected.includes(t.key);
                        return (
                            <li key={t.key}>
                                <button
                                    type="button"
                                    onClick={() => onToggle?.(t.key)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-3",
                                        active ? "border-brand-gold bg-brand-gold/10" : "border-border hover:bg-secondary"
                                    )}
                                    data-testid={`maslow-list-${t.key}-button`}
                                >
                                    <span className="h-6 w-6 rounded-md shrink-0" style={{ background: t.color }} />
                                    <span className="font-serif text-base flex-1">{t.label}</span>
                                    {active && <Check className="h-4 w-4 text-brand-gold" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Click any tier in the pyramid (or the list) to mark which level(s) of human need your business addresses. Selecting multiple is normal — most powerful work touches several at once.
                </p>
            </div>
        </div>
    );
};
