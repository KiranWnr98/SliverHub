import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  Navigate,
} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';

// =========================================
// STORE PAGES
// =========================================

import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Collections from './pages/Collections/Collections';
import NewArrivals from './pages/NewArrivals/NewArrivals';
import About from './pages/About/About';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Wishlist from './pages/Wishlist/Wishlist';

// =========================================
// LAYOUTS
// =========================================

import CustomerLayout from './layouts/CustomerLayout/CustomerLayout';
import AdminLayout from './layouts/AdminLayout/AdminLayout';

// =========================================
// CUSTOMER PAGES
// =========================================

import CustomerLogin from './pages/Customer/Login/Login';
import CustomerSignup from './pages/Customer/Signup/Signup';
import CustomerAccount from './pages/Customer/Account/Account';
import EditProfile from './pages/Customer/EditProfile/EditProfile';
import Address from './pages/Customer/Address/Address';
import MyOrders from './pages/Customer/MyOrders/MyOrders';

// =========================================
// ADMIN PAGES
// =========================================

import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import AdminProducts from './pages/Admin/Products/Products';
import AdminCategories from './pages/Admin/Categories/Categories';
import AdminOrders from './pages/Admin/Orders/Orders';
import AdminInventory from './pages/Admin/Inventory/Inventory';
import AdminCustomers from './pages/Admin/Customers/Customers';

// =========================================
// ADMIN SETTINGS
// =========================================

import StoreConfiguration from './pages/Admin/Settings/StoreConfiguration/StoreConfiguration';
import Payments from './pages/Admin/Settings/Payments/Payments';
import Reports from './pages/Admin/Settings/Reports/Reports';


// =========================================
// CONTEXT PROVIDERS
// =========================================

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ProductProvider } from './context/ProductContext';

// =========================================
// COMMON COMPONENTS
// =========================================

import WhatsAppButton from './components/WhatsAppButton/WhatsAppButton';
import ScrollToTop from './pages/Shop/ScrollToTop';
import SparkleBackground from './components/SparkleBackground/SparkleBackground';

/* =========================================
   STORE LAYOUT
========================================= */

function StoreLayout() {

  const location = useLocation();

  // Sparkles only on Home page

  const isHomePage = location.pathname === '/';

  return (

    <>

      <MainLayout>

        <Outlet />

      </MainLayout>

      {/* SPARKLES - HOME PAGE ONLY */}

      {isHomePage && <SparkleBackground />}

      {/* COMMON STORE COMPONENTS */}

      <WhatsAppButton />

      <ScrollToTop />

    </>

  );

}

/* =========================================
   APP ROUTES
========================================= */

function App() {

  return (

    <BrowserRouter>

      <ProductProvider>

        <CartProvider>

          <WishlistProvider>

            <Routes>

              {/* =================================
                  STORE ROUTES
              ================================= */}

              <Route element={<StoreLayout />}>

                <Route
                  path="/"
                  element={<Home />}
                />

                <Route
                  path="/shop"
                  element={<Shop />}
                />

                <Route
                  path="/products/:productId"
                  element={<ProductDetails />}
                />

                <Route
                  path="/collections"
                  element={<Collections />}
                />

                <Route
                  path="/new-arrivals"
                  element={<NewArrivals />}
                />

                <Route
                  path="/about"
                  element={<About />}
                />

                <Route
                  path="/cart"
                  element={<Cart />}
                />

                <Route
                  path="/checkout"
                  element={<Checkout />}
                />

                <Route
                  path="/wishlist"
                  element={<Wishlist />}
                />

              </Route>

              {/* =================================
                  CUSTOMER AUTHENTICATION
              ================================= */}

              <Route
                path="/login"
                element={<CustomerLogin />}
              />

              <Route
                path="/signup"
                element={<CustomerSignup />}
              />

              {/* =================================
                  CUSTOMER PAGES
              ================================= */}

              <Route element={<StoreLayout />}>

                <Route
                  path="/orders"
                  element={<MyOrders />}
                />

                <Route
                  path="/account/orders"
                  element={<MyOrders />}
                />

                <Route
                  path="/account/profile"
                  element={<EditProfile />}
                />

                <Route
                  path="/address"
                  element={<Address />}
                />

                <Route
                  path="/account/addresses"
                  element={<Address />}
                />

              </Route>

              {/* =================================
                  CUSTOMER ACCOUNT
              ================================= */}

              <Route element={<CustomerLayout />}>

                <Route
                  path="/account"
                  element={<CustomerAccount />}
                />

              </Route>

              {/* =================================
                  ADMIN PORTAL
              ================================= */}

              <Route element={<AdminLayout />}>

                {/* DASHBOARD */}

                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboard />}
                />

                {/* PRODUCTS */}

                <Route
                  path="/admin/products"
                  element={<AdminProducts />}
                />

                {/* CATEGORIES */}

                <Route
                  path="/admin/categories"
                  element={<AdminCategories />}
                />

                {/* ORDERS */}

                <Route
                  path="/admin/orders"
                  element={<AdminOrders />}
                />

                {/* INVENTORY */}

                <Route
                  path="/admin/inventory"
                  element={<AdminInventory />}
                />

                {/* CUSTOMERS */}

                <Route
                  path="/admin/customers"
                  element={<AdminCustomers />}
                />

                {/* =================================
                    ADMIN SETTINGS
                ================================= */}

                {/* DEFAULT SETTINGS REDIRECT */}

                <Route
                  path="/admin/settings"
                  element={
                    <Navigate
                      to="/admin/settings/store"
                      replace
                    />
                  }
                />

                {/* STORE CONFIGURATION */}

                <Route
                  path="/admin/settings/store"
                  element={<StoreConfiguration />}
                />

                {/* PAYMENT SETTINGS */}

                <Route
                 path="/admin/settings/payments"
                 element={<Payments />}
                />

                {/* BUSINESS REPORTS */}

                <Route
                 path="/admin/settings/reports"
                 element={<Reports />}
                />

              </Route>

            </Routes>

          </WishlistProvider>

        </CartProvider>

      </ProductProvider>

    </BrowserRouter>

  );

}

export default App;