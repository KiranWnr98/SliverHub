import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { Heart, House, Package, UserRound, MapPin } from 'lucide-react';
import { useWishlist } from '../../context/useWishlist';
import { useCart } from '../../context/useCart';
import '../portal.css';

export default function CustomerLayout() {
  const { wishlist } = useWishlist();
  const { cartCount } = useCart();

  if (!sessionStorage.getItem('silverhub-demo-customer')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="portal customer-portal">
      <header className="customer-topbar">
        <NavLink to="/" className="portal-brand">SILVER HUB <span>HOUSE OF 925</span></NavLink>
        <nav aria-label="Customer navigation">
          <NavLink to="/account" end><House size={17} /> Overview</NavLink>

          <NavLink to="/account/profile" end>
              <UserRound size={17} /> Profile
                 </NavLink>

               <NavLink to="/account/address" end>
                   <MapPin size={17} /> Address
                     </NavLink>
          <NavLink to="/account/orders"><Package size={17} /> Orders</NavLink>
          <NavLink to="/address"><MapPin size={17} /> Address</NavLink>  </nav>
        <div className="customer-shortcuts">
          <NavLink to="/wishlist" aria-label={`Wishlist (${wishlist.length})`}><Heart size={18} /> {wishlist.length}</NavLink>
          <NavLink to="/cart" aria-label={`Cart (${cartCount})`}><Package size={18} /> {cartCount}</NavLink>
          <NavLink to="/shop" className="store-link">Continue shopping</NavLink>
        </div>
      </header>
      <main className="portal-main customer-main"><Outlet /></main>
      <footer className="portal-footer">
        <span>Silver Hub · House of 925</span>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            sessionStorage.removeItem('silverhub-demo-customer');
            window.location.assign('/login');
          }}
        >
          Sign out of demo
        </button>
      </footer>
    </div>
  );
}










