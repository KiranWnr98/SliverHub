import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { AlertCircle, Check, Download, FileText, Upload, X } from 'lucide-react';

import type { Product } from '../../../types';
import { categories } from '../../../data/categories';
import type {
  NewProductInput,
  ProductImportBatch,
  ProductUpdate,
} from '../../../context/ProductContextValue';
import {
  analyzeProductCsv,
  encodeCsv,
  type ProductCsvAnalysis,
  type ProductCsvRow,
} from './productCsvParser';

type ImportMode = 'add-only' | 'update-existing';

interface ImportResult {
  imported: number;
  updated: number;
  failed: number;
  skippedDuplicates: number;
  report: Array<{
    rowNumber: number;
    sku: string;
    productName: string;
    status: string;
    message: string;
  }>;
}

interface Props {
  products: Product[];
  importProducts: (batch: ProductImportBatch) => void;
}

const templateHeaders = [
  'SKU',
  'Product Name',
  'Category',
  'Selling Price',
  'Original Price',
  'Stock Quantity',
  'Description',
  'Image URL',
  'Visibility',
  'Show in New Arrivals',
];

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadCsv(filename: string, content: string): void {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function rowStatus(row: ProductCsvRow, mode: ImportMode): string {
  if (row.errors.length > 0) return `Invalid (${row.errors.length} issue${row.errors.length === 1 ? '' : 's'})`;
  if (row.existingProduct) {
    return mode === 'update-existing' ? 'Will update existing' : 'Existing SKU · will skip';
  }
  return 'New product';
}

export default function ProductCsvImport({ products, importProducts }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ProductCsvAnalysis | null>(null);
  const [mode, setMode] = useState<ImportMode>('add-only');
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [importError, setImportError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const importLock = useRef(false);

  const clearSelectedFile = () => {
    setFile(null);
    setAnalysis(null);
    setFileError('');
    setImportError('');
    setResult(null);
    if (fileInput.current) fileInput.current.value = '';
  };

  const close = () => {
    if (isReading || isImporting) return;
    setOpen(false);
    clearSelectedFile();
  };

  const selectFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setAnalysis(null);
    setResult(null);
    setImportError('');
    setFileError('');
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setFileError('Choose a .csv file. Other file types are not supported.');
      return;
    }

    setIsReading(true);
    try {
      const source = await selectedFile.text();
      const categoryNames = Array.from(
        new Set([
          ...categories.map((category) => category.name),
          ...products.map((product) => product.category),
        ]),
      );
      setAnalysis(analyzeProductCsv(source, products, categoryNames));
    } catch (error) {
      setFileError(
        error instanceof Error ? error.message : 'Unable to read this CSV file.',
      );
    } finally {
      setIsReading(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) void selectFile(selectedFile);
    event.target.value = '';
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length !== 1) {
      clearSelectedFile();
      setFileError('Drop one CSV file at a time.');
      return;
    }
    void selectFile(event.dataTransfer.files[0]);
  };

  const downloadTemplate = () => {
    downloadCsv('silverhub-product-import-template.csv', encodeCsv([templateHeaders]));
  };

  const downloadErrorReport = () => {
    if (!result) return;
    downloadCsv(
      'silverhub-product-import-errors.csv',
      encodeCsv([
        ['Row Number', 'SKU', 'Product Name', 'Status', 'Details'],
        ...result.report.map((row) => [
          row.rowNumber,
          row.sku,
          row.productName,
          row.status,
          row.message,
        ]),
      ]),
    );
  };

  const confirmImport = () => {
    if (!analysis || isImporting || importLock.current) return;
    importLock.current = true;
    const validRows = analysis.rows.filter((row) => row.errors.length === 0);
    const additions: NewProductInput[] = [];
    const updates: Array<{ id: number; updates: ProductUpdate }> = [];
    const report: ImportResult['report'] = [];
    const skippedExisting = validRows.filter(
      (row) => row.existingProduct && mode === 'add-only',
    );

    for (const row of analysis.rows) {
      if (row.errors.length > 0) {
        report.push({
          rowNumber: row.rowNumber,
          sku: row.sku,
          productName: row.name,
          status: row.duplicateInFile ? 'Skipped duplicate SKU' : 'Failed validation',
          message: row.errors.join(' '),
        });
        continue;
      }

      if (row.existingProduct && mode === 'add-only') {
        report.push({
          rowNumber: row.rowNumber,
          sku: row.sku,
          productName: row.name,
          status: 'Skipped duplicate SKU',
          message: 'A product with this SKU already exists. Choose update mode to modify it.',
        });
        continue;
      }

      if (row.existingProduct) {
        const rowUpdates: ProductUpdate = {
          sku: row.sku,
          name: row.name,
          category: row.category,
          price: row.price!,
          stockQuantity: row.stockQuantity!,
        };
        if (row.oldPrice !== undefined) rowUpdates.oldPrice = row.oldPrice;
        if (row.description !== undefined) rowUpdates.description = row.description;
        if (row.imageUrl !== undefined) {
          rowUpdates.image = row.imageUrl;
          rowUpdates.primaryMediaId = undefined;
        }
        if (row.isHidden !== undefined) rowUpdates.isHidden = row.isHidden;
        if (row.isNew !== undefined) rowUpdates.isNew = row.isNew;
        updates.push({ id: row.existingProduct.id, updates: rowUpdates });
        continue;
      }

      const categoryImage = categories.find(
        (category) => category.name.toLowerCase() === row.category.toLowerCase(),
      )?.image;
      additions.push({
        sku: row.sku,
        name: row.name,
        category: row.category,
        price: row.price!,
        oldPrice: row.oldPrice ?? null,
        stockQuantity: row.stockQuantity!,
        description: row.description ?? '',
        image: row.imageUrl ?? categoryImage ?? categories[0].image,
        rating: '0.0',
        isFeatured: false,
        isNew: row.isNew ?? false,
        isHidden: row.isHidden ?? false,
      });
    }

    setIsImporting(true);
    setImportError('');
    try {
      if (additions.length > 0 || updates.length > 0) {
        importProducts({ additions, updates });
      }
      const duplicateRows = analysis.rows.filter((row) => row.duplicateInFile).length;
      setResult({
        imported: additions.length,
        updated: updates.length,
        failed: analysis.rows.filter(
          (row) => row.errors.length > 0 && !row.duplicateInFile,
        ).length,
        skippedDuplicates: duplicateRows + skippedExisting.length,
        report,
      });
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'The product import could not be saved.',
      );
    } finally {
      importLock.current = false;
      setIsImporting(false);
    }
  };

  const validRowCount = analysis?.rows.filter((row) => row.errors.length === 0).length ?? 0;
  const invalidRowCount = (analysis?.rows.length ?? 0) - validRowCount;
  const duplicateSkuCount = new Set(
    analysis?.rows
      .filter((row) => row.duplicateInFile)
      .map((row) => row.sku.toLowerCase()),
  ).size;
  const newProductCount = analysis?.rows.filter(
    (row) => row.errors.length === 0 && !row.existingProduct,
  ).length ?? 0;
  const updateProductCount = analysis?.rows.filter(
    (row) => row.errors.length === 0 && row.existingProduct,
  ).length ?? 0;
  const canImport = Boolean(
    analysis &&
      analysis.rows.length > 0 &&
      !result &&
      !isReading &&
      !isImporting,
  );

  return (
    <>
      <button
        type="button"
        className="products-secondary-button"
        onClick={() => setOpen(true)}
      >
        <Upload size={16} /> Import CSV
      </button>

      {open && (
        <div className="products-modal-backdrop" onMouseDown={close}>
          <section
            className="products-modal products-csv-import-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-import-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PRODUCT CATALOG</span>
                <h2 id="csv-import-title">Import Products from CSV</h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close CSV import"
                onClick={close}
                disabled={isReading || isImporting}
              >
                <X size={20} />
              </button>
            </header>

            <p className="products-csv-description">
              Import products into the shared catalog used by Admin and Shop.
              Imported data is stored in this browser for this demo.
            </p>

            <div className="products-csv-actions">
              <button
                type="button"
                className="products-secondary-button"
                onClick={downloadTemplate}
              >
                <Download size={15} /> Download CSV Template
              </button>
              <label className="products-csv-file-label">
                <Upload size={15} /> {file ? 'Replace CSV' : 'Choose CSV'}
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileChange}
                  disabled={isReading || isImporting}
                />
              </label>
            </div>

            <div
              className={`products-csv-dropzone${isDragging ? ' is-active' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setIsDragging(false);
                }
              }}
              onDrop={onDrop}
            >
              <FileText size={23} />
              <strong>Drop a CSV file here</strong>
              <span>CSV files only</span>
            </div>

            {file && (
              <div className="products-csv-selected-file">
                <FileText size={17} />
                <span title={file.name}>{file.name}</span>
                <small>{formatFileSize(file.size)}</small>
                <button
                  type="button"
                  className="products-icon-button"
                  onClick={clearSelectedFile}
                  disabled={isReading || isImporting}
                  aria-label="Clear selected CSV"
                  title="Clear selected file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {fileError && (
              <p className="products-form-error" role="alert">
                <AlertCircle size={15} /> {fileError}
              </p>
            )}
            {importError && <p className="products-form-error" role="alert">{importError}</p>}
            {isReading && <p className="products-csv-message" role="status">Reading and validating CSV…</p>}
            {analysis?.fileErrors.map((error) => (
              <p className="products-form-error" role="alert" key={error}>{error}</p>
            ))}

            {analysis && (
              <>
                <div className="products-csv-summary" aria-label="CSV validation summary">
                  <div><span>Total rows</span><strong>{analysis.rows.length}</strong></div>
                  <div><span>Valid rows</span><strong>{validRowCount}</strong></div>
                  <div><span>Invalid rows</span><strong>{invalidRowCount}</strong></div>
                  <div><span>Duplicate SKUs</span><strong>{duplicateSkuCount}</strong></div>
                  <div><span>New products</span><strong>{newProductCount}</strong></div>
                  <div><span>Existing products to update</span><strong>{updateProductCount}</strong></div>
                </div>

                <fieldset className="products-csv-mode">
                  <legend>How should existing SKUs be handled?</legend>
                  <label>
                    <input
                      type="radio"
                      name="csv-import-mode"
                      value="add-only"
                      checked={mode === 'add-only'}
                      onChange={() => setMode('add-only')}
                    />
                    Add only new products
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="csv-import-mode"
                      value="update-existing"
                      checked={mode === 'update-existing'}
                      onChange={() => setMode('update-existing')}
                    />
                    Update existing products when SKU matches
                  </label>
                  <p>
                    {mode === 'add-only'
                      ? 'Existing SKU rows will be skipped; no existing product will be changed.'
                      : 'Matching existing products will be updated only after you confirm the import.'}
                  </p>
                </fieldset>

                <div className="products-csv-preview" role="region" aria-label="CSV import preview">
                  <table>
                    <thead>
                      <tr>
                        <th>Row</th>
                        <th>SKU</th>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Selling Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.rows.map((row) => (
                        <tr key={row.rowNumber} className={row.errors.length ? 'is-invalid' : ''}>
                          <td>{row.rowNumber}</td>
                          <td>{row.sku || '—'}</td>
                          <td>{row.name || '—'}</td>
                          <td>{row.category || '—'}</td>
                          <td>{row.price == null ? '—' : `₹${row.price.toLocaleString('en-IN')}`}</td>
                          <td>{row.stockQuantity ?? '—'}</td>
                          <td>
                            <strong>{rowStatus(row, mode)}</strong>
                            {row.existingProduct && row.errors.length === 0 && (
                              <small>{row.existingProduct.name}</small>
                            )}
                            {row.errors.map((error) => (
                              <small className="products-csv-row-error" key={error}>
                                Row {row.rowNumber}: {error}
                              </small>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result && (
              <section className="products-csv-result" aria-label="Import results" role="status">
                <h3>
                  <Check size={17} />
                  {result.imported + result.updated > 0
                    ? 'Import complete'
                    : 'Import review complete · no changes made'}
                </h3>
                <div>
                  <span>Successfully imported <strong>{result.imported}</strong></span>
                  <span>Successfully updated <strong>{result.updated}</strong></span>
                  <span>Failed rows <strong>{result.failed}</strong></span>
                  <span>Skipped duplicates <strong>{result.skippedDuplicates}</strong></span>
                </div>
                {result.report.length > 0 && (
                  <button
                    type="button"
                    className="products-secondary-button"
                    onClick={downloadErrorReport}
                  >
                    <Download size={15} /> Download Error Report CSV
                  </button>
                )}
              </section>
            )}

            <footer className="products-modal-actions">
              <button type="button" className="products-secondary-button" onClick={close} disabled={isImporting || isReading}>
                {result ? 'Done' : 'Cancel'}
              </button>
              <button
                type="button"
                className="products-primary-button"
                onClick={confirmImport}
                disabled={!canImport}
              >
                <Upload size={15} />
                {isImporting
                  ? 'Importing…'
                  : validRowCount > 0
                    ? 'Confirm and Import'
                    : 'Show Validation Results'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
