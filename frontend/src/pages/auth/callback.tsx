import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useEnoki } from '@/contexts/EnokiContext';

export default function AuthCallback() {
  const router = useRouter();
  const { enokiFlow } = useEnoki();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!enokiFlow) return;

        // Handle the OAuth callback
        const session = await enokiFlow.handleAuthCallback();
        
        if (session) {
          // Redirect to home page
          router.push('/');
        } else {
          throw new Error('No session created');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.push('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [enokiFlow, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}