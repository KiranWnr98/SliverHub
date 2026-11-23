import { createContext } from 'react';
import type { Category, Product } from '../types';

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
      | 'media'
      | 'primaryMediaId'
      | 'isHidden'
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

export interface ProductImportBatch {
  additions: NewProductInput[];
  updates: Array<{ id: number; updates: ProductUpdate }>;
}

export type NewCategoryInput = Pick<Category, 'name' | 'subtitle' | 'image'> &
  Partial<Pick<Category, 'isActive' | 'isFeatured' | 'sortOrder'>>;

export type CategoryUpdate = Partial<Omit<Category, 'id' | 'createdAt' | 'isDeleted' | 'deletedAt'>>;
export interface ProductContextType {
  products: Product[];
  deletedProductIds: number[];
  categories: Category[];
  storageError: string | null;

  addCategory: (input: NewCategoryInput) => Category;
  updateCategory: (id: number, updates: CategoryUpdate) => void;
  setCategoryActive: (id: number, isActive: boolean) => void;
  reorderCategories: (ids: number[]) => void;

  // Category deletion and recovery
  deleteCategory: (id: number, reassignToCategoryId?: number) => void;
  restoreCategory: (id: number) => void;
  permanentlyDeleteCategory: (id: number) => void;

  addProduct: (input: NewProductInput) => Product;
  importProducts: (batch: ProductImportBatch) => void;
  updateProduct: (id: number, updates: ProductUpdate) => void;
  setProductHidden: (id: number, isHidden: boolean) => void;
  setProductsHidden: (ids: number[], isHidden: boolean) => void;
  setStockQuantity: (id: number, quantity: number) => void;
  setProductsStockQuantity: (ids: number[], quantity: number) => void;
  scheduleDeletion: (id: number, date: string) => void;
  cancelScheduledDeletion: (id: number) => void;
  softDeleteProduct: (id: number) => void;
  restoreProduct: (id: number) => void;
  permanentlyDeleteProduct: (id: number) => void;
  processScheduledDeletions: () => void;
}

export const ProductContext = createContext<ProductContextType | undefined>(
  undefined,
);
