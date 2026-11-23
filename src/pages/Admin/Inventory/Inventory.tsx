import { useContext, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  X,
} from 'lucide-react';
import { ProductContext } from '../../../context/ProductContextValue';
import type { Product } from '../../../types';
import './Inventory.css';

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type AdjustmentMode = 'add' | 'remove' | 'set';

interface StockMovement {
  id: string;
  productId: number;
  productName: string;
  sku: string;
  change: number;
  before: number;
  after: number;
  reason: string;
  createdAt: string;
}

const MOVEMENTS_KEY = 'silverhub-inventory-movements';
const LOW_STOCK_THRESHOLD = 5;

function getStock(product: Product): number {
  return Number.isInteger(product.stockQuantity) && (product.stockQuantity ?? -1) >= 0
    ? product.stockQuantity!
    : 0;
}

function getStockStatus(quantity: number): StockFilter {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low-stock';
  return 'in-stock';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function readMovements(): StockMovement[] {
  try {
    const value = localStorage.getItem(MOVEMENTS_KEY);
    if (!value) return [];
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as StockMovement[]) : [];
  } catch {
    return [];
  }
}

function downloadCsv(products: Product[]) {
  const rows = [
    ['SKU', 'Product', 'Category', 'Current Stock', 'Stock Status'],
    ...products.map((product) => {
      const quantity = getStock(product);
      return [
        product.sku ?? '',
        product.name,
        product.category,
        String(quantity),
        getStockStatus(quantity),
      ];
    }),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'silverhub-inventory.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function Inventory() {
  const inventoryContext = useContext(ProductContext);
  const products = inventoryContext?.products ?? [];
  const setStockQuantity = inventoryContext?.setStockQuantity;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('add');
  const [adjustmentProductId, setAdjustmentProductId] = useState<number | ''>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('1');
  const [adjustmentReason, setAdjustmentReason] = useState('Restock');
  const [formError, setFormError] = useState('');
  const [movements, setMovements] = useState<StockMovement[]>(readMovements);

  const activeProducts = useMemo(
    () => products.filter((product) => !product.isDeleted && !product.isHidden),
    [products],
  );

  const categories = useMemo(
    () => Array.from(new Set(activeProducts.map((product) => product.category))).sort(),
    [activeProducts],
  );

  const stockSummary = useMemo(() => {
    const summary = { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
    activeProducts.forEach((product) => {
      const quantity = getStock(product);
      summary.total += quantity;
      const status = getStockStatus(quantity);
      if (status === 'in-stock') summary.inStock += 1;
      if (status === 'low-stock') summary.lowStock += 1;
      if (status === 'out-of-stock') summary.outOfStock += 1;
    });
    return summary;
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...activeProducts]
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          (product.sku ?? '').toLowerCase().includes(query);
        const matchesCategory =
          categoryFilter === 'all' || product.category === categoryFilter;
        const matchesStock =
          stockFilter === 'all' || getStockStatus(getStock(product)) === stockFilter;
        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeProducts, search, categoryFilter, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);
  const selectedProduct =
    activeProducts.find((product) => product.id === selectedProductId) ??
    visibleProducts[0] ??
    activeProducts[0];

  const restockAlerts = activeProducts
    .filter((product) => getStock(product) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => getStock(a) - getStock(b))
    .slice(0, 4);

  function openAdjustment(product?: Product, mode: AdjustmentMode = 'add') {
    setAdjustmentProductId(product?.id ?? selectedProduct?.id ?? '');
    setAdjustmentMode(mode);
    setAdjustmentAmount('1');
    setAdjustmentReason(mode === 'add' ? 'Restock' : 'Stock correction');
    setFormError('');
    setShowAdjustment(true);
  }

  function saveAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!setStockQuantity || adjustmentProductId === '') return;

    const amount = Number(adjustmentAmount);
    if (!Number.isInteger(amount) || amount < 0 || (adjustmentMode !== 'set' && amount === 0)) {
      setFormError('Enter a valid whole number greater than zero.');
      return;
    }

    const product = activeProducts.find((item) => item.id === Number(adjustmentProductId));
    if (!product) {
      setFormError('Please select a valid product.');
      return;
    }

    const before = getStock(product);
    const after =
      adjustmentMode === 'add'
        ? before + amount
        : adjustmentMode === 'remove'
          ? before - amount
          : amount;

    if (after < 0) {
      setFormError(`Only ${before} item(s) are currently available.`);
      return;
    }

    try {
      setStockQuantity(product.id, after);
      const movement: StockMovement = {
        id: `${Date.now()}-${product.id}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku ?? '',
        change: after - before,
        before,
        after,
        reason: adjustmentReason.trim() || 'Manual adjustment',
        createdAt: new Date().toISOString(),
      };
      const next = [movement, ...movements].slice(0, 250);
      setMovements(next);
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(next));
      setSelectedProductId(product.id);
      setShowAdjustment(false);
    } catch {
      setFormError('Stock could not be updated. Please try again.');
    }
  }

  if (!inventoryContext) {
    return (
      <main className="inventory-page">
        <div className="inventory-empty">
          <Package size={28} />
          <h2>Inventory is not connected</h2>
          <p>Make sure Inventory is rendered inside the ProductProvider.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="inventory-page">
      <div className="inventory-header">
        <div>
          <span className="inventory-eyebrow">ADMIN STUDIO</span>
          <h1>Inventory</h1>
          <p>Track stock levels, manage inventory, and restock your jewellery collection.</p>
        </div>
        <div className="inventory-header-actions">
          <button className="inventory-button inventory-button-light" onClick={() => openAdjustment()}>
            <RefreshCw size={16} /> Stock Adjustment
          </button>
          <button className="inventory-button inventory-button-light" onClick={() => downloadCsv(activeProducts)}>
            <Download size={16} /> Export CSV
          </button>
          <button className="inventory-button inventory-button-primary" onClick={() => openAdjustment(undefined, 'add')}>
            <Plus size={17} /> Add Stock
          </button>
        </div>
      </div>

      <section className="inventory-stats" aria-label="Stock summary">
        <article className="inventory-stat">
          <span className="inventory-stat-icon stat-total"><Package /></span>
          <div><strong>{stockSummary.total}</strong><span>Total Stock Items</span></div>
        </article>
        <article className="inventory-stat">
          <span className="inventory-stat-icon stat-good"><CheckCircle2 /></span>
          <div><strong>{stockSummary.inStock}</strong><span>Products In Stock</span></div>
        </article>
        <article className="inventory-stat">
          <span className="inventory-stat-icon stat-low"><AlertTriangle /></span>
          <div><strong>{stockSummary.lowStock}</strong><span>Low Stock</span></div>
        </article>
        <article className="inventory-stat">
          <span className="inventory-stat-icon stat-out"><Package /></span>
          <div><strong>{stockSummary.outOfStock}</strong><span>Out of Stock</span></div>
        </article>
      </section>

      <section className="inventory-overview">
        <article className="inventory-panel stock-overview-panel">
          <div className="inventory-panel-heading">
            <h2>Stock Overview</h2>
            <span>By product count</span>
          </div>
          <div className="stock-overview-content">
            <div
              className="stock-donut"
              style={{
                background: `conic-gradient(#55ad57 0 ${(stockSummary.inStock / Math.max(activeProducts.length, 1)) * 100}%, #f2bd42 ${(stockSummary.inStock / Math.max(activeProducts.length, 1)) * 100}% ${((stockSummary.inStock + stockSummary.lowStock) / Math.max(activeProducts.length, 1)) * 100}%, #d93b3b ${((stockSummary.inStock + stockSummary.lowStock) / Math.max(activeProducts.length, 1)) * 100}% 100%)`,
              }}
            >
              <div><strong>{activeProducts.length}</strong><span>Products</span></div>
            </div>
            <div className="stock-legend">
              <p><i className="legend-dot dot-good" /> In Stock <strong>{stockSummary.inStock}</strong></p>
              <p><i className="legend-dot dot-low" /> Low Stock <strong>{stockSummary.lowStock}</strong></p>
              <p><i className="legend-dot dot-out" /> Out of Stock <strong>{stockSummary.outOfStock}</strong></p>
            </div>
          </div>
        </article>

        <article className="inventory-panel movement-panel">
          <div className="inventory-panel-heading">
            <h2>Stock Movement</h2>
            <button className="inventory-text-button" onClick={() => setShowMovements(true)}>View history <ArrowRight size={14} /></button>
          </div>
          {movements.length ? (
            <div className="movement-summary">
              <div className="movement-summary-icon"><TrendingUp size={22} /></div>
              <div><strong>{movements.length} recorded adjustments</strong><span>Latest: {formatDate(movements[0].createdAt)}</span></div>
            </div>
          ) : (
            <div className="movement-empty">
              <BarChart3 size={27} />
              <strong>No stock movements yet</strong>
              <span>Stock adjustments will appear here as you record them.</span>
            </div>
          )}
        </article>

        <article className="inventory-panel restock-panel">
          <div className="inventory-panel-heading"><h2><AlertTriangle size={17} /> Restock Alerts</h2></div>
          {restockAlerts.length ? restockAlerts.map((product) => (
            <button className="restock-item" key={product.id} onClick={() => setSelectedProductId(product.id)}>
              <img src={product.image} alt="" />
              <span><strong>{product.name}</strong><em>{getStock(product) === 0 ? 'Out of stock' : `Only ${getStock(product)} left`}</em></span>
              <ChevronRight size={17} />
            </button>
          )) : <p className="restock-clear">All products are above the low-stock threshold.</p>}
        </article>
      </section>

      <section className="inventory-workspace">
        <div className="inventory-list-column">
          <div className="inventory-toolbar">
            <label className="inventory-search">
              <Search size={17} />
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search product name, SKU, or category..." />
            </label>
            <label className="inventory-select-label">Category:
              <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}>
                <option value="all">All Categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="inventory-select-label">Stock Status:
              <select value={stockFilter} onChange={(event) => { setStockFilter(event.target.value as StockFilter); setPage(1); }}>
                <option value="all">All Statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </label>
            <button className="inventory-filter-button" title="Reset filters" onClick={() => { setSearch(''); setCategoryFilter('all'); setStockFilter('all'); setPage(1); }}><Filter size={18} /></button>
          </div>

          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead><tr>
                <th>#</th><th>Product</th><th>SKU</th><th>Category</th><th>Current Stock</th><th>Status</th><th>Min. Stock</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {visibleProducts.map((product, index) => {
                  const quantity = getStock(product);
                  const status = getStockStatus(quantity);
                  return (
                    <tr key={product.id} className={selectedProduct?.id === product.id ? 'is-selected' : ''} onClick={() => setSelectedProductId(product.id)}>
                      <td>{(page - 1) * pageSize + index + 1}</td>
                      <td><div className="inventory-product-cell"><img src={product.image} alt={product.name} /><strong>{product.name}</strong></div></td>
                      <td>{product.sku || `SH-${String(product.id).padStart(4, '0')}`}</td>
                      <td>{product.category}</td>
                      <td className="stock-quantity">{quantity}</td>
                      <td><span className={`stock-status status-${status}`}>{status === 'in-stock' ? 'In Stock' : status === 'low-stock' ? 'Low Stock' : 'Out of Stock'}</span></td>
                      <td>{LOW_STOCK_THRESHOLD}</td>
                      <td><div className="inventory-row-actions">
                        <button title="Adjust stock" onClick={(event) => { event.stopPropagation(); openAdjustment(product, 'set'); }}><Edit3 size={15} /></button>
                        <button title="Add stock" onClick={(event) => { event.stopPropagation(); openAdjustment(product, 'add'); }}><RefreshCw size={15} /></button>
                        <button title="View movements" onClick={(event) => { event.stopPropagation(); setSelectedProductId(product.id); setShowMovements(true); }}><BarChart3 size={15} /></button>
                      </div></td>
                    </tr>
                  );
                })}
                {!visibleProducts.length && <tr><td colSpan={8} className="inventory-no-results">No products match these filters.</td></tr>}
              </tbody>
            </table>
            <div className="inventory-pagination">
              <span>Showing {filteredProducts.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length} products</span>
              <div className="inventory-page-controls">
                <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></button>
                <strong>{page} / {totalPages}</strong>
                <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></button>
              </div>
              <label>Show <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={8}>8</option><option value={12}>12</option><option value={20}>20</option></select> per page</label>
            </div>
          </div>
        </div>

        <aside className="inventory-detail-panel">
          <div className="inventory-panel-heading"><h2>Product Stock Details</h2></div>
          {selectedProduct ? (
            <>
              <img className="inventory-detail-image" src={selectedProduct.image} alt={selectedProduct.name} />
              <div className="inventory-detail-title"><h3>{selectedProduct.name}</h3><span className={`stock-status status-${getStockStatus(getStock(selectedProduct))}`}>{getStockStatus(getStock(selectedProduct)).replaceAll('-', ' ')}</span></div>
              <dl className="inventory-detail-list">
                <div><dt>SKU</dt><dd>{selectedProduct.sku || `SH-${String(selectedProduct.id).padStart(4, '0')}`}</dd></div>
                <div><dt>Category</dt><dd>{selectedProduct.category}</dd></div>
                <div><dt>Current Stock</dt><dd>{getStock(selectedProduct)}</dd></div>
                <div><dt>Minimum Stock</dt><dd>{LOW_STOCK_THRESHOLD}</dd></div>
                <div><dt>Unit Price</dt><dd>₹{selectedProduct.price.toLocaleString('en-IN')}</dd></div>
              </dl>
              <div className="inventory-detail-actions">
                <button className="inventory-button inventory-button-primary" onClick={() => openAdjustment(selectedProduct, 'add')}><RefreshCw size={15} /> Adjust Stock</button>
                <button className="inventory-button inventory-button-light" onClick={() => setShowMovements(true)}><BarChart3 size={15} /> View Movements</button>
              </div>
            </>
          ) : <div className="inventory-no-selection">Add products to your catalogue to manage their stock here.</div>}
        </aside>
      </section>

      {showAdjustment && (
        <div className="inventory-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAdjustment(false); }}>
          <section className="inventory-modal" role="dialog" aria-modal="true" aria-labelledby="stock-modal-title">
            <div className="inventory-modal-heading"><div><span className="inventory-eyebrow">INVENTORY CONTROL</span><h2 id="stock-modal-title">Adjust Stock</h2></div><button onClick={() => setShowAdjustment(false)} aria-label="Close"><X size={20} /></button></div>
            <form onSubmit={saveAdjustment}>
              <label>Product<select required value={adjustmentProductId} onChange={(event) => setAdjustmentProductId(event.target.value ? Number(event.target.value) : '')}><option value="">Select a product</option>{activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name} — {getStock(product)} available</option>)}</select></label>
              <label>Adjustment type<select value={adjustmentMode} onChange={(event) => setAdjustmentMode(event.target.value as AdjustmentMode)}><option value="add">Add stock</option><option value="remove">Remove stock</option><option value="set">Set exact stock quantity</option></select></label>
              <label>{adjustmentMode === 'set' ? 'New stock quantity' : 'Quantity'}<input type="number" min={adjustmentMode === 'set' ? 0 : 1} step="1" value={adjustmentAmount} onChange={(event) => setAdjustmentAmount(event.target.value)} required /></label>
              <label>Reason<select value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)}><option>Restock</option><option>Damaged item</option><option>Manual correction</option><option>Returned item</option><option>Stock count</option></select></label>
              {formError && <p className="inventory-form-error">{formError}</p>}
              <div className="inventory-modal-actions"><button type="button" className="inventory-button inventory-button-light" onClick={() => setShowAdjustment(false)}>Cancel</button><button type="submit" className="inventory-button inventory-button-primary">Save Adjustment</button></div>
            </form>
          </section>
        </div>
      )}

      {showMovements && (
        <div className="inventory-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowMovements(false); }}>
          <section className="inventory-modal inventory-movements-modal" role="dialog" aria-modal="true" aria-labelledby="movement-modal-title">
            <div className="inventory-modal-heading"><div><span className="inventory-eyebrow">AUDIT HISTORY</span><h2 id="movement-modal-title">Stock Movements</h2></div><button onClick={() => setShowMovements(false)} aria-label="Close"><X size={20} /></button></div>
            {movements.length ? <div className="movement-history-list">{movements.filter((movement) => !selectedProduct || movement.productId === selectedProduct.id).map((movement) => (
              <article key={movement.id}><span className={`movement-change ${movement.change >= 0 ? 'movement-positive' : 'movement-negative'}`}>{movement.change >= 0 ? <ArrowUp size={15} /> : <ArrowDown size={15} />}{movement.change > 0 ? '+' : ''}{movement.change}</span><div><strong>{movement.productName}</strong><span>{movement.reason} · {movement.before} → {movement.after}</span><small><CalendarDays size={12} /> {formatDate(movement.createdAt)}</small></div></article>
            ))}</div> : <div className="movement-empty"><BarChart3 size={28} /><strong>No movement history</strong><span>Adjust stock to start recording inventory movements.</span></div>}
            <div className="inventory-modal-actions"><button className="inventory-button inventory-button-primary" onClick={() => setShowMovements(false)}>Close</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
