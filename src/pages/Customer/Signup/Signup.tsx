
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!name || !email || password.length < 6) return;

    // Frontend demo only. Never store the password.
    sessionStorage.setItem(
      'silverhub-demo-customer',
      JSON.stringify({ name, email })
    );

    setMessage('Demo account created successfully.');

    navigate('/account');
  }

  return (
    <div className="customer-signup-page">
      <AnnouncementBar />
      <Navbar />

      <main className="customer-signup-main">
        <section className="customer-signup-card">

          {/* Left jewellery image */}
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

          {/* Right signup form */}
          <div className="signup-form-panel">
            <div className="signup-form-content">

              <div className="signup-eyebrow">
                JOIN THE HOUSE
              </div>

              <h1>Create your account</h1>

              <p className="signup-description">
                A little more personal. Your Silver Hub, all in one place.
              </p>

              <div className="signup-demo-notice">
                <ShieldCheck size={23} />

                <div>
                  <strong>Frontend demo account</strong>
                  <p>
                    No backend account or production authentication
                    is created.
                  </p>
                </div>
              </div>

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
                  className="customer-signup-button"
                  type="submit"
                >
                  Create demo account
                  <ArrowRight size={19} />
                </button>
              </form>

              {message && (
                <p className="signup-feedback" role="status">
                  {message}
                </p>
              )}

              <div className="signup-login-link">
                <span>Already have an account?</span>
                <Link to="/login">Sign in</Link>
              </div>

              <p className="signup-legal">
                Your demo details are kept only for this browser session.
                Passwords are never stored.
              </p>

            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
