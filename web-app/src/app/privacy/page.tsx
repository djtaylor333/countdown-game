import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy – Countdown',
  description: 'Privacy policy for the Countdown daily puzzle game.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'March 9, 2026';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#070e1c',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
        padding: '0 0 64px',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0f1f38 0%, #070e1c 100%)',
          borderBottom: '1px solid #1e4176',
          padding: '32px 24px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 13, color: '#94a3b8', letterSpacing: '3px', marginBottom: 8 }}>
          COUNTDOWN
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#f6c90e',
            margin: '0 0 8px',
            letterSpacing: 1,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          Last updated: {lastUpdated}
        </p>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <Section title="Overview">
          <p>
            Countdown (&quot;the App&quot;, &quot;the Game&quot;) is a daily word and numbers
            puzzle game developed by D J Taylor (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
            This Privacy Policy explains what information we collect, how we use it, and your
            rights in relation to it.
          </p>
          <p>
            <strong style={{ color: '#f6c90e' }}>
              We do not collect, transmit, or share any personal data.
            </strong>{' '}
            The App works entirely on your device.
          </p>
        </Section>

        <Section title="Information We Collect">
          <p>
            The App does <strong>not</strong> collect or transmit any of the following:
          </p>
          <ul>
            <li>Names, email addresses, or any account information</li>
            <li>Location data</li>
            <li>Device identifiers</li>
            <li>Usage analytics or telemetry</li>
            <li>Crash reports</li>
            <li>Advertising identifiers</li>
          </ul>
          <p>
            <strong>Local storage only:</strong> Game progress, daily results, and streak counts
            are saved <em>locally on your device</em> using Android DataStore (Android app) or
            browser localStorage (web app). This data never leaves your device.
          </p>
        </Section>

        <Section title="Third-Party Services">
          <p>
            The Android app uses <strong>Google Play Services Fonts</strong> to download the
            Space Grotesk and Rajdhani typefaces at runtime. This is a standard Android system
            service and does not share any game or personal data. Please refer to{' '}
            <a
              href="https://policies.google.com/privacy"
              style={{ color: '#f6c90e' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&apos;s Privacy Policy
            </a>{' '}
            for details on how Google handles font requests.
          </p>
          <p>
            No advertising SDKs, analytics SDKs, or tracking libraries are included in the App.
          </p>
        </Section>

        <Section title="Data Storage and Security">
          <p>
            All game data (streaks, results, daily puzzle state) is stored locally on your
            device and is not backed up to any external server operated by us. If you uninstall
            the App, this data is deleted from your device.
          </p>
          <p>
            The web version (Progressive Web App) stores data in your browser&apos;s
            localStorage. Clearing your browser data will erase your game history.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            The App does not knowingly collect any information from children under the age of
            13. Because we collect no personal data whatsoever, the App is safe for all ages.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected
            by updating the &quot;Last updated&quot; date at the top of this page. Continued use
            of the App after changes are posted constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            If you have any questions about this Privacy Policy, please contact us via the
            GitHub repository:{' '}
            <a
              href="https://github.com/djtaylor333/countdown-game"
              style={{ color: '#f6c90e' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/djtaylor333/countdown-game
            </a>
          </p>
        </Section>

        {/* Back link */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: '#f6c90e',
              color: '#070e1c',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            ← Back to Game
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#f6c90e',
          borderBottom: '1px solid #1e4176',
          paddingBottom: 8,
          marginBottom: 16,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: '#cbd5e1',
        }}
      >
        {children}
      </div>
    </section>
  );
}
