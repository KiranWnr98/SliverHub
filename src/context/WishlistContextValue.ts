import { createContext } from 'react';

export interface WishlistContextType {
  wishlist: number[];
  toggleWishlist: (id: number) => void;
  isWishlisted: (id: number) => boolean;
}

export const WishlistContext =
  createContext<WishlistContextType | undefined>(undefined);
