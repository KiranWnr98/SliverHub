import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  Boxes,
  ChartNoAxesCombined,
  ClipboardList,
  UsersRound,
  Layers3,
  PackageSearch,
  Settings,
  Menu,
  X,
  Store,
} from 'lucide-react';
import '../portal.css';

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { to: '/admin/products', label: 'Products', icon: Boxes },
  { to: '/admin/categories', label: 'Categories', icon: Layers3 },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/inventory', label: 'Inventory', icon: PackageSearch },
  { to: '/admin/customers', label: 'Customers', icon: UsersRound },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminUser = JSON.parse(
  sessionStorage.getItem('silverhub-user') || 'null'
  );

  if (adminUser?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="admin-portal portal">
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <Link to="/admin/dashboard" className="admin-brand">
          <span className="admin-brand-mark">SH</span>
          <span>SILVERHUB<small>ADMIN STUDIO</small></span>
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Admin navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="demo-indicator"><i /> Demo environment</span>
          <Link className="sidebar-store-link" to="/">
            <Store size={17} /> View storefront
          </Link>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <section className="admin-workspace">
        <header className="admin-topbar">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="admin-topbar-title">Admin portal <span>·</span> Demo</div>
          <div className="admin-user"><span>SH</span><strong>Store admin</strong></div>
        </header>
        <main className="portal-main admin-main"><Outlet /></main>
      </section>
    </div>
  );
}
