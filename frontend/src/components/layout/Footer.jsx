export const Footer = () => (
    <footer data-testid="site-footer" className="bg-brand-charcoal text-brand-cream/85 border-t border-white/10">
        <div className="container-readable py-14 grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="h-8 w-8 rounded-md grid place-items-center bg-brand-gold text-brand-charcoal font-serif font-bold text-lg">II</div>
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
            <div className="container-readable py-5 text-xs text-brand-cream/50 flex justify-between">
                <span>© {new Date().getFullYear()} Influence Incubator. All rights reserved.</span>
                <span>Made with intention.</span>
            </div>
        </div>
    </footer>
);
