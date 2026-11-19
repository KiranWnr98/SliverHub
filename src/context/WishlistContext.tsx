
import {
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import { useProducts } from '../hooks/useProducts';
import { WishlistContext } from './WishlistContextValue';

function readWishlist(): number[] {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem('silveraura-wishlist') || '[]',
    );
    if (!Array.isArray(saved)) return [];

    return Array.from(
      new Set(
        saved.filter(
          (id): id is number =>
            typeof id === 'number' && Number.isInteger(id) && id > 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { visibleProducts } = useProducts();
  const visibleProductIds = useMemo(
    () => new Set(visibleProducts.map((product) => product.id)),
    [visibleProducts],
  );
  const [storedWishlist, setStoredWishlist] = useState<number[]>(readWishlist);
  const wishlist = useMemo(
    () =>
      storedWishlist.filter(
        (id, index) =>
          visibleProductIds.has(id) && storedWishlist.indexOf(id) === index,
      ),
    [storedWishlist, visibleProductIds],
  );

  useEffect(() => {
    setStoredWishlist((current) =>
      current.length === wishlist.length &&
      current.every((id, index) => id === wishlist[index])
        ? current
        : wishlist,
    );
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(
      'silveraura-wishlist',
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  const toggleWishlist = (id: number) => {
    if (!visibleProductIds.has(id)) return;

    setStoredWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
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
