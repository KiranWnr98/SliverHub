import {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

import type { CartItem, Product } from '../types';

import {
  isProductPurchasable,
  useProductCatalog,
} from '../hooks/useProducts';

import { CartContext } from './CartContextValue';

// GET LOGGED-IN CUSTOMER EMAIL
function getCustomerEmail(): string | null {
  try {
    const saved = sessionStorage.getItem(
      'silverhub-demo-customer'
    );

    if (!saved) return null;

    const customer: unknown = JSON.parse(saved);

    if (
      typeof customer === 'object' &&
      customer !== null &&
      'email' in customer &&
      typeof customer.email === 'string'
    ) {
      const email = customer.email.trim().toLowerCase();
      return email || null;
    }

    return null;
  } catch {
    return null;
  }
}

// UNIQUE CART KEY FOR EACH CUSTOMER
function getCartKey(email: string): string {
  return `silverhub-cart-${email}`;
}

// READ SAVED CUSTOMER CART
function readCart(email: string | null): CartItem[] {
  if (!email) return [];

  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(getCartKey(email)) || '[]'
    );

    if (!Array.isArray(saved)) return [];

    return saved.filter(
      (item): item is CartItem =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.quantity === 'number' &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        typeof item.product === 'object' &&
        item.product !== null &&
        typeof item.product.id === 'number' &&
        Number.isInteger(item.product.id) &&
        item.product.id > 0
    );
  } catch (error) {
    console.warn('Unable to read saved cart:', error);
    return [];
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { products } = useProductCatalog();

  const productById = useMemo(
    () =>
      new Map(
        products.map((product) => [product.id, product])
      ),
    [products]
  );

  // CURRENT CUSTOMER
  const [customerEmail, setCustomerEmail] = useState<
    string | null
  >(getCustomerEmail);

  // CUSTOMER CART
  const [cart, setCart] = useState<CartItem[]>(() =>
    readCart(getCustomerEmail())
  );

  const cartRef = useRef<CartItem[]>(cart);

  // UPDATE CART
  const setNextCart = useCallback((nextCart: CartItem[]) => {
    cartRef.current = nextCart;
    setCart(nextCart);
  }, []);

  // ADD PRODUCT TO CART
  const addToCart = useCallback(
    (product: Product): boolean => {
      if (!getCustomerEmail()) return false;

      const currentProduct = productById.get(product.id);
      const currentCart = cartRef.current;

      const existing = currentCart.find(
        (item) => item.product.id === product.id
      );

      const quantity = existing?.quantity ?? 0;

      if (
        !currentProduct ||
        !isProductPurchasable(currentProduct) ||
        quantity >= (currentProduct.stockQuantity ?? 0)
      ) {
        return false;
      }

      const nextCart = existing
        ? currentCart.map((item) =>
            item.product.id === product.id
              ? {
                  ...item,
                  product: currentProduct,
                  quantity: item.quantity + 1,
                }
              : item
          )
        : [
            ...currentCart,
            {
              product: currentProduct,
              quantity: 1,
            },
          ];

      setNextCart(nextCart);

      return true;
    },
    [productById, setNextCart]
  );

  // REMOVE PRODUCT FROM CART
  const removeFromCart = useCallback(
    (id: number) => {
      if (!getCustomerEmail()) return;

      setNextCart(
        cartRef.current.filter(
          (item) => item.product.id !== id
        )
      );
    },
    [setNextCart]
  );

  // UPDATE PRODUCT QUANTITY
  const updateQuantity = useCallback(
    (id: number, quantity: number): boolean => {
      if (!getCustomerEmail()) return false;

      if (!Number.isInteger(quantity) || quantity < 0) {
        return false;
      }

      if (quantity === 0) {
        removeFromCart(id);
        return true;
      }

      const currentCart = cartRef.current;

      const item = currentCart.find(
        (cartItem) => cartItem.product.id === id
      );

      const product = productById.get(id);

      if (!item || !product) return false;

      if (
        quantity > item.quantity &&
        (!isProductPurchasable(product) ||
          quantity > (product.stockQuantity ?? 0))
      ) {
        return false;
      }

      setNextCart(
        currentCart.map((cartItem) =>
          cartItem.product.id === id
            ? { ...cartItem, product, quantity }
            : cartItem
        )
      );

      return true;
    },
    [productById, removeFromCart, setNextCart]
  );

  // HANDLE LOGIN / SIGNUP / LOGOUT
  const syncCustomer = useCallback(() => {
    const email = getCustomerEmail();

    const savedCart = readCart(email);

    // SWITCH TO CURRENT CUSTOMER CART
    cartRef.current = savedCart;
    setCart(savedCart);
    setCustomerEmail(email);

    // CHECK PENDING ADD TO BOX
    const pendingId = sessionStorage.getItem(
      'silverhub-pending-cart'
    );

    if (!email || !pendingId) return;

    const id = Number(pendingId);
    const product = productById.get(id);

    if (
      Number.isInteger(id) &&
      id > 0 &&
      product &&
      isProductPurchasable(product)
    ) {
      addToCart(product);
    }

    sessionStorage.removeItem(
      'silverhub-pending-cart'
    );
  }, [productById, addToCart]);

  // LISTEN FOR AUTH CHANGES
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

  // RECONCILE CART WITH PRODUCT CATALOG
  useEffect(() => {
    if (!customerEmail) return;

    const reconciledCart = cartRef.current.flatMap(
      (item) => {
        const product = productById.get(item.product.id);

        return product &&
          !product.isDeleted &&
          !product.isHidden &&
          !product.scheduledDeletionAt
          ? [{ ...item, product }]
          : [];
      }
    );

    setNextCart(reconciledCart);
  }, [productById, customerEmail, setNextCart]);

  // SAVE CUSTOMER CART
  useEffect(() => {
    if (!customerEmail) return;

    try {
      localStorage.setItem(
        getCartKey(customerEmail),
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        'Unable to save cart in this browser:',
        error
      );
    }
  }, [cart, customerEmail]);

  // FILTER VALID PRODUCTS
  const customerCart = customerEmail
    ? cart.filter((item) => {
        const product = productById.get(item.product.id);

        return (
          product &&
          !product.isDeleted &&
          !product.isHidden &&
          !product.scheduledDeletionAt
        );
      })
    : [];

  // TOTAL CART QUANTITY
  const cartCount = customerCart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // AVAILABLE PRODUCTS
  const availableCart = customerCart.filter((item) => {
    const product = productById.get(item.product.id);

    return (
      product !== undefined &&
      isProductPurchasable(product) &&
      item.quantity <= (product.stockQuantity ?? 0)
    );
  });

  // PAYABLE SUBTOTAL
  const payableSubtotal = availableCart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0
  );

  const hasAvailableItems = availableCart.length > 0;

  return (
    <CartContext.Provider
      value={{
        cart: customerCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        payableSubtotal,
        hasAvailableItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}