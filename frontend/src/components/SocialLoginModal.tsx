/**
 * Social Login Modal Component
 * Allows users to create wallet with Google/Email instead of extension
 */

import { useState } from 'react';
import { socialWalletService } from '@/services/socialWalletService';

interface SocialLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (address: string, email: string) => void;
}

export default function SocialLoginModal({ isOpen, onClose, onSuccess }: SocialLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'social' | 'email'>('social');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const { address, email } = await socialWalletService.signInWithGoogle();
      onSuccess(address, email);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await socialWalletService.sendMagicLink(email);
      
      if (result.success) {
        setEmailSent(true);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Easy Sign-Up</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-slate-400 mt-2">
            No extensions needed. Create your wallet in seconds.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('social')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'social'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Social Login
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              activeTab === 'email'
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Email Link
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              {/* Google Sign-In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  What happens next?
                </h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Sign in with your Google account</li>
                  <li>• We'll create a Sui wallet for you</li>
                  <li>• Your account becomes your backup</li>
                  <li>• No seed phrases to remember!</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              {!emailSent ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleEmailSignIn}
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </button>

                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      How it works
                    </h4>
                    <ul className="text-sm text-slate-300 space-y-1">
                      <li>• Enter your email address</li>
                      <li>• We'll send you a secure link</li>
                      <li>• Click the link to create your wallet</li>
                      <li>• Your email becomes your recovery method</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📬</div>
                  <h3 className="text-xl font-bold text-white mb-2">Check Your Email!</h3>
                  <p className="text-slate-400 mb-1">
                    We sent a magic link to:
                  </p>
                  <p className="text-purple-400 font-medium mb-4">{email}</p>
                  <p className="text-sm text-slate-500 mb-6">
                    The link expires in 15 minutes
                  </p>
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                  >
                    Didn't receive it? Send again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50">
          <p className="text-xs text-slate-400 text-center">
            🔒 Your private keys are encrypted and stored securely
          </p>
        </div>
      </div>
    </div>
  );
}
