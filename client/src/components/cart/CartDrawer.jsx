import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import { useI18n } from '../../context/I18nContext';
import styles from './CartDrawer.module.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, totalPrice } = useCart();
  const { formatPrice, t } = useI18n();
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.drawer}>

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Mon panier</h2>
            {totalItems > 0 && (
              <span className={styles.itemCount}>{totalItems} article{totalItems > 1 ? 's' : ''}</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingBag size={48} strokeWidth={1.2} />
            <div>
              <p className={styles.emptyTitle}>Votre panier est vide</p>
              <p className={styles.emptyText}>Ajoutez des articles pour commencer</p>
            </div>
            <button className={styles.emptyBtn} onClick={onClose}>Continuer mes achats</button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map((item) => <CartItem key={item.id} item={item} />)}
            </div>

            <div className={styles.footer}>
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Sous-total</span>
                  <span className={styles.totalValue}>{formatPrice(totalPrice)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Livraison</span>
                  <span className={styles.totalValue}>Calculée à l'étape suivante</span>
                </div>
                <div className={styles.totalDivider} />
                <div className={styles.totalRow}>
                  <span className={styles.grandTotalLabel}>Total</span>
                  <span className={styles.grandTotalValue}>{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <Link to="/commande" className={styles.checkoutBtn} onClick={onClose}>
                Passer la commande
                <ArrowRight size={18} />
              </Link>

              <p className={styles.footerNote}>Paiement sécurisé · Retours gratuits 30j</p>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
