import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useI18n } from '../../../context/I18nContext';
import Button from '../../../components/ui/Button';
import styles from './Register.module.css';

const VALIDATORS = {
  firstName: (v) => !v.trim() ? 'Prénom requis.' : null,
  lastName: (v) => !v.trim() ? 'Nom requis.' : null,
  email: (v) => !v ? 'Email requis.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email invalide.' : null,
  password: (v) => {
    if (!v) return 'Mot de passe requis.';
    if (v.length < 8) return 'Minimum 8 caractères.';
    return null;
  },
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Faible', colorClass: styles.strengthWeak };
  if (score === 2) return { score: 2, label: 'Moyen', colorClass: styles.strengthFair };
  if (score === 3) return { score: 3, label: 'Correct', colorClass: styles.strengthGood };
  return { score: 4, label: 'Fort', colorClass: styles.strengthStrong };
};


const Register = () => {
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
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

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, password: true });

    const hasErrors = Object.keys(VALIDATORS).some((f) => VALIDATORS[f](form[f]));
    if (hasErrors) return;

    setError(null);
    setLoading(true);
    try {
      const data = await register(form);
      if (data.error || data.errors) {
        setError(data.error || data.errors[0]?.msg);
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
          <h2 className={styles.brandTitle}>{t('auth.registerBrandTitle')}</h2>
          <p className={styles.brandSub}>{t('auth.registerBrandSub')}</p>
        </div>

        <div className={styles.testimonial}>
          <p className={styles.testimonialText}>
            « J'ai créé mon compte en moins d'une minute. Depuis, je commande régulièrement et je suis toujours satisfait. »
          </p>
          <div className={styles.testimonialAuthor}>
            <div className={styles.testimonialAvatar}>TD</div>
            <div>
              <div className={styles.testimonialName}>Thomas D.</div>
              <div className={styles.testimonialRole}>Client depuis 2024</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className={styles.form}>
        <div className={styles.formInner}>
          <h1 className={styles.formTitle}>{t('auth.registerTitle')}</h1>
          <p className={styles.formSub}>{t('auth.registerSubtitle')}</p>

          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fields}>
              {/* Prénom / Nom */}
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="firstName">{t('auth.firstName')}</label>
                  <input
                    id="firstName"
                    type="text"
                    className={`${styles.input} ${fieldError('firstName') ? styles.inputError : touched.firstName && !fieldError('firstName') ? styles.inputSuccess : ''}`}
                    value={form.firstName}
                    onChange={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    placeholder="Jean"
                    autoComplete="given-name"
                    required
                  />
                  {fieldError('firstName') && (
                    <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('firstName')}</span>
                  )}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="lastName">{t('auth.lastName')}</label>
                  <input
                    id="lastName"
                    type="text"
                    className={`${styles.input} ${fieldError('lastName') ? styles.inputError : touched.lastName && !fieldError('lastName') ? styles.inputSuccess : ''}`}
                    value={form.lastName}
                    onChange={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    placeholder="Dupont"
                    autoComplete="family-name"
                    required
                  />
                  {fieldError('lastName') && (
                    <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('lastName')}</span>
                  )}
                </div>
              </div>

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
                  <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('email')}</span>
                )}
              </div>

              {/* Mot de passe + barre de force */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">{t('auth.password')}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`${styles.input} ${styles.inputWithIcon} ${fieldError('password') ? styles.inputError : touched.password && !fieldError('password') ? styles.inputSuccess : ''}`}
                    value={form.password}
                    onChange={handleChange('password')}
                    onBlur={handleBlur('password')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {form.password && (
                  <>
                    <div className={styles.strengthBar}>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`${styles.strengthSegment} ${i <= strength.score ? strength.colorClass : ''}`}
                        />
                      ))}
                    </div>
                    <span className={`${styles.strengthLabel} ${strength.colorClass}`}>
                      {strength.label}
                    </span>
                  </>
                )}

                {fieldError('password') && (
                  <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('password')}</span>
                )}
                {!fieldError('password') && !form.password && (
                  <span className={styles.fieldHint}>{t('auth.passwordHint')}</span>
                )}
              </div>
            </div>

            <div className={styles.submitBtn}>
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? t('auth.registering') : t('auth.registerBtn')}
              </Button>
            </div>
          </form>

          <p className={styles.formFooter}>
            {t('auth.hasAccount')} <Link to="/compte/connexion">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
