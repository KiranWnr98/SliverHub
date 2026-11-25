import { Link } from 'react-router-dom';

import { useStoreSettings } from '../../context/storeSettings';

import logo from '../../assets/logo.png';

export default function Footer() {

  /* =========================================
     DYNAMIC STORE SETTINGS
  ========================================= */

  const settings = useStoreSettings();

  const storeName =
    settings.storeName.trim() || 'SilverHub';

  const storeLogo =
    settings.logo || logo;

  const storeDescription =
    settings.description ||
    'Discover timeless elegance through beautifully crafted silver jewellery.';

  const storeEmail =
    settings.email.trim() || 'support@silverhub.in';

  const storePhone =
    settings.phone.trim();

  const storeAddress =
    settings.address.trim() || 'India';

  const currentYear =
    new Date().getFullYear();

  return (

    <footer className="main-footer">

      <div className="footer-grid">

        {/* =================================
            DYNAMIC STORE BRANDING
        ================================= */}

        <div className="footer-brand">

          <Link
            to="/"
            className="footer-brand-link"
            aria-label={`${storeName} Home`}
          >

            <img
              src={storeLogo}
              alt={`${storeName} Logo`}
              className="footer-brand-logo"
              onError={(event) => {
                if (
                  event.currentTarget.getAttribute('src') !== logo
                ) {
                  event.currentTarget.src = logo;
                }
              }}
            />

            <h2>
              {storeName.toUpperCase()}
            </h2>

          </Link>

          <p>
            {storeDescription}
          </p>

        </div>

        {/* =================================
            QUICK LINKS
        ================================= */}

        <div>

          <h3>Quick Links</h3>

          <Link to="/">
            Home
          </Link>

          <Link to="/shop">
            Shop
          </Link>

          <Link to="/collections">
            Collections
          </Link>

          <Link to="/new-arrivals">
            New Arrivals
          </Link>

          <Link to="/about">
            About Us
          </Link>

        </div>

        {/* =================================
            CUSTOMER CARE
        ================================= */}

        <div>

          <h3>Customer Care</h3>

          <Link to="/contact">
            Contact Us
          </Link>

          <Link to="/shipping">
            Shipping Policy
          </Link>

          <Link to="/returns">
            Returns & Refunds
          </Link>

          <Link to="/faq">
            FAQs
          </Link>

        </div>

        {/* =================================
            DYNAMIC CONTACT DETAILS
        ================================= */}

        <div className="footer-contact">

          <h3>Get in Touch</h3>

          <p>
            We would love to hear from you.
          </p>

          {/* EMAIL */}

          <p className="footer-contact-item">

            Email:{' '}

            <a href={`mailto:${storeEmail}`}>

              {storeEmail}

            </a>

          </p>

          {/* PHONE NUMBER */}

          {storePhone && (

            <p className="footer-contact-item">

              Phone:{' '}

              <a
                href={`tel:${storePhone.replace(/[^\d+]/g, '')}`}
              >

                {storePhone}

              </a>

            </p>

          )}

          {/* STORE ADDRESS */}

          <p className="footer-store-address">

            {storeAddress}

          </p>

        </div>

      </div>

      {/* =====================================
          FOOTER BOTTOM
      ===================================== */}

      <div className="footer-bottom">

        <div className="footer-copyright">

          {/* DYNAMIC COPYRIGHT */}

          <p>

            © {currentYear} {storeName.toUpperCase()}.
            All Rights Reserved.

          </p>

          {/* POWERED BY WINR TECHNOLOGIES */}

          <p className="footer-powered">

            Powered by{' '}

            <a

              href={`https://wa.me/918074543183?text=${encodeURIComponent(
                'Hello WINR Technologies! I would like to know more about your services.'
              )}`}

              target="_blank"

              rel="noopener noreferrer"

            >

              WINR Technologies Pvt. Ltd.

            </a>

          </p>

        </div>

        <p className="footer-made">

          Crafted with elegance ♡

        </p>

      </div>

    </footer>

  );

}