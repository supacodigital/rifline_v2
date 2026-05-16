import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import styles from './NotFound.module.css';

const NotFound = () => {
  const { t } = useI18n();
  return (
  <div className={styles.page}>
    <div className={styles.code}>404</div>
    <h1 className={styles.title}>{t('common.notFound')}</h1>
    <p className={styles.subtitle}>{t('notFound.subtitle')}</p>
    <div className={styles.actions}>
      <Link to="/" className={styles.btnPrimary}>
        <Home size={16} />
        {t('common.backHome')}
      </Link>
      <Link to="/catalogue" className={styles.btnOutline}>
        <Search size={16} />
        {t('nav.catalogue')}
      </Link>
    </div>
  </div>
  );
};

export default NotFound;
