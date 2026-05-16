import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, Truck, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';
import { getMyOrders, getOrderById } from '../../../services/orders.service';
import { useI18n } from '../../../context/I18nContext';
import styles from './Orders.module.css';

const STATUS_CONFIG = {
  pending:    { label: 'En attente',    icon: Clock,        color: 'warning' },
  paid:       { label: 'Payée',         icon: CheckCircle,  color: 'info' },
  processing: { label: 'En préparation',icon: Package,      color: 'info' },
  shipped:    { label: 'Expédiée',      icon: Truck,        color: 'primary' },
  delivered:  { label: 'Livrée',        icon: CheckCircle,  color: 'success' },
  cancelled:  { label: 'Annulée',       icon: XCircle,      color: 'error' },
  refunded:   { label: 'Remboursée',    icon: RotateCcw,    color: 'error' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span className={`${styles.badge} ${styles[`badge_${config.color}`]}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

/* ── Liste des commandes ── */
const OrdersList = () => {
  const { formatPrice, t } = useI18n();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.loading}>Chargement…</div>;

  return (
    <div className={styles.page}>
      <Link to="/compte" className={styles.back}><ChevronLeft size={16} />Mon compte</Link>
      <h1 className={styles.title}>Mes commandes</h1>
      <p className={styles.subtitle}>{orders.length} commande{orders.length !== 1 ? 's' : ''}</p>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <Package size={40} strokeWidth={1.5} />
          <p>Aucune commande pour le moment.</p>
          <Link to="/catalogue" className={styles.shopLink}>Découvrir le catalogue</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <Link key={order.id} to={`/compte/commandes/${order.id}`} className={styles.orderRow}>
              <div className={styles.orderMeta}>
                <span className={styles.orderId}>Commande #{order.id}</span>
                <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
              </div>
              <div className={styles.orderRight}>
                <span className={styles.orderTotal}>{formatPrice(order.total_amount)}</span>
                <StatusBadge status={order.status} />
                <ChevronRight size={16} className={styles.orderArrow} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Détail d'une commande ── */
const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderById(id)
      .then((data) => {
        if (data.error || !data.id) navigate('/compte/commandes', { replace: true });
        else setOrder(data);
      })
      .catch(() => navigate('/compte/commandes', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className={styles.loading}>Chargement…</div>;
  if (!order) return null;

  return (
    <div className={styles.page}>
      <Link to="/compte/commandes" className={styles.back}><ChevronLeft size={16} />Mes commandes</Link>

      <div className={styles.detailHeader}>
        <div>
          <h1 className={styles.title}>Commande #{order.id}</h1>
          <p className={styles.subtitle}>{formatDate(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.tracking_number && (
        <div className={styles.trackingBanner}>
          <Truck size={16} />
          <span>Numéro de suivi : <strong>{order.tracking_number}</strong></span>
        </div>
      )}

      <div className={styles.detailGrid}>
        {/* Articles */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Articles</h2>
          <div className={styles.itemsList}>
            {(order.items || []).map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.product_name}</span>
                  <span className={styles.itemQty}>× {item.quantity}</span>
                </div>
                <span className={styles.itemPrice}>{formatPrice(item.unit_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Sous-total</span>
              <span>{formatPrice(order.total_amount - order.shipping_amount)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Livraison</span>
              <span>{parseFloat(order.shipping_amount) === 0 ? 'Gratuit' : formatPrice(order.shipping_amount)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.totalRowFinal}`}>
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </section>

        {/* Livraison */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Adresse de livraison</h2>
          <address className={styles.address}>
            <strong>{order.shipping_first_name} {order.shipping_last_name}</strong>
            <span>{order.shipping_address}</span>
            <span>{order.shipping_postal_code} {order.shipping_city}</span>
            <span>{order.shipping_country}</span>
            {order.shipping_phone && <span>{order.shipping_phone}</span>}
          </address>
        </section>
      </div>
    </div>
  );
};

/* ── Export conditionnel selon la présence d'un :id ── */
const Orders = () => {
  const { id } = useParams();
  return id ? <OrderDetail /> : <OrdersList />;
};

export default Orders;
