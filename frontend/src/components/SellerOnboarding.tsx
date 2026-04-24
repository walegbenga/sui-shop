import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/router';
import { API_URL } from '@/lib/api';

const STORAGE_KEY = 'digi_seller_onboarded';

export default function SellerOnboarding() {
  const account = useCurrentAccount();
  const router  = useRouter();
  const [show,    setShow]    = useState(false);
  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [name,    setName]    = useState('');
  const [bio,     setBio]     = useState('');

  useEffect(() => {
    if (!account) return;
    // Only show on list-product page if not already onboarded as seller
    if (router.pathname !== '/list-product') return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, [account, router.pathname]);

  if (!show || !account) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const saveProfile = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/sellers/${account.address}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim(), bio: bio.trim() }),
      });
    } catch {}
    setSaving(false);
    setStep(2);
  };

  const steps = [
    {
      icon: '🎉',
      title: "Let's set up your seller profile",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            You're about to list your first product. First, let's set up your public seller profile so buyers know who they're buying from.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Display Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. John's Digital Store"
              maxLength={50}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Short Bio <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell buyers a little about yourself and what you sell..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
            <p className="text-xs text-gray-300 text-right mt-1">{bio.length}/200</p>
          </div>
        </div>
      ),
      action: saveProfile,
      actionLabel: saving ? 'Saving…' : 'Save & Continue →',
      actionDisabled: !name.trim() || saving,
    },
    {
      icon: '📤',
      title: 'What can you sell?',
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-2">
            Digi ChainStore supports any digital file up to 100MB (500MB for videos):
          </p>
          {[
            { icon: '📚', cat: 'Ebooks',   desc: 'PDFs, EPUBs, guides, tutorials, courses' },
            { icon: '🎬', cat: 'Videos',   desc: 'MP4, AVI, MOV — courses, tutorials, clips' },
            { icon: '🔌', cat: 'Plugins',  desc: 'Software, scripts, code, templates' },
            { icon: '🎨', cat: 'Stickers', desc: 'PNG, SVG, GIF — digital art packs' },
            { icon: '🎵', cat: 'Music',    desc: 'MP3, WAV, FLAC — beats, samples, tracks' },
          ].map(c => (
            <div key={c.cat} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl shrink-0">{c.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.cat}</p>
                <p className="text-xs text-gray-400">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      action: () => setStep(2),
      actionLabel: 'Got it →',
      actionDisabled: false,
    },
    {
      icon: '💰',
      title: 'How you get paid',
      content: (
        <div className="space-y-4">
          {[
            { icon: '⚡', t: 'Instant payments', d: 'SUI lands in your wallet the moment a sale completes — no waiting, no middleman.' },
            { icon: '💸', t: 'Low fees',         d: 'We take 2% per sale. That\'s it. No listing fees, no monthly charges.' },
            { icon: '🏦', t: 'Easy withdrawal',  d: 'Withdraw to your bank via MoonPay, or send to any exchange like Binance.' },
            { icon: '🔁', t: 'Resale royalties', d: 'Enable reselling on your products to earn on every secondary sale automatically.' },
          ].map(f => (
            <div key={f.t} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center shrink-0">{f.icon}</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.t}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      action: dismiss,
      actionLabel: "Let's list my product! 🚀",
      actionDisabled: false,
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Progress */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">{current.icon}</div>
            <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
            <p className="text-xs text-gray-400 mt-1">Step {step + 1} of {steps.length}</p>
          </div>
          {current.content}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && step < steps.length - 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white cursor-pointer">
              Back
            </button>
          )}
          <button
            onClick={current.action}
            disabled={current.actionDisabled}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-colors border-none cursor-pointer ${
              current.actionDisabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}>
            {current.actionLabel}
          </button>
        </div>

        <button onClick={dismiss}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 text-2xl font-light leading-none bg-transparent border-none cursor-pointer"
          style={{ position: 'absolute' }}>
          ×
        </button>
      </div>
    </div>
  );
}