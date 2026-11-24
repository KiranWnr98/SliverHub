import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  ShoppingBag,
  CreditCard,
  MapPin,
  Smartphone,
  Banknote,
  Box,
  Wallet,
  Clock3,
  Gem,
  Sparkles,
} from "lucide-react";

import {
  getOrders,
  getCustomerEmail,
  type Order,
} from "../../../context/orderStore";

import { useProductImage } from "../../../hooks/useProductMedia";

import "./MyOrders.css";
import "../EditProfile/EditProfile.css";

/* ORDER PRODUCT IMAGE */

function OrderImage({
  image,
  name,
}: {
  image: string;
  name: string;
}) {
  const imageUrl = useProductImage(image);

  return imageUrl ? (
    <img src={imageUrl} alt={name} />
  ) : (
    <Package size={30} />
  );
}

/* MY ORDERS PAGE */

export default function MyOrders() {

  const [orders, setOrders] = useState<Order[]>(getOrders);

  const [loggedIn, setLoggedIn] = useState(
    Boolean(getCustomerEmail())
  );

  /* PAGE LOADING STATE */

  const [loading, setLoading] = useState(true);

  /* DIAMOND LOADING ANIMATION */

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  /* REFRESH CUSTOMER ORDERS */

  useEffect(() => {
    const refreshOrders = () => {
      setOrders(getOrders());
      setLoggedIn(Boolean(getCustomerEmail()));
    };

    window.addEventListener(
      "silverhub-orders-changed",
      refreshOrders
    );

    window.addEventListener(
      "silverhub-auth-changed",
      refreshOrders
    );

    window.addEventListener(
      "storage",
      refreshOrders
    );

    return () => {
      window.removeEventListener(
        "silverhub-orders-changed",
        refreshOrders
      );

      window.removeEventListener(
        "silverhub-auth-changed",
        refreshOrders
      );

      window.removeEventListener(
        "storage",
        refreshOrders
      );
    };
  }, []);

  /* PRICE FORMAT */

  const money = (price: number) =>
    `₹${price.toLocaleString("en-IN")}`;

  /* ORDER SUMMARY CALCULATIONS */

  const totalOrders = orders.length;

  const totalAmountPaid = orders
    .filter(
      (order) => order.paymentStatus === "Demo Paid"
    )
    .reduce(
      (total, order) => total + order.total,
      0
    );

  const pendingAmount = orders
    .filter(
      (order) => order.paymentStatus === "Pending"
    )
    .reduce(
      (total, order) => total + order.total,
      0
    );

  /* ORDER TRACKING STEPS */

  const trackingSteps = [
    {
      name: "Confirmed",
      icon: CheckCircle2,
    },
    {
      name: "Packed",
      icon: Box,
    },
    {
      name: "Shipped",
      icon: Truck,
    },
    {
      name: "Delivered",
      icon: Package,
    },
  ];

  /* =====================================
     SILVERHUB DIAMOND LOADING SCREEN
  ===================================== */

  if (loading) {
    return (
      <div
        className="profile-loading-screen"
        role="status"
        aria-live="polite"
      >

        <div className="jewellery-loader">

          <Gem
            size={48}
            strokeWidth={1.3}
          />

          <Sparkles
            className="loader-sparkle sparkle-one"
            size={17}
          />

          <Sparkles
            className="loader-sparkle sparkle-two"
            size={13}
          />

        </div>

        <h2>SilverHub</h2>

        <p>Preparing your elegant experience...</p>

      </div>
    );
  }

  /* =====================================
     MY ORDERS MAIN PAGE
  ===================================== */

  return (
    <main className="my-orders-page">
      <div className="my-orders-container">

        {/* BACK TO HOME */}

<div className="profile-topbar">
  <Link to="/" className="back-home-link">
    <ArrowLeft size={19} />
    <span>Back to Home</span>
  </Link>
</div>

        {/* PAGE HEADER */}

        <div className="my-orders-header">

          <div>
        

            <h1>My Orders</h1>

        
          </div>

          <div className="orders-header-icon">
            <Package size={30} />
          </div>

        </div>

        {/* ORDER SUMMARY CARDS */}

        {loggedIn && (
          <div className="orders-summary-grid">

            {/* TOTAL ORDERS */}

            <div className="orders-summary-card">

              <div className="orders-summary-icon">
                <Package size={25} />
              </div>

              <div className="orders-summary-content">

                <span>Total Orders</span>

                <h2>
                  {String(totalOrders).padStart(2, "0")}
                </h2>

              </div>

            </div>

            {/* TOTAL AMOUNT PAID */}

            <div className="orders-summary-card">

              <div className="orders-summary-icon">
                <Wallet size={25} />
              </div>

              <div className="orders-summary-content">

                <span>Total Amount Paid (Demo)</span>

                <h2>{money(totalAmountPaid)}</h2>

              </div>

            </div>

            {/* PENDING PAYMENT */}

            <div className="orders-summary-card">

              <div className="orders-summary-icon">
                <Clock3 size={25} />
              </div>

              <div className="orders-summary-content">

                <span>Pending Payment</span>

                <h2>{money(pendingAmount)}</h2>

              </div>

            </div>

          </div>
        )}

        {/* LOGIN REQUIRED */}

        {!loggedIn ? (

          <div className="orders-empty">

            <ShoppingBag size={48} />

            <h2>Login to view your orders</h2>

            <p>
              Please login to view and track your jewellery orders.
            </p>

            <Link
              to="/login"
              className="orders-shop-btn"
            >
              Login
            </Link>

          </div>

        ) : orders.length === 0 ? (

          /* EMPTY ORDERS */

          <div className="orders-empty">

            <ShoppingBag size={48} />

            <h2>No Orders Yet</h2>

            <p>
              Your beautiful jewellery orders will appear here.
            </p>

            <Link
              to="/shop"
              className="orders-shop-btn"
            >
              Explore Collection
            </Link>

          </div>

        ) : (

          /* CUSTOMER ORDERS LIST */

          <div className="orders-list">

            {orders.map((order) => {

              const currentStep = trackingSteps.findIndex(
                (step) => step.name === order.status
              );

              return (
                <article
                  className="customer-order-card"
                  key={order.id}
                >

                  {/* ORDER HEADER */}

                  <div className="order-card-header">

                    <div>

                      <small>ORDER NUMBER</small>

                      <h3>#{order.id}</h3>

                      <p>
                        {new Date(
                          order.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>

                    </div>

                    <span className="order-status">

                      <CheckCircle2 size={15} />

                      {order.status}

                    </span>

                  </div>

                  {/* ORDERED PRODUCTS */}

                  <div className="order-products">

                    {order.items.map((item) => (

                      <div
                        className="order-product"
                        key={item.id}
                      >

                        <div className="order-product-image">

                          <OrderImage
                            image={item.image}
                            name={item.name}
                          />

                        </div>

                        <div className="order-product-info">

                          <h3>{item.name}</h3>

                          <p>
                            Quantity: {item.quantity}
                          </p>

                          <strong>
                            {money(
                              item.price * item.quantity
                            )}
                          </strong>

                        </div>

                      </div>

                    ))}

                  </div>

                  {/* ORDER TRACKING */}

                  <div className="order-tracking">

                    {trackingSteps.map((step, index) => {

                      const Icon = step.icon;

                      return (
                        <div
                          key={step.name}
                          className={`order-tracking-step ${
                            index <= currentStep
                              ? "active"
                              : ""
                          }`}
                        >

                          <div className="tracking-icon">

                            <Icon size={20} />

                          </div>

                          <span>{step.name}</span>

                        </div>
                      );

                    })}

                  </div>

                  {/* PAYMENT AND DELIVERY DETAILS */}

                  <div className="order-details-grid">

                    {/* PAYMENT DETAILS */}

                    <div className="order-detail-box">

                      <h4>

                        {order.paymentMethod === "UPI" ? (

                          <Smartphone size={18} />

                        ) : order.paymentMethod === "Card" ? (

                          <CreditCard size={18} />

                        ) : (

                          <Banknote size={18} />

                        )}

                        Payment Details

                      </h4>

                      <p>
                        {order.paymentMethod === "COD"
                          ? "Cash on Delivery"
                          : order.paymentMethod === "Card"
                          ? "Credit / Debit Card"
                          : "UPI Payment"}
                      </p>

                      <p>
                        Status: {order.paymentStatus}
                      </p>

                    </div>

                    {/* DELIVERY ADDRESS */}

                    <div className="order-detail-box">

                      <h4>

                        <MapPin size={18} />

                        Delivery Address

                      </h4>

                      <p>{order.address.name}</p>

                      <p>
                        {order.address.doorNo},{" "}
                        {order.address.street}
                      </p>

                      <p>
                        {order.address.city},{" "}
                        {order.address.state} -{" "}
                        {order.address.pincode}
                      </p>

                      <p>
                        +91 {order.address.phone}
                      </p>

                    </div>

                  </div>

                  {/* TOTAL ORDER AMOUNT */}

                  <div className="order-card-footer">

                    <span>Total Order Amount</span>

                    <strong>
                      {money(order.total)}
                    </strong>

                  </div>

                </article>
              );

            })}

          </div>

        )}

      </div>
    </main>
  );
}