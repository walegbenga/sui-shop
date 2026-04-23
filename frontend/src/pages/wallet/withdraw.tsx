import { useState } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { Transaction } from '@mysten/sui/transactions';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';

function WithdrawPage() {
  const account   = useCurrentAccount();
  const suiClient = useSuiClient();
  const router    = useRouter();
  const { suiFormatted, usdValue, suiBalance, usdPrice, refresh } = useWalletBalance();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [activeMethod, setActiveMethod] = useState<'wallet' | 'address' | 'moonpay'>('wallet');
  const [toAddress,   setToAddress]     = useState('');
  const [amount,      setAmount]        = useState('');
  const [sending,     setSending]       = useState(false);

  if (!account) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Connect Wallet</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Please connect your wallet to withdraw.</p>
        </div>
      </div>
    );
  }

  const suiAmount   = suiBalance / 1_000_000_000;
  const amountNum   = parseFloat(amount) || 0;
  const amountMist  = Math.floor(amountNum * 1_000_000_000);
  const usdEquiv    = (amountNum * usdPrice).toFixed(2);
  const isValidAddr = toAddress.startsWith('0x') && toAddress.length >= 42;
  const canSend     = isValidAddr && amountNum > 0 && amountNum <= suiAmount;

  const sendToAddress = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [amountMist]);
      tx.transferObjects([coin], toAddress);

      signAndExecute({ transaction: tx }, {
        onSuccess: (result) => {
          toast.success(`Sent ${amountNum} SUI successfully!`);
          setAmount('');
          setToAddress('');
          setTimeout(() => refresh(), 3000);
          setSending(false);
        },
        onError: (error: any) => {
          toast.error(`Failed: ${error.message}`);
          setSending(false);
        },
      });
    } catch (err: any) {
      toast.error(err.message);
      setSending(false);
    }
  };

  const setMaxAmount = () => {
    // Leave 0.01 SUI for gas
    const max = Math.max(0, suiAmount - 0.01);
    setAmount(max.toFixed(4));
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>Withdraw</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Send SUI or cash out</p>
        </div>
      </div>

      {/* Balance */}
      <div style={{
        background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        borderRadius: 16, padding: '20px 24px', marginBottom: 24, color: '#fff',
      }}>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 4, fontWeight: 500 }}>Available to Withdraw</p>
        <p style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>${usdValue}</p>
        <p style={{ fontSize: 14, opacity: 0.8, margin: 0 }}>{suiFormatted} SUI</p>
      </div>

      {/* Method tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'wallet',  label: '🔗 To My Wallet',  sub: 'Connected wallet' },
          { id: 'address', label: '📋 To Address',     sub: 'Any Sui address' },
          { id: 'moonpay', label: '💵 Cash Out',       sub: 'MoonPay sell' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setActiveMethod(m.id as any)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
              border: activeMethod === m.id ? '2px solid #059669' : '2px solid #e5e7eb',
              background: activeMethod === m.id ? '#ecfdf5' : '#fff',
              fontFamily: 'inherit', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: activeMethod === m.id ? '#059669' : '#374151' }}>{m.label}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{m.sub}</div>
          </button>
        ))}
      </div>

      {/* ── Send to connected wallet ── */}
      {activeMethod === 'wallet' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Send to Connected Wallet</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Your connected wallet address is pre-filled as the destination.
          </p>

          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 16px', marginBottom: 16, border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 4px' }}>Sending to</p>
            <code style={{ fontSize: 11, color: '#374151', wordBreak: 'break-all' }}>{account.address}</code>
          </div>

          <AmountInput
            amount={amount} setAmount={setAmount}
            usdEquiv={usdEquiv} suiAmount={suiAmount}
            onMax={setMaxAmount}
          />

          <button
            disabled={amountNum <= 0 || amountNum > suiAmount || sending}
            onClick={() => { setToAddress(account.address); sendToAddress(); }}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              cursor: amountNum > 0 && !sending ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
              background: amountNum > 0 && !sending ? '#059669' : '#d1d5db',
              color: '#fff', transition: 'background .2s',
            }}
          >
            {sending ? 'Sending…' : 'Send to My Wallet'}
          </button>
        </div>
      )}

      {/* ── Send to any address ── */}
      {activeMethod === 'address' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Send to Address</h3>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
            Send SUI to any Sui wallet address or exchange deposit address.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Recipient Address
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={e => setToAddress(e.target.value)}
              placeholder="0x..."
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 10,
                border: toAddress && !isValidAddr ? '2px solid #ef4444' : '1px solid #d1d5db',
                fontSize: 13, color: '#111827', background: '#fff',
                fontFamily: 'monospace', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {toAddress && !isValidAddr && (
              <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Invalid Sui address</p>
            )}
          </div>

          <AmountInput
            amount={amount} setAmount={setAmount}
            usdEquiv={usdEquiv} suiAmount={suiAmount}
            onMax={setMaxAmount}
          />

          <button
            disabled={!canSend || sending}
            onClick={sendToAddress}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              cursor: canSend && !sending ? 'pointer' : 'not-allowed',
              fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
              background: canSend && !sending ? '#4f46e5' : '#d1d5db',
              color: '#fff', transition: 'background .2s',
            }}
          >
            {sending ? 'Sending…' : `Send ${amountNum > 0 ? amountNum + ' SUI' : 'SUI'}`}
          </button>

          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca' }}>
            <p style={{ fontSize: 12, color: '#991b1b', margin: 0 }}>
              ⚠️ Double-check the address. Blockchain transactions are irreversible.
            </p>
          </div>
        </div>
      )}

      {/* ── Cash out via MoonPay ── */}
      {activeMethod === 'moonpay' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💵</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Sell SUI for Cash</h3>
            <p style={{ fontSize: 14, color: '#6b7280' }}>
              Sell your SUI and receive USD/EUR directly to your bank account via MoonPay.
            </p>
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            {[
              { label: 'Payout methods', value: 'Bank transfer, debit card' },
              { label: 'Processing time', value: '1-5 business days' },
              { label: 'Fee', value: '~1-3%' },
              { label: 'Your balance', value: `${suiFormatted} SUI (~$${usdValue})` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.value}</span>
              </div>
            ))}
          </div>

          <a
            href={`https://sell.moonpay.com?baseCurrencyCode=sui&baseCurrencyAmount=${suiFormatted}&walletAddress=${account.address}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: '14px', borderRadius: 12,
              background: '#4f46e5', color: '#fff', textAlign: 'center',
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            Sell SUI on MoonPay →
          </a>
          <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
            Opens MoonPay in a new tab. Follow their verification process.
          </p>
        </div>
      )}
    </div>
  );
}

function AmountInput({ amount, setAmount, usdEquiv, suiAmount, onMax }: {
  amount: string; setAmount: (v: string) => void;
  usdEquiv: string; suiAmount: number; onMax: () => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Amount (SUI)</label>
        <button
          onClick={onMax}
          style={{ fontSize: 12, color: '#4f46e5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Max ({suiAmount.toFixed(4)} SUI)
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          style={{
            width: '100%', padding: '12px 80px 12px 16px', borderRadius: 10,
            border: '1px solid #d1d5db', fontSize: 18, fontWeight: 700,
            color: '#111827', background: '#fff', boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <span style={{
          position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, fontWeight: 600, color: '#6b7280',
        }}>SUI</span>
      </div>
      {parseFloat(amount) > 0 && (
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>≈ ${usdEquiv} USD</p>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(WithdrawPage), { ssr: false });
