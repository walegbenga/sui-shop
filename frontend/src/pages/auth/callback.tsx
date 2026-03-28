import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';

export default function AuthCallback() {
  const router = useRouter();
  const enokiFlow = useEnokiFlow();
  const zkLogin = useZkLogin();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const jwt = params.get('id_token');

      if (!jwt) {
        throw new Error('No JWT token found in callback');
      }

      await zkLogin.login(jwt);
      router.push('/');
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Failed</h3>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-500"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}