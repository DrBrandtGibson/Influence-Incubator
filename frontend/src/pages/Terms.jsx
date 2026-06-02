import { LegalShell, H, P, UL } from "@/components/legal/LegalShell";
import { Link } from "react-router-dom";

const LAST_UPDATED = "May 28, 2026";

export default function Terms() {
    return (
        <LegalShell title="Terms of Service" eyebrow="Legal" lastUpdated={LAST_UPDATED} testid="terms-of-service-page">
            <P>
                These Terms of Service (the “Terms”) form a binding agreement between you (“you” or “User”) and <strong>Influence Incubator LLC</strong> and <strong>Dr Brandt Gibson LLC</strong> (collectively, “we,” “us,” or “our”) governing your access to and use of the Influence Incubator Formula product, website, and related services (the “Service”). By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.
            </P>

            <H>1. Eligibility & Account</H>
            <UL items={[
                "You must be at least 18 years old and able to enter into a binding contract.",
                "You are responsible for all activity under your account and for keeping your password confidential.",
                "You agree to provide accurate, current information when registering and to keep it up to date."
            ]} />

            <H>2. Subscription Tiers & Billing</H>
            <P>
                The Service is offered in the following tiers: <strong>Free</strong> (Steps 1–2), <strong>Monthly Pro</strong> ($19/month, recurring), <strong>Lifetime Pro</strong> ($97 one-time), <strong>Lifetime Unlimited</strong> ($397 one-time, unlimited plans), and optional <strong>Extra Plan Slots</strong> ($19.99 one-time for Lifetime members or $10/month recurring for Monthly members).
            </P>
            <UL items={[
                "Monthly subscriptions renew automatically until canceled. You can cancel anytime in your account billing portal; access continues to the end of the current billing period.",
                "Lifetime and Lifetime Unlimited purchases grant access for as long as we operate the Service.",
                "All payments are processed by Stripe. Taxes may apply based on your billing location.",
                "Prices may change with at least 30 days' notice; existing Lifetime / Lifetime Unlimited members are grandfathered at their original price."
            ]} />

            <H>3. Refunds</H>
            <P>
                Refunds are governed by our <Link to="/refund-policy" className="text-brand-bronze hover:text-brand-gold underline">Refund Policy</Link>. In summary: a 7-day money-back guarantee applies to all paid plans, with carve-outs (e.g. no refund after exporting your plan as PDF or DOCX). Read the Refund Policy for full details.
            </P>

            <H>4. Your Content</H>
            <P>
                You retain full ownership of the content you create or generate within the Service (“User Content”) — including text, AI-assisted drafts, generated portraits, and exported plans. You grant us a limited, non-exclusive license to host, process, and display your User Content solely for the purpose of operating the Service for you.
            </P>
            <P>
                You represent that you have all necessary rights to any third-party content you input, and that your use does not violate any law, third-party rights, or these Terms.
            </P>

            <H>5. AI-Generated Content</H>
            <P>
                Portions of the Service use AI models (including Anthropic Claude and Google Gemini Nano Banana) to draft text and generate images. AI-generated output may be inaccurate, incomplete, or unintended. You are solely responsible for reviewing, editing, and verifying any AI output before relying on or publishing it. We make no warranty that AI output is fit for any particular purpose or free of factual error.
            </P>
            <P>
                Subject to our providers' acceptable-use policies, you own the AI-generated output displayed in your account. AI-generated portraits are intended to represent fictional personas and should not be used to misrepresent real individuals.
            </P>

            <H>6. Acceptable Use</H>
            <P>You agree not to:</P>
            <UL items={[
                "Use the Service for any unlawful, fraudulent, harmful, harassing, or deceptive purpose.",
                "Reverse-engineer, scrape, or attempt to derive source code or proprietary algorithms from the Service.",
                "Resell, sublicense, or share account access with anyone outside your subscription.",
                "Upload viruses, malware, or attempt to disrupt the Service.",
                "Generate AI content that depicts real individuals without consent, or content that violates our providers' acceptable-use policies (e.g. hateful, sexual, or violent imagery).",
                "Use the Service to compete with us by building a substantially similar product."
            ]} />
            <P>
                We may suspend or terminate access for violations of these terms at our sole discretion.
            </P>

            <H>7. Intellectual Property</H>
            <P>
                The Service — including the 7-Step Influence Incubator Formula, all underlying methodology authored by Dr. Brandt R. Gibson, our software, design, and brand assets — is owned by Influence Incubator LLC and Dr Brandt Gibson LLC and is protected by copyright, trademark, and other intellectual property laws. We grant you a limited, non-transferable, revocable license to use the Service for your personal or internal business purposes for the duration of your subscription.
            </P>

            <H>8. Third-Party Services</H>
            <P>
                The Service integrates with third-party services (Stripe, ClickFunnels, Anthropic, Google, Supabase). Your use of those services is governed by their respective terms. We are not responsible for third-party service outages or for content delivered by third-party APIs.
            </P>

            <H>9. Termination</H>
            <P>
                You may close your account at any time by contacting <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>. We may suspend or terminate your access if you breach these Terms, if your payment fails, or if we discontinue the Service. Upon termination, your right to use the Service ends; refund eligibility (if any) is governed by the Refund Policy.
            </P>

            <H>10. Disclaimers</H>
            <P>
                THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant that the Service will be uninterrupted, error-free, or that any specific business or financial outcome will result from its use.
            </P>
            <P>
                The Service provides educational and planning tools — it is not legal, financial, medical, or tax advice. Consult a qualified professional for advice specific to your situation.
            </P>

            <H>11. Limitation of Liability</H>
            <P>
                TO THE FULLEST EXTENT PERMITTED BY LAW, IN NO EVENT SHALL INFLUENCE INCUBATOR LLC, DR BRANDT GIBSON LLC, THEIR OFFICERS, MEMBERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS OR LOST DATA. OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) US $100.
            </P>

            <H>12. Indemnification</H>
            <P>
                You agree to indemnify, defend, and hold harmless Influence Incubator LLC, Dr Brandt Gibson LLC, and their officers, members, and affiliates from any claim, damage, liability, or expense (including reasonable attorneys' fees) arising from your use of the Service, your User Content, or your breach of these Terms.
            </P>

            <H>13. Governing Law & Disputes</H>
            <P>
                These Terms are governed by the laws of the State of Utah, USA, without regard to its conflict-of-laws principles. Any dispute arising from these Terms or the Service shall be resolved exclusively in the state or federal courts located in Utah, and you consent to personal jurisdiction there.
            </P>

            <H>14. Changes</H>
            <P>
                We may update these Terms from time to time. Material changes will be posted with the updated date above and, where required, notified by email at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.
            </P>

            <H>15. Contact</H>
            <P>
                Influence Incubator LLC · Dr Brandt Gibson LLC · Utah, USA · <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>
            </P>
        </LegalShell>
    );
}
