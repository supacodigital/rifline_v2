import { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { adminGetUsers, adminUpdateUserRole } from '../../../services/admin.service';
import { useAuth } from '../../../context/AuthContext';
import shared from '../admin.shared.module.css';
import styles from './AdminUsers.module.css';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleUpdating, setRoleUpdating] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback((page = 1) => {
    setLoading(true);
    adminGetUsers({ page, search: search || undefined })
      .then((data) => {
        setUsers(data.data || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1), 400);
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleUpdating(userId);
    try {
      await adminUpdateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch {
      // l'erreur est silencieuse côté UI — le select reviendra à l'état précédent
      load(pagination.page);
    } finally {
      setRoleUpdating(null);
    }
  };

  return (
    <div className={shared.page}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Clients</h1>
          <p className={shared.subtitle}>{pagination.total} client{pagination.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {loading ? (
        <div className={shared.loading}>Chargement…</div>
      ) : users.length === 0 ? (
        <div className={shared.empty}>Aucun client trouvé.</div>
      ) : (
        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Rôle</th>
                <th>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="#" className={shared.tdId}>{u.id}</td>
                  <td data-label="Nom" className={shared.tdNameUser}>
                    <div className={shared.userAvatar}>{u.first_name?.[0]}{u.last_name?.[0]}</div>
                    {u.first_name} {u.last_name}
                  </td>
                  <td data-label="Email" className={shared.tdMuted}>{u.email}</td>
                  <td data-label="Téléphone" className={shared.tdMuted}>{u.phone || '—'}</td>
                  <td data-label="Rôle">
                    {u.id === currentUser?.id ? (
                      <span className={`${shared.roleBadge} ${shared.roleBadgeAdmin}`}>Admin (vous)</span>
                    ) : (
                      <select
                        className={`${shared.roleBadge} ${u.role === 'admin' ? shared.roleBadgeAdmin : ''} ${styles.roleSelect}`}
                        value={u.role}
                        disabled={roleUpdating === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        aria-label={`Rôle de ${u.first_name} ${u.last_name}`}
                      >
                        <option value="customer">Client</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td data-label="Inscrit le" className={shared.tdMuted}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className={shared.pagination}>
          <button className={shared.pageBtn} disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>←</button>
          <span className={shared.pageInfo}>{pagination.page} / {pagination.totalPages}</span>
          <button className={shared.pageBtn} disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>→</button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
