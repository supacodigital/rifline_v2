import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { getOrderById } from '../../services/orders.service';
import { useI18n } from '../../context/I18nContext';
import Button from '../../components/ui/Button';
import styles from './OrderConfirmation.module.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  const { formatPrice, t } = useI18n();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const guestToken = sessionStorage.getItem('guestOrderToken');
    getOrderById(orderId, guestToken)
      .then((data) => {
        if (data && !data.error) {
          setOrder(data);
          sessionStorage.removeItem('guestOrderToken');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return (
    <div className={styles.loading}>Chargement de votre commande…</div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <CheckCircle size={40} strokeWidth={1.5} />
        </div>

        <h1 className={styles.title}>Commande confirmée !</h1>
        <p className={styles.subtitle}>
          Merci pour votre achat. Vous recevrez un email de confirmation à l'adresse indiquée.
        </p>

        {order && (
          <>
            <div className={styles.orderInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Numéro de commande</span>
                <span className={styles.infoValue}>#{order.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date</span>
                <span className={styles.infoValue}>{formatDate(order.created_at)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total</span>
                <span className={styles.infoValue}>{formatPrice(order.total_amount)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Livraison à</span>
                <span className={styles.infoValue}>
                  {order.shipping_first_name} {order.shipping_last_name}, {order.shipping_city}
                </span>
              </div>
            </div>

            {order.items?.length > 0 && (
              <div className={styles.items}>
                <div className={styles.itemsTitle}>
                  <Package size={14} />
                  Articles commandés
                </div>
                {order.items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <span className={styles.itemName}>{item.product_name}</span>
                    <span className={styles.itemDetail}>× {item.quantity} — {formatPrice(item.unit_price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className={styles.actions}>
          {order && order.user_id && (
            <Link to={`/compte/commandes/${order.id}`} className={styles.trackLink}>
              <Package size={16} />
              Suivre ma commande
              <ArrowRight size={14} />
            </Link>
          )}
          <Button variant="outline" as={Link} to="/catalogue">
            <ShoppingBag size={16} />
            Continuer mes achats
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
