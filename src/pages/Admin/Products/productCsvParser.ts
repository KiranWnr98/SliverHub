import type { Product } from '../../../types';

type ProductCsvColumn =
  | 'sku'
  | 'name'
  | 'category'
  | 'price'
  | 'oldPrice'
  | 'stockQuantity'
  | 'description'
  | 'imageUrl'
  | 'visibility'
  | 'isNew';

export interface ProductCsvRow {
  rowNumber: number;
  sku: string;
  name: string;
  category: string;
  price: number | null;
  oldPrice?: number;
  stockQuantity: number | null;
  description?: string;
  imageUrl?: string;
  isHidden?: boolean;
  isNew?: boolean;
  errors: string[];
  duplicateInFile: boolean;
  existingProduct?: Product;
}

export interface ProductCsvAnalysis {
  rows: ProductCsvRow[];
  fileErrors: string[];
}

interface CsvRecord {
  rowNumber: number;
  values: string[];
}

const aliases: Record<ProductCsvColumn, string[]> = {
  sku: ['sku', 'product sku', 'product code'],
  name: ['product name', 'product_name', 'name', 'title'],
  category: ['category', 'product category'],
  price: ['selling price', 'selling_price', 'price', 'sale price'],
  oldPrice: ['original price', 'original_price', 'old price', 'compare at price'],
  stockQuantity: ['stock quantity', 'stock_quantity', 'stock', 'quantity', 'inventory'],
  description: ['description', 'product description'],
  imageUrl: ['image url', 'image_url', 'image', 'product image url'],
  visibility: ['visibility', 'status'],
  isNew: ['show in new arrivals', 'show_in_new_arrivals', 'new arrival', 'is new', 'is_new'],
};

const requiredColumns: Array<{ key: ProductCsvColumn; label: string }> = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product Name' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Selling Price' },
  { key: 'stockQuantity', label: 'Stock Quantity' },
];

function parseRecords(source: string): CsvRecord[] {
  const records: CsvRecord[] = [];
  let values: string[] = [];
  let field = '';
  let inQuotes = false;
  let quoteClosed = false;
  let line = 1;
  let recordLine = 1;
  const text = source.replace(/^\uFEFF/, '');

  const finishField = () => {
    values.push(field);
    field = '';
    quoteClosed = false;
  };
  const finishRecord = () => {
    finishField();
    if (values.some((value) => value.trim() !== '')) {
      records.push({ rowNumber: recordLine, values });
    }
    values = [];
    recordLine = line + 1;
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          quoteClosed = true;
        }
      } else {
        field += character;
        if (character === '\n') line += 1;
      }
      continue;
    }

    if (quoteClosed && character !== ',' && character !== '\r' && character !== '\n' && !/\s/.test(character)) {
      throw new Error(`Unexpected character after a quoted value on row ${line}.`);
    }
    if (character === '"') {
      if (field.length > 0) {
        throw new Error(`Unexpected quote in an unquoted value on row ${line}.`);
      }
      inQuotes = true;
    } else if (character === ',') {
      finishField();
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      finishRecord();
      line += 1;
      recordLine = line;
    } else if (!quoteClosed || !/\s/.test(character)) {
      field += character;
    }
  }

  if (inQuotes) throw new Error(`Unclosed quoted value starting before row ${line}.`);
  if (values.length > 0 || field.length > 0 || quoteClosed) finishRecord();
  return records;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');
}

function positiveNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['true', 'yes', 'y', '1'].includes(normalized)) return true;
  if (['false', 'no', 'n', '0'].includes(normalized)) return false;
  return undefined;
}

function validImageUrl(value: string): string | undefined {
  if (!value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function analyzeProductCsv(
  source: string,
  products: Product[],
  categoryNames: string[],
): ProductCsvAnalysis {
  const records = parseRecords(source);
  if (records.length === 0) {
    return { rows: [], fileErrors: ['The CSV file is empty.'] };
  }

  const headerRecord = records[0];
  const columnAliases = new Map<string, ProductCsvColumn>();
  for (const [column, names] of Object.entries(aliases) as Array<[ProductCsvColumn, string[]]>) {
    names.forEach((name) => columnAliases.set(normalizeHeader(name), column));
  }

  const columns = new Map<ProductCsvColumn, number>();
  const duplicateHeaders: string[] = [];
  headerRecord.values.forEach((header, index) => {
    const column = columnAliases.get(normalizeHeader(header));
    if (!column) return;
    if (columns.has(column)) {
      duplicateHeaders.push(header.trim() || column);
      return;
    }
    columns.set(column, index);
  });

  const fileErrors: string[] = [];
  const missingColumns = requiredColumns.filter(({ key }) => !columns.has(key));
  if (missingColumns.length > 0) {
    fileErrors.push(
      `Missing required column${missingColumns.length === 1 ? '' : 's'}: ${missingColumns.map(({ label }) => label).join(', ')}.`,
    );
  }
  if (duplicateHeaders.length > 0) {
    fileErrors.push(`Duplicate CSV headers were found: ${duplicateHeaders.join(', ')}.`);
  }

  const categoryLookup = new Map(
    categoryNames.map((name) => [name.trim().toLowerCase(), name.trim()]),
  );
  const rows = records.slice(1).map((record): ProductCsvRow => {
    const valueFor = (column: ProductCsvColumn) =>
      (columns.has(column) ? record.values[columns.get(column)!] ?? '' : '').trim();
    const sku = valueFor('sku');
    const name = valueFor('name');
    const rawCategory = valueFor('category');
    const category = categoryLookup.get(rawCategory.toLowerCase()) ?? rawCategory;
    const rawPrice = valueFor('price');
    const rawOldPrice = valueFor('oldPrice');
    const rawStock = valueFor('stockQuantity');
    const rawDescription = columns.has('description')
      ? record.values[columns.get('description')!] ?? ''
      : '';
    const rawImageUrl = valueFor('imageUrl');
    const rawVisibility = valueFor('visibility').toLowerCase();
    const rawIsNew = valueFor('isNew');
    const errors: string[] = [];

    if (missingColumns.length > 0) {
      errors.push(...missingColumns.map(({ label }) => `Missing required column: ${label}.`));
    }
    if (duplicateHeaders.length > 0) errors.push('CSV headers contain duplicate fields.');
    if (!sku) errors.push('SKU is required.');
    if (!name) errors.push('Product Name is required.');
    if (!rawCategory) errors.push('Category is required.');
    else if (!categoryLookup.has(rawCategory.toLowerCase())) {
      errors.push(`Category "${rawCategory}" does not exist.`);
    }

    const price = positiveNumber(rawPrice);
    if (!rawPrice) errors.push('Selling Price is required.');
    else if (price === undefined) errors.push('Selling Price must be a positive number.');

    const oldPrice = rawOldPrice ? positiveNumber(rawOldPrice) : undefined;
    if (rawOldPrice && oldPrice === undefined) {
      errors.push('Original Price must be a positive number when provided.');
    }

    const stockQuantity = rawStock ? Number(rawStock) : Number.NaN;
    if (!rawStock) errors.push('Stock Quantity is required.');
    else if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
      errors.push('Stock Quantity must be a non-negative integer.');
    }

    const imageUrl = rawImageUrl ? validImageUrl(rawImageUrl) : undefined;
    if (rawImageUrl && imageUrl === undefined) {
      errors.push('Image URL must be a valid HTTP or HTTPS URL.');
    }

    let isHidden: boolean | undefined;
    if (rawVisibility) {
      if (['visible', 'active', 'show', 'public'].includes(rawVisibility)) isHidden = false;
      else if (['hidden', 'hide', 'inactive', 'private'].includes(rawVisibility)) isHidden = true;
      else errors.push('Visibility must be Visible or Hidden.');
    }

    const isNew = parseBoolean(rawIsNew);
    if (rawIsNew && isNew === undefined) {
      errors.push('Show in New Arrivals must be Yes or No.');
    }

    const existingProduct = sku
      ? products.find((product) => product.sku?.trim().toLowerCase() === sku.toLowerCase())
      : undefined;
    if (existingProduct?.isDeleted) {
      errors.push('This SKU belongs to a deleted product. Restore it before importing.');
    }

    return {
      rowNumber: record.rowNumber,
      sku,
      name,
      category,
      price: price ?? null,
      ...(oldPrice === undefined ? {} : { oldPrice }),
      stockQuantity: Number.isSafeInteger(stockQuantity) ? stockQuantity : null,
      ...(rawDescription.trim() ? { description: rawDescription.trim() } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(isHidden === undefined ? {} : { isHidden }),
      ...(isNew === undefined ? {} : { isNew }),
      errors,
      duplicateInFile: false,
      ...(existingProduct ? { existingProduct } : {}),
    };
  });

  const skuRows = new Map<string, ProductCsvRow[]>();
  for (const row of rows) {
    if (!row.sku) continue;
    const key = row.sku.toLowerCase();
    skuRows.set(key, [...(skuRows.get(key) ?? []), row]);
  }
  for (const duplicateRows of skuRows.values()) {
    if (duplicateRows.length < 2) continue;
    for (const row of duplicateRows) {
      row.duplicateInFile = true;
      row.errors.push('SKU is duplicated within this CSV file.');
    }
  }

  if (rows.length === 0) fileErrors.push('The CSV file contains no product rows.');
  return { rows, fileErrors };
}

export function encodeCsv(rows: Array<Array<string | number>>): string {
  return `\uFEFF${rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\r\n')}`;
}
