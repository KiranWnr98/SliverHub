

import {
  useMemo,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

import type { CartItem, Product } from '../types';
import { isProductPurchasable, useProductCatalog } from '../hooks/useProducts';
import { CartContext } from './CartContextValue';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved: unknown = JSON.parse(
        localStorage.getItem('silveraura-cart') || '[]',
      );
      if (!Array.isArray(saved)) {
        console.warn('Saved cart data is invalid; starting with an empty cart.');
        return [];
      }
      return saved.filter(
        (item): item is CartItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.quantity === 'number' &&
          Number.isInteger(item.quantity) &&
          item.quantity > 0 &&
          typeof item.product === 'object' &&
          item.product !== null &&
          typeof item.product.id === 'number',
      );
    } catch (error) {
      console.warn('Unable to read the saved cart; starting with an empty cart.', error);
      return [];
    }
  });
  const cartRef = useRef(cart);
  const { products } = useProductCatalog();
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  useEffect(() => {
    const reconciledCart = cartRef.current.flatMap((item) => {
      const product = productById.get(item.product.id);
      return product &&
        !product.isDeleted &&
        !product.isHidden &&
        !product.scheduledDeletionAt
        ? [{ ...item, product }]
        : [];
    });
    cartRef.current = reconciledCart;
    setCart(reconciledCart);
  }, [productById]);

  useEffect(() => {
    try {
      localStorage.setItem('silveraura-cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Unable to save the cart in this browser.', error);
    }
  }, [cart]);

  cartRef.current = cart;

  const setNextCart = (nextCart: CartItem[]) => {
    cartRef.current = nextCart;
    setCart(nextCart);
  };

  const addToCart = (product: Product): boolean => {
    const currentProduct = productById.get(product.id);
    const currentCart = cartRef.current;
    const existing = currentCart.find((item) => item.product.id === product.id);
    const quantity = existing?.quantity ?? 0;
    if (
      !currentProduct ||
      !isProductPurchasable(currentProduct) ||
      quantity >= (currentProduct.stockQuantity ?? 0)
    ) {
      return false;
    }

    setNextCart(
      existing
        ? currentCart.map((item) =>
            item.product.id === product.id
              ? { ...item, product: currentProduct, quantity: item.quantity + 1 }
              : item,
          )
        : [...currentCart, { product: currentProduct, quantity: 1 }],
    );
    return true;
  };

  const removeFromCart = (id: number) => {
    setNextCart(cartRef.current.filter((item) => item.product.id !== id));
  };

  const updateQuantity = (id: number, quantity: number): boolean => {
    if (!Number.isInteger(quantity) || quantity < 0) return false;
    if (quantity === 0) {
      removeFromCart(id);
      return true;
    }
    const currentCart = cartRef.current;
    const item = currentCart.find((cartItem) => cartItem.product.id === id);
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
          : cartItem,
      ),
    );
    return true;
  };

  const customerCart = cart.filter((item) => {
    const product = productById.get(item.product.id);
    return (
      product &&
      !product.isDeleted &&
      !product.isHidden &&
      !product.scheduledDeletionAt
    );
  });

  const cartCount = customerCart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const availableCart = customerCart.filter((item) => {
    const product = productById.get(item.product.id);
    return (
      product !== undefined &&
      isProductPurchasable(product) &&
      item.quantity <= (product.stockQuantity ?? 0)
    );
  });
  const payableSubtotal = availableCart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const hasAvailableItems = availableCart.length > 0;

  return (
    <CartContext.Provider
      value={{
        cart,
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
