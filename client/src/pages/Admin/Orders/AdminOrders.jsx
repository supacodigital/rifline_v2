import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, AlertCircle, Search, X, Package, MapPin, CreditCard, Truck, FileText, Copy, ClipboardCheck } from 'lucide-react';
import { adminGetOrders, adminUpdateOrderStatus, adminGetOrder, adminUpdateOrderTracking, adminGetOrderShippingMethods, adminCreateParcel } from '../../../services/admin.service';
import { formatPrice } from '../../../utils/formatPrice';
import shared from '../admin.shared.module.css';
import styles from './AdminOrders.module.css';

const STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const STATUS_LABELS = {
  pending: 'En attente', paid: 'Payée', processing: 'En préparation',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée', refunded: 'Remboursée',
};
const STATUS_COLORS = {
  pending: 'warning', paid: 'info', processing: 'info',
  shipped: 'primary', delivered: 'success', cancelled: 'error', refunded: 'error',
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDatetime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ── Modale détail commande ── */
const OrderDetail = ({ orderId, onClose }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingInput, setTrackingInput] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const [trackingSuccess, setTrackingSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [creatingParcel, setCreatingParcel] = useState(false);
  const [parcelError, setParcelError] = useState(null);
  const [parcelSuccess, setParcelSuccess] = useState(null);

  const fetchOrder = () => {
    setLoading(true);
    adminGetOrder(orderId)
      .then((data) => { setOrder(data); setTrackingInput(data.tracking_number || ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  useEffect(() => {
    if (!order || order.sendcloud_parcel_id) return;
    setShippingLoading(true);
    adminGetOrderShippingMethods(orderId)
      .then((data) => {
        const methods = data.methods || [];
        setShippingMethods(methods);
        if (methods.length > 0) setSelectedMethod(methods[0].id);
      })
      .catch(() => {})
      .finally(() => setShippingLoading(false));
  }, [order?.id, order?.sendcloud_parcel_id]);

  const handleCreateParcel = async () => {
    if (!selectedMethod) return;
    setCreatingParcel(true);
    setParcelError(null);
    setParcelSuccess(null);
    try {
      const data = await adminCreateParcel(orderId, selectedMethod);
      if (data.error) { setParcelError(data.error); return; }
      setParcelSuccess(data);
      setOrder((prev) => ({
        ...prev,
        tracking_number: data.trackingNumber || prev.tracking_number,
        label_url: data.labelUrl || prev.label_url,
        sendcloud_parcel_id: data.parcelId || prev.sendcloud_parcel_id,
        status: 'processing',
      }));
      if (data.trackingNumber) setTrackingInput(data.trackingNumber);
    } catch {
      setParcelError('Une erreur est survenue lors de la création du bordereau.');
    } finally {
      setCreatingParcel(false);
    }
  };

  const handleCopyShippingInfo = () => {
    const totalWeight = (order.items || []).reduce(
      (acc, item) => acc + (parseFloat(item.weight) || 0) * item.quantity, 0
    );
    const text = [
      `${order.shipping_first_name} ${order.shipping_last_name}`,
      order.shipping_address,
      `${order.shipping_postal_code} ${order.shipping_city}`,
      order.shipping_country,
      order.shipping_email || '',
      order.shipping_phone || '',
      `Poids total : ${totalWeight.toFixed(3)} kg`,
      `Commande #${order.id} — ${formatPrice(order.total_amount)}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSaveTracking = async () => {
    if (!trackingInput.trim()) return;
    setSavingTracking(true);
    setTrackingError(null);
    setTrackingSuccess(false);
    try {
      const data = await adminUpdateOrderTracking(orderId, trackingInput.trim());
      if (data.error) { setTrackingError(data.error); return; }
      setTrackingSuccess(true);
      setOrder((prev) => ({ ...prev, tracking_number: trackingInput.trim(), status: 'shipped' }));
      setTimeout(() => setTrackingSuccess(false), 3000);
    } catch {
      setTrackingError('Une erreur est survenue.');
    } finally {
      setSavingTracking(false);
    }
  };

  return (
    <div className={shared.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${shared.modal} ${styles.detailModal}`}>
        <div className={shared.modalHeader}>
          <h2 className={shared.modalTitle}>Commande #{orderId}</h2>
          <button className={shared.modalClose} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={shared.modalBody}>
          {loading ? (
            <div className={shared.loading}>Chargement…</div>
          ) : !order ? (
            <div className={shared.empty}>Commande introuvable.</div>
          ) : (
            <div className={styles.detailContent}>

              {/* Statut + dates */}
              <div className={styles.detailSection}>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Statut</span>
                  <span className={`${shared.badge} ${shared[`badge_${STATUS_COLORS[order.status]}`]}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Passée le</span>
                  <span className={styles.detailVal}>{formatDatetime(order.created_at)}</span>
                </div>
                {order.paid_at && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Payée le</span>
                    <span className={styles.detailVal}>{formatDatetime(order.paid_at)}</span>
                  </div>
                )}
                {order.shipped_at && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailKey}>Expédiée le</span>
                    <span className={styles.detailVal}>{formatDatetime(order.shipped_at)}</span>
                  </div>
                )}
              </div>

              {/* Articles */}
              <div className={styles.detailBlock}>
                <div className={styles.detailBlockTitle}><Package size={14} />Articles</div>
                <div className={styles.itemsList}>
                  {(order.items || []).map((item) => (
                    <div key={item.id} className={styles.item}>
                      <div className={styles.itemName}>{item.product_name}</div>
                      <div className={styles.itemMeta}>
                        {item.product_sku && <span className={styles.itemSku}>{item.product_sku}</span>}
                        <span>×{item.quantity}</span>
                        <span className={styles.itemPrice}>{formatPrice(item.unit_price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.totalsBlock}>
                  <div className={styles.totalRow}>
                    <span>Sous-total</span>
                    <span>{formatPrice(parseFloat(order.total_amount) - parseFloat(order.shipping_amount || 0))}</span>
                  </div>
                  <div className={styles.totalRow}>
                    <span>Livraison</span>
                    <span>{parseFloat(order.shipping_amount) === 0 ? 'Gratuite' : formatPrice(order.shipping_amount)}</span>
                  </div>
                  <div className={`${styles.totalRow} ${styles.totalRowBold}`}>
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className={styles.detailBlock}>
                <div className={styles.detailBlockTitleRow}>
                  <div className={styles.detailBlockTitle}><MapPin size={14} />Livraison</div>
                  <button className={styles.copyBtn} onClick={handleCopyShippingInfo} title="Copier les infos pour Sendcloud">
                    {copied ? <><ClipboardCheck size={13} />Copié !</> : <><Copy size={13} />Copier pour Sendcloud</>}
                  </button>
                </div>
                <div className={styles.addressBlock}>
                  <div>{order.shipping_first_name} {order.shipping_last_name}</div>
                  <div>{order.shipping_address}</div>
                  <div>{order.shipping_postal_code} {order.shipping_city}</div>
                  <div>{order.shipping_country}</div>
                  {order.shipping_email && <div className={styles.detailMuted}>{order.shipping_email}</div>}
                  {order.shipping_phone && <div className={styles.detailMuted}>{order.shipping_phone}</div>}
                </div>
              </div>

              {/* Paiement */}
              <div className={styles.detailBlock}>
                <div className={styles.detailBlockTitle}><CreditCard size={14} />Paiement</div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Référence SumUp</span>
                  <span className={styles.detailVal}>{order.sumup_checkout_id || '—'}</span>
                </div>
              </div>

              {/* Expédition */}
              <div className={styles.detailBlock}>
                <div className={styles.detailBlockTitle}><Truck size={14} />Expédition</div>

                {/* Bordereau déjà créé */}
                {order.sendcloud_parcel_id ? (
                  <div className={styles.parcelCreated}>
                    <CheckCircle size={14} />
                    Bordereau créé (#{order.sendcloud_parcel_id})
                  </div>
                ) : (
                  <>
                    {parcelError && (
                      <div className={shared.errorBanner}><AlertCircle size={14} />{parcelError}</div>
                    )}
                    {parcelSuccess && (
                      <div className={shared.successBanner}>
                        <CheckCircle size={14} />Bordereau créé. Numéro de suivi : {parcelSuccess.trackingNumber || '—'}
                      </div>
                    )}
                    {shippingLoading ? (
                      <div className={styles.trackingHint}>Chargement des méthodes de livraison…</div>
                    ) : shippingMethods.length === 0 ? (
                      <div className={styles.trackingHint}>Aucune méthode de livraison disponible.</div>
                    ) : (
                      <div className={styles.parcelForm}>
                        <select
                          className={`${shared.input} ${styles.methodSelect}`}
                          value={selectedMethod || ''}
                          onChange={(e) => setSelectedMethod(Number(e.target.value))}
                        >
                          {shippingMethods.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}{m.price > 0 ? ` — ${formatPrice(m.price)}` : ''}</option>
                          ))}
                        </select>
                        <button
                          className={shared.btnPrimary}
                          onClick={handleCreateParcel}
                          disabled={creatingParcel || !selectedMethod}
                        >
                          {creatingParcel ? 'Création…' : 'Créer le bordereau'}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Numéro de suivi manuel */}
                {trackingError && (
                  <div className={shared.errorBanner}><AlertCircle size={14} />{trackingError}</div>
                )}
                {trackingSuccess && (
                  <div className={shared.successBanner}><CheckCircle size={14} />Numéro de suivi enregistré. Statut → Expédiée.</div>
                )}
                <div className={styles.trackingForm}>
                  <input
                    type="text"
                    className={`${shared.input} ${styles.trackingInput}`}
                    placeholder="Ex : 6A12345678901"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                  />
                  <button
                    className={shared.btnPrimary}
                    onClick={handleSaveTracking}
                    disabled={savingTracking || !trackingInput.trim()}
                  >
                    {savingTracking ? 'Enregistrement…' : order.tracking_number ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>

                {order.label_url && (
                  <a href={order.label_url} target="_blank" rel="noopener noreferrer" className={styles.labelLink}>
                    <FileText size={14} />Télécharger l'étiquette PDF
                  </a>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Page principale ── */
const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const searchTimer = useRef(null);

  const load = useCallback((page = 1) => {
    setLoading(true);
    adminGetOrders({ page, status: filter || undefined, search: search || undefined })
      .then((data) => {
        setOrders(data.data || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => { load(1); }, [load]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(1), 400);
  };

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const data = await adminUpdateOrderStatus(orderId, newStatus);
      if (data.error) { showFeedback(data.error, 'error'); return; }
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      showFeedback('Statut mis à jour.');
    } catch {
      showFeedback('Une erreur est survenue.', 'error');
    }
  };

  return (
    <div className={shared.page}>
      <div className={shared.pageHeader}>
        <div>
          <h1 className={shared.title}>Commandes</h1>
          <p className={shared.subtitle}>{pagination.total} commande{pagination.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtres */}
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
        <select className={shared.filterSelect} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {feedback && (
        <div className={`${shared.feedback} ${shared[`feedback_${feedback.type}`]}`}>
          {feedback.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
          {feedback.msg}
        </div>
      )}

      {loading ? (
        <div className={shared.loading}>Chargement…</div>
      ) : orders.length === 0 ? (
        <div className={shared.empty}>Aucune commande trouvée.</div>
      ) : (
        <div className={shared.tableWrapper}>
          <table className={shared.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Changer le statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="#" className={shared.tdId}>#{order.id}</td>
                  <td data-label="Client">
                    <div className={shared.clientName}>{order.shipping_first_name} {order.shipping_last_name}</div>
                    <div className={shared.clientEmail}>{order.shipping_email}</div>
                  </td>
                  <td data-label="Date" className={shared.tdMuted}>{formatDate(order.created_at)}</td>
                  <td data-label="Total" className={shared.tdPrice}>{formatPrice(order.total_amount)}</td>
                  <td data-label="Statut">
                    <span className={`${shared.badge} ${shared[`badge_${STATUS_COLORS[order.status]}`]}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td data-label="Changer">
                    <select
                      className={shared.statusSelect}
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className={shared.tdActions}>
                    <button className={shared.iconBtn} onClick={() => setDetailId(order.id)} title="Voir le détail">
                      <Package size={15} />
                    </button>
                  </td>
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

      {detailId !== null && (
        <OrderDetail orderId={detailId} onClose={() => setDetailId(null)} />
      )}
    </div>
  );
};

export default AdminOrders;
