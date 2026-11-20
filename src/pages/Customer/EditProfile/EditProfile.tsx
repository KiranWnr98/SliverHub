import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';

import {
  UserRound,
  ArrowLeft,
  Gem,
  Save,
  CheckCircle2,
  Sparkles,
  Camera
} from 'lucide-react';

import './EditProfile.css';

interface CustomerProfile {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export default function EditProfile() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [profileImage, setProfileImage] = useState(
    () => sessionStorage.getItem('silverhub-profile-image') || ''
  );

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isToastExiting, setIsToastExiting] = useState(false);

  // Load existing customer details
  useEffect(() => {
    const storedCustomer = sessionStorage.getItem(
      'silverhub-demo-customer'
    );

    if (storedCustomer) {
      try {
        const customer: CustomerProfile = JSON.parse(storedCustomer);
        const fullName = customer.name?.trim().split(/\s+/) || [];

        setFirstName(customer.firstName || fullName[0] || '');
        setLastName(
          customer.lastName || fullName.slice(1).join(' ') || ''
        );

        setEmail(customer.email || '');
        setPhone(customer.phone || '');
      } catch {
        setError('Unable to load your profile details.');
      }
    }

    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  // Success toast animation
  useEffect(() => {
    if (!saved) return;

    setIsToastExiting(false);

    const exitTimer = window.setTimeout(() => {
      setIsToastExiting(true);
    }, 3000);

    const removeTimer = window.setTimeout(() => {
      setSaved(false);
      setIsToastExiting(false);
    }, 3500);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [saved]);

  // Profile photo upload
  const handleImageChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image.');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Image size must be less than 1MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);

        sessionStorage.setItem(
          'silverhub-profile-image',
          reader.result
        );

        window.dispatchEvent(new Event('profileImageUpdated'));

        setError('');
        setSaved(false);
      }
    };

    reader.onerror = () => {
      setError('Unable to read the selected image.');
    };

    reader.readAsDataURL(file);

    // Allow selecting the same image again
    event.target.value = '';
  };

  // Save profile details
  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setSaved(false);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first name and last name.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    const updatedCustomer: CustomerProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      phone: phone.trim()
    };

    try {
      sessionStorage.setItem(
        'silverhub-demo-customer',
        JSON.stringify(updatedCustomer)
      );

      if (profileImage) {
        sessionStorage.setItem(
          'silverhub-profile-image',
          profileImage
        );
      } else {
        sessionStorage.removeItem('silverhub-profile-image');
      }

      setSaved(true);
    } catch {
      setError('Unable to save your details. Please try again.');
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="profile-loading-screen">
        <div className="jewellery-loader">
          <Gem size={48} strokeWidth={1.3} />
          <Sparkles className="loader-sparkle sparkle-one" size={17} />
          <Sparkles className="loader-sparkle sparkle-two" size={13} />
        </div>

        <h2>SilverHub</h2>
        <p>Preparing your elegant experience...</p>
      </div>
    );
  }

  return (
    <main className="edit-profile-page">

      <div className="profile-topbar">
        <Link to="/" className="back-home-link">
          <ArrowLeft size={19} />
          <span>Back to Home</span>
        </Link>
      </div>

      <section className="edit-profile-container">

        <div className="profile-heading">

          {/* PROFILE PHOTO */}
          <div className="profile-photo-wrapper">

            <div
              className="profile-photo"
              onClick={() =>
                document.getElementById('profile-photo-upload')?.click()
              }
              title="Upload profile photo"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" />
              ) : (
                <UserRound size={43} strokeWidth={1.5} />
              )}
            </div>

            <label
              htmlFor="profile-photo-upload"
              className="photo-upload-button"
              title="Upload profile photo"
            >
              <Camera size={17} />
            </label>

            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />

          </div>

          <p className="photo-hint">Upload your profile photo</p>

          {profileImage && (
            <button
              type="button"
              className="remove-profile-button"
              onClick={() => setShowRemoveConfirm(true)}
            >
              Remove Profile Photo
            </button>
          )}

          <h1>Edit Your Profile</h1>
          <p>Manage your personal information</p>
        </div>

        <form className="profile-form" onSubmit={handleSave}>

          <div className="profile-form-grid">

            <div className="profile-input-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="profile-input-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="profile-input-group full-width">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="profile-input-group full-width">
              <label htmlFor="phone">Phone Number</label>

              <div className="phone-input-wrapper">
                <span>+91</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value.replace(/\D/g, '').slice(0, 10)
                    )
                  }
                  required
                />
              </div>
            </div>

          </div>

          {error && (
            <p className="profile-error-message">{error}</p>
          )}

          {saved && (
            <div
              className={`profile-success-toast ${
                isToastExiting ? 'slide-out' : ''
              }`}
            >
              <CheckCircle2 size={22} />
              <div>
                <strong>Profile Updated!</strong>
                <p>Your profile has been updated successfully.</p>
              </div>
            </div>
          )}

          <button type="submit" className="save-profile-button">
            <Save size={18} />
            Save Changes
          </button>

        </form>
      </section>

      {/* REMOVE PHOTO CONFIRMATION */}
      {showRemoveConfirm && (
        <div className="remove-confirm-overlay">
          <div className="remove-confirm-modal">

            <h2>Remove Profile Photo?</h2>

            <p>Are you sure you want to remove your profile photo?</p>

            <div className="remove-modal-actions">

              <button
                type="button"
                className="confirm-remove-btn"
                onClick={() => {
                  setProfileImage('');
                  sessionStorage.removeItem('silverhub-profile-image');

                  window.dispatchEvent(
                    new Event('profileImageUpdated')
                  );

                  setShowRemoveConfirm(false);
                  setSaved(false);
                  setError('');
                }}
              >
                Remove
              </button>

              <button
                type="button"
                className="cancel-remove-btn"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}

    </main>
  );
}