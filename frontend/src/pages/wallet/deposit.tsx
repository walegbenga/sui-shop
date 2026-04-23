import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

function DepositPage() {
  const account = useCurrentAccount();
  const router  = useRouter();
  const { suiFormatted, usdValue, refresh } = useWalletBalance();
  const [copied, setCopied] = useState(false);
  const [activeMethod, setActiveMethod] = useState<'address' | 'moonpay' | 'ramp'>('address');

  if (!account) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Connect Wallet</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Please connect your wallet to add funds.</p>
        </div>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(account.address);
    setCopied(true);
    setTimeout(() => { setCopied(false); refresh(); }, 2000);
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 18 }}
        >←</button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Add Funds</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Add SUI to your wallet</p>
        </div>
      </div>

      {/* Current balance */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 24, color: '#fff',
      }}>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, fontWeight: 500 }}>Current Balance</p>
        <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>${usdValue}</p>
        <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>{suiFormatted} SUI</p>
      </div>

      {/* Method tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'address', label: '📋 Wallet Address', sub: 'Transfer from CEX/Wallet' },
          { id: 'moonpay', label: '💳 Buy with Card', sub: 'MoonPay' },
          { id: 'ramp',    label: '🏦 Bank / Card',   sub: 'Ramp Network' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMethod(m.id as any)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
              border: activeMethod === m.id ? '2px solid #4f46e5' : '2px solid #e5e7eb',
              background: activeMethod === m.id ? '#eef2ff' : '#fff',
              fontFamily: 'inherit', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: activeMethod === m.id ? '#4f46e5' : '#374151' }}>{m.label}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Method: Wallet Address ── */}
      {activeMethod === 'address' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Your Sui Address</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Send SUI from any wallet or exchange to this address. Only send SUI — other tokens may be lost.
          </p>

          {/* QR Code placeholder — generated from address */}
          <div style={{
            background: '#f9fafb', border: '2px dashed #d1d5db', borderRadius: 12,
            padding: 24, textAlign: 'center', marginBottom: 16,
          }}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${account.address}`}
              alt="Wallet QR Code"
              style={{ width: 180, height: 180, borderRadius: 8 }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Scan with any Sui wallet</p>
          </div>

          {/* Address box */}
          <div style={{
            background: '#f3f4f6', borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
          }}>
            <code style={{ fontSize: 12, color: '#374151', flex: 1, wordBreak: 'break-all', lineHeight: 1.6 }}>
              {account.address}
            </code>
          </div>

          <button
            onClick={copyAddress}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: 15,
              background: copied ? '#059669' : '#4f46e5',
              color: '#fff', fontFamily: 'inherit',
              transition: 'background .2s',
            }}
          >
            {copied ? '✓ Address Copied!' : '📋 Copy Address'}
          </button>

          <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fcd34d' }}>
            <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
              ⚠️ <strong>Important:</strong> Only send SUI (Sui Network) to this address. Sending other coins or using the wrong network will result in permanent loss.
            </p>
          </div>
        </div>
      )}

      {/* ── Method: MoonPay ── */}
      {activeMethod === 'moonpay' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Buy SUI with Card</h3>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Purchase SUI directly with your credit or debit card via MoonPay. Funds arrive in your wallet within minutes.
            </p>
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {[
              { label: 'Supported cards', value: 'Visa, Mastercard, Apple Pay' },
              { label: 'Processing time', value: '1-5 minutes' },
              { label: 'Fee', value: '~1-3% + network fee' },
              { label: 'Min purchase', value: '$20 USD' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <a
            href={`https://buy.moonpay.com?currencyCode=sui&walletAddress=${account.address}&colorCode=%234f46e5`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '14px', borderRadius: 12,
              background: '#4f46e5', color: '#fff', textAlign: 'center',
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Buy SUI on MoonPay →
          </a>
          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
            Opens MoonPay in a new tab. Your wallet address is pre-filled.
          </p>
        </div>
      )}

      {/* ── Method: Ramp ── */}
      {activeMethod === 'ramp' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Buy via Ramp Network</h3>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Buy SUI with bank transfer, debit card, or Apple/Google Pay via Ramp Network.
            </p>
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {[
              { label: 'Payment methods', value: 'Bank, Debit, Apple/Google Pay' },
              { label: 'Processing time', value: 'Instant to 24hrs' },
              { label: 'Fee', value: '~0.9-2.9%' },
              { label: 'Min purchase', value: '$5 USD' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <a
            href={`https://app.ramp.network/?userAddress=${account.address}&swapAsset=SUI_SUI&hostAppName=DigiChainStore&hostLogoUrl=https://digi-chainstore.vercel.app/logo.svg`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '14px', borderRadius: 12,
              background: '#059669', color: '#fff', textAlign: 'center',
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Buy SUI on Ramp →
          </a>
          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
            Opens Ramp Network in a new tab. Your wallet address is pre-filled.
          </p>
        </div>
      )}

    </div>
  );
}

export default dynamic(() => Promise.resolve(DepositPage), { ssr: false });
