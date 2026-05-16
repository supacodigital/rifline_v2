import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, User, ChevronRight, Package, Clock, Truck, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getMyOrders } from '../../../services/orders.service';
import { useI18n } from '../../../context/I18nContext';
import styles from './Dashboard.module.css';

const STATUS_CONFIG = {
  pending:    { label: 'En attente',     color: 'warning', Icon: Clock },
  paid:       { label: 'Payée',          color: 'info',    Icon: CheckCircle },
  processing: { label: 'En préparation', color: 'info',    Icon: Package },
  shipped:    { label: 'Expédiée',       color: 'primary', Icon: Truck },
  delivered:  { label: 'Livrée',        color: 'success', Icon: CheckCircle },
  cancelled:  { label: 'Annulée',       color: 'error',   Icon: XCircle },
  refunded:   { label: 'Remboursée',    color: 'error',   Icon: RotateCcw },
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const Dashboard = () => {
  const { user } = useAuth();
  const { formatPrice, t } = useI18n();
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    getMyOrders()
      .then((data) => setRecentOrders(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setRecentOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

  const cards = [
    {
      icon: ShoppingBag,
      title: 'Mes commandes',
      description: 'Suivez vos commandes et consultez votre historique d\'achats.',
      href: '/compte/commandes',
    },
    {
      icon: User,
      title: 'Mon profil',
      description: 'Gérez vos informations personnelles et votre mot de passe.',
      href: '/compte/profil',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <h1 className={styles.title}>
            Bonjour, {user?.firstName || 'vous'} 👋
          </h1>
          <p className={styles.subtitle}>{user?.email}</p>
        </div>
      </div>

      <div className={styles.grid}>
        {cards.map(({ icon: Icon, title, description, href }) => (
          <Link key={href} to={href} className={styles.card}>
            <div className={styles.cardIcon}>
              <Icon size={22} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{title}</div>
              <div className={styles.cardDesc}>{description}</div>
            </div>
            <ChevronRight size={18} className={styles.cardArrow} />
          </Link>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Package size={16} />
          <span>Dernières commandes</span>
          <Link to="/compte/commandes" className={styles.sectionLink}>Voir tout</Link>
        </div>

        {ordersLoading ? (
          <div className={styles.ordersLoading}>Chargement…</div>
        ) : recentOrders.length === 0 ? (
          <div className={styles.emptyOrders}>
            <ShoppingBag size={32} strokeWidth={1.5} />
            <p>Aucune commande pour le moment.</p>
            <Link to="/catalogue" className={styles.shopLink}>Découvrir le catalogue</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {recentOrders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const { Icon } = cfg;
              return (
                <Link key={order.id} to={`/compte/commandes/${order.id}`} className={styles.orderRow}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderId}>#{order.id}</span>
                    <span className={styles.orderDate}>{formatDate(order.created_at)}</span>
                  </div>
                  <div className={styles.orderRight}>
                    <span className={styles.orderTotal}>{formatPrice(order.total_amount)}</span>
                    <span className={`${styles.orderBadge} ${styles[`badge_${cfg.color}`]}`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                    <ChevronRight size={14} className={styles.orderArrow} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
