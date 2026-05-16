import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, X, Star, Search } from 'lucide-react';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct, adminGetCategories, adminToggleFeatured } from '../../../services/admin.service';
import { formatPrice } from '../../../utils/formatPrice';
import ImageManager from './ImageManager';
import shared from '../admin.shared.module.css';
import styles from './AdminProducts.module.css';

const EMPTY_FORM = { name: '', description: '', price: '', comparePrice: '', stock: '', sku: '', weight: '', categoryId: '', isActive: true };

const ProductModal = ({ product, categories, onClose, onSaved }) => {
  const isEdit = !!product?.id;
  const [savedProductId, setSavedProductId] = useState(product?.id || null);
  const [form, setForm] = useState(product ? {
    name: product.name || '',
    description: product.description || '',
    price: product.price || '',
    comparePrice: product.compare_price || '',
    stock: product.stock ?? '',
    sku: product.sku || '',
    weight: product.weight || '',
    categoryId: product.category_id ?? '',
    isActive: product.is_active ?? true,
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { setError('Nom et prix requis.'); return; }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
        stock: parseInt(form.stock) || 0,
        sku: form.sku.trim(),
        weight: parseFloat(form.weight) || 0,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        isActive: form.isActive,
      };
      const data = isEdit ? await adminUpdateProduct(product.id, payload) : await adminCreateProduct(payload);
      if (data.error) { setError(data.error); return; }
      if (!isEdit && data.id) { setSavedProductId(data.id); return; }
      onSaved();
    } catch {
      setError('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={shared.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={shared.modal}>
        <div className={shared.modalHeader}>
          <h2 className={shared.modalTitle}>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button type="button" className={shared.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={shared.modalBody}>
          {error && <div className={shared.errorBanner}><AlertCircle size={14} />{error}</div>}
          <form onSubmit={handleSubmit} className={shared.modalForm}>
            <div className={shared.field}>
              <label className={shared.label}>Nom *</label>
              <input type="text" className={shared.input} value={form.name} onChange={handleChange('name')} required />
            </div>
            <div className={shared.field}>
              <label className={shared.label}>Description</label>
              <textarea className={`${shared.input} ${shared.textarea}`} value={form.description} onChange={handleChange('description')} rows={3} />
            </div>
            <div className={shared.fieldRow}>
              <div className={shared.field}>
                <label className={shared.label}>Prix (€) *</label>
                <input type="number" step="0.01" min="0" className={shared.input} value={form.price} onChange={handleChange('price')} required />
              </div>
              <div className={shared.field}>
                <label className={shared.label}>Prix barré (€)</label>
                <input type="number" step="0.01" min="0" className={shared.input} value={form.comparePrice} onChange={handleChange('comparePrice')} />
              </div>
            </div>
            <div className={shared.fieldRow}>
              <div className={shared.field}>
                <label className={shared.label}>Stock</label>
                <input type="number" min="0" className={shared.input} value={form.stock} onChange={handleChange('stock')} />
              </div>
              <div className={shared.field}>
                <label className={shared.label}>Poids (kg)</label>
                <input type="number" step="0.001" min="0" className={shared.input} value={form.weight} onChange={handleChange('weight')} />
              </div>
            </div>
            <div className={shared.field}>
              <label className={shared.label}>SKU</label>
              <input type="text" className={shared.input} value={form.sku} onChange={handleChange('sku')} />
            </div>
            <div className={shared.field}>
              <label className={shared.label}>Catégorie</label>
              <select className={shared.input} value={form.categoryId} onChange={handleChange('categoryId')}>
                <option value="">— Sans catégorie —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.parent_id ? `↳ ${c.name}` : c.name}</option>
                ))}
              </select>
            </div>
            <label className={shared.checkboxLabel}>
              <input type="checkbox" checked={form.isActive} onChange={handleChange('isActive')} />
              Produit actif (visible sur le catalogue)
            </label>
            <div className={shared.modalActions}>
              <button type="button" className={shared.btnSecondary} onClick={onClose}>Annuler</button>
              <button type="submit" className={shared.btnPrimary} disabled={loading}>
                {loading ? 'Enregistrement…' : savedProductId && !isEdit ? 'Produit créé ✓' : 'Enregistrer'}
              </button>
            </div>
          </form>
          {savedProductId && <ImageManager productId={savedProductId} />}
          {savedProductId && !isEdit && (
            <div className={shared.modalActions}>
              <button className={shared.btnPrimary} onClick={onSaved}>Terminer</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const searchTimer = useRef(null);

  useEffect(() => {
    adminGetCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const load = useCallback((page = 1) => {
    setLoading(true);
    adminGetProducts({
      page,
      search: search || undefined,
      category: filterCategory || undefined,
      status: filterStatus || undefined,
      stock: filterStock || undefined,
    })
      .then((data) => {
        setProducts(data.data || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterCategory, filterStatus, filterStock]);

  useEffect(() => { load(1); }, [load]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1), 400);
  };

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaved = () => {
    setModal(null);
    showFeedback('Produit enregistré.');
    load(pagination.page);
  };

  const handleToggleFeatured = async (product) => {
    try {
      await adminToggleFeatured(product.id);
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_featured: !p.is_featured } : p));
    } catch {
      showFeedback('Une erreur est survenue.', 'error');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer "${product.name}" ?`)) return;
    try {
      const data = await adminDeleteProduct(product.id);
      if (data.error) { showFeedback(data.error, 'error'); return; }
      showFeedback('Produit supprimé.');
      load(pagination.page);
    } catch {
      showFeedback('Une erreur est survenue.', 'error');
    }
  };

  const rootCategories = categories.filter((c) => !c.parent_id);
  const childCategories = categories.filter((c) => c.parent_id);

  return (
    <div className={shared.page}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Produits</h1>
          <p className={shared.subtitle}>{pagination.total} produit{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        <button className={shared.addBtn} onClick={() => setModal({})}><Plus size={16} />Nouveau produit</button>
      </div>

      {/* Barre de filtres */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Rechercher par nom ou SKU…"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select className={shared.filterSelect} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Toutes les catégories</option>
          {rootCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          {childCategories.map((c) => (
            <option key={c.id} value={c.id}>↳ {c.name}</option>
          ))}
        </select>
        <select className={shared.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <select className={shared.filterSelect} value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
          <option value="">Tout le stock</option>
          <option value="out">Stock épuisé</option>
          <option value="low">Stock faible (≤5)</option>
        </select>
      </div>

      {feedback && (
        <div className={`${shared.feedback} ${shared[`feedback_${feedback.type}`]}`}>
          {feedback.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className={shared.loading}>Chargement…</div>
      ) : products.length === 0 ? (
        <div className={shared.empty}>Aucun produit trouvé.</div>
      ) : (
        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>SKU</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th title="Mis en avant">★</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td data-label="Nom" className={shared.tdName}>
                    <div className={styles.productCell}>
                      <div className={styles.productThumb}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className={styles.productThumbImg} />
                          : <span className={styles.productThumbPlaceholder} />
                        }
                      </div>
                      {p.name}
                    </div>
                  </td>
                  <td data-label="Catégorie" className={shared.tdMuted}>{p.category_name || '—'}</td>
                  <td data-label="SKU" className={shared.tdMuted}>{p.sku || '—'}</td>
                  <td data-label="Prix" className={shared.tdPrice}>
                    {formatPrice(p.price)}
                    {p.compare_price && <span className={shared.comparePrice}>{formatPrice(p.compare_price)}</span>}
                  </td>
                  <td data-label="Stock" className={p.stock === 0 ? shared.tdError : p.stock <= 5 ? styles.tdWarning : shared.tdMuted}>
                    {p.stock === 0 ? '⚠ Épuisé' : p.stock <= 5 ? `⚠ ${p.stock}` : p.stock}
                  </td>
                  <td data-label="Statut">
                    <span className={`${shared.statusDot} ${p.is_active ? shared.statusDotActive : shared.statusDotInactive}`}>
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td data-label="Mis en avant">
                    <button
                      className={`${shared.iconBtn} ${p.is_featured ? shared.iconBtnFeatured : ''}`}
                      onClick={() => handleToggleFeatured(p)}
                      title={p.is_featured ? 'Retirer des nouveautés' : 'Mettre en avant'}
                    >
                      <Star size={15} fill={p.is_featured ? 'currentColor' : 'none'} />
                    </button>
                  </td>
                  <td className={shared.tdActions}>
                    <button className={shared.iconBtn} onClick={() => setModal(p)} title="Modifier"><Pencil size={15} /></button>
                    <button className={`${shared.iconBtn} ${shared.iconBtnDanger}`} onClick={() => handleDelete(p)} title="Supprimer"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className={shared.pagination}>
          <button className={shared.pageBtn} disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>←</button>
          <span className={shared.pageInfo}>{pagination.page} / {pagination.totalPages}</span>
          <button className={shared.pageBtn} disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>→</button>
        </div>
      )}

      {modal !== null && (
        <ProductModal
          product={modal?.id ? modal : null}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminProducts;
