
import { useMemo, useRef, useState } from 'react';
import {
  Users, ShoppingBag, Gem, Crown, Search, Download, Upload,
  Plus, Eye, MoreHorizontal, X, Phone, Mail, MapPin,
  CalendarDays, Repeat, Heart, Tag, ChevronLeft, ChevronRight,
  Pencil, Filter, TrendingUp, Package, CreditCard, Clock, ReceiptText
} from 'lucide-react';
import './Customers.css';
import { products as catalogueProducts } from '../../../data/products';

type CustomerStatus = 'Active' | 'Inactive';
type CustomerType = 'New' | 'Repeat' | 'VIP';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  spent: number;
  type: CustomerType;
  status: CustomerStatus;
  joined: string;
  location: string;
  lastPurchase: string;
  preferredCategories: string[];
}

const initialCustomers: Customer[] = [
  { id: 1, name: 'Ananya Mehta', email: 'ananya.mehta@gmail.com', phone: '+91 98765 43210', orders: 12, spent: 32490, type: 'VIP', status: 'Active', joined: '12 Jun 2026', location: 'Hyderabad, Telangana, India', lastPurchase: '18 Nov 2026', preferredCategories: ['Bangles', 'Necklaces'] },
  { id: 2, name: 'Rohit Kumar', email: 'rohit.kumar@gmail.com', phone: '+91 99887 66554', orders: 5, spent: 14299, type: 'Repeat', status: 'Active', joined: '18 Jun 2026', location: 'Vijayawada, Andhra Pradesh, India', lastPurchase: '15 Nov 2026', preferredCategories: ['Rings'] },
  { id: 3, name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '+91 90123 45678', orders: 8, spent: 21998, type: 'Repeat', status: 'Active', joined: '20 Jun 2026', location: 'Bengaluru, Karnataka, India', lastPurchase: '12 Nov 2026', preferredCategories: ['Earrings', 'Necklaces'] },
  { id: 4, name: 'Vikram Reddy', email: 'vikram.reddy@gmail.com', phone: '+91 97000 11223', orders: 3, spent: 7499, type: 'New', status: 'Active', joined: '02 Jul 2026', location: 'Hyderabad, Telangana, India', lastPurchase: '10 Nov 2026', preferredCategories: ['Chains'] },
  { id: 5, name: 'Meera Iyer', email: 'meera.iyer@gmail.com', phone: '+91 98450 77889', orders: 6, spent: 18999, type: 'Repeat', status: 'Inactive', joined: '05 Jul 2026', location: 'Chennai, Tamil Nadu, India', lastPurchase: '05 Sep 2026', preferredCategories: ['Bangles'] },
  { id: 6, name: 'Karthik Rao', email: 'karthik.rao@gmail.com', phone: '+91 96666 33445', orders: 15, spent: 41290, type: 'VIP', status: 'Active', joined: '08 Jul 2026', location: 'Visakhapatnam, Andhra Pradesh, India', lastPurchase: '19 Nov 2026', preferredCategories: ['Rings', 'Chains'] },
  { id: 7, name: 'Sravani Das', email: 'sravani.das@gmail.com', phone: '+91 91234 66778', orders: 2, spent: 4999, type: 'New', status: 'Active', joined: '12 Jul 2026', location: 'Kakinada, Andhra Pradesh, India', lastPurchase: '08 Nov 2026', preferredCategories: ['Earrings'] },
  { id: 8, name: 'Arjun Naik', email: 'arjun.naik@gmail.com', phone: '+91 99955 44332', orders: 4, spent: 9299, type: 'New', status: 'Active', joined: '15 Jul 2026', location: 'Rajahmundry, Andhra Pradesh, India', lastPurchase: '01 Nov 2026', preferredCategories: ['Necklaces'] },
];

const money = (amount: number) =>
  amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

type StoredOrderItem = {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
};

type StoredOrder = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  address: string;
  city: string;
  pincode: string;
  items: StoredOrderItem[];
  shipping: number;
  trackingId?: string;
  estimatedDelivery?: string;
};

const ORDERS_STORAGE_KEY = 'silverhub-admin-orders';

// Keep customer purchase-history thumbnails consistent with the Orders page.
// Saved demo order image paths may point to files that do not exist.
const getCatalogueImage = (productName: string): string => {
  const name = productName.toLowerCase();
  let category = '';

  if (/ring/.test(name)) category = 'Rings';
  else if (/earring|jhumka|stud/.test(name)) category = 'Earrings';
  else if (/bangle|kada|bracelet/.test(name)) category = 'Bangles';
  else if (/necklace|chain|pendant/.test(name)) category = 'Necklaces';
  else if (/anklet/.test(name)) category = 'Bangles';

  const matchedProduct = catalogueProducts.find(
    (product) => product.category.toLowerCase() === category.toLowerCase(),
  );

  return matchedProduct?.image || catalogueProducts[0]?.image || '';
};

const formatOrderDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
};

const getOrderTotal = (order: StoredOrder) =>
  order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) +
  (Number(order.shipping) || 0);

const readStoredOrders = (): StoredOrder[] => {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((order): order is StoredOrder =>
      Boolean(order && typeof order === 'object' &&
        typeof order.id === 'string' &&
        typeof order.customer === 'string' &&
        Array.isArray(order.items)),
    );
  } catch {
    return [];
  }
};

const matchesCustomerOrder = (order: StoredOrder, customer: Customer) => {
  const orderEmail = (order.email || '').trim().toLowerCase();
  const customerEmail = customer.email.trim().toLowerCase();
  const normalizePhone = (value: string) => value.replace(/\\D/g, '').slice(-10);
  const orderPhone = normalizePhone(order.phone || '');
  const customerPhone = normalizePhone(customer.phone || '');
  const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\\s+/g, ' ');
  return Boolean(
    (orderEmail && customerEmail && orderEmail === customerEmail) ||
    (orderPhone && customerPhone && orderPhone === customerPhone) ||
    (normalizeName(order.customer) === normalizeName(customer.name)),
  );
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selected, setSelected] = useState<Customer | null>(initialCustomers[0]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Customers');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [historyOrders, setHistoryOrders] = useState<StoredOrder[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '',
  });

  const filtered = useMemo(() => customers.filter(customer => {
    const term = search.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.toLowerCase().includes(term);

    const matchesType = typeFilter === 'All Customers' || customer.type === typeFilter;
    const matchesStatus = statusFilter === 'All Statuses' || customer.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [customers, search, typeFilter, statusFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleCustomers = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeCount = customers.filter(c => c.status === 'Active').length;
  const repeatCount = customers.filter(c => c.type === 'Repeat' || c.type === 'VIP').length;
  const totalValue = customers.reduce((sum, c) => sum + c.spent, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', location: '' });
    setShowModal(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      location: customer.location,
    });
    setShowModal(true);
    setMenuId(null);
  };

  const saveCustomer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    if (editing) {
      const updated = { ...editing, ...form };
      setCustomers(prev => prev.map(c => c.id === editing.id ? updated : c));
      setSelected(updated);
    } else {
      const newCustomer: Customer = {
        id: Date.now(),
        ...form,
        orders: 0,
        spent: 0,
        type: 'New',
        status: 'Active',
        joined: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        lastPurchase: 'No purchases yet',
        preferredCategories: [],
      };
      setCustomers(prev => [newCustomer, ...prev]);
      setSelected(newCustomer);
    }
    setShowModal(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Type', 'Status', 'Joined'];
    const rows = filtered.map(c => [c.name, c.email, c.phone, c.orders, c.spent, c.type, c.status, c.joined]);
    const csv = [headers, ...rows].map(row =>
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'silverhub-customers.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const imported: Customer[] = lines.slice(1).map((line, index) => {
      const columns = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return {
        id: Date.now() + index,
        name: columns[0] || 'New Customer',
        email: columns[1] || '',
        phone: columns[2] || '',
        orders: Number(columns[3]) || 0,
        spent: Number(columns[4]) || 0,
        type: (['New', 'Repeat', 'VIP'].includes(columns[5]) ? columns[5] : 'New') as CustomerType,
        status: columns[6] === 'Inactive' ? 'Inactive' : 'Active',
        joined: columns[7] || new Date().toLocaleDateString(),
        location: columns[8] || '',
        lastPurchase: 'Not available',
        preferredCategories: [],
      };
    });
    setCustomers(prev => [...imported, ...prev]);
    event.target.value = '';
  };

  const openPurchaseHistory = (customer: Customer) => {
    const matchingOrders = readStoredOrders()
      .filter(order => matchesCustomerOrder(order, customer))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setHistoryCustomer(customer);
    setHistoryOrders(matchingOrders);
  };

  const closePurchaseHistory = () => {
    setHistoryCustomer(null);
    setHistoryOrders([]);
  };

  const deleteCustomer = (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.name} from this demo customer list?`)) return;
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
    if (selected?.id === customer.id) setSelected(null);
    setMenuId(null);
  };

  return (
    <div className="customers-page">
      <div className="customers-heading">
        <div>
          <span className="customers-eyebrow">ADMIN STUDIO</span>
          <h1>Customers</h1>
          <p>Manage your customers, view their orders, purchase history, and engagement details.</p>
        </div>
        <div className="customers-actions">
          <button className="customer-btn customer-btn-outline" onClick={exportCSV}>
            <Download size={17} /> Export CSV
          </button>
          <button className="customer-btn customer-btn-outline" onClick={() => importRef.current?.click()}>
            <Upload size={17} /> Import Customers
          </button>
          <input ref={importRef} type="file" accept=".csv,text/csv" hidden onChange={importCSV} />
          <button className="customer-btn customer-btn-primary" onClick={openAdd}>
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </div>

      <section className="customer-stat-grid">
        <div className="customer-stat-card stat-gold">
          <div className="customer-stat-icon"><Users /></div>
          <div><strong>{customers.length.toLocaleString('en-IN')}</strong><span>Total Customers</span><small><TrendingUp size={13} /> +6.4%</small></div>
        </div>
        <div className="customer-stat-card stat-green">
          <div className="customer-stat-icon"><ShoppingBag /></div>
          <div><strong>{activeCount.toLocaleString('en-IN')}</strong><span>Active Customers</span><small>Currently active</small></div>
        </div>
        <div className="customer-stat-card stat-purple">
          <div className="customer-stat-icon"><Gem /></div>
          <div><strong>{repeatCount.toLocaleString('en-IN')}</strong><span>Repeat Customers</span><small>{customers.length ? ((repeatCount / customers.length) * 100).toFixed(1) : '0'}%</small></div>
        </div>
        <div className="customer-stat-card stat-orange">
          <div className="customer-stat-icon"><Crown /></div>
          <div><strong>{money(totalValue)}</strong><span>Total Customer Value</span><small>Across listed customers</small></div>
        </div>
      </section>

      <section className="customer-analytics">
        <div className="customer-panel growth-panel">
          <div className="customer-panel-heading">
            <h3>Customer Growth</h3>
            <span className="growth-badge"><TrendingUp size={13} /> +6.4% this month</span>
          </div>
          <svg className="growth-chart" viewBox="0 0 600 190" role="img" aria-label="Illustrative customer growth chart">
            <defs>
              <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d6a13e" stopOpacity=".32" />
                <stop offset="100%" stopColor="#d6a13e" stopOpacity=".02" />
              </linearGradient>
            </defs>
            {[35, 75, 115, 155].map(y => <line key={y} x1="42" y1={y} x2="580" y2={y} stroke="#e9e4dc" strokeDasharray="4 5" />)}
            <path d="M42 145 L130 112 L218 91 L306 72 L394 53 L482 45 L580 20 L580 160 L42 160 Z" fill="url(#growthFill)" />
            <polyline points="42,145 130,112 218,91 306,72 394,53 482,45 580,20" fill="none" stroke="#bd851e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {[[42,145],[130,112],[218,91],[306,72],[394,53],[482,45],[580,20]].map(([x,y]) => <circle key={x} cx={x} cy={y} r="5" fill="#bd851e" stroke="white" strokeWidth="2" />)}
            {['May','Jun','Jul','Aug','Sep','Oct','Nov'].map((month,i) => <text key={month} x={42+i*89.7} y="183" textAnchor="middle" fontSize="12" fill="#6b7280">{month}</text>)}
          </svg>
          <p className="chart-note">Illustrative monthly growth trend</p>
        </div>

        <div className="customer-panel segments-panel">
          <h3>Customer Segments</h3>
          <div className="segment-content">
            <div className="segment-donut"><div><strong>{customers.length}</strong><span>Customers</span></div></div>
            <div className="segment-legend">
              <div><i className="dot dot-new" />New Customers <b>{customers.filter(c => c.type === 'New').length}</b></div>
              <div><i className="dot dot-repeat" />Repeat Customers <b>{customers.filter(c => c.type === 'Repeat').length}</b></div>
              <div><i className="dot dot-vip" />High Value (VIP) <b>{customers.filter(c => c.type === 'VIP').length}</b></div>
              <div><i className="dot dot-inactive" />Inactive <b>{customers.filter(c => c.status === 'Inactive').length}</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="customer-workspace">
        <div className="customer-main-column">
          <div className="customer-toolbar">
            <label className="customer-search">
              <Search size={18} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, email, or phone..." />
              {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
            </label>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option>All Customers</option><option>New</option><option>Repeat</option><option>VIP</option>
            </select>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option>All Statuses</option><option>Active</option><option>Inactive</option>
            </select>
            <button className="customer-filter-button" title="Filters"><Filter size={18} /></button>
          </div>

          <div className="customer-table-wrap">
            <table className="customer-table">
              <thead><tr>
                <th>#</th><th>Customer</th><th>Contact</th><th>Total Orders</th>
                <th>Total Spent</th><th>Customer Type</th><th>Status</th><th>Joined On</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {visibleCustomers.map((customer, index) => (
                  <tr key={customer.id} className={selected?.id === customer.id ? 'selected-customer-row' : ''} onClick={() => setSelected(customer)}>
                    <td>{(page - 1) * pageSize + index + 1}</td>
                    <td><div className="customer-name-cell"><span className="customer-avatar">{customer.name.charAt(0).toUpperCase()}</span><strong>{customer.name}</strong></div></td>
                    <td><div className="customer-contact-cell">{customer.email}<span>{customer.phone}</span></div></td>
                    <td>{customer.orders}</td>
                    <td className="customer-spent">{money(customer.spent)}</td>
                    <td><span className={`customer-type-pill type-${customer.type.toLowerCase()}`}>{customer.type === 'VIP' && <Crown size={12} />}{customer.type}</span></td>
                    <td><span className={`customer-status-pill status-${customer.status.toLowerCase()}`}>{customer.status}</span></td>
                    <td>{customer.joined}</td>
                    <td>
                      <div className="customer-row-actions">
                        <button title="View customer" onClick={e => { e.stopPropagation(); setSelected(customer); }}><Eye size={17} /></button>
                        <button title="More actions" onClick={e => { e.stopPropagation(); setMenuId(menuId === customer.id ? null : customer.id); }}><MoreHorizontal size={18} /></button>
                        {menuId === customer.id && <div className="customer-action-menu">
                          <button onClick={() => openEdit(customer)}><Pencil size={14} /> Edit</button>
                          <button onClick={() => deleteCustomer(customer)}><X size={14} /> Delete</button>
                        </div>}
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleCustomers.length === 0 && <tr><td colSpan={9} className="customer-empty">No customers found. Try changing your search or filters.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="customer-pagination">
            <span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} – {Math.min(page * pageSize, filtered.length)} of {filtered.length} customers</span>
            <div>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={17} /></button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={17} /></button>
            </div>
          </div>
        </div>

        {selected && (
          <aside className="customer-details-panel">
            <div className="customer-details-heading">
              <h3>Customer Details</h3>
              <button onClick={() => setSelected(null)} aria-label="Close details"><X size={19} /></button>
            </div>
            <div className="customer-profile">
              <span className="customer-profile-avatar">{selected.name.charAt(0)}</span>
              <div><strong>{selected.name}</strong><span className={`customer-type-pill type-${selected.type.toLowerCase()}`}>{selected.type} Customer</span></div>
              <span className={`customer-status-pill status-${selected.status.toLowerCase()}`}>{selected.status}</span>
            </div>
            <div className="customer-detail-contact">
              <p><Mail size={16} />{selected.email}</p>
              <p><Phone size={16} />{selected.phone}</p>
              <p><MapPin size={16} />{selected.location || 'Location not provided'}</p>
            </div>
            <div className="customer-detail-stats">
              <div><ShoppingBag /><strong>{selected.orders}</strong><span>Total Orders</span></div>
              <div><Gem /><strong>{money(selected.spent)}</strong><span>Total Spent</span></div>
              <div><Crown /><strong>{selected.orders ? money(Math.round(selected.spent / selected.orders)) : '₹0'}</strong><span>Avg. Order Value</span></div>
            </div>
            <div className="customer-insights">
              <h4>Customer Insights</h4>
              <p><CalendarDays size={15} />Customer Since <b>{selected.joined}</b></p>
              <p><Repeat size={15} />Purchase Frequency <b>{selected.orders ? `${(selected.orders / 6).toFixed(1)} orders / month` : 'No orders yet'}</b></p>
              <p><Heart size={15} />Preferred Categories <b>{selected.preferredCategories.join(', ') || 'Not available'}</b></p>
              <p><Tag size={15} />Last Purchase <b>{selected.lastPurchase}</b></p>
            </div>
            <div className="customer-details-buttons">
              <button className="customer-btn customer-btn-primary" onClick={() => openEdit(selected)}><Pencil size={15} /> Edit Customer</button>
              <button className="customer-btn customer-btn-outline" onClick={() => openPurchaseHistory(selected)}><CalendarDays size={15} /> View Full History</button>
            </div>
          </aside>
        )}
      </section>

      {historyCustomer && (
        <div className="customer-history-backdrop" onClick={closePurchaseHistory}>
          <section
            className="customer-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-history-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="customer-history-heading">
              <div>
                <span className="customers-eyebrow">CUSTOMER ACTIVITY</span>
                <h2 id="customer-history-title">Purchase History</h2>
                <p>{historyCustomer.name} · {historyCustomer.email}</p>
              </div>
              <button type="button" onClick={closePurchaseHistory} aria-label="Close purchase history"><X size={20} /></button>
            </div>

            <div className="customer-history-summary">
              <div><ShoppingBag size={18} /><strong>{historyOrders.length}</strong><span>Matched orders</span></div>
              <div><Gem size={18} /><strong>{money(historyOrders.reduce((sum, order) => sum + getOrderTotal(order), 0))}</strong><span>Value in saved orders</span></div>
            </div>

            {historyOrders.length > 0 ? (
              <div className="customer-history-list">
                {historyOrders.map(order => (
                  <article className="customer-history-order" key={order.id}>
                    <div className="customer-history-order-top">
                      <div>
                        <strong><ReceiptText size={15} /> {order.id}</strong>
                        <span><Clock size={13} /> {formatOrderDate(order.date)}</span>
                      </div>
                      <span className={`customer-history-status history-${order.status.toLowerCase()}`}>{order.status}</span>
                    </div>
                    <div className="customer-history-items">
                      {order.items.map((item, index) => (
                        <div className="customer-history-item" key={`${order.id}-${item.id}-${index}`}>
                          {getCatalogueImage(item.name) ? (
                            <img
                              src={getCatalogueImage(item.name)}
                              alt={item.name}
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="customer-history-item-placeholder"><Package size={18} /></span>
                          )}
                          <div><strong>{item.name}</strong><small>Qty: {item.quantity} · {money(item.price)} each</small></div>
                          <b>{money(item.price * item.quantity)}</b>
                        </div>
                      ))}
                    </div>
                    <div className="customer-history-order-footer">
                      <span><CreditCard size={14} /> {order.paymentMethod || 'Payment not specified'} · {order.paymentStatus || 'Status unavailable'}</span>
                      <strong>{money(getOrderTotal(order))}</strong>
                    </div>
                    {(order.trackingId || order.estimatedDelivery) && (
                      <div className="customer-history-delivery">
                        {order.trackingId && <span><Package size={13} /> Tracking: {order.trackingId}</span>}
                        {order.estimatedDelivery && <span><CalendarDays size={13} /> Estimated delivery: {formatOrderDate(order.estimatedDelivery)}</span>}
                      </div>
                    )}
                    {(order.address || order.city || order.pincode) && (
                      <p className="customer-history-address"><MapPin size={13} /> {[order.address, order.city, order.pincode].filter(Boolean).join(', ')}</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="customer-history-empty">
                <span><ShoppingBag size={25} /></span>
                <strong>No matching orders found</strong>
                <p>There are no saved orders matching this customer's name, email, or phone number in this browser yet.</p>
              </div>
            )}
            <div className="customer-history-actions">
              <button type="button" className="customer-btn customer-btn-outline" onClick={closePurchaseHistory}>Close</button>
            </div>
          </section>
        </div>
      )}

      {showModal && (
        <div className="customer-modal-backdrop" onClick={() => setShowModal(false)}>
          <form className="customer-modal" onSubmit={saveCustomer} onClick={e => e.stopPropagation()}>
            <div className="customer-modal-heading">
              <div><span className="customers-eyebrow">CUSTOMER MANAGEMENT</span><h2>{editing ? 'Edit Customer' : 'Add Customer'}</h2></div>
              <button type="button" onClick={() => setShowModal(false)}><X /></button>
            </div>
            <label>Full Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter customer name" /></label>
            <label>Email Address<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" /></label>
            <label>Phone Number<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" /></label>
            <label>Location<input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, State, Country" /></label>
            <div className="customer-modal-actions">
              <button type="button" className="customer-btn customer-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="customer-btn customer-btn-primary">{editing ? 'Save Changes' : 'Add Customer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
