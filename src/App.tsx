
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';

import Shop from './pages/Shop/Shop';
import Collections from './pages/Collections/Collections';
import NewArrivals from './pages/NewArrivals/NewArrivals';
import About from './pages/About/About';
import Cart from './pages/Cart/Cart';
import Wishlist from './pages/Wishlist/Wishlist';
import CustomerLayout from './layouts/CustomerLayout/CustomerLayout';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import CustomerLogin from './pages/Customer/Login/Login';
import CustomerSignup from './pages/Customer/Signup/Signup';
import CustomerAccount from './pages/Customer/Account/Account';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import PortalPlaceholder from './pages/PortalPlaceholder';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import WhatsAppButton from "./components/WhatsAppButton/WhatsAppButton";

import SparkleBackground from './components/SparkleBackground/SparkleBackground';

function StoreLayout() {
  return (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <SparkleBackground />
      <WhatsAppButton />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>
          <Routes>
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Route>
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/signup" element={<CustomerSignup />} />
            <Route element={<CustomerLayout />}>
              <Route path="/account" element={<CustomerAccount />} />
              <Route
                path="/account/profile"
                element={<PortalPlaceholder title="My profile" />}
              />
              <Route
                path="/account/orders"
                element={<PortalPlaceholder title="My orders" />}
              />
              <Route
                path="/account/addresses"
                element={<PortalPlaceholder title="My addresses" />}
              />
            </Route>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route
                path="/admin/products"
                element={<PortalPlaceholder title="Products" admin />}
              />
              <Route
                path="/admin/categories"
                element={<PortalPlaceholder title="Categories" admin />}
              />
              <Route
                path="/admin/orders"
                element={<PortalPlaceholder title="Orders" admin />}
              />
              <Route
                path="/admin/inventory"
                element={<PortalPlaceholder title="Inventory" admin />}
              />
              <Route
                path="/admin/customers"
                element={<PortalPlaceholder title="Customers" admin />}
              />
              <Route
                path="/admin/settings"
                element={<PortalPlaceholder title="Settings" admin />}
              />
            </Route>
          </Routes>
        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
