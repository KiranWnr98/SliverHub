import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  X,
  LockKeyhole,
  ShoppingBag,
} from 'lucide-react';

import './AuthPopup.css';

interface AuthPopupProps {
  open: boolean;
  onClose: () => void;
  type?: 'wishlist' | 'cart';
}

export default function AuthPopup({
  open,
  onClose,
  type = 'wishlist',
}: AuthPopupProps) {
  const location = useLocation();

  const destination =
    location.pathname + location.search;

  const isCart = type === 'cart';

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="auth-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-popup-title"
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 25,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 20,
            }}
            transition={{ duration: 0.3 }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="auth-popup-close"
              onClick={onClose}
              aria-label="Close popup"
            >
              <X size={20} />
            </button>

            <div className="auth-popup-icon">
              {isCart ? (
                <ShoppingBag size={29} />
              ) : (
                <Heart size={29} />
              )}
            </div>

            <span className="auth-popup-eyebrow">
              SILVERHUB EXCLUSIVE
            </span>

            <h2 id="auth-popup-title">
              {isCart
                ? 'Add to Your Box'
                : 'Save Your Favourites'}
            </h2>

            <p>
              {isCart
                ? 'Please login or create an account to add this beautiful silver jewellery to your box.'
                : 'Login or create an account to save your favourite silver jewellery.'}
            </p>

            <Link
              to="/login"
              state={{ from: destination }}
              className="auth-popup-login"
              onClick={onClose}
            >
              <LockKeyhole size={17} />
              Login
            </Link>

            <Link
              to="/signup"
              state={{ from: destination }}
              className="auth-popup-signup"
              onClick={onClose}
            >
              Create Account
            </Link>

            <span className="auth-popup-footer">
              {isCart
                ? 'Your jewellery box awaits.'
                : 'Your favourites, beautifully saved.'}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}