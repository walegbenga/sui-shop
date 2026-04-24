import { useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: Date;
  }
}

export default function TawkChat() {
  const account    = useCurrentAccount();
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId   = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || 'default';

  useEffect(() => {
    if (!propertyId) return; // Don't load if keys not set

    window.Tawk_API  = window.Tawk_API  || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.async = true;
    s1.src   = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset    = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    document.head.appendChild(s1);

    return () => {
      // Clean up on unmount
      try { document.head.removeChild(s1); } catch {}
    };
  }, [propertyId]);

  // Set visitor info when user is logged in
  useEffect(() => {
    if (!account?.address || !window.Tawk_API) return;
    const short = `${account.address.slice(0,8)}...${account.address.slice(-6)}`;
    try {
      window.Tawk_API.setAttributes?.({
        name:  short,
        email: '',
        hash:  account.address,
      }, (err: any) => {});
    } catch {}
  }, [account?.address]);

  return null; // Widget renders itself via script
}