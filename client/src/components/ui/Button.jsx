import styles from './Button.module.css';

const Button = ({ children, variant = 'primary', size = 'md', fullWidth = false, disabled = false, onClick, type = 'button', className = '' }) => {
  const classes = [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    fullWidth ? styles.full : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
