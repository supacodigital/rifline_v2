import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminLayout.module.css';

const NAV_ITEMS = [
  { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/admin/produits',   icon: Package,         label: 'Produits' },
  { to: '/admin/categories', icon: Tag,             label: 'Catégories' },
  { to: '/admin/commandes',  icon: ShoppingBag,     label: 'Commandes' },
  { to: '/admin/clients',    icon: Users,           label: 'Clients' },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarBrandLogo}>Rif<span>Line</span></div>
          <span className={styles.sidebarBrandBadge}>Admin</span>
        </div>
        <p className={styles.sidebarLabel}>Navigation</p>
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
