import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { getCategories } from '../../services/products.service';
import ProductCard from '../../components/product/ProductCard';
import { useI18n } from '../../context/I18nContext';
import styles from './Catalog.module.css';

const Catalog = () => {
  const { t } = useI18n();
  const SORT_OPTIONS = [
    { value: 'newest',     label: t('catalog.newest') },
    { value: 'price_asc',  label: t('catalog.priceAsc') },
    { value: 'price_desc', label: t('catalog.priceDesc') },
  ];
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const category  = searchParams.get('category') || undefined;
  const search    = searchParams.get('q') || undefined;
  const sort      = searchParams.get('sort') || 'newest';
  const minPrice  = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : undefined;
  const maxPrice  = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : undefined;
  const inStock   = searchParams.get('inStock') === 'true';

  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => { setPage(1); }, [category, search, sort, minPrice, maxPrice, inStock]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data.filter((c) => !c.parent_id) : []))
      .catch(() => {});
  }, []);

  const { data: products, pagination, loading } = useProducts({ page, limit: 24, category, search, sort, minPrice, maxPrice, inStock });

  const setParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === undefined || value === null || value === '' || value === false) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  const applyPriceFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      priceMin ? next.set('minPrice', priceMin) : next.delete('minPrice');
      priceMax ? next.set('maxPrice', priceMax) : next.delete('maxPrice');
      return next;
    });
  };

  const clearAllFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('minPrice');
      next.delete('maxPrice');
      next.delete('inStock');
      return next;
    });
  };

  const hasActiveFilters = category || minPrice || maxPrice || inStock;

  const pageTitle = search
    ? `${t('catalog.resultsFor')} "${search}"`
    : category
      ? categories.find((c) => c.slug === category)?.name || category.charAt(0).toUpperCase() + category.slice(1)
      : t('nav.catalogue');

  return (
    <div className={styles.wrapper}>
    <div className={styles.page}>
      {/* Overlay sidebar mobile */}
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarTitle}>{t('catalog.filters')}</span>
          {hasActiveFilters && (
            <button className={styles.clearBtn} onClick={clearAllFilters}>
              <X size={13} /> {t('catalog.clearAll')}
            </button>
          )}
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Catégories */}
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>{t('catalog.category')}</p>
          <button
            className={`${styles.filterCat} ${!category ? styles.filterCatActive : ''}`}
            onClick={() => setParam('category', undefined)}
          >
            {t('catalog.allCategories')}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`${styles.filterCat} ${category === c.slug ? styles.filterCatActive : ''}`}
              onClick={() => setParam('category', c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Prix */}
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>{t('catalog.price')}</p>
          <div className={styles.priceRow}>
            <input
              type="number"
              min="0"
              placeholder="Min"
              className={styles.priceInput}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()}
            />
            <span className={styles.priceSep}>—</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              className={styles.priceInput}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyPriceFilter()}
            />
          </div>
          <button className={styles.applyBtn} onClick={applyPriceFilter}>{t('catalog.apply')}</button>
        </div>

        {/* Stock */}
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel}>{t('catalog.availability')}</p>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setParam('inStock', e.target.checked ? 'true' : undefined)}
            />
            {t('catalog.inStockOnly')}
          </label>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className={styles.main}>
        {/* Barre de contrôles */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <button className={styles.filterToggle} onClick={() => setSidebarOpen(true)}>
              <SlidersHorizontal size={16} />
              {t('catalog.filters')}
              {hasActiveFilters && <span className={styles.filterBadge} />}
            </button>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>{pageTitle}</h1>
            </div>
          </div>

          <div className={styles.toolbarRight}>
            {/* Tri */}
            <div className={styles.sortWrapper}>
              <select
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => setParam('sort', e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className={styles.sortChevron} />
            </div>

            {/* Vue grille / liste */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('grid')}
                aria-label="Vue grille"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
                onClick={() => setView('list')}
                aria-label="Vue liste"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Grille / liste produits */}
        {loading ? (
          <div className={view === 'grid' ? styles.grid : styles.listView}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={view === 'grid' ? styles.skeleton : styles.skeletonList} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>{t('catalog.noProducts')}</p>
            <p className={styles.emptyText}>{t('catalog.noProductsHint')}</p>
            {hasActiveFilters && (
              <button className={styles.applyBtn} onClick={clearAllFilters}>{t('catalog.clearFilters')}</button>
            )}
          </div>
        ) : (
          <div className={view === 'grid' ? styles.grid : styles.listView}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} variant={view} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← {t('catalog.prev')}
            </button>
            <span className={styles.pageInfo}>{t('catalog.page')} {page} / {pagination.totalPages}</span>
            <button
              className={styles.pageBtn}
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('catalog.next')} →
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Catalog;
