import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Home } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createCheckout } from '../../services/orders.service';
import { useI18n } from '../../context/I18nContext';
import styles from './Checkout.module.css';

// Livraison standard unique (montant fixe, pas de seuil de gratuité).
const SHIPPING_COST = 5.90;

const VALIDATORS = {
  firstName:  (v) => !v.trim() ? 'Prénom requis.' : null,
  lastName:   (v) => !v.trim() ? 'Nom requis.' : null,
  email:      (v) => !v ? 'Email requis.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email invalide.' : null,
  address:    (v) => !v.trim() ? 'Adresse requise.' : null,
  city:       (v) => !v.trim() ? 'Ville requise.' : null,
  postalCode: (v) => !v.trim() ? 'Code postal requis.' : null,
  phone:      (v) => !v.trim() ? 'Téléphone requis.' : null,
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, hydrated, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice, t } = useI18n();

  const [form, setForm] = useState({
    firstName:  user?.firstName || '',
    lastName:   user?.lastName  || '',
    email:      user?.email     || '',
    address:    '',
    city:       '',
    postalCode: '',
    country:    'FR',
    phone:      user?.phone     || '',
  });
  const [touched, setTouched] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && items.length === 0) navigate('/', { replace: true });
  }, [hydrated, items.length, navigate]);

  const shippingCost = SHIPPING_COST;
  const total = parseFloat(totalPrice) + shippingCost;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const fieldError = (field) => touched[field] ? VALIDATORS[field](form[field]) : null;
  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));
  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation de tous les champs avant de lancer le paiement.
    const allTouched = Object.keys(VALIDATORS).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    if (Object.keys(VALIDATORS).some((f) => VALIDATORS[f](form[f]))) return;

    setLoading(true);
    setError(null);
    try {
      const shippingAddress = {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, address: form.address,
        city: form.city, postalCode: form.postalCode,
        country: form.country, phone: form.phone,
      };

      const data = await createCheckout({
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress,
        shippingMethodId: null,
        shippingAmount: shippingCost,
      });
      if (data.error) { setError(data.error); return; }
      if (data.checkoutUrl) {
        if (data.guestToken) {
          sessionStorage.setItem('guestOrderToken', data.guestToken);
        }
        clearCart();
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.layout}>

          {/* Formulaire */}
          <div className={styles.formCol}>
            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <h2 className={styles.sectionTitle}>{t('checkout.address')}</h2>
              <div className={styles.fields}>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="firstName">{t('checkout.firstName')}</label>
                      <input id="firstName" type="text"
                        className={`${styles.input} ${fieldError('firstName') ? styles.inputError : ''}`}
                        value={form.firstName} onChange={handleChange('firstName')} onBlur={handleBlur('firstName')}
                        autoComplete="given-name" />
                      {fieldError('firstName') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('firstName')}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="lastName">{t('checkout.lastName')}</label>
                      <input id="lastName" type="text"
                        className={`${styles.input} ${fieldError('lastName') ? styles.inputError : ''}`}
                        value={form.lastName} onChange={handleChange('lastName')} onBlur={handleBlur('lastName')}
                        autoComplete="family-name" />
                      {fieldError('lastName') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('lastName')}</span>}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="email">{t('checkout.email')}</label>
                    <input id="email" type="email"
                      className={`${styles.input} ${fieldError('email') ? styles.inputError : ''}`}
                      value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')}
                      autoComplete="email" />
                    {fieldError('email') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('email')}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="phone">{t('checkout.phone')}</label>
                    <input id="phone" type="tel"
                      className={`${styles.input} ${fieldError('phone') ? styles.inputError : ''}`}
                      value={form.phone} onChange={handleChange('phone')} onBlur={handleBlur('phone')}
                      placeholder="06 00 00 00 00" autoComplete="tel" />
                    {fieldError('phone') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('phone')}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="address">{t('checkout.addressField')}</label>
                    <input id="address" type="text"
                      className={`${styles.input} ${fieldError('address') ? styles.inputError : ''}`}
                      value={form.address} onChange={handleChange('address')} onBlur={handleBlur('address')}
                      placeholder="12 rue de la Paix" autoComplete="street-address" />
                    {fieldError('address') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('address')}</span>}
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="postalCode">{t('checkout.postalCode')}</label>
                      <input id="postalCode" type="text"
                        className={`${styles.input} ${fieldError('postalCode') ? styles.inputError : ''}`}
                        value={form.postalCode} onChange={handleChange('postalCode')} onBlur={handleBlur('postalCode')}
                        placeholder="75001" autoComplete="postal-code" />
                      {fieldError('postalCode') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('postalCode')}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="city">{t('checkout.city')}</label>
                      <input id="city" type="text"
                        className={`${styles.input} ${fieldError('city') ? styles.inputError : ''}`}
                        value={form.city} onChange={handleChange('city')} onBlur={handleBlur('city')}
                        placeholder="Paris" autoComplete="address-level2" />
                      {fieldError('city') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('city')}</span>}
                    </div>
                  </div>
                </div>

              <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>{t('checkout.shippingMethod')}</h2>

              <div className={styles.shippingList}>
                <div className={`${styles.shippingOption} ${styles.shippingOptionSelected}`}>
                  <div className={styles.shippingIcon}>
                    <Home size={18} />
                  </div>
                  <div className={styles.shippingInfo}>
                    <div className={styles.shippingName}>Livraison standard</div>
                    <div className={styles.shippingDelay}>Livraison à domicile · 2–4 jours ouvrés</div>
                  </div>
                  <div className={styles.shippingPrice}>
                    {formatPrice(SHIPPING_COST)}
                  </div>
                </div>
              </div>

              <div className={styles.formAction}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? t('checkout.redirecting') : (
                    <>
                      <Lock size={15} />
                      {t('checkout.pay') ? t('checkout.pay').replace('{{amount}}', formatPrice(total)) : `Payer ${formatPrice(total)}`}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Résumé commande */}
          <aside className={styles.summary}>
            <h2 className={styles.summaryTitle}>
              {t('cart.title')} · {totalItems} {t('cart.items')}
            </h2>
            <div className={styles.summaryItems}>
              {items.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemInfo}>
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className={styles.summaryItemImg} />
                    )}
                    <div>
                      <div className={styles.summaryItemName}>{item.name}</div>
                      <div className={styles.summaryItemQty}>× {item.quantity}</div>
                    </div>
                  </div>
                  <span className={styles.summaryItemPrice}>{formatPrice(parseFloat(item.price) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className={styles.summaryTotals}>
              <div className={styles.summaryRow}>
                <span>{t('cart.subtotal')}</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>{t('cart.shipping')}</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryRowTotal}`}>
                <span className={styles.summaryRowTotalLabel}>{t('cart.total')}</span>
                <span className={styles.summaryRowTotalValue}>{formatPrice(total)}</span>
              </div>
            </div>
            <p className={styles.summaryNote}>
              {t('checkout.secureNote') || 'Paiement sécurisé SSL · Retours gratuits sous 30 jours'}
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
