import {
  ArrowUpRight,
  BadgeIndianRupee,
  Boxes,
  ClipboardList,
  UsersRound,
  ArrowDownRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { mockBestSellers, mockOrders } from '../../../data/mockPortal';
import '../../../layouts/portal.css';

const metrics = [
  { label: 'Total products', value: '128', change: '+8 this month', icon: Boxes, tone: 'silver' },
  { label: 'Total orders', value: '1,284', change: '+12.8% this month', icon: ClipboardList, tone: 'blue' },
  { label: 'Total customers', value: '946', change: '+6.4% this month', icon: UsersRound, tone: 'gold' },
  { label: 'Revenue', value: '₹8,42,650', change: '+9.2% this month', icon: BadgeIndianRupee, tone: 'green' },
];

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

// These paths match the image files in public/images.
const productImages = [
  '/images/royal-silver-necklace.png',
  '/images/traditional-jhumkas.png',
  '/images/elegant-silver-ring.png',
];

export default function AdminDashboard() {
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero-content">
          <span className="dashboard-hero-eyebrow">SILVER HUB ADMIN</span>
          <h1>Good morning, Admin</h1>
          <p>Here’s what’s happening at Silver Hub today.</p>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Store summary">
        {metrics.map(({ label, value, change, icon: Icon, tone }) => (
          <article className={`metric-card premium-metric ${tone}`} key={label}>
            <div className={`metric-icon ${tone}`}>
              <Icon size={21} />
            </div>
            <p>{label}</p>
            <strong>{value}</strong>
            <span className="metric-change">
              <ArrowUpRight size={15} />
              {change}
            </span>
          </article>
        ))}
      </section>

      <div className="dashboard-panels">
        <section className="dashboard-panel orders-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>Your latest customer purchases.</p>
            </div>
            <Link to="/admin/orders">
              All orders <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>{currency.format(order.amount)}</td>
                    <td>
                      <span className={`status-pill status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-panel bestsellers-panel">
          <div className="panel-heading">
            <div>
              <h2>Best-selling pieces</h2>
              <p>Popular across the collection.</p>
            </div>
            <ArrowDownRight size={19} />
          </div>

          <div className="bestsellers-list">
            {mockBestSellers.map((product, index) => (
              <div className="bestseller-row premium-bestseller" key={product.name}>
                <span className="bestseller-index">0{index + 1}</span>
                <div className="bestseller-image">
                  <img
                    src={productImages[index % productImages.length]}
                    alt={product.name}
                  />
                </div>
                <span className="bestseller-details">
                  <strong>{product.name}</strong>
                  <small>{product.category}</small>
                </span>
                <span className="bestseller-sold">
                  {product.sold}
                  <small>sold</small>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="dashboard-disclaimer">
        Dashboard figures are illustrative mock data for this frontend prototype.
      </p>
    </div>
  );
}
