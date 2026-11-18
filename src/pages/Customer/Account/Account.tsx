import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, MapPin, Package, UserRound } from 'lucide-react';
import '../../../layouts/portal.css';

const accountLinks = [
  { to: '/account/profile', label: 'Personal details', detail: 'Keep your contact details up to date.', icon: UserRound },
  { to: '/account/orders', label: 'My orders', detail: 'Follow your Silver Hub purchases.', icon: Package },
  { to: '/account/addresses', label: 'Saved addresses', detail: 'Manage your delivery destinations.', icon: MapPin },
  { to: '/wishlist', label: 'Wishlist', detail: 'Return to the pieces you love.', icon: Heart },
];

export default function CustomerAccount() {
  let name = 'Silver Hub customer';
  try {
    const demoCustomer = sessionStorage.getItem('silverhub-demo-customer');
    if (demoCustomer) {
      const customer = JSON.parse(demoCustomer) as { name?: string; email?: string };
      name = customer.name || customer.email || name;
    }
  } catch {
    name = 'Silver Hub customer';
  }

  return (
    <div className="account-page">
      <div className="portal-heading">
        <div><span className="portal-eyebrow">YOUR ACCOUNT</span><h1>Welcome, {name}</h1><p>Your Silver Hub account at a glance.</p></div>
        <span className="demo-pill">DEMO ACCOUNT</span>
      </div>
      <div className="account-welcome">
        <div><span>THE HOUSE OF 925</span><h2>A considered collection.<br />A personal experience.</h2><p>Your account pages are ready for the next milestone.</p></div>
        <div className="welcome-monogram">SH<small>925</small></div>
      </div>
      <div className="account-link-grid">
        {accountLinks.map(({ to, label, detail, icon: Icon }) => (
          <Link className="account-link-card" to={to} key={to}>
            <Icon size={20} />
            <span><strong>{label}</strong><small>{detail}</small></span>
            <ArrowUpRight size={17} className="account-link-arrow" />
          </Link>
        ))}
      </div>
    </div>
  );
}
