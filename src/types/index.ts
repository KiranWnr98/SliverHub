
export interface Category {
  id: number;
  name: string;
  subtitle: string;
  image: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  rating: string;
  image: string;
  isNew?: boolean;
  isFeatured?: boolean;
  description?: string;
  sku?: string;
  stockQuantity?: number;
  isHidden?: boolean;
  isDeleted?: boolean;
  deletedAt?: string | null;
  scheduledDeletionAt?: string | null;
  scheduledDeletionPreviousState?: {
    isHidden: boolean;
    stockQuantity: number;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: number;
  name: string;
  message: string;
  rating: number;
}
