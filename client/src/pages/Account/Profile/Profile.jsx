import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../services/api';
import Button from '../../../components/ui/Button';
import styles from './Profile.module.css';

const VALIDATORS = {
  firstName: (v) => !v.trim() ? 'Prénom requis.' : null,
  lastName: (v) => !v.trim() ? 'Nom requis.' : null,
  email: (v) => !v ? 'Email requis.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email invalide.' : null,
  phone: () => null,
};

const PWD_VALIDATORS = {
  currentPassword: (v) => !v ? 'Mot de passe actuel requis.' : null,
  newPassword: (v) => !v ? 'Nouveau mot de passe requis.' : v.length < 8 ? 'Minimum 8 caractères.' : null,
};

const Profile = () => {
  const { user, login } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [touched, setTouched] = useState({});
  const [profileStatus, setProfileStatus] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwdTouched, setPwdTouched] = useState({});
  const [pwdStatus, setPwdStatus] = useState(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const fieldError = (field) => touched[field] ? VALIDATORS[field](form[field]) : null;
  const pwdFieldError = (field) => pwdTouched[field] ? PWD_VALIDATORS[field](pwdForm[field]) : null;

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (profileStatus) setProfileStatus(null);
  };

  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setTouched({ firstName: true, lastName: true, email: true, phone: true });
    const hasErrors = Object.keys(VALIDATORS).some((f) => VALIDATORS[f](form[f]));
    if (hasErrors) return;

    setProfileLoading(true);
    setProfileStatus(null);
    try {
      const res = await api.put('/auth/profile', form);
      const data = await res.json();
      if (data.error) {
        setProfileStatus({ type: 'error', message: data.error });
      } else {
        setProfileStatus({ type: 'success', message: 'Profil mis à jour.' });
      }
    } catch {
      setProfileStatus({ type: 'error', message: 'Une erreur est survenue.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setPwdTouched({ currentPassword: true, newPassword: true });
    const hasErrors = Object.keys(PWD_VALIDATORS).some((f) => PWD_VALIDATORS[f](pwdForm[f]));
    if (hasErrors) return;

    setPwdLoading(true);
    setPwdStatus(null);
    try {
      const res = await api.put('/auth/password', pwdForm);
      const data = await res.json();
      if (data.error) {
        setPwdStatus({ type: 'error', message: data.error });
      } else {
        setPwdStatus({ type: 'success', message: 'Mot de passe modifié.' });
        setPwdForm({ currentPassword: '', newPassword: '' });
        setPwdTouched({});
      }
    } catch {
      setPwdStatus({ type: 'error', message: 'Une erreur est survenue.' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/compte" className={styles.back}>
        <ChevronLeft size={16} />
        Mon compte
      </Link>

      <h1 className={styles.title}>Mon profil</h1>
      <p className={styles.subtitle}>Gérez vos informations personnelles</p>

      <div className={styles.sections}>
        {/* Informations personnelles */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informations personnelles</h2>

          {profileStatus && (
            <div className={`${styles.statusBanner} ${styles[profileStatus.type]}`}>
              {profileStatus.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              {profileStatus.message}
            </div>
          )}

          <form onSubmit={handleSubmitProfile} noValidate>
            <div className={styles.fields}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="firstName">Prénom</label>
                  <input
                    id="firstName"
                    type="text"
                    className={`${styles.input} ${fieldError('firstName') ? styles.inputError : touched.firstName && !fieldError('firstName') ? styles.inputSuccess : ''}`}
                    value={form.firstName}
                    onChange={handleChange('firstName')}
                    onBlur={handleBlur('firstName')}
                    autoComplete="given-name"
                  />
                  {fieldError('firstName') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('firstName')}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="lastName">Nom</label>
                  <input
                    id="lastName"
                    type="text"
                    className={`${styles.input} ${fieldError('lastName') ? styles.inputError : touched.lastName && !fieldError('lastName') ? styles.inputSuccess : ''}`}
                    value={form.lastName}
                    onChange={handleChange('lastName')}
                    onBlur={handleBlur('lastName')}
                    autoComplete="family-name"
                  />
                  {fieldError('lastName') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('lastName')}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={`${styles.input} ${fieldError('email') ? styles.inputError : touched.email && !fieldError('email') ? styles.inputSuccess : ''}`}
                  value={form.email}
                  onChange={handleChange('email')}
                  onBlur={handleBlur('email')}
                  autoComplete="email"
                />
                {fieldError('email') && <span className={styles.fieldError}><AlertCircle size={11} />{fieldError('email')}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">Téléphone <span className={styles.optional}>(optionnel)</span></label>
                <input
                  id="phone"
                  type="tel"
                  className={styles.input}
                  value={form.phone}
                  onChange={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                  placeholder="06 00 00 00 00"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className={styles.formFooter}>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </section>

        {/* Mot de passe */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mot de passe</h2>

          {pwdStatus && (
            <div className={`${styles.statusBanner} ${styles[pwdStatus.type]}`}>
              {pwdStatus.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
              {pwdStatus.message}
            </div>
          )}

          <form onSubmit={handleSubmitPassword} noValidate>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="currentPassword">Mot de passe actuel</label>
                <input
                  id="currentPassword"
                  type="password"
                  className={`${styles.input} ${pwdFieldError('currentPassword') ? styles.inputError : ''}`}
                  value={pwdForm.currentPassword}
                  onChange={(e) => { setPwdForm((f) => ({ ...f, currentPassword: e.target.value })); if (pwdStatus) setPwdStatus(null); }}
                  onBlur={() => setPwdTouched((t) => ({ ...t, currentPassword: true }))}
                  autoComplete="current-password"
                />
                {pwdFieldError('currentPassword') && <span className={styles.fieldError}><AlertCircle size={11} />{pwdFieldError('currentPassword')}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  id="newPassword"
                  type="password"
                  className={`${styles.input} ${pwdFieldError('newPassword') ? styles.inputError : ''}`}
                  value={pwdForm.newPassword}
                  onChange={(e) => { setPwdForm((f) => ({ ...f, newPassword: e.target.value })); if (pwdStatus) setPwdStatus(null); }}
                  onBlur={() => setPwdTouched((t) => ({ ...t, newPassword: true }))}
                  placeholder="Minimum 8 caractères"
                  autoComplete="new-password"
                />
                {pwdFieldError('newPassword') && <span className={styles.fieldError}><AlertCircle size={11} />{pwdFieldError('newPassword')}</span>}
              </div>
            </div>

            <div className={styles.formFooter}>
              <Button type="submit" disabled={pwdLoading}>
                {pwdLoading ? 'Modification…' : 'Modifier le mot de passe'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
