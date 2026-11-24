import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Heart,
  User,
  Menu,
  X,
  UserPen,
  MapPin,
  Package,
  LogOut
} from 'lucide-react';

import { Link, NavLink, useNavigate } from 'react-router-dom';

import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';

import JewelryBoxIcon from '../JewelryBoxIcon/JewelryBoxIcon';
import logo from '../../assets/logo.png';

import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  // ACCOUNT DROPDOWN
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(
  () => sessionStorage.getItem('silverhub-profile-image') || ''
);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
  localStorage.getItem('isLoggedIn') === 'true'
);
const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
const [successToastMessage, setSuccessToastMessage] = useState('');
const [isToastExiting, setIsToastExiting] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent): void => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);
  useEffect(() => {
  const updateProfileImage = () => {
    setProfileImage(
      sessionStorage.getItem('silverhub-profile-image') || ''
    );
  };

  window.addEventListener(
    'profileImageUpdated',
    updateProfileImage
  );

  return () => {
    window.removeEventListener(
      'profileImageUpdated',
      updateProfileImage
    );
  };
}, []);
useEffect(() => {
  if (!showLogoutSuccess) return;

  setIsToastExiting(false);

  const exitTimer = window.setTimeout(() => {
    setIsToastExiting(true);
  }, 3000);

  const removeTimer = window.setTimeout(() => {
    setShowLogoutSuccess(false);
    setIsToastExiting(false);
    setSuccessToastMessage('');
  }, 3400);

  return () => {
    window.clearTimeout(exitTimer);
    window.clearTimeout(removeTimer);
  };
}, [showLogoutSuccess]);
useEffect(() => {
  const loginSuccess = sessionStorage.getItem('silverhub-login-success');

  if (loginSuccess === 'true') {
    sessionStorage.removeItem('silverhub-login-success');

    setSuccessToastMessage('Login Successful!');
    setShowLogoutSuccess(true);
  }
}, []);

  const { cartCount } = useCart();
  const { wishlist } = useWishlist();

  const closeMenu = (): void => {
    setMenuOpen(false);
  };
const handleLogout = () => {
  localStorage.removeItem('isLoggedIn');

  sessionStorage.removeItem('silverhub-demo-customer');
  sessionStorage.removeItem('silverhub-user');
  sessionStorage.removeItem('silverhub-profile-image');

  setIsLoggedIn(false);
  setProfileImage('');
  setAccountOpen(false);
  setShowLogoutConfirm(false);

  // Navigate to Home page
  navigate('/');

  // Show success notification
  setSuccessToastMessage('Logged out successfully!');
  setShowLogoutSuccess(true);
};

  return ( 
    <>
    <header className="navbar">
      {/* MOBILE MENU */}
<button
  type="button"
  className="mobile-menu"
  onClick={() => setMenuOpen((previous) => !previous)}
  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
  aria-expanded={menuOpen}
>
  {menuOpen ? <X /> : <Menu />}
</button>

      {/* BRAND LOGO */}
      <Link
        to="/"
        className="brand"
        onClick={closeMenu}
        aria-label="Silver Hub Home"
      >
        <img
          src={logo}
          alt="Silver Hub SH Logo"
          className="brand-logo"
        />

        <span className="brand-text">
          <strong>SILVERHUB</strong>
          
        </span>
      </Link>

      {/* NAVIGATION */}
<nav className={menuOpen ? 'nav-links open' : 'nav-links'}>

  <NavLink to="/" onClick={closeMenu}>
    Home
  </NavLink>

  <NavLink to="/shop" onClick={closeMenu}>
    Shop
  </NavLink>

  <NavLink to="/collections" onClick={closeMenu}>
    Collections
  </NavLink>

  <NavLink to="/new-arrivals" onClick={closeMenu}>
    New Arrivals
  </NavLink>

  <NavLink to="/about" onClick={closeMenu}>
    About Us
  </NavLink>

</nav>

      {/* NAVBAR ACTIONS */}
      <div className="nav-actions">

        {/* SEARCH */}
        <form
          className="search-box"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search size={20} />

          <input
            type="search"
            placeholder="Search for silver ornaments..."
            aria-label="Search silver ornaments"
          />
        </form>

        {/* WISHLIST */}
        <Link
          to="/wishlist"
          className="icon-button"
          aria-label={`Wishlist (${wishlist.length})`}
        >
          <Heart />

          <span className="count">
            {wishlist.length}
          </span>
        </Link>

        {/* JEWELLERY BOX / CART */}
        <Link
          to="/cart"
          className="icon-button jewelry-box-button"
          aria-label={`Jewellery Box (${cartCount})`}
          title="My Jewellery Box"
        >
          <JewelryBoxIcon size={40} />

          <span className="count">
            {cartCount}
          </span>
        </Link>

        
{/* ACCOUNT */}
<div className="account-wrapper" ref={accountRef}>
  <button
  type="button"
  className="icon-button account"
  onClick={() => setAccountOpen(!accountOpen)}
  aria-label="Account"
>
  {profileImage ? (
    <img
      src={profileImage}
      alt="Profile"
      className="navbar-profile-image"
    />
  ) : (
    <User />
  )}
</button>

  {accountOpen && (
  <div className="account-dropdown">

    <h3>My Account</h3>
    <p>Welcome to SilverHub</p>

    {isLoggedIn ? (
      <>
<NavLink
  to="/account/profile"
  className={({ isActive }) =>
    isActive
      ? "account-menu-option active"
      : "account-menu-option"
  }
  onClick={() => setAccountOpen(false)}
>
  <UserPen size={18} />
  <span>Edit Profile</span>
</NavLink>

        <NavLink
  to="/address"
  end
  className={({ isActive }) =>
    isActive
      ? "account-menu-option active"
      : "account-menu-option"
  }
  onClick={() => setAccountOpen(false)}
>
  <MapPin size={18} />
  <span>Address</span>
</NavLink>

<NavLink
  to="/account/orders"
  end
  className={({ isActive }) =>
    isActive
      ? "account-menu-option active"
      : "account-menu-option"
  }
  onClick={() => setAccountOpen(false)}
>
  <Package size={18} />
  <span>My Orders</span>
</NavLink>

        <button
          type="button"
          className="account-menu-option logout-option"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </>
    ) : (
      <>
        <Link
          to="/login"
          className="account-menu-option"
          onClick={() => setAccountOpen(false)}
        >
          Login
        </Link>

        <Link
          to="/signup"
          className="account-menu-option"
          onClick={() => setAccountOpen(false)}
        >
          New Customer? Sign Up
        </Link>
      </>
    )}

  </div>
)}
</div>


        

      </div>

    </header>

{showLogoutConfirm && (
  <div className="logout-overlay">
    <div className="logout-modal">
      <h2>Confirm Logout</h2>

      <p>Are you sure you want to log out?</p>

      <div className="logout-modal-buttons">
        <button
          type="button"
          className="logout-cancel-btn"
          onClick={() => setShowLogoutConfirm(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="logout-confirm-btn"
          onClick={handleLogout}
        >
          Yes, Log Out
        </button>
      </div>
    </div>
  </div>
)}

{/* LOGOUT SUCCESS NOTIFICATION */}
{showLogoutSuccess && (
  <div
    className={`logout-success-toast ${
      isToastExiting ? 'slide-out' : ''
    }`}
  >
    <span>✓</span>
    {successToastMessage}
  </div>
)}

</>
  );
}