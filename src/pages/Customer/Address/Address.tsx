import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import {
  ArrowLeft,
  MapPin,
  Plus,
  LocateFixed,
  Pencil,
  Trash2,
  House,
  BriefcaseBusiness,
  Check,
  X,
  Navigation,
  Gem,
  Sparkles,
} from "lucide-react";

import "leaflet/dist/leaflet.css";
import "./Address.css";

type AddressType = "Home" | "Work" | "Other";

type Address = {
  id: string;
  name: string;
  phone: string;
  doorNo: string;
  street: string;
  pincode: string;
  landmark: string;
  city: string;
  state: string;
  alternatePhone: string;
  addressType: AddressType;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

const initialForm: Address = {
  id: "",
  name: "",
  phone: "",
  doorNo: "",
  street: "",
  pincode: "",
  landmark: "",
  city: "",
  state: "",
  alternatePhone: "",
  addressType: "Home",
  latitude: null,
  longitude: null,
  isDefault: false,
};

const DEFAULT_CENTER: LatLngExpression = [20.5937, 78.9629];

const markerIcon = L.divIcon({
  className: "address-map-marker",
  html: '<div class="address-marker-pin"></div>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

function MapController({
  position,
}: {
  position: LatLngExpression;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 16, { duration: 1.2 });
  }, [map, position]);

  return null;
}

function LocationPicker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

const STORAGE_KEY = "silverhub-addresses";

function getStorageKey() {
  try {
    const customer = JSON.parse(
      sessionStorage.getItem("silverhub-demo-customer") || "null"
    );

    const identifier = customer?.email;

    if (typeof identifier === "string" && identifier.trim()) {
      return `${STORAGE_KEY}-${identifier.toLowerCase()}`;
    }
  } catch {
    // Ignore invalid session data
  }

  return `${STORAGE_KEY}-guest`;
}

export default function Addresses() {
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Address>({ ...initialForm });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [isToastClosing, setIsToastClosing] = useState(false);

  const [storageKey, setStorageKey] = useState(getStorageKey);

  // Diamond loading animation
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  // Detect customer changes
  useEffect(() => {
    const updateCustomer = () => {
      setStorageKey(getStorageKey());
      setShowForm(false);
      setForm({ ...initialForm });
      setEditingId(null);
      setSuccessMessage("");
    };

    window.addEventListener("silverhub-auth-changed", updateCustomer);
    window.addEventListener("storage", updateCustomer);

    return () => {
      window.removeEventListener("silverhub-auth-changed", updateCustomer);
      window.removeEventListener("storage", updateCustomer);
    };
  }, []);

  // Load saved addresses
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAddresses([]);
    }
  }, [storageKey]);

  // Success toast: 2.5s visible + 0.5s slide out
  useEffect(() => {
    if (!successMessage) return;

    setIsToastClosing(false);

    const slideTimer = window.setTimeout(() => {
      setIsToastClosing(true);
    }, 2500);

    const removeTimer = window.setTimeout(() => {
      setSuccessMessage("");
      setIsToastClosing(false);
    }, 3000);

    return () => {
      window.clearTimeout(slideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [successMessage]);

  const updateAddresses = (updated: Address[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setAddresses(updated);
  };

  const updateField = <K extends keyof Address>(
    field: K,
    value: Address[K]
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openNewAddress = () => {
    setForm({ ...initialForm });
    setEditingId(null);
    setLocationError("");
    setShowForm(true);
  };

  const editAddress = (address: Address) => {
    setForm({ ...address });
    setEditingId(address.id);
    setLocationError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...initialForm });
    setLocationError("");
  };

  // Reverse geocoding
  const fetchAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ) => {
    setLocationLoading(true);
    setLocationError("");

    setForm((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Address lookup failed");
      }

      const result = await response.json();
      const address = result.address || {};

      const street = [
        address.road ||
          address.pedestrian ||
          address.residential ||
          "",
        address.suburb ||
          address.neighbourhood ||
          address.quarter ||
          "",
      ]
        .filter(Boolean)
        .join(", ");

      const city =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "";

      setForm((prev) => ({
        ...prev,
        latitude,
        longitude,
        doorNo: address.house_number || prev.doorNo,
        street: street || prev.street,
        pincode: address.postcode || prev.pincode,
        city: city || prev.city,
        state: address.state || prev.state,
      }));
    } catch {
      setLocationError(
        "Map location selected, but address could not be filled automatically. Please enter the details manually."
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Current location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location detection."
      );
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void fetchAddressFromCoordinates(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (error) => {
        setLocationLoading(false);

        if (error.code === 1) {
          setLocationError(
            "Location permission denied. Please allow location access in your browser."
          );
        } else {
          setLocationError(
            "Unable to detect your location. You can select it manually on the map."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Save or update address
  const saveAddress = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      alert("Enter a valid 6-digit pincode.");
      return;
    }

    if (
      form.alternatePhone &&
      !/^[6-9]\d{9}$/.test(form.alternatePhone)
    ) {
      alert("Enter a valid alternate mobile number.");
      return;
    }

    const newAddress: Address = {
      ...form,
      id: editingId || crypto.randomUUID(),
      isDefault: editingId
        ? form.isDefault
        : addresses.length === 0,
    };

    try {
      if (editingId) {
        updateAddresses(
          addresses.map((address) =>
            address.id === editingId ? newAddress : address
          )
        );

        setSuccessMessage("Address Successfully Updated!");
      } else {
        updateAddresses([...addresses, newAddress]);

        setSuccessMessage("Address Successfully Saved!");
      }

      closeForm();
    } catch {
      alert("Unable to save address. Please try again.");
    }
  };

  // Delete address
  const deleteAddress = (id: string) => {
    if (!window.confirm("Delete this address?")) return;

    const updated = addresses.filter(
      (address) => address.id !== id
    );

    if (
      updated.length > 0 &&
      !updated.some((address) => address.isDefault)
    ) {
      updated[0] = {
        ...updated[0],
        isDefault: true,
      };
    }

    updateAddresses(updated);
  };

  // Set default address
  const setDefaultAddress = (id: string) => {
    updateAddresses(
      addresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      }))
    );
  };

  const mapPosition: LatLngExpression =
    form.latitude !== null && form.longitude !== null
      ? [form.latitude, form.longitude]
      : DEFAULT_CENTER;

  // Same diamond loader as Edit Profile
  if (loading) {
    return (
      <div className="profile-loading-screen">
        <div className="jewellery-loader">
          <Gem size={48} strokeWidth={1.3} />
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

  return (
    <main className="addresses-page">
      {/* Success Notification */}
      {successMessage && (
        <div
          className={`address-success-notification ${
            isToastClosing ? "toast-slide-out" : ""
          }`}
          role="status"
        >
          <span className="address-success-icon">
            <Check size={22} />
          </span>

          <div className="address-success-content">
            <strong>{successMessage}</strong>
            <span>Your delivery address details are ready.</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="addresses-container">
        {/* Back to Home */}
        <Link to="/" className="addresses-back-home">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="addresses-header">
          <div>
            <span className="addresses-eyebrow">
              SILVERHUB · YOUR ACCOUNT
            </span>

            <h1>Manage Addresses</h1>

            <p>
              Add and manage your jewellery delivery addresses.
            </p>
          </div>

          <div className="addresses-header-icon">
            <MapPin size={27} />
          </div>
        </div>

        {!showForm ? (
          <>
            {/* Add Address */}
            <button
              type="button"
              className="addresses-add-card"
              onClick={openNewAddress}
            >
              <span className="addresses-add-icon">
                <Plus size={25} />
              </span>

              <span className="addresses-add-text">
                <strong>Add a New Address</strong>
                <small>
                  Add a delivery address for faster checkout
                </small>
              </span>

              <Plus size={22} />
            </button>

            {/* Saved Addresses */}
            {addresses.length === 0 ? (
              <div className="addresses-empty">
                <MapPin size={38} />
                <h3>No saved addresses yet</h3>
                <p>
                  Add your first delivery address to get started.
                </p>
              </div>
            ) : (
              <div className="addresses-saved-list">
                {addresses.map((address) => (
                  <article
                    className="addresses-saved-card"
                    key={address.id}
                  >
                    <div className="addresses-card-top">
                      <div className="addresses-type">
                        {address.addressType === "Home" ? (
                          <House size={17} />
                        ) : address.addressType === "Work" ? (
                          <BriefcaseBusiness size={17} />
                        ) : (
                          <MapPin size={17} />
                        )}

                        {address.addressType}
                      </div>

                      {address.isDefault && (
                        <span className="addresses-default-badge">
                          <Check size={13} />
                          Default
                        </span>
                      )}
                    </div>

                    <h3>{address.name}</h3>

                    <p>
                      {address.doorNo}, {address.street}
                      {address.landmark
                        ? `, Near ${address.landmark}`
                        : ""}
                      , {address.city}, {address.state} -{" "}
                      {address.pincode}
                    </p>

                    <p className="addresses-phone">
                      +91 {address.phone}
                    </p>

                    {address.alternatePhone && (
                      <p className="addresses-phone">
                        Alternate: +91 {address.alternatePhone}
                      </p>
                    )}

                    <div className="addresses-card-actions">
                      <button
                        type="button"
                        onClick={() => editAddress(address)}
                      >
                        <Pencil size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAddress(address.id)}
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>

                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() =>
                            setDefaultAddress(address.id)
                          }
                        >
                          <Check size={15} />
                          Set Default
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="addresses-form-card">
            {/* Form Header */}
            <div className="addresses-form-header">
              <div>
                <span className="addresses-eyebrow">
                  DELIVERY DETAILS
                </span>

                <h2>
                  {editingId
                    ? "Edit Address"
                    : "Add New Address"}
                </h2>
              </div>

              <button
                type="button"
                className="addresses-close"
                onClick={closeForm}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            {/* Map */}
            <div className="addresses-map-section">
              <div className="addresses-map-heading">
                <MapPin size={19} />
                <h3>Select Your Location</h3>
              </div>

              <div className="addresses-map-wrapper">
                <MapContainer
                  center={mapPosition}
                  zoom={5}
                  scrollWheelZoom={false}
                  className="addresses-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapController position={mapPosition} />

                  <LocationPicker
                    onSelect={fetchAddressFromCoordinates}
                  />

                  {form.latitude !== null &&
                    form.longitude !== null && (
                      <Marker
                        position={[
                          form.latitude,
                          form.longitude,
                        ]}
                        icon={markerIcon}
                      />
                    )}
                </MapContainer>
              </div>

              <button
                type="button"
                className="addresses-location-btn"
                onClick={useCurrentLocation}
                disabled={locationLoading}
              >
                <LocateFixed size={18} />

                {locationLoading
                  ? "Detecting Location..."
                  : "Use My Current Location"}
              </button>

              <p className="addresses-map-hint">
                <Navigation size={14} />
                Use current location or click anywhere on the map
                to select your delivery location.
              </p>

              {locationError && (
                <p className="addresses-location-error">
                  {locationError}
                </p>
              )}
            </div>

            {/* Address Form */}
            <form
              onSubmit={saveAddress}
              className="addresses-form"
            >
              <h3>Contact Details</h3>

              <div className="addresses-form-grid">
                <div className="addresses-field">
                  <label htmlFor="address-name">
                    Full Name *
                  </label>

                  <input
                    id="address-name"
                    type="text"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="addresses-field">
                  <label htmlFor="address-phone">
                    Phone Number *
                  </label>

                  <input
                    id="address-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    required
                  />
                </div>
              </div>

              <h3>Address Details</h3>

              <div className="addresses-form-grid">
                <div className="addresses-field">
                  <label htmlFor="address-door">
                    Door No. / Flat No. *
                  </label>

                  <input
                    id="address-door"
                    type="text"
                    placeholder="House / Flat number"
                    value={form.doorNo}
                    onChange={(e) =>
                      updateField("doorNo", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="addresses-field">
                  <label htmlFor="address-street">
                    Street / Area *
                  </label>

                  <input
                    id="address-street"
                    type="text"
                    placeholder="Street name, locality"
                    value={form.street}
                    onChange={(e) =>
                      updateField("street", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="addresses-field">
                  <label htmlFor="address-pincode">
                    Pincode *
                  </label>

                  <input
                    id="address-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit pincode"
                    value={form.pincode}
                    onChange={(e) =>
                      updateField(
                        "pincode",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    required
                  />
                </div>

                <div className="addresses-field">
                  <label htmlFor="address-landmark">
                    Landmark (Optional)
                  </label>

                  <input
                    id="address-landmark"
                    type="text"
                    placeholder="Nearby landmark"
                    value={form.landmark}
                    onChange={(e) =>
                      updateField("landmark", e.target.value)
                    }
                  />
                </div>

                <div className="addresses-field">
                  <label htmlFor="address-city">
                    City *
                  </label>

                  <input
                    id="address-city"
                    type="text"
                    placeholder="Enter city"
                    value={form.city}
                    onChange={(e) =>
                      updateField("city", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="addresses-field">
                  <label htmlFor="address-state">
                    State *
                  </label>

                  <input
                    id="address-state"
                    type="text"
                    placeholder="Enter state"
                    value={form.state}
                    onChange={(e) =>
                      updateField("state", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <h3>Additional Information</h3>

              <div className="addresses-field">
                <label htmlFor="address-alternate">
                  Alternate Phone Number (Optional)
                </label>

                <input
                  id="address-alternate"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Alternate 10-digit number"
                  value={form.alternatePhone}
                  onChange={(e) =>
                    updateField(
                      "alternatePhone",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                />
              </div>

              <div className="addresses-field">
                <label>Address Type *</label>

                <div className="addresses-type-options">
                  {(
                    ["Home", "Work", "Other"] as AddressType[]
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={
                        form.addressType === type
                          ? "addresses-type-option active"
                          : "addresses-type-option"
                      }
                      onClick={() =>
                        updateField("addressType", type)
                      }
                    >
                      {type === "Home" ? (
                        <House size={17} />
                      ) : type === "Work" ? (
                        <BriefcaseBusiness size={17} />
                      ) : (
                        <MapPin size={17} />
                      )}

                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="addresses-form-actions">
                <button
                  type="button"
                  className="addresses-cancel-btn"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="addresses-save-btn"
                >
                  <Check size={18} />
                  {editingId
                    ? "Update Address"
                    : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}