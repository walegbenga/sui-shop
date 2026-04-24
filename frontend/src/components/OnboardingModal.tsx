// Shows once after first login — walks user through their new wallet
import { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useRouter } from 'next/router';

const STORAGE_KEY = 'digi_onboarded';

export default function OnboardingModal() {
  const account = useCurrentAccount();
  const { suiFormatted, usdValue } = useWalletBalance();
  const router  = useRouter();
  const [show,  setShow]  = useState(false);
  const [step,  setStep]  = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!account) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setShow(true);
  }, [account]);

  if (!show || !account) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      icon: '🎉',
      title: 'Your wallet is ready!',
      body: (
        <div>
          <p className="text-gray-600 text-sm mb-4">
            Welcome to Digi ChainStore! A Sui blockchain wallet has been created for you automatically — no seed phrases, no complexity.
          </p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <p className="text-xs text-indigo-600 font-semibold mb-1">Your wallet address</p>
            <p className="text-xs font-mono text-indigo-800 break-all leading-relaxed">{account.address}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">${usdValue}</p>
              <p className="text-xs text-gray-500">USD Balance</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">{suiFormatted}</p>
              <p className="text-xs text-gray-500">SUI Balance</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: '💳',
      title: 'Add funds to get started',
      body: (
        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            To buy products you need SUI. You can add funds by:
          </p>
          {[
            { icon: '💳', title: 'Buy with card',       sub: 'Use MoonPay or Ramp to buy SUI with Visa/Mastercard' },
            { icon: '📋', title: 'Transfer from CEX',   sub: 'Send from Binance, Coinbase, or any exchange' },
            { icon: '🔗', title: 'Transfer from wallet', sub: 'Send from MetaMask, Phantom, or Sui Wallet' },
          ].map(m => (
            <div key={m.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xl shrink-0">{m.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                <p className="text-xs text-gray-500">{m.sub}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: '🛍️',
      title: "You're all set!",
      body: (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Here's what you can do on Digi ChainStore:
          </p>
          {[
            { icon: '🔍', label: 'Browse and buy digital products' },
            { icon: '📦', label: 'Sell your own digital products' },
            { icon: '🔑', label: 'Manage your software licenses' },
            { icon: '💰', label: 'Earn SUI and withdraw to your bank' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm text-gray-700 font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast  = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-4xl mb-3">{current.icon}</div>
            <h2 className="text-xl font-bold text-gray-900">{current.title}</h2>
          </div>
          {current.body}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          {isLast ? (
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => { dismiss(); router.push('/wallet/deposit'); }}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
              >
                Add Funds
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Later
              </button>
            </div>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
            >
              Next →
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 text-xl leading-none"
          style={{ position: 'absolute' }}
        >×</button>
      </div>
    </div>
  );
}
