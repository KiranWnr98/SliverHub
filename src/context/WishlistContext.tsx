
import {
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import { WishlistContext } from './WishlistContextValue';

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('silveraura-wishlist') || '[]'
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'silveraura-wishlist',
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  const toggleWishlist = (id: number) => {
    setWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const isWishlisted = (id: number) =>
    wishlist.includes(id);

  return (
    <WishlistContext.Provider
      value={{ wishlist, toggleWishlist, isWishlisted }}
    >
      {children}
    </WishlistContext.Provider>
  );
}
