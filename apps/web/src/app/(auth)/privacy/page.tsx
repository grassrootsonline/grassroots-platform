import { LegalPageShell } from '@/components/layout/legal-page-shell'
import {
  LEGAL_ENTITY_NAME,
  GOVERNING_LAW_JURISDICTION,
  PRIVACY_CONTACT_EMAIL,
} from '@/constants/legal'
import s from '@/components/layout/legal-page-shell.module.css'

export const metadata = {
  title: 'Privacy policy — Grassroots',
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy policy">
      <p>
        Grassroots (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;) is operated by{' '}
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span>. This policy explains what
        personal information we collect when you use the Grassroots platform, why we
        collect it, how we use and share it, and the choices and rights you have. It
        applies from the moment you create an account — including during the waitlist
        period, when your account is fully authenticated even before you&rsquo;re
        granted access to the platform itself.
      </p>

      <h2>Information we collect</h2>
      <p>
        <strong>Information you give us directly.</strong> When you create an account:
        your email address, a password (if you sign up with email rather than Google),
        and a username. During onboarding: your display name, bio, avatar, headline,
        location, and any social/website links you choose to add. When you use the
        platform: the posts, articles, projects, comments, community content, and
        direct messages you create, along with any images or media you upload.
      </p>
      <p>
        <strong>Information from third-party sign-in.</strong> If you sign up or log
        in with Google, we receive your email address and basic profile information
        from Google, and we store a reference to your Google account so we can
        recognize you on future logins. We don&rsquo;t receive your Google password.
      </p>
      <p>
        <strong>Information collected automatically.</strong> When you use Grassroots,
        we automatically collect: your IP address (used for rate-limiting and
        security, and to give you a rough sense of &ldquo;who&rsquo;s active&rdquo;
        without storing precise location), device and browser information, pages and
        features you interact with, and timestamps of your activity. This is standard
        web server and analytics behavior, not something unique to Grassroots.
      </p>
      <p>
        <strong>Cookies.</strong> We use a small number of essential cookies to keep
        you signed in securely (<code>httpOnly</code>, <code>Secure</code>, session
        cookies managed by our authentication provider). We don&rsquo;t use
        third-party advertising cookies or cross-site tracking cookies. Aggregate,
        non-identifying performance analytics (page load speed, error rates) are
        collected through our hosting provider&rsquo;s built-in analytics.
      </p>

      <h2>How we use your information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Create and maintain your account, and authenticate you when you sign in</li>
        <li>Operate the core features of the platform — your feed, profile, posts, projects, communities, messages, and notifications</li>
        <li>Show your public profile, posts, and projects to other users and, where you&rsquo;ve made them public, to visitors who aren&rsquo;t signed in</li>
        <li>Send you service emails: verification, password reset, and (if you don&rsquo;t turn them off) activity digests</li>
        <li>Detect and prevent abuse, spam, and violations of our Terms of Service</li>
        <li>Monitor and improve platform performance and reliability</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>
        We do not sell your personal information, and we do not use your content or
        activity to serve third-party advertising.
      </p>

      <h2>How we share your information</h2>
      <p>
        <strong>With other users, by design.</strong> Grassroots is a social platform.
        Your username, display name, avatar, bio, and public posts, articles, and
        projects are visible to other users and, unless you&rsquo;ve set your account
        to private in a future release, to the public. Direct messages are visible
        only to participants in the conversation.
      </p>
      <p>
        <strong>With service providers who help us run the platform.</strong> We share
        information with the vendors who provide our infrastructure, each acting under
        a data processing agreement and only for the purpose of providing their
        service to us:
      </p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>What they process</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supabase</td>
            <td>Account data, profile data, content, auth credentials</td>
            <td>Database, authentication, file storage, realtime features</td>
          </tr>
          <tr>
            <td>Upstash</td>
            <td>Session tokens, cached feed/profile data, rate-limit counters</td>
            <td>Caching and rate limiting</td>
          </tr>
          <tr>
            <td>Vercel</td>
            <td>Request logs, performance metrics</td>
            <td>Hosting, content delivery, performance analytics</td>
          </tr>
          <tr>
            <td>Sentry</td>
            <td>Error reports tagged with your user ID (no other personal data)</td>
            <td>Error tracking and debugging</td>
          </tr>
          <tr>
            <td>Axiom</td>
            <td>Structured server event logs</td>
            <td>Operational logging</td>
          </tr>
          <tr>
            <td>Resend</td>
            <td>Your email address, email content</td>
            <td>Sending verification, transactional, and digest emails</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>For legal reasons.</strong> We may disclose information if required
        by law, to enforce our Terms of Service, or to protect the rights, property,
        or safety of Grassroots, our users, or the public.
      </p>
      <p>
        <strong>Business transfers.</strong> If Grassroots is involved in a merger,
        acquisition, or asset sale, your information may be transferred as part of
        that transaction. We&rsquo;ll notify you before your information becomes
        subject to a different privacy policy.
      </p>

      <h2>Where your information is processed</h2>
      <p>
        <span className={s.token}>{LEGAL_ENTITY_NAME}</span> is based in{' '}
        <span className={s.token}>{GOVERNING_LAW_JURISDICTION}</span>, Canada, but our
        infrastructure providers (Supabase, Upstash, Vercel, Sentry, Axiom, Resend) may
        process and store data in other countries, including the United States. Where
        we transfer personal information out of Canada or the EEA/UK, we rely on our
        providers&rsquo; standard contractual safeguards to protect it consistent with
        PIPEDA and GDPR requirements.
      </p>

      <h2>How long we keep your information</h2>
      <p>
        We keep your account and content for as long as your account is active. If you
        delete your account, we hold the request for 30 days before permanent
        deletion — during that window, you can cancel the deletion by signing back in.
        After the 30 days, your account, profile, credentials, roles, follows, and
        reactions are permanently deleted. Posts and comments you authored remain
        visible to preserve conversation context for other users, but are
        re-attributed to &ldquo;[deleted]&rdquo; rather than your identity.
      </p>

      <h2>Your privacy rights</h2>
      <p>
        <strong>If you&rsquo;re in the European Economic Area or United Kingdom
        (GDPR):</strong> you have the right to access, correct, delete, or export your
        personal information, to object to or restrict certain processing, and to
        withdraw consent at any time. You also have the right to lodge a complaint
        with your local data protection authority.
      </p>
      <p>
        <strong>If you&rsquo;re a California resident (CCPA/CPRA):</strong> you have
        the right to know what personal information we collect, to request deletion,
        to correct inaccurate information, and to opt out of the sale or sharing of
        personal information — though we don&rsquo;t sell or share your information
        for cross-context advertising in the first place. We won&rsquo;t discriminate
        against you for exercising these rights.
      </p>
      <p>
        <strong>If you&rsquo;re in Canada (PIPEDA):</strong> you have the right to
        access the personal information we hold about you, to challenge its accuracy,
        and to have it corrected. We collect, use, and disclose your personal
        information only for the purposes described in this policy, and only to the
        extent necessary for those purposes.
      </p>
      <p>
        <strong>Everyone else:</strong> regardless of where you&rsquo;re located, you
        can access, update, or delete most of your information directly from your
        account settings, or by contacting us using the details below.
      </p>
      <p>
        To exercise any of these rights, email{' '}
        <span className={s.token}>{PRIVACY_CONTACT_EMAIL}</span>. We&rsquo;ll respond
        within the timeframe required by applicable law (generally 30 days).
      </p>

      <h2>Children&rsquo;s privacy</h2>
      <p>
        Grassroots is not directed to, and is not intended for use by, anyone under
        16. We don&rsquo;t knowingly collect personal information from anyone under
        16. If we learn that we&rsquo;ve collected information from someone under 16,
        we&rsquo;ll delete it.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard safeguards to protect your information, including
        encrypted connections, database-level access controls (Row Level Security),
        and restricted access to production systems. No system is perfectly secure,
        and we can&rsquo;t guarantee absolute security of information you transmit to
        us.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as the platform evolves. If we make material
        changes, we&rsquo;ll notify you by email or with a notice on the platform
        before the changes take effect. The &ldquo;Effective date&rdquo; above always
        reflects the most recent version.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your data:{' '}
        <span className={s.token}>{PRIVACY_CONTACT_EMAIL}</span>.
      </p>
    </LegalPageShell>
  )
}
