import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, CheckCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, variant = 'grid' }) => {
  const { slug, name, price, compare_price, image_url, category_name, stock, description } = product;
  const { addItem } = useCart();
  const { formatPrice, t } = useI18n();
  const [added, setAdded] = useState(false);
  const hasPromo = compare_price && parseFloat(compare_price) > parseFloat(price);
  const discount = hasPromo
    ? Math.round((1 - parseFloat(price) / parseFloat(compare_price)) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (stock === 0) return;
    addItem({ id: product.id, name, price: parseFloat(price), image_url, slug, stock });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (variant === 'list') {
    return (
      <Link to={`/produit/${slug}`} className={styles.cardList}>
        <div className={styles.imageWrapperList}>
          {image_url ? (
            <img src={image_url} alt={name} className={styles.image} loading="lazy" />
          ) : (
            <div className={styles.imagePlaceholder}><Package size={32} /></div>
          )}
          {hasPromo && (
            <div className={styles.promoBadge}><Badge variant="accent">-{discount}%</Badge></div>
          )}
        </div>

        <div className={styles.bodyList}>
          <div className={styles.bodyListMeta}>
            {category_name && <span className={styles.category}>{category_name}</span>}
            {stock === 0 && <span className={styles.outOfStock}>Rupture</span>}
            {stock > 0 && stock <= 5 && <span className={styles.lowStock}>Plus que {stock}</span>}
          </div>
          <h3 className={styles.nameList}>{name}</h3>
          {description && <p className={styles.descList}>{description}</p>}
          <div className={styles.priceBlock}>
            <span className={styles.price}>{formatPrice(price)}</span>
            {hasPromo && <span className={styles.comparePrice}>{formatPrice(compare_price)}</span>}
          </div>
        </div>

        <div className={styles.bodyListRight}>
          <button
            className={`${styles.cartBtnList} ${stock === 0 ? styles.cartBtnDisabled : ''} ${added ? styles.cartBtnAdded : ''}`}
            onClick={handleAddToCart}
            aria-label="Ajouter au panier"
          >
            {added ? <CheckCircle size={15} /> : <ShoppingCart size={15} />}
            {stock === 0 ? 'Rupture' : added ? 'Ajouté !' : 'Ajouter'}
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/produit/${slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {image_url ? (
          <img src={image_url} alt={name} className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.imagePlaceholder}>
            <Package size={48} />
          </div>
        )}
        {hasPromo && (
          <div className={styles.promoBadge}>
            <Badge variant="accent">-{discount}%</Badge>
          </div>
        )}
        <button
          className={`${styles.cartBtn} ${stock === 0 ? styles.cartBtnDisabled : ''} ${added ? styles.cartBtnAdded : ''}`}
          onClick={handleAddToCart}
          aria-label="Ajouter au panier"
        >
          {added ? <CheckCircle size={18} /> : <ShoppingCart size={18} />}
        </button>
      </div>

      <div className={styles.body}>
        {category_name && <span className={styles.category}>{category_name}</span>}
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.prices}>
          <span className={styles.price}>{formatPrice(price)}</span>
          {hasPromo && <span className={styles.comparePrice}>{formatPrice(compare_price)}</span>}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
