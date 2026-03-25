import { ReactNode, Fragment } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCartIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { useState } from 'react';
import AuthButton from './AuthButton';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const account = useCurrentAccount();
  const router = useRouter();
  const { cart, removeFromCart, itemCount, totalPrice } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Marketplace', href: '/', current: router.pathname === '/' },
    { name: 'My Products', href: '/my-products', current: router.pathname === '/my-products' },
    { name: 'Analytics', href: '/analytics', current: router.pathname === '/analytics' },
    { name: 'My Purchases', href: '/my-purchases', current: router.pathname === '/my-purchases' },
    { name: 'Favorites', href: '/favorites', current: router.pathname === '/favorites' },
    { name: 'Following', href: '/following', current: router.pathname === '/following' },
    { name: 'Followers', href: '/followers', current: router.pathname === '/followers' },
    { name: 'Profile', href: '/profile', current: router.pathname === '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo - Responsive sizing */}
            <div className="flex items-center space-x-2">
              {/* ✅ ADDED: Hamburger Menu Button (Mobile Only) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
              <Link href="/" className="text-xl sm:text-2xl font-bold text-indigo-600">
                🛍️ <span className="hidden sm:inline">Sui Shop</span>
              </Link>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden lg:flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    item.current
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side - Better mobile spacing */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart Icon */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {account && (
                <Link
                  href="/list-product"
                  className="bg-indigo-600 text-white px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold hover:bg-indigo-500 transition-colors whitespace-nowrap"
                >
                  <span className="hidden sm:inline">+ List Product</span>
                  <span className="sm:hidden">+</span>
                </Link>
              )}
              
              <div className="min-w-[80px] sm:min-w-[120px]">
                <AuthButton />
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {/* ✅ UPDATED: Mobile Navigation - Only show when mobileMenuOpen is true */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)} // ✅ Close menu on click
                  className={`${
                    item.current
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2026 Sui Shop. Built by <span className="font-semibold text-indigo-600">CoA Tech</span>. Built on the Sui Blockchain. 🚀
          </p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <Transition.Root show={cartOpen} as={Fragment}>
        <Dialog open={cartOpen} as="div" className="relative z-50" onClose={setCartOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-lg font-medium text-gray-900">
                            Shopping Cart
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative -m-2 p-2 text-gray-400 hover:text-gray-500 transition-colors"
                              onClick={() => setCartOpen(false)}
                            >
                              <span className="sr-only">Close panel</span>
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="flow-root">
                            {cart.length === 0 ? (
                              <div className="text-center py-12">
                                <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">Your cart is empty</p>
                              </div>
                            ) : (
                              <ul className="-my-6 divide-y divide-gray-200">
                                {cart.map((item) => (
                                  <li key={item.id} className="flex py-6">
                                    <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="h-full w-full object-cover object-center"
                                      />
                                    </div>

                                    <div className="ml-4 flex flex-1 flex-col">
                                      <div>
                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                          <h3>{item.title}</h3>
                                          <p className="ml-4">{(Number(item.price) / 1e9).toFixed(2)} SUI</p>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                                      </div>
                                      <div className="flex flex-1 items-end justify-between text-sm">
                                        <button
                                          type="button"
                                          onClick={() => removeFromCart(item.id)}
                                          className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>

                      {cart.length > 0 && (
                        <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <p>Subtotal</p>
                            <p>{(totalPrice / 1e9).toFixed(2)} SUI</p>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">{itemCount} item(s)</p>
                          <div className="mt-6">
                            <Link
                              href="/checkout"
                              onClick={() => setCartOpen(false)}
                              className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
                            >
                              Checkout
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
}