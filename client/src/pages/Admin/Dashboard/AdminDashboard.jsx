import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, Users, TrendingUp, ChevronRight, Tag, CircleCheck } from 'lucide-react';
import { adminGetStats } from '../../../services/admin.service';
import { formatPrice } from '../../../utils/formatPrice';
import styles from './AdminDashboard.module.css';

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <div className={`${styles.statCard} ${styles[`statCard_${color}`]}`}>
    <div className={styles.statTop}>
      <div className={styles.statIcon}><Icon size={18} /></div>
    </div>
    {loading
      ? <div className={styles.skeleton} />
      : <div className={styles.statValue}>{value ?? '—'}</div>
    }
    <div className={styles.statLabel}>{label}</div>
  </div>
);

const QUICK_LINKS = [
  { to: '/admin/produits',   label: 'Gérer les produits',   icon: Package },
  { to: '/admin/categories', label: 'Gérer les catégories', icon: Tag },
  { to: '/admin/commandes',  label: 'Voir les commandes',   icon: ShoppingBag },
  { to: '/admin/clients',    label: 'Gérer les clients',    icon: Users },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats()
      .then((data) => { if (!data.error) setStats(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const cards = [
    { icon: TrendingUp, label: 'Revenus (30 jours)',  value: stats ? formatPrice(stats.revenue30d || 0) : null, color: 'primary' },
    { icon: ShoppingBag, label: 'Commandes totales', value: stats?.totalOrders,    color: 'info' },
    { icon: Package,     label: 'Produits actifs',   value: stats?.activeProducts, color: 'success' },
    { icon: Users,       label: 'Clients inscrits',  value: stats?.totalUsers,     color: 'warning' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tableau de bord</h1>
        <p className={styles.subtitle}>{today}</p>
      </div>

      <div className={styles.statsGrid}>
        {cards.map((card) => <StatCard key={card.label} {...card} loading={loading} />)}
      </div>

      <div className={styles.bottom}>
        {/* Accès rapides */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Accès rapides</h2>
          </div>
          <div className={styles.linkList}>
            {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={styles.linkItem}>
                <div className={styles.linkIcon}><Icon size={16} /></div>
                <span>{label}</span>
                <ChevronRight size={15} className={styles.linkArrow} />
              </Link>
            ))}
          </div>
        </div>

        {/* Infos système */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Informations système</h2>
          </div>
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Statut</span>
              <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                <CircleCheck size={11} /> En ligne
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Paiement</span>
              <span className={styles.infoVal}>SumUp Hosted Checkout</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Livraison</span>
              <span className={styles.infoVal}>Sendcloud</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Hébergement</span>
              <span className={styles.infoVal}>O2switch · Phusion Passenger</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Version</span>
              <span className={styles.infoVal}>React 18 · Node.js 20</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
