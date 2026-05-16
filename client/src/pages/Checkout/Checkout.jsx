import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Truck, ChevronLeft, ChevronRight, Lock, MapPin, Home } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createCheckout } from '../../services/orders.service';
import { useI18n } from '../../context/I18nContext';
import styles from './Checkout.module.css';

const FREE_SHIPPING_THRESHOLD = 60;

const getShippingMethods = (cartTotal) => {
  const isFree = parseFloat(cartTotal) >= FREE_SHIPPING_THRESHOLD;
  return [
    {
      id: 'colissimo',
      name: 'Colissimo',
      description: 'Livraison à domicile',
      delay: '2–4 jours ouvrés',
      price: isFree ? 0 : 5.90,
      type: 'home',
    },
    {
      id: 'mondial_relay',
      name: 'Mondial Relay',
      description: 'Point Relais',
      delay: '3–5 jours ouvrés',
      price: isFree ? 0 : 4.49,
      type: 'relay',
    },
  ];
};

const MondialRelayWidget = ({ postalCode, country, onSelect }) => {
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(null);
  const MR_KEY = import.meta.env.VITE_MONDIAL_RELAY_KEY || 'BDTEST13';

  useEffect(() => {
    if (!postalCode || postalCode.length < 4) return;

    const loadWidget = () => {
      if (!window.jQuery || !window.jQuery.fn.MR_ParcelShopPicker) return;
      const container = containerRef.current;
      if (!container) return;

      window.jQuery(container).MR_ParcelShopPicker({
        Target: '#mr-selected',
        TargetDisplay: '#mr-display',
        TargetCountry: country || 'FR',
        PostCode: postalCode,
        NbResults: 7,
        AutoSelect: false,
        Enseigne: MR_KEY,
        OnParcelShopSelected: (data) => {
          const relay = {
            id: data.ID,
            name: data.Nom,
            address: data.Adresse1,
            city: data.Ville,
            postalCode: data.CP,
            country: data.Pays,
          };
          setSelected(relay);
          onSelect(relay);
        },
      });
      setLoaded(true);
    };

    if (window.jQuery?.fn?.MR_ParcelShopPicker) {
      loadWidget();
      return;
    }

    const jq = document.createElement('script');
    jq.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js';
    jq.onload = () => {
      const mr = document.createElement('script');
      mr.src = 'https://widget.mondialrelay.com/parcelshop-picker/v4_0/plugin/jquery.mondialrelay.parcelshoppicker.min.js';
      mr.onload = loadWidget;
      document.head.appendChild(mr);
    };
    document.head.appendChild(jq);
  }, [postalCode, country]);

  return (
    <div className={styles.relayWidget}>
      <div ref={containerRef} id="mr-widget" className={styles.relayMap} />
      <input type="hidden" id="mr-selected" />
      <input type="hidden" id="mr-display" />
      {selected && (
        <div className={styles.relaySelected}>
          <MapPin size={14} />
          <div>
            <div className={styles.relayName}>{selected.name}</div>
            <div className={styles.relayAddress}>{selected.address}, {selected.postalCode} {selected.city}</div>
          </div>
        </div>
      )}
      {!loaded && postalCode?.length >= 4 && (
        <div className={styles.relayLoading}>Chargement de la carte…</div>
      )}
    </div>
  );
};

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

  const [step, setStep] = useState(0);
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
  const [selectedMethodId, setSelectedMethodId] = useState('colissimo');
  const [selectedRelay, setSelectedRelay] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hydrated && items.length === 0) navigate('/', { replace: true });
  }, [hydrated, items.length, navigate]);

  const shippingMethods = getShippingMethods(totalPrice);
  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId);
  const shippingCost = selectedMethod?.price || 0;
  const total = parseFloat(totalPrice) + shippingCost;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const isFree = parseFloat(totalPrice) >= FREE_SHIPPING_THRESHOLD;

  const fieldError = (field) => touched[field] ? VALIDATORS[field](form[field]) : null;
  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));
  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    const allTouched = Object.keys(VALIDATORS).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    if (Object.keys(VALIDATORS).some((f) => VALIDATORS[f](form[f]))) return;
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedMethodId === 'mondial_relay' && !selectedRelay) {
      setError('Veuillez sélectionner un point relais.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const shippingAddress = selectedMethodId === 'mondial_relay' && selectedRelay
        ? {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            address: selectedRelay.address,
            city: selectedRelay.city,
            postalCode: selectedRelay.postalCode,
            country: selectedRelay.country || form.country,
            relayId: selectedRelay.id,
            relayName: selectedRelay.name,
          }
        : {
            firstName: form.firstName, lastName: form.lastName,
            email: form.email, address: form.address,
            city: form.city, postalCode: form.postalCode,
            country: form.country, phone: form.phone,
          };

      const data = await createCheckout({
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddress,
        shippingMethodId: typeof selectedMethodId === 'number' ? selectedMethodId : null,
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

  const STEPS = [t('checkout.steps.0') || 'Livraison', t('checkout.steps.1') || 'Paiement'];

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Stepper */}
        <div className={styles.stepper}>
          {STEPS.map((label, i) => (
            <div key={label} className={styles.stepperItem}>
              <div className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ''} ${i < step ? styles.stepDotDone : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`${styles.stepLabel} ${i <= step ? styles.stepLabelActive : ''}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
            </div>
          ))}
        </div>

        <div className={styles.layout}>

          {/* Formulaire */}
          <div className={styles.formCol}>
            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            {/* Étape 1 — Adresse */}
            {step === 0 && (
              <form onSubmit={handleNextStep} noValidate>
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

                <div className={styles.formAction}>
                  <button type="submit" className={styles.submitBtn}>
                    {t('checkout.continue')}
                    <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            )}

            {/* Étape 2 — Mode de livraison */}
            {step === 1 && (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className={styles.sectionTitle}>{t('checkout.shippingMethod')}</h2>

                {isFree && (
                  <div className={styles.freeShippingBanner}>
                    🎉 {t('checkout.freeShippingApplied') || 'Livraison offerte pour votre commande !'}
                  </div>
                )}

                <div className={styles.shippingList}>
                  {shippingMethods.map((method) => (
                    <label key={method.id}
                      className={`${styles.shippingOption} ${selectedMethodId === method.id ? styles.shippingOptionSelected : ''}`}>
                      <input type="radio" name="shipping" value={method.id}
                        checked={selectedMethodId === method.id}
                        onChange={() => { setSelectedMethodId(method.id); setSelectedRelay(null); }}
                        className={styles.shippingRadio} />
                      <div className={styles.shippingIcon}>
                        {method.type === 'home' ? <Home size={18} /> : <MapPin size={18} />}
                      </div>
                      <div className={styles.shippingInfo}>
                        <div className={styles.shippingName}>{method.name}</div>
                        <div className={styles.shippingDelay}>{method.description} · {method.delay}</div>
                      </div>
                      <div className={`${styles.shippingPrice} ${method.price === 0 ? styles.shippingPriceFree : ''}`}>
                        {method.price === 0 ? t('checkout.free') : formatPrice(method.price)}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Widget Mondial Relay */}
                {selectedMethodId === 'mondial_relay' && (
                  <div className={styles.relaySection}>
                    <p className={styles.relayHint}>
                      Sélectionnez votre point relais à proximité de <strong>{form.postalCode} {form.city}</strong>
                    </p>
                    <MondialRelayWidget
                      postalCode={form.postalCode}
                      country={form.country}
                      onSelect={setSelectedRelay}
                    />
                    {!selectedRelay && (
                      <p className={styles.relayRequired}>Veuillez choisir un point relais sur la carte.</p>
                    )}
                  </div>
                )}

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(0)}>
                    <ChevronLeft size={16} />
                    {t('checkout.back')}
                  </button>
                  <button type="submit" className={styles.submitBtn}
                    disabled={loading || (selectedMethodId === 'mondial_relay' && !selectedRelay)}>
                    {loading ? t('checkout.redirecting') : (
                      <>
                        <Lock size={15} />
                        {t('checkout.pay') ? t('checkout.pay').replace('{{amount}}', formatPrice(total)) : `Payer ${formatPrice(total)}`}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
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
                <span>
                  {step === 0 ? '—' : shippingCost === 0
                    ? <span className={styles.free}>{t('checkout.free')}</span>
                    : formatPrice(shippingCost)
                  }
                </span>
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
