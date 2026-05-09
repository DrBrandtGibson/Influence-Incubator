import { LOGO_URL } from "@/lib/brand";

export const Footer = () => (
    <footer data-testid="site-footer" className="bg-brand-charcoal text-brand-cream/85 border-t border-white/10">
        <div className="container-readable py-14 grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                    <img src={LOGO_URL} alt="Influence Incubator" className="h-9 w-9 rounded-md object-contain bg-black" />
                    <span className="font-serif text-xl">Influence Incubator</span>
                </div>
                <p className="text-sm leading-relaxed max-w-md">
                    The Influence Incubator Formula — a 7-step framework for solo entrepreneurs, coaches and aspiring influencers to build a complete, AI-assisted business plan.
                </p>
                <p className="text-xs mt-6 text-brand-cream/60">Framework by Dr. Brandt R. Gibson. App built with care.</p>
            </div>
            <div>
                <h4 className="label-eyebrow text-brand-gold mb-3">Product</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="#formula" className="hover:text-brand-gold">The Formula</a></li>
                    <li><a href="#how" className="hover:text-brand-gold">How it works</a></li>
                    <li><a href="/pricing" className="hover:text-brand-gold">Pricing</a></li>
                    <li><a href="#faq" className="hover:text-brand-gold">FAQ</a></li>
                </ul>
            </div>
            <div>
                <h4 className="label-eyebrow text-brand-gold mb-3">Account</h4>
                <ul className="space-y-2 text-sm">
                    <li><a href="/login" className="hover:text-brand-gold">Log in</a></li>
                    <li><a href="/signup" className="hover:text-brand-gold">Start free</a></li>
                    <li><a href="/refund-policy" className="hover:text-brand-gold">Refund policy</a></li>
                </ul>
            </div>
        </div>
        <div className="border-t border-white/10">
            <div className="container-readable py-6 space-y-4">
                <p className="text-xs text-brand-cream/70 text-center" data-testid="footer-copyright">
                    © 2026 Influence Incubator LLC, Dr Brandt Gibson, LLC & Dr Brandt R Gibson. All Rights Reserved
                </p>
                <div className="max-w-4xl mx-auto text-[11px] leading-relaxed text-brand-cream/55 text-center space-y-3" data-testid="footer-disclaimer">
                    <p>
                        By utilizing this tool, you agree to all of the following: You understand this to be an expression of opinions and not professional, medical or legal advice. You are solely responsible for the use of any content and hold Dr Brandt Gibson LLC, Influence Incubator LLC, Dr Brandt Gibson and all members and affiliates harmless in any event or claim. If you have any concerns or questions about the advice given, it is recommended you discuss with a qualified business lawyer.
                    </p>
                    <p>
                        If you purchase anything through a link in this tool, you should assume that we have an affiliate relationship with the company providing the product or service that you purchase, and that we will be paid in some way. We recommend that you do your own independent research before purchasing anything.
                    </p>
                </div>
            </div>
        </div>
    </footer>
);
