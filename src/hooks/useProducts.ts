
import { products } from '../data/products';
import { newArrivals } from '../data/collections';

export function useProducts() {
  return {
    products,
    newArrivals,
    allProducts: [...products, ...newArrivals],
  };
}
