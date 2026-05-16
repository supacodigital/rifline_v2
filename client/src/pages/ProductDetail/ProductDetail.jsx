import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, ShoppingCart, CheckCircle, AlertCircle, ChevronRight, Truck, RefreshCw, ShieldCheck } from 'lucide-react';
import { getProductBySlug, getProducts } from '../../services/products.service';
import { useCart } from '../../context/CartContext';
import Badge from '../../components/ui/Badge';
import { useI18n } from '../../context/I18nContext';
import styles from './ProductDetail.module.css';

const REASSURANCE = [
  { icon: <Truck size={18} />, title: 'Livraison rapide', desc: 'Expédié sous 24-48h' },
  { icon: <RefreshCw size={18} />, title: 'Retours gratuits', desc: '30 jours pour changer d\'avis' },
  { icon: <ShieldCheck size={18} />, title: 'Paiement sécurisé', desc: 'Transactions chiffrées SSL' },
];

const ProductDetail = () => {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { formatPrice, t } = useI18n();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    setLoading(true);
    setActiveImage(0);
    setSuggestions([]);
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data);
        const categorySlug = data?.category_slug;
        // Fetch 5 pour avoir 4 après exclusion du produit courant
        const fetchSuggestions = categorySlug
          ? getProducts({ category: categorySlug, limit: 5 })
          : getProducts({ limit: 5 });
        fetchSuggestions
          .then((res) => {
            const others = (res.data || []).filter((p) => p.slug !== slug);
            if (others.length > 0) {
              setSuggestions(others.slice(0, 4));
            } else if (categorySlug) {
              // Fallback : produits récents toutes catégories
              getProducts({ limit: 5 })
                .then((r) => {
                  const fallback = (r.data || []).filter((p) => p.slug !== slug);
                  setSuggestions(fallback.slice(0, 4));
                })
                .catch(() => {});
            }
          })
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className={styles.stateMsg}>Chargement…</div>;
  if (!product || product.error) return <div className={`${styles.stateMsg} ${styles.stateMsgError}`}>Produit introuvable.</div>;

  const hasPromo = product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price);
  const discount = hasPromo ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compare_price)) * 100) : null;
  const images = product.images?.length ? product.images : [];
  const currentImage = images[activeImage]?.url || null;

  const handleAddToCart = () => {
    addItem({ id: product.id, name: product.name, price: product.price, weight: product.weight, image_url: currentImage, slug: product.slug, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumbLink}>Accueil</Link>
        <ChevronRight size={13} className={styles.breadcrumbSep} />
        <Link to="/catalogue" className={styles.breadcrumbLink}>Catalogue</Link>
        {product.category_name && (
          <>
            <ChevronRight size={13} className={styles.breadcrumbSep} />
            <Link to={`/catalogue?category=${product.category_slug}`} className={styles.breadcrumbLink}>{product.category_name}</Link>
          </>
        )}
        <ChevronRight size={13} className={styles.breadcrumbSep} />
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* Grille principale */}
      <div className={styles.grid}>

        {/* Colonne image */}
        <div className={styles.gallery}>
          <div className={styles.mainImageWrapper}>
            {currentImage ? (
              <img src={currentImage} alt={product.name} className={styles.mainImage} />
            ) : (
              <div className={styles.imagePlaceholder}><Package size={80} strokeWidth={1} /></div>
            )}
            {hasPromo && (
              <div className={styles.galleryBadge}><Badge variant="accent">-{discount}%</Badge></div>
            )}
          </div>

          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Image ${i + 1}`}
                >
                  <img src={img.url} alt={img.alt || product.name} className={styles.thumbImg} />
                </button>
              ))}
            </div>
          )}

          {/* Suggestions sous la galerie — desktop uniquement */}
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <p className={styles.suggestionsTitle}>Vous aimerez aussi</p>
              <div className={styles.suggestionsGrid}>
                {suggestions.map((p) => (
                  <Link key={p.id} to={`/produit/${p.slug}`} className={styles.suggestionItem}>
                    <div className={styles.suggestionImg}>
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className={styles.suggestionImgEl} />
                        : <Package size={16} />}
                    </div>
                    <span className={styles.suggestionName}>{p.name}</span>
                    <span className={styles.suggestionPrice}>{formatPrice(p.price)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne infos */}
        <div className={styles.info}>
          {product.category_name && (
            <Link to={`/catalogue?category=${product.category_slug}`} className={styles.category}>
              {product.category_name}
            </Link>
          )}

          <h1 className={styles.name}>{product.name}</h1>

          {product.description && (
            <p className={styles.description}>{product.description}</p>
          )}

          <div className={styles.divider} />

          {/* Stock */}
          {product.stock === 0 ? (
            <div className={styles.outOfStock}>
              <AlertCircle size={15} />
              Rupture de stock
            </div>
          ) : (
            <div className={styles.stockOk}>
              <CheckCircle size={15} />
              En stock — {product.stock > 10 ? 'disponible' : `plus que ${product.stock}`}
            </div>
          )}

          {/* Quantité + Prix */}
          {product.stock > 0 && (
            <div className={styles.qtyRow}>
              <div className={styles.qtyControls}>
                <button className={styles.qtyBtn} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span className={styles.qtyValue}>{quantity}</span>
                <button className={styles.qtyBtn} onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <div className={styles.priceBlock}>
                <span className={styles.price}>{formatPrice(product.price)}</span>
                {hasPromo && (
                  <>
                    <span className={styles.comparePrice}>{formatPrice(product.compare_price)}</span>
                    <Badge variant="accent">-{discount}%</Badge>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Bouton */}
          <button
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ''} ${product.stock === 0 ? styles.addBtnDisabled : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {added ? <CheckCircle size={18} /> : <ShoppingCart size={18} />}
            {added ? 'Ajouté au panier !' : product.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>

          {/* Moyens de paiement */}
          <div className={styles.paymentMethods}>
            {['visa', 'mastercard', 'paypal', 'amex'].map((brand) => (
              <span key={brand} className={styles.paymentBadge}>
                <img
                  src={`https://cdn.jsdelivr.net/npm/payment-icons@1.1.0/min/flat/${brand}.svg`}
                  alt={brand}
                  className={styles.paymentIcon}
                />
              </span>
            ))}
          </div>

          {/* Réassurance */}
          <div className={styles.reassurance}>
            {REASSURANCE.map((item) => (
              <div key={item.title} className={styles.reassuranceItem}>
                <span className={styles.reassuranceIcon}>{item.icon}</span>
                <div>
                  <p className={styles.reassuranceTitle}>{item.title}</p>
                  <p className={styles.reassuranceDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* SKU */}
          {product.sku && (
            <p className={styles.sku}>Réf. {product.sku}</p>
          )}
        </div>
      </div>

      {/* Suggestions — mobile uniquement, tout en bas */}
      {suggestions.length > 0 && (
        <div className={styles.suggestionsMobile}>
          <p className={styles.suggestionsTitle}>Vous aimerez aussi</p>
          <div className={styles.suggestionsGrid}>
            {suggestions.map((p) => (
              <Link key={p.id} to={`/produit/${p.slug}`} className={styles.suggestionItem}>
                <div className={styles.suggestionImg}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className={styles.suggestionImgEl} />
                    : <Package size={16} />}
                </div>
                <span className={styles.suggestionName}>{p.name}</span>
                <span className={styles.suggestionPrice}>{formatPrice(p.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA mobile */}
      {product.stock > 0 && (
        <div className={styles.stickyCta}>
          <div className={styles.stickyInfo}>
            <span className={styles.stickyName}>{product.name}</span>
            <span className={styles.stickyPrice}>{formatPrice(product.price)}</span>
          </div>
          <button
            className={`${styles.addBtn} ${styles.stickyBtn} ${added ? styles.addBtnAdded : ''}`}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={16} />
            {added ? 'Ajouté !' : 'Ajouter'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
