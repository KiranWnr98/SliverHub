import { createContext } from 'react';

import type { CartItem, Product } from '../types';

export interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => boolean;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => boolean;
  cartCount: number;
  payableSubtotal: number;
  hasAvailableItems: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
