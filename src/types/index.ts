
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
  oldPrice?: number;
  rating: string;
  image: string;
  isNew?: boolean;
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
