import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

function AuthCallbackComponent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady]);

  const handleCallback = async () => {
    try {
      // Just redirect — Enoki handles auth internally
      router.replace('/');
    } catch (err: any) {
      console.error('Auth callback error:', err);
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Authentication Failed
          </h3>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-indigo-500"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}

// 🔥 THIS is the important part
export default dynamic(() => Promise.resolve(AuthCallbackComponent), {
  ssr: false,
});