import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import Button from '../../../components/ui/Button';
import styles from './Login.module.css';

const VALIDATORS = {
  email: (v) => !v ? 'Email requis.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email invalide.' : null,
  password: (v) => !v ? 'Mot de passe requis.' : null,
};

const Login = () => {
  const { login } = useAuth();
  const { t } = useI18n();

  const VALIDATORS = {
    email: (v) => !v ? t('auth.errors.email') : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? t('auth.errors.emailInvalid') : null,
    password: (v) => !v ? t('auth.errors.password') : null,
  };
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fieldError = (field) => touched[field] ? VALIDATORS[field](form[field]) : null;

  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const hasErrors = Object.keys(VALIDATORS).some((f) => VALIDATORS[f](form[f]));
    if (hasErrors) return;

    setError(null);
    setLoading(true);
    try {
      const data = await login(form);
      if (data.error) {
        setError(data.error);
      } else {
        navigate('/compte');
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Panneau gauche — branding */}
      <div className={styles.brand}>
        <div className={styles.brandBg} />
        <div className={styles.brandLogo}>Rif<span>Line</span></div>

        <div className={styles.brandContent}>
          <h2 className={styles.brandTitle}>{t('auth.loginBrandTitle')}</h2>
          <p className={styles.brandSub}>{t('auth.loginBrandSub')}</p>
        </div>

        <div className={styles.testimonial}>
          <p className={styles.testimonialText}>
            « Livraison ultra rapide et service client impeccable. Je recommande RifLine à tous mes proches. »
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.testimonialAvatar}>ML</div>
            <div>
              <div className={styles.testimonialName}>Marie L.</div>
              <div className={styles.testimonialRole}>Cliente depuis 2023</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className={styles.form}>
        <div className={styles.formInner}>
          <h1 className={styles.formTitle}>{t('auth.loginTitle')}</h1>
          <p className={styles.formSub}>{t('auth.loginSubtitle')}</p>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              {/* Email */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">{t('auth.email')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="email"
                    type="email"
                    className={`${styles.input} ${fieldError('email') ? styles.inputError : touched.email && !fieldError('email') ? styles.inputSuccess : ''}`}
                    value={form.email}
                    onChange={handleChange('email')}
                    onBlur={handleBlur('email')}
                    placeholder="vous@exemple.com"
                    autoComplete="email"
                    required
                  />
                </div>
                {fieldError('email') && (
                  <span className={styles.fieldError}>
                    <AlertCircle size={11} />{fieldError('email')}
                  </span>
                )}
              </div>

              {/* Mot de passe */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">{t('auth.password')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${styles.inputWithIcon} ${fieldError('password') ? styles.inputError : ''}`}
                    value={form.password}
                    onChange={handleChange('password')}
                    onBlur={handleBlur('password')}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldError('password') && (
                  <span className={styles.fieldError}>
                    <AlertCircle size={11} />{fieldError('password')}
                  </span>
                )}
                <Link to="/compte/mot-de-passe-oublie" className={styles.forgotLink}>Mot de passe oublié ?</Link>
              </div>
            </div>

            <div className={styles.submitBtn}>
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? t('auth.loading') : t('auth.loginBtn')}
              </Button>
            </div>
          </form>

          <p className={styles.formFooter}>
            {t('auth.noAccount')} <Link to="/compte/inscription">{t('auth.signUp')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
