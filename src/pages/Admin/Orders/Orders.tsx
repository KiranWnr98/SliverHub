import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Download,
  Eye,
  Filter,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import './Orders.css';
import { products as catalogueProducts } from '../../../data/products';

type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'COD' | 'Refunded';

type OrderItem = {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  shipping: number;
  trackingId?: string;
  estimatedDelivery?: string;
};

const STORAGE_KEY = 'silverhub-admin-orders';

// Use real catalogue image URLs instead of placeholder /images paths.
// The demo orders contain a few names that differ from the current catalogue,
// so match their product type to the closest available catalogue category.
const getCatalogueImage = (productName: string): string => {
  const name = productName.toLowerCase();
  let category = '';

  if (/ring/.test(name)) category = 'Rings';
  else if (/earring|jhumka|stud/.test(name)) category = 'Earrings';
  else if (/bangle|kada|bracelet/.test(name)) category = 'Bangles';
  else if (/necklace|chain|pendant/.test(name)) category = 'Necklaces';
  else if (/anklet/.test(name)) category = 'Bangles'; // Temporary fallback: no Anklets item exists in products.ts yet.

  const matchedProduct = catalogueProducts.find(
    (product) => product.category.toLowerCase() === category.toLowerCase(),
  );

  return matchedProduct?.image || catalogueProducts[0]?.image || '';
};

const initialOrders: Order[] = [
  {
    id: 'SH-1048',
    customer: 'Ananya Mehta',
    email: 'ananya.mehta@example.com',
    phone: '+91 98765 43210',
    date: '2026-11-18T10:24:00',
    paymentMethod: 'Online (UPI)',
    paymentStatus: 'Paid',
    status: 'Processing',
    address: '4-12-56, Suryanagar',
    city: 'Kakinada, Andhra Pradesh',
    pincode: '533001',
    shipping: 0,
    items: [
      { id: 1, name: 'Traditional Silver Kada', image: '/images/traditional-silver-jhumkas.png', quantity: 1, price: 2199 },
      { id: 2, name: 'Classic Silver Ring', image: '/images/elegant-silver-ring.png', quantity: 1, price: 899 },
      { id: 3, name: 'Pearl Silver Earrings', image: '/images/traditional-silver-jhumkas.png', quantity: 1, price: 1201 },
    ],
  },
  {
    id: 'SH-1047',
    customer: 'Rohit Kumar',
    email: 'rohit.kumar@example.com',
    phone: '+91 98765 12345',
    date: '2026-11-17T18:42:00',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    status: 'Shipped',
    address: '12 Lake View Road',
    city: 'Visakhapatnam, Andhra Pradesh',
    pincode: '530001',
    shipping: 0,
    items: [{ id: 4, name: 'Elegant Silver Ring', image: '/images/elegant-silver-ring.png', quantity: 1, price: 2499 }],
  },
  {
    id: 'SH-1046',
    customer: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 91234 56780',
    date: '2026-11-17T14:15:00',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'COD',
    status: 'Processing',
    address: '8 Green Park',
    city: 'Vijayawada, Andhra Pradesh',
    pincode: '520010',
    shipping: 0,
    items: [
      { id: 5, name: 'Silver Anklet', image: '/images/signup-pendant.png', quantity: 1, price: 1999 },
      { id: 6, name: 'Silver Pendant', image: '/images/signup-pendant.png', quantity: 1, price: 1999 },
    ],
  },
  {
    id: 'SH-1045',
    customer: 'Vikram Reddy',
    email: 'vikram.reddy@example.com',
    phone: '+91 99887 76655',
    date: '2026-11-16T20:20:00',
    paymentMethod: 'Online (UPI)',
    paymentStatus: 'Paid',
    status: 'Delivered',
    address: '22 MG Road',
    city: 'Rajahmundry, Andhra Pradesh',
    pincode: '533101',
    shipping: 0,
    items: [{ id: 7, name: 'Silver Kada', image: '/images/traditional-silver-jhumkas.png', quantity: 1, price: 1899 }],
  },
  {
    id: 'SH-1044',
    customer: 'Meera Iyer',
    email: 'meera.iyer@example.com',
    phone: '+91 98760 11223',
    date: '2026-11-16T11:05:00',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    status: 'Delivered',
    address: '16 Palm Street',
    city: 'Chennai, Tamil Nadu',
    pincode: '600018',
    shipping: 0,
    items: [
      { id: 8, name: 'Silver Chain', image: '/images/signup-pendant.png', quantity: 1, price: 2499 },
      { id: 9, name: 'Silver Ring', image: '/images/elegant-silver-ring.png', quantity: 1, price: 1799 },
      { id: 10, name: 'Silver Studs', image: '/images/traditional-silver-jhumkas.png', quantity: 1, price: 1600 },
      { id: 11, name: 'Silver Bracelet', image: '/images/signup-pendant.png', quantity: 1, price: 1601 },
    ],
  },
  {
    id: 'SH-1043',
    customer: 'Arjun Naik',
    email: 'arjun.naik@example.com',
    phone: '+91 90000 12345',
    date: '2026-11-15T17:18:00',
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'COD',
    status: 'Cancelled',
    address: '5 Station Road',
    city: 'Eluru, Andhra Pradesh',
    pincode: '534001',
    shipping: 0,
    items: [{ id: 12, name: 'Silver Pendant', image: '/images/signup-pendant.png', quantity: 1, price: 999 }],
  },
  {
    id: 'SH-1042',
    customer: 'Sravani Das',
    email: 'sravani.das@example.com',
    phone: '+91 90123 45678',
    date: '2026-11-14T15:10:00',
    paymentMethod: 'Online (UPI)',
    paymentStatus: 'Refunded',
    status: 'Returned',
    address: '31 Jubilee Hills',
    city: 'Hyderabad, Telangana',
    pincode: '500033',
    shipping: 0,
    items: [
      { id: 13, name: 'Silver Earrings', image: '/images/traditional-silver-jhumkas.png', quantity: 1, price: 1499 },
      { id: 14, name: 'Silver Ring', image: '/images/elegant-silver-ring.png', quantity: 1, price: 1499 },
    ],
  },
  {
    id: 'SH-1041',
    customer: 'Karthik Rao',
    email: 'karthik.rao@example.com',
    phone: '+91 98888 77665',
    date: '2026-11-14T10:02:00',
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    status: 'Delivered',
    address: '9 Beach Road',
    city: 'Kakinada, Andhra Pradesh',
    pincode: '533003',
    shipping: 0,
    items: [{ id: 15, name: 'Classic Silver Ring', image: '/images/elegant-silver-ring.png', quantity: 1, price: 1299 }],
  },
];

const statusTabs: Array<'All Orders' | OrderStatus> = [
  'All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned',
];

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const orderTotal = (order: Order) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) + order.shipping;

const statusClass = (status: string) => status.toLowerCase().replace(/\s+/g, '-');

const paymentMethods = ['UPI', 'Cash on Delivery', 'Credit/Debit Card', 'Net Banking'];
const paymentStatuses: PaymentStatus[] = ['Pending', 'Paid', 'Failed', 'COD', 'Refunded'];

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(date));

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) as Order[] : initialOrders;
    } catch {
      return initialOrders;
    }
  });
  const [activeTab, setActiveTab] = useState<'All Orders' | OrderStatus>('All Orders');
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All Payments');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [sortOrder, setSortOrder] = useState('Newest');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>('SH-1048');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const counts = useMemo(() => ({
    total: orders.length,
    Processing: orders.filter((order) => order.status === 'Processing').length,
    Shipped: orders.filter((order) => order.status === 'Shipped').length,
    Delivered: orders.filter((order) => order.status === 'Delivered').length,
    Cancelled: orders.filter((order) => order.status === 'Cancelled').length,
    Returned: orders.filter((order) => order.status === 'Returned').length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const filtered = orders.filter((order) => {
      const matchesTab = activeTab === 'All Orders' || order.status === activeTab;
      const matchesSearch = !query || [
        order.id, order.customer, order.email, order.phone,
      ].some((value) => value.toLowerCase().includes(query));
      const matchesPayment = paymentFilter === 'All Payments' ||
        (paymentFilter === 'Paid' ? order.paymentStatus === 'Paid' :
          paymentFilter === 'COD' ? (order.paymentStatus === 'COD' || order.paymentMethod === 'Cash on Delivery') : order.paymentStatus === 'Refunded');
      const ageDays = (now.getTime() - new Date(order.date).getTime()) / 86400000;
      const matchesDate = dateFilter === 'All Time' ||
        (dateFilter === 'Last 7 Days' && ageDays <= 7) ||
        (dateFilter === 'Last 30 Days' && ageDays <= 30) ||
        (dateFilter === 'This Year' && new Date(order.date).getFullYear() === now.getFullYear());
      return matchesTab && matchesSearch && matchesPayment && matchesDate;
    });
    return filtered.sort((a, b) =>
      sortOrder === 'Newest'
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [orders, activeTab, search, paymentFilter, dateFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) ?? null;

  useEffect(() => setPage(1), [activeTab, search, paymentFilter, dateFilter, pageSize]);

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders((current) => current.map((order) =>
      order.id === orderId ? { ...order, ...updates } : order,
    ));
  };

  const exportCsv = () => {
    const headers = ['Order ID', 'Customer', 'Email', 'Date', 'Items', 'Total', 'Payment Method', 'Payment Status', 'Order Status'];
    const rows = filteredOrders.map((order) => [
      order.id, order.customer, order.email, order.date,
      order.items.reduce((sum, item) => sum + item.quantity, 0),
      orderTotal(order), order.paymentMethod, order.paymentStatus, order.status,
    ]);
    const csv = [headers, ...rows].map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','),
    ).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'silverhub-orders.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelected = (id: string) =>
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const toggleAllVisible = () => {
    const ids = visibleOrders.map((order) => order.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    setSelectedIds((current) => allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  };

  const markSelectedDelivered = () => {
    setOrders((current) => current.map((order) =>
      selectedIds.includes(order.id) && order.status !== 'Cancelled' && order.status !== 'Returned'
        ? { ...order, status: 'Delivered' }
        : order,
    ));
    setSelectedIds([]);
  };

  return (
    <div className="orders-page">
      <div className="orders-heading">
        <div className="orders-heading-main">
          <span className="orders-eyebrow">ADMIN STUDIO</span>
          <h1>Orders</h1>
          <p>Manage customer orders, track status, update payments, and handle deliveries.</p>
        </div>

        <div className="orders-heading-actions">
          <button className="orders-button orders-button-light" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
          <button
            className="orders-button orders-button-primary"
            onClick={() => {
              const eligible = selectedIds.length
                ? selectedIds
                : orders.filter((order) => order.status === 'Shipped').map((order) => order.id);

              setOrders((current) =>
                current.map((order) =>
                  eligible.includes(order.id) &&
                  order.status !== 'Cancelled' &&
                  order.status !== 'Returned'
                    ? { ...order, status: 'Delivered' }
                    : order,
                ),
              );
              setSelectedIds([]);
            }}
          >
            <Truck size={16} /> Mark as Delivered
          </button>
        </div>
      </div>

      <section className="orders-stats" aria-label="Order summary">
        <article className="orders-stat-card stat-total">
          <span className="orders-stat-icon"><ShoppingBag size={22} /></span>
          <div><strong>{counts.total}</strong><span>Total Orders</span></div>
        </article>
        <article className="orders-stat-card stat-processing">
          <span className="orders-stat-icon"><Truck size={22} /></span>
          <div><strong>{counts.Processing}</strong><span>Processing</span></div>
        </article>
        <article className="orders-stat-card stat-shipped">
          <span className="orders-stat-icon"><Package size={22} /></span>
          <div><strong>{counts.Shipped}</strong><span>Shipped</span></div>
        </article>
        <article className="orders-stat-card stat-delivered">
          <span className="orders-stat-icon"><CheckCircle2 size={22} /></span>
          <div><strong>{counts.Delivered}</strong><span>Delivered</span></div>
        </article>
      </section>

      <div className="orders-tabs" role="tablist" aria-label="Filter orders by status">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab} <span>{tab === 'All Orders' ? counts.total : counts[tab]}</span>
          </button>
        ))}
      </div>

      <section className="orders-toolbar">
        <label className="orders-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order ID, customer, or email..."
            aria-label="Search orders"
          />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <label className="orders-select">
          <span>Payment:</span>
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
            <option>All Payments</option><option>Paid</option><option>COD</option><option>Refunded</option>
          </select>
        </label>
        <label className="orders-select">
          <span>Date:</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
            <option>All Time</option><option>Last 7 Days</option><option>Last 30 Days</option><option>This Year</option>
          </select>
        </label>
        <label className="orders-select orders-sort">
          <span>Sort:</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option>Newest</option><option>Oldest</option>
          </select>
        </label>
        <button className={`orders-filter-button ${showFilters ? 'selected' : ''}`} onClick={() => setShowFilters((value) => !value)} aria-label="Toggle filters">
          <Filter size={18} />
        </button>
      </section>
      {showFilters && (
        <div className="orders-filter-summary">
          <span>{filteredOrders.length} matching orders</span>
          <button onClick={() => { setSearch(''); setPaymentFilter('All Payments'); setDateFilter('All Time'); setActiveTab('All Orders'); }}>Clear all filters</button>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="orders-bulk-bar">
          <strong>{selectedIds.length} selected</strong>
          <button onClick={markSelectedDelivered}><Truck size={15} /> Mark delivered</button>
          <button onClick={() => setSelectedIds([])}>Clear selection</button>
        </div>
      )}

      <div className={`orders-content ${selectedOrder ? 'has-selection' : ''}`}>
        <section className="orders-table-card">
          <div className="orders-table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Select all visible orders" checked={visibleOrders.length > 0 && visibleOrders.every((order) => selectedIds.includes(order.id))} onChange={toggleAllVisible} /></th>
                  <th>Order ID</th><th>Customer</th><th>Date &amp; Time</th><th>Items</th><th>Total Amount</th><th>Payment</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className={selectedOrderId === order.id ? 'selected-row' : ''} onClick={() => setSelectedOrderId(order.id)}>
                    <td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${order.id}`} checked={selectedIds.includes(order.id)} onChange={() => toggleSelected(order.id)} /></td>
                    <td className="orders-id-cell">{order.id}</td>
                    <td><div className="orders-customer"><span>{order.customer.charAt(0)}</span><strong>{order.customer}</strong></div></td>
                    <td><div className="orders-date">{formatDate(order.date)}<small>{formatTime(order.date)}</small></div></td>
                    <td>
                      <div className="orders-item-preview">
                        {order.items.slice(0, 2).map((item) => <img key={item.id} src={getCatalogueImage(item.name)} alt={item.name} />)}
                        <span>{order.items.length > 2 ? `+${order.items.length - 2}` : order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                    </td>
                    <td className="orders-amount">{currency(orderTotal(order))}</td>
                    <td><span className={`orders-payment payment-${statusClass(order.paymentStatus)}`}>{order.paymentStatus}</span></td>
                    <td><span className={`orders-status status-${statusClass(order.status)}`}>{order.status}</span></td>
                    <td><button className="orders-view-button" aria-label={`View ${order.id}`} onClick={(event) => { event.stopPropagation(); setSelectedOrderId(order.id); }}><Eye size={18} /></button></td>
                  </tr>
                ))}
                {visibleOrders.length === 0 && (
                  <tr><td colSpan={9} className="orders-empty">No orders match your search or filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="orders-pagination">
            <span>Showing {filteredOrders.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</span>
            <div className="orders-page-controls">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={17} /></button>
              <strong>{page}</strong>
              <button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={17} /></button>
            </div>
            <label>Show <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}><option value={5}>5</option><option value={8}>8</option><option value={10}>10</option></select> per page</label>
          </div>
        </section>

        {selectedOrder && (
          <aside className="orders-detail-panel" aria-label="Order details">
            <div className="orders-detail-heading">
              <h2>Order Details</h2>
              <button onClick={() => setSelectedOrderId(null)} aria-label="Close order details"><X size={19} /></button>
            </div>
            <div className="orders-detail-order">
              <span className="orders-detail-bag"><ShoppingBag size={22} /></span>
              <div><strong>{selectedOrder.id}</strong><small>Placed on {formatDate(selectedOrder.date)}, {formatTime(selectedOrder.date)}</small></div>
              <span className={`orders-status status-${statusClass(selectedOrder.status)}`}>{selectedOrder.status}</span>
            </div>
            <div className="orders-detail-section">
              <h3><BadgeCheck size={16} /> Customer Information</h3>
              <p><strong>{selectedOrder.customer}</strong></p>
              <p><Mail size={14} /> {selectedOrder.email}</p>
              <p><Phone size={14} /> {selectedOrder.phone}</p>
            </div>
            <div className="orders-detail-section">
              <h3><Package size={16} /> Order Items ({selectedOrder.items.length})</h3>
              {selectedOrder.items.map((item) => (
                <div className="orders-detail-item" key={item.id}>
                  <img src={getCatalogueImage(item.name)} alt={item.name} />
                  <div><strong>{item.name}</strong><small>Qty: {item.quantity}</small></div>
                  <b>{currency(item.price * item.quantity)}</b>
                </div>
              ))}
              <div className="orders-total-line"><span>Subtotal</span><strong>{currency(orderTotal(selectedOrder) - selectedOrder.shipping)}</strong></div>
              <div className="orders-total-line"><span>Shipping</span><strong>{currency(selectedOrder.shipping)}</strong></div>
              <div className="orders-total-line grand"><span>Total Amount</span><strong>{currency(orderTotal(selectedOrder))}</strong></div>
            </div>
            <div className="orders-detail-section orders-edit-section">
              <h3><CircleDollarSign size={16} /> Payment Information</h3>
              <label className="orders-edit-field">
                <span>Payment Method</span>
                <select
                  value={selectedOrder.paymentMethod === 'Online (UPI)' ? 'UPI' : selectedOrder.paymentMethod === 'Card' ? 'Credit/Debit Card' : selectedOrder.paymentMethod}
                  onChange={(event) => updateOrder(selectedOrder.id, { paymentMethod: event.target.value })}
                >
                  {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                </select>
              </label>
              <label className="orders-edit-field">
                <span>Payment Status</span>
                <select
                  value={selectedOrder.paymentStatus}
                  onChange={(event) => updateOrder(selectedOrder.id, { paymentStatus: event.target.value as PaymentStatus })}
                >
                  {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <small className="orders-edit-hint">Only update to Paid after payment has been verified. Changes save automatically in this browser.</small>
            </div>
            <div className="orders-detail-section orders-edit-section">
              <h3><MapPin size={16} /> Delivery Information</h3>
              <label className="orders-edit-field">
                <span>Contact number</span>
                <input value={selectedOrder.phone} onChange={(event) => updateOrder(selectedOrder.id, { phone: event.target.value })} />
              </label>
              <label className="orders-edit-field">
                <span>Address</span>
                <input value={selectedOrder.address} onChange={(event) => updateOrder(selectedOrder.id, { address: event.target.value })} />
              </label>
              <label className="orders-edit-field">
                <span>City / State</span>
                <input value={selectedOrder.city} onChange={(event) => updateOrder(selectedOrder.id, { city: event.target.value })} />
              </label>
              <label className="orders-edit-field">
                <span>PIN code</span>
                <input value={selectedOrder.pincode} onChange={(event) => updateOrder(selectedOrder.id, { pincode: event.target.value })} />
              </label>
              <label className="orders-edit-field">
                <span>Tracking ID</span>
                <input value={selectedOrder.trackingId ?? ''} placeholder="Enter tracking ID" onChange={(event) => updateOrder(selectedOrder.id, { trackingId: event.target.value })} />
              </label>
              <label className="orders-edit-field">
                <span>Estimated delivery</span>
                <input type="date" value={selectedOrder.estimatedDelivery ?? ''} onChange={(event) => updateOrder(selectedOrder.id, { estimatedDelivery: event.target.value })} />
              </label>
            </div>
            <label className="orders-update-status">
              <span>Update Order Status</span>
              <select value={selectedOrder.status} onChange={(event) => updateOrder(selectedOrder.id, { status: event.target.value as OrderStatus })}>
                <option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option><option>Returned</option>
              </select>
              <ChevronDown size={16} />
            </label>
          </aside>
        )}
      </div>
      <p className="orders-demo-note"><CalendarDays size={13} /> Demo orders for frontend preview. Changes are saved only in this browser.</p>
    </div>
  );
}
