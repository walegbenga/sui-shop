import { useEffect, useRef } from 'react';
import { useDisconnectWallet, useCurrentAccount } from '@mysten/dapp-kit';
import toast from 'react-hot-toast';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 30 minutes

export function useAutoLogout() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (account?.address) {
      timeoutRef.current = setTimeout(() => {
        console.log('Auto-logout: Inactivity timeout');
        disconnect(undefined, {
          onSuccess: () => {
            toast.error('Session expired due to inactivity. Please reconnect.');
          },
        });
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    if (!account?.address) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [account?.address]);

  // Check on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - save last activity time
        localStorage.setItem('lastActivity', lastActivityRef.current.toString());
      } else {
        // Page visible again - check if session expired
        const savedLastActivity = localStorage.getItem('lastActivity');
        if (savedLastActivity && account?.address) {
          const timeSinceLastActivity = Date.now() - parseInt(savedLastActivity);
          
          if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
            disconnect(undefined, {
              onSuccess: () => {
                toast.error('Session expired. Please reconnect.');
              },
            });
          } else {
            resetTimeout();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [account?.address]);

  return null;
}