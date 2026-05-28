import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, LayoutDashboard, Package, ClipboardList, LogOut, ChevronDown, LogIn, X, Globe, Check } from 'lucide-react';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { getCategories } from '../../services/products.service';
import styles from './Header.module.css';

const UserAvatar = ({ user }) => {
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .join('') || '?';
  return <span className={styles.avatar}>{initials}</span>;
};

const Header = ({ onCartOpen }) => {
  const { totalItems } = useCart();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { lang, setLang, currency, setCurrency, t, LANGUAGES, CURRENCIES } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const activeCategory = searchParams.get('category');
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) { setVisible(true); }
      else { setVisible(y < lastY.current); }
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const menuRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const mobileSearchRef = useRef(null);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const langRef = useRef(null);
  const currencyRef = useRef(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target)) setCurrencyOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);


  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(e.target.value.trim())}`);
      setSearchOpen(false);
    }
  };

  const handleSearchOpen = () => {
    setSearchOpen(true);
    setTimeout(() => mobileSearchRef.current?.focus(), 50);
  };

  return (
    <header className={`${styles.root} ${visible ? '' : styles.rootHidden}`}>
      {/* Barre principale */}
      <div className={styles.topBar}>
        <div className={styles.inner}>

          {/* Logo */}
          <Link to="/" className={styles.logo}>
            Rif<span>Line</span>
          </Link>

          {/* Recherche — desktop */}
          <div className={styles.searchWrapper}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('nav.search')}
              onKeyDown={handleSearch}
            />
          </div>

          {/* Sélecteurs langue + devise — pills interactives */}
          <div className={styles.localeSelectors}>
            {/* Langue */}
            <div className={styles.localePillWrapper} ref={langRef}>
              <button
                className={`${styles.localePill} ${langOpen ? styles.localePillActive : ''}`}
                onClick={() => { setLangOpen((v) => !v); setCurrencyOpen(false); }}
                aria-label={t('language.label')}
              >
                {LANGUAGES.find((l) => l.code === lang)?.flag} {lang.toUpperCase()}
                <ChevronDown size={12} />
              </button>
              {langOpen && (
                <div className={styles.localeDropdown}>
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      className={`${styles.localeDropdownItem} ${lang === l.code ? styles.localeDropdownItemActive : ''}`}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                    >
                      {lang === l.code && <Check size={13} />}
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Devise */}
            <div className={styles.localePillWrapper} ref={currencyRef}>
              <button
                className={`${styles.localePill} ${currencyOpen ? styles.localePillActive : ''}`}
                onClick={() => { setCurrencyOpen((v) => !v); setLangOpen(false); }}
                aria-label={t('currency.label')}
              >
                {CURRENCIES.find((c) => c.code === currency)?.symbol} {currency}
                <ChevronDown size={12} />
              </button>
              {currencyOpen && (
                <div className={styles.localeDropdown}>
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      className={`${styles.localeDropdownItem} ${currency === c.code ? styles.localeDropdownItemActive : ''}`}
                      onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                    >
                      {currency === c.code && <Check size={13} />}
                      {c.symbol} {c.code}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Loupe mobile */}
            <button className={`${styles.iconBtn} ${styles.searchBtn}`} onClick={handleSearchOpen} aria-label="Rechercher">
              <Search size={20} />
            </button>

            {/* Globe mobile — visible uniquement si non connecté */}
            {!isAuthenticated && (
              <button
                className={`${styles.iconBtn} ${styles.globeBtn}`}
                onClick={() => setLocaleOpen(true)}
                aria-label={t('language.label')}
              >
                <Globe size={20} />
              </button>
            )}

            {/* Panier */}
            <button className={`${styles.iconBtn} ${styles.cartBtn}`} onClick={onCartOpen} aria-label="Panier">
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </button>

            {/* Compte */}
            {isAuthenticated ? (
              <div className={styles.accountMenu} ref={menuRef}>
                <button
                  className={`${styles.accountBtn} ${menuOpen ? styles.accountBtnOpen : ''}`}
                  onClick={() => {
                    if (!menuOpen && menuRef.current) {
                      const r = menuRef.current.getBoundingClientRect();
                      setDropdownPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
                    }
                    setMenuOpen((v) => !v);
                  }}
                  aria-label="Mon compte"
                >
                  <UserAvatar user={user} />
                  <ChevronDown size={14} className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ''}`} />
                </button>

                {/* Dropdown desktop / Bottom sheet mobile via portal */}
                {menuOpen && createPortal(
                  <>
                    <div className={styles.mobileSheetOverlay} onClick={() => setMenuOpen(false)} />
                    <div
                      className={styles.dropdown}
                      style={window.innerWidth > 768 && dropdownPos
                        ? { top: dropdownPos.top, right: dropdownPos.right }
                        : undefined}
                    >
                      <div className={styles.dropdownHandle} />
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownName}>
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className={styles.dropdownEmail}>{user?.email}</div>
                      </div>
                      <div className={styles.dropdownDivider} />
                      <Link to="/compte" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                        <LayoutDashboard size={15} />
                        {t('nav.account')}
                      </Link>
                      <Link to="/compte/commandes" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                        <ClipboardList size={15} />
                        {t('nav.orders')}
                      </Link>
                      {isAdmin && (
                        <>
                          <div className={styles.dropdownDivider} />
                          <Link to="/admin" className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                            <Package size={15} />
                            {t('nav.admin')}
                          </Link>
                        </>
                      )}
                      <div className={styles.dropdownDivider} />
                      <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout}>
                        <LogOut size={15} />
                        {t('nav.logout')}
                      </button>
                      <div className={styles.dropdownDivider} />
                      <div className={styles.localeRow}>
                        <Globe size={14} className={styles.localeRowIcon} />
                        <select
                          className={styles.localeSelectSheet}
                          value={lang}
                          onChange={(e) => setLang(e.target.value)}
                          aria-label={t('language.label')}
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                          ))}
                        </select>
                        <select
                          className={styles.localeSelectSheet}
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          aria-label={t('currency.label')}
                        >
                          {CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            ) : (
              <Link to="/compte/connexion" className={styles.loginBtn}>
                <LogIn size={16} />
                <span className={styles.loginBtnText}>{t('nav.login')}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Barre de recherche mobile expansible */}
      {searchOpen && (
        <div className={styles.mobileSearch}>
          <Search size={16} className={styles.mobileSearchIcon} />
          <input
            ref={mobileSearchRef}
            type="search"
            className={styles.mobileSearchInput}
            placeholder={t('nav.search')}
            onKeyDown={handleSearch}
          />
          <button className={styles.mobileSearchClose} onClick={() => setSearchOpen(false)} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Bottom sheet langue/devise — visiteurs non connectés (mobile) */}
      {localeOpen && createPortal(
        <>
          <div className={styles.mobileSheetOverlay} onClick={() => setLocaleOpen(false)} />
          <div className={styles.localeSheet}>
            <div className={styles.dropdownHandle} />
            <div className={styles.localeSheetTitle}>
              <Globe size={16} />
              {t('language.label')} &amp; {t('currency.label')}
            </div>
            <div className={styles.localeSheetGroup}>
              <span className={styles.localeSheetLabel}>{t('language.label')}</span>
              <div className={styles.localeChips}>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    className={`${styles.localeChip} ${lang === l.code ? styles.localeChipActive : ''}`}
                    onClick={() => setLang(l.code)}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.localeSheetGroup}>
              <span className={styles.localeSheetLabel}>{t('currency.label')}</span>
              <div className={styles.localeChips}>
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    className={`${styles.localeChip} ${currency === c.code ? styles.localeChipActive : ''}`}
                    onClick={() => setCurrency(c.code)}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Barre de navigation — desktop */}
      <nav className={styles.navBar}>
        <div className={styles.navInner}>
          <Link
            to="/catalogue"
            className={`${styles.navLink} ${location.pathname === '/catalogue' && !activeCategory ? styles.navLinkActive : ''}`}
          >
            {t('nav.catalogue')}
          </Link>

          {categories
            .filter((c) => !c.parent_id)
            .map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogue?category=${cat.slug}`}
                className={`${styles.navLink} ${activeCategory === cat.slug ? styles.navLinkActive : ''}`}
              >
                {cat.name}
              </Link>
            ))}
        </div>
      </nav>

    </header>
  );
};

export default Header;
