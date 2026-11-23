import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import { useProducts } from '../hooks/useProducts';
import { WishlistContext } from './WishlistContextValue';

// CUSTOMER EMAIL
function getCustomerEmail(): string | null {
  try {
    const customer = sessionStorage.getItem(
      'silverhub-demo-customer'
    );

    if (!customer) return null;

    const parsed: unknown = JSON.parse(customer);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'email' in parsed &&
      typeof parsed.email === 'string'
    ) {
      return parsed.email.trim().toLowerCase();
    }

    return null;
  } catch {
    return null;
  }
}

// CUSTOMER-SPECIFIC STORAGE KEY
function getWishlistKey(email: string): string {
  return `silverhub-wishlist-${email}`;
}

// READ SAVED WISHLIST
function readWishlist(email: string | null): number[] {
  if (!email) return [];

  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(getWishlistKey(email)) || '[]'
    );

    if (!Array.isArray(saved)) return [];

    return Array.from(
      new Set(
        saved.filter(
          (id): id is number =>
            typeof id === 'number' &&
            Number.isInteger(id) &&
            id > 0
        )
      )
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
    [visibleProducts]
  );

  // CURRENT CUSTOMER
  const [customerEmail, setCustomerEmail] = useState<string | null>(
    getCustomerEmail
  );

  // CUSTOMER WISHLIST
  const [storedWishlist, setStoredWishlist] = useState<number[]>(
    () => readWishlist(getCustomerEmail())
  );

  // VISIBLE PRODUCTS ONLY
  const wishlist = useMemo(
    () =>
      storedWishlist.filter(
        (id, index) =>
          visibleProductIds.has(id) &&
          storedWishlist.indexOf(id) === index
      ),
    [storedWishlist, visibleProductIds]
  );

  // SYNC CUSTOMER SESSION AND PENDING PRODUCT
  const syncCustomer = useCallback(() => {
    const email = getCustomerEmail();

    setCustomerEmail(email);

    const savedWishlist = readWishlist(email);

    const pendingId = sessionStorage.getItem(
      'silverhub-pending-wishlist'
    );

    if (email && pendingId) {
      const id = Number(pendingId);

      if (
        Number.isInteger(id) &&
        id > 0 &&
        visibleProductIds.has(id)
      ) {
        if (!savedWishlist.includes(id)) {
          savedWishlist.push(id);
        }
      }

      sessionStorage.removeItem(
        'silverhub-pending-wishlist'
      );
    }

    setStoredWishlist(savedWishlist);
  }, [visibleProductIds]);

  // LISTEN FOR LOGIN / SIGNUP / LOGOUT
  useEffect(() => {
    window.addEventListener(
      'silverhub-auth-changed',
      syncCustomer
    );

    return () => {
      window.removeEventListener(
        'silverhub-auth-changed',
        syncCustomer
      );
    };
  }, [syncCustomer]);

  // SAVE CUSTOMER WISHLIST
  useEffect(() => {
    if (!customerEmail) return;

    localStorage.setItem(
      getWishlistKey(customerEmail),
      JSON.stringify(wishlist)
    );
  }, [wishlist, customerEmail]);

  // TOGGLE WISHLIST
  const toggleWishlist = (id: number) => {
    if (!customerEmail) return;

    if (!visibleProductIds.has(id)) return;

    setStoredWishlist((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // CHECK WISHLIST
  const isWishlisted = (id: number) =>
    wishlist.includes(id);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}