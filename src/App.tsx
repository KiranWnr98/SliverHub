
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';

import Shop from './pages/Shop';
import Collections from './pages/Collections';
import NewArrivals from './pages/NewArrivals';
import About from './pages/About';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';

import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import WhatsAppButton from "./components/WhatsAppButton";

import SparkleBackground from './components/SparkleBackground';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/about" element={<About />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
            </Routes>
          </MainLayout>

          <SparkleBackground />
          <WhatsAppButton />
        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
