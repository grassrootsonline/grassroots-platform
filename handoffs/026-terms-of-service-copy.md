# 026 — Content: Terms of service page copy

| Field | Value |
|---|---|
| **Recipient** | `claude-design` |
| **Priority** | `high` |
| **Type** | `content` |
| **Branch** | `content/terms-of-service-copy` |
| **Depends on** | `025-privacy-policy-copy` (shares the `legal.ts` constants file) |

---

## Context

Companion to handoff 025. Claude Design has already designed the `/terms` page — layout is done. The only remaining piece is the copy, delivered below. **Scope is copy only — no layout, component, or token changes.** Claude Code owns the actual page implementation as a separate follow-up — see handoff 028.

**Same caveat as 025: this is drafted from general legal practice, not legal advice, and needs a lawyer's review before it goes live** — especially the arbitration clause below, which I've flagged as needing a jurisdiction-aware carve-out.

**Scope decisions already made with Alex** (2026-07-02): entity/governing law = Canada, minimum age = 16+, dispute resolution = binding arbitration + class action waiver.

**One thing to escalate back to Alex, not silently implement:** binding arbitration clauses are not reliably enforceable against consumers in some places this platform will have users — notably Quebec (Consumer Protection Act restricts mandatory arbitration in consumer contracts) and the EU/UK (consumer protection law generally overrides mandatory arbitration in standard-form contracts). The copy below includes a jurisdiction carve-out so the clause doesn't just fail silently in those regions, but the underlying business decision — whether to run one arbitration clause with carve-outs, or two-tier terms, or drop arbitration entirely — is a legal call, not a copy call. Flag this explicitly for legal review rather than treating the carve-out language as a finished solution.

Same placeholder tokens as 025 (`{LEGAL_ENTITY_NAME}`, `{GOVERNING_LAW_JURISDICTION}`, `{PRIVACY_CONTACT_EMAIL}`, `{POLICY_EFFECTIVE_DATE}`) — drop them in literally or use illustrative values, and flag them as unresolved in your amendment. Wiring them to real values is Claude Code's job (handoff 028), not Design's.

---

## Copy to insert — `/terms`

Sentence-case section headings, matching what's already in the design — no Title Case.

> ## Terms of service
>
> **Effective date:** {POLICY_EFFECTIVE_DATE}
>
> These terms govern your use of Grassroots, operated by {LEGAL_ENTITY_NAME}. By creating an account, you agree to them. If you don't agree, don't use Grassroots.
>
> ### Who can use Grassroots
>
> You must be at least 16 years old to create an account. By signing up, you confirm that you meet this requirement and that you have the legal capacity to enter into these terms.
>
> ### Your account
>
> You're responsible for the security of your account and everything that happens under it. Keep your password confidential and tell us right away if you think your account has been compromised. Usernames must follow our naming rules (3–30 characters, lowercase letters/numbers/underscores, no impersonation of others) and are subject to a 30-day change window after signup. One person, one account — don't create multiple accounts to evade a suspension or manipulate engagement.
>
> ### The waitlist period
>
> Grassroots is currently in early access. Creating an account does not guarantee immediate access to the full platform — accounts are activated manually as capacity allows, and we don't commit to a specific timeline. We may change, pause, or end the waitlist process at any time.
>
> ### Your content
>
> You own what you post — your posts, articles, projects, comments, and messages. By posting content to Grassroots, you grant us a non-exclusive, worldwide, royalty-free, sublicensable license to host, store, reproduce, display, and distribute that content solely for the purpose of operating and improving the platform (for example, showing your post in other users' feeds, generating link previews, or displaying your project on your profile). This license ends when you delete the content or your account, except where content has already been shared by other users in ways we can't retract (e.g., a comment thread referencing your now-deleted post), or where we're required to retain it by law.
>
> You're solely responsible for the content you post. Don't post anything that:
> - Infringes someone else's intellectual property or privacy rights
> - Is illegal, harassing, hateful, or threatens violence
> - Contains malware or is designed to compromise another user's account or device
> - Impersonates another person or entity
> - Is spam, or manipulates engagement metrics (fake accounts, vote/reaction manipulation, coordinated inauthentic behavior)
>
> Community owners and moderators may set additional rules for their individual communities, visible on each community's page.
>
> ### Content moderation
>
> We may remove content, restrict features, or suspend or terminate accounts that violate these terms or a community's rules, at our discretion and without prior notice in cases of serious or repeated violations. Community moderators can take moderation action within the communities they moderate; platform moderators and administrators can act platform-wide. If your content is removed or your account is actioned and you believe it was a mistake, contact us and we'll review it.
>
> If you believe content on Grassroots infringes your copyright, send a notice to {PRIVACY_CONTACT_EMAIL} including: identification of the copyrighted work, identification of the infringing material and its location, your contact information, and a statement that you have a good-faith belief the use isn't authorized. We'll respond in accordance with applicable copyright law.
>
> ### Third-party sign-in
>
> If you sign up or log in using Google, your use of that service is also governed by Google's own terms. We're not responsible for the availability or practices of third-party sign-in providers.
>
> ### Paid features
>
> Grassroots currently offers a free tier only. If we introduce paid features (for example, a Pro tier), separate billing terms will apply and will be presented to you before you're charged. This section will be updated when that happens — it isn't retroactive to anything in your account today.
>
> ### Suspension and termination
>
> We may suspend or terminate your account for violating these terms, for extended inactivity, or if required by law. You can delete your own account at any time from your settings — deletion is permanent after a 30-day hold period, during which you can cancel the request by signing back in. See our [Privacy policy](/privacy) for what happens to your data and content after deletion.
>
> ### Disclaimers
>
> Grassroots is provided "as is" and "as available," without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement. We don't warrant that the platform will be uninterrupted, error-free, or secure, or that content posted by other users is accurate or reliable.
>
> ### Limitation of liability
>
> To the maximum extent permitted by law, {LEGAL_ENTITY_NAME} is not liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising from your use of Grassroots — including content posted by other users. Our total liability for any claim arising from these terms or your use of the platform is limited to the greater of CAD $100 or the amount you paid us in the 12 months before the claim arose. This limitation doesn't apply where prohibited by law, including for gross negligence or willful misconduct.
>
> ### Indemnification
>
> You agree to indemnify and hold {LEGAL_ENTITY_NAME} harmless from any claims, damages, or expenses (including reasonable legal fees) arising from your content, your violation of these terms, or your violation of any third party's rights.
>
> ### Dispute resolution and arbitration
>
> **This section does not apply if you're located in Quebec, the European Economic Area, or the United Kingdom** — see the carve-out below.
>
> For everyone else: you and {LEGAL_ENTITY_NAME} agree to resolve any dispute arising from these terms or your use of Grassroots through binding, individual arbitration rather than in court, except that either party may bring an individual claim in small claims court. You and {LEGAL_ENTITY_NAME} each waive the right to participate in a class action or class-wide arbitration. [PLACEHOLDER: name arbitration body/rules — e.g., ADR Institute of Canada — once selected by legal counsel.]
>
> **If you're located in Quebec, the EEA, or the UK:** local consumer protection law limits or prohibits mandatory arbitration in standard-form consumer contracts, so disputes are instead resolved in the courts of {GOVERNING_LAW_JURISDICTION}, and the class action waiver above does not apply to the extent local law makes it unenforceable.
>
> ### Governing law
>
> These terms are governed by the laws of {GOVERNING_LAW_JURISDICTION}, Canada, without regard to conflict-of-law principles, except where local consumer protection law requires otherwise for users located elsewhere.
>
> ### Changes to these terms
>
> We may update these terms as the platform evolves. If we make material changes, we'll notify you by email or with a notice on the platform before the changes take effect. Continuing to use Grassroots after changes take effect means you accept the updated terms.
>
> ### General
>
> If any part of these terms is found unenforceable, the rest remains in effect. These terms, together with the Privacy policy, are the entire agreement between you and {LEGAL_ENTITY_NAME} regarding Grassroots. We may assign these terms in connection with a merger, acquisition, or sale of assets; you may not assign them without our consent. Our failure to enforce any part of these terms isn't a waiver of our right to do so later.
>
> ### Contact us
>
> Questions about these terms: {PRIVACY_CONTACT_EMAIL}.

---

## Deliverable

- Insert the copy above into the existing `/terms` page design, verbatim. No layout, component, or token changes.
- Produce an amendment documenting the copy addition, same pattern as 025.
- Flag the placeholder tokens and the arbitration carve-out as unresolved/pending legal review in the amendment.
- No implementation work here — route creation, the constants file, and the footer link update are Claude Code's job (handoff 028).
- **Escalate the arbitration carve-out to Alex for legal review before this goes live** — it's flagged as a placeholder decision above, not a finished clause.
