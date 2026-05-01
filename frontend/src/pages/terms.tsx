import Link from 'next/link';

const LAST_UPDATED = 'April 30, 2026';
const COMPANY      = 'CoA Tech';
const APP_NAME     = 'Digi ChainStore';
const CONTACT      = 'support@digichainstore.com';
const WEBSITE      = 'https://digi-chainstore.vercel.app';

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-sm text-indigo-600 font-semibold hover:underline">
          ← Back to Marketplace
        </Link>
        <h1 className="text-4xl font-black text-gray-900 mt-4 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm">Last updated: {LAST_UPDATED}</p>
        <div className="h-1 w-16 bg-indigo-600 rounded-full mt-4" />
      </div>

      <div className="prose prose-gray max-w-none space-y-8">

        {/* Intro */}
        <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-sm text-indigo-800 leading-relaxed">
            Welcome to {APP_NAME}. By accessing or using our platform, you agree to be bound by
            these Terms of Service. Please read them carefully before using our services.
            If you do not agree, do not use {APP_NAME}.
          </p>
        </section>

        <Section title="1. About Us">
          <p>
            {APP_NAME} is a decentralised digital marketplace built on the Sui blockchain,
            operated by <strong>{COMPANY}</strong>. We provide a platform that enables buyers
            and sellers to transact in digital goods using SUI cryptocurrency.
          </p>
          <p>
            Our platform uses Sui's zkLogin technology, which allows users to sign in with
            their existing Google or Facebook accounts and have a non-custodial blockchain
            wallet generated on their behalf.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least <strong>18 years old</strong> to use {APP_NAME}. By using our platform you represent and warrant that:</p>
          <ul>
            <li>You are at least 18 years of age</li>
            <li>You have the legal capacity to enter into binding contracts</li>
            <li>You are not located in a country subject to applicable trade sanctions</li>
            <li>You have not been previously banned from our platform</li>
          </ul>
        </Section>

        <Section title="3. User Accounts">
          <p>
            When you sign in via Google or Facebook, a Sui blockchain wallet is created and
            linked to your social identity. You are responsible for maintaining the security
            of your login credentials. We are not liable for any loss resulting from
            unauthorised access to your account.
          </p>
          <p>
            If you connect an external Sui wallet (such as Sui Wallet or Phantom), you are
            solely responsible for the security of that wallet and its seed phrase.
          </p>
        </Section>

        <Section title="4. Buying & Selling">
          <Subsection title="4.1 For Buyers">
            <p>When you purchase a product on {APP_NAME}:</p>
            <ul>
              <li>Payment is made in SUI directly on the Sui blockchain</li>
              <li>The transaction is final and recorded on-chain once confirmed</li>
              <li>You receive access to the digital file associated with the product</li>
              <li>You may not share, redistribute, or resell the file unless the product is explicitly marked as resellable</li>
            </ul>
          </Subsection>
          <Subsection title="4.2 For Sellers">
            <p>When you list a product on {APP_NAME}:</p>
            <ul>
              <li>You represent that you own or have the right to sell the digital content</li>
              <li>You agree to our <strong>2% platform fee</strong> on each sale</li>
              <li>You are responsible for the accuracy of your product descriptions</li>
              <li>You may not list counterfeit, illegal, or infringing content</li>
              <li>Proceeds are sent directly to your wallet upon purchase completion</li>
            </ul>
          </Subsection>
        </Section>

        <Section title="5. Platform Fees">
          <p>
            {APP_NAME} charges a <strong>2% platform fee</strong> on every completed transaction.
            This fee is deducted automatically by the smart contract at the time of purchase.
            There are no listing fees, monthly charges, or hidden costs.
          </p>
          <p>
            For resale transactions, the original creator may receive a royalty as specified
            in the product listing. This royalty is enforced by the smart contract.
          </p>
        </Section>

        <Section title="6. Prohibited Content">
          <p>You may <strong>not</strong> list or sell any of the following:</p>
          <ul>
            <li>Illegal content of any kind</li>
            <li>Content that infringes on intellectual property rights</li>
            <li>Malware, viruses, or harmful software</li>
            <li>Content that promotes violence, discrimination, or hatred</li>
            <li>Adult or sexually explicit content</li>
            <li>Counterfeit goods or misrepresented products</li>
            <li>Content that violates any applicable law or regulation</li>
          </ul>
          <p>
            We reserve the right to remove any product and ban any user that violates
            these prohibitions without notice and without refund.
          </p>
        </Section>

        <Section title="7. Refunds & Disputes">
          <p>
            Because digital files are delivered instantly on the blockchain, all sales
            are generally <strong>final</strong>. However, we have a dispute resolution
            process for the following situations:
          </p>
          <ul>
            <li>The file was not delivered after payment</li>
            <li>The file is corrupted or completely different from what was described</li>
            <li>The seller has fraudulently misrepresented the product</li>
          </ul>
          <p>
            To raise a dispute, go to <Link href="/support" className="text-indigo-600 hover:underline">Help & Support</Link> within{' '}
            <strong>14 days</strong> of purchase. We will review each case individually.
            Our decisions on disputes are final.
          </p>
          <p>
            We are not responsible for disputes arising from buyer dissatisfaction
            where the product was accurately described.
          </p>
        </Section>

        <Section title="8. Blockchain Transactions">
          <p>
            All transactions on {APP_NAME} are processed on the Sui blockchain.
            You acknowledge that:
          </p>
          <ul>
            <li>Blockchain transactions are <strong>irreversible</strong> once confirmed</li>
            <li>You are responsible for ensuring the correct amount and recipient</li>
            <li>Network congestion or outages are outside our control</li>
            <li>SUI cryptocurrency values are volatile and we make no guarantees about value</li>
            <li>You are responsible for any applicable taxes on your transactions</li>
          </ul>
        </Section>

        <Section title="9. Intellectual Property">
          <p>
            Sellers retain all intellectual property rights in their uploaded content.
            By listing a product, sellers grant {APP_NAME} a limited, non-exclusive licence
            to display the product title, description, and preview image for the purpose
            of operating the marketplace.
          </p>
          <p>
            The {APP_NAME} platform, including its code, design, and branding, is owned by
            {COMPANY} and protected by intellectual property law. You may not copy,
            modify, or distribute any part of the platform without our written permission.
          </p>
        </Section>

        <Section title="10. Disclaimer of Warranties">
          <p>
            {APP_NAME} is provided <strong>"as is"</strong> without warranties of any kind,
            either express or implied. We do not warrant that:
          </p>
          <ul>
            <li>The platform will be uninterrupted or error-free</li>
            <li>Products sold by third parties will meet your expectations</li>
            <li>The platform is free from viruses or other harmful code</li>
          </ul>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {COMPANY} shall not be liable for
            any indirect, incidental, special, or consequential damages arising from
            your use of {APP_NAME}, including but not limited to loss of profits, data,
            or cryptocurrency.
          </p>
          <p>
            Our total liability to you for any claim shall not exceed the amount of
            platform fees you paid to us in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="12. Governing Law">
          <p>
            These Terms are governed by applicable law. Any disputes shall be resolved
            through good-faith negotiation first. If unresolved, disputes shall be
            submitted to binding arbitration.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>
            We may update these Terms from time to time. We will notify users of
            significant changes by posting a notice on the platform. Continued use
            of {APP_NAME} after changes constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="14. Contact Us">
          <p>
            If you have questions about these Terms, please contact us at:{' '}
            <a href={`mailto:${CONTACT}`} className="text-indigo-600 hover:underline font-semibold">{CONTACT}</a>
          </p>
        </Section>

      </div>

      {/* Footer nav */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-400">
        <Link href="/"        className="hover:text-indigo-600 transition-colors">← Marketplace</Link>
        <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy →</Link>
        <Link href="/support" className="hover:text-indigo-600 transition-colors">Support</Link>
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
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
