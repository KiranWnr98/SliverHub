import { createContext } from 'react';

import type { Product } from '../types';

export type NewProductInput = Pick<
  Product,
  'name' | 'category' | 'price' | 'rating' | 'image'
> &
  Partial<
    Pick<
      Product,
      | 'oldPrice'
      | 'isNew'
      | 'isFeatured'
      | 'description'
      | 'sku'
      | 'stockQuantity'
    >
  >;

export type ProductUpdate = Partial<
  Omit<
    Product,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'isDeleted'
    | 'deletedAt'
    | 'scheduledDeletionAt'
    | 'scheduledDeletionPreviousState'
  >
>;

export interface ProductContextType {
  products: Product[];
  deletedProductIds: number[];
  storageError: string | null;
  addProduct: (input: NewProductInput) => Product;
  updateProduct: (id: number, updates: ProductUpdate) => void;
  setProductHidden: (id: number, isHidden: boolean) => void;
  setStockQuantity: (id: number, quantity: number) => void;
  scheduleDeletion: (id: number, date: string) => void;
  cancelScheduledDeletion: (id: number) => void;
  softDeleteProduct: (id: number) => void;
  restoreProduct: (id: number) => void;
  permanentlyDeleteProduct: (id: number) => void;
  processScheduledDeletions: () => void;
}

export const ProductContext =
  createContext<ProductContextType | undefined>(undefined);
