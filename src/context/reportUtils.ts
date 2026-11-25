import type { Order } from './orderStore';

export type ReportSource = 'customer' | 'admin';

export type ReportRow = {
  orderId: string;
  customerId: string;
  customer: string;
  date: string;
  year: string;
  month: string;
  product: string;
  productId: string;
  category: string;
  quantity: number;
  price: number;
  revenue: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
};

type AdminOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: Order['items'];
};

type CatalogueProduct = {
  id: number;
  name: string;
  category: string;
};

/* =========================================
   READ LOCAL STORAGE
========================================= */

function readStorage<T>(
  key: string,
  fallback: T
): T {
  try {
    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value) as T
      : fallback;
  } catch {
    return fallback;
  }
}

/* =========================================
   PRODUCT CATEGORY
========================================= */

function getCategory(
  name: string,
  products: CatalogueProduct[]
): string {

  const normalized = name.trim().toLowerCase();

  const matched = products.find(
    (product) =>
      product.name.trim().toLowerCase() === normalized
  );

  if (matched) return matched.category;

  if (/earring|jhumka|stud/.test(normalized))
    return 'Earrings';

  if (/ring/.test(normalized))
    return 'Rings';

  if (/bangle|kada|bracelet/.test(normalized))
    return 'Bangles & Bracelets';

  if (/chain|necklace|pendant/.test(normalized))
    return 'Necklaces';

  if (/anklet/.test(normalized))
    return 'Anklets';

  return 'Others';
}

/* =========================================
   NORMALIZE PAYMENT METHODS
========================================= */

function normalizePayment(method: string): string {

  if (/upi/i.test(method)) return 'UPI';

  if (/card/i.test(method)) return 'Card';

  if (/cod|cash on delivery/i.test(method))
    return 'COD';

  return method || 'Unknown';
}

/* =========================================
   GET REPORT DATA
========================================= */

export function getReportRows(
  source: ReportSource
): ReportRow[] {

  const rows: ReportRow[] = [];

  const catalogue = readStorage<{
    products: CatalogueProduct[];
  }>('silverhub-products', {
    products: [],
  });

  const products = Array.isArray(catalogue?.products)
    ? catalogue.products
    : [];

  const seenOrders = new Set<string>();

  function addOrder(
    orderId: string,
    customerId: string,
    customer: string,
    date: string,
    items: Order['items'],
    paymentMethod: string,
    paymentStatus: string,
    status: string
  ) {

    if (
      !orderId ||
      !Array.isArray(items) ||
      Number.isNaN(Date.parse(date))
    ) return;

    const uniqueOrderId =
      `${customerId}:${orderId}`;

    if (seenOrders.has(uniqueOrderId)) return;

    seenOrders.add(uniqueOrderId);

    const orderDate = new Date(date);

    const year = String(
      orderDate.getFullYear()
    );

    const month =
      `${year}-${String(
        orderDate.getMonth() + 1
      ).padStart(2, '0')}`;

    items.forEach((item) => {

      if (
        !item ||
        typeof item.name !== 'string' ||
        !Number.isFinite(item.price) ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        item.price < 0
      ) return;

      rows.push({
        orderId: uniqueOrderId,
        customerId,
        customer,
        date,
        year,
        month,

        product: item.name,

        productId:
          source === 'admin'
            ? item.name.trim().toLowerCase()
            : String(item.id),

        category: getCategory(
          item.name,
          products
        ),

        quantity: item.quantity,

        price: item.price,

        revenue:
          item.price * item.quantity,

        paymentMethod:
          normalizePayment(paymentMethod),

        paymentStatus,
        status,
      });

    });
  }

  /* CUSTOMER CHECKOUT ORDERS */

  if (source === 'customer') {

    const prefix = 'silverhub-orders-';

    for (
      let index = 0;
      index < localStorage.length;
      index++
    ) {

      const key = localStorage.key(index);

      if (!key?.startsWith(prefix)) continue;

      const email = key
        .slice(prefix.length)
        .trim()
        .toLowerCase();

      const orders = readStorage<Order[]>(
        key,
        []
      );

      if (!Array.isArray(orders)) continue;

      orders.forEach((order) => {

        addOrder(
          order.id,
          email,
          order.address?.name || email,
          order.createdAt,
          order.items,
          order.paymentMethod,
          order.paymentStatus,
          order.status
        );

      });
    }

  } else {

    /* ADMIN DEMO ORDERS */

    const orders = readStorage<AdminOrder[]>(
      'silverhub-admin-orders',
      []
    );

    if (Array.isArray(orders)) {

      orders.forEach((order) => {

        addOrder(
          order.id,
          order.email.trim().toLowerCase(),
          order.customer,
          order.date,
          order.items,
          order.paymentMethod,
          order.paymentStatus,
          order.status
        );

      });

    }

  }

  return rows;
}

/* =========================================
   VALID SALES
========================================= */

export function isValidSale(row: ReportRow) {

  return ![
    'cancelled',
    'returned',
  ].includes(row.status.toLowerCase())

  && ![
    'failed',
    'refunded',
  ].includes(row.paymentStatus.toLowerCase());
}

/* =========================================
   CURRENCY FORMAT
========================================= */

export function formatCurrency(amount: number) {

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

}

/* =========================================
   MONTH LABEL
========================================= */

export function formatMonth(month: string) {

  const [year, number] =
    month.split('-').map(Number);

  return new Date(
    year,
    number - 1,
    1
  ).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });

}

/* =========================================
   GROUP REPORT DATA
========================================= */

export function groupReport(
  rows: ReportRow[],
  getKey: (row: ReportRow) => string,
  getLabel: (row: ReportRow) => string
) {

  const groups = new Map<
    string,
    {
      key: string;
      name: string;
      revenue: number;
      quantity: number;
      orderIds: Set<string>;
    }
  >();

  rows.forEach((row) => {

    const key = getKey(row);

    if (!groups.has(key)) {

      groups.set(key, {
        key,
        name: getLabel(row),
        revenue: 0,
        quantity: 0,
        orderIds: new Set(),
      });

    }

    const group = groups.get(key)!;

    group.revenue += row.revenue;

    group.quantity += row.quantity;

    group.orderIds.add(row.orderId);

  });

  return Array.from(groups.values()).map(
    (group) => ({
      key: group.key,
      name: group.name,
      revenue: group.revenue,
      quantity: group.quantity,
      orders: group.orderIds.size,
    })
  );

}