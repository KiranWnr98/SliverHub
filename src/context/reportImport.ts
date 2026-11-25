import Papa from 'papaparse';

import type { ReportRow } from './reportUtils';

const STORAGE_KEY = 'silverhub-imported-reports';

function getCategory(name: string): string {

  const product = name.toLowerCase();

  if (/earring|jhumka|stud/.test(product))
    return 'Earrings';

  if (/ring/.test(product))
    return 'Rings';

  if (/bracelet|bangle|kada/.test(product))
    return 'Bracelets';

  if (/chain|necklace|pendant/.test(product))
    return 'Necklaces';

  if (/anklet/.test(product))
    return 'Anklets';

  return 'Others';
}

function normalizePayment(method: string) {

  if (/upi/i.test(method)) return 'UPI';

  if (/card/i.test(method)) return 'Card';

  if (/cod|cash on delivery/i.test(method))
    return 'COD';

  return method || 'Unknown';
}

type ImportedItem = {
  orderId: string;
  customer: string;
  email: string;
  date: string;
  product: string;
  quantity: number;
  price: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
};

function createReportRow(
  item: ImportedItem
): ReportRow {

  const date = new Date(item.date);

  if (
    !item.orderId ||
    !item.product ||
    !item.email ||
    Number.isNaN(date.getTime()) ||
    !Number.isFinite(item.price) ||
    !Number.isInteger(item.quantity) ||
    item.price < 0 ||
    item.quantity <= 0
  ) {
    throw new Error(
      'Invalid order data. Please check your file.'
    );
  }

  const year = String(date.getFullYear());

  const month = `${year}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;

  const email = item.email.trim().toLowerCase();

  return {

    orderId: `${email}:${item.orderId}`,

    customerId: email,

    customer: item.customer || email,

    date: item.date,

    year,

    month,

    product: item.product,

    productId: item.product.trim().toLowerCase(),

    category: getCategory(item.product),

    quantity: item.quantity,

    price: item.price,

    revenue: item.price * item.quantity,

    paymentMethod: normalizePayment(
      item.paymentMethod
    ),

    paymentStatus: item.paymentStatus,

    status: item.status,

  };
}

/* =========================================
   IMPORT CSV
========================================= */

function importCSV(text: string): ReportRow[] {

  const result = Papa.parse<Record<string, string>>(
    text,
    {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) =>
        header.replace(/^\uFEFF/, '').trim(),
    }
  );

  if (result.errors.length) {
    throw new Error('Invalid CSV file format.');
  }

  return result.data.map((row) =>

    createReportRow({

      orderId: row['Order ID'] || '',

      customer: row['Customer'] || '',

      email: row['Email'] || '',

      date: row['Date'] || '',

      product: row['Product'] || '',

      quantity: Number(row['Quantity']),

      price: Number(row['Unit Price']),

      paymentMethod: row['Payment Method'] || '',

      paymentStatus: row['Payment Status'] || '',

      status: row['Order Status'] || '',

    })

  );
}

/* =========================================
   IMPORT JSON
========================================= */

type JsonOrder = {
  id: string;
  customer: string;
  email: string;
  date: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
};

function importJSON(text: string): ReportRow[] {

  const data = JSON.parse(text) as JsonOrder[];

  if (!Array.isArray(data)) {
    throw new Error(
      'JSON file must contain an array of orders.'
    );
  }

  return data.flatMap((order) => {

    if (!Array.isArray(order.items)) {
      throw new Error('Invalid order items.');
    }

    return order.items.map((item) =>

      createReportRow({

        orderId: order.id,

        customer: order.customer,

        email: order.email,

        date: order.date,

        product: item.name,

        quantity: Number(item.quantity),

        price: Number(item.price),

        paymentMethod: order.paymentMethod || '',

        paymentStatus: order.paymentStatus || '',

        status: order.status || '',

      })

    );

  });
}

/* =========================================
   MAIN IMPORT FUNCTION
========================================= */

export async function importReportFile(
  file: File
): Promise<ReportRow[]> {

  if (file.size > 5 * 1024 * 1024) {
    throw new Error(
      'File size must be less than 5 MB.'
    );
  }

  const text = await file.text();

  const extension = file.name
    .split('.')
    .pop()
    ?.toLowerCase();

  let rows: ReportRow[] = [];

  if (extension === 'csv') {

    rows = importCSV(text);

  } else if (extension === 'json') {

    rows = importJSON(text);

  } else {

    throw new Error(
      'Please select a CSV or JSON file.'
    );

  }

  if (!rows.length) {

    throw new Error(
      'No valid records found in this file.'
    );

  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(rows)
  );

  return rows;
}

/* =========================================
   GET IMPORTED DATA
========================================= */

export function getImportedRows(): ReportRow[] {

  try {

    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );

    return Array.isArray(saved) ? saved : [];

  } catch {

    return [];

  }
}

/* =========================================
   CLEAR IMPORTED DATA
========================================= */

export function clearImportedRows() {

  localStorage.removeItem(STORAGE_KEY);

}