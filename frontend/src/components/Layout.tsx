import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import AuthButton from './AuthButton';
import BalanceDisplay from './BalanceDisplay';
import Logo from './Logo';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import { useAutoLogout } from '@/hooks/useAutoLogout';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const account = useCurrentAccount();
  //const { cart, removeFromCart, clearCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { cart, removeFromCart, clearCart, checkout, itemCount } = useCart();
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price), 0);

  const handleCheckout = () => {
    toast.success('Checkout feature coming soon!');
    setCartOpen(false);
  };

  const navLinks = [
    { href: '/', label: 'Marketplace', requireAuth: false },
    { href: '/my-products', label: 'My Products', requireAuth: true },
    { href: '/analytics', label: 'Analytics', requireAuth: true },
    { href: '/support',   label: 'Help',      requireAuth: false },
    { href: '/favorites', label: 'Favorites', requireAuth: true },
    { href: '/followers', label: 'Followers', requireAuth: true },
    { href: '/following', label: 'Following', requireAuth: true },
    { href: '/my-purchases', label: 'my-purchases', requireAuth: true },
    { href: '/profile', label: 'Profile', requireAuth: true },
  ];

  // ✅ Add auto-logout
  useAutoLogout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <img src="/logo.svg" alt="Digi ChainStore" className="h-9 w-9 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
                  Digi ChainStore
                </span>
                <span className="text-xs text-gray-600 whitespace-nowrap font-medium">The Digital ChainStore of the People</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => {
                if (link.requireAuth && !account) return null;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-semibold transition-colors ${
                      router.pathname === link.href
                        ? 'text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* List Product Button */}
              {account && (
                <Link
                  href="/list-product"
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <span className="text-lg">+</span>
                  <span>List Product</span>
                </Link>
              )}

              {/* Wallet Balance */}
              <BalanceDisplay />

              {/* Cart Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>

              {/* Auth Button */}
              <AuthButton />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Digi ChainStore" className="h-8 w-8" />
              <span className="text-lg font-bold">Digi ChainStore</span>
            
            {/*<p className="text-gray-400 text-sm">The Digital ChainStore of the People</p>*/}
              <span className="text-sm text-gray-600">© 2026 CoA Tech. All rights reserved.</span>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-600">
              <Link href="/support" className="hover:text-indigo-600 transition-colors">Support</Link>
              <Link href="/terms" className="hover:text-indigo-600 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Shopping Cart Modal */}
      <Transition appear show={cartOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setCartOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col bg-white shadow-2xl">
                      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <Dialog.Title className="text-xl font-bold text-gray-900">
                          Shopping Cart ({cart.length})
                        </Dialog.Title>
                        <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-500">
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto px-6 py-4">
                        {cart.length === 0 ? (
                          <div className="text-center py-12">
                            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 text-gray-600">Your cart is empty</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {cart.map((item) => (
                              <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                                <img src={item.image_url} alt={item.title} className="h-20 w-20 object-cover rounded-lg" />
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                  <p className="text-sm text-indigo-600 font-bold mt-1">
                                    {(Number(item.price) / 1e9).toFixed(2)} SUI
                                  </p>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-600">
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {cart.length > 0 && (
                        <div className="border-t border-gray-200 px-6 py-6 space-y-4">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="text-indigo-600">{(totalPrice / 1e9).toFixed(2)} SUI</span>
                          </div>
                          <button onClick={checkout} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg">
                            Checkout
                          </button>
                          <button onClick={clearCart} className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all">
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

      {/* Mobile Menu */}
      <Transition appear show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={() => setMobileMenuOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-sm">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      <div className="px-6 py-4 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="/logo.svg" alt="Digi ChainStore" className="h-8 w-8" />
                          <div className="flex flex-col leading-tight">
                            <span className="text-base font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                              Digi ChainStore
                            </span>
                            <span className="text-xs text-gray-500">The Digital ChainStore of the People</span>
                          </div>
                        </div>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-500">
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="flex-1 px-6 py-6 space-y-4">
                        {navLinks.map((link) => {
                          if (link.requireAuth && !account) return null;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block text-lg font-semibold text-gray-900 hover:text-indigo-600"
                            >
                              {link.label}
                            </Link>
                          );
                        })}
                        {account && (
                          <Link
                            href="/list-product"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-lg font-semibold text-indigo-600 hover:text-indigo-700"
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