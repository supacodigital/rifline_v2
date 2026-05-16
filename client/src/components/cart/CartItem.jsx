import { Trash2, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import styles from './CartItem.module.css';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const { formatPrice, t } = useI18n();

  return (
    <div className={styles.item}>
      {item.image_url ? (
        <img src={item.image_url} alt={item.name} className={styles.image} />
      ) : (
        <div className={styles.imagePlaceholder}><Package size={28} strokeWidth={1.5} /></div>
      )}

      <div className={styles.info}>
        <div className={styles.topRow}>
          <span className={styles.name}>{item.name}</span>
          <button className={styles.removeBtn} onClick={() => removeItem(item.id)} aria-label="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.qtyControls}>
            <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
            <span className={styles.qty}>{item.quantity}</span>
            <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
          </div>
          <span className={styles.price}>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
