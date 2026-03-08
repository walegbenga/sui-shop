import React, { useState, useEffect } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import MarketplacePage from '../components/MarketplacePage';
import SocialLoginModal from '../components/SocialLoginModal';
import { socialWalletService } from '@/services/socialWalletService';
import { Wallet, Shield, Zap, Users } from 'lucide-react';

export default function Home() {
  const account = useCurrentAccount();
  const [socialAddress, setSocialAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for social wallet on mount
    checkSocialWallet();
  }, []);

  const checkSocialWallet = async () => {
    try {
      const hasSocial = await socialWalletService.hasSocialWallet();
      if (hasSocial) {
        const address = await socialWalletService.getCurrentAddress();
        setSocialAddress(address);
      }
    } catch (error) {
      console.error('Error checking social wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show marketplace if either extension wallet or social wallet is connected
  if (account || socialAddress) {
    return <MarketplacePage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return <LandingPage onSocialLogin={setSocialAddress} />;
}

function LandingPage({ onSocialLogin }: { onSocialLogin: (address: string) => void }) {
  const [showSocialLogin, setShowSocialLogin] = useState(false);

  const handleSocialSuccess = (address: string, email: string) => {
    setShowSocialLogin(false);
    onSocialLogin(address);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Wallet className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Sui Shop
          </h1>
          
          <p className="text-2xl text-slate-400 mb-8 font-light">
            The Next Generation Social Commerce Platform
          </p>
          
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Buy and sell digital assets with complete security on Sui blockchain. 
            No intermediaries, instant settlements, and full ownership of your transactions.
          </p>

          {/* Wallet Connection Options */}
          <div className="max-w-md mx-auto space-y-4">
            {/* Social Login (Recommended) */}
            <div>
              <p className="text-sm text-slate-400 mb-3">Easy Sign-Up (Recommended)</p>
              <button
                onClick={() => setShowSocialLogin(true)}
                className="w-full px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold text-lg transition-all shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Sign Up with Email or Google
              </button>
              <p className="text-xs text-slate-500 mt-2">No extensions needed • Takes 30 seconds</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="text-slate-500 text-sm">or</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            {/* Traditional Wallet Connection */}
            <div>
              <p className="text-sm text-slate-400 mb-3">Already have a wallet?</p>
              <ConnectButton className="!w-full !px-8 !py-4 !bg-slate-800 hover:!bg-slate-700 !text-white !rounded-xl !font-semibold !text-lg !transition-all !border !border-slate-700" />
              <p className="text-xs text-slate-500 mt-2">Connect Sui Wallet extension</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Secure Transactions"
            description="Military-grade security with Sui's Move VM. Your assets are protected by formal verification."
            gradient="from-emerald-500 to-teal-500"
          />
          
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Instant Settlement"
            description="Sub-second finality means your purchases complete instantly with minimal fees."
            gradient="from-violet-500 to-purple-500"
          />
          
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Social Commerce"
            description="Follow sellers, read verified reviews, and build your reputation on-chain."
            gradient="from-fuchsia-500 to-pink-500"
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm mb-4">Powered by</p>
          <div className="flex justify-center items-center">
            <div className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              CoA Tech
            </div>
          </div>
        </div>
      </div>

      {/* Social Login Modal */}
      <SocialLoginModal
        isOpen={showSocialLogin}
        onClose={() => setShowSocialLogin(false)}
        onSuccess={handleSocialSuccess}
      />
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient }: any) {
  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
