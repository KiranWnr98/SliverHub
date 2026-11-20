import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useCart } from '../../context/useCart';
import {
  isProductPurchasable,
  useProductCatalog,
} from '../../hooks/useProducts';
import { useProductImage } from '../../hooks/useProductMedia';

function CheckoutProductImage({ image, name }: { image: string; name: string }) {
  const imageUrl = useProductImage(image);
  return imageUrl ? <img src={imageUrl} alt={name} /> : null;
}

export default function Checkout() {
  const { cart } = useCart();
  const { products } = useProductCatalog();
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const checkoutItems = useMemo(
    () =>
      cart.flatMap((item) => {
        const product = productById.get(item.product.id);
        return product &&
          isProductPurchasable(product) &&
          item.quantity <= (product.stockQuantity ?? 0)
          ? [{ product, quantity: item.quantity }]
          : [];
      }),
    [cart, productById],
  );
  const subtotal = checkoutItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString('en-IN')}`;

  if (checkoutItems.length === 0) {
    return (
      <main className="cart-page">
        <div className="cart-header">
          <span className="cart-eyebrow">SECURE CHECKOUT</span>
          <h1>Checkout</h1>
        </div>
        <section className="empty-cart">
          <h2>No available products to purchase</h2>
          <p>Return to your Jewellery Box to review your saved items.</p>
          <Link to="/cart" className="continue-shopping">
            <ArrowLeft size={17} />
            Return to Jewellery Box
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-header">
        <span className="cart-eyebrow">SECURE CHECKOUT</span>
        <h1>Checkout</h1>
        <p>Review the available products in your order.</p>
      </div>

      <div className="cart-layout">
        <section className="cart-items-section">
          <div className="cart-items-heading">
            <h2>Available products</h2>
            <span>
              {checkoutItems.reduce(
                (total, item) => total + item.quantity,
                0,
              )}{' '}
              items
            </span>
          </div>

          {checkoutItems.map(({ product, quantity }) => (
            <article className="cart-item" key={product.id}>
              <div className="cart-product-image">
                <CheckoutProductImage image={product.image} name={product.name} />
              </div>
              <div className="cart-product-details">
                <span className="cart-product-category">
                  {product.category}
                </span>
                <h3>{product.name}</h3>
                <p className="cart-product-price">
                  {formatPrice(product.price)} × {quantity}
                </p>
              </div>
              <div className="cart-item-actions">
                <strong>{formatPrice(product.price * quantity)}</strong>
              </div>
            </article>
          ))}

          <Link to="/cart" className="back-to-shopping">
            <ArrowLeft size={17} />
            Return to Jewellery Box
          </Link>
        </section>

        <aside className="cart-summary">
          <h2>Order Summary</h2>
          <div className="summary-total">
            <span>Payable subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <p className="cart-secure-note">
            Only currently available products are included in this order.
          </p>
        </aside>
      </div>
    </main>
  );
}