import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

import AnnouncementBar from '../../../components/AnnouncementBar/AnnouncementBar';
import Navbar from '../../../components/Navbar/Navbar';

import './login.css';

// Replace these with the admin credentials provided by your sir.
// Demo only: credentials in frontend code are not secure.
const ADMIN_EMAIL = 'admin@silverhub.com';
const ADMIN_PASSWORD = 'ChangeThisPassword';

export default function CustomerLogin() {
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

const from =
  (location.state as { from?: string } | null)?.from;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(formData.get('password') ?? '');

    if (!email || !password) return;

    // ADMIN LOGIN
    if (email === ADMIN_EMAIL.toLowerCase()) {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(
          'silverhub-user',
          JSON.stringify({
            email,
            role: 'admin',
          })
        );

        navigate('/admin/dashboard');
        return;
      }

      setMessage('Incorrect admin password. Please try again.');
      return;
    }

    // CUSTOMER DEMO LOGIN
// CUSTOMER DEMO LOGIN
sessionStorage.setItem(
  'silverhub-demo-customer',
  JSON.stringify({ email })
);

localStorage.setItem('isLoggedIn', 'true');

sessionStorage.setItem(
  'silverhub-login-success',
  'true'
);

// Notify wishlist that customer logged in
window.dispatchEvent(
  new Event('silverhub-auth-changed')
);

// Redirect to previous page
navigate(from || '/');
  }

  return (
    <div className="customer-login-page">

      {/* Store Announcement */}
      <AnnouncementBar />

      {/* Store Navigation */}
      <Navbar />

      <main className="customer-login-main">

        <section className="customer-login-container">

          {/* Left Jewellery Image Section */}
          <div className="login-visual">

            <div className="login-image-overlay">
              <span className="login-image-eyebrow">
                THE BEAUTY OF 925 SILVER
              </span>

              <h2>
                Elegance that
                <br />
                lasts forever.
              </h2>

              <p>
                Discover timeless silver jewellery,
                crafted for your special moments.
              </p>
            </div>

          </div>

          {/* Right Login Form */}
          <div className="login-form-section">

            <div className="login-form-content">

              <div className="login-eyebrow">
                YOUR SILVERHUB
              </div>

              <h1>Welcome Back</h1>

              <p className="login-description">
                Sign in to explore your account, orders and saved details.
              </p>

              {/* Login Notice */}
              <div className="login-demo-notice">
                <ShieldCheck size={23} />

                <div>
                  <strong>Secure your SilverHub experience</strong>
                  <p>
                    Sign in to access your customer account or
                    authorized admin workspace.
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form
                onSubmit={handleSubmit}
                className="customer-login-form"
              >

                <label htmlFor="customer-email">
                  <Mail size={17} />
                  Email address
                </label>

                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <label htmlFor="customer-password">
                  <Lock size={17} />
                  Password
                </label>

                <div className="login-password-wrapper">

                  <input
                    id="customer-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                <button
                  className="customer-login-button"
                  type="submit"
                >
                  Sign in to your account
                  <ArrowRight size={19} />
                </button>

              </form>

              {message && (
                <p className="login-feedback" role="status">
                  {message}
                </p>
              )}

              <div className="login-signup">
                <span>New to Silver Hub?</span>

                <Link to="/signup">
                  Create an account
                </Link>
              </div>

              <p className="login-legal">
                Your SilverHub account experience starts here.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}