import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Check, Sparkles, ArrowRight, Quote, Infinity as InfinityIcon } from "lucide-react";
import { STEPS } from "@/lib/steps";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

export default function Landing() {
    const reduce = useReducedMotion();
    const variants = reduce ? { hidden: { opacity: 1 }, show: { opacity: 1 } } : fadeUp;

    useEffect(() => {
        document.title = "The Influence Incubator Formula — Build your business plan, beautifully.";
    }, []);

    return (
        <div data-testid="landing-page">
            {/* HERO */}
            <section className="relative bg-brand-charcoal text-brand-cream overflow-hidden" data-testid="landing-hero">
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(closest-side, hsl(var(--brand-gold) / 0.45), transparent)" }} />
                    <div className="absolute bottom-[-220px] right-[-120px] h-[600px] w-[600px] rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(closest-side, hsl(var(--brand-bronze) / 0.55), transparent)" }} />
                </div>
                <div className="container-readable relative pt-20 pb-28 md:pt-28 md:pb-40">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
                        <motion.div initial="hidden" animate="show" variants={variants} className="lg:col-span-7">
                            <div className="label-eyebrow text-brand-gold mb-6" data-testid="hero-eyebrow">A 7-step formula by Dr. Brandt R. Gibson</div>
                            <h1 className="font-serif text-5xl md:text-7xl leading-[1.02] tracking-[-0.02em]">
                                Marketing Your <span className="italic text-brand-gold">Extraordinary.</span>
                            </h1>
                            <p className="mt-6 max-w-xl text-base md:text-lg text-brand-cream/80 leading-relaxed">
                                Turn the spark inside you into a complete, structured business plan. AI assist on every question, deep frameworks on every page, exportable to PDF & Word — so you never stare at a blank page again.
                            </p>
                            <div className="mt-10 flex flex-col sm:flex-row gap-3" data-testid="hero-ctas">
                                <Link to="/signup">
                                    <Button className="cta-red rounded-full h-12 px-7 text-sm font-medium" data-testid="landing-hero-primary-cta-button">
                                        Start Steps 1 & 2 Free <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <a href="#formula">
                                    <Button variant="outline" className="rounded-full h-12 px-7 text-sm bg-transparent text-brand-cream border-white/20 hover:bg-white/5" data-testid="landing-hero-secondary-cta-button">
                                        See the 7 Steps
                                    </Button>
                                </a>
                            </div>
                            <div className="mt-8 flex items-center gap-6 text-xs text-brand-cream/60">
                                <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-gold" /> No credit card</div>
                                <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-gold" /> Steps 1–2 free forever</div>
                                <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-brand-gold" /> 7-day money-back</div>
                            </div>
                        </motion.div>
                        <motion.div initial="hidden" animate="show" variants={variants} transition={{ delay: 0.15 }} className="lg:col-span-5 hidden lg:block">
                            <HeroVisual />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* DIAGONAL TRANSITION */}
            <div aria-hidden="true" className="relative h-24 -mt-px" style={{ background: "hsl(var(--brand-charcoal))" }}>
                <div className="absolute inset-0" style={{ background: "hsl(var(--background))", clipPath: "polygon(0 100%, 100% 0, 100% 100%, 0 100%)" }} />
            </div>

            {/* THE FORMULA */}
            <section id="formula" className="py-20 md:py-28" data-testid="section-formula">
                <div className="container-readable">
                    <div className="max-w-2xl mb-14">
                        <div className="label-eyebrow mb-4 text-brand-bronze">The Formula</div>
                        <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">Seven steps. One coherent business plan.</h2>
                        <p className="mt-4 text-muted-foreground">Each step is a deep, opinionated module — never a blank page. Begin with Steps 1 & 2 free. Unlock 3–7 when you’re ready to go deep.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STEPS.map((s, i) => (
                            <motion.div
                                key={s.num}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, amount: 0.4 }}
                                variants={variants}
                                transition={{ delay: i * 0.05 }}
                                className="group relative editorial-card p-6 md:p-7 hover:-translate-y-1 transition-transform"
                                data-testid={`landing-step-card-${s.num}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="font-serif italic text-5xl text-brand-gold/90 leading-none">{String(s.num).padStart(2, "0")}</div>
                                    {s.tier === "free" ? (
                                        <span className="text-[10px] font-sans tracking-[0.18em] uppercase px-2.5 py-1 rounded-full border border-brand-gold text-brand-bronze" data-testid={`landing-step-${s.num}-badge`}>Free</span>
                                    ) : (
                                        <span className="text-[10px] font-sans tracking-[0.18em] uppercase px-2.5 py-1 rounded-full bg-brand-charcoal text-brand-gold inline-flex items-center gap-1" data-testid={`landing-step-${s.num}-badge`}>
                                            <Lock className="h-3 w-3" /> Pro
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-serif text-2xl mb-2">{s.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{s.oneLiner}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="py-20 md:py-24 bg-secondary/40 border-y border-border" data-testid="section-how">
                <div className="container-readable grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="label-eyebrow mb-4 text-brand-bronze">How it works</div>
                        <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">AI assist. On every question. Always in your voice.</h2>
                        <p className="mt-5 text-muted-foreground leading-relaxed">A floating editor lives next to every input. Three buttons — <span className="text-foreground">Answer for me</span>, <span className="text-foreground">Expand my answer</span>, and <span className="text-foreground">Refine</span> — stream Claude Sonnet 4.5 with the full context of your plan, so each answer compounds on the last.</p>
                        <ul className="mt-6 space-y-3 text-sm">
                            {[
                                "Generates business names, MTPs, Hero’s Journeys, marketing plans, and more.",
                                "Refine inline: shorter, more specific, more emotional, more professional.",
                                "Saves automatically. Resume any time. Export when you’re ready."
                            ].map((t, i) => (
                                <li key={i} className="flex gap-3"><Check className="h-4 w-4 text-brand-gold mt-0.5" /><span>{t}</span></li>
                            ))}
                        </ul>
                    </div>
                    <AssistDemo />
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section id="testimonials" className="py-20 md:py-28" data-testid="section-testimonials">
                <div className="container-readable">
                    <div className="max-w-2xl mb-12">
                        <div className="label-eyebrow mb-4 text-brand-bronze">From the field</div>
                        <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">Built for the way you actually think.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { q: "By the time I finished Step 2, I had a clearer Dream Customer than after a $4,000 brand workshop.", a: "Maya O., Wellness Coach" },
                            { q: "The Hero’s Journey wheel made my book outline finally make sense. I wrote three chapters that weekend.", a: "Daniel P., Author & Speaker" }
                        ].map((t, i) => (
                            <div key={i} className="editorial-card p-8 relative" data-testid={`testimonial-card-${i}`}>
                                <Quote className="h-8 w-8 text-brand-gold/70 mb-4" />
                                <p className="font-serif text-2xl leading-snug mb-4">“{t.q}”</p>
                                <div className="gold-divider my-4" />
                                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING TEASER */}
            <section className="py-20 md:py-24 bg-brand-charcoal text-brand-cream" data-testid="section-pricing-teaser">
                <div className="container-readable text-center max-w-3xl mx-auto">
                    <div className="label-eyebrow mb-4 text-brand-gold">Pricing</div>
                    <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">Simple. Honest. 7-day money-back.</h2>
                    <p className="mt-5 text-brand-cream/80">Steps 1 & 2 are free forever — no credit card. When you’re ready to go deep, choose the path that fits.</p>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-7" data-testid="landing-pricing-monthly">
                            <div className="text-xs text-brand-gold uppercase tracking-[0.18em]">Monthly</div>
                            <div className="mt-2 font-serif text-5xl">$19<span className="text-base text-brand-cream/60">/mo</span></div>
                            <div className="text-xs text-brand-cream/60">1 plan · cancel anytime</div>
                        </div>
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-7" data-testid="landing-pricing-lifetime">
                            <div className="text-xs text-brand-gold uppercase tracking-[0.18em]">Lifetime</div>
                            <div className="mt-2 font-serif text-5xl">$97</div>
                            <div className="text-xs text-brand-cream/60">one-time · up to 6 plans</div>
                        </div>
                        <div className="relative rounded-2xl bg-white/5 border border-brand-gold/60 ring-1 ring-brand-gold/40 p-7" data-testid="landing-pricing-unlimited">
                            <span className="absolute -top-2.5 left-6 text-[10px] uppercase tracking-[0.18em] bg-brand-gold text-brand-charcoal px-2.5 py-1 rounded-full">Best value</span>
                            <div className="text-xs text-brand-gold uppercase tracking-[0.18em] inline-flex items-center gap-1.5">
                                <InfinityIcon className="h-3.5 w-3.5" /> Lifetime Unlimited
                            </div>
                            <div className="mt-2 font-serif text-5xl">$397</div>
                            <div className="text-xs text-brand-cream/60">one-time · unlimited plans</div>
                        </div>
                    </div>
                    <div className="mt-10">
                        <Link to="/signup"><Button className="cta-red rounded-full h-12 px-8" data-testid="pricing-teaser-cta">Start free — takes 60 seconds</Button></Link>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="py-20 md:py-24" data-testid="section-faq">
                <div className="container-readable max-w-3xl">
                    <div className="label-eyebrow mb-4 text-brand-bronze">Questions</div>
                    <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em] mb-8">Common questions.</h2>
                    <Accordion type="single" collapsible className="divide-y" data-testid="faq-accordion">
                        {[
                            { q: "Is the free tier really free?", a: "Yes. Steps 1 & 2 are fully functional, free, forever. No credit card required." },
                            { q: "What’s the difference between Lifetime and Monthly?", a: "Three options. Monthly ($19/mo) unlocks all 7 steps while you’re subscribed and includes 1 active plan — cancel anytime. Lifetime ($97 one-time) is a permanent unlock with up to 6 plans. Lifetime Unlimited ($397 one-time) is permanent with unlimited plans — best for agencies, coaches, and anyone building multiple brands." },
                            { q: "What’s included in Pro?", a: "All 7 steps unlocked, unlimited plans, unlimited AI generations, clean PDF and Word exports, and plan version history." },
                            { q: "Can I cancel or get a refund?", a: "Yes. 7-day money-back guarantee on every paid plan. Monthly can be canceled anytime from your dashboard." },
                            { q: "Whose framework is this?", a: "The Influence Incubator Formula was created by Dr. Brandt R. Gibson. This app turns the framework into an interactive, AI-assisted experience." }
                        ].map((f, i) => (
                            <AccordionItem key={i} value={`f${i}`} className="border-border" data-testid={`faq-item-${i}`}>
                                <AccordionTrigger className="font-serif text-lg text-left py-5 hover:no-underline">{f.q}</AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{f.a}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-20 md:py-24 border-t border-border" data-testid="section-final-cta">
                <div className="container-readable text-center max-w-2xl mx-auto">
                    <h2 className="font-serif text-4xl md:text-5xl tracking-[-0.02em]">Your extraordinary business plan, in one focused afternoon.</h2>
                    <div className="mt-8">
                        <Link to="/signup"><Button className="cta-red rounded-full h-12 px-8" data-testid="final-cta-button"><Sparkles className="h-4 w-4 mr-2" />Begin Step 1 — Free</Button></Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function HeroVisual() {
    return (
        <div className="relative aspect-[4/5] w-full max-w-md ml-auto">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-bronze/40 to-transparent" />
            <div className="absolute inset-2 rounded-3xl bg-brand-charcoal border border-white/10 overflow-hidden">
                <div className="p-6 h-full flex flex-col">
                    <div className="label-eyebrow text-brand-gold">Step 01 · DEFINE</div>
                    <div className="font-serif text-2xl mt-2">Massive Transformative Purpose</div>
                    <div className="mt-4 text-sm leading-relaxed text-brand-cream/80">
                        “To guide one million coaches into a calm, deliberate, deeply human relationship with their craft.”
                    </div>
                    <div className="mt-auto pt-4 border-t border-white/10 text-xs text-brand-cream/60">
                        AI synthesized from 5 categories · 50 reflections
                    </div>
                </div>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-brand-cream text-brand-charcoal p-4 shadow-2xl border border-brand-gold/30 hidden md:block">
                <div className="text-[10px] uppercase tracking-[0.18em] text-brand-bronze">Deep WHY</div>
                <div className="font-serif italic text-base mt-1">Because clarity is mercy.</div>
            </div>
        </div>
    );
}

function AssistDemo() {
    const ref = useRef(null);
    return (
        <div ref={ref} className="relative editorial-card p-7" data-testid="assist-demo">
            <div className="label-eyebrow mb-3">A field, anywhere in the app</div>
            <div className="text-sm font-medium mb-2">What is your Definite Chief Aim for the next 12 months?</div>
            <div className="relative">
                <div className="rounded-xl border border-border bg-card p-4 min-h-[110px] text-sm leading-relaxed">
                    <span className="text-muted-foreground">In 12 months I will have a thriving wellness practice with 200 active members</span>
                    <span className="inline-block w-1.5 h-4 align-middle ml-0.5 bg-brand-gold animate-pulse" />
                </div>
                <div className="absolute -top-3 right-3 flex gap-1 bg-card border border-border rounded-full px-1 py-1 shadow-sm">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-brand-gold text-brand-charcoal font-medium flex items-center gap-1"><Sparkles className="h-3 w-3" /> Answer</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full hover:bg-secondary">Expand</span>
                    <span className="text-[11px] px-2.5 py-1 rounded-full hover:bg-secondary">Refine</span>
                </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-pulse" />
                Streaming from Claude Sonnet 4.5
            </div>
        </div>
    );
}
