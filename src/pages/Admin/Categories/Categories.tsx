
import { useContext, useMemo, useRef, useState } from 'react';
import {
  Plus, Search, Upload, Download, Layers, ShoppingBag, Eye,
  EyeOff, Pencil, Copy, Trash2, GripVertical, ChevronDown,
  ChevronLeft, ChevronRight, ExternalLink, X, Check, ImagePlus,
  Star, LayoutGrid, List, ArrowUpDown,
} from 'lucide-react';
import { ProductContext } from '../../../context/ProductContextValue';
import type { Category } from '../../../types';
import './Categories.css';

type CategoryStatus = 'all' | 'visible' | 'hidden';

const emptyForm = {
  name: '',
  subtitle: '',
  image: '',
  isActive: true,
  isFeatured: false,
};

export default function Categories() {
  const context = useContext(ProductContext);

  if (!context) {
    throw new Error('Categories must be rendered inside ProductProvider.');
  }

  const {
    categories,
    products,
    addCategory,
    updateCategory,
    setCategoryActive,
    reorderCategories,
    deleteCategory,
    restoreCategory,
    permanentlyDeleteCategory,
    storageError,
  } = context;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('all');
  const [sortBy, setSortBy] = useState('custom');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    categories[0]?.id ?? null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);
  const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);
  const [reassignmentTargetId, setReassignmentTargetId] = useState<number | ''>('');
  const [deleteError, setDeleteError] = useState('');
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Category | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCategories = useMemo(
    () => categories.filter((category) => category.isDeleted !== true),
    [categories],
  );

  const recentlyDeletedCategories = useMemo(
    () => categories.filter((category) => category.isDeleted === true),
    [categories],
  );

  const sortedCategories = useMemo(() => {
    const result = [...activeCategories];

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'products') {
      result.sort(
        (a, b) =>
          products.filter((p) => p.category === b.name).length -
          products.filter((p) => p.category === a.name).length
      );
    } else {
      result.sort(
        (a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id)
      );
    }

    return result;
  }, [activeCategories, products, sortBy]);

  const filteredCategories = useMemo(() => {
    return sortedCategories.filter((category) => {
      const matchesSearch = category.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const active = category.isActive !== false;
      const matchesStatus =
        status === 'all' ||
        (status === 'visible' && active) ||
        (status === 'hidden' && !active);

      return matchesSearch && matchesStatus;
    });
  }, [sortedCategories, search, status]);

  const totalProducts = products.filter((p) => !p.isDeleted).length;
  const visibleCount = activeCategories.filter((c) => c.isActive !== false).length;
  const hiddenCount = activeCategories.length - visibleCount;

  const selectedCategory =
    activeCategories.find((c) => c.id === selectedCategoryId) ?? activeCategories[0];

  const getProductCount = (name: string) =>
    products.filter(
      (product) =>
        product.category.toLowerCase() === name.toLowerCase() &&
        !product.isDeleted
    ).length;

  const pageCount = Math.max(1, Math.ceil(filteredCategories.length / pageSize));
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const toggleSelected = (id: number) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleAll = () => {
    const visibleIds = paginatedCategories.map((category) => category.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));

    setSelectedIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      subtitle: category.subtitle,
      image: category.image,
      isActive: category.isActive !== false,
      isFeatured: Boolean(category.isFeatured),
    });
    setError('');
    setModalOpen(true);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const name = form.name.trim();
    const subtitle = form.subtitle.trim();
    const image = form.image.trim();

    if (!name || !subtitle || !image) {
      setError('Please complete all required fields.');
      return;
    }

    const duplicate = activeCategories.some(
      (category) =>
        category.name.toLowerCase() === name.toLowerCase() &&
        category.id !== editingCategory?.id
    );

    if (duplicate) {
      setError('A category with this name already exists.');
      return;
    }

    try {
      if (editingCategory) {
        updateCategory(editingCategory.id, {
          name,
          subtitle,
          image,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
        });
      } else {
        const created = addCategory({
          name,
          subtitle,
          image,
          isActive: form.isActive,
          isFeatured: form.isFeatured,
          sortOrder: categories.length,
        });
        setSelectedCategoryId(created.id);
      }

      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    }
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryPendingDelete(category);
    setReassignmentTargetId('');
    setDeleteError('');
  };

  const handleDelete = () => {
    if (!categoryPendingDelete) return;

    const count = getProductCount(categoryPendingDelete.name);
    if (count > 0 && reassignmentTargetId === '') {
      setDeleteError('Choose a destination category for the assigned products.');
      return;
    }

    try {
      deleteCategory(
        categoryPendingDelete.id,
        reassignmentTargetId === '' ? undefined : reassignmentTargetId,
      );
      setSelectedIds((ids) =>
        ids.filter((id) => id !== categoryPendingDelete.id),
      );

      if (selectedCategoryId === categoryPendingDelete.id) {
        const nextCategory = activeCategories.find(
          (item) => item.id !== categoryPendingDelete.id,
        );
        setSelectedCategoryId(nextCategory?.id ?? null);
      }

      setCategoryPendingDelete(null);
      setReassignmentTargetId('');
      setDeleteError('');
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Unable to delete category.',
      );
    }
  };

  const handleRestoreCategory = (category: Category) => {
    try {
      restoreCategory(category.id);
      setSelectedCategoryId(category.id);
      setShowRecentlyDeleted(false);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : 'Unable to restore category.',
      );
    }
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteTarget) return;

    try {
      permanentlyDeleteCategory(permanentDeleteTarget.id);
      setPermanentDeleteTarget(null);
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : 'Unable to permanently delete category.',
      );
    }
  };

  const handleDuplicate = (category: Category) => {
    try {
      const copy = addCategory({
        name: `${category.name} Copy`,
        subtitle: category.subtitle,
        image: category.image,
        isActive: category.isActive !== false,
        isFeatured: false,
        sortOrder: categories.length,
      });
      setSelectedCategoryId(copy.id);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Unable to duplicate category.');
    }
  };

  const handleBulkVisibility = (active: boolean) => {
    selectedIds.forEach((id) => setCategoryActive(id, active));
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    const selected = activeCategories.filter((c) => selectedIds.includes(c.id));
    const blocked = selected.filter((c) => getProductCount(c.name) > 0);

    if (blocked.length) {
      window.alert(
        `These categories still contain products: ${blocked.map((c) => c.name).join(', ')}. Reassign their products first.`
      );
      return;
    }

    if (!window.confirm(`Delete ${selected.length} selected categories?`)) return;

    selected.forEach((category) => {
      try {
        deleteCategory(category.id);
      } catch (err) {
        console.error(err);
      }
    });

    setSelectedIds([]);
  };

  const handleExport = () => {
    const headers = ['ID', 'Category', 'Subtitle', 'Image', 'Visible', 'Featured', 'Display Order'];
    const rows = activeCategories.map((c) => [
      c.id,
      c.name,
      c.subtitle,
      c.image,
      c.isActive !== false,
      Boolean(c.isFeatured),
      c.sortOrder ?? c.id,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'silverhub-categories.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows = lines.slice(1);

      let imported = 0;

      for (const line of rows) {
        const values = line.match(/("([^"]|"")*"|[^,]*)(,|$)/g);
        if (!values) continue;

        const fields = values
          .map((value) => value.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"'));

        const name = fields[1]?.trim();
        const subtitle = fields[2]?.trim();
        const image = fields[3]?.trim();

        if (!name || !subtitle || !image) continue;

        if (activeCategories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
          continue;
        }

        addCategory({
          name,
          subtitle,
          image,
          isActive: fields[4] !== 'false',
          isFeatured: fields[5] === 'true',
          sortOrder: categories.length + imported,
        });

        imported++;
      }

      window.alert(`${imported} categories imported.`);
    } catch {
      window.alert('Unable to import this CSV file.');
    } finally {
      event.target.value = '';
    }
  };

  const moveCategory = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;

    const ordered = [...sortedCategories];
    const sourceIndex = ordered.findIndex((c) => c.id === sourceId);
    const targetIndex = ordered.findIndex((c) => c.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);

    reorderCategories(ordered.map((c) => c.id));
    setSortBy('custom');
  };

  const changeFeatured = (category: Category) => {
    updateCategory(category.id, { isFeatured: !category.isFeatured });
  };

  return (
    <main className="categories-page">
  <header className="categories-page-heading">
  <div className="categories-heading-content">
    <span className="products-eyebrow">ADMIN STUDIO</span>
    <h1>Categories</h1>
    <p>
      Manage product categories, set display order, visibility, and
      featured categories for your SilverHub store.
    </p>
  </div>

  <div className="categories-heading-actions">
    <span className="categories-total">
      {activeCategories.length} categories
    </span>

    <button
      className="category-outline-btn"
      onClick={() => setShowRecentlyDeleted((current) => !current)}
      type="button"
    >
      <Trash2 size={17} /> Recently Deleted ({recentlyDeletedCategories.length})
    </button>

    <input
      ref={fileInputRef}
      type="file"
      accept=".csv,text/csv"
      hidden
      onChange={handleImport}
    />

    <button
      className="category-outline-btn"
      onClick={handleExport}
    >
      <Download size={17} /> Export CSV
    </button>

    <button
      className="category-outline-btn"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload size={17} /> Import CSV
    </button>

    <button
      className="category-primary-btn"
      onClick={openAddModal}
    >
      <Plus size={19} /> Add Category
    </button>
  </div>
</header>
      {storageError && (
        <div className="category-storage-warning">{storageError}</div>
      )}

      {showRecentlyDeleted && (
        <section className="category-recycle-bin">
          <div className="category-recycle-heading">
            <div>
              <h2>Recently Deleted Categories</h2>
              <p>Restore a category or permanently remove it after checking its products.</p>
            </div>
            <button
              type="button"
              className="category-cancel-btn"
              onClick={() => setShowRecentlyDeleted(false)}
            >
              Close
            </button>
          </div>

          {recentlyDeletedCategories.length === 0 ? (
            <p className="category-empty">No deleted categories.</p>
          ) : (
            <div className="category-recycle-list">
              {recentlyDeletedCategories.map((category) => (
                <div className="category-recycle-item" key={category.id}>
                  <img src={category.image} alt={category.name} />
                  <div className="category-recycle-info">
                    <strong>{category.name}</strong>
                    <span>
                      Deleted {category.deletedAt
                        ? new Date(category.deletedAt).toLocaleString()
                        : '—'}
                    </span>
                    <small>{getProductCount(category.name)} active products assigned</small>
                  </div>
                  <div className="category-recycle-actions">
                    <button
                      type="button"
                      className="category-restore-btn"
                      onClick={() => handleRestoreCategory(category)}
                    >
                      <Check size={15} /> Restore
                    </button>
                    <button
                      type="button"
                      className="category-permanent-btn"
                      onClick={() => setPermanentDeleteTarget(category)}
                    >
                      <Trash2 size={15} /> Delete permanently
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="category-stat-grid">
        <div className="category-stat-card stat-gold">
          <span className="stat-icon"><Layers /></span>
          <div><strong>{activeCategories.length}</strong><span>Total Categories</span></div>
        </div>
        <div className="category-stat-card stat-green">
          <span className="stat-icon"><ShoppingBag /></span>
          <div><strong>{totalProducts}</strong><span>Total Products</span></div>
        </div>
        <div className="category-stat-card stat-purple">
          <span className="stat-icon"><Eye /></span>
          <div><strong>{visibleCount}</strong><span>Visible Categories</span></div>
        </div>
        <div className="category-stat-card stat-red">
          <span className="stat-icon"><EyeOff /></span>
          <div><strong>{hiddenCount}</strong><span>Hidden Categories</span></div>
        </div>
      </section>

      <section className="category-carousel-section">
        <button
          className="category-carousel-arrow"
          onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 1))}
          aria-label="Previous categories"
        >
          <ChevronLeft />
        </button>

        <div className="category-carousel-track">
          {sortedCategories.slice(carouselIndex, carouselIndex + 6).map((category) => (
            <button
              className={`category-image-card ${selectedCategoryId === category.id ? 'active' : ''}`}
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              style={{ backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.78),transparent 70%),url("${category.image}")` }}
            >
              <span className="category-image-card-text">
                <strong>{category.name}</strong>
                <small>{getProductCount(category.name)} Products</small>
              </span>
              <span className="category-card-arrow"><ChevronRight size={17} /></span>
            </button>
          ))}
        </div>

        <button
          className="category-carousel-arrow"
          onClick={() =>
            setCarouselIndex(
              Math.min(Math.max(0, sortedCategories.length - 6), carouselIndex + 1)
            )
          }
          aria-label="Next categories"
        >
          <ChevronRight />
        </button>
      </section>

      <section className="category-workspace">
        <div className="category-main-column">
          <div className="category-toolbar">
            <label className="category-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search category (e.g., Rings, Earrings...)"
              />
            </label>

            <label className="category-select">
              Status:
              <select value={status} onChange={(e) => setStatus(e.target.value as CategoryStatus)}>
                <option value="all">All Statuses</option>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <ChevronDown size={15} />
            </label>

            <label className="category-select">
              Sort by:
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="custom">Custom Order</option>
                <option value="name">Category Name</option>
                <option value="products">Product Count</option>
              </select>
              <ChevronDown size={15} />
            </label>

            <div className="category-view-toggle">
              <button
                className={viewMode === 'grid' ? 'selected' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              ><LayoutGrid size={17} /></button>
              <button
                className={viewMode === 'list' ? 'selected' : ''}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              ><List size={18} /></button>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <div className="category-bulk-toolbar">
              <strong>{selectedIds.length} selected</strong>
              <button onClick={() => handleBulkVisibility(true)}><Eye size={16} /> Show</button>
              <button onClick={() => handleBulkVisibility(false)}><EyeOff size={16} /> Hide</button>
              <button className="bulk-delete" onClick={handleBulkDelete}><Trash2 size={16} /> Delete</button>
              <span className="bulk-hint"><GripVertical size={15} /> Drag rows to reorder</span>
              <button className="bulk-clear" onClick={() => setSelectedIds([])}><X size={15} /> Clear Selection</button>
            </div>
          )}

          {viewMode === 'list' ? (
            <div className="category-table-wrap">
              <table className="category-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" onChange={toggleAll} checked={paginatedCategories.length > 0 && paginatedCategories.every((c) => selectedIds.includes(c.id))} /></th>
                    <th>#</th>
                    <th>Category</th>
                    <th>Image</th>
                    <th>Products</th>
                    <th>Visibility</th>
                    <th>Featured</th>
                    <th>Display Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((category, index) => {
                    const active = category.isActive !== false;

                    return (
                      <tr
                        key={category.id}
                        className={selectedCategoryId === category.id ? 'category-row-active' : ''}
                        draggable={sortBy === 'custom'}
                        onDragStart={() => setDraggedId(category.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedId !== null) moveCategory(draggedId, category.id);
                          setDraggedId(null);
                        }}
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        <td><input type="checkbox" checked={selectedIds.includes(category.id)} onChange={() => toggleSelected(category.id)} onClick={(e) => e.stopPropagation()} /></td>
                        <td className="category-number">
                          <GripVertical size={16} />
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="category-name-cell">{category.name}</td>
                        <td><img className="category-table-image" src={category.image} alt={category.name} /></td>
                        <td>{getProductCount(category.name)}</td>
                        <td>
                          <button
                            className={`category-status-pill ${active ? 'visible' : 'hidden'}`}
                            onClick={(e) => { e.stopPropagation(); setCategoryActive(category.id, !active); }}
                          >
                            {active ? 'Visible' : 'Hidden'}
                          </button>
                        </td>
                        <td>
                          <button
                            className={`category-feature-toggle ${category.isFeatured ? 'on' : ''}`}
                            onClick={(e) => { e.stopPropagation(); changeFeatured(category); }}
                            aria-label="Toggle featured"
                          ><span /></button>
                        </td>
                        <td>
                          <span className="category-order-number">{category.sortOrder ?? index + 1}</span>
                        </td>
                        <td>
                          <div className="category-row-actions">
                            <button title="Edit" onClick={(e) => { e.stopPropagation(); openEditModal(category); }}><Pencil /></button>
                            <button title="Duplicate" onClick={(e) => { e.stopPropagation(); handleDuplicate(category); }}><Copy /></button>
                            <button title={active ? 'Hide' : 'Show'} onClick={(e) => { e.stopPropagation(); setCategoryActive(category.id, !active); }}>{active ? <EyeOff /> : <Eye />}</button>
                            <button title="Delete" className="delete-icon" onClick={(e) => { e.stopPropagation(); openDeleteDialog(category); }}><Trash2 /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedCategories.length === 0 && (
                    <tr><td colSpan={9} className="category-empty">No categories found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="category-grid-view">
              {filteredCategories.map((category) => (
                <button
                  className={`category-grid-card ${selectedCategoryId === category.id ? 'active' : ''}`}
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  <img src={category.image} alt={category.name} />
                  <strong>{category.name}</strong>
                  <span>{getProductCount(category.name)} products</span>
                  <small>{category.isActive === false ? 'Hidden' : 'Visible'}</small>
                </button>
              ))}
            </div>
          )}

          <div className="category-pagination">
            <span>
              Showing {filteredCategories.length ? (page - 1) * pageSize + 1 : 0}–
              {Math.min(page * pageSize, filteredCategories.length)} of {filteredCategories.length} categories
            </span>
            <div className="category-page-controls">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft /></button>
              <strong>{page}</strong>
              <button disabled={page >= pageCount} onClick={() => setPage(page + 1)}><ChevronRight /></button>
            </div>
            <label>Show
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              per page
            </label>
          </div>
        </div>

        <aside className="category-details-panel">
          <h2>Category Details</h2>

          {selectedCategory ? (
            <>
              <div className="category-details-image-wrap">
                <img src={selectedCategory.image} alt={selectedCategory.name} />
                <button onClick={() => openEditModal(selectedCategory)} aria-label="Edit category"><Pencil size={17} /></button>
              </div>
              <h3>{selectedCategory.name}</h3>
              <div className="category-detail-badges">
                <span className={selectedCategory.isActive === false ? 'hidden-text' : 'visible-text'}>
                  ● {selectedCategory.isActive === false ? 'Hidden' : 'Visible'}
                </span>
                {selectedCategory.isFeatured && <span className="featured-text"><Star size={14} fill="currentColor" /> Featured</span>}
              </div>
              <p className="category-details-description">{selectedCategory.subtitle}</p>

              <div className="category-detail-list">
                <div><span><Layers size={15} /> Category ID</span><strong>CAT-{String(selectedCategory.id).padStart(3, '0')}</strong></div>
                <div><span><ShoppingBag size={15} /> Products</span><strong>{getProductCount(selectedCategory.name)}</strong></div>
                <div><span><ArrowUpDown size={15} /> Display Order</span><strong>{selectedCategory.sortOrder ?? selectedCategory.id}</strong></div>
                <div><span><Check size={15} /> Created On</span><strong>{selectedCategory.createdAt ? new Date(selectedCategory.createdAt).toLocaleDateString() : '—'}</strong></div>
                <div><span><Check size={15} /> Updated On</span><strong>{selectedCategory.updatedAt ? new Date(selectedCategory.updatedAt).toLocaleDateString() : '—'}</strong></div>
              </div>

              <button className="category-storefront-btn" onClick={() => window.open('/shop', '_blank')}>
                <Eye size={17} /> View on Storefront <ExternalLink size={15} />
              </button>
            </>
          ) : (
            <p className="category-empty">Select a category to see its details.</p>
          )}
        </aside>
      </section>

      {categoryPendingDelete && (
        <div
          className="category-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setCategoryPendingDelete(null);
              setDeleteError('');
            }
          }}
        >
          <section className="category-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="category-delete-title">
            <div className="category-modal-heading">
              <div>
                <span className="categories-eyebrow">SILVER HUB ADMIN</span>
                <h2 id="category-delete-title">Delete Category</h2>
              </div>
              <button type="button" onClick={() => setCategoryPendingDelete(null)} aria-label="Close">
                <X />
              </button>
            </div>

            <p>
              <strong>{categoryPendingDelete.name}</strong> will be moved to Recently Deleted.
              You can restore it later.
            </p>

            {getProductCount(categoryPendingDelete.name) > 0 && (
              <label className="category-reassign-field">
                Reassign {getProductCount(categoryPendingDelete.name)} assigned product(s) to *
                <select
                  value={reassignmentTargetId}
                  onChange={(event) =>
                    setReassignmentTargetId(
                      event.target.value ? Number(event.target.value) : '',
                    )
                  }
                >
                  <option value="">Choose destination category</option>
                  {activeCategories
                    .filter((category) => category.id !== categoryPendingDelete.id && category.isActive !== false)
                    .map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
            )}

            {deleteError && <p className="category-form-error">{deleteError}</p>}

            <div className="category-modal-actions">
              <button
                type="button"
                className="category-cancel-btn"
                onClick={() => {
                  setCategoryPendingDelete(null);
                  setDeleteError('');
                }}
              >
                Cancel
              </button>
              <button type="button" className="category-danger-btn" onClick={handleDelete}>
                <Trash2 size={16} /> Move to Recently Deleted
              </button>
            </div>
          </section>
        </div>
      )}

      {permanentDeleteTarget && (
        <div className="category-modal-backdrop">
          <section className="category-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="category-permanent-title">
            <div className="category-modal-heading">
              <div>
                <span className="categories-eyebrow">PERMANENT ACTION</span>
                <h2 id="category-permanent-title">Delete Permanently?</h2>
              </div>
              <button type="button" onClick={() => setPermanentDeleteTarget(null)} aria-label="Close">
                <X />
              </button>
            </div>
            <p>
              This will permanently remove <strong>{permanentDeleteTarget.name}</strong>.
              This action cannot be undone.
            </p>
            <div className="category-modal-actions">
              <button type="button" className="category-cancel-btn" onClick={() => setPermanentDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="category-danger-btn" onClick={handlePermanentDelete}>
                <Trash2 size={16} /> Delete Permanently
              </button>
            </div>
          </section>
        </div>
      )}

      {modalOpen && (
        <div className="category-modal-backdrop" onMouseDown={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <form className="category-modal" onSubmit={handleSave}>
            <div className="category-modal-heading">
              <div>
                <span className="categories-eyebrow">SILVER HUB ADMIN</span>
                <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}><X /></button>
            </div>

            <label>Category Name *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Bracelets" required />
            </label>
            <label>Subtitle / Description *
              <textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Describe this category..." required />
            </label>
            <label>Category Image URL *
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." required />
            </label>

            {form.image && (
              <div className="category-modal-image-preview">
                <img src={form.image} alt="Category preview" onError={(e) => { e.currentTarget.style.opacity = '0.25'; }} />
              </div>
            )}

            <label className="category-checkbox-label">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Visible on storefront
            </label>
            <label className="category-checkbox-label">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
              Mark as featured
            </label>

            {error && <p className="category-form-error">{error}</p>}

            <div className="category-modal-actions">
              <button type="button" className="category-cancel-btn" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="category-primary-btn"><Check size={17} /> Save Category</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
