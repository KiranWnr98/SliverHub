
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h2>SILVER HUB</h2>
          <span>HOUSE OF 925</span>
          <p>
            Discover timeless elegance through beautifully
            crafted silver jewellery.
          </p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/collections">Collections</Link>
          <Link to="/new-arrivals">New Arrivals</Link>
          <Link to="/about">About Us</Link>
        </div>

        <div>
          <h3>Customer Care</h3>
          <Link to="/contact">Contact Us</Link>
          <Link to="/shipping">Shipping Policy</Link>
          <Link to="/returns">Returns & Refunds</Link>
          <Link to="/faq">FAQs</Link>
        </div>

        <div>
          <h3>Get in Touch</h3>
          <p>We would love to hear from you.</p>
          <p>Email: support@silverhub.in</p>
          <p>India</p>
        </div>
      </div>

      
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>© 2026 SILVER HUB. All Rights Reserved.</p>
          <p className="footer-powered">
            Powered by WINR Technologies Pvt. Ltd.
          </p>
        </div>

        <p className="footer-made">
          Crafted with elegance ♡
        </p>
      </div>

    </footer>
  );
}
