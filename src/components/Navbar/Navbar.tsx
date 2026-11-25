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
  LogOut,
} from 'lucide-react';

import {
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom';

import { useCart } from '../../context/useCart';
import { useWishlist } from '../../context/useWishlist';

// STORE CONFIGURATION
import { useStoreSettings } from '../../context/storeSettings';

import JewelryBoxIcon from '../JewelryBoxIcon/JewelryBoxIcon';

import logo from '../../assets/logo.png';

import './Navbar.css';

export default function Navbar() {

  /* =========================================
     DYNAMIC STORE SETTINGS
  ========================================= */

  const storeSettings = useStoreSettings();

  const storeName =
    storeSettings.storeName.trim() || 'SilverHub';

  const storeLogo =
    storeSettings.logo || logo;

  const storeTagline =
    storeSettings.tagline;

  const wishlistEnabled =
    storeSettings.wishlistEnabled;

  /* =========================================
     NAVBAR STATES
  ========================================= */

  const [menuOpen, setMenuOpen] =
    useState<boolean>(false);

  const navigate = useNavigate();

  const [accountOpen, setAccountOpen] =
    useState(false);

  const [profileImage, setProfileImage] =
    useState(
      () =>
        sessionStorage.getItem(
          'silverhub-profile-image'
        ) || ''
    );

  const [isLoggedIn, setIsLoggedIn] =
    useState<boolean>(
      () => localStorage.getItem('isLoggedIn') === 'true'
    );

  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  const [showLogoutSuccess, setShowLogoutSuccess] =
    useState(false);

  const [successToastMessage, setSuccessToastMessage] =
    useState('');

  const [isToastExiting, setIsToastExiting] =
    useState(false);

  const accountRef =
    useRef<HTMLDivElement>(null);

  /* =========================================
     CART AND WISHLIST
  ========================================= */

  const { cartCount } = useCart();

  const { wishlist } = useWishlist();

  /* =========================================
     ACCOUNT OUTSIDE CLICK
  ========================================= */

  useEffect(() => {

    const handleOutsideClick = (
      event: MouseEvent
    ): void => {

      if (
        accountRef.current &&
        !accountRef.current.contains(
          event.target as Node
        )
      ) {

        setAccountOpen(false);

      }

    };

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    return () => {

      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );

    };

  }, []);

  /* =========================================
     PROFILE IMAGE UPDATE
  ========================================= */

  useEffect(() => {

    const updateProfileImage = () => {

      setProfileImage(
        sessionStorage.getItem(
          'silverhub-profile-image'
        ) || ''
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

  /* =========================================
     AUTHENTICATION UPDATE
  ========================================= */

  useEffect(() => {

    const updateAuthentication = () => {

      setIsLoggedIn(
        localStorage.getItem('isLoggedIn') === 'true'
      );

      setProfileImage(
        sessionStorage.getItem(
          'silverhub-profile-image'
        ) || ''
      );

    };

    window.addEventListener(
      'silverhub-auth-changed',
      updateAuthentication
    );

    window.addEventListener(
      'focus',
      updateAuthentication
    );

    return () => {

      window.removeEventListener(
        'silverhub-auth-changed',
        updateAuthentication
      );

      window.removeEventListener(
        'focus',
        updateAuthentication
      );

    };

  }, []);

  /* =========================================
     SUCCESS NOTIFICATION ANIMATION
  ========================================= */

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

  /* =========================================
     LOGIN SUCCESS NOTIFICATION
  ========================================= */

  useEffect(() => {

    const loginSuccess =
      sessionStorage.getItem(
        'silverhub-login-success'
      );

    if (loginSuccess === 'true') {

      sessionStorage.removeItem(
        'silverhub-login-success'
      );

      setSuccessToastMessage(
        'Login Successful!'
      );

      setShowLogoutSuccess(true);

    }

  }, []);

  /* =========================================
     CLOSE MOBILE MENU
  ========================================= */

  const closeMenu = (): void => {

    setMenuOpen(false);

  };

  /* =========================================
     LOGOUT FUNCTION
  ========================================= */

  const handleLogout = () => {

    localStorage.removeItem('isLoggedIn');

    sessionStorage.removeItem(
      'silverhub-demo-customer'
    );

    sessionStorage.removeItem(
      'silverhub-user'
    );

    sessionStorage.removeItem(
      'silverhub-profile-image'
    );

    window.dispatchEvent(
      new Event('silverhub-auth-changed')
    );

    setIsLoggedIn(false);

    setProfileImage('');

    setAccountOpen(false);

    setShowLogoutConfirm(false);

    setMenuOpen(false);

    // Navigate to Home page

    navigate('/');

    // Show success notification

    setSuccessToastMessage(
      'Logged out successfully!'
    );

    setShowLogoutSuccess(true);

  };

  /* =========================================
     NAVBAR CONTENT
  ========================================= */

  return (

    <>

      <header className="navbar">

        {/* =================================
            MOBILE MENU
        ================================= */}

        <button

          type="button"

          className="mobile-menu"

          onClick={() =>
            setMenuOpen(
              (previous) => !previous
            )
          }

          aria-label={
            menuOpen
              ? 'Close menu'
              : 'Open menu'
          }

          aria-expanded={menuOpen}

        >

          {menuOpen ? <X /> : <Menu />}

        </button>

        {/* =================================
            DYNAMIC BRAND LOGO
        ================================= */}

        <Link

          to="/"

          className="brand"

          onClick={closeMenu}

          aria-label={`${storeName} Home`}

        >

          <img

            src={storeLogo}

            alt={`${storeName} Logo`}

            className="brand-logo"

            onError={(event) => {

              if (
                event.currentTarget.getAttribute('src') !== logo
              ) {

                event.currentTarget.src = logo;

              }

            }}

          />

          <span className="brand-text">

            <strong>

              {storeName.toUpperCase()}

            </strong>

            {storeTagline && (

              <small className="brand-tagline">

                {storeTagline}

              </small>

            )}

          </span>

        </Link>

        {/* =================================
            NAVIGATION
        ================================= */}

        <nav

          className={
            menuOpen
              ? 'nav-links open'
              : 'nav-links'
          }

        >

          <NavLink
            to="/"
            onClick={closeMenu}
          >

            Home

          </NavLink>

          <NavLink
            to="/shop"
            onClick={closeMenu}
          >

            Shop

          </NavLink>

          <NavLink
            to="/collections"
            onClick={closeMenu}
          >

            Collections

          </NavLink>

          <NavLink
            to="/new-arrivals"
            onClick={closeMenu}
          >

            New Arrivals

          </NavLink>

          <NavLink
            to="/about"
            onClick={closeMenu}
          >

            About Us

          </NavLink>

        </nav>

        {/* =================================
            NAVBAR ACTIONS
        ================================= */}

        <div className="nav-actions">

          {/* SEARCH */}

          <form

            className="search-box"

            onSubmit={(e) =>
              e.preventDefault()
            }

          >

            <Search size={20} />

            <input

              type="search"

              placeholder="Search for silver ornaments..."

              aria-label="Search silver ornaments"

            />

          </form>

          {/* =================================
              DYNAMIC WISHLIST
          ================================= */}

          {wishlistEnabled && (

            <Link

              to="/wishlist"

              className="icon-button"

              aria-label={`Wishlist (${wishlist.length})`}

              title="My Wishlist"

            >

              <Heart />

              <span className="count">

                {wishlist.length}

              </span>

            </Link>

          )}

          {/* =================================
              JEWELLERY BOX / CART
          ================================= */}

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

          {/* =================================
              ACCOUNT
          ================================= */}

          <div

            className="account-wrapper"

            ref={accountRef}

          >

            <button

              type="button"

              className="icon-button account"

              onClick={() =>
                setAccountOpen(
                  (previous) => !previous
                )
              }

              aria-label="Account"

              aria-expanded={accountOpen}

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

            {/* ACCOUNT DROPDOWN */}

            {accountOpen && (

              <div className="account-dropdown">

                <h3>My Account</h3>

                <p>

                  Welcome to {storeName}

                </p>

                {isLoggedIn ? (

                  <>

                    {/* EDIT PROFILE */}

                    <NavLink

                      to="/account/profile"

                      className={({ isActive }) =>
                        isActive
                          ? 'account-menu-option active'
                          : 'account-menu-option'
                      }

                      onClick={() =>
                        setAccountOpen(false)
                      }

                    >

                      <UserPen size={18} />

                      <span>Edit Profile</span>

                    </NavLink>

                    {/* ADDRESS */}

                    <NavLink

                      to="/address"

                      end

                      className={({ isActive }) =>
                        isActive
                          ? 'account-menu-option active'
                          : 'account-menu-option'
                      }

                      onClick={() =>
                        setAccountOpen(false)
                      }

                    >

                      <MapPin size={18} />

                      <span>Address</span>

                    </NavLink>

                    {/* MY ORDERS */}

                    <NavLink

                      to="/account/orders"

                      end

                      className={({ isActive }) =>
                        isActive
                          ? 'account-menu-option active'
                          : 'account-menu-option'
                      }

                      onClick={() =>
                        setAccountOpen(false)
                      }

                    >

                      <Package size={18} />

                      <span>My Orders</span>

                    </NavLink>

                    {/* LOGOUT */}

                    <button

                      type="button"

                      className="account-menu-option logout-option"

                      onClick={() =>
                        setShowLogoutConfirm(true)
                      }

                    >

                      <LogOut size={18} />

                      <span>Log Out</span>

                    </button>

                  </>

                ) : (

                  <>

                    {/* LOGIN */}

                    <Link

                      to="/login"

                      className="account-menu-option"

                      onClick={() =>
                        setAccountOpen(false)
                      }

                    >

                      Login

                    </Link>

                    {/* SIGN UP */}

                    <Link

                      to="/signup"

                      className="account-menu-option"

                      onClick={() =>
                        setAccountOpen(false)
                      }

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

      {/* =====================================
          LOGOUT CONFIRMATION POPUP
      ===================================== */}

      {showLogoutConfirm && (

        <div className="logout-overlay">

          <div className="logout-modal">

            <h2>Confirm Logout</h2>

            <p>

              Are you sure you want to log out?

            </p>

            <div className="logout-modal-buttons">

              <button

                type="button"

                className="logout-cancel-btn"

                onClick={() =>
                  setShowLogoutConfirm(false)
                }

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

      {/* =====================================
          SUCCESS NOTIFICATION
      ===================================== */}

      {showLogoutSuccess && (

        <div

          className={`logout-success-toast ${
            isToastExiting
              ? 'slide-out'
              : ''
          }`}

        >

          <span>✓</span>

          {successToastMessage}

        </div>

      )}

    </>

  );

}