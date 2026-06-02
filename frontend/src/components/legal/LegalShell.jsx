/**
 * LegalShell — shared layout for /privacy, /terms, /refund-policy.
 *
 * Provides:
 *  - Consistent eyebrow + serif title + last-updated stamp
 *  - Constrained reading width (max-w-prose) for legibility
 *  - Helper sub-components H (h2), P (paragraph), UL (bullet list)
 *  - Back-to-home link in header
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function LegalShell({ title, eyebrow = "Legal", lastUpdated, children, testid }) {
    useEffect(() => {
        document.title = `${title} — Influence Incubator`;
    }, [title]);

    return (
        <div className="min-h-screen bg-background" data-testid={testid}>
            <section className="bg-brand-charcoal text-brand-cream">
                <div className="container-readable py-14 md:py-16">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-brand-cream/70 hover:text-brand-gold text-sm mb-6" data-testid="legal-back-home">
                        <ArrowLeft className="h-4 w-4" /> Home
                    </Link>
                    <div className="label-eyebrow text-brand-gold mb-3">{eyebrow}</div>
                    <h1 className="font-serif text-5xl md:text-6xl tracking-[-0.02em]">{title}</h1>
                    {lastUpdated && (
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-brand-cream/60" data-testid="legal-last-updated">
                            Last updated · {lastUpdated}
                        </p>
                    )}
                </div>
            </section>
            <section className="container-readable py-12 md:py-16">
                <article className="max-w-prose mx-auto text-foreground leading-relaxed">
                    {children}
                </article>
            </section>
        </div>
    );
}

export function H({ children }) {
    return <h2 className="font-serif text-2xl md:text-3xl mt-10 mb-3 tracking-[-0.01em]">{children}</h2>;
}

export function P({ children }) {
    return <p className="text-base my-4">{children}</p>;
}

export function UL({ items }) {
    return (
        <ul className="my-4 space-y-2 pl-5">
            {items.map((it, i) => (
                <li key={i} className="list-disc list-outside marker:text-brand-bronze pl-1">
                    {it}
                </li>
            ))}
        </ul>
    );
}
