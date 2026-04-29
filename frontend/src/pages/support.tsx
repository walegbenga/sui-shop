import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/router';
import { API_URL } from '@/lib/api';
import toast from 'react-hot-toast';

const FAQS = [
  {
    cat: '🛒 Buying',
    items: [
      { q: 'How do I buy a product?', a: 'Sign in with Google or your Sui wallet, add funds to your wallet, then click "Buy" on any product. The file is delivered instantly to your purchases page.' },
      { q: 'How do I add funds to my wallet?', a: 'Go to Wallet → Add Funds. You can buy SUI with a credit/debit card via MoonPay or Ramp, or transfer from any exchange like Binance or Coinbase.' },
      { q: 'Where do I find my purchased files?', a: 'Go to Profile → Purchases tab. Click "Download" on any purchase to access your file.' },
      { q: 'What if a file doesn\'t work?', a: 'Contact the seller first. If unresolved within 48 hours, use the Dispute tab to raise a formal complaint and our team will review it.' },
      { q: 'Can I get a refund?', a: 'Because digital files are delivered instantly on the blockchain, refunds are not automatic. If the file is defective or not as described, raise a dispute and we will review it within 48 hours.' },
    ],
  },
  {
    cat: '💰 Selling',
    items: [
      { q: 'How do I list a product?', a: 'Click "List a Product" from the menu. Upload your file, add a title, description, price in SUI, and your product goes live immediately.' },
      { q: 'What are the fees?', a: 'We take a 2% platform fee on every sale. No listing fees, no monthly charges, no hidden costs.' },
      { q: 'When do I get paid?', a: 'Payment lands in your wallet the moment a sale completes — no delay. You can withdraw to your bank or exchange any time.' },
      { q: 'What file types can I sell?', a: 'PDF, ZIP, RAR, images (JPG/PNG/GIF), video (MP4/AVI/MOV/MKV), audio (MP3/WAV/FLAC), and code files. Max 100MB, 500MB for video.' },
      { q: 'Can buyers resell my products?', a: 'Only if you enable the "Resellable" option when listing. You earn a royalty on every resale automatically.' },
    ],
  },
  {
    cat: '👛 Wallet & Payments',
    items: [
      { q: 'What is a zkLogin wallet?', a: 'When you sign in with Google, Sui\'s zkLogin technology creates a real blockchain wallet tied to your Google account. No seed phrases — you sign in the same way every time.' },
      { q: 'How do I withdraw my earnings?', a: 'Go to Wallet → Withdraw. You can send SUI to any wallet address or cash out to your bank via MoonPay.' },
      { q: 'Is my wallet safe?', a: 'Your zkLogin wallet is secured by your Google account. No one — including us — can access it without your Google login.' },
      { q: 'What is SUI?', a: 'SUI is the native currency of the Sui blockchain. Your balance always shows both the SUI amount and the current USD equivalent.' },
    ],
  },
];

export default function SupportPage() {
  const account = useCurrentAccount();
  const router  = useRouter();

  const [openFaq,  setOpenFaq]  = useState<string | null>(null);
  const [tab,      setTab]      = useState<'faq' | 'contact' | 'dispute'>('faq');

  // Contact form
  const [cName,    setCName]    = useState('');
  const [cEmail,   setCEmail]   = useState('');
  const [cSubject, setCSubject] = useState('');
  const [cMsg,     setCMsg]     = useState('');
  const [cSending, setCSending] = useState(false);

  // Dispute form — pre-filled from URL params
  const [dTxDigest, setDTxDigest] = useState('');
  const [dReason,   setDReason]   = useState('');
  const [dDesc,     setDDesc]     = useState('');
  const [dSending,  setDSending]  = useState(false);

  // Pre-fill dispute from URL: /support?tab=dispute&tx=0x...
  useEffect(() => {
    if (!router.isReady) return;
    const { tab: urlTab, tx } = router.query;
    if (urlTab === 'dispute') {
      setTab('dispute');
      if (tx && typeof tx === 'string') setDTxDigest(tx);
    }
  }, [router.isReady, router.query]);

  const sendContact = async () => {
    if (!cEmail || !cMsg) return toast.error('Please fill in email and message');
    setCSending(true);
    try {
      const res = await fetch(`${API_URL}/api/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cName, email: cEmail, subject: cSubject,
          message: cMsg, wallet: account?.address || 'not connected',
        }),
      });
      if (res.ok) {
        toast.success('Message sent! We\'ll respond within 24 hours.');
        setCName(''); setCEmail(''); setCSubject(''); setCMsg('');
      } else toast.error('Failed to send. Please try again.');
    } catch { toast.error('Failed to send. Please try again.'); }
    setCSending(false);
  };

  const submitDispute = async () => {
    if (!dTxDigest || !dReason || !dDesc) return toast.error('Please fill in all fields');
    if (!account?.address) return toast.error('Please connect your wallet');
    setDSending(true);
    try {
      const res = await fetch(`${API_URL}/api/support/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tx_digest: dTxDigest, reason: dReason,
          description: dDesc, wallet: account.address,
        }),
      });
      if (res.ok) {
        toast.success('Dispute submitted! We\'ll review within 48 hours.');
        setDTxDigest(''); setDReason(''); setDDesc('');
      } else toast.error('Failed to submit. Please try again.');
    } catch { toast.error('Failed to submit. Please try again.'); }
    setDSending(false);
  };

  const input = "w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-500 text-sm">Find answers or contact our team</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-8 bg-gray-100 rounded-2xl p-1.5">
        {[
          { id: 'faq',     label: '❓ FAQ' },
          { id: 'contact', label: '✉️ Contact Us' },
          { id: 'dispute', label: '⚖️ Raise Dispute' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer border-none ${
              tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 bg-transparent'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── FAQ ── */}
      {tab === 'faq' && (
        <div className="space-y-6">
          {FAQS.map(section => (
            <div key={section.cat}>
              <h2 className="text-base font-bold text-gray-900 mb-3">{section.cat}</h2>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === item.q ? null : item.q)}
                      className="w-full text-left px-5 py-4 flex justify-between items-center cursor-pointer bg-transparent border-none">
                      <span className="text-sm font-semibold text-gray-900 pr-4">{item.q}</span>
                      <span className={`text-gray-400 text-xl shrink-0 transition-transform ${openFaq === item.q ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    {openFaq === item.q && (
                      <div className="px-5 pb-4 border-t border-gray-50">
                        <p className="text-sm text-gray-500 leading-relaxed pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 text-center">
            <p className="text-sm text-gray-700 font-medium mb-3">Can't find your answer?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setTab('contact')}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 border-none cursor-pointer transition-colors">
                Contact Us
              </button>
              <button onClick={() => (window as any).Tawk_API?.maximize?.()}
                className="px-5 py-2.5 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 cursor-pointer transition-colors">
                Live Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact ── */}
      {tab === 'contact' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Send us a message</h2>
          <p className="text-sm text-gray-400 mb-5">We typically respond within 24 hours.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Name</label>
                <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Your name" className={input} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Email <span className="text-red-400">*</span></label>
                <input type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="you@example.com" className={input} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Subject</label>
              <input value={cSubject} onChange={e => setCSubject(e.target.value)} placeholder="What's this about?" className={input} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Message <span className="text-red-400">*</span></label>
              <textarea value={cMsg} onChange={e => setCMsg(e.target.value)}
                placeholder="Describe your issue in detail..." rows={5}
                className={`${input} resize-none`} />
            </div>
            {account && (
              <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-xs text-gray-400">
                Wallet: <code className="text-gray-600">{account.address.slice(0,16)}…</code>
              </div>
            )}
            <button onClick={sendContact} disabled={cSending || !cEmail || !cMsg}
              className={`w-full py-3 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-colors ${
                !cEmail || !cMsg || cSending ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}>
              {cSending ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </div>
      )}

      {/* ── Dispute ── */}
      {tab === 'dispute' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Raise a Dispute</h2>
          <p className="text-sm text-gray-400 mb-5">Disputes are reviewed within 48 hours.</p>

          {!account ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-sm text-gray-500">Please connect your wallet to raise a dispute.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Transaction ID <span className="text-red-400">*</span>
                </label>
                <input value={dTxDigest} onChange={e => setDTxDigest(e.target.value)}
                  placeholder="Paste the tx digest from your purchase..."
                  className={`${input} font-mono text-xs`} />
                <p className="text-xs text-gray-400 mt-1">
                  Find this in Profile → Purchases → click "Explorer" on any purchase
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Reason <span className="text-red-400">*</span>
                </label>
                <select value={dReason} onChange={e => setDReason(e.target.value)} className={input}>
                  <option value="">Select a reason...</option>
                  <option value="file_not_delivered">File was not delivered</option>
                  <option value="file_corrupted">File is corrupted or broken</option>
                  <option value="not_as_described">Product is not as described</option>
                  <option value="wrong_file">Wrong file delivered</option>
                  <option value="seller_unresponsive">Seller is unresponsive</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea value={dDesc} onChange={e => setDDesc(e.target.value)}
                  placeholder="Describe what happened in detail..."
                  rows={5} className={`${input} resize-none`} />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  ⚠️ Please try to resolve the issue with the seller first.
                  If they don't respond within 48 hours, we will step in.
                </p>
              </div>

              <button onClick={submitDispute} disabled={dSending || !dTxDigest || !dReason || !dDesc}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-colors ${
                  !dTxDigest || !dReason || !dDesc || dSending
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-400'
                }`}>
                {dSending ? 'Submitting…' : 'Submit Dispute'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
