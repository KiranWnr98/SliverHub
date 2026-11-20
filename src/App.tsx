
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home/Home';

import Shop from './pages/Shop/Shop';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Collections from './pages/Collections/Collections';
import NewArrivals from './pages/NewArrivals/NewArrivals';
import About from './pages/About/About';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Wishlist from './pages/Wishlist/Wishlist';
import CustomerLayout from './layouts/CustomerLayout/CustomerLayout';
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import CustomerLogin from './pages/Customer/Login/Login';
import CustomerSignup from './pages/Customer/Signup/Signup';
import CustomerAccount from './pages/Customer/Account/Account';
import EditProfile from './pages/Customer/EditProfile/EditProfile'; 
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';
import AdminProducts from './pages/Admin/Products/Products';
import AdminCategories from './pages/Admin/Categories/Categories';
import PortalPlaceholder from './pages/PortalPlaceholder';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ProductProvider } from './context/ProductContext';
import WhatsAppButton from "./components/WhatsAppButton/WhatsAppButton";
import ScrollToTop from './pages/Shop/ScrollToTop';

import SparkleBackground from './components/SparkleBackground/SparkleBackground';

function StoreLayout() {
  return (
    <>
      <MainLayout>
        <Outlet />
      </MainLayout>
      <SparkleBackground />
      <WhatsAppButton />
      <ScrollToTop />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ProductProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/products/:productId" element={<ProductDetails />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Route>
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/signup" element={<CustomerSignup />} />
            <Route element={<StoreLayout />}>
            <Route path="/account/profile" element={<EditProfile />} />
            </Route>

            <Route element={<CustomerLayout />}>
              <Route path="/account" element={<CustomerAccount />} />
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
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route
                path="/admin/categories"
                element={<AdminCategories />} />
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
      </ProductProvider>
    </BrowserRouter>
  );
}

export default App;
