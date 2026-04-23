import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import AuthButton from './AuthButton';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';


interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const account = useCurrentAccount();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, removeFromCart, clearCart, checkout } = useCart();
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price), 0);

  useAutoLogout();

  const navLinks = [
    { href: '/',             label: 'Market',       requireAuth: false },
    { href: '/my-products',  label: 'My Products',  requireAuth: true },
    { href: '/analytics',    label: 'Analytics',    requireAuth: true },
    { href: '/favorites',    label: 'Favorites',    requireAuth: true },
    { href: '/followers',    label: 'Followers',    requireAuth: true },
    { href: '/following',    label: 'Following',    requireAuth: true },
    { href: '/my-purchases', label: 'Purchases',    requireAuth: true },
    { href: '/my-licenses',  label: 'Licenses',     requireAuth: true },
    { href: '/profile',      label: 'Profile',      requireAuth: true },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(12,12,15,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 group-hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
                  color: '#0c0c0f',
                  boxShadow: '0 2px 12px var(--gold-glow)',
                }}
              >
                DC
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="text-base font-bold tracking-tight"
                  style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}
                >
                  Digi ChainStore
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Digital Marketplace on Sui
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                if (link.requireAuth && !account) return null;
                const isActive = router.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                      background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'var(--bg-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {account && (
                <Link
                  href="/list-product"
                  className="btn-gold hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold"
                >
                  <span>+ List</span>
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold-light)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {cart.length > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center text-xs font-bold rounded-full"
                    style={{ background: 'var(--gold)', color: '#0c0c0f' }}
                  >
                    {cart.length}
                  </span>
                )}
              </button>

              <AuthButton />

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer
        className="mt-24 py-10"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))', color: '#0c0c0f' }}
              >
                DC
              </div>
              <div>
                <span
                  className="text-sm font-bold"
                  style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}
                >
                  Digi ChainStore
                </span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  © 2026 CoA Tech. All rights reserved.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(201,168,76,0.08)', color: 'var(--gold)', border: '1px solid var(--border)' }}
              >
                ⬡ Sui Testnet
              </span>
            </div>

            <div className="flex gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              {['About', 'Terms', 'Privacy'].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="transition-colors duration-200 hover:text-amber-400"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold-light)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Cart Drawer ── */}
      <Transition appear show={cartOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setCartOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full" enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0" leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div
                      className="flex h-full flex-col shadow-2xl"
                      style={{ background: 'var(--bg-surface)', borderLeft: '1px solid var(--border-subtle)' }}
                    >
                      {/* Cart header */}
                      <div
                        className="flex items-center justify-between px-6 py-4"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <Dialog.Title
                          className="text-lg font-bold"
                          style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}
                        >
                          Cart
                          {cart.length > 0 && (
                            <span
                              className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--gold)' }}
                            >
                              {cart.length}
                            </span>
                          )}
                        </Dialog.Title>
                        <button
                          onClick={() => setCartOpen(false)}
                          className="rounded-lg p-1.5 transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto px-6 py-4">
                        {cart.length === 0 ? (
                          <div className="text-center py-16">
                            <ShoppingCartIcon className="mx-auto h-12 w-12 mb-4" style={{ color: 'var(--text-muted)' }} />
                            <p style={{ color: 'var(--text-secondary)' }}>Your cart is empty</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {cart.map((item) => (
                              <div
                                key={item.id}
                                className="flex gap-3 p-3 rounded-xl"
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                              >
                                <img
                                  src={item.image_url || 'https://via.placeholder.com/60'}
                                  alt={item.title}
                                  className="h-16 w-16 object-cover rounded-lg flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                                    {item.title}
                                  </h3>
                                  <p className="text-sm font-semibold mt-1" style={{ color: 'var(--gold-light)' }}>
                                    {(Number(item.price) / 1e9).toFixed(2)} SUI
                                  </p>
                                </div>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="rounded-lg p-1 transition-colors flex-shrink-0"
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {cart.length > 0 && (
                        <div
                          className="px-6 py-5 space-y-3"
                          style={{ borderTop: '1px solid var(--border-subtle)' }}
                        >
                          <div className="flex justify-between items-center">
                            <span style={{ color: 'var(--text-secondary)' }}>Total</span>
                            <span className="text-xl font-bold" style={{ color: 'var(--gold-light)', fontFamily: "'DM Serif Display', serif" }}>
                              {(totalPrice / 1e9).toFixed(2)} SUI
                            </span>
                          </div>
                          <button
                            onClick={checkout}
                            className="btn-gold w-full py-3 text-sm font-semibold rounded-xl"
                          >
                            Checkout
                          </button>
                          <button
                            onClick={clearCart}
                            className="btn-ghost w-full py-3 text-sm font-medium rounded-xl"
                          >
                            Clear Cart
                          </button>
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── Mobile Menu ── */}
      <Transition appear show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={() => setMobileMenuOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="-translate-x-full" enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0" leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                    <div
                      className="flex h-full flex-col shadow-xl"
                      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
                    >
                      <div
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <span
                          className="font-bold"
                          style={{ fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}
                        >
                          Menu
                        </span>
                        <button
                          onClick={() => setMobileMenuOpen(false)}
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="flex-1 px-4 py-6 space-y-1">
                        {navLinks.map((link) => {
                          if (link.requireAuth && !account) return null;
                          const isActive = router.pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                              style={{
                                color: isActive ? 'var(--gold-light)' : 'var(--text-secondary)',
                                background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                              }}
                            >
                              {link.label}
                            </Link>
                          );
                        })}
                        {account && (
                          <Link
                            href="/list-product"
                            onClick={() => setMobileMenuOpen(false)}
                            className="btn-gold flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold mt-4"
                          >
                            + List Product
                          </Link>
                        )}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
