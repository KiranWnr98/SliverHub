
import { useState } from 'react';
import {
  Search,
  Heart,
  User,
  Menu,
  X
} from 'lucide-react';

import { Link } from 'react-router-dom';

import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';

import JewelryBoxIcon from '../JewelryBoxIcon/JewelryBoxIcon';
import logo from '../../assets/logo.png';

import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { cartCount } = useCart();
  const { wishlist } = useWishlist();

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">

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
          <strong>SILVER HUB</strong>
          <small>HOUSE OF 925</small>
        </span>
      </Link>

      {/* NAVIGATION */}
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>

        <Link to="/" onClick={closeMenu}>
          Home
        </Link>

        <Link to="/shop" onClick={closeMenu}>
          Shop
        </Link>

        <Link to="/collections" onClick={closeMenu}>
          Collections
        </Link>

        <Link to="/new-arrivals" onClick={closeMenu}>
          New Arrivals
        </Link>

        <Link to="/about" onClick={closeMenu}>
          About Us
        </Link>

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
        <Link
          to="/login"
          className="icon-button account"
          aria-label="Account"
        >
          <User />
        </Link>

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

      </div>

    </header>
  );
}
