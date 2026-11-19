
import { useContext, useMemo } from 'react';
import { ProductContext } from '../context/ProductContextValue';
import type { Product } from '../types';

export function useProductCatalog() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error('useProducts must be used inside ProductProvider');
  }

  return context;
}

export function useProducts() {
  const context = useProductCatalog();
  const visibleProducts = useMemo(
    () =>
      context.products.filter(
        (product) =>
          !product.isDeleted &&
          !product.isHidden &&
          !product.scheduledDeletionAt,
      ),
    [context.products],
  );
  const products = visibleProducts.filter((product) => product.isFeatured);
  const newArrivals = visibleProducts.filter((product) => product.isNew);

  return {
    ...context,
    products,
    newArrivals,
    allProducts: context.products,
    visibleProducts,
  };
}

export function isProductPurchasable(product: Product): boolean {
  return (
    !product.isDeleted &&
    !product.isHidden &&
    !product.scheduledDeletionAt &&
    (product.stockQuantity ?? 0) > 0
  );
}
