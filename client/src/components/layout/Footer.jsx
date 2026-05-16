import { Link } from 'react-router-dom';
import { useI18n } from '../../context/I18nContext';
import styles from './Footer.module.css';

const Footer = () => {
  const { t } = useI18n();
  return (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.brand}>
        <div className={styles.logo}>Rif<span>Line</span></div>
        <p>{t('footer.tagline')}</p>
        <div className={styles.social}>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={styles.socialLink}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.2 8.2 0 0 0 4.79 1.52V7.03a4.85 4.85 0 0 1-1.02-.34z"/>
            </svg>
          </a>
        </div>
      </div>
      <div className={styles.col}>
        <h4>{t('footer.catalogue')}</h4>
        <Link to="/catalogue">{t('footer.allProducts')}</Link>
        <Link to="/compte">{t('footer.myAccount')}</Link>
        <Link to="/compte/commandes">{t('footer.myOrders')}</Link>
      </div>
      <div className={styles.col}>
        <h4>{t('footer.legal')}</h4>
        <Link to="/mentions-legales">{t('footer.mentions')}</Link>
        <Link to="/cgv">{t('footer.terms')}</Link>
        <Link to="/confidentialite">{t('footer.privacy')}</Link>
      </div>
    </div>
    <div className={styles.bottom}>
      © {new Date().getFullYear()} RifLine — {t('footer.rights')}
    </div>
  </footer>
  );
};

export default Footer;
