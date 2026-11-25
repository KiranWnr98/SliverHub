import { useEffect, useState, useRef } from 'react';

import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';

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
  ChevronDown,
  CreditCard,
  ChartColumn,
  SlidersHorizontal,
  UserRound,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

import {
  motion,
  AnimatePresence,
} from 'framer-motion';

import logo from '../../assets/logo.png';

import '../portal.css';
import './AdminLayout.css';

/* =========================================
   MAIN NAVIGATION
========================================= */

const navigation = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: ChartNoAxesCombined,
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: Boxes,
  },
  {
    to: '/admin/categories',
    label: 'Categories',
    icon: Layers3,
  },
  {
    to: '/admin/orders',
    label: 'Orders',
    icon: ClipboardList,
  },
  {
    to: '/admin/inventory',
    label: 'Inventory',
    icon: PackageSearch,
  },
  {
    to: '/admin/customers',
    label: 'Customers',
    icon: UsersRound,
  },
];

/* =========================================
   SETTINGS NAVIGATION
========================================= */

const settingsNavigation = [
  {
    to: '/admin/settings/store',
    label: 'Store Configuration',
    icon: SlidersHorizontal,
  },
  {
    to: '/admin/settings/payments',
    label: 'Payments',
    icon: CreditCard,
  },
  {
    to: '/admin/settings/reports',
    label: 'Reports',
    icon: ChartColumn,
  },
];

/* =========================================
   ADMIN LAYOUT
========================================= */

export default function AdminLayout() {

  const location = useLocation();
  const navigate = useNavigate();

  const profileRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [showLogoutPopup, setShowLogoutPopup] =
    useState(false);

  const isSettingsActive =
    location.pathname === '/admin/settings' ||
    location.pathname.startsWith('/admin/settings/');

  const [settingsOpen, setSettingsOpen] =
    useState(isSettingsActive);

  /* KEEP SETTINGS OPEN */

  useEffect(() => {

    if (isSettingsActive) {
      setSettingsOpen(true);
    }

    setProfileOpen(false);

  }, [location.pathname, isSettingsActive]);

  /* CLOSE PROFILE ON OUTSIDE CLICK */

  useEffect(() => {

    function handleOutsideClick(event: MouseEvent) {

      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {
        setProfileOpen(false);
      }

    }

    function handleEscape(event: KeyboardEvent) {

      if (event.key === 'Escape') {
        setProfileOpen(false);
        setShowLogoutPopup(false);
      }

    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    );

    document.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {

      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );

    };

  }, []);

  /* ADMIN AUTHENTICATION */

  let adminUser = null;

  try {

    adminUser = JSON.parse(
      sessionStorage.getItem('silverhub-user') ||
      'null'
    );

  } catch {

    adminUser = null;

  }

  /* ADMIN LOGOUT */

  function handleAdminLogout() {

    sessionStorage.removeItem('silverhub-user');

    localStorage.removeItem('isLoggedIn');

    sessionStorage.removeItem(
      'silverhub-demo-customer'
    );

    sessionStorage.removeItem(
      'silverhub-profile-image'
    );

    sessionStorage.setItem(
      'silverhub-admin-logout-success',
      'true'
    );

    setShowLogoutPopup(false);
    setProfileOpen(false);
    setSidebarOpen(false);

    window.dispatchEvent(
      new Event('silverhub-auth-changed')
    );

    navigate('/login', {
      replace: true,
      state: {
        adminLogoutSuccess: true,
      },
    });

  }

  /* PROTECTED ADMIN ROUTES */

  if (adminUser?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const adminName =
    typeof adminUser.name === 'string' &&
    adminUser.name.trim()
      ? adminUser.name
      : 'Store Admin';

  const adminEmail =
    typeof adminUser.email === 'string'
      ? adminUser.email
      : '';

  return (

    <div className="admin-portal portal">

      {/* ADMIN SIDEBAR */}

      <aside
        className={`admin-sidebar${
          sidebarOpen ? ' is-open' : ''
        }`}
      >

        <Link
          to="/admin/dashboard"
          className="admin-brand"
          onClick={() => {
            setSidebarOpen(false);
            setSettingsOpen(false);
          }}
        >

          <img
            src={logo}
            alt=""
            className="admin-brand-logo"
          />

          <span>
            SILVERHUB
            <small>ADMIN STUDIO</small>
          </span>

        </Link>

        <div className="sidebar-label">
          WORKSPACE
        </div>

        <nav aria-label="Admin navigation">

          {navigation.map(
            ({ to, label, icon: Icon }) => (

              <NavLink
                key={to}
                to={to}
                onClick={() => {
                  setSidebarOpen(false);
                  setSettingsOpen(false);
                }}
              >

                <Icon size={18} />

                {label}

              </NavLink>

            )
          )}

          {/* SETTINGS DROPDOWN */}

          <div className="admin-settings-group">

            <button
              type="button"
              className={`admin-settings-toggle ${
                isSettingsActive
                  ? 'settings-active'
                  : ''
              } ${
                settingsOpen
                  ? 'settings-open'
                  : ''
              }`}
              onClick={() =>
                setSettingsOpen((open) => !open)
              }
              aria-expanded={settingsOpen}
              aria-controls="admin-settings-submenu"
            >

              <span className="admin-settings-label">

                <Settings size={18} />

                <span>Settings</span>

              </span>

              <motion.span
                className="admin-settings-arrow"
                animate={{
                  rotate: settingsOpen ? 180 : 0,
                }}
                transition={{ duration: 0.25 }}
              >

                <ChevronDown size={16} />

              </motion.span>

            </button>

            <AnimatePresence initial={false}>

              {settingsOpen && (

                <motion.div
                  id="admin-settings-submenu"
                  className="admin-settings-submenu"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                  }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: 'easeInOut',
                  }}
                >

                  <div className="admin-settings-submenu-inner">

                    {settingsNavigation.map(
                      ({ to, label, icon: Icon }) => (

                        <NavLink
                          key={to}
                          to={to}
                          end
                          className={({ isActive }) =>
                            `admin-settings-submenu-link${
                              isActive ? ' active' : ''
                            }`
                          }
                          onClick={() =>
                            setSidebarOpen(false)
                          }
                        >

                          <Icon size={16} />

                          <span>{label}</span>

                        </NavLink>

                      )
                    )}

                  </div>

                </motion.div>

              )}

            </AnimatePresence>

          </div>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          <span className="demo-indicator">

            <i />

            Demo environment

          </span>

        </div>

      </aside>

      {/* MOBILE SIDEBAR BACKDROP */}

      {sidebarOpen && (

        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
        />

      )}

      {/* ADMIN WORKSPACE */}

      <section className="admin-workspace">

        <header className="admin-topbar">

          <button
            type="button"
            className="sidebar-toggle"
            aria-label={
              sidebarOpen
                ? 'Close navigation'
                : 'Open navigation'
            }
            onClick={() =>
              setSidebarOpen((open) => !open)
            }
          >

            {sidebarOpen
              ? <X size={20} />
              : <Menu size={20} />
            }

          </button>

          <div className="admin-topbar-title">

            Admin portal

            <span>·</span>

            Demo

          </div>

          {/* ADMIN PROFILE */}

          <div
            className="admin-profile-wrapper"
            ref={profileRef}
          >

            <button
              type="button"
              className={`admin-profile-button ${
                profileOpen ? 'profile-active' : ''
              }`}
              onClick={() =>
                setProfileOpen((open) => !open)
              }
              aria-label="Admin profile"
              aria-expanded={profileOpen}
              aria-controls="admin-profile-dropdown"
            >

              <span className="admin-profile-avatar">

                <UserRound size={21} />

              </span>

              <div className="admin-profile-details">

                <strong>{adminName}</strong>

                <small>Administrator</small>

              </div>

              <motion.span
                className="admin-profile-arrow"
                animate={{
                  rotate: profileOpen ? 180 : 0,
                }}
                transition={{ duration: 0.2 }}
              >

                <ChevronDown size={16} />

              </motion.span>

            </button>

            {/* PROFILE DROPDOWN */}

            <AnimatePresence>

              {profileOpen && (

                <motion.div
                  id="admin-profile-dropdown"
                  className="admin-profile-dropdown"
                  initial={{
                    opacity: 0,
                    y: -8,
                    scale: 0.97,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    scale: 0.97,
                  }}
                  transition={{ duration: 0.2 }}
                >

                  <div className="admin-dropdown-header">

                    <span className="admin-dropdown-avatar">

                      <ShieldCheck size={25} />

                    </span>

                    <div>

                      <strong>{adminName}</strong>

                      <small>Administrator</small>

                      {adminEmail && (
                        <p>{adminEmail}</p>
                      )}

                    </div>

                  </div>

                  <div className="admin-dropdown-divider" />

                  <button
                    type="button"
                    className="admin-logout-option"
                    onClick={() => {
                      setProfileOpen(false);
                      setShowLogoutPopup(true);
                    }}
                  >

                    <LogOut size={18} />

                    <span>Logout</span>

                  </button>

                </motion.div>

              )}

            </AnimatePresence>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="portal-main admin-main">

          <Outlet />

        </main>

      </section>

      {/* LOGOUT CONFIRMATION POPUP */}

      <AnimatePresence>

        {showLogoutPopup && (

          <motion.div
            className="admin-logout-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              setShowLogoutPopup(false)
            }
          >

            <motion.div
              className="admin-logout-popup"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-logout-title"
              initial={{
                opacity: 0,
                scale: 0.85,
                y: 25,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 15,
              }}
              transition={{ duration: 0.25 }}
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <button
                type="button"
                className="admin-logout-close"
                aria-label="Close logout confirmation"
                onClick={() =>
                  setShowLogoutPopup(false)
                }
              >

                <X size={19} />

              </button>

              <motion.div
                className="admin-logout-icon"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 15,
                }}
              >

                <LogOut size={32} />

              </motion.div>

              <h2 id="admin-logout-title">
                Confirm Logout
              </h2>

              <p>
                Are you sure you want to log out
                of the admin panel?
              </p>

              <div className="admin-logout-actions">

                <button
                  type="button"
                  className="admin-logout-cancel"
                  autoFocus
                  onClick={() =>
                    setShowLogoutPopup(false)
                  }
                >

                  Cancel

                </button>

                <button
                  type="button"
                  className="admin-logout-confirm"
                  onClick={handleAdminLogout}
                >

                  <LogOut size={16} />

                  Yes, Logout

                </button>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>

  );

}