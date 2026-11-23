import { useState, type FormEvent } from 'react';
import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

import AnnouncementBar from '../../../components/AnnouncementBar/AnnouncementBar';
import Navbar from '../../../components/Navbar/Navbar';

import './signup.css';

export default function CustomerSignup() {
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Preserve the page the customer came from
  const routeState = location.state as {
    from?: string;
  } | null;

  const from =
    typeof routeState?.from === 'string' &&
    routeState.from.startsWith('/') &&
    !routeState.from.startsWith('//')
      ? routeState.from
      : '/account';

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get('name') ?? '').trim();

    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    const password = String(formData.get('password') ?? '');

    // Basic form validation
    if (!name || !email) {
      setMessage('Please enter your name and email.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must contain at least 6 characters.');
      return;
    }

    try {
      // Frontend demo customer session
      // Never store the password
      sessionStorage.setItem(
        'silverhub-demo-customer',
        JSON.stringify({
          name,
          email,
        })
      );

      localStorage.setItem('isLoggedIn', 'true');

      sessionStorage.setItem(
        'silverhub-login-success',
        'true'
      );

      // Notify wishlist/cart listeners of login
      window.dispatchEvent(
        new Event('silverhub-auth-changed')
      );

      // Return to the previous page
      navigate(from, { replace: true });

    } catch {
      setMessage(
        'Unable to create your demo session. Please try again.'
      );
    }
  }

  return (
    <div className="customer-signup-page">

      {/* ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* NAVBAR */}
      <Navbar />

      <main className="customer-signup-main">

        <section className="customer-signup-card">

          {/* LEFT JEWELLERY IMAGE */}
          <div className="signup-visual">

            <div className="signup-visual-content">

              <span className="signup-visual-eyebrow">
                A TOUCH OF TIMELESS BEAUTY
              </span>

              <h2>
                Your story,
                <br />
                your elegance.
              </h2>

              <p>
                Discover jewellery that makes every
                moment unforgettable.
              </p>

            </div>

          </div>

          {/* RIGHT SIGNUP FORM */}
          <div className="signup-form-panel">

            <div className="signup-form-content">

              <div className="signup-eyebrow">
                JOIN THE HOUSE
              </div>

              <h1>Create your account</h1>

              <p className="signup-description">
                A little more personal. Your Silver Hub,
                all in one place.
              </p>

              {/* SIGNUP NOTICE */}
              <div className="signup-demo-notice">

                <ShieldCheck size={23} />

                <div>
                  <strong>Frontend demo account</strong>

                  <p>
                    No backend account or production
                    authentication is created.
                  </p>
                </div>

              </div>

              {/* SIGNUP FORM */}
              <form
                onSubmit={handleSubmit}
                className="customer-signup-form"
              >

                <label htmlFor="signup-name">
                  <User size={17} />
                  Your name
                </label>

                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                />

                <label htmlFor="signup-email">
                  <Mail size={17} />
                  Email address
                </label>

                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <label htmlFor="signup-password">
                  <Lock size={17} />
                  Create a password
                </label>

                <div className="signup-password-wrapper">

                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="signup-password-toggle"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                {/* SUBMIT BUTTON */}
                <button
                  className="customer-signup-button"
                  type="submit"
                >
                  Create demo account
                  <ArrowRight size={19} />
                </button>

              </form>

              {/* ERROR MESSAGE */}
              {message && (
                <p
                  className="signup-feedback"
                  role="status"
                >
                  {message}
                </p>
              )}

              {/* LOGIN LINK */}
              <div className="signup-login-link">

                <span>
                  Already have an account?
                </span>

                <Link
                  to="/login"
                  state={{ from }}
                >
                  Sign in
                </Link>

              </div>

              <p className="signup-legal">
                Your demo details are kept only for
                this browser session. Passwords are
                never stored.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}