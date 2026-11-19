import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { newArrivals } from '../data/collections';
import { products as featuredProducts } from '../data/products';
import type { Product } from '../types';
import { ProductContext } from './ProductContextValue';
import type {
  NewProductInput,
  ProductUpdate,
} from './ProductContextValue';

const STORAGE_KEY = 'silverhub-products';
const STORAGE_VERSION = 1;
const DEFAULT_STOCK = 10;
const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

interface ProductState {
  products: Product[];
  deletedProductIds: number[];
}

interface PersistedProductState extends ProductState {
  version: number;
}

type ProductAction =
  | { type: 'add'; product: Product }
  | { type: 'update'; id: number; updates: ProductUpdate; updatedAt: string }
  | { type: 'hide'; id: number; isHidden: boolean; updatedAt: string }
  | { type: 'stock'; id: number; quantity: number; updatedAt: string }
  | { type: 'schedule'; id: number; date: string; updatedAt: string }
  | { type: 'cancel-schedule'; id: number; updatedAt: string }
  | { type: 'delete'; id: number; deletedAt: string }
  | { type: 'restore'; id: number; updatedAt: string }
  | { type: 'permanently-delete'; id: number }
  | { type: 'process-expired'; today: string; deletedAt: string };

const seedCatalog: Product[] = [
  ...featuredProducts.map((product) => ({ ...product, isFeatured: true })),
  ...newArrivals.map((product) => ({ ...product, isFeatured: false })),
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProductRecord(value: unknown): value is Product {
  return (
    isRecord(value) &&
    Number.isInteger(value.id) &&
    typeof value.name === 'string' &&
    typeof value.category === 'string' &&
    typeof value.price === 'number' &&
    Number.isFinite(value.price) &&
    typeof value.rating === 'string' &&
    typeof value.image === 'string'
  );
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !dateKeyPattern.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function normalizeProduct(
  product: Product,
  fallback: Product | undefined,
  now: string,
): Product {
  const stockQuantity =
    Number.isInteger(product.stockQuantity) && (product.stockQuantity ?? -1) >= 0
      ? product.stockQuantity
      : fallback?.stockQuantity ?? DEFAULT_STOCK;
  const scheduledDeletionAt =
    isValidDateKey(product.scheduledDeletionAt)
      ? product.scheduledDeletionAt
      : null;
  const previousState = product.scheduledDeletionPreviousState;
  const oldPrice =
    product.oldPrice === null
      ? null
      : typeof product.oldPrice === 'number' &&
          Number.isFinite(product.oldPrice) &&
          product.oldPrice > 0
        ? product.oldPrice
        : fallback?.oldPrice;
  const isDeleted = product.isDeleted === true;
  const deletedAt =
    isDeleted &&
    typeof product.deletedAt === 'string' &&
    !Number.isNaN(Date.parse(product.deletedAt))
      ? product.deletedAt
      : null;

  return {
    ...fallback,
    ...product,
    isDeleted,
    deletedAt,
    oldPrice,
    sku:
      typeof product.sku === 'string' && product.sku.trim()
        ? product.sku.trim()
        : fallback?.sku ?? `SH-${String(product.id).padStart(4, '0')}`,
    stockQuantity,
    isHidden:
      typeof product.isHidden === 'boolean'
        ? product.isHidden
        : fallback?.isHidden ?? false,
    isFeatured:
      typeof product.isFeatured === 'boolean'
        ? product.isFeatured
        : fallback?.isFeatured ?? false,
    isNew:
      typeof product.isNew === 'boolean'
        ? product.isNew
        : fallback?.isNew ?? false,
    description:
      typeof product.description === 'string'
        ? product.description
        : fallback?.description ?? '',
    scheduledDeletionAt,
    scheduledDeletionPreviousState:
      scheduledDeletionAt &&
      isRecord(previousState) &&
      typeof previousState.isHidden === 'boolean' &&
      Number.isInteger(previousState.stockQuantity) &&
      (previousState.stockQuantity as number) >= 0
        ? {
            isHidden: previousState.isHidden,
            stockQuantity: previousState.stockQuantity as number,
          }
        : null,
    createdAt:
      typeof product.createdAt === 'string'
        ? product.createdAt
        : fallback?.createdAt ?? now,
    updatedAt:
      typeof product.updatedAt === 'string'
        ? product.updatedAt
        : fallback?.updatedAt ?? now,
  };
}

function softDeleteExpiredProducts(
  state: ProductState,
  today: string,
  deletedAt: string,
): ProductState {
  let changed = false;
  const products = state.products.map((product) => {
    if (
      product.isDeleted ||
      !product.scheduledDeletionAt ||
      product.scheduledDeletionAt > today
    ) {
      return product;
    }

    changed = true;
    return {
      ...product,
      isDeleted: true,
      deletedAt,
      updatedAt: deletedAt,
    };
  });

  return changed ? { ...state, products } : state;
}

function createSeedState(now: string): ProductState {
  return {
    products: seedCatalog.map((product) =>
      normalizeProduct(product, product, now),
    ),
    deletedProductIds: [],
  };
}

function readInitialState(): ProductState {
  const now = new Date().toISOString();
  const seeds = createSeedState(now);
  let serialized: string | null;

  try {
    serialized = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to read the saved Silver Hub product catalog.', error);
    return seeds;
  }

  if (!serialized) return seeds;

  try {
    const saved: unknown = JSON.parse(serialized);
    if (
      !isRecord(saved) ||
      saved.version !== STORAGE_VERSION ||
      !Array.isArray(saved.products) ||
      (saved.deletedProductIds !== undefined &&
        !Array.isArray(saved.deletedProductIds))
    ) {
      console.warn('The saved product catalog is outdated or invalid; using the current catalog.');
      return seeds;
    }

    const validProducts = saved.products.filter(isProductRecord);
    const savedDeletedProductIds = Array.isArray(saved.deletedProductIds)
      ? saved.deletedProductIds
      : [];
    const deletedProductIds = savedDeletedProductIds.filter(
      (id): id is number => Number.isInteger(id) && (id as number) > 0,
    );
    if (saved.products.length > 0 && validProducts.length === 0) {
      console.warn('The saved product catalog contains no valid products; using the current catalog.');
      return seeds;
    }

    const deleted = new Set(deletedProductIds);
    const seedById = new Map(seeds.products.map((product) => [product.id, product]));
    const savedById = new Map(
        validProducts
          .filter((product) => !deleted.has(product.id))
          .map((product) => [
            product.id,
            normalizeProduct(product, seedById.get(product.id), now),
          ]),
    );

    for (const seed of seeds.products) {
      if (!savedById.has(seed.id) && !deleted.has(seed.id)) {
        savedById.set(seed.id, seed);
      }
    }

    return softDeleteExpiredProducts(
      {
        products: Array.from(savedById.values()),
        deletedProductIds,
      },
      localDateKey(new Date()),
      now,
    );
  } catch (error) {
    console.warn('Unable to parse the saved Silver Hub product catalog; using the current catalog.', error);
    return seeds;
  }
}

function updateProduct(
  products: Product[],
  id: number,
  transform: (product: Product) => Product,
): Product[] {
  return products.map((product) =>
    product.id === id ? transform(product) : product,
  );
}

function reducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case 'add':
      return { ...state, products: [...state.products, action.product] };
    case 'update':
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.id && !product.isDeleted
            ? {
                ...product,
                ...action.updates,
                id: product.id,
                createdAt: product.createdAt,
                updatedAt: action.updatedAt,
              }
            : product,
        ),
      };
    case 'hide':
      return {
        ...state,
        products: updateProduct(state.products, action.id, (product) => ({
          ...product,
          isHidden: action.isHidden,
          updatedAt: action.updatedAt,
        })),
      };
    case 'stock':
      return {
        ...state,
        products: updateProduct(state.products, action.id, (product) => ({
          ...product,
          stockQuantity: action.quantity,
          updatedAt: action.updatedAt,
        })),
      };
    case 'schedule':
      return {
        ...state,
        products: updateProduct(state.products, action.id, (product) => ({
          ...product,
          scheduledDeletionAt: action.date,
          scheduledDeletionPreviousState:
            product.scheduledDeletionPreviousState ?? {
              isHidden: Boolean(product.isHidden),
              stockQuantity: product.stockQuantity ?? DEFAULT_STOCK,
            },
          updatedAt: action.updatedAt,
        })),
      };
    case 'cancel-schedule':
      return {
        ...state,
        products: updateProduct(state.products, action.id, (product) => ({
          ...product,
          isHidden:
            product.scheduledDeletionPreviousState?.isHidden ??
            Boolean(product.isHidden),
          stockQuantity:
            product.scheduledDeletionPreviousState?.stockQuantity ??
            product.stockQuantity ??
            DEFAULT_STOCK,
          scheduledDeletionAt: null,
          scheduledDeletionPreviousState: null,
          updatedAt: action.updatedAt,
        })),
      };
    case 'delete':
      return {
        ...state,
        products: updateProduct(state.products, action.id, (product) => ({
          ...product,
          isDeleted: true,
          deletedAt: action.deletedAt,
          updatedAt: action.deletedAt,
        })),
      };
    case 'restore':
      return {
        ...state,
        products: state.products.map((product) => {
          if (product.id !== action.id || !product.isDeleted) return product;
          const previousState = product.scheduledDeletionPreviousState;
          return {
            ...product,
            isDeleted: false,
            deletedAt: null,
            isHidden: previousState?.isHidden ?? Boolean(product.isHidden),
            stockQuantity:
              previousState?.stockQuantity ?? product.stockQuantity,
            scheduledDeletionAt: null,
            scheduledDeletionPreviousState: null,
            updatedAt: action.updatedAt,
          };
        }),
      };
    case 'permanently-delete':
      if (
        !state.products.some(
          (product) => product.id === action.id && product.isDeleted,
        )
      ) {
        return state;
      }
      return {
        products: state.products.filter((product) => product.id !== action.id),
        deletedProductIds: Array.from(
          new Set([...state.deletedProductIds, action.id]),
        ),
      };
    case 'process-expired':
      return softDeleteExpiredProducts(state, action.today, action.deletedAt);
  }
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, readInitialState);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved: PersistedProductState = {
        version: STORAGE_VERSION,
        ...state,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      setStorageError(null);
    } catch (error) {
      console.error('Unable to save the Silver Hub product catalog.', error);
      setStorageError('Product changes could not be saved in this browser.');
    }
  }, [state]);

  const processScheduledDeletions = useCallback(() => {
    dispatch({
      type: 'process-expired',
      today: localDateKey(new Date()),
      deletedAt: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    processScheduledDeletions();
    let midnightTimer: number;
    const scheduleMidnightCheck = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      midnightTimer = window.setTimeout(() => {
        processScheduledDeletions();
        scheduleMidnightCheck();
      }, Math.max(1, nextMidnight.getTime() - now.getTime() + 10));
    };
    scheduleMidnightCheck();
    const checkWhenActive = () => {
      if (document.visibilityState === 'visible') {
        processScheduledDeletions();
      }
    };
    window.addEventListener('focus', processScheduledDeletions);
    document.addEventListener('visibilitychange', checkWhenActive);
    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener('focus', processScheduledDeletions);
      document.removeEventListener('visibilitychange', checkWhenActive);
    };
  }, [processScheduledDeletions]);

  const addProduct = useCallback(
    (input: NewProductInput) => {
      const sku = input.sku?.trim() || '';
      if (sku && state.products.some((product) => product.sku?.toLowerCase() === sku.toLowerCase())) {
        throw new Error('A product with this SKU already exists.');
      }
      if (!Number.isInteger(input.stockQuantity ?? DEFAULT_STOCK) || (input.stockQuantity ?? DEFAULT_STOCK) < 0) {
        throw new Error('Stock quantity must be a non-negative whole number.');
      }

      const id = Math.max(
        0,
        ...state.products.map((product) => product.id),
        ...state.deletedProductIds,
        ...seedCatalog.map((product) => product.id),
      ) + 1;
      const now = new Date().toISOString();
      const product = normalizeProduct(
        {
          ...input,
          id,
          sku: sku || `SH-${String(id).padStart(4, '0')}`,
          stockQuantity: input.stockQuantity ?? DEFAULT_STOCK,
          isHidden: false,
          isDeleted: false,
          deletedAt: null,
          scheduledDeletionAt: null,
          scheduledDeletionPreviousState: null,
          createdAt: now,
          updatedAt: now,
        },
        undefined,
        now,
      );
      dispatch({ type: 'add', product });
      return product;
    },
    [state.products, state.deletedProductIds],
  );

  const updateProduct = useCallback(
    (id: number, updates: ProductUpdate) => {
      const sku = updates.sku?.trim();
      if (
        sku &&
        state.products.some(
          (product) =>
            product.id !== id && product.sku?.toLowerCase() === sku.toLowerCase(),
        )
      ) {
        throw new Error('A product with this SKU already exists.');
      }
      if (
        updates.stockQuantity !== undefined &&
        (!Number.isInteger(updates.stockQuantity) || updates.stockQuantity < 0)
      ) {
        throw new Error('Stock quantity must be a non-negative whole number.');
      }
      dispatch({
        type: 'update',
        id,
        updates: { ...updates, ...(sku ? { sku } : {}) },
        updatedAt: new Date().toISOString(),
      });
    },
    [state.products],
  );

  const setProductHidden = useCallback((id: number, isHidden: boolean) => {
    dispatch({ type: 'hide', id, isHidden, updatedAt: new Date().toISOString() });
  }, []);

  const setStockQuantity = useCallback((id: number, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error('Stock quantity must be a non-negative whole number.');
    }
    dispatch({ type: 'stock', id, quantity, updatedAt: new Date().toISOString() });
  }, []);

  const scheduleDeletion = useCallback((id: number, date: string) => {
    if (!isValidDateKey(date) || date <= localDateKey(new Date())) {
      throw new Error('Choose a deletion date in the future.');
    }
    dispatch({ type: 'schedule', id, date, updatedAt: new Date().toISOString() });
  }, []);

  const cancelScheduledDeletion = useCallback((id: number) => {
    dispatch({ type: 'cancel-schedule', id, updatedAt: new Date().toISOString() });
  }, []);

  const softDeleteProduct = useCallback(
    (id: number) => {
      const product = state.products.find((item) => item.id === id);
      if (!product || product.isDeleted) {
        throw new Error('This product is no longer active.');
      }
      dispatch({ type: 'delete', id, deletedAt: new Date().toISOString() });
    },
    [state.products],
  );

  const restoreProduct = useCallback(
    (id: number) => {
      const product = state.products.find((item) => item.id === id);
      if (!product?.isDeleted) {
        throw new Error('This product is not in Recently Deleted.');
      }
      dispatch({ type: 'restore', id, updatedAt: new Date().toISOString() });
    },
    [state.products],
  );

  const permanentlyDeleteProduct = useCallback(
    (id: number) => {
      const product = state.products.find((item) => item.id === id);
      if (!product?.isDeleted) {
        throw new Error('Only deleted products can be permanently removed.');
      }
      dispatch({ type: 'permanently-delete', id });
    },
    [state.products],
  );

  const value = useMemo(
    () => ({
      products: state.products,
      deletedProductIds: state.deletedProductIds,
      storageError,
      addProduct,
      updateProduct,
      setProductHidden,
      setStockQuantity,
      scheduleDeletion,
      cancelScheduledDeletion,
      softDeleteProduct,
      restoreProduct,
      permanentlyDeleteProduct,
      processScheduledDeletions,
    }),
    [
      state,
      storageError,
      addProduct,
      updateProduct,
      setProductHidden,
      setStockQuantity,
      scheduleDeletion,
      cancelScheduledDeletion,
      softDeleteProduct,
      restoreProduct,
      permanentlyDeleteProduct,
      processScheduledDeletions,
    ],
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}
