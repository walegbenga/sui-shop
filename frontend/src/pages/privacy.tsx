import Link from 'next/link';

const LAST_UPDATED = 'April 30, 2026';
const APP_NAME     = 'Digi ChainStore';
const COMPANY      = 'CoA Tech';
const CONTACT      = 'support@digichainstore.com';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-sm text-indigo-600 font-semibold hover:underline">
          ← Back to Marketplace
        </Link>
        <h1 className="text-4xl font-black text-gray-900 mt-4 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
        <div className="h-1 w-16 bg-indigo-600 rounded-full mt-4" />
      </div>

      <div className="space-y-8">

        <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-sm text-indigo-800 leading-relaxed">
            {COMPANY} operates {APP_NAME} and is committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and your rights
            regarding your personal data.
          </p>
        </section>

        <Section title="1. Information We Collect">
          <Subsection title="1.1 Blockchain Data (Public)">
            <p>
              When you use {APP_NAME}, your wallet address and all transactions are recorded
              on the Sui blockchain. This data is <strong>public by nature</strong> and cannot
              be deleted or hidden. This includes purchases, product listings, resale transactions,
              and reviews.
            </p>
          </Subsection>
          <Subsection title="1.2 Account Data (via zkLogin)">
            <p>
              If you sign in with Google or Facebook via Sui's zkLogin technology, we receive
              a cryptographic proof of your identity but <strong>do not receive or store</strong>
              your Google or Facebook email address, name, or profile information. The zkLogin
              process creates a wallet address deterministically from your social login —
              we only ever see the resulting wallet address.
            </p>
          </Subsection>
          <Subsection title="1.3 Profile Data (Voluntary)">
            <p>
              If you choose to create a seller profile, you may provide a display name, bio,
              avatar URL, Twitter handle, and website. This information is stored in our database
              and displayed publicly on your seller page.
            </p>
          </Subsection>
          <Subsection title="1.4 Support Communications">
            <p>
              When you contact us through the support form, we collect your name, email address,
              and the content of your message. This is used solely to respond to your inquiry.
            </p>
          </Subsection>
          <Subsection title="1.5 Usage Data">
            <p>
              We may collect standard server logs including IP addresses, browser type, and
              pages visited. This data is used for security monitoring and platform improvement
              only and is not sold or shared with third parties.
            </p>
          </Subsection>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Operate and improve the {APP_NAME} marketplace</li>
            <li>Process purchases and verify ownership of digital products</li>
            <li>Respond to support requests and disputes</li>
            <li>Detect and prevent fraud, abuse, and unauthorised access</li>
            <li>Comply with applicable legal obligations</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data, use it for targeted advertising,
            or share it with third parties except as described in this policy.
          </p>
        </Section>

        <Section title="3. Data Storage & Security">
          <p>
            Your profile and transaction data is stored on secure servers operated by
            Railway (database) and Vercel (frontend). File uploads are stored on IPFS
            via Pinata. We take reasonable technical and organisational measures to
            protect your data against unauthorised access.
          </p>
          <p>
            However, no system is perfectly secure. Blockchain transactions are publicly
            visible and permanent by design. We recommend not sharing your wallet
            address with untrusted parties.
          </p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>
            {APP_NAME} integrates with the following third-party services, each with their
            own privacy policies:
          </p>
          <ul>
            <li><strong>Google / Facebook</strong> — used for zkLogin authentication only</li>
            <li><strong>MoonPay / Ramp</strong> — used for fiat-to-crypto purchases (subject to their own KYC/AML policies)</li>
            <li><strong>Pinata / IPFS</strong> — used for decentralised file storage</li>
            <li><strong>Tawk.to</strong> — used for live customer support chat</li>
            <li><strong>Railway / Vercel</strong> — used for hosting and infrastructure</li>
          </ul>
          <p>
            We are not responsible for the privacy practices of these third-party services.
            We encourage you to review their privacy policies.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>
            {APP_NAME} uses minimal cookies required for the platform to function, including
            session management and authentication state. We do not use tracking or advertising
            cookies. You can disable cookies in your browser settings, though this may affect
            the functionality of the platform.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong>Correction</strong> — update or correct your profile information at any time through your profile settings</li>
            <li><strong>Deletion</strong> — request deletion of your profile data from our database (note: blockchain transactions cannot be deleted)</li>
            <li><strong>Portability</strong> — request your data in a portable format</li>
            <li><strong>Objection</strong> — object to processing of your personal data</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline font-semibold">{CONTACT}</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            {APP_NAME} is not intended for users under 18 years of age. We do not knowingly
            collect personal information from children. If you believe a child has provided
            us with personal information, please contact us immediately.
          </p>
        </Section>

        <Section title="8. International Transfers">
          <p>
            Your information may be processed in countries other than the one in which you
            reside. Our service providers (Railway, Vercel, Pinata) operate globally.
            By using {APP_NAME}, you consent to the transfer of your information to these
            countries, which may have different data protection laws than your country.
          </p>
        </Section>

        <Section title="9. Data Retention">
          <p>
            We retain your profile data for as long as your account is active or as needed
            to provide services. Support messages are retained for 12 months. Server logs
            are retained for 90 days. Blockchain data is permanent and beyond our control.
          </p>
          <p>
            If you request deletion of your account data, we will remove your profile
            information from our database within 30 days, subject to any legal obligations
            to retain certain records.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify users of
            significant changes by posting a notice on the platform. The date at the top
            of this policy indicates when it was last updated. Continued use of {APP_NAME}
            after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or
            your personal data, please contact us at:{' '}
            <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline font-semibold">{CONTACT}</a>
          </p>
          <p>
            You may also use the{' '}
            <Link href="/support" className="text-indigo-600 hover:underline">Support page</Link>
            {' '}to send us a message directly.
          </p>
        </Section>

      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-400">
        <Link href="/"      className="hover:text-indigo-600 transition-colors">← Marketplace</Link>
        <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
        <Link href="/support" className="hover:text-indigo-600 transition-colors">Support</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-600 rounded-full inline-block" />
        {title}
      </h2>
      <div className="text-gray-600 text-sm leading-relaxed space-y-3 pl-3">
        {children}
      </div>
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}
