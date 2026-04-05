import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import toast from 'react-hot-toast';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID!;

interface CartItem {
  id: string;
  title: string;
  price: string;
  image_url: string;
  seller: string;
  category: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  checkout: () => void;
  itemCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // ✅ FIX: Load cart from localStorage ONCE on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('sui-shop-cart');
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) {
            setCart(parsed);
          }
        } catch (error) {
          console.error('Failed to load cart:', error);
          localStorage.removeItem('sui-shop-cart');
        }
      }
      setIsHydrated(true);
    }
  }, []); // ✅ Empty array - only run once

  // ✅ FIX: Clear cart when user logs out
  useEffect(() => {
    if (isHydrated && !account?.address) {
      setCart([]);
      localStorage.removeItem('sui-shop-cart');
    }
  }, [account?.address, isHydrated]); // ✅ Only depends on account address

  // ✅ FIX: Save cart to localStorage (separate effect)
  useEffect(() => {
    if (isHydrated && cart.length > 0) {
      localStorage.setItem('sui-shop-cart', JSON.stringify(cart));
    } else if (isHydrated && cart.length === 0) {
      localStorage.removeItem('sui-shop-cart');
    }
  }, [cart, isHydrated]); // ✅ Only re-run when cart changes

  const addToCart = (item: CartItem) => {
    if (!account?.address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (cart.find((i) => i.id === item.id)) {
      toast.error('Item already in cart');
      return;
    }

    setCart((prevCart) => [...prevCart, item]);
    // Don't show toast here - caller handles it
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const checkout = () => {
    if (!account?.address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const tx = new Transaction();
    
    cart.forEach((item) => {
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(BigInt(item.price))]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::marketplace::purchase_product`,
        arguments: [
          tx.object(MARKETPLACE_ID),
          tx.object(item.id),
          coin,
          tx.pure.u64(1n),
          tx.object('0x6'),
        ],
      });
    });

    toast.loading('Processing checkout...', { id: 'checkout' });

    signAndExecuteTransaction(
      { transaction: tx },
      {
        onSuccess: () => {
          toast.success('Purchase successful! 🎉', { id: 'checkout' });
          clearCart();
        },
        onError: (error: any) => {
          console.error('Checkout failed:', error);
          
          let errorMessage = 'Checkout failed';
          if (error.message?.includes('abort code: 2')) {
            errorMessage = 'Insufficient balance or product unavailable';
          }
          
          toast.error(errorMessage, { id: 'checkout' });
        },
      }
    );
  };

  const itemCount = cart.length;
  const totalPrice = cart.reduce((sum, item) => sum + Number(item.price), 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        checkout,
        itemCount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}