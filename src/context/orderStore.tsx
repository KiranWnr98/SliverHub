export type PaymentMethod = "UPI" | "Card" | "COD";

export type OrderItem = {
  id: string | number;
  name: string;
  image: string;
  price: number;
  quantity: number;
};

export type DeliveryAddress = {
  id: string;
  name: string;
  phone: string;
  doorNo: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type Order = {
  id: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "Demo Paid" | "Pending";
  status: "Confirmed" | "Packed" | "Shipped" | "Delivered";
  address: DeliveryAddress;
};

export function getCustomerEmail(): string | null {
  try {
    const customer = JSON.parse(
      sessionStorage.getItem("silverhub-demo-customer") || "null"
    );

    return typeof customer?.email === "string"
      ? customer.email.trim().toLowerCase() || null
      : null;
  } catch {
    return null;
  }
}

export function getOrders(): Order[] {
  const email = getCustomerEmail();

  if (!email) return [];

  try {
    const saved = JSON.parse(
      localStorage.getItem(`silverhub-orders-${email}`) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  const email = getCustomerEmail();

  if (!email) {
    throw new Error("Please login to place your order.");
  }

  const orders = getOrders();

  localStorage.setItem(
    `silverhub-orders-${email}`,
    JSON.stringify([order, ...orders])
  );

  window.dispatchEvent(
    new Event("silverhub-orders-changed")
  );
}

export function getSavedAddresses(): DeliveryAddress[] {
  const email = getCustomerEmail();

  if (!email) return [];

  try {
    const addresses = JSON.parse(
      localStorage.getItem(`silverhub-addresses-${email}`) || "[]"
    );

    return Array.isArray(addresses) ? addresses : [];
  } catch {
    return [];
  }
}