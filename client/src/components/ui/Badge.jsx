import styles from './Badge.module.css';

const Badge = ({ children, variant = 'accent' }) => (
  <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
);

export default Badge;
