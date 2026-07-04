/* eslint-disable react/jsx-key -- UL wraps each item in a keyed <li> */
import { LegalShell, H, P, UL } from "@/components/legal/LegalShell";

const LAST_UPDATED = "May 28, 2026";

export default function Privacy() {
    return (
        <LegalShell title="Privacy Policy" eyebrow="Legal" lastUpdated={LAST_UPDATED} testid="privacy-policy-page">
            <P>
                This Privacy Policy describes how <strong>Influence Incubator LLC</strong> and <strong>Dr Brandt Gibson LLC</strong> (collectively, “we,” “us,” or “our”) collect, use, share, and protect personal information when you visit our website, create an account, purchase a subscription, or otherwise use the Influence Incubator Formula product (the “Service”).
            </P>
            <P>
                If you have any questions about this Policy or our data practices, contact us at <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>.
            </P>

            <H>1. Information We Collect</H>
            <P>We collect the following categories of personal information:</P>
            <UL items={[
                <span><strong>Account data:</strong> email address, name (if provided), hashed password, subscription status, and Stripe customer ID.</span>,
                <span><strong>Plan content:</strong> the text, images (including AI-generated portraits), and structured data you enter or generate within the Service.</span>,
                <span><strong>Payment data:</strong> handled by Stripe — we never see or store full card numbers. Stripe shares a limited subset (last 4, brand, expiry, country) with us for receipts.</span>,
                <span><strong>Usage data:</strong> log entries (IP address, browser, pages visited, timestamps) and product-event telemetry used to improve the Service.</span>,
                <span><strong>Marketing data:</strong> when you opt in (e.g. via ClickFunnels forms), we receive your email and any tags applied to your contact.</span>
            ]} />

            <H>2. How We Use Your Information</H>
            <UL items={[
                "To provide and operate the Service (account creation, AI generation, plan exports, billing).",
                "To process payments, refunds, and subscription changes via Stripe.",
                "To send transactional emails (purchase confirmations, password resets, billing notices).",
                "To send marketing emails — only if you opted in. You can unsubscribe at any time.",
                "To monitor for fraud, abuse, and security incidents.",
                "To debug, improve product quality, and develop new features."
            ]} />

            <H>3. AI Processing</H>
            <P>
                Some Service features (text drafting, narration synthesis, offer-stack and pricing suggestions, customer portraits) send your prompt data to third-party AI providers (Anthropic and Google) via the Emergent integration layer. Your prompt content is processed solely to generate the requested output. We do <strong>not</strong> use your plan content to train third-party models, and we instruct providers not to retain prompts beyond their standard short-window logs.
            </P>

            <H>4. How We Share Information</H>
            <P>We share personal information only with the following categories of recipients:</P>
            <UL items={[
                <span><strong>Service providers:</strong> Supabase (database, auth, storage), Stripe (payments), Anthropic & Google (AI processing), ClickFunnels (marketing automation), email/transactional providers, and our hosting platform.</span>,
                <span><strong>Legal compliance:</strong> if compelled by lawful subpoena, court order, or to protect against fraud or imminent harm.</span>,
                <span><strong>Business transfers:</strong> if we are acquired or merged, your information may transfer to the successor entity subject to this Policy.</span>
            ]} />
            <P>We do <strong>not</strong> sell your personal information.</P>

            <H>5. Cookies & Tracking</H>
            <P>
                We use first-party cookies and local storage to maintain your authenticated session and remember UI preferences. We may use privacy-respecting analytics to understand aggregated usage. We do not use third-party advertising trackers.
            </P>

            <H>6. Data Retention</H>
            <P>
                We keep your account and plan content for as long as your account is active. If you delete a plan, it is permanently removed and cannot be restored. If you close your account, we retain billing records for as long as required by tax/financial law (typically 7 years in the US) and otherwise delete or anonymize your data within 90 days.
            </P>

            <H>7. Your Rights — GDPR (EEA / UK)</H>
            <P>
                If you are located in the European Economic Area, the United Kingdom, or Switzerland, you have the following rights regarding your personal data: access, rectification, erasure, restriction, portability, and objection to processing. To exercise any of these rights, email <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority.
            </P>
            <P>
                <strong>Legal basis:</strong> we process your data based on (a) <em>contract</em> — to provide the Service you purchased, (b) <em>legitimate interest</em> — to operate, secure, and improve the Service, and (c) <em>consent</em> — for marketing emails (revocable at any time).
            </P>

            <H>8. Your Rights — CCPA / CPRA (California)</H>
            <P>
                If you are a California resident, you have the right to know what personal information we collect, request a copy, request deletion, request correction, and limit our use of sensitive personal information. We do not sell personal information and we do not share it for cross-context behavioral advertising. To exercise your rights, email <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>. We will not discriminate against you for exercising your rights.
            </P>

            <H>9. International Data Transfers</H>
            <P>
                We are based in the United States. If you access the Service from outside the US, your information will be transferred to, stored in, and processed in the US and other countries where our service providers operate. Where required, we rely on Standard Contractual Clauses or equivalent safeguards for transfers from the EEA/UK to the US.
            </P>

            <H>10. Security</H>
            <P>
                We use industry-standard safeguards: TLS in transit, encryption at rest on our database and storage providers, hashed passwords, scoped service-role credentials, and row-level security policies. No system is perfectly secure — please choose a strong password and notify us immediately at <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a> if you suspect unauthorized access.
            </P>

            <H>11. Children</H>
            <P>
                The Service is not directed to children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us information, contact us and we will delete it.
            </P>

            <H>12. Changes to This Policy</H>
            <P>
                We may update this Policy from time to time. The “Last updated” date at the top reflects the latest revision. Material changes will be communicated via email or in-app notice at least 14 days before they take effect.
            </P>

            <H>13. Contact</H>
            <P>
                Influence Incubator LLC · Dr Brandt Gibson LLC · Utah, USA · <a href="mailto:support@influenceincubator.xyz" className="text-brand-bronze hover:text-brand-gold underline">support@influenceincubator.xyz</a>
            </P>
        </LegalShell>
    );
}
