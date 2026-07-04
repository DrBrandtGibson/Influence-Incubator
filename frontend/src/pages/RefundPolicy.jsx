/* eslint-disable react/jsx-key -- UL wraps each item in a keyed <li> */
import { LegalShell, H, P, UL } from "@/components/legal/LegalShell";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

const LAST_UPDATED = "May 28, 2026";

export default function RefundPolicy() {
    return (
        <LegalShell title="Refund Policy" eyebrow="Legal" lastUpdated={LAST_UPDATED} testid="refund-policy-page">
            <div className="editorial-card p-6 bg-brand-gold/5 border-brand-gold/30 mb-8 flex items-start gap-4" data-testid="refund-tldr">
                <ShieldCheck className="h-6 w-6 text-brand-bronze flex-shrink-0 mt-0.5" />
                <div>
                    <div className="label-eyebrow text-brand-bronze mb-1">The short version</div>
                    <p className="text-sm leading-relaxed">
                        <strong>7-day money-back guarantee</strong> on every paid plan — Monthly, Lifetime, and Lifetime Unlimited. Refunds are usually processed within <strong>5 business days</strong>. If you've already exported your plan as PDF or DOCX, the refund window is closed.
                    </p>
                </div>
            </div>

            <P>
                This Refund Policy explains when and how you can request a refund for paid subscriptions and one-time purchases on the Influence Incubator Formula (the “Service”), operated by <strong>Influence Incubator LLC</strong> and <strong>Dr Brandt Gibson LLC</strong>.
            </P>

            <H>1. 7-Day Money-Back Guarantee</H>
            <P>
                You may request a full refund of your initial purchase within <strong>7 days</strong> of the original payment date, subject to the exceptions in Section 3 below. This applies to:
            </P>
            <UL items={[
                <span><strong>Monthly Pro</strong> ($19/month) — first month only.</span>,
                <span><strong>Lifetime Pro</strong> ($97 one-time).</span>,
                <span><strong>Lifetime Unlimited</strong> ($397 one-time).</span>,
                <span><strong>Extra Plan Slots</strong> ($19.99 one-time or $10/month, first month only).</span>
            ]} />

            <H>2. How to Request a Refund</H>
            <P>
                The easiest way is to use the in-app refund button in your account settings (Subscription panel). Alternatively, email <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a> from the email address associated with your purchase. Please include your full name and approximate purchase date.
            </P>

            <H>3. When Refunds Are Not Available</H>
            <P>
                For fairness to all customers, refunds are <strong>not</strong> granted in the following circumstances:
            </P>
            <UL items={[
                <span><strong>After exporting your plan.</strong> Once you have downloaded a PDF or Word export of any plan, you have received the full deliverable value of the Service. Refund requests submitted after an export will be declined.</span>,
                <span><strong>After the 7-day window.</strong> Requests received more than 7 calendar days after the original payment will be declined.</span>,
                <span><strong>Renewal payments.</strong> Monthly subscriptions automatically renew. Renewal payments (i.e. any month after the first) are non-refundable; cancel anytime to stop future renewals while keeping access until the end of the current billing period.</span>,
                <span><strong>Abuse or violation of Terms.</strong> Accounts terminated for breaching our <Link to="/terms" className="text-brand-bronze hover:text-brand-gold underline">Terms of Service</Link> are not eligible for refunds.</span>,
                <span><strong>Already-refunded customers.</strong> If you previously received a refund and re-purchased, additional refunds will be denied at our discretion.</span>
            ]} />

            <H>4. Processing Time</H>
            <P>
                Approved refunds are typically processed within <strong>5 business days</strong>. The refund is returned to the original payment method via Stripe. Depending on your card issuer or bank, the funds may take an additional 3–10 business days to appear on your statement.
            </P>

            <H>5. What Happens to Your Account</H>
            <UL items={[
                "Once a refund is issued, your account is automatically downgraded to Free tier (Steps 1–2 only).",
                "Your existing plans and content remain in your account — you do not lose your data.",
                "Any active monthly subscription tied to the refunded charge is canceled immediately.",
                "Lifetime / Lifetime Unlimited access is revoked."
            ]} />

            <H>6. Exceptional Circumstances</H>
            <P>
                We're human. If you have a special situation — duplicate charges, unauthorized use of your card, technical issues that prevented you from using the Service, or anything else that doesn't fit the rules above — email <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a> and explain. We'll review every request individually and try to do the right thing.
            </P>

            <H>7. Chargebacks</H>
            <P>
                Before filing a chargeback with your bank, please contact us first — we can usually resolve issues faster directly. Chargebacks filed without contacting us may result in account suspension and may affect your eligibility for future refunds.
            </P>

            <H>8. Changes</H>
            <P>
                We may update this Refund Policy from time to time. Any changes apply only to purchases made after the updated effective date.
            </P>

            <H>9. Contact</H>
            <P>
                Influence Incubator LLC · Dr Brandt Gibson LLC · Utah, USA · <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>
            </P>
        </LegalShell>
    );
}
