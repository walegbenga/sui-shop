import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import { useState } from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';

export default function AuthButton() {
  const account = useCurrentAccount();
  const enokiFlow = useEnokiFlow();
  const zkLogin = useZkLogin();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        toast.error('Google OAuth not configured');
        setLoading(false);
        return;
      }

      const { url } = await enokiFlow.createAuthorizationURL({
        provider: 'google',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        redirectUrl: `${window.location.origin}/auth/callback`,
      });
      window.location.href = url;
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(`Login failed: ${error.message}`);
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const email = prompt('Enter your email address:');
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await enokiFlow.createAuthorizationURL({
        provider: 'email',
        email,
        redirectUrl: `${window.location.origin}/auth/callback`,
      });
      toast.success('Check your email for the login link!');
    } catch (error: any) {
      console.error('Email login error:', error);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await zkLogin.logout();
      toast.success('Logged out successfully');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(`Logout failed: ${error.message}`);
    }
  };

  // If already connected with wallet
  if (account && !zkLogin.address) {
    return <ConnectButton />;
  }

  // If logged in with zkLogin
  if (zkLogin.address) {
    return (
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            <span className="truncate max-w-[100px]">
              {zkLogin.address.slice(0, 6)}...{zkLogin.address.slice(-4)}
            </span>
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(zkLogin.address);
                      toast.success('Address copied!');
                    }}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Copy Address
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } block w-full px-4 py-2 text-left text-sm`}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    );
  }

  // Not logged in - show login options
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button 
          disabled={loading}
          className="inline-flex w-full justify-center items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              Sign In
              <ChevronDownIcon className="-mr-1 h-5 w-5" aria-hidden="true" />
            </>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {/* Google Login */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>
              )}
            </Menu.Item>

            {/* Email Login */}
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleEmailLogin}
                  disabled={loading}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex w-full items-center px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg className="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Sign in with Email
                </button>
              )}
            </Menu.Item>

            {/* Wallet Fallback */}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <div className="px-4 py-2 text-xs text-gray-500 font-medium">
                Or use wallet:
              </div>
              <Menu.Item>
                {({ active }) => (
                  <div className="px-2 pb-2">
                    <ConnectButton />
                  </div>
                )}
              </Menu.Item>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}