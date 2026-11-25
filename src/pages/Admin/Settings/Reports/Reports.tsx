import {
  useEffect,
  useMemo,
  useState,
  useRef,
  type ChangeEvent,
  type ReactNode,
} from 'react';

import { createPortal } from 'react-dom';

import {
  IndianRupee,
  ShoppingBag,
  UsersRound,
  Package,
  Trophy,
  ChartColumn,
  CalendarDays,
  CreditCard,
  Filter,
  RotateCcw,
  Download,
  RefreshCw,
  X,
  UserRound,
  Layers3,
  Receipt,
  ChartNoAxesCombined,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { motion, AnimatePresence } from 'framer-motion';

import {
  getReportRows,
  groupReport,
  formatCurrency,
  formatMonth,
  isValidSale,
  type ReportRow,
  type ReportSource,
} from '../../../../context/reportUtils';

import {
  importReportFile,
  getImportedRows,
  clearImportedRows,
} from '../../../../context/reportImport';

import './Reports.css';

/* =========================================
   DATA SOURCE
========================================= */

type DashboardSource = ReportSource | 'imported';

function loadReportRows(
  source: DashboardSource
): ReportRow[] {
  return source === 'imported'
    ? getImportedRows()
    : getReportRows(source);
}

/* =========================================
   REPORT FILTERS
========================================= */

type Filters = {
  year: string;
  month: string;
  product: string;
  customer: string;
  category: string;
  payment: string;
  status: string;
};

const defaultFilters: Filters = {
  year: '',
  month: '',
  product: '',
  customer: '',
  category: '',
  payment: '',
  status: '',
};

const COLORS = [
  '#0b1b2d',
  '#c6a16b',
  '#68879a',
  '#9e8bba',
  '#74a69a',
  '#d6bd95',
];

/* =========================================
   REPORT CARD
========================================= */

function ReportCard({
  title,
  subtitle,
  icon,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rp-card ${className}`}>
      <div className="rp-card-heading">
        <span className="rp-heading-icon">
          {icon}
        </span>

        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {children}
    </section>
  );
}

/* =========================================
   EMPTY CHART
========================================= */

function EmptyChart() {
  return (
    <div className="rp-empty">
      <ChartColumn size={34} />

      <h3>No matching data</h3>

      <p>
        Change filters, import data or place a customer order.
      </p>
    </div>
  );
}

/* =========================================
   APPLY FILTERS
========================================= */

function applyFilters(
  rows: ReportRow[],
  filters: Filters,
  ignore?: keyof Filters
) {
  return rows.filter((row) => {
    return (
      (ignore === 'year' ||
        !filters.year ||
        row.year === filters.year) &&

      (ignore === 'month' ||
        !filters.month ||
        row.month === filters.month) &&

      (ignore === 'product' ||
        !filters.product ||
        row.productId === filters.product) &&

      (ignore === 'customer' ||
        !filters.customer ||
        row.customerId === filters.customer) &&

      (ignore === 'category' ||
        !filters.category ||
        row.category === filters.category) &&

      (ignore === 'payment' ||
        !filters.payment ||
        row.paymentMethod === filters.payment) &&

      (ignore === 'status' ||
        !filters.status ||
        row.status === filters.status)
    );
  });
}

/* =========================================
   MAIN REPORTS PAGE
========================================= */

export default function Reports() {

  const [source, setSource] =
    useState<DashboardSource>('customer');

  const [rows, setRows] =
    useState<ReportRow[]>(() =>
      loadReportRows('customer')
    );

  const [filters, setFilters] =
    useState<Filters>({ ...defaultFilters });

  const [visualizationOpen, setVisualizationOpen] =
    useState(false);

  const [showTransactions, setShowTransactions] =
    useState(false);

  /* CLEAR DATA POPUP */

  const [showClearPopup, setShowClearPopup] =
    useState(false);

  /* =========================================
     IMPORT DATA STATES
  ========================================= */

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const clearButtonRef =
    useRef<HTMLButtonElement>(null);

  const clearPopupRef =
    useRef<HTMLDivElement>(null);

  const [importing, setImporting] =
    useState(false);

  const [importedFileName, setImportedFileName] =
    useState(() => {
      try {
        return localStorage.getItem(
          'silverhub-imported-report-filename'
        ) || '';
      } catch {
        return '';
      }
    });

  const [importNotification, setImportNotification] =
    useState<{
      message: string;
      type: 'success' | 'error';
    } | null>(null);

  /* =========================================
     NOTIFICATION TIMER
  ========================================= */

  useEffect(() => {

    if (!importNotification) return;

    const timer = window.setTimeout(() => {
      setImportNotification(null);
    }, 3500);

    return () => window.clearTimeout(timer);

  }, [importNotification]);

  /* =========================================
     AUTOMATIC DATA REFRESH
  ========================================= */

  useEffect(() => {

    const refresh = () => {

      setRows(loadReportRows(source));

      if (source === 'imported') {
        try {
          setImportedFileName(
            localStorage.getItem(
              'silverhub-imported-report-filename'
            ) || ''
          );
        } catch {
          setImportedFileName('');
        }
      }
    };

    refresh();

    window.addEventListener(
      'silverhub-orders-changed',
      refresh
    );

    window.addEventListener(
      'storage',
      refresh
    );

    window.addEventListener(
      'focus',
      refresh
    );

    return () => {

      window.removeEventListener(
        'silverhub-orders-changed',
        refresh
      );

      window.removeEventListener(
        'storage',
        refresh
      );

      window.removeEventListener(
        'focus',
        refresh
      );

    };

  }, [source]);

  /* =========================================
     BODY SCROLL LOCK
  ========================================= */

  useEffect(() => {

    if (!visualizationOpen && !showClearPopup) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };

  }, [visualizationOpen, showClearPopup]);

  /* =========================================
     ESCAPE KEY
  ========================================= */

  useEffect(() => {

    function handleEscape(event: KeyboardEvent) {

      if (event.key !== 'Escape') return;

      if (showClearPopup) {

        setShowClearPopup(false);

        return;

      }

      if (showTransactions) {

        setShowTransactions(false);

      } else if (visualizationOpen) {

        setVisualizationOpen(false);

      }

    }

    window.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {

      window.removeEventListener(
        'keydown',
        handleEscape
      );

    };

  }, [
    visualizationOpen,
    showTransactions,
    showClearPopup,
  ]);

  /* =========================================
     CLEAR POPUP KEYBOARD FOCUS
  ========================================= */

  useEffect(() => {

    if (!showClearPopup) return;

    const previousFocus =
      document.activeElement as HTMLElement | null;

    const popup = clearPopupRef.current;

    popup
      ?.querySelector<HTMLButtonElement>(
        '.rp-clear-cancel'
      )
      ?.focus();

    function trapFocus(event: KeyboardEvent) {

      if (event.key !== 'Tab' || !popup) return;

      const buttons = Array.from(
        popup.querySelectorAll<HTMLButtonElement>(
          'button:not([disabled])'
        )
      );

      const first = buttons[0];

      const last = buttons[buttons.length - 1];

      if (!first || !last) return;

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }

    }

    document.addEventListener(
      'keydown',
      trapFocus
    );

    return () => {

      document.removeEventListener(
        'keydown',
        trapFocus
      );

      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }

    };

  }, [showClearPopup]);

  /* =========================================
     OPEN / CLOSE VISUALIZATION
  ========================================= */

  function openVisualization() {

    setShowTransactions(false);

    setVisualizationOpen(true);

  }

  function closeVisualization() {

    setShowTransactions(false);

    setVisualizationOpen(false);

  }

  /* =========================================
     FILTER ACTIONS
  ========================================= */

  function updateFilter(
    key: keyof Filters,
    value: string
  ) {

    setFilters((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'year' ? { month: '' } : {}),
    }));

  }

  function toggleFilter(
    key: keyof Filters,
    value: string
  ) {

    setFilters((previous) => ({
      ...previous,
      [key]: previous[key] === value ? '' : value,
      ...(key === 'year' ? { month: '' } : {}),
    }));

  }

  function resetFilters() {

    setFilters({ ...defaultFilters });

  }

  /* =========================================
     IMPORT CSV / JSON FILE
  ========================================= */

  async function handleImport(
    event: ChangeEvent<HTMLInputElement>
  ) {

    const file = event.target.files?.[0];

    if (!file || importing) return;

    setImporting(true);

    try {

      const importedRows =
        await importReportFile(file);

      try {

        localStorage.setItem(
          'silverhub-imported-report-filename',
          file.name
        );

      } catch {
        // Filename metadata is optional.
      }

      setImportedFileName(file.name);

      setSource('imported');

      setRows(importedRows);

      resetFilters();

      setImportNotification({
        message:
          `${importedRows.length} records imported successfully!`,
        type: 'success',
      });

    } catch (error) {

      setImportNotification({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to import the selected file.',
        type: 'error',
      });

    } finally {

      setImporting(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    }

  }

  /* =========================================
     OPEN CLEAR DATA CONFIRMATION POPUP
  ========================================= */

  function handleClearImportedData() {

    if (
      importing ||
      source !== 'imported' ||
      !rows.length
    ) {
      return;
    }

    setShowClearPopup(true);

  }

  /* =========================================
     CANCEL CLEAR DATA
  ========================================= */

  function cancelClearImportedData() {

    setShowClearPopup(false);

  }

  /* =========================================
     CONFIRM CLEAR IMPORTED DATA
  ========================================= */

  function confirmClearImportedData() {

    if (importing || source !== 'imported') {
      return;
    }

    try {

      clearImportedRows();

      localStorage.removeItem(
        'silverhub-imported-report-filename'
      );

      setImportedFileName('');

      setSource('imported');

      setRows([]);

      resetFilters();

      setShowClearPopup(false);

      setImportNotification({
        message: 'Imported data cleared successfully!',
        type: 'success',
      });

    } catch {

      setShowClearPopup(false);

      setImportNotification({
        message: 'Unable to clear imported data.',
        type: 'error',
      });

    }

  }

  /* =========================================
     FILTER OPTIONS
  ========================================= */

  const years = useMemo(() =>

    [...new Set(rows.map((row) => row.year))]
      .sort()
      .reverse(),

    [rows]

  );

  const months = useMemo(() =>

    [...new Set(
      rows
        .filter((row) =>
          !filters.year ||
          row.year === filters.year
        )
        .map((row) => row.month)
    )].sort(),

    [rows, filters.year]

  );

  const productOptions = useMemo(() =>

    groupReport(
      rows,
      (row) => row.productId,
      (row) => row.product
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),

    [rows]

  );

  const customerOptions = useMemo(() =>

    groupReport(
      rows,
      (row) => row.customerId,
      (row) => row.customer
    ).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),

    [rows]

  );

  const categories = useMemo(() =>

    [...new Set(
      rows.map((row) => row.category)
    )].sort(),

    [rows]

  );

  const payments = useMemo(() =>

    [...new Set(
      rows.map((row) => row.paymentMethod)
    )].sort(),

    [rows]

  );

  const statuses = useMemo(() =>

    [...new Set(
      rows.map((row) => row.status)
    )].sort(),

    [rows]

  );

  /* =========================================
     ACTIVE FILTER LABELS
  ========================================= */

  const activeFilters = (
    Object.keys(filters) as (keyof Filters)[]
  )
    .filter((key) => filters[key])
    .map((key) => {

      let label = filters[key];

      if (key === 'product') {

        label = productOptions.find(
          (item) => item.key === label
        )?.name || label;

      }

      if (key === 'customer') {

        label = customerOptions.find(
          (item) => item.key === label
        )?.name || label;

      }

      if (key === 'month') {

        label = formatMonth(label);

      }

      return { key, label };

    });

  /* =========================================
     FILTERED DATA
  ========================================= */

  const filteredRows = useMemo(() =>

    applyFilters(rows, filters),

    [rows, filters]

  );

  const salesRows = useMemo(() =>

    filteredRows.filter(isValidSale),

    [filteredRows]

  );

  /* =========================================
     KPI CALCULATIONS
  ========================================= */

  const totalRevenue = salesRows.reduce(
    (sum, row) => sum + row.revenue,
    0
  );

  const totalOrders = new Set(
    filteredRows.map((row) => row.orderId)
  ).size;

  const totalCustomers = new Set(
    filteredRows.map((row) => row.customerId)
  ).size;

  const totalQuantity = salesRows.reduce(
    (sum, row) => sum + row.quantity,
    0
  );

  /* =========================================
     MONTHLY SALES
  ========================================= */

  const monthlyData = useMemo(() => {

    const baseRows = applyFilters(
      rows,
      filters,
      'month'
    ).filter(isValidSale);

    const grouped = groupReport(
      baseRows,
      (row) => row.month,
      (row) => formatMonth(row.month)
    );

    const monthKeys = filters.year

      ? Array.from(
          { length: 12 },
          (_, index) =>
            `${filters.year}-${String(
              index + 1
            ).padStart(2, '0')}`
        )

      : [...new Set(
          rows.map((row) => row.month)
        )].sort();

    return monthKeys.map((key) => {

      const found = grouped.find(
        (item) => item.key === key
      );

      return found || {
        key,
        name: formatMonth(key),
        revenue: 0,
        quantity: 0,
        orders: 0,
      };

    });

  }, [rows, filters]);

  /* =========================================
     TOP 3 PRODUCTS
  ========================================= */

  const topProducts = useMemo(() =>

    groupReport(

      applyFilters(
        rows,
        filters,
        'product'
      ).filter(isValidSale),

      (row) => row.productId,

      (row) => row.product

    )

      .sort((a, b) =>
        b.quantity - a.quantity ||
        b.revenue - a.revenue
      )

      .slice(0, 3),

    [rows, filters]

  );

  /* =========================================
     MOST REPEATED CUSTOMERS
  ========================================= */

  const topCustomers = useMemo(() =>

    groupReport(

      applyFilters(
        rows,
        filters,
        'customer'
      ).filter(isValidSale),

      (row) => row.customerId,

      (row) => row.customer

    )

      .filter((customer) =>
        customer.orders > 1
      )

      .sort((a, b) =>
        b.orders - a.orders ||
        b.revenue - a.revenue
      )

      .slice(0, 5),

    [rows, filters]

  );

  /* =========================================
     CATEGORY PERFORMANCE
  ========================================= */

  const categoryData = useMemo(() =>

    groupReport(

      applyFilters(
        rows,
        filters,
        'category'
      ).filter(isValidSale),

      (row) => row.category,

      (row) => row.category

    ).sort((a, b) =>
      b.revenue - a.revenue
    ),

    [rows, filters]

  );

  /* =========================================
     PAYMENT METHODS
  ========================================= */

  const paymentData = useMemo(() =>

    groupReport(

      applyFilters(
        rows,
        filters,
        'payment'
      ),

      (row) => row.paymentMethod,

      (row) => row.paymentMethod

    ),

    [rows, filters]

  );

  /* =========================================
     ORDER STATUS
  ========================================= */

  const statusData = useMemo(() =>

    groupReport(

      applyFilters(
        rows,
        filters,
        'status'
      ),

      (row) => row.status,

      (row) => row.status

    ),

    [rows, filters]

  );

  /* =========================================
     RECENT TRANSACTIONS
  ========================================= */

  const transactions = useMemo(() => {

    const orders = new Map<
      string,
      {
        row: ReportRow;
        amount: number;
        quantity: number;
      }
    >();

    filteredRows.forEach((row) => {

      if (!orders.has(row.orderId)) {

        orders.set(row.orderId, {
          row,
          amount: 0,
          quantity: 0,
        });

      }

      const order = orders.get(row.orderId)!;

      order.amount += row.revenue;

      order.quantity += row.quantity;

    });

    return [...orders.values()].sort(
      (a, b) =>
        Date.parse(b.row.date) -
        Date.parse(a.row.date)
    );

  }, [filteredRows]);

  /* =========================================
     EXPORT CSV
  ========================================= */

  function exportReport() {

    const headers = [
      'Order ID',
      'Customer',
      'Email',
      'Date',
      'Product',
      'Category',
      'Quantity',
      'Unit Price',
      'Item Value',
      'Payment Method',
      'Payment Status',
      'Order Status',
    ];

    const csvRows = filteredRows.map(
      (row) => [
        row.orderId.split(':').pop(),
        row.customer,
        row.customerId,
        row.date,
        row.product,
        row.category,
        row.quantity,
        row.price,
        row.revenue,
        row.paymentMethod,
        row.paymentStatus,
        row.status,
      ]
    );

    const csv = [headers, ...csvRows]

      .map((row) =>

        row.map((value) => {

          let safe = String(value ?? '');

          if (/^[\s]*[=+\-@]/.test(safe)) {
            safe = "'" + safe;
          }

          return `"${safe.replace(/"/g, '""')}"`;

        }).join(',')

      ).join('\r\n');

    const blob = new Blob(
      ['\uFEFF', csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download =
      `silverhub-report-${source}.csv`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.setTimeout(() =>
      URL.revokeObjectURL(url),
      1000
    );

  }

  /* =========================================
     DATA SOURCE LABELS
  ========================================= */

  const sourceLabel =
    source === 'customer'
      ? 'Customer Orders'
      : source === 'admin'
        ? 'Admin Demo Orders'
        : 'Imported Data';

  const sourceNote =
    source === 'customer'
      ? 'Showing browser-stored customer orders. Payments are currently demo transactions.'
      : source === 'admin'
        ? 'Showing admin demonstration orders. These are not actual customer sales.'
        : 'Reports generated from imported CSV or JSON data. Existing customer orders are not affected.';

  /* =========================================
     KPI CARDS
  ========================================= */

  const kpis = [

    {
      name: 'Gross Merchandise Sales',
      value: formatCurrency(totalRevenue),
      icon: <IndianRupee size={24} />,
      subtitle: 'Excludes invalid sales',
    },

    {
      name: 'Total Orders',
      value: totalOrders,
      icon: <ShoppingBag size={24} />,
      subtitle: 'Distinct orders',
    },

    {
      name: 'Total Customers',
      value: totalCustomers,
      icon: <UsersRound size={24} />,
      subtitle: 'Unique customer accounts',
    },

    {
      name: 'Items Sold',
      value: totalQuantity,
      icon: <Package size={24} />,
      subtitle: 'Valid sales quantity',
    },

  ];

  /* =========================================
     MAIN PAGE
  ========================================= */

  return (

    <motion.div
      className="rp-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >

      {/* PAGE HEADER */}

      <div className="rp-page-header">

        <div>

          <span className="rp-eyebrow">
            ADMIN STUDIO
          </span>

          <h1>Business Reports</h1>

          <p>
            Import sales data, configure report filters
            and explore interactive business insights.
          </p>

        </div>

        <div className="rp-header-actions">

          {/* HIDDEN FILE INPUT */}

          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />

          {/* IMPORT DATA BUTTON */}

          <motion.button
            type="button"
            className="rp-import-button"
            whileTap={{ scale: 0.96 }}
            disabled={importing}
            onClick={() =>
              fileInputRef.current?.click()
            }
          >

            <Upload size={17} />

            {importing
              ? 'Importing...'
              : 'Import Data'}

          </motion.button>

          {/* REFRESH BUTTON */}

          <button
            type="button"
            className="rp-light-button"
            onClick={() =>
              setRows(loadReportRows(source))
            }
          >

            <RefreshCw size={16} />

            Refresh

          </button>

          {/* EXPORT BUTTON */}

          <button
            type="button"
            className="rp-primary-button"
            onClick={exportReport}
            disabled={!filteredRows.length}
          >

            <Download size={17} />

            Export Report

          </button>

        </div>

      </div>

      {/* =========================================
          IMPORTED DATA INFORMATION
      ========================================= */}

      {source === 'imported' && (

        <motion.div
          className="rp-imported-info"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >

          {rows.length > 0

            ? <CheckCircle2 size={24} />

            : <AlertCircle size={24} />

          }

          <div>

            <strong>

              {rows.length > 0

                ? importedFileName || 'Imported Dataset'

                : 'No imported dataset'}

            </strong>

            <small>

              {rows.length > 0

                ? `${rows.length} records available for analysis`

                : 'Upload a CSV or JSON file to generate reports.'}

            </small>

          </div>

          {/* CLEAR DATA BUTTON */}

          <button
            type="button"
            ref={clearButtonRef}
            disabled={!rows.length || importing}
            onClick={handleClearImportedData}
          >

            <Trash2 size={16} />

            Clear Data

          </button>

        </motion.div>

      )}

      {/* =========================================
          REPORT SLICERS
      ========================================= */}

      <section className="rp-filter-panel">

        <div className="rp-filter-heading">

          <h3>

            <Filter size={18} />

            Report Slicers

          </h3>

          <button
            type="button"
            className="rp-reset"
            onClick={resetFilters}
          >

            <RotateCcw size={15} />

            Reset All Filters

          </button>

        </div>

        <div className="rp-filter-grid">

          {/* DATA SOURCE */}

          <label>

            <span>Data Source</span>

            <select
              value={source}
              disabled={importing}
              onChange={(event) => {

                const value =
                  event.target.value as DashboardSource;

                setSource(value);

                setRows(loadReportRows(value));

                resetFilters();

              }}
            >

              <option value="customer">
                Customer Orders
              </option>

              <option value="admin">
                Admin Demo Orders
              </option>

              <option value="imported">
                Imported Data
              </option>

            </select>

          </label>

          {/* YEAR */}

          <label>

            <span>Year</span>

            <select
              value={filters.year}
              onChange={(event) =>
                updateFilter(
                  'year',
                  event.target.value
                )
              }
            >

              <option value="">All Years</option>

              {years.map((year) => (

                <option key={year} value={year}>
                  {year}
                </option>

              ))}

            </select>

          </label>

          {/* MONTH */}

          <label>

            <span>Month</span>

            <select
              value={filters.month}
              onChange={(event) =>
                updateFilter(
                  'month',
                  event.target.value
                )
              }
            >

              <option value="">All Months</option>

              {months.map((month) => (

                <option key={month} value={month}>
                  {formatMonth(month)}
                </option>

              ))}

            </select>

          </label>

          {/* PRODUCT */}

          <label>

            <span>Product</span>

            <select
              value={filters.product}
              onChange={(event) =>
                updateFilter(
                  'product',
                  event.target.value
                )
              }
            >

              <option value="">All Products</option>

              {productOptions.map((product) => (

                <option
                  key={product.key}
                  value={product.key}
                >

                  {product.name}

                </option>

              ))}

            </select>

          </label>

          {/* CATEGORY */}

          <label>

            <span>Category</span>

            <select
              value={filters.category}
              onChange={(event) =>
                updateFilter(
                  'category',
                  event.target.value
                )
              }
            >

              <option value="">
                All Categories
              </option>

              {categories.map((category) => (

                <option
                  key={category}
                  value={category}
                >

                  {category}

                </option>

              ))}

            </select>

          </label>

          {/* CUSTOMER */}

          <label>

            <span>Customer</span>

            <select
              value={filters.customer}
              onChange={(event) =>
                updateFilter(
                  'customer',
                  event.target.value
                )
              }
            >

              <option value="">
                All Customers
              </option>

              {customerOptions.map((customer) => (

                <option
                  key={customer.key}
                  value={customer.key}
                >

                  {customer.name}

                </option>

              ))}

            </select>

          </label>

          {/* PAYMENT */}

          <label>

            <span>Payment Method</span>

            <select
              value={filters.payment}
              onChange={(event) =>
                updateFilter(
                  'payment',
                  event.target.value
                )
              }
            >

              <option value="">
                All Payments
              </option>

              {payments.map((payment) => (

                <option
                  key={payment}
                  value={payment}
                >

                  {payment}

                </option>

              ))}

            </select>

          </label>

          {/* ORDER STATUS */}

          <label>

            <span>Order Status</span>

            <select
              value={filters.status}
              onChange={(event) =>
                updateFilter(
                  'status',
                  event.target.value
                )
              }
            >

              <option value="">
                All Statuses
              </option>

              {statuses.map((status) => (

                <option
                  key={status}
                  value={status}
                >

                  {status}

                </option>

              ))}

            </select>

          </label>

        </div>

        {/* ACTIVE FILTERS */}

        <div className="rp-active-filters">

          {activeFilters.map(({ key, label }) => (

            <button
              type="button"
              key={key}
              onClick={() => updateFilter(key, '')}
            >

              {label}

              <X size={13} />

            </button>

          ))}

        </div>

        {/* OPEN VISUALIZATION */}

        <div className="rp-open-actions">

          <div className="rp-report-summary">

            <ChartColumn size={23} />

            <div>

              <strong>

                {totalOrders
                  ? 'Report is ready'
                  : 'No matching orders'}

              </strong>

              <small>

                {totalOrders} matching orders

                {' · '}

                {totalCustomers} customers

              </small>

            </div>

          </div>

          <motion.button
            type="button"
            className="rp-open-visualization"
            onClick={openVisualization}
            whileTap={{ scale: 0.97 }}
            disabled={importing}
          >

            <ChartNoAxesCombined size={20} />

            Open Visualization

          </motion.button>

        </div>

      </section>

      {/* DATA SOURCE NOTE */}

      <div className="rp-data-note">

        {sourceNote}

      </div>

      {/* =========================================
          FULL SCREEN VISUALIZATION
      ========================================= */}

      {visualizationOpen && createPortal(

        <div
          className="rp-page rp-visualization-screen"
          role="dialog"
          aria-modal="true"
          aria-label="Business visualization"
        >

          {/* DASHBOARD HEADER */}

          <header className="rp-visualization-header">

            <div className="rp-visualization-title">

              <span>
                SILVERHUB ANALYTICS
              </span>

              <h1>Business Dashboard</h1>

            </div>

            <div className="rp-visualization-actions">

              <button
                type="button"
                className="rp-light-button"
                onClick={closeVisualization}
              >

                <Filter size={16} />

                Edit Filters

              </button>

              <button
                type="button"
                className="rp-light-button"
                onClick={resetFilters}
              >

                <RotateCcw size={16} />

                Reset

              </button>

              <button
                type="button"
                className="rp-light-button"
                onClick={() =>
                  setRows(loadReportRows(source))
                }
              >

                <RefreshCw size={16} />

                Refresh

              </button>

              <button
                type="button"
                className="rp-light-button"
                onClick={() =>
                  setShowTransactions(true)
                }
              >

                <Receipt size={16} />

                Transactions

              </button>

              <button
                type="button"
                className="rp-primary-button"
                onClick={exportReport}
                disabled={!filteredRows.length}
              >

                <Download size={16} />

                Export

              </button>

              <button
                type="button"
                className="rp-visualization-close"
                aria-label="Close visualization"
                title="Close visualization"
                onClick={closeVisualization}
                autoFocus
              >

                <X size={22} />

              </button>

            </div>

          </header>

          {/* ACTIVE DASHBOARD FILTERS */}

          <div className="rp-visualization-filters">

            <span>{sourceLabel}</span>

            {!activeFilters.length && (

              <span>All Data</span>

            )}

            {activeFilters.map(({ key, label }) => (

              <button
                type="button"
                key={key}
                onClick={() => updateFilter(key, '')}
              >

                {label}

                <X size={12} />

              </button>

            ))}

            <small>
              Click any visualization to cross-filter
            </small>

          </div>

          {/* =========================================
              KPI CARDS
          ========================================= */}

          <div className="rp-kpi-grid">

            {kpis.map((kpi) => (

              <motion.div
                className="rp-kpi-card"
                key={kpi.name}
                whileHover={{ y: -2 }}
              >

                <div className="rp-kpi-icon">

                  {kpi.icon}

                </div>

                <p>{kpi.name}</p>

                <motion.h2
                  key={String(kpi.value)}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >

                  {kpi.value}

                </motion.h2>

                <span>{kpi.subtitle}</span>

              </motion.div>

            ))}

          </div>

          {/* =========================================
              SIX VISUALIZATIONS
          ========================================= */}

          <div className="rp-visualization-grid">

            {/* 1. MONTHLY SALES */}

            <ReportCard
              title="Monthly Sales Performance"
              subtitle="Click any month to filter the report."
              icon={<CalendarDays size={22} />}
            >

              {monthlyData.length ? (

                <div className="rp-monthly-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={monthlyData}
                      margin={{
                        top: 8,
                        right: 5,
                        left: 0,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#ece7de"
                      />

                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={8}
                      />

                      <YAxis
                        width={55}
                        tick={{ fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => {

                          const number = Number(value);

                          if (number >= 100000) {

                            return `₹${(
                              number / 100000
                            ).toFixed(1)}L`;

                          }

                          if (number >= 1000) {

                            return `₹${(
                              number / 1000
                            ).toFixed(1)}K`;

                          }

                          return `₹${number}`;

                        }}
                      />

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(Number(value))
                        }
                        cursor={{
                          fill: '#f5efe5',
                        }}
                      />

                      <Bar
                        dataKey="revenue"
                        name="Sales"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={35}
                        cursor="pointer"
                        animationDuration={450}
                        onClick={(_, index) => {

                          const month =
                            monthlyData[index];

                          if (month) {

                            toggleFilter(
                              'month',
                              month.key
                            );

                          }

                        }}
                      >

                        {monthlyData.map((item) => (

                          <Cell
                            key={item.key}
                            fill={
                              filters.month === item.key
                                ? '#c6a16b'
                                : '#0b1b2d'
                            }
                            fillOpacity={
                              filters.month &&
                              filters.month !== item.key
                                ? 0.3
                                : 1
                            }
                          />

                        ))}

                      </Bar>

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              ) : <EmptyChart />}

            </ReportCard>

            {/* =========================================
                2. TOP 3 PRODUCTS
            ========================================= */}

            <ReportCard
              title="Top 3 Selling Products"
              subtitle="Ranked by quantity sold. Click to filter."
              icon={<Trophy size={23} />}
            >

              {topProducts.length ? (

                <div className="rp-ranking-list">

                  {topProducts.map((product, index) => (

                    <button
                      type="button"
                      key={product.key}
                      title={product.name}
                      className={`rp-ranking-item ${
                        filters.product === product.key
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        toggleFilter(
                          'product',
                          product.key
                        )
                      }
                    >

                      <div className="rp-ranking-top">

                        <span className="rp-rank">

                          0{index + 1}

                        </span>

                        <strong>

                          {product.name}

                        </strong>

                        <span>

                          {product.quantity} sold

                        </span>

                      </div>

                      <div className="rp-progress-track">

                        <motion.div
                          className="rp-progress-fill"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${
                              product.quantity /
                              Math.max(
                                1,
                                topProducts[0].quantity
                              ) * 100
                            }%`,
                          }}
                          transition={{
                            duration: 0.4,
                          }}
                        />

                      </div>

                      <small>

                        {formatCurrency(product.revenue)}

                      </small>

                    </button>

                  ))}

                </div>

              ) : <EmptyChart />}

            </ReportCard>

            {/* =========================================
                3. MOST REPEATED CUSTOMERS
            ========================================= */}

            <ReportCard
              title="Most Repeated Customers"
              subtitle="Customers with two or more valid orders."
              icon={<UsersRound size={23} />}
            >

              {topCustomers.length ? (

                <div className="rp-customer-list">

                  {topCustomers.map((customer, index) => (

                    <button
                      type="button"
                      key={customer.key}
                      title={customer.name}
                      className={`rp-customer-row ${
                        filters.customer === customer.key
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        toggleFilter(
                          'customer',
                          customer.key
                        )
                      }
                    >

                      <span className="rp-rank">

                        0{index + 1}

                      </span>

                      <span className="rp-avatar">

                        <UserRound size={20} />

                      </span>

                      <div className="rp-customer-name">

                        <strong>

                          {customer.name}

                        </strong>

                        <small>

                          {customer.orders} orders

                        </small>

                      </div>

                      <strong className="rp-customer-amount">

                        {formatCurrency(customer.revenue)}

                      </strong>

                    </button>

                  ))}

                </div>

              ) : (

                <div className="rp-empty">

                  <UsersRound size={32} />

                  <h3>

                    No repeat customers yet

                  </h3>

                  <p>
                    Repeat customers appear after at least
                    two matching valid orders.
                  </p>

                </div>

              )}

            </ReportCard>

            {/* =========================================
                4. CATEGORY PERFORMANCE
            ========================================= */}

            <ReportCard
              title="Category Performance"
              subtitle="Click a category to filter sales."
              icon={<Layers3 size={22} />}
            >

              {categoryData.length ? (

                <div className="rp-chart">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={categoryData}
                      layout="vertical"
                      margin={{
                        left: 0,
                        right: 10,
                        top: 5,
                        bottom: 5,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#ece7de"
                      />

                      <XAxis
                        type="number"
                        tick={{ fontSize: 9 }}
                        tickFormatter={(value) => {

                          const number = Number(value);

                          return number >= 1000

                            ? `₹${(
                                number / 1000
                              ).toFixed(1)}K`

                            : `₹${number}`;

                        }}
                      />

                      <YAxis
                        type="category"
                        dataKey="name"
                        width={85}
                        tick={{ fontSize: 10 }}
                      />

                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(Number(value))
                        }
                      />

                      <Bar
                        dataKey="revenue"
                        name="Sales"
                        radius={[0, 5, 5, 0]}
                        maxBarSize={24}
                        cursor="pointer"
                        animationDuration={450}
                        onClick={(_, index) => {

                          const category =
                            categoryData[index];

                          if (category) {

                            toggleFilter(
                              'category',
                              category.key
                            );

                          }

                        }}
                      >

                        {categoryData.map((category) => (

                          <Cell
                            key={category.key}
                            fill={
                              filters.category === category.key
                                ? '#0b1b2d'
                                : '#c6a16b'
                            }
                            fillOpacity={
                              filters.category &&
                              filters.category !== category.key
                                ? 0.3
                                : 1
                            }
                          />

                        ))}

                      </Bar>

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              ) : <EmptyChart />}

            </ReportCard>

            {/* =========================================
                5. PAYMENT METHODS
            ========================================= */}

            <ReportCard
              title="Payment Methods"
              subtitle="Click a segment to filter orders."
              icon={<CreditCard size={22} />}
            >

              {paymentData.length ? (

                <>

                  <div className="rp-chart">

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={paymentData}
                          dataKey="orders"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="85%"
                          paddingAngle={4}
                          cursor="pointer"
                          animationDuration={450}
                          onClick={(_, index) => {

                            const payment =
                              paymentData[index];

                            if (payment) {

                              toggleFilter(
                                'payment',
                                payment.key
                              );

                            }

                          }}
                        >

                          {paymentData.map((item, index) => (

                            <Cell
                              key={item.key}
                              fill={
                                COLORS[index % COLORS.length]
                              }
                              fillOpacity={
                                filters.payment &&
                                filters.payment !== item.key
                                  ? 0.25
                                  : 1
                              }
                            />

                          ))}

                        </Pie>

                        <Tooltip />

                      </PieChart>

                    </ResponsiveContainer>

                  </div>

                  <div className="rp-legend">

                    {paymentData.map((item, index) => (

                      <button
                        type="button"
                        key={item.key}
                        onClick={() =>
                          toggleFilter(
                            'payment',
                            item.key
                          )
                        }
                        className={
                          filters.payment === item.key
                            ? 'selected'
                            : ''
                        }
                      >

                        <span
                          style={{
                            background:
                              COLORS[index % COLORS.length],
                          }}
                        />

                        {item.name} ({item.orders})

                      </button>

                    ))}

                  </div>

                </>

              ) : <EmptyChart />}

            </ReportCard>

            {/* =========================================
                6. ORDER STATUS
            ========================================= */}

            <ReportCard
              title="Order Status Overview"
              subtitle="Select a status to filter the report."
              icon={<Package size={22} />}
            >

              {statusData.length ? (

                <div className="rp-status-grid">

                  {statusData.map((status) => (

                    <button
                      type="button"
                      key={status.key}
                      className={`rp-status-card ${
                        filters.status === status.key
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        toggleFilter(
                          'status',
                          status.key
                        )
                      }
                    >

                      <span>

                        {status.name}

                      </span>

                      <strong>

                        {status.orders}

                      </strong>

                      <small>Orders</small>

                    </button>

                  ))}

                </div>

              ) : <EmptyChart />}

            </ReportCard>

          </div>

          {/* =========================================
              DASHBOARD FOOTER
          ========================================= */}

          <div className="rp-footer-note">

            SilverHub Business Analytics

            {' · '}

            {sourceLabel}

            {source === 'imported' && importedFileName
              ? ` · ${importedFileName}`
              : ''}

            {' · '}

            {sourceNote}

          </div>

          {/* =========================================
              TRANSACTIONS POPUP
          ========================================= */}

          {showTransactions && (

            <div
              className="rp-transactions-overlay"
              onClick={() =>
                setShowTransactions(false)
              }
            >

              <div
                className="rp-transactions-popup"
                role="dialog"
                aria-modal="true"
                aria-label="Transaction details"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                <div className="rp-transactions-header">

                  <h2>Transaction Details</h2>

                  <button
                    type="button"
                    className="rp-visualization-close"
                    aria-label="Close transactions"
                    onClick={() =>
                      setShowTransactions(false)
                    }
                    autoFocus
                  >

                    <X size={22} />

                  </button>

                </div>

                <ReportCard
                  title="Recent Transactions"
                  subtitle={`${transactions.length} matching orders`}
                  icon={<Receipt size={22} />}
                >

                  <div className="rp-table-scroll">

                    <table className="rp-table">

                      <thead>

                        <tr>

                          <th>Order ID</th>

                          <th>Customer</th>

                          <th>Date</th>

                          <th>Items</th>

                          <th>Item Value</th>

                          <th>Payment</th>

                          <th>Status</th>

                        </tr>

                      </thead>

                      <tbody>

                        {transactions.slice(0, 15).map(
                          ({ row, amount, quantity }) => (

                            <tr key={row.orderId}>

                              <td className="rp-order-id">

                                {row.orderId.split(':').pop()}

                              </td>

                              <td>

                                <button
                                  type="button"
                                  className="rp-table-link"
                                  onClick={() => {

                                    toggleFilter(
                                      'customer',
                                      row.customerId
                                    );

                                    setShowTransactions(false);

                                  }}
                                >

                                  {row.customer}

                                </button>

                              </td>

                              <td>

                                {new Date(row.date)
                                  .toLocaleDateString('en-IN')}

                              </td>

                              <td>

                                {quantity}

                              </td>

                              <td>

                                {formatCurrency(amount)}

                              </td>

                              <td>

                                {row.paymentMethod}

                              </td>

                              <td>

                                <span className="rp-status-label">

                                  {row.status}

                                </span>

                              </td>

                            </tr>

                          )
                        )}

                        {!transactions.length && (

                          <tr>

                            <td colSpan={7}>

                              <div className="rp-empty">

                                No matching transactions.

                              </div>

                            </td>

                          </tr>

                        )}

                      </tbody>

                    </table>

                  </div>

                  {transactions.length > 15 && (

                    <div className="rp-data-note">

                      Showing the latest 15 orders.
                      Export the report to view all
                      matching order items.

                    </div>

                  )}

                </ReportCard>

              </div>

            </div>

          )}

        </div>,

        document.body

      )}

      {/* =========================================
          CLEAR DATA CONFIRMATION POPUP
      ========================================= */}

      {createPortal(

        <AnimatePresence>

          {showClearPopup && (

            <motion.div
              key="clear-data-overlay"
              className="rp-clear-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={cancelClearImportedData}
            >

              <motion.div
                ref={clearPopupRef}
                className="rp-clear-popup"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="rp-clear-title"
                aria-describedby="rp-clear-description"
                initial={{
                  opacity: 0,
                  scale: 0.85,
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
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                }}
                onClick={(event) =>
                  event.stopPropagation()
                }
              >

                {/* CLOSE BUTTON */}

                <button
                  type="button"
                  className="rp-clear-close"
                  aria-label="Close popup"
                  onClick={cancelClearImportedData}
                >

                  <X size={21} />

                </button>

                {/* DELETE ICON */}

                <motion.div
                  className="rp-clear-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 250,
                    damping: 15,
                    delay: 0.1,
                  }}
                >

                  <Trash2 size={32} />

                </motion.div>

                {/* POPUP TITLE */}

                <h2 id="rp-clear-title">

                  Clear Imported Data?

                </h2>

                {/* POPUP DESCRIPTION */}

                <p id="rp-clear-description">

                  Are you sure you want to clear all imported
                  report data? This action cannot be undone.

                </p>

                {/* IMPORTED FILE DETAILS */}

                <div className="rp-clear-file">

                  <Receipt size={21} />

                  <div>

                    <strong>

                      {importedFileName ||
                        'Imported Dataset'}

                    </strong>

                    <small>

                      {rows.length} records will be removed

                    </small>

                  </div>

                </div>

                {/* SAFETY NOTE */}

                <div className="rp-clear-note">

                  <ShieldCheck size={17} />

                  Existing customer and admin orders
                  will not be affected.

                </div>

                {/* ACTION BUTTONS */}

                <div className="rp-clear-actions">

                  {/* CANCEL */}

                  <motion.button
                    type="button"
                    className="rp-clear-cancel"
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelClearImportedData}
                    autoFocus
                  >

                    Cancel

                  </motion.button>

                  {/* CONFIRM CLEAR DATA */}

                  <motion.button
                    type="button"
                    className="rp-clear-confirm"
                    whileTap={{ scale: 0.95 }}
                    onClick={confirmClearImportedData}
                    disabled={importing}
                  >

                    <Trash2 size={17} />

                    Yes, Clear Data

                  </motion.button>

                </div>

              </motion.div>

            </motion.div>

          )}

        </AnimatePresence>,

        document.body

      )}

      {/* =========================================
          SUCCESS / ERROR NOTIFICATION
      ========================================= */}

      {createPortal(

        <AnimatePresence>

          {importNotification && (

            <motion.div
              key="import-notification"
              className={`rp-import-toast ${importNotification.type}`}
              initial={{
                opacity: 0,
                x: 100,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 100,
              }}
              transition={{
                duration: 0.3,
              }}
              role={
                importNotification.type === 'error'
                  ? 'alert'
                  : 'status'
              }
            >

              {importNotification.type === 'success'

                ? <CheckCircle2 size={23} />

                : <AlertCircle size={23} />

              }

              <div>

                <strong>

                  {importNotification.type === 'success'

                    ? 'Success'

                    : 'Operation Failed'}

                </strong>

                <p>

                  {importNotification.message}

                </p>

              </div>

              <button
                type="button"
                aria-label="Close notification"
                onClick={() =>
                  setImportNotification(null)
                }
              >

                <X size={17} />

              </button>

            </motion.div>

          )}

        </AnimatePresence>,

        document.body

      )}

    </motion.div>

  );

}