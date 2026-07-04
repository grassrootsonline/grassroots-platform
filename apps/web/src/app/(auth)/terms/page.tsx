import Link from 'next/link'
import { LegalPageShell } from '@/components/layout/legal-page-shell'
import {
  LEGAL_ENTITY_NAME,
  GOVERNING_LAW_JURISDICTION,
  PRIVACY_CONTACT_EMAIL,
} from '@/constants/legal'
import s from '@/components/layout/legal-page-shell.module.css'

export const metadata = {
  title: 'Terms of service — Grassroots',
  // Remove once legal review is complete and legal.ts placeholders are filled in (handoffs 025–028).
  robots: { index: false, follow: false },
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of service">
      <p>
        These terms govern your use of Grassroots, operated by{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span>. By creating an account,
        you agree to them. If you don&rsquo;t agree, don&rsquo;t use Grassroots.
      </p>

      <h2>Who can use Grassroots</h2>
      <p>
        You must be at least 16 years old to create an account. By signing up, you
        confirm that you meet this requirement and that you have the legal capacity
        to enter into these terms.
      </p>

      <h2>Your account</h2>
      <p>
        You&rsquo;re responsible for the security of your account and everything that
        happens under it. Keep your password confidential and tell us right away if
        you think your account has been compromised. Usernames must follow our naming
        rules (3–30 characters, lowercase letters/numbers/underscores, no
        impersonation of others) and are subject to a 30-day change window after
        signup. One person, one account — don&rsquo;t create multiple accounts to
        evade a suspension or manipulate engagement.
      </p>

      <h2>The waitlist period</h2>
      <p>
        Grassroots is currently in early access. Creating an account does not
        guarantee immediate access to the full platform — accounts are activated
        manually as capacity allows, and we don&rsquo;t commit to a specific
        timeline. We may change, pause, or end the waitlist process at any time.
      </p>

      <h2>Your content</h2>
      <p>
        You own what you post — your posts, articles, projects, comments, and
        messages. By posting content to Grassroots, you grant us a non-exclusive,
        worldwide, royalty-free, sublicensable license to host, store, reproduce,
        display, and distribute that content solely for the purpose of operating and
        improving the platform (for example, showing your post in other
        users&rsquo; feeds, generating link previews, or displaying your project on
        your profile). This license ends when you delete the content or your
        account, except where content has already been shared by other users in ways
        we can&rsquo;t retract (e.g., a comment thread referencing your now-deleted
        post), or where we&rsquo;re required to retain it by law.
      </p>
      <p>You&rsquo;re solely responsible for the content you post. Don&rsquo;t post anything that:</p>
      <ul>
        <li>Infringes someone else&rsquo;s intellectual property or privacy rights</li>
        <li>Is illegal, harassing, hateful, or threatens violence</li>
        <li>Contains malware or is designed to compromise another user&rsquo;s account or device</li>
        <li>Impersonates another person or entity</li>
        <li>Is spam, or manipulates engagement metrics (fake accounts, vote/reaction manipulation, coordinated inauthentic behavior)</li>
      </ul>
      <p>
        Community owners and moderators may set additional rules for their
        individual communities, visible on each community&rsquo;s page.
      </p>

      <h2>Content moderation</h2>
      <p>
        We may remove content, restrict features, or suspend or terminate accounts
        that violate these terms or a community&rsquo;s rules, at our discretion and
        without prior notice in cases of serious or repeated violations. Community
        moderators can take moderation action within the communities they moderate;
        platform moderators and administrators can act platform-wide. If your content
        is removed or your account is actioned and you believe it was a mistake,
        contact us and we&rsquo;ll review it.
      </p>
      <p>
        If you believe content on Grassroots infringes your copyright, send a notice
        to <span className={s.token}>{PRIVACY_CONTACT_EMAIL}</span> including:
        identification of the copyrighted work, identification of the infringing
        material and its location, your contact information, and a statement that you
        have a good-faith belief the use isn&rsquo;t authorized. We&rsquo;ll respond
        in accordance with applicable copyright law.
      </p>

      <h2>Third-party sign-in</h2>
      <p>
        If you sign up or log in using Google, your use of that service is also
        governed by Google&rsquo;s own terms. We&rsquo;re not responsible for the
        availability or practices of third-party sign-in providers.
      </p>

      <h2>Paid features</h2>
      <p>
        Grassroots currently offers a free tier only. If we introduce paid features
        (for example, a Pro tier), separate billing terms will apply and will be
        presented to you before you&rsquo;re charged. This section will be updated
        when that happens — it isn&rsquo;t retroactive to anything in your account
        today.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        We may suspend or terminate your account for violating these terms, for
        extended inactivity, or if required by law. You can delete your own account
        at any time from your settings — deletion is permanent after a 30-day hold
        period, during which you can cancel the request by signing back in. See our{' '}
        <Link href="/privacy">Privacy policy</Link> for what happens to your data and
        content after deletion.
      </p>

      <h2>Disclaimers</h2>
      <p>
        Grassroots is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo;
        without warranties of any kind, express or implied, including warranties of
        merchantability, fitness for a particular purpose, or non-infringement. We
        don&rsquo;t warrant that the platform will be uninterrupted, error-free, or
        secure, or that content posted by other users is accurate or reliable.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law,{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span> is not liable for any
        indirect, incidental, special, consequential, or punitive damages, or any
        loss of profits, data, or goodwill, arising from your use of Grassroots —
        including content posted by other users. Our total liability for any claim
        arising from these terms or your use of the platform is limited to the
        greater of CAD $100 or the amount you paid us in the 12 months before the
        claim arose. This limitation doesn&rsquo;t apply where prohibited by law,
        including for gross negligence or willful misconduct.
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span> harmless from any
        claims, damages, or expenses (including reasonable legal fees) arising from
        your content, your violation of these terms, or your violation of any third
        party&rsquo;s rights.
      </p>

      <h2>Dispute resolution and arbitration</h2>
      <div className={s.warningNotice}>
        <p>
          <strong>Pending legal review.</strong> This clause requires a
          jurisdiction-aware carve-out for Quebec, EEA, and UK users. It should not go
          live without legal sign-off — flagged for Alex in handoff 026.
        </p>
      </div>
      <p>
        <strong>
          This section does not apply if you&rsquo;re located in Quebec, the European
          Economic Area, or the United Kingdom
        </strong>{' '}
        — see the carve-out below.
      </p>
      <p>
        For everyone else: you and{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span> agree to resolve any
        dispute arising from these terms or your use of Grassroots through binding,
        individual arbitration rather than in court, except that either party may
        bring an individual claim in small claims court. You and{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span> each waive the right to
        participate in a class action or class-wide arbitration. [PLACEHOLDER: name
        arbitration body/rules — e.g., ADR Institute of Canada — once selected by
        legal counsel.]
      </p>
      <p>
        <strong>If you&rsquo;re located in Quebec, the EEA, or the UK:</strong> local
        consumer protection law limits or prohibits mandatory arbitration in
        standard-form consumer contracts, so disputes are instead resolved in the
        courts of <span className={s.token}>{GOVERNING_LAW_JURISDICTION}</span>, and
        the class action waiver above does not apply to the extent local law makes it
        unenforceable.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of{' '}
        <span className={s.token}>{GOVERNING_LAW_JURISDICTION}</span>, Canada,
        without regard to conflict-of-law principles, except where local consumer
        protection law requires otherwise for users located elsewhere.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms as the platform evolves. If we make material
        changes, we&rsquo;ll notify you by email or with a notice on the platform
        before the changes take effect. Continuing to use Grassroots after changes
        take effect means you accept the updated terms.
      </p>

      <h2>General</h2>
      <p>
        If any part of these terms is found unenforceable, the rest remains in
        effect. These terms, together with the Privacy policy, are the entire
        agreement between you and{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span> regarding Grassroots. We
        may assign these terms in connection with a merger, acquisition, or sale of
        assets; you may not assign them without our consent. Our failure to enforce
        any part of these terms isn&rsquo;t a waiver of our right to do so later.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these terms:{' '}
        <span className={s.token}>{PRIVACY_CONTACT_EMAIL}</span>.
      </p>
    </LegalPageShell>
  )
}
