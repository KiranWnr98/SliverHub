import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  Film,
  ImagePlus,
  LayoutGrid,
  List,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';

import { useProductCatalog } from '../../../hooks/useProducts';
import { useProductImage, useProductMediaUrl } from '../../../hooks/useProductMedia';
import { categories } from '../../../data/categories';
import type { Product, ProductMediaKind, ProductMediaReference } from '../../../types';
import type {
  NewProductInput,
  ProductUpdate,
} from '../../../context/ProductContextValue';
import ProductCsvImport from './ProductCsvImport';
import {
  deleteProductMediaFiles,
  getProductMediaFile,
  productImageMediaId,
  productImageReference,
  saveProductMediaFile,
} from '../../../services/productMediaStore';
import './Products.css';

type ProductStatus = 'active' | 'out-of-stock' | 'hidden' | 'scheduled';
type ProductTab = 'all' | ProductStatus;
type ViewMode = 'table' | 'grid';
type SortOrder = 'newest' | 'oldest' | 'price-low' | 'price-high' | 'name';

interface ProductFormValues {
  name: string;
  sku: string;
  category: string;
  price: string;
  oldPrice: string;
  stockQuantity: string;
  description: string;
  isNew: boolean;
}

type MediaStatus = 'validating' | 'ready' | 'saving' | 'saved' | 'failed';
type MediaMatchMethod = 'automatic' | 'manual';

interface MediaDraft extends ProductMediaReference {
  file?: File;
  previewUrl?: string;
  status: MediaStatus;
  error?: string;
  matchedProductId?: number | null;
  matchingMethod?: MediaMatchMethod;
}

interface ValidatedMediaType {
  kind: ProductMediaKind;
  mimeType: string;
}

interface BulkMediaResult {
  totalSelected: number;
  assigned: number;
  saved: number;
  productsUpdated: number;
  failed: number;
  unmatched: number;
  errors: Array<{ name: string; message: string }>;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PDF_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

const tabLabels: Record<ProductTab, string> = {
  all: 'All Products',
  active: 'Active',
  'out-of-stock': 'Out of Stock',
  hidden: 'Hidden',
  scheduled: 'Scheduled Deletion',
};

const emptyForm = (category: string): ProductFormValues => ({
  name: '',
  sku: '',
  category,
  price: '',
  oldPrice: '',
  stockQuantity: '10',
  description: '',
  isNew: false,
});

function getProductStatus(product: Product): ProductStatus {
  if (product.scheduledDeletionAt) return 'scheduled';
  if (product.isHidden) return 'hidden';
  if ((product.stockQuantity ?? 0) <= 0) return 'out-of-stock';
  return 'active';
}

function productSku(product: Product): string {
  return product.sku || `SH-${String(product.id).padStart(4, '0')}`;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function tomorrowDateKey(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateKey(tomorrow);
}

function formatLocalDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString('en-GB');
}

function formatDeletedAt(value?: string | null): string {
  if (!value) return 'Deletion date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Deletion date unavailable'
    : date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
}

function csvCell(value: string | number | null | undefined): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function mediaId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `media-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function validateMediaFile(file: File): Promise<ValidatedMediaType> {
  if (file.size === 0) throw new Error('Empty files are not allowed.');

  const filename = file.name.toLowerCase();
  const isJpegName = filename.endsWith('.jpg') || filename.endsWith('.jpeg');
  const isPngName = filename.endsWith('.png');
  const isPdfName = filename.endsWith('.pdf');
  const isMp4Name = filename.endsWith('.mp4');

  if ((isJpegName || isPngName) && file.size > MAX_IMAGE_SIZE) {
    throw new Error('Images must be 10 MB or smaller.');
  }
  if (isPdfName && file.size > MAX_PDF_SIZE) {
    throw new Error('PDF documents must be 20 MB or smaller.');
  }
  if (isMp4Name && file.size > MAX_VIDEO_SIZE) {
    throw new Error('Videos must be 100 MB or smaller.');
  }
  if (!isJpegName && !isPngName && !isPdfName && !isMp4Name) {
    throw new Error('Unsupported file type. Choose JPG, JPEG, PNG, PDF, or MP4.');
  }

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg =
    signature.length >= 3 &&
    signature[0] === 0xff &&
    signature[1] === 0xd8 &&
    signature[2] === 0xff;
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const isPng = pngSignature.every((byte, index) => signature[index] === byte);
  const isPdf =
    signature.length >= 5 &&
    signature[0] === 0x25 &&
    signature[1] === 0x50 &&
    signature[2] === 0x44 &&
    signature[3] === 0x46 &&
    signature[4] === 0x2d;
  const isMp4 =
    signature.length >= 8 &&
    String.fromCharCode(...signature.slice(4, 8)) === 'ftyp';

  if (isJpeg && isJpegName) return { kind: 'image', mimeType: 'image/jpeg' };
  if (isPng && isPngName) return { kind: 'image', mimeType: 'image/png' };
  if (isPdf && isPdfName) return { kind: 'pdf', mimeType: 'application/pdf' };
  if (isMp4 && isMp4Name) return { kind: 'video', mimeType: 'video/mp4' };

  throw new Error('File contents do not match a supported JPG, PNG, PDF, or MP4 file.');
}

function productMediaReferences(product: Product): ProductMediaReference[] {
  const references = [...(product.media ?? [])];
  const storedMediaId = productImageMediaId(product.image);
  const existingImage = references.some((reference) =>
    storedMediaId
      ? reference.id === storedMediaId
      : reference.kind === 'image' &&
        reference.storage === 'url' &&
        reference.url === product.image,
  );
  if (!existingImage) {
    const imageName =
      product.image.split('/').pop()?.split(/[?#]/)[0] || `product-${product.id}-image`;
    references.unshift({
      id: storedMediaId ?? `legacy-image-${product.id}`,
      kind: 'image',
      name: imageName,
      mimeType: /\.png(?:[?#]|$)/i.test(product.image) ? 'image/png' : 'image/jpeg',
      size: 0,
      storage: storedMediaId ? 'indexeddb' : 'url',
      ...(storedMediaId ? {} : { url: product.image }),
    });
  }
  return references;
}

function primaryMediaId(
  product: Product,
  references: ProductMediaReference[],
): string | null {
  if (
    product.primaryMediaId &&
    references.some(
      (reference) =>
        reference.id === product.primaryMediaId && reference.kind === 'image',
    )
  ) {
    return product.primaryMediaId;
  }
  const storedId = productImageMediaId(product.image);
  return (
    references.find((reference) =>
      storedId
        ? reference.id === storedId && reference.kind === 'image'
        : reference.kind === 'image' &&
          reference.storage === 'url' &&
          reference.url === product.image,
    )?.id ?? null
  );
}

function draftFromReference(reference: ProductMediaReference): MediaDraft {
  return { ...reference, status: 'saved' };
}

function findProductForFilename(
  filename: string,
  products: Product[],
): Product | undefined {
  const baseName = filename.replace(/\.[^.]+$/, '');
  const sortedProducts = [...products].sort(
    (left, right) => productSku(right).length - productSku(left).length,
  );
  return sortedProducts.find((product) => {
    const escapedSku = productSku(product).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[._ -])${escapedSku}(?:$|[._ -])`, 'i').test(baseName);
  });
}

function downloadProductsCsv(products: Product[]): void {
  const headers = [
    'Product ID',
    'Product Name',
    'SKU',
    'Category',
    'Selling Price',
    'Original Price',
    'Stock Quantity',
    'Stock Status',
    'Visibility',
    'Scheduled Deletion Date',
    'Description',
    'Product Image Path',
  ];
  const rows = products.map((product) => {
    const stock = product.stockQuantity ?? 0;
    const visibility = product.scheduledDeletionAt
      ? 'Scheduled Deletion'
      : product.isHidden
        ? 'Hidden'
        : 'Visible';
    return [
      product.id,
      product.name,
      productSku(product),
      product.category,
      product.price,
      product.oldPrice ?? '',
      stock,
      stock > 0 ? 'In Stock' : 'Out of Stock',
      visibility,
      product.scheduledDeletionAt ?? '',
      product.description ?? '',
      product.image,
    ];
  });
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `silverhub-products-${localDateKey(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function ProductThumbnail({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = useProductImage(product.image);

  useEffect(() => {
    setImageFailed(false);
  }, [product.image]);

  if (imageFailed || !imageUrl) {
    return (
      <div className="admin-product-thumb admin-product-thumb-fallback" role="img" aria-label={`${product.name} image unavailable`}>
        {product.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className="admin-product-thumb"
      src={imageUrl}
      alt={product.name}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  );
}

function ProductMediaCard({
  media,
  isPrimary,
  matchLabel,
  onSetPrimary,
  onRemove,
  onPreview,
  onDragStart,
  onDrop,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  productOptions,
  assignedProductId,
  onAssignProduct,
  allowRemoval = true,
  allowReorder = true,
  allowSetPrimary = true,
}: {
  media: MediaDraft;
  isPrimary: boolean;
  matchLabel?: string;
  onSetPrimary: () => void;
  onRemove: () => void;
  onPreview: () => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  productOptions?: Product[];
  assignedProductId?: number | null;
  onAssignProduct?: (productId: number | null) => void;
  allowRemoval?: boolean;
  allowReorder?: boolean;
  allowSetPrimary?: boolean;
}) {
  const storedUrl = useProductMediaUrl(
    media.storage === 'indexeddb' && !media.previewUrl ? media.id : null,
  );
  const fileUrl =
    media.previewUrl ??
    (media.storage === 'url' ? media.url ?? null : storedUrl);

  return (
    <article
      className={`products-media-card ${media.kind !== 'image' ? 'is-document' : ''} ${media.kind === 'video' ? 'is-video' : ''}`}
      draggable={media.kind === 'image' && allowReorder}
      onDragStart={onDragStart}
      onDragOver={(event) => {
        if (media.kind === 'image') event.preventDefault();
      }}
      onDrop={onDrop}
    >
      {media.kind === 'image' ? (
        <button
          type="button"
          className="products-media-thumbnail"
          onClick={onPreview}
          aria-label={`Preview ${media.name}`}
        >
          {fileUrl ? <img src={fileUrl} alt="" /> : <ImagePlus size={27} />}
          {isPrimary && (
            <span className="products-primary-badge">
              <Star size={12} fill="currentColor" /> Primary
            </span>
          )}
        </button>
      ) : media.kind === 'video' ? (
        <button
          type="button"
          className="products-media-thumbnail products-media-video-thumbnail"
          onClick={onPreview}
          aria-label={`Preview video ${media.name}`}
        >
          {fileUrl ? (
            <video src={fileUrl} muted playsInline preload="metadata" />
          ) : (
            <Film size={27} />
          )}
          <span className="products-video-badge"><Film size={12} /> VIDEO</span>
        </button>
      ) : (
        <div className="products-document-icon">
          <FileText size={28} />
          <span>PDF</span>
        </div>
      )}
      <div className="products-media-details">
        <strong title={media.name}>{media.name}</strong>
        <span>
          {formatFileSize(media.size)} · {media.status === 'saved'
            ? 'Saved locally'
            : media.status === 'ready'
              ? 'Ready to save'
              : media.status === 'saving'
                ? 'Saving locally…'
                : media.status === 'validating'
                  ? 'Validating…'
                  : 'Needs attention'}
        </span>
        {matchLabel && <span className="products-media-match">{matchLabel}</span>}
        {media.error && <span className="products-media-error">{media.error}</span>}
        {productOptions && onAssignProduct && (
          <label className="products-media-assignment">
            <span>Select Product</span>
            <select
              value={assignedProductId ?? ''}
              disabled={media.status !== 'ready'}
              aria-label={`Select product for ${media.name}`}
              onChange={(event) => {
                const value = event.target.value;
                onAssignProduct(value ? Number(value) : null);
              }}
            >
              <option value="">Select product</option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {productSku(product)} · {product.category}
                </option>
              ))}
            </select>
          </label>
        )}
        {media.kind === 'pdf' && fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="products-media-preview-link"
          >
            Open PDF preview
          </a>
        )}
        {media.kind === 'video' && fileUrl && (
          <button
            type="button"
            className="products-media-preview-link"
            onClick={onPreview}
          >
            Play video
          </button>
        )}
      </div>
      <div className="products-media-actions">
        {media.kind === 'image' && allowReorder && (
          <>
            <button type="button" className="products-media-icon-button" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${media.name} earlier`} title="Move earlier">
              <ChevronUp size={15} />
            </button>
            <button type="button" className="products-media-icon-button" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move ${media.name} later`} title="Move later">
              <ChevronDown size={15} />
            </button>
          </>
        )}
        {media.kind === 'image' && allowSetPrimary && !isPrimary && media.status !== 'failed' && (
          <button
            type="button"
            className="products-media-icon-button"
            onClick={onSetPrimary}
            aria-label={`Set ${media.name} as primary image`}
            title="Set as primary"
          >
            <Star size={15} />
          </button>
        )}
        <button
          type="button"
          className="products-media-icon-button"
          onClick={onPreview}
          aria-label={`Preview ${media.name}`}
          title="Preview file"
        >
          <Eye size={15} />
        </button>
        {allowRemoval && media.status !== 'saving' && (
          <button
            type="button"
            className="products-media-icon-button remove"
            onClick={onRemove}
            aria-label={`Remove ${media.name}`}
            title="Remove file"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </article>
  );
}

export default function Products() {
  const {
    products,
    storageError,
    addProduct,
    importProducts,
    updateProduct,
    setProductHidden,
    setProductsHidden,
    setStockQuantity,
    setProductsStockQuantity,
    scheduleDeletion,
    cancelScheduledDeletion,
    softDeleteProduct,
    restoreProduct,
    permanentlyDeleteProduct,
  } = useProductCatalog();

  const [selectedStatus, setSelectedStatus] = useState<ProductTab>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkVisibilityAction, setBulkVisibilityAction] =
    useState<'hide' | 'show' | null>(null);
  const [bulkStockOpen, setBulkStockOpen] = useState(false);
  const [bulkStockMode, setBulkStockMode] = useState<
    'in-stock' | 'out-of-stock' | 'custom'
  >('in-stock');
  const [bulkStockQuantity, setBulkStockQuantity] = useState('');
  const [bulkStockError, setBulkStockError] = useState('');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<ProductFormValues>(
    () => emptyForm(categories[0]?.name ?? ''),
  );
  const [formMedia, setFormMedia] = useState<MediaDraft[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [primaryConfirmationId, setPrimaryConfirmationId] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaDraft | null>(null);
  const [formDropActive, setFormDropActive] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [bulkMediaOpen, setBulkMediaOpen] = useState(false);
  const [bulkMedia, setBulkMedia] = useState<MediaDraft[]>([]);
  const [bulkPrimarySelections, setBulkPrimarySelections] = useState<
    Record<number, string>
  >({});
  const [bulkMediaError, setBulkMediaError] = useState('');
  const [bulkMediaResult, setBulkMediaResult] = useState<BulkMediaResult | null>(null);
  const [bulkDropActive, setBulkDropActive] = useState(false);
  const [bulkMediaSaving, setBulkMediaSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pageError, setPageError] = useState('');
  const [deletionTarget, setDeletionTarget] = useState<Product | null>(null);
  const [deletionStep, setDeletionStep] = useState<'choose' | 'confirm' | 'schedule'>('choose');
  const [scheduledDate, setScheduledDate] = useState('');
  const [confirmSoftDelete, setConfirmSoftDelete] = useState(false);
  const [deletionError, setDeletionError] = useState('');
  const [permanentDeletionTarget, setPermanentDeletionTarget] =
    useState<Product | null>(null);
  const [confirmPermanentDeletion, setConfirmPermanentDeletion] =
    useState(false);
  const [permanentDeletionError, setPermanentDeletionError] = useState('');
  const previewUrls = useRef(new Set<string>());
  const bulkSaveLock = useRef(false);
  const previewMediaStoredUrl = useProductMediaUrl(
    previewMedia?.storage === 'indexeddb' && !previewMedia.previewUrl
      ? previewMedia.id
      : null,
  );
  const previewMediaUrl =
    previewMedia?.previewUrl ??
    (previewMedia?.storage === 'url'
      ? previewMedia.url ?? null
      : previewMediaStoredUrl);

  useEffect(
    () => () => {
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
      previewUrls.current.clear();
    },
    [],
  );

  const activeProducts = useMemo(
    () => products.filter((product) => !product.isDeleted),
    [products],
  );
  const assignableProducts = useMemo(
    () => activeProducts.filter((product) => getProductStatus(product) === 'active'),
    [activeProducts],
  );
  const recentlyDeleted = useMemo(
    () =>
      products
        .filter((product) => product.isDeleted)
        .sort((left, right) =>
          (right.deletedAt ?? '').localeCompare(left.deletedAt ?? ''),
        ),
    [products],
  );

  const categoriesForProducts = useMemo(
    () => Array.from(new Set([...categories.map((category) => category.name), ...activeProducts.map((product) => product.category)])),
    [activeProducts],
  );

  const counts = useMemo(() => {
    const result: Record<ProductTab, number> = {
      all: activeProducts.length,
      active: 0,
      'out-of-stock': 0,
      hidden: 0,
      scheduled: 0,
    };
    for (const product of activeProducts) {
      result[getProductStatus(product)] += 1;
    }
    return result;
  }, [activeProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = activeProducts.filter((product) => {
      const productStatus = getProductStatus(product);
      const matchesStatus =
        selectedStatus === 'all' || productStatus === selectedStatus;
      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        productSku(product).toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesCategory && matchesSearch;
    });

    return filtered.sort((left, right) => {
      switch (sortOrder) {
        case 'oldest':
          return (
            (left.createdAt ?? '').localeCompare(right.createdAt ?? '') ||
            left.id - right.id
          );
        case 'price-low':
          return left.price - right.price || left.name.localeCompare(right.name);
        case 'price-high':
          return right.price - left.price || left.name.localeCompare(right.name);
        case 'name':
          return left.name.localeCompare(right.name);
        case 'newest':
        default:
          return (
            (right.createdAt ?? '').localeCompare(left.createdAt ?? '') ||
            right.id - left.id
          );
      }
    });
  }, [activeProducts, search, selectedStatus, categoryFilter, sortOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const displayedProducts = useMemo(
    () =>
      filteredProducts.slice(
        (activePage - 1) * pageSize,
        activePage * pageSize,
      ),
    [filteredProducts, activePage, pageSize],
  );
  const eligibleDisplayedProducts = displayedProducts.filter(
    (product) => !product.scheduledDeletionAt,
  );
  const selectedIdSet = useMemo(
    () => new Set(selectedProductIds),
    [selectedProductIds],
  );
  const selectedProducts = useMemo(
    () =>
      activeProducts.filter(
        (product) =>
          selectedIdSet.has(product.id) && !product.scheduledDeletionAt,
      ),
    [activeProducts, selectedIdSet],
  );
  const allDisplayedSelected =
    eligibleDisplayedProducts.length > 0 &&
    eligibleDisplayedProducts.every((product) => selectedIdSet.has(product.id));
  const someDisplayedSelected = eligibleDisplayedProducts.some((product) =>
    selectedIdSet.has(product.id),
  );
  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(activePage - 2, pageCount - 4));
    const last = Math.min(pageCount, first + 4);
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  }, [activePage, pageCount]);

  useEffect(() => {
    if (!previewProduct) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewProduct(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [previewProduct]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setSelectedProductIds([]);
  };

  const changeStatus = (value: ProductTab) => {
    setSelectedStatus(value);
    setCurrentPage(1);
    setSelectedProductIds([]);
  };

  const changeCategory = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
    setSelectedProductIds([]);
  };

  const toggleProductSelection = (id: number, selected: boolean) => {
    setSelectedProductIds((current) =>
      selected
        ? Array.from(new Set([...current, id]))
        : current.filter((selectedId) => selectedId !== id),
    );
  };

  const toggleDisplayedSelection = (selected: boolean) => {
    const pageIds = new Set(eligibleDisplayedProducts.map((product) => product.id));
    setSelectedProductIds((current) =>
      selected
        ? Array.from(new Set([...current, ...pageIds]))
        : current.filter((id) => !pageIds.has(id)),
    );
  };

  const revokePreview = (draft: MediaDraft) => {
    if (!draft.previewUrl) return;
    URL.revokeObjectURL(draft.previewUrl);
    previewUrls.current.delete(draft.previewUrl);
  };

  const queueMediaFiles = async (
    files: FileList | File[],
    target: 'form' | 'bulk',
  ) => {
    const currentMedia = target === 'form' ? formMedia : bulkMedia;
    const existingKeys = new Set(
      currentMedia.map((media) => `${media.name.toLowerCase()}:${media.size}`),
    );
    const queued: MediaDraft[] = [];
    let duplicateCount = 0;
    for (const file of Array.from(files)) {
      const key = `${file.name.toLowerCase()}:${file.size}`;
      if (existingKeys.has(key)) {
        duplicateCount += 1;
        continue;
      }
      existingKeys.add(key);
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      queued.push({
        id: mediaId(),
        kind: file.name.toLowerCase().endsWith('.pdf')
          ? 'pdf'
          : file.name.toLowerCase().endsWith('.mp4')
            ? 'video'
            : 'image',
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        storage: 'indexeddb',
        file,
        previewUrl,
        status: 'validating',
      });
    }

    const setTargetMedia = target === 'form' ? setFormMedia : setBulkMedia;
    if (target === 'bulk' && queued.length > 0) setBulkMediaResult(null);
    setTargetMedia((current) => [...current, ...queued]);
    if (duplicateCount > 0) {
      const message = `${duplicateCount} duplicate ${duplicateCount === 1 ? 'file was' : 'files were'} skipped.`;
      if (target === 'form') setFormError(message);
      else setBulkMediaError(message);
    }

    for (const draft of queued) {
      try {
        if (!draft.file) throw new Error('The selected file is no longer available.');
        const validated = await validateMediaFile(draft.file);
        const matchedProduct =
          target === 'bulk'
            ? findProductForFilename(draft.name, assignableProducts)
            : undefined;
        setTargetMedia((current) =>
          current.map((item) =>
            item.id === draft.id
              ? {
                  ...item,
                  ...validated,
                  status: 'ready',
                  matchedProductId: matchedProduct?.id ?? null,
                  matchingMethod: matchedProduct ? 'automatic' : undefined,
                }
              : item,
          ),
        );
        if (target === 'form' && validated.kind === 'image') {
          setPrimaryImageId((current) => current ?? draft.id);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to validate this file.';
        setTargetMedia((current) =>
          current.map((item) =>
            item.id === draft.id ? { ...item, status: 'failed', error: message } : item,
          ),
        );
      }
    }
  };

  const openProductForm = (product?: Product) => {
    const references = product ? productMediaReferences(product) : [];
    setEditingId(product?.id ?? null);
    setFormValues(
      product
        ? {
            name: product.name,
            sku: productSku(product),
            category: product.category,
            price: String(product.price),
            oldPrice: product.oldPrice == null ? '' : String(product.oldPrice),
            stockQuantity: String(product.stockQuantity ?? 0),
            description: product.description ?? '',
            isNew: Boolean(product.isNew),
          }
        : emptyForm(categoriesForProducts[0] ?? ''),
    );
    setFormMedia(references.map(draftFromReference));
    setPrimaryImageId(product ? primaryMediaId(product, references) : null);
    setPrimaryConfirmationId(null);
    setProductSaving(false);
    setFormError('');
    setPageError('');
    setFormOpen(true);
  };

  const closeProductForm = (force = false) => {
    if (productSaving && !force) return;
    if (
      !force &&
      formMedia.some((media) => media.file) &&
      !window.confirm('Discard the newly selected files that have not been saved?')
    ) {
      return;
    }
    for (const media of formMedia) revokePreview(media);
    setFormOpen(false);
    setEditingId(null);
    setFormMedia([]);
    setPrimaryImageId(null);
    setPrimaryConfirmationId(null);
    setFormError('');
  };

  const removeFormMedia = (id: string) => {
    const media = formMedia.find((item) => item.id === id);
    if (!media) return;
    const nextPrimary =
      media.id === primaryImageId
        ? formMedia.find((item) => item.id !== id && item.kind === 'image' && item.status !== 'failed')
        : undefined;
    if (media.id === primaryImageId && editingId !== null && media.status === 'saved') {
      if (!nextPrimary) {
        setFormError('Keep at least one valid product image as the primary image.');
        return;
      }
      if (!window.confirm('Remove the current primary image and use another image instead?')) {
        return;
      }
    }
    revokePreview(media);
    setFormMedia((current) => current.filter((item) => item.id !== id));
    if (media.id === primaryImageId) {
      setPrimaryImageId(nextPrimary?.id ?? null);
    }
    if (previewMedia?.id === id) setPreviewMedia(null);
  };

  const choosePrimaryImage = (id: string) => {
    const selected = formMedia.find((item) => item.id === id);
    if (!selected || selected.kind !== 'image' || selected.status === 'failed') return;
    const currentPrimary = formMedia.find((item) => item.id === primaryImageId);
    if (
      editingId !== null &&
      currentPrimary?.status === 'saved' &&
      currentPrimary.id !== id
    ) {
      setPrimaryConfirmationId(id);
      return;
    }
    setPrimaryImageId(id);
    setPrimaryConfirmationId(null);
  };

  const reorderFormImages = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setFormMedia((current) => {
      const images = current.filter((item) => item.kind === 'image');
      const sourceIndex = images.findIndex((item) => item.id === sourceId);
      const targetIndex = images.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const [moved] = images.splice(sourceIndex, 1);
      images.splice(targetIndex, 0, moved);
      let imageIndex = 0;
      return current.map((item) =>
        item.kind === 'image' ? images[imageIndex++] : item,
      );
    });
  };

  const submitProductForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (productSaving) return;
    setFormError('');
    const name = formValues.name.trim();
    const sku = formValues.sku.trim();
    const category = formValues.category.trim();
    const price = Number(formValues.price);
    const oldPrice =
      formValues.oldPrice.trim() === '' ? undefined : Number(formValues.oldPrice);
    const stockQuantity = Number(formValues.stockQuantity);
    const primary = formMedia.find(
      (media) => media.id === primaryImageId && media.kind === 'image',
    );

    if (!name || !sku || !category) {
      setFormError('Complete all required product fields before saving.');
      return;
    }
    if (!primary || primary.status === 'failed') {
      setFormError('Upload and select a valid primary product image before saving.');
      return;
    }
    if (formMedia.some((media) => media.status === 'validating' || media.status === 'saving')) {
      setFormError('Wait for all selected files to finish validating or saving.');
      return;
    }
    if (formMedia.some((media) => media.status === 'failed')) {
      setFormError('Remove or correct files with validation errors before saving.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Selling price must be greater than zero.');
      return;
    }
    if (
      oldPrice !== undefined &&
      (!Number.isFinite(oldPrice) || oldPrice <= 0)
    ) {
      setFormError('Original price must be greater than zero.');
      return;
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setFormError('Stock quantity must be a non-negative whole number.');
      return;
    }
    if (
      products.some(
        (product) =>
          product.id !== editingId &&
          productSku(product).toLowerCase() === sku.toLowerCase(),
      )
    ) {
      setFormError('A product with this SKU already exists.');
      return;
    }

    const filesToSave = formMedia.filter(
      (media): media is MediaDraft & { file: File } =>
        media.status === 'ready' && media.file instanceof File,
    );
    const savedFileIds: string[] = [];
    setProductSaving(true);
    setFormMedia((current) =>
      current.map((media) =>
        filesToSave.some((file) => file.id === media.id)
          ? { ...media, status: 'saving' }
          : media,
      ),
    );

    try {
      for (const media of filesToSave) {
        await saveProductMediaFile(media.id, media.file);
        savedFileIds.push(media.id);
      }
      const mediaReferences: ProductMediaReference[] = formMedia.map((media) => ({
        id: media.id,
        kind: media.kind,
        name: media.name,
        mimeType: media.mimeType,
        size: media.size,
        storage: media.file ? 'indexeddb' : media.storage,
        ...(media.storage === 'url' ? { url: media.url } : {}),
      }));
      const selectedPrimary = mediaReferences.find(
        (media) => media.id === primary.id,
      );
      if (!selectedPrimary || selectedPrimary.kind !== 'image') {
        throw new Error('The selected primary image is invalid.');
      }
      if (selectedPrimary.storage === 'indexeddb') {
        const storedFile = await getProductMediaFile(selectedPrimary.id);
        if (!storedFile || storedFile.size === 0) {
          throw new Error('The selected primary image is not available in local storage.');
        }
      }
      const image =
        selectedPrimary.storage === 'indexeddb'
          ? productImageReference(selectedPrimary.id)
          : selectedPrimary.url;
      if (!image) throw new Error('The selected primary image has no valid source.');

      const values: NewProductInput = {
        name,
        sku,
        category,
        price,
        oldPrice: oldPrice ?? null,
        stockQuantity,
        description: formValues.description.trim(),
        image,
        media: mediaReferences,
        primaryMediaId: selectedPrimary.id,
        rating: editingId
          ? products.find((product) => product.id === editingId)?.rating ?? '0.0'
          : '0.0',
        isNew: formValues.isNew,
      };

      if (editingId === null) {
        addProduct({ ...values, isFeatured: false });
      } else {
        updateProduct(editingId, values);
      }
      setFormMedia((current) =>
        current.map((media) =>
          savedFileIds.includes(media.id)
            ? { ...media, file: undefined, previewUrl: undefined, status: 'saved' }
            : media,
        ),
      );
      closeProductForm(true);
    } catch (error) {
      if (savedFileIds.length > 0) {
        try {
          await deleteProductMediaFiles(savedFileIds);
        } catch (cleanupError) {
          console.error('Unable to remove product files after a failed save.', cleanupError);
        }
      }
      const message =
        error instanceof Error ? error.message : 'Unable to save this product.';
      setFormMedia((current) =>
        current.map((media) =>
          filesToSave.some((file) => file.id === media.id)
            ? { ...media, status: 'failed', error: message }
            : media,
        ),
      );
      setFormError(message);
    } finally {
      setProductSaving(false);
    }
  };

  const openDeletionWorkflow = (product: Product) => {
    setDeletionTarget(product);
    setDeletionStep(product.scheduledDeletionAt ? 'schedule' : 'choose');
    setScheduledDate(product.scheduledDeletionAt ?? '');
    setConfirmSoftDelete(false);
    setDeletionError('');
    setPageError('');
  };

  const closeDeletionWorkflow = () => {
    setDeletionTarget(null);
    setDeletionError('');
  };

  const confirmSchedule = () => {
    if (!deletionTarget || !scheduledDate) {
      setDeletionError('Select a future deletion date.');
      return;
    }
    if (scheduledDate <= localDateKey(new Date())) {
      setDeletionError('Choose a date after today.');
      return;
    }
    try {
      scheduleDeletion(deletionTarget.id, scheduledDate);
      closeDeletionWorkflow();
    } catch (error) {
      setDeletionError(error instanceof Error ? error.message : 'Unable to schedule deletion.');
    }
  };

  const confirmDelete = () => {
    if (!deletionTarget || !confirmSoftDelete) return;
    try {
      softDeleteProduct(deletionTarget.id);
      closeDeletionWorkflow();
    } catch (error) {
      setDeletionError(
        error instanceof Error ? error.message : 'Unable to delete this product.',
      );
    }
  };

  const restoreDeletedProduct = (product: Product) => {
    try {
      restoreProduct(product.id);
      setPageError('');
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Unable to restore this product.',
      );
    }
  };

  const openPermanentDeletionConfirmation = (product: Product) => {
    setPermanentDeletionTarget(product);
    setConfirmPermanentDeletion(false);
    setPermanentDeletionError('');
  };

  const closePermanentDeletionConfirmation = () => {
    setPermanentDeletionTarget(null);
    setConfirmPermanentDeletion(false);
    setPermanentDeletionError('');
  };

  const confirmPermanentDeletionAction = () => {
    if (!permanentDeletionTarget || !confirmPermanentDeletion) return;
    try {
      permanentlyDeleteProduct(permanentDeletionTarget.id);
      closePermanentDeletionConfirmation();
      setPageError('');
    } catch (error) {
      setPermanentDeletionError(
        error instanceof Error
          ? error.message
          : 'Unable to permanently delete this product.',
      );
    }
  };

  const changeStock = (product: Product, value: string) => {
    if (product.scheduledDeletionAt || value.trim() === '') return;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    try {
      setStockQuantity(product.id, quantity);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update stock.');
    }
  };

  const toggleVisibility = (product: Product) => {
    try {
      setProductHidden(product.id, !product.isHidden);
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update visibility.');
    }
  };

  const toggleStock = (product: Product) => {
    try {
      setStockQuantity(
        product.id,
        (product.stockQuantity ?? 0) > 0 ? 0 : 1,
      );
      setPageError('');
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Unable to update stock.');
    }
  };

  const applyBulkVisibility = () => {
    if (!bulkVisibilityAction || selectedProducts.length === 0) return;
    try {
      setProductsHidden(
        selectedProducts.map((product) => product.id),
        bulkVisibilityAction === 'hide',
      );
      setSuccessMessage(
        `${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'products'} ${bulkVisibilityAction === 'hide' ? 'hidden' : 'shown'}.`,
      );
      setPageError('');
      setSelectedProductIds([]);
      setBulkVisibilityAction(null);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Unable to update product visibility.',
      );
    }
  };

  const applyBulkStock = () => {
    if (selectedProducts.length === 0) return;
    const quantity =
      bulkStockMode === 'in-stock'
        ? 1
        : bulkStockMode === 'out-of-stock'
          ? 0
          : /^\d+$/.test(bulkStockQuantity)
            ? Number(bulkStockQuantity)
            : Number.NaN;
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
      setBulkStockError('Enter a non-negative whole-number quantity.');
      return;
    }
    try {
      setProductsStockQuantity(
        selectedProducts.map((product) => product.id),
        quantity,
      );
      setSuccessMessage(
        `Stock updated for ${selectedProducts.length} ${selectedProducts.length === 1 ? 'product' : 'products'}.`,
      );
      setPageError('');
      setSelectedProductIds([]);
      setBulkStockOpen(false);
      setBulkStockError('');
    } catch (error) {
      setBulkStockError(
        error instanceof Error ? error.message : 'Unable to update product stock.',
      );
    }
  };

  const exportCatalog = (selectedOnly: boolean) => {
    const exportProducts = selectedOnly
      ? selectedProducts
      : products.filter((product) => !product.isDeleted);
    if (exportProducts.length === 0) {
      setPageError('There are no products to export.');
      setSuccessMessage('');
      return;
    }
    try {
      downloadProductsCsv(exportProducts);
      setPageError('');
      setSuccessMessage(
        `${selectedOnly ? 'Selected products' : 'Product catalog'} exported successfully.`,
      );
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : 'Unable to export products.',
      );
      setSuccessMessage('');
    }
  };

  const removeBulkMedia = (id: string) => {
    const media = bulkMedia.find((item) => item.id === id);
    if (!media || media.status === 'saved' || media.status === 'saving') return;
    setBulkMediaResult(null);
    revokePreview(media);
    setBulkMedia((current) => current.filter((item) => item.id !== id));
    setBulkPrimarySelections((current) => {
      const next = { ...current };
      for (const [productId, selectedMediaId] of Object.entries(next)) {
        if (selectedMediaId === id) delete next[Number(productId)];
      }
      return next;
    });
    if (previewMedia?.id === id) setPreviewMedia(null);
  };

  const assignBulkMedia = (mediaId: string, productId: number | null) => {
    const product = productId === null
      ? undefined
      : assignableProducts.find((item) => item.id === productId);
    if (productId !== null && !product) return;
    setBulkMediaResult(null);
    setBulkMedia((current) =>
      current.map((media) =>
        media.id === mediaId && media.status === 'ready'
          ? {
              ...media,
              matchedProductId: product?.id ?? null,
              matchingMethod: product ? 'manual' : undefined,
            }
          : media,
      ),
    );
    setBulkPrimarySelections((current) => {
      const next = { ...current };
      for (const [selectedProductId, selectedMediaId] of Object.entries(next)) {
        if (selectedMediaId === mediaId && Number(selectedProductId) !== product?.id) {
          delete next[Number(selectedProductId)];
        }
      }
      return next;
    });
  };

  const chooseBulkPrimary = (media: MediaDraft) => {
    if (media.kind !== 'image' || media.status !== 'ready' || media.matchedProductId == null) {
      return;
    }
    const product = assignableProducts.find((item) => item.id === media.matchedProductId);
    if (!product || bulkPrimarySelections[product.id] === media.id) return;
    const references = productMediaReferences(product);
    const currentPrimaryId = primaryMediaId(product, references);
    const currentPrimary = references.find((reference) => reference.id === currentPrimaryId);
    if (
      currentPrimary &&
      !window.confirm(
        `Replace ${product.name}'s current primary image with "${media.name}"?`,
      )
    ) {
      return;
    }
    setBulkPrimarySelections((current) => ({
      ...current,
      [product.id]: media.id,
    }));
  };

  const closeBulkMedia = () => {
    if (bulkMediaSaving) return;
    if (
      !bulkMediaResult &&
      bulkMedia.some(
        (media) => media.status !== 'saved' || media.matchedProductId == null,
      ) &&
      !window.confirm('Unmatched or unsaved files will be removed from this upload session. Close anyway?')
    ) {
      return;
    }
    for (const media of bulkMedia) revokePreview(media);
    setBulkMedia([]);
    setBulkPrimarySelections({});
    setBulkMediaError('');
    setBulkMediaResult(null);
    setBulkMediaOpen(false);
  };

  const applyBulkMedia = async () => {
    if (bulkSaveLock.current || bulkMediaSaving) return;
    const unassignedCount = bulkMedia.filter(
      (media) => media.status !== 'failed' && media.matchedProductId == null,
    ).length;
    if (unassignedCount > 0) {
      setBulkMediaError(
        `${unassignedCount} unmatched ${unassignedCount === 1 ? 'file remains' : 'files remain'}. Assign or remove them before saving.`,
      );
      return;
    }
    const candidates = bulkMedia.filter(
      (media) => media.status === 'ready' && media.matchedProductId != null,
    );
    if (candidates.length === 0) {
      setBulkMediaError('There are no validated files matched to products.');
      return;
    }

    bulkSaveLock.current = true;
    setBulkMediaSaving(true);
    setBulkMediaError('');
    setBulkMediaResult(null);
    setBulkMedia((current) =>
      current.map((media) =>
        candidates.some((candidate) => candidate.id === media.id)
          ? { ...media, status: 'saving' }
          : media,
      ),
    );
    const persisted: MediaDraft[] = [];
    const failedIds = new Set(
      bulkMedia.filter((media) => media.status === 'failed').map((media) => media.id),
    );
    const failureDetails = new Map<string, { name: string; message: string }>(
      bulkMedia
        .filter((media) => media.status === 'failed')
        .map((media) => [
          media.id,
          { name: media.name, message: media.error ?? 'This file could not be saved.' },
        ]),
    );

    const markFailed = (media: MediaDraft, message: string) => {
      failedIds.add(media.id);
      failureDetails.set(media.id, { name: media.name, message });
      setBulkMedia((current) =>
        current.map((item) =>
          item.id === media.id
            ? { ...item, status: 'failed', error: message }
            : item,
        ),
      );
    };

    try {
      for (const media of candidates) {
        try {
          if (!media.file) throw new Error('The selected file is no longer available.');
          await saveProductMediaFile(media.id, media.file);
          persisted.push(media);
        } catch (error) {
          markFailed(
            media,
            error instanceof Error
              ? error.message
              : 'Unable to save this file locally.',
          );
        }
      }

      const grouped = new Map<number, MediaDraft[]>();
      for (const media of persisted) {
        const productId = media.matchedProductId;
        if (productId == null) continue;
        grouped.set(productId, [...(grouped.get(productId) ?? []), media]);
      }

      const updates: Array<{ id: number; updates: ProductUpdate }> = [];
      const additionsByProduct = new Map<number, MediaDraft[]>();
      for (const [productId, files] of grouped) {
        const product = assignableProducts.find((item) => item.id === productId);
        if (!product) {
          files.forEach((media) =>
            markFailed(media, 'The matched product is no longer available.'),
          );
          continue;
        }

        const references = productMediaReferences(product);
        const knownFiles = new Set(
          references.map((reference) => `${reference.name.toLowerCase()}:${reference.size}`),
        );
        const additions = files.filter((media) => {
          const key = `${media.name.toLowerCase()}:${media.size}`;
          if (knownFiles.has(key)) {
            markFailed(media, 'This file is already associated with the product.');
            return false;
          }
          knownFiles.add(key);
          return true;
        });
        if (additions.length === 0) continue;

        const currentPrimaryId = primaryMediaId(product, references);
        const newPrimary = additions.find(
          (media) =>
            media.id === bulkPrimarySelections[productId] &&
            media.kind === 'image',
        );
        updates.push({
          id: productId,
          updates: {
            media: [
              ...references,
              ...additions.map((media): ProductMediaReference => ({
                id: media.id,
                kind: media.kind,
                name: media.name,
                mimeType: media.mimeType,
                size: media.size,
                storage: 'indexeddb',
              })),
            ],
            ...(newPrimary
              ? {
                  primaryMediaId: newPrimary.id,
                  image: productImageReference(newPrimary.id),
                }
              : currentPrimaryId
                ? { primaryMediaId: currentPrimaryId }
                : {}),
          },
        });
        additionsByProduct.set(productId, additions);
      }

      let productsUpdated = 0;
      let savedCount = 0;
      if (updates.length > 0) {
        try {
          importProducts({ additions: [], updates });
          productsUpdated = updates.length;
          for (const additions of additionsByProduct.values()) {
            savedCount += additions.length;
            for (const media of additions) {
              revokePreview(media);
              setBulkMedia((current) =>
                current.map((item) =>
                  item.id === media.id
                    ? {
                        ...item,
                        file: undefined,
                        previewUrl: undefined,
                        status: 'saved',
                        error: undefined,
                      }
                    : item,
                ),
              );
            }
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to update the product catalog.';
          for (const additions of additionsByProduct.values()) {
            additions.forEach((media) => markFailed(media, message));
          }
        }
      }

      for (const media of persisted) {
        if (failedIds.has(media.id)) {
          try {
            await deleteProductMediaFiles([media.id]);
          } catch (error) {
            console.error('Unable to remove an unassociated bulk media file.', error);
          }
        }
      }

      setBulkMediaResult({
        totalSelected: bulkMedia.length,
        assigned: savedCount,
        saved: savedCount,
        productsUpdated,
        failed: failedIds.size,
        unmatched: unassignedCount,
        errors: Array.from(failureDetails.values()),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to complete the media upload.';
      console.error('Unable to complete the bulk media upload.', error);
      setBulkMediaError(message);
    } finally {
      bulkSaveLock.current = false;
      setBulkMediaSaving(false);
    }
  };

  const formImages = formMedia.filter((media) => media.kind === 'image');
  const formDocuments = formMedia.filter((media) => media.kind === 'pdf');
  const formVideos = formMedia.filter((media) => media.kind === 'video');
  const bulkMatchedMedia = bulkMedia.filter(
    (media) => media.matchedProductId != null,
  );
  const bulkUnmatchedMedia = bulkMedia.filter(
    (media) => media.matchedProductId == null && media.status !== 'failed',
  );
  const bulkFailedMedia = bulkMedia.filter((media) => media.status === 'failed');
  const automaticMatchCount = bulkMedia.filter(
    (media) => media.matchingMethod === 'automatic' && media.matchedProductId != null,
  ).length;
  const manualAssignmentCount = bulkMedia.filter(
    (media) => media.matchingMethod === 'manual' && media.matchedProductId != null,
  ).length;

  return (
    <section className="admin-products-page">
      <header className="products-page-heading">
        <div>
          <span className="products-eyebrow">ADMIN STUDIO</span>
          <h1>Products</h1>
          <p>Manage your Silver Hub product catalog.</p>
        </div>
        <div className="products-heading-actions">
          <span className="products-total">{activeProducts.length} products</span>
          <button
            type="button"
            className="products-secondary-button"
            onClick={() => exportCatalog(false)}
          >
            <Download size={16} /> Export CSV
          </button>
          <ProductCsvImport products={products} importProducts={importProducts} />
          <button
            type="button"
            className="products-secondary-button"
            onClick={() => {
              setBulkMediaError('');
              setBulkMediaResult(null);
              setBulkMediaOpen(true);
            }}
          >
            <Upload size={16} /> Bulk Media
          </button>
          <button type="button" className="products-primary-button" onClick={() => openProductForm()}>
            <Plus size={17} /> Add Product
          </button>
        </div>
      </header>

      {storageError && <p className="products-alert" role="alert">{storageError}</p>}
      {pageError && <p className="products-alert" role="alert">{pageError}</p>}
      {successMessage && <p className="products-success" role="status">{successMessage}</p>}

      <div className="products-tabs" role="tablist" aria-label="Product status">
        {(Object.keys(tabLabels) as ProductTab[]).map((key) => (
          <button
            type="button"
            role="tab"
            aria-selected={selectedStatus === key}
            className={selectedStatus === key ? 'selected' : ''}
            key={key}
            onClick={() => changeStatus(key)}
          >
            {tabLabels[key]} <span>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="products-toolbar">
        <label className="products-search">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search name, SKU or category"
            aria-label="Search products by name, SKU or category"
          />
        </label>

        <label className="products-select">
          <span>Category</span>
          <select value={categoryFilter} onChange={(event) => changeCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categoriesForProducts.map((category) => (
              <option value={category} key={category}>{category}</option>
            ))}
          </select>
        </label>

        <label className="products-select">
          <span>Status</span>
          <select
            value={selectedStatus}
            onChange={(event) => changeStatus(event.target.value as ProductTab)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="hidden">Hidden</option>
            <option value="scheduled">Scheduled Deletion</option>
          </select>
        </label>

        <label className="products-select products-sort">
          <span>Sort by</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-low">Lowest price</option>
            <option value="price-high">Highest price</option>
            <option value="name">Alphabetical</option>
          </select>
        </label>

        <div className="products-view-toggle" aria-label="Product layout">
          <button
            type="button"
            className={viewMode === 'table' ? 'selected' : ''}
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
            onClick={() => setViewMode('table')}
          >
            <List size={18} />
          </button>
          <button
            type="button"
            className={viewMode === 'grid' ? 'selected' : ''}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <div className="products-bulk-toolbar" role="region" aria-label="Bulk product actions">
          <strong>{selectedProducts.length} {selectedProducts.length === 1 ? 'product' : 'products'} selected</strong>
          <div className="products-bulk-actions">
            <button type="button" className="products-secondary-button" onClick={() => setBulkVisibilityAction('hide')}>
              <EyeOff size={15} /> Hide
            </button>
            <button type="button" className="products-secondary-button" onClick={() => setBulkVisibilityAction('show')}>
              <Eye size={15} /> Show
            </button>
            <button
              type="button"
              className="products-secondary-button"
              onClick={() => {
                setBulkStockMode('in-stock');
                setBulkStockQuantity('');
                setBulkStockError('');
                setBulkStockOpen(true);
              }}
            >
              <Package size={15} /> Update Stock
            </button>
            <button type="button" className="products-secondary-button" onClick={() => exportCatalog(true)}>
              <Download size={15} /> Export Selected
            </button>
            <button type="button" className="products-bulk-clear" onClick={() => setSelectedProductIds([])}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="products-empty-state">
          <Package size={28} />
          <h2>No products found</h2>
          <p>Try changing your search or filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="products-table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th scope="col" className="products-checkbox-column">
                  <input
                    type="checkbox"
                    checked={allDisplayedSelected}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate =
                          someDisplayedSelected && !allDisplayedSelected;
                      }
                    }}
                    aria-checked={
                      someDisplayedSelected && !allDisplayedSelected
                        ? 'mixed'
                        : allDisplayedSelected
                    }
                    aria-label={`Select all ${eligibleDisplayedProducts.length} selectable products on this page`}
                    disabled={eligibleDisplayedProducts.length === 0}
                    onChange={(event) =>
                      toggleDisplayedSelection(event.target.checked)
                    }
                  />
                </th>
                <th scope="col">Product</th>
                <th scope="col">SKU</th>
                <th scope="col">Category</th>
                <th scope="col">Selling price</th>
                <th scope="col">Stock quantity</th>
                <th scope="col">Stock status</th>
                <th scope="col">Visibility</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((product) => {
                const status = getProductStatus(product);
                const stock = product.stockQuantity ?? 0;
                return (
                  <tr key={product.id}>
                    <td className="products-checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedIdSet.has(product.id)}
                        aria-label={`Select ${product.name}`}
                        disabled={Boolean(product.scheduledDeletionAt)}
                        onChange={(event) =>
                          toggleProductSelection(
                            product.id,
                            event.target.checked,
                          )
                        }
                      />
                    </td>
                    <td>
                      <div className="products-product-cell">
                        <button
                          type="button"
                          className="products-thumbnail-trigger"
                          aria-label={`Preview image for ${product.name}, SKU ${productSku(product)}`}
                          onClick={() => setPreviewProduct(product)}
                        >
                          <ProductThumbnail product={product} />
                        </button>
                        <div>
                          <strong>{product.name}</strong>
                          {product.isNew && <small className="products-new-label">New arrival</small>}
                        </div>
                      </div>
                    </td>
                    <td>{productSku(product)}</td>
                    <td>{product.category}</td>
                    <td>₹{product.price.toLocaleString('en-IN')}</td>
                    <td>
                      <input
                        className="products-stock-input"
                        type="number"
                        min="0"
                        step="1"
                        defaultValue={stock}
                        key={`${product.id}-${stock}`}
                        aria-label={`Stock quantity for ${product.name}`}
                        disabled={Boolean(product.scheduledDeletionAt)}
                        onBlur={(event) => changeStock(product, event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                      />
                    </td>
                    <td>
                      <span className={`products-badge stock-${stock === 0 ? 'empty' : 'available'}`}>
                        {stock === 0 ? 'Out of stock' : `${stock} in stock`}
                      </span>
                    </td>
                    <td>
                      <span className={`products-badge visibility-${status}`}>
                        {status === 'scheduled'
                          ? 'Deletion scheduled'
                          : status === 'hidden'
                            ? 'Hidden'
                            : product.isHidden
                              ? 'Hidden'
                              : 'Visible'}
                      </span>
                    </td>
                    <td>
                      <ProductActions
                        product={product}
                        onEdit={() => openProductForm(product)}
                        onToggleVisibility={() => toggleVisibility(product)}
                        onToggleStock={() => toggleStock(product)}
                        onDelete={() => openDeletionWorkflow(product)}
                        onCancelSchedule={() => cancelScheduledDeletion(product.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="products-grid">
          {displayedProducts.map((product) => {
            const status = getProductStatus(product);
            return (
              <article className="products-grid-card" key={product.id}>
                <div className="products-grid-image">
                  <button
                    type="button"
                    className="products-thumbnail-trigger"
                    aria-label={`Preview image for ${product.name}, SKU ${productSku(product)}`}
                    onClick={() => setPreviewProduct(product)}
                  >
                    <ProductThumbnail product={product} />
                  </button>
                  <label className="products-grid-select">
                    <input
                      type="checkbox"
                      checked={selectedIdSet.has(product.id)}
                      aria-label={`Select ${product.name}`}
                      disabled={Boolean(product.scheduledDeletionAt)}
                      onChange={(event) =>
                        toggleProductSelection(product.id, event.target.checked)
                      }
                    />
                    <span className="products-visually-hidden">Select product</span>
                  </label>
                  <span className={`products-badge visibility-${status}`}>
                    {status === 'scheduled'
                      ? 'Deletion scheduled'
                      : status === 'hidden'
                        ? 'Hidden'
                        : status === 'out-of-stock'
                          ? 'Out of stock'
                          : 'Active'}
                  </span>
                </div>
                <div className="products-grid-card-body">
                  <span>{product.category} · {productSku(product)}</span>
                  <h2>{product.name}</h2>
                  <div className="products-grid-meta">
                    <strong>₹{product.price.toLocaleString('en-IN')}</strong>
                    <span>{product.stockQuantity ?? 0} in stock</span>
                  </div>
                  {product.scheduledDeletionAt && (
                    <p className="products-scheduled-date">
                      Deletion on {formatLocalDate(product.scheduledDeletionAt)}
                    </p>
                  )}
                  <ProductActions
                    product={product}
                    onEdit={() => openProductForm(product)}
                    onToggleVisibility={() => toggleVisibility(product)}
                    onToggleStock={() => toggleStock(product)}
                    onDelete={() => openDeletionWorkflow(product)}
                    onCancelSchedule={() => cancelScheduledDeletion(product.id)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="products-pagination">
        <p>
          Showing{' '}
          {filteredProducts.length === 0
            ? 0
            : (activePage - 1) * pageSize + 1}
          –{Math.min(activePage * pageSize, filteredProducts.length)} of{' '}
          {filteredProducts.length} products
        </p>
        <label className="products-page-size">
          Products per page
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setCurrentPage(1);
            }}
          >
            {[10, 20, 50].map((size) => (
              <option value={size} key={size}>{size}</option>
            ))}
          </select>
        </label>
        <nav className="products-page-controls" aria-label="Product pagination">
          <span className="products-page-indicator">Page {activePage} of {pageCount}</span>
          <button
            type="button"
            className="products-page-arrow"
            aria-label="Previous page"
            disabled={activePage === 1}
            onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
          >
            <ChevronLeft size={17} /> Previous
          </button>
          {pageNumbers.map((page) => (
            <button
              type="button"
              key={page}
              className={page === activePage ? 'current' : ''}
              aria-label={`Page ${page}`}
              aria-current={page === activePage ? 'page' : undefined}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="products-page-arrow"
            aria-label="Next page"
            disabled={activePage === pageCount || filteredProducts.length === 0}
            onClick={() => setCurrentPage(Math.min(pageCount, activePage + 1))}
          >
            Next <ChevronRight size={17} />
          </button>
        </nav>
      </div>

      <section className="products-trash-section" aria-labelledby="recently-deleted-heading">
        <header className="products-trash-heading">
          <div>
            <span className="products-eyebrow">PRODUCT HISTORY</span>
            <h2 id="recently-deleted-heading">Recently Deleted</h2>
            <p>Restore removed products or permanently delete their records.</p>
          </div>
          <span className="products-total">
            {recentlyDeleted.length} {recentlyDeleted.length === 1 ? 'product' : 'products'}
          </span>
        </header>

        {recentlyDeleted.length === 0 ? (
          <p className="products-trash-empty">Deleted products will appear here.</p>
        ) : (
          <div className="products-trash-grid">
            {recentlyDeleted.map((product) => (
              <article className="products-trash-card" key={product.id}>
                <div className="products-trash-image">
                  <ProductThumbnail product={product} />
                </div>
                <div className="products-trash-card-body">
                  <h3>{product.name}</h3>
                  <span className="products-trash-sku">{productSku(product)}</span>
                  <p>Deleted {formatDeletedAt(product.deletedAt)}</p>
                  <div className="products-trash-actions">
                    <button
                      type="button"
                      className="products-secondary-button"
                      onClick={() => restoreDeletedProduct(product)}
                    >
                      <RotateCcw size={15} /> Restore
                    </button>
                    <button
                      type="button"
                      className="products-danger-button"
                      onClick={() => openPermanentDeletionConfirmation(product)}
                    >
                      <Trash2 size={15} /> Permanently Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <div className="products-modal-backdrop" onMouseDown={() => closeProductForm()}>
          <section
            className="products-modal products-form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PRODUCT CATALOG</span>
                <h2 id="product-form-title">{editingId === null ? 'Add Product' : 'Edit Product'}</h2>
              </div>
              <button type="button" className="products-icon-button" aria-label="Close form" onClick={() => closeProductForm()} disabled={productSaving}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={submitProductForm}>
              <div className="products-form-grid">
                <label>
                  Product name *
                  <input value={formValues.name} onChange={(event) => setFormValues({ ...formValues, name: event.target.value })} required />
                </label>
                <label>
                  SKU *
                  <input value={formValues.sku} onChange={(event) => setFormValues({ ...formValues, sku: event.target.value })} required />
                </label>
                <label>
                  Category *
                  <select value={formValues.category} onChange={(event) => setFormValues({ ...formValues, category: event.target.value })} required>
                    {categoriesForProducts.map((category) => <option value={category} key={category}>{category}</option>)}
                  </select>
                </label>
                <label>
                  Selling price (₹) *
                  <input type="number" min="0.01" step="0.01" value={formValues.price} onChange={(event) => setFormValues({ ...formValues, price: event.target.value })} required />
                </label>
                <label>
                  Original price (₹)
                  <input type="number" min="0.01" step="0.01" value={formValues.oldPrice} onChange={(event) => setFormValues({ ...formValues, oldPrice: event.target.value })} />
                </label>
                <label>
                  Stock quantity *
                  <input type="number" min="0" step="1" value={formValues.stockQuantity} onChange={(event) => setFormValues({ ...formValues, stockQuantity: event.target.value })} required />
                </label>
                <section className="products-media-manager products-form-wide" aria-labelledby="product-media-heading">
                  <div className="products-media-heading">
                    <div>
                      <h3 id="product-media-heading">Product media</h3>
                      <p>Upload product photography and supporting PDF documents.</p>
                    </div>
                    <span className="products-media-limit">Images ≤ 10 MB · PDFs ≤ 20 MB</span>
                  </div>
                  <div
                    className={`products-media-dropzone ${formDropActive ? 'is-active' : ''}`}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setFormDropActive(true);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                        setFormDropActive(false);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setFormDropActive(false);
                      void queueMediaFiles(event.dataTransfer.files, 'form');
                    }}
                  >
                    <ImagePlus size={27} />
                    <strong>Drop images, videos, or PDFs here</strong>
                    <span>JPG, JPEG, PNG, PDF, and MP4 (up to 100 MB) · Files are validated</span>
                    <label className="products-media-browse">
                      <Upload size={15} /> Browse Files
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.mp4,image/jpeg,image/png,application/pdf,video/mp4"
                        multiple
                        onChange={(event) => {
                          if (event.target.files) void queueMediaFiles(event.target.files, 'form');
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {primaryConfirmationId && (
                    <div className="products-primary-confirmation" role="status">
                      <span>Replace the current primary product image with this upload?</span>
                      <button
                        type="button"
                        className="products-primary-button"
                        onClick={() => {
                          setPrimaryImageId(primaryConfirmationId);
                          setPrimaryConfirmationId(null);
                        }}
                      >
                        Confirm replacement
                      </button>
                      <button
                        type="button"
                        className="products-secondary-button"
                        onClick={() => setPrimaryConfirmationId(null)}
                      >
                        Keep current image
                      </button>
                    </div>
                  )}
                  {formImages.length > 0 ? (
                    <div className="products-media-grid" aria-label="Product image gallery">
                      {formImages.map((media, index) => (
                        <ProductMediaCard
                          key={media.id}
                          media={media}
                          isPrimary={media.id === primaryImageId}
                          onSetPrimary={() => choosePrimaryImage(media.id)}
                          onRemove={() => removeFormMedia(media.id)}
                          onPreview={() => setPreviewMedia(media)}
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', media.id);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            reorderFormImages(event.dataTransfer.getData('text/plain'), media.id);
                          }}
                          canMoveUp={index > 0}
                          canMoveDown={index < formImages.length - 1}
                          onMoveUp={() => {
                            if (index > 0) reorderFormImages(media.id, formImages[index - 1].id);
                          }}
                          onMoveDown={() => {
                            if (index < formImages.length - 1) reorderFormImages(media.id, formImages[index + 1].id);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="products-media-empty">Add at least one product image and select a primary image.</p>
                  )}
                  {formDocuments.length > 0 && (
                    <div className="products-media-document-list" aria-label="Product documents">
                      <h4>Supporting documents</h4>
                      {formDocuments.map((media) => (
                        <ProductMediaCard
                          key={media.id}
                          media={media}
                          isPrimary={false}
                          onSetPrimary={() => undefined}
                          onRemove={() => removeFormMedia(media.id)}
                          onPreview={() => setPreviewMedia(media)}
                          onDragStart={(event) => event.preventDefault()}
                          onDrop={(event) => event.preventDefault()}
                          canMoveUp={false}
                          canMoveDown={false}
                          onMoveUp={() => undefined}
                          onMoveDown={() => undefined}
                        />
                      ))}
                    </div>
                  )}
                  {formVideos.length > 0 && (
                    <div className="products-media-document-list" aria-label="Product showcase videos">
                      <h4>Showcase videos</h4>
                      {formVideos.map((media) => (
                        <ProductMediaCard
                          key={media.id}
                          media={media}
                          isPrimary={false}
                          onSetPrimary={() => undefined}
                          onRemove={() => removeFormMedia(media.id)}
                          onPreview={() => setPreviewMedia(media)}
                          onDragStart={(event) => event.preventDefault()}
                          onDrop={(event) => event.preventDefault()}
                          canMoveUp={false}
                          canMoveDown={false}
                          onMoveUp={() => undefined}
                          onMoveDown={() => undefined}
                        />
                      ))}
                    </div>
                  )}
                </section>
                <label className="products-form-wide">
                  Description
                  <textarea rows={3} value={formValues.description} onChange={(event) => setFormValues({ ...formValues, description: event.target.value })} />
                </label>
                <label className="products-checkbox products-form-wide">
                  <input type="checkbox" checked={formValues.isNew} onChange={(event) => setFormValues({ ...formValues, isNew: event.target.checked })} />
                  Show in New Arrivals
                </label>
              </div>
              {formError && <p className="products-form-error" role="alert">{formError}</p>}
              <footer className="products-modal-actions">
                <button type="button" className="products-secondary-button" onClick={() => closeProductForm()} disabled={productSaving}>Cancel</button>
                <button type="submit" className="products-primary-button" disabled={productSaving}>
                  <Check size={16} /> {productSaving ? 'Saving Product…' : 'Save Product'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {bulkMediaOpen && (
        <div className="products-modal-backdrop" onMouseDown={closeBulkMedia}>
          <section
            className="products-modal products-bulk-media-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-media-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PRODUCT CATALOG</span>
                <h2 id="bulk-media-title">Bulk Media Upload</h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close bulk media upload"
                onClick={closeBulkMedia}
                disabled={bulkMediaSaving}
              >
                <X size={20} />
              </button>
            </header>
            <p className="products-bulk-media-note">
              Files are matched to active products when a SKU appears as a distinct filename token
              (for example, <strong>SH-0001-front.jpg</strong>). Existing primary images stay in
              place unless you select a new one and confirm replacement.
            </p>
            <div
              className={`products-media-dropzone ${bulkDropActive ? 'is-active' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setBulkDropActive(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setBulkDropActive(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setBulkDropActive(false);
                void queueMediaFiles(event.dataTransfer.files, 'bulk');
              }}
            >
              <Upload size={27} />
              <strong>Drop a batch of product files here</strong>
              <span>JPG/JPEG/PNG up to 10 MB · PDFs up to 20 MB · MP4 videos up to 100 MB</span>
              <label className="products-media-browse">
                <Upload size={15} /> Browse Files
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.mp4,image/jpeg,image/png,application/pdf,video/mp4"
                  multiple
                  disabled={bulkMediaSaving}
                  onChange={(event) => {
                    if (event.target.files) void queueMediaFiles(event.target.files, 'bulk');
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
            {bulkMediaError && <p className="products-form-error" role="alert">{bulkMediaError}</p>}

            <section className="products-bulk-summary" aria-label="Upload summary">
              <h3>Before saving</h3>
              <dl>
                <div><dt>Total selected files</dt><dd>{bulkMedia.length}</dd></div>
                <div><dt>Automatically matched</dt><dd>{automaticMatchCount}</dd></div>
                <div><dt>Manually assigned</dt><dd>{manualAssignmentCount}</dd></div>
                <div><dt>Unmatched</dt><dd>{bulkUnmatchedMedia.length}</dd></div>
                <div><dt>Invalid files</dt><dd>{bulkFailedMedia.length}</dd></div>
              </dl>
              {bulkUnmatchedMedia.length > 0 && (
                <p role="status">
                  Assign or remove every unmatched file before saving. Invalid files are not saved.
                </p>
              )}
            </section>

            {bulkMediaResult && (
              <section
                className={`products-bulk-result${bulkMediaResult.failed > 0 ? ' has-errors' : ''}`}
                aria-label="Bulk media save results"
                role="status"
              >
                <h3>
                  {bulkMediaResult.saved === 0
                    ? 'No files were saved'
                    : bulkMediaResult.failed > 0
                      ? 'Upload partially complete'
                      : 'Upload complete'}
                </h3>
                <dl>
                  <div><dt>Total files selected</dt><dd>{bulkMediaResult.totalSelected}</dd></div>
                  <div><dt>Successfully assigned</dt><dd>{bulkMediaResult.assigned}</dd></div>
                  <div><dt>Images and files saved</dt><dd>{bulkMediaResult.saved}</dd></div>
                  <div><dt>Products updated</dt><dd>{bulkMediaResult.productsUpdated}</dd></div>
                  <div><dt>Failed files</dt><dd>{bulkMediaResult.failed}</dd></div>
                  <div><dt>Unmatched files</dt><dd>{bulkMediaResult.unmatched}</dd></div>
                </dl>
                {bulkMediaResult.errors.length > 0 && (
                  <div className="products-bulk-result-errors">
                    <strong>Files requiring attention</strong>
                    <ul>
                      {bulkMediaResult.errors.map((error) => (
                        <li key={`${error.name}:${error.message}`}>
                          <strong>{error.name}:</strong> {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <section className="products-bulk-media-group" aria-labelledby="matched-media-heading">
              <div className="products-media-list-heading">
                <h3 id="matched-media-heading">Matched Product Files</h3>
                <span>{bulkMatchedMedia.filter((media) => media.status !== 'failed').length}</span>
              </div>
              {bulkMatchedMedia.filter((media) => media.status !== 'failed').length === 0 ? (
                <p className="products-media-empty">Validated files matched by SKU will appear here.</p>
              ) : (
                <div className="products-media-grid products-bulk-media-grid">
                  {bulkMatchedMedia.filter((media) => media.status !== 'failed').map((media) => {
                    const matchedProduct = assignableProducts.find((product) => product.id === media.matchedProductId);
                    const matchStatus = media.matchingMethod === 'manual'
                      ? 'Manually assigned'
                      : 'Automatically matched';
                    return (
                      <ProductMediaCard
                        key={media.id}
                        media={media}
                        isPrimary={Boolean(matchedProduct && bulkPrimarySelections[matchedProduct.id] === media.id)}
                        matchLabel={matchedProduct
                          ? `${matchStatus} · ${matchedProduct.name} · SKU ${productSku(matchedProduct)}`
                          : 'Matched product unavailable'}
                        onSetPrimary={() => chooseBulkPrimary(media)}
                        onRemove={() => removeBulkMedia(media.id)}
                        onPreview={() => setPreviewMedia(media)}
                        onDragStart={(event) => event.preventDefault()}
                        onDrop={(event) => event.preventDefault()}
                        canMoveUp={false}
                        canMoveDown={false}
                        onMoveUp={() => undefined}
                        onMoveDown={() => undefined}
                        productOptions={assignableProducts}
                        assignedProductId={media.matchedProductId}
                        onAssignProduct={(productId) => assignBulkMedia(media.id, productId)}
                        allowRemoval={media.status !== 'saved'}
                        allowReorder={false}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            <section className="products-bulk-media-group" aria-labelledby="unmatched-media-heading">
              <div className="products-media-list-heading">
                <h3 id="unmatched-media-heading">Unmatched Files</h3>
                <span>{bulkUnmatchedMedia.length}</span>
              </div>
              {bulkUnmatchedMedia.length === 0 ? (
                <p className="products-media-empty">Files without a matching product SKU can be assigned here.</p>
              ) : (
                <div className="products-media-grid products-bulk-media-grid">
                  {bulkUnmatchedMedia.map((media) => (
                    <ProductMediaCard
                      key={media.id}
                      media={media}
                      isPrimary={false}
                      matchLabel={media.status === 'validating' ? 'Checking for product SKU…' : 'Unmatched · no product selected'}
                      onSetPrimary={() => undefined}
                      onRemove={() => removeBulkMedia(media.id)}
                      onPreview={() => setPreviewMedia(media)}
                      onDragStart={(event) => event.preventDefault()}
                      onDrop={(event) => event.preventDefault()}
                      canMoveUp={false}
                      canMoveDown={false}
                      onMoveUp={() => undefined}
                      onMoveDown={() => undefined}
                      productOptions={assignableProducts}
                      assignedProductId={null}
                      onAssignProduct={(productId) => assignBulkMedia(media.id, productId)}
                      allowReorder={false}
                      allowSetPrimary={false}
                    />
                  ))}
                </div>
              )}
            </section>

            {bulkFailedMedia.length > 0 && (
              <section className="products-bulk-media-group" aria-labelledby="failed-media-heading">
                <div className="products-media-list-heading is-error">
                  <h3 id="failed-media-heading">Failed Files</h3>
                  <span>{bulkFailedMedia.length}</span>
                </div>
                <div className="products-media-grid products-bulk-media-grid">
                  {bulkFailedMedia.map((media) => (
                    <ProductMediaCard
                      key={media.id}
                      media={media}
                      isPrimary={false}
                      onSetPrimary={() => undefined}
                      onRemove={() => removeBulkMedia(media.id)}
                      onPreview={() => setPreviewMedia(media)}
                      onDragStart={(event) => event.preventDefault()}
                      onDrop={(event) => event.preventDefault()}
                      canMoveUp={false}
                      canMoveDown={false}
                      onMoveUp={() => undefined}
                      onMoveDown={() => undefined}
                      allowReorder={false}
                      allowSetPrimary={false}
                    />
                  ))}
                </div>
              </section>
            )}

            <footer className="products-modal-actions">
              <button type="button" className="products-secondary-button" onClick={closeBulkMedia} disabled={bulkMediaSaving}>
                {bulkMediaResult ? 'Done' : 'Close'}
              </button>
              <button
                type="button"
                className="products-primary-button"
                onClick={() => void applyBulkMedia()}
                disabled={
                  bulkMediaSaving ||
                  bulkUnmatchedMedia.length > 0 ||
                  bulkMedia.some((media) => media.status === 'validating') ||
                  !bulkMedia.some((media) => media.status === 'ready' && media.matchedProductId != null)
                }
              >
                <Upload size={15} /> {bulkMediaSaving ? 'Saving files…' : 'Save Assigned Files'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {previewMedia && (
        <div className="products-modal-backdrop products-media-preview-backdrop" onMouseDown={() => setPreviewMedia(null)}>
          <section
            className="products-modal products-media-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-preview-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">MEDIA PREVIEW</span>
                <h2 id="media-preview-title">{previewMedia.name}</h2>
              </div>
              <button type="button" className="products-icon-button" aria-label="Close media preview" onClick={() => setPreviewMedia(null)}>
                <X size={20} />
              </button>
            </header>
            <div className="products-media-preview-content">
              {previewMediaUrl && previewMedia.kind === 'image' ? (
                <img src={previewMediaUrl} alt={previewMedia.name} />
              ) : previewMediaUrl && previewMedia.kind === 'video' ? (
                <video
                  src={previewMediaUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  aria-label={`Video preview: ${previewMedia.name}`}
                />
              ) : previewMediaUrl && previewMedia.kind === 'pdf' ? (
                <object data={previewMediaUrl} type="application/pdf" aria-label={`PDF preview: ${previewMedia.name}`}>
                  <a href={previewMediaUrl} target="_blank" rel="noreferrer">Open PDF in a new tab</a>
                </object>
              ) : (
                <p role="status">Loading local preview…</p>
              )}
            </div>
            <p className="products-media-preview-meta">{formatFileSize(previewMedia.size)} · {previewMedia.status === 'saved' ? 'Saved locally' : 'Pending save'}</p>
          </section>
        </div>
      )}

      {deletionTarget && (
        <div className="products-modal-backdrop" onMouseDown={closeDeletionWorkflow}>
          <section
            className="products-modal products-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PRODUCT REMOVAL</span>
                <h2 id="product-delete-title">
                  {deletionTarget.scheduledDeletionAt ? 'Manage scheduled deletion' : 'Delete product'}
                </h2>
              </div>
              <button type="button" className="products-icon-button" aria-label="Close deletion options" onClick={closeDeletionWorkflow}>
                <X size={20} />
              </button>
            </header>

            <p className="products-delete-product-name">{deletionTarget.name}</p>

            {deletionStep === 'choose' && (
              <div className="products-delete-options">
                <button type="button" onClick={() => setDeletionStep('confirm')}>
                  <Trash2 size={20} />
                  <span><strong>Move to Recently Deleted</strong><small>Hide it from the catalog now and restore it later if needed.</small></span>
                </button>
                <button type="button" onClick={() => setDeletionStep('schedule')}>
                  <CalendarDays size={20} />
                  <span><strong>Schedule deletion</strong><small>Choose any future date. The product is hidden immediately.</small></span>
                </button>
              </div>
            )}

            {deletionStep === 'confirm' && (
              <div className="products-delete-confirm">
                <p>
                  Move <strong>{deletionTarget.name}</strong> to Recently Deleted?
                  It will disappear from customer pages and can be restored later.
                </p>
                <label className="products-checkbox">
                  <input type="checkbox" checked={confirmSoftDelete} onChange={(event) => setConfirmSoftDelete(event.target.checked)} />
                  I understand this product will be removed from the active catalog.
                </label>
                {deletionError && <p className="products-form-error" role="alert">{deletionError}</p>}
                <footer className="products-modal-actions">
                  <button type="button" className="products-secondary-button" onClick={() => setDeletionStep('choose')}>Back</button>
                  <button type="button" className="products-danger-button" disabled={!confirmSoftDelete} onClick={confirmDelete}>
                    <Trash2 size={16} /> Move to Recently Deleted
                  </button>
                </footer>
              </div>
            )}

            {deletionStep === 'schedule' && (
              <div className="products-schedule-form">
                <p>
                  {deletionTarget.scheduledDeletionAt
                    ? `Currently scheduled for ${formatLocalDate(deletionTarget.scheduledDeletionAt)}.`
                    : 'This product will be hidden from customers until deletion is processed.'}
                </p>
                <label>
                  <span><CalendarDays size={16} /> Deletion date</span>
                  <input
                    type="date"
                    min={tomorrowDateKey()}
                    value={scheduledDate}
                    onChange={(event) => setScheduledDate(event.target.value)}
                  />
                </label>
                {scheduledDate && (
                  <p className="products-schedule-preview">
                    Scheduled deletion: <strong>{formatLocalDate(scheduledDate)}</strong>
                  </p>
                )}
                {deletionError && <p className="products-form-error" role="alert">{deletionError}</p>}
                <footer className="products-modal-actions">
                  {deletionTarget.scheduledDeletionAt && (
                    <button
                      type="button"
                      className="products-secondary-button"
                      onClick={() => {
                        setConfirmSoftDelete(false);
                        setDeletionStep('confirm');
                      }}
                    >
                      <Trash2 size={15} /> Delete now
                    </button>
                  )}
                  {deletionTarget.scheduledDeletionAt && (
                    <button
                      type="button"
                      className="products-secondary-button products-cancel-schedule"
                      onClick={() => {
                        cancelScheduledDeletion(deletionTarget.id);
                        closeDeletionWorkflow();
                      }}
                    >
                      <RotateCcw size={15} /> Cancel schedule
                    </button>
                  )}
                  <button type="button" className="products-secondary-button" onClick={closeDeletionWorkflow}>Cancel</button>
                  <button type="button" className="products-primary-button" onClick={confirmSchedule}>
                    <Clock3 size={16} /> {deletionTarget.scheduledDeletionAt ? 'Update date' : 'Confirm schedule'}
                  </button>
                </footer>
              </div>
            )}
          </section>
        </div>
      )}

      {permanentDeletionTarget && (
        <div
          className="products-modal-backdrop"
          onMouseDown={closePermanentDeletionConfirmation}
        >
          <section
            className="products-modal products-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permanent-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">PERMANENT REMOVAL</span>
                <h2 id="permanent-delete-title">Permanently delete product?</h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close permanent deletion confirmation"
                onClick={closePermanentDeletionConfirmation}
              >
                <X size={20} />
              </button>
            </header>

            <p className="products-delete-product-name">
              {permanentDeletionTarget.name}
            </p>
            <p className="products-permanent-delete-warning">
              This permanently removes the product record from this browser's
              local product catalog. It cannot be restored.
            </p>
            <label className="products-checkbox">
              <input
                type="checkbox"
                checked={confirmPermanentDeletion}
                onChange={(event) =>
                  setConfirmPermanentDeletion(event.target.checked)
                }
              />
              I understand this product record will be permanently removed.
            </label>
            {permanentDeletionError && (
              <p className="products-form-error" role="alert">
                {permanentDeletionError}
              </p>
            )}
            <footer className="products-modal-actions">
              <button
                type="button"
                className="products-secondary-button"
                onClick={closePermanentDeletionConfirmation}
              >
                Cancel
              </button>
              <button
                type="button"
                className="products-danger-button"
                disabled={!confirmPermanentDeletion}
                onClick={confirmPermanentDeletionAction}
              >
                <Trash2 size={16} /> Permanently Delete
              </button>
            </footer>
          </section>
        </div>
      )}

      {bulkVisibilityAction && (
        <div
          className="products-modal-backdrop"
          onMouseDown={() => setBulkVisibilityAction(null)}
        >
          <section
            className="products-modal products-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-visibility-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">BULK VISIBILITY</span>
                <h2 id="bulk-visibility-title">
                  {bulkVisibilityAction === 'hide' ? 'Hide selected products?' : 'Show selected products?'}
                </h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close visibility confirmation"
                onClick={() => setBulkVisibilityAction(null)}
              >
                <X size={20} />
              </button>
            </header>
            <p className="products-delete-warning">
              {bulkVisibilityAction === 'hide'
                ? `${selectedProducts.length} selected ${selectedProducts.length === 1 ? 'product' : 'products'} will be hidden from customer-facing pages. They will remain in the admin catalog.`
                : `${selectedProducts.length} selected ${selectedProducts.length === 1 ? 'product' : 'products'} will become visible on customer-facing pages.`}
            </p>
            <footer className="products-modal-actions">
              <button
                type="button"
                className="products-secondary-button"
                onClick={() => setBulkVisibilityAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={bulkVisibilityAction === 'hide' ? 'products-danger-button' : 'products-primary-button'}
                onClick={applyBulkVisibility}
              >
                {bulkVisibilityAction === 'hide' ? <EyeOff size={16} /> : <Eye size={16} />}
                {bulkVisibilityAction === 'hide' ? 'Hide Products' : 'Show Products'}
              </button>
            </footer>
          </section>
        </div>
      )}

      {bulkStockOpen && (
        <div
          className="products-modal-backdrop"
          onMouseDown={() => setBulkStockOpen(false)}
        >
          <section
            className="products-modal products-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-stock-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">BULK INVENTORY</span>
                <h2 id="bulk-stock-title">Update stock</h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close stock update"
                onClick={() => setBulkStockOpen(false)}
              >
                <X size={20} />
              </button>
            </header>
            <p className="products-delete-warning">
              Set the inventory status for {selectedProducts.length} selected{' '}
              {selectedProducts.length === 1 ? 'product' : 'products'}.
            </p>
            <div className="products-stock-options" role="radiogroup" aria-label="Stock update mode">
              <label className="products-radio-option">
                <input
                  type="radio"
                  name="bulk-stock-mode"
                  checked={bulkStockMode === 'in-stock'}
                  onChange={() => setBulkStockMode('in-stock')}
                />
                <span>Mark all In Stock</span>
              </label>
              <label className="products-radio-option">
                <input
                  type="radio"
                  name="bulk-stock-mode"
                  checked={bulkStockMode === 'out-of-stock'}
                  onChange={() => setBulkStockMode('out-of-stock')}
                />
                <span>Mark all Out of Stock</span>
              </label>
              <label className="products-radio-option">
                <input
                  type="radio"
                  name="bulk-stock-mode"
                  checked={bulkStockMode === 'custom'}
                  onChange={() => setBulkStockMode('custom')}
                />
                <span>Set a custom stock quantity</span>
              </label>
              {bulkStockMode === 'custom' && (
                <label className="products-custom-stock">
                  Quantity
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bulkStockQuantity}
                    aria-label="Custom stock quantity"
                    aria-invalid={Boolean(bulkStockError)}
                    onChange={(event) => {
                      setBulkStockQuantity(event.target.value);
                      setBulkStockError('');
                    }}
                  />
                </label>
              )}
            </div>
            {bulkStockError && (
              <p className="products-form-error" role="alert">{bulkStockError}</p>
            )}
            <footer className="products-modal-actions">
              <button
                type="button"
                className="products-secondary-button"
                onClick={() => setBulkStockOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="products-primary-button"
                onClick={applyBulkStock}
              >
                <Check size={16} /> Apply Stock Update
              </button>
            </footer>
          </section>
        </div>
      )}

      {previewProduct && (
        <div
          className="products-modal-backdrop products-preview-backdrop"
          onMouseDown={() => setPreviewProduct(null)}
        >
          <section
            className="products-modal products-image-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-image-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="products-modal-header">
              <div>
                <span className="products-eyebrow">{productSku(previewProduct)}</span>
                <h2 id="product-image-title">{previewProduct.name}</h2>
              </div>
              <button
                type="button"
                className="products-icon-button"
                aria-label="Close image preview"
                autoFocus
                onClick={() => setPreviewProduct(null)}
              >
                <X size={20} />
              </button>
            </header>
            <div className="products-image-preview-large">
              <ProductThumbnail product={previewProduct} />
            </div>
          </section>
        </div>
      )}

    </section>
  );
}

function ProductActions({
  product,
  onEdit,
  onToggleVisibility,
  onToggleStock,
  onDelete,
  onCancelSchedule,
}: {
  product: Product;
  onEdit: () => void;
  onToggleVisibility: () => void;
  onToggleStock: () => void;
  onDelete: () => void;
  onCancelSchedule: () => void;
}) {
  return (
    <div className="products-row-actions">
      <button type="button" aria-label={`Edit ${product.name}`} title="Edit product" onClick={onEdit}>
        <Pencil size={15} />
      </button>
      {!product.scheduledDeletionAt && (
        <button
          type="button"
          aria-label={`${(product.stockQuantity ?? 0) > 0 ? 'Mark out of stock' : 'Mark in stock'}: ${product.name}`}
          title={(product.stockQuantity ?? 0) > 0 ? 'Mark out of stock' : 'Mark in stock'}
          onClick={onToggleStock}
        >
          {(product.stockQuantity ?? 0) > 0 ? <X size={15} /> : <Check size={15} />}
        </button>
      )}
      {!product.scheduledDeletionAt && (
        <button
          type="button"
          aria-label={`${product.isHidden ? 'Show' : 'Hide'} ${product.name}`}
          title={product.isHidden ? 'Show product' : 'Hide product'}
          onClick={onToggleVisibility}
        >
          {product.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      )}
      {product.scheduledDeletionAt ? (
        <button type="button" aria-label={`Edit deletion schedule for ${product.name}`} title="Edit deletion schedule" onClick={onDelete}>
          <CalendarDays size={15} />
        </button>
      ) : (
        <button type="button" aria-label={`Delete ${product.name}`} title="Delete product" onClick={onDelete}>
          <Trash2 size={15} />
        </button>
      )}
      {product.scheduledDeletionAt && (
        <button type="button" aria-label={`Cancel deletion schedule for ${product.name}`} title="Cancel scheduled deletion" onClick={onCancelSchedule}>
          <RotateCcw size={15} />
        </button>
      )}
    </div>
  );
}
