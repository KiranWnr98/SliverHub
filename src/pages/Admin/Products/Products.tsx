import { useMemo, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Check,
  Clock3,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { useProductCatalog } from '../../../hooks/useProducts';
import { categories } from '../../../data/categories';
import type { Product } from '../../../types';
import type { NewProductInput } from '../../../context/ProductContextValue';
import './Products.css';

type ProductStatus = 'active' | 'out-of-stock' | 'hidden' | 'scheduled';
type ProductTab = 'all' | ProductStatus;
type ViewMode = 'table' | 'grid';
type SortOrder = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name';

interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  price: string;
  oldPrice: string;
  stockQuantity: string;
  description: string;
  image: string;
  isNew: boolean;
}

const tabLabels: Record<ProductTab, string> = {
  all: 'All Products',
  active: 'Active',
  'out-of-stock': 'Out of Stock',
  hidden: 'Hidden',
  scheduled: 'Scheduled Deletion',
};

const emptyForm = (category: string): ProductFormValues => ({
  name: '',
  sku: '',
  category,
  price: '',
  oldPrice: '',
  stockQuantity: '10',
  description: '',
  image: '',
  isNew: false,
});

function getProductStatus(product: Product): ProductStatus {
  if (product.scheduledDeletionAt) return 'scheduled';
  if (product.isHidden) return 'hidden';
  if ((product.stockQuantity ?? 0) <= 0) return 'out-of-stock';
  return 'active';
}

function productSku(product: Product): string {
  return product.sku || `SH-${String(product.id).padStart(4, '0')}`;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function tomorrowDateKey(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateKey(tomorrow);
}

function formatLocalDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('en-GB');
}

function formatDeletedAt(value?: string | null): string {
  if (!value) return 'Deletion date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Deletion date unavailable'
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function ProductThumbnail({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed || !product.image) {
    return (
      <div className="admin-product-thumb admin-product-thumb-fallback" role="img" aria-label={`${product.name} image unavailable`}>
        {product.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className="admin-product-thumb"
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

export default function Products() {
  const {
    products,
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
  } = useProductCatalog();

  const [selectedStatus, setSelectedStatus] = useState<ProductTab>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(
    () => emptyForm(categories[0]?.name ?? ''),
  );
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [deletionTarget, setDeletionTarget] = useState<Product | null>(null);
  const [deletionStep, setDeletionStep] = useState<'choose' | 'confirm' | 'schedule'>('choose');
  const [scheduledDate, setScheduledDate] = useState('');
  const [confirmSoftDelete, setConfirmSoftDelete] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const [permanentDeletionTarget, setPermanentDeletionTarget] =
    useState<Product | null>(null);
  const [confirmPermanentDeletion, setConfirmPermanentDeletion] =
    useState(false);
  const [permanentDeletionError, setPermanentDeletionError] = useState('');

  const activeProducts = useMemo(
    () => products.filter((product) => !product.isDeleted),
    [products],
  );
  const recentlyDeleted = useMemo(
    () =>
      products
        .filter((product) => product.isDeleted)
        .sort((left, right) =>
          (right.deletedAt ?? '').localeCompare(left.deletedAt ?? ''),
        ),
    [products],
  );

  const categoriesForProducts = useMemo(
    () => Array.from(new Set([...categories.map((category) => category.name), ...activeProducts.map((product) => product.category)])),
    [activeProducts],
  );

  const counts = useMemo(() => {
    const result: Record<ProductTab, number> = {
      all: activeProducts.length,
      active: 0,
      'out-of-stock': 0,
      hidden: 0,
      scheduled: 0,
    };
    for (const product of activeProducts) {
      result[getProductStatus(product)] += 1;
    }
    return result;
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = activeProducts.filter((product) => {
      const productStatus = getProductStatus(product);
      const matchesStatus =
        selectedStatus === 'all' || productStatus === selectedStatus;
      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        productSku(product).toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesCategory && matchesSearch;
    });

    return filtered.sort((left, right) => {
      switch (sortOrder) {
        case 'oldest':
          return (
            (left.createdAt ?? '').localeCompare(right.createdAt ?? '') ||
            left.id - right.id
          );
        case 'price-low':
          return left.price - right.price || left.name.localeCompare(right.name);
        case 'price-high':
          return right.price - left.price || left.name.localeCompare(right.name);
        case 'name':
          return left.name.localeCompare(right.name);
        case 'newest':
        default:
          return (
            (right.createdAt ?? '').localeCompare(left.createdAt ?? '') ||
            right.id - left.id
          );
      }
    });
  }, [activeProducts, search, selectedStatus, categoryFilter, sortOrder]);

  const openProductForm = (product?: Product) => {
    setEditingId(product?.id ?? null);
    setFormValues(
      product
        ? {
            name: product.name,
            sku: productSku(product),
            category: product.category,
            price: String(product.price),
            oldPrice: product.oldPrice == null ? '' : String(product.oldPrice),
            stockQuantity: String(product.stockQuantity ?? 0),
            description: product.description ?? '',
            image: product.image,
            isNew: Boolean(product.isNew),
          }
        : emptyForm(categoriesForProducts[0] ?? ''),
    );
    setFormError('');
    setPageError('');
    setFormOpen(true);
  };

  const closeProductForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const submitProductForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const name = formValues.name.trim();
    const sku = formValues.sku.trim();
    const category = formValues.category.trim();
    const price = Number(formValues.price);
    const oldPrice =
      formValues.oldPrice.trim() === '' ? undefined : Number(formValues.oldPrice);
    const stockQuantity = Number(formValues.stockQuantity);
    const image = formValues.image.trim();

    if (!name || !sku || !category || !image) {
      setFormError('Complete all required fields before saving.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Selling price must be greater than zero.');
      return;
    }
    if (
      oldPrice !== undefined &&
      (!Number.isFinite(oldPrice) || oldPrice <= 0)
    ) {
      setFormError('Original price must be greater than zero.');
      return;
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setFormError('Stock quantity must be a non-negative whole number.');
      return;
    }
    if (!/^https?:\/\//i.test(image) && !image.startsWith('/images/')) {
      setFormError('Use an https image URL or a path inside /images/.');
      return;
    }
    if (
      products.some(
        (product) =>
          product.id !== editingId &&
          productSku(product).toLowerCase() === sku.toLowerCase(),
      )
    ) {
      setFormError('A product with this SKU already exists.');
      return;
    }

    const values: NewProductInput = {
      name,
      sku,
      category,
      price,
      oldPrice: oldPrice ?? null,
      stockQuantity,
      description: formValues.description.trim(),
      image,
      rating: editingId
        ? products.find((product) => product.id === editingId)?.rating ?? '0.0'
        : '0.0',
      isNew: formValues.isNew,
    };

    try {
      if (editingId === null) {
        addProduct({ ...values, isFeatured: false });
      } else {
        updateProduct(editingId, values);
      }
      closeProductForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save this product.');
    }
  };

  const openDeletionWorkflow = (product: Product) => {
    setDeletionTarget(product);
    setDeletionStep(product.scheduledDeletionAt ? 'schedule' : 'choose');
    setScheduledDate(product.scheduledDeletionAt ?? '');
    setConfirmSoftDelete(false);
    setDeletionError('');
    setPageError('');
  };

  const closeDeletionWorkflow = () => {
    setDeletionTarget(null);
    setDeletionError('');
  };

  const confirmSchedule = () => {
    if (!deletionTarget || !scheduledDate) {
      setDeletionError('Select a future deletion date.');
      return;
    }
    if (scheduledDate <= localDateKey(new Date())) {
      setDeletionError('Choose a date after today.');
      return;
    }
    try {
      scheduleDeletion(deletionTarget.id, scheduledDate);
      closeDeletionWorkflow();
    } catch (error) {
      setDeletionError(error instanceof Error ? error.message : 'Unable to schedule deletion.');
    }
  };

  const confirmDelete = () => {
    if (!deletionTarget || !confirmSoftDelete) return;
    try {
      softDeleteProduct(deletionTarget.id);
      closeDeletionWorkflow();
    } catch (error) {
      setDeletionError(
        error instanceof Error ? error.message : 'Unable to delete this product.',
      );
    }
  };

  const restoreDeletedProduct = (product: Product) => {
    try {
      restoreProduct(product.id);
      setPageError('');
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Unable to restore this product.',
      );
    }
  };

  const openPermanentDeletionConfirmation = (product: Product) => {
    setPermanentDeletionTarget(product);
    setConfirmPermanentDeletion(false);
    setPermanentDeletionError('');
  };

  const closePermanentDeletionConfirmation = () => {
    setPermanentDeletionTarget(null);
    setConfirmPermanentDeletion(false);
    setPermanentDeletionError('');
  };

  const confirmPermanentDeletionAction = () => {
    if (!permanentDeletionTarget || !confirmPermanentDeletion) return;
    try {
      permanentlyDeleteProduct(permanentDeletionTarget.id);
      closePermanentDeletionConfirmation();
      setPageError('');
    } catch (error) {
      setPermanentDeletionError(
        error instanceof Error
          ? error.message
          : 'Unable to permanently delete this product.',
      );
    }
  };

  const changeStock = (product: Product, value: string) => {
    if (product.scheduledDeletionAt || value.trim() === '') return;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    try {
      setStockQuantity(product.id, quantity);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update stock.');
    }
  };

  const toggleVisibility = (product: Product) => {
    try {
      setProductHidden(product.id, !product.isHidden);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update visibility.');
    }
  };

  const toggleStock = (product: Product) => {
    try {
      setStockQuantity(
        product.id,
        (product.stockQuantity ?? 0) > 0 ? 0 : 1,
      );
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update stock.');
    }
  };

  return (
    <section className="admin-products-page">
      <header className="products-page-heading">
        <div>
          <span className="products-eyebrow">ADMIN STUDIO</span>
          <h1>Products</h1>
          <p>Manage your Silver Hub product catalog.</p>
        </div>
        <div className="products-heading-actions">
          <span className="products-total">{activeProducts.length} products</span>
          <button type="button" className="products-primary-button" onClick={() => openProductForm()}>
            <Plus size={17} /> Add Product
          </button>
        </div>
      </header>

      {storageError && <p className="products-alert" role="alert">{storageError}</p>}
      {pageError && <p className="products-alert" role="alert">{pageError}</p>}

      <div className="products-tabs" role="tablist" aria-label="Product status">
        {(Object.keys(tabLabels) as ProductTab[]).map((key) => (
          <button
            type="button"
            role="tab"
            aria-selected={selectedStatus === key}
            className={selectedStatus === key ? 'selected' : ''}
            key={key}
            onClick={() => setSelectedStatus(key)}
          >
            {tabLabels[key]} <span>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="products-toolbar">
        <label className="products-search">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, SKU or category"
            aria-label="Search products by name, SKU or category"
          />
        </label>

        <label className="products-select">
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {categoriesForProducts.map((category) => (
              <option value={category} key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="products-select">
          <span>Status</span>
          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value as ProductTab)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="hidden">Hidden</option>
            <option value="scheduled">Scheduled Deletion</option>
          </select>
        </label>

        <label className="products-select products-sort">
          <span>Sort by</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-low">Lowest price</option>
            <option value="price-high">Highest price</option>
            <option value="name">Alphabetical</option>
          </select>
        </label>

        <div className="products-view-toggle" aria-label="Product layout">
          <button
            type="button"
            className={viewMode === 'table' ? 'selected' : ''}
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
            onClick={() => setViewMode('table')}
          >
            <List size={18} />
          </button>
          <button
            type="button"
            className={viewMode === 'grid' ? 'selected' : ''}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="products-empty-state">
          <Package size={28} />
          <h2>No products found</h2>
          <p>Try changing your search or filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="products-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">SKU</th>
                <th scope="col">Category</th>
                <th scope="col">Selling price</th>
                <th scope="col">Stock quantity</th>
                <th scope="col">Stock status</th>
                <th scope="col">Visibility</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const status = getProductStatus(product);
                const stock = product.stockQuantity ?? 0;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="products-product-cell">
                        <ProductThumbnail product={product} />
                        <div>
                          <strong>{product.name}</strong>
                          {product.isNew && <small className="products-new-label">New arrival</small>}
                        </div>
                      </div>
                    </td>
                    <td>{productSku(product)}</td>
                    <td>{product.category}</td>
                    <td>₹{product.price.toLocaleString('en-IN')}</td>
                    <td>
                      <input
                        className="products-stock-input"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={stock}
                        key={`${product.id}-${stock}`}
                        aria-label={`Stock quantity for ${product.name}`}
                        disabled={Boolean(product.scheduledDeletionAt)}
                        onBlur={(event) => changeStock(product, event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <span className={`products-badge stock-${stock === 0 ? 'empty' : 'available'}`}>
                        {stock === 0 ? 'Out of stock' : `${stock} in stock`}
                      </span>
                    </td>
                    <td>
                      <span className={`products-badge visibility-${status}`}>
                        {status === 'scheduled'
                          ? 'Deletion scheduled'
                          : status === 'hidden'
                            ? 'Hidden'
                            : product.isHidden
                              ? 'Hidden'
                              : 'Visible'}
                      </span>
                    </td>
                    <td>
                      <ProductActions
                        product={product}
                        onEdit={() => openProductForm(product)}
                        onToggleVisibility={() => toggleVisibility(product)}
                        onToggleStock={() => toggleStock(product)}
                        onDelete={() => openDeletionWorkflow(product)}
                        onCancelSchedule={() => cancelScheduledDeletion(product.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => {
            const status = getProductStatus(product);
            return (
              <article className="products-grid-card" key={product.id}>
                <div className="products-grid-image">
                  <ProductThumbnail product={product} />
                  <span className={`products-badge visibility-${status}`}>
                    {status === 'scheduled'
                      ? 'Deletion scheduled'
                      : status === 'hidden'
                        ? 'Hidden'
                        : status === 'out-of-stock'
                          ? 'Out of stock'
                          : 'Active'}
                  </span>
                </div>
                <div className="products-grid-card-body">
                  <span>{product.category} · {productSku(product)}</span>
                  <h2>{product.name}</h2>
                  <div className="products-grid-meta">
                    <strong>₹{product.price.toLocaleString('en-IN')}</strong>
                    <span>{product.stockQuantity ?? 0} in stock</span>
                  </div>
                  {product.scheduledDeletionAt && (
                    <p className="products-scheduled-date">
                      Deletion on {formatLocalDate(product.scheduledDeletionAt)}
                    </p>
                  )}
                  <ProductActions
                    product={product}
                    onEdit={() => openProductForm(product)}
                    onToggleVisibility={() => toggleVisibility(product)}
                    onToggleStock={() => toggleStock(product)}
                    onDelete={() => openDeletionWorkflow(product)}
                    onCancelSchedule={() => cancelScheduledDeletion(product.id)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <section className="products-trash-section" aria-labelledby="recently-deleted-heading">
        <header className="products-trash-heading">
          <div>
            <span className="products-eyebrow">PRODUCT HISTORY</span>
            <h2 id="recently-deleted-heading">Recently Deleted</h2>
            <p>Restore removed products or permanently delete their records.</p>
          </div>
          <span className="products-total">
            {recentlyDeleted.length} {recentlyDeleted.length === 1 ? 'product' : 'products'}
          </span>
        </header>

        {recentlyDeleted.length === 0 ? (
          <p className="products-trash-empty">Deleted products will appear here.</p>
        ) : (
          <div className="products-trash-grid">
            {recentlyDeleted.map((product) => (
              <article className="products-trash-card" key={product.id}>
                <div className="products-trash-image">
                  <ProductThumbnail product={product} />
                </div>
                <div className="products-trash-card-body">
                  <h3>{product.name}</h3>
                  <span className="products-trash-sku">{productSku(product)}</span>
                  <p>Deleted {formatDeletedAt(product.deletedAt)}</p>
                  <div className="products-trash-actions">
                    <button
                      type="button"
                      className="products-secondary-button"
                      onClick={() => restoreDeletedProduct(product)}
                    >
                      <RotateCcw size={15} /> Restore
                    </button>
                    <button
                      type="button"
                      className="products-danger-button"
                      onClick={() => openPermanentDeletionConfirmation(product)}
                    >
                      <Trash2 size={15} /> Permanently Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <div className="products-modal-backdrop" onMouseDown={closeProductForm}>
          <section
            className="products-modal products-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PRODUCT CATALOG</span>
                <h2 id="product-form-title">{editingId === null ? 'Add Product' : 'Edit Product'}</h2>
              </div>
              <button type="button" className="products-icon-button" aria-label="Close form" onClick={closeProductForm}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={submitProductForm}>
              <div className="products-form-grid">
                <label>
                  Product name *
                  <input value={formValues.name} onChange={(event) => setFormValues({ ...formValues, name: event.target.value })} required />
                </label>
                <label>
                  SKU *
                  <input value={formValues.sku} onChange={(event) => setFormValues({ ...formValues, sku: event.target.value })} required />
                </label>
                <label>
                  Category *
                  <select value={formValues.category} onChange={(event) => setFormValues({ ...formValues, category: event.target.value })} required>
                    {categoriesForProducts.map((category) => <option value={category} key={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Selling price (₹) *
                  <input type="number" min="0.01" step="0.01" value={formValues.price} onChange={(event) => setFormValues({ ...formValues, price: event.target.value })} required />
                </label>
                <label>
                  Original price (₹)
                  <input type="number" min="0.01" step="0.01" value={formValues.oldPrice} onChange={(event) => setFormValues({ ...formValues, oldPrice: event.target.value })} />
                </label>
                <label>
                  Stock quantity *
                  <input type="number" min="0" step="1" value={formValues.stockQuantity} onChange={(event) => setFormValues({ ...formValues, stockQuantity: event.target.value })} required />
                </label>
                <label className="products-form-wide">
                  Product image URL or /images/ path *
                  <input value={formValues.image} onChange={(event) => setFormValues({ ...formValues, image: event.target.value })} required />
                </label>
                {formValues.image && (
                  <div className="products-image-preview">
                    <ProductThumbnail
                      product={{
                        id: editingId ?? 0,
                        name: formValues.name || 'Product image preview',
                        category: formValues.category,
                        price: 0,
                        rating: '0',
                        image: formValues.image,
                      }}
                    />
                    <span>Image preview · Files should be stored in public/images.</span>
                  </div>
                )}
                <label className="products-form-wide">
                  Description
                  <textarea rows={3} value={formValues.description} onChange={(event) => setFormValues({ ...formValues, description: event.target.value })} />
                </label>
                <label className="products-checkbox products-form-wide">
                  <input type="checkbox" checked={formValues.isNew} onChange={(event) => setFormValues({ ...formValues, isNew: event.target.checked })} />
                  Show in New Arrivals
                </label>
              </div>
              {formError && <p className="products-form-error" role="alert">{formError}</p>}
              <footer className="products-modal-actions">
                <button type="button" className="products-secondary-button" onClick={closeProductForm}>Cancel</button>
                <button type="submit" className="products-primary-button"><Check size={16} /> Save Product</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {deletionTarget && (
        <div className="products-modal-backdrop" onMouseDown={closeDeletionWorkflow}>
          <section
            className="products-modal products-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PRODUCT REMOVAL</span>
                <h2 id="product-delete-title">
                  {deletionTarget.scheduledDeletionAt ? 'Manage scheduled deletion' : 'Delete product'}
                </h2>
              </div>
              <button type="button" className="products-icon-button" aria-label="Close deletion options" onClick={closeDeletionWorkflow}>
                <X size={20} />
              </button>
            </header>

            <p className="products-delete-product-name">{deletionTarget.name}</p>

            {deletionStep === 'choose' && (
              <div className="products-delete-options">
                <button type="button" onClick={() => setDeletionStep('confirm')}>
                  <Trash2 size={20} />
                  <span><strong>Move to Recently Deleted</strong><small>Hide it from the catalog now and restore it later if needed.</small></span>
                </button>
                <button type="button" onClick={() => setDeletionStep('schedule')}>
                  <CalendarDays size={20} />
                  <span><strong>Schedule deletion</strong><small>Choose any future date. The product is hidden immediately.</small></span>
                </button>
              </div>
            )}

            {deletionStep === 'confirm' && (
              <div className="products-delete-confirm">
                <p>
                  Move <strong>{deletionTarget.name}</strong> to Recently Deleted?
                  It will disappear from customer pages and can be restored later.
                </p>
                <label className="products-checkbox">
                  <input type="checkbox" checked={confirmSoftDelete} onChange={(event) => setConfirmSoftDelete(event.target.checked)} />
                  I understand this product will be removed from the active catalog.
                </label>
                {deletionError && <p className="products-form-error" role="alert">{deletionError}</p>}
                <footer className="products-modal-actions">
                  <button type="button" className="products-secondary-button" onClick={() => setDeletionStep('choose')}>Back</button>
                  <button type="button" className="products-danger-button" disabled={!confirmSoftDelete} onClick={confirmDelete}>
                    <Trash2 size={16} /> Move to Recently Deleted
                  </button>
                </footer>
              </div>
            )}

            {deletionStep === 'schedule' && (
              <div className="products-schedule-form">
                <p>
                  {deletionTarget.scheduledDeletionAt
                    ? `Currently scheduled for ${formatLocalDate(deletionTarget.scheduledDeletionAt)}.`
                    : 'This product will be hidden from customers until deletion is processed.'}
                </p>
                <label>
                  <span><CalendarDays size={16} /> Deletion date</span>
                  <input
                    type="date"
                    min={tomorrowDateKey()}
                    value={scheduledDate}
                    onChange={(event) => setScheduledDate(event.target.value)}
                  />
                </label>
                {scheduledDate && (
                  <p className="products-schedule-preview">
                    Scheduled deletion: <strong>{formatLocalDate(scheduledDate)}</strong>
                  </p>
                )}
                {deletionError && <p className="products-form-error" role="alert">{deletionError}</p>}
                <footer className="products-modal-actions">
                  {deletionTarget.scheduledDeletionAt && (
                    <button
                      type="button"
                      className="products-secondary-button"
                      onClick={() => {
                        setConfirmSoftDelete(false);
                        setDeletionStep('confirm');
                      }}
                    >
                      <Trash2 size={15} /> Delete now
                    </button>
                  )}
                  {deletionTarget.scheduledDeletionAt && (
                    <button
                      type="button"
                      className="products-secondary-button products-cancel-schedule"
                      onClick={() => {
                        cancelScheduledDeletion(deletionTarget.id);
                        closeDeletionWorkflow();
                      }}
                    >
                      <RotateCcw size={15} /> Cancel schedule
                    </button>
                  )}
                  <button type="button" className="products-secondary-button" onClick={closeDeletionWorkflow}>Cancel</button>
                  <button type="button" className="products-primary-button" onClick={confirmSchedule}>
                    <Clock3 size={16} /> {deletionTarget.scheduledDeletionAt ? 'Update date' : 'Confirm schedule'}
                  </button>
                </footer>
              </div>
            )}
          </section>
        </div>
      )}

      {permanentDeletionTarget && (
        <div
          className="products-modal-backdrop"
          onMouseDown={closePermanentDeletionConfirmation}
        >
          <section
            className="products-modal products-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permanent-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PERMANENT REMOVAL</span>
                <h2 id="permanent-delete-title">Permanently delete product?</h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close permanent deletion confirmation"
                onClick={closePermanentDeletionConfirmation}
              >
                <X size={20} />
              </button>
            </header>

            <p className="products-delete-product-name">
              {permanentDeletionTarget.name}
            </p>
            <p className="products-permanent-delete-warning">
              This permanently removes the product record from this browser's
              local product catalog. It cannot be restored.
            </p>
            <label className="products-checkbox">
              <input
                type="checkbox"
                checked={confirmPermanentDeletion}
                onChange={(event) =>
                  setConfirmPermanentDeletion(event.target.checked)
                }
              />
              I understand this product record will be permanently removed.
            </label>
            {permanentDeletionError && (
              <p className="products-form-error" role="alert">
                {permanentDeletionError}
              </p>
            )}
            <footer className="products-modal-actions">
              <button
                type="button"
                className="products-secondary-button"
                onClick={closePermanentDeletionConfirmation}
              >
                Cancel
              </button>
              <button
                type="button"
                className="products-danger-button"
                disabled={!confirmPermanentDeletion}
                onClick={confirmPermanentDeletionAction}
              >
                <Trash2 size={16} /> Permanently Delete
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

function ProductActions({
  product,
  onEdit,
  onToggleVisibility,
  onToggleStock,
  onDelete,
  onCancelSchedule,
}: {
  product: Product;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onToggleStock: () => void;
  onDelete: () => void;
  onCancelSchedule: () => void;
}) {
  return (
    <div className="products-row-actions">
      <button type="button" aria-label={`Edit ${product.name}`} title="Edit product" onClick={onEdit}>
        <Pencil size={15} />
      </button>
      {!product.scheduledDeletionAt && (
        <button
          type="button"
          aria-label={`${(product.stockQuantity ?? 0) > 0 ? 'Mark out of stock' : 'Mark in stock'}: ${product.name}`}
          title={(product.stockQuantity ?? 0) > 0 ? 'Mark out of stock' : 'Mark in stock'}
          onClick={onToggleStock}
        >
          {(product.stockQuantity ?? 0) > 0 ? <X size={15} /> : <Check size={15} />}
        </button>
      )}
      {!product.scheduledDeletionAt && (
        <button
          type="button"
          aria-label={`${product.isHidden ? 'Show' : 'Hide'} ${product.name}`}
          title={product.isHidden ? 'Show product' : 'Hide product'}
          onClick={onToggleVisibility}
        >
          {product.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      )}
      {product.scheduledDeletionAt ? (
        <button type="button" aria-label={`Edit deletion schedule for ${product.name}`} title="Edit deletion schedule" onClick={onDelete}>
          <CalendarDays size={15} />
        </button>
      ) : (
        <button type="button" aria-label={`Delete ${product.name}`} title="Delete product" onClick={onDelete}>
          <Trash2 size={15} />
        </button>
      )}
      {product.scheduledDeletionAt && (
        <button type="button" aria-label={`Cancel deletion schedule for ${product.name}`} title="Cancel scheduled deletion" onClick={onCancelSchedule}>
          <RotateCcw size={15} />
        </button>
      )}
    </div>
  );
}
