# 025 — Content: Privacy policy page copy

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `content` |
| **Branch** | `content/privacy-policy-copy` |
| **Depends on** | none |

---

## Context

Claude Design has already designed the `/privacy` page — layout is done. The only remaining piece is the copy itself, which didn't exist yet. This handoff delivers that copy so Claude Design can drop it into the existing design as-is. **Scope is copy only — no layout, component, or token changes.** Claude Code owns the actual page implementation (route, data wiring, footer link) as a separate follow-up once this copy is finalized — see handoff 027.

**This copy is drafted from general privacy-law practice (GDPR, CCPA/CPRA, PIPEDA) and from what the platform actually collects per `docs/ARCHITECTURE.md` — it is not a substitute for legal review.** Production Supabase is already live (handoff 020) and collecting real user data, so I'd treat legal sign-off on this document as a blocker before it goes live, not a nice-to-have. Flag this to Alex explicitly rather than treating this handoff as final.

**Scope decisions already made with Alex** (2026-07-02): entity/governing law = Canada (placeholder province used below — confirm), compliance scope = global baseline (GDPR + CCPA/CPRA + PIPEDA), minimum age = 16+.

**Placeholders in the copy below** (`{LEGAL_ENTITY_NAME}`, `{GOVERNING_LAW_JURISDICTION}`, `{PRIVACY_CONTACT_EMAIL}`, `{POLICY_EFFECTIVE_DATE}`) aren't decided yet — legal entity name, registered address, exact effective date, and the final domain are all still open (`docs/ARCHITECTURE.md` uses both `grassroots.ai` and `grassroots.community` inconsistently, worth resolving separately). Drop the placeholder tokens into the design literally as written, or substitute illustrative example values if that reads better in a mockup (e.g., "Grassroots Technologies Inc.") — either way, note in your amendment that these are unresolved and must be wired to real values, not hardcoded, when Claude Code implements the page. That wiring (a `legal.ts` constants file) is implementation, not design — it's specified in handoff 027 for Claude Code, not something Design needs to build.

---

## Copy to insert — `/privacy`

Sentence-case section headings, matching what's already in the design — **do not switch to Title Case for legal headings**, that's a common ToS-template habit but it conflicts with `packages/design-system/CLAUDE.md`'s "sentence case everywhere" rule.

> ## Privacy policy
>
> **Effective date:** {POLICY_EFFECTIVE_DATE}
>
> Grassroots ("we," "us," "our") is operated by {LEGAL_ENTITY_NAME}. This policy explains what personal information we collect when you use the Grassroots platform, why we collect it, how we use and share it, and the choices and rights you have. It applies from the moment you create an account — including during the waitlist period, when your account is fully authenticated even before you're granted access to the platform itself.
>
> ### Information we collect
>
> **Information you give us directly.** When you create an account: your email address, a password (if you sign up with email rather than Google), and a username. During onboarding: your display name, bio, avatar, headline, location, and any social/website links you choose to add. When you use the platform: the posts, articles, projects, comments, community content, and direct messages you create, along with any images or media you upload.
>
> **Information from third-party sign-in.** If you sign up or log in with Google, we receive your email address and basic profile information from Google, and we store a reference to your Google account so we can recognize you on future logins. We don't receive your Google password.
>
> **Information collected automatically.** When you use Grassroots, we automatically collect: your IP address (used for rate-limiting and security, and to give you a rough sense of "who's active" without storing precise location), device and browser information, pages and features you interact with, and timestamps of your activity. This is standard web server and analytics behavior, not something unique to Grassroots.
>
> **Cookies.** We use a small number of essential cookies to keep you signed in securely (`httpOnly`, `Secure`, session cookies managed by our authentication provider). We don't use third-party advertising cookies or cross-site tracking cookies. Aggregate, non-identifying performance analytics (page load speed, error rates) are collected through our hosting provider's built-in analytics.
>
> ### How we use your information
>
> We use your information to:
> - Create and maintain your account, and authenticate you when you sign in
> - Operate the core features of the platform — your feed, profile, posts, projects, communities, messages, and notifications
> - Show your public profile, posts, and projects to other users and, where you've made them public, to visitors who aren't signed in
> - Send you service emails: verification, password reset, and (if you don't turn them off) activity digests
> - Detect and prevent abuse, spam, and violations of our Terms of Service
> - Monitor and improve platform performance and reliability
> - Comply with legal obligations
>
> We do not sell your personal information, and we do not use your content or activity to serve third-party advertising.
>
> ### How we share your information
>
> **With other users, by design.** Grassroots is a social platform. Your username, display name, avatar, bio, and public posts, articles, and projects are visible to other users and, unless you've set your account to private in a future release, to the public. Direct messages are visible only to participants in the conversation.
>
> **With service providers who help us run the platform.** We share information with the vendors who provide our infrastructure, each acting under a data processing agreement and only for the purpose of providing their service to us:
>
> | Provider | What they process | Purpose |
> |---|---|---|
> | Supabase | Account data, profile data, content, auth credentials | Database, authentication, file storage, realtime features |
> | Upstash | Session tokens, cached feed/profile data, rate-limit counters | Caching and rate limiting |
> | Vercel | Request logs, performance metrics | Hosting, content delivery, performance analytics |
> | Sentry | Error reports tagged with your user ID (no other personal data) | Error tracking and debugging |
> | Axiom | Structured server event logs | Operational logging |
> | Resend | Your email address, email content | Sending verification, transactional, and digest emails |
>
> **For legal reasons.** We may disclose information if required by law, to enforce our Terms of Service, or to protect the rights, property, or safety of Grassroots, our users, or the public.
>
> **Business transfers.** If Grassroots is involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction. We'll notify you before your information becomes subject to a different privacy policy.
>
> ### Where your information is processed
>
> {LEGAL_ENTITY_NAME} is based in {GOVERNING_LAW_JURISDICTION}, Canada, but our infrastructure providers (Supabase, Upstash, Vercel, Sentry, Axiom, Resend) may process and store data in other countries, including the United States. Where we transfer personal information out of Canada or the EEA/UK, we rely on our providers' standard contractual safeguards to protect it consistent with PIPEDA and GDPR requirements.
>
> ### How long we keep your information
>
> We keep your account and content for as long as your account is active. If you delete your account, we hold the request for 30 days before permanent deletion — during that window, you can cancel the deletion by signing back in. After the 30 days, your account, profile, credentials, roles, follows, and reactions are permanently deleted. Posts and comments you authored remain visible to preserve conversation context for other users, but are re-attributed to "[deleted]" rather than your identity.
>
> ### Your privacy rights
>
> **If you're in the European Economic Area or United Kingdom (GDPR):** you have the right to access, correct, delete, or export your personal information, to object to or restrict certain processing, and to withdraw consent at any time. You also have the right to lodge a complaint with your local data protection authority.
>
> **If you're a California resident (CCPA/CPRA):** you have the right to know what personal information we collect, to request deletion, to correct inaccurate information, and to opt out of the sale or sharing of personal information — though we don't sell or share your information for cross-context advertising in the first place. We won't discriminate against you for exercising these rights.
>
> **If you're in Canada (PIPEDA):** you have the right to access the personal information we hold about you, to challenge its accuracy, and to have it corrected. We collect, use, and disclose your personal information only for the purposes described in this policy, and only to the extent necessary for those purposes.
>
> **Everyone else:** regardless of where you're located, you can access, update, or delete most of your information directly from your account settings, or by contacting us using the details below.
>
> To exercise any of these rights, email {PRIVACY_CONTACT_EMAIL}. We'll respond within the timeframe required by applicable law (generally 30 days).
>
> ### Children's privacy
>
> Grassroots is not directed to, and is not intended for use by, anyone under 16. We don't knowingly collect personal information from anyone under 16. If we learn that we've collected information from someone under 16, we'll delete it.
>
> ### Security
>
> We use industry-standard safeguards to protect your information, including encrypted connections, database-level access controls (Row Level Security), and restricted access to production systems. No system is perfectly secure, and we can't guarantee absolute security of information you transmit to us.
>
> ### Changes to this policy
>
> We may update this policy as the platform evolves. If we make material changes, we'll notify you by email or with a notice on the platform before the changes take effect. The "Effective date" above always reflects the most recent version.
>
> ### Contact us
>
> Questions about this policy or your data: {PRIVACY_CONTACT_EMAIL}.

---

## Deliverable

- Insert the copy above into the existing `/privacy` page design, verbatim. No layout, component, or token changes — this is a content-only pass.
- Produce an amendment documenting the copy addition, following `design-handoffs/AMENDMENT-TEMPLATE.md` (same pattern as Amendment 01's copy pass on the landing page).
- Flag the four placeholder tokens in the amendment as unresolved (legal entity name, jurisdiction, contact email, effective date) so Claude Code knows to wire them to real values rather than ship them literally.
- **Do not treat this copy as launch-ready.** Note in the amendment that this page is pending legal review before it goes live on `main`.
- No implementation work here — route creation, the constants file, and the footer link update are Claude Code's job (handoff 027).
