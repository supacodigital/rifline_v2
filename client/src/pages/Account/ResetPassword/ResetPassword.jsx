import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { resetPassword } from '../../../services/auth.service';
import Button from '../../../components/ui/Button';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) setError('Lien invalide. Refaites une demande de réinitialisation.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await resetPassword({ token, password });
      if (data.error) { setError(data.error); return; }
      setDone(true);
      setTimeout(() => navigate('/compte/connexion'), 3000);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <KeyRound size={24} />
        </div>

        {done ? (
          <>
            <div className={styles.successIcon}><CheckCircle size={20} /></div>
            <h1 className={styles.title}>Mot de passe modifié</h1>
            <p className={styles.sub}>
              Votre mot de passe a été réinitialisé avec succès.<br />
              Vous allez être redirigé vers la connexion…
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Nouveau mot de passe</h1>
            <p className={styles.sub}>Choisissez un nouveau mot de passe d'au moins 8 caractères.</p>

            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={14} />{error}
              </div>
            )}

            {token && (
              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="password">Nouveau mot de passe</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`${styles.input} ${styles.inputWithIcon}`}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
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
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirm">Confirmer le mot de passe</label>
                  <input
                    id="confirm"
                    type="password"
                    className={styles.input}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <Button type="submit" fullWidth size="lg" disabled={loading || !token}>
                  {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
                </Button>
              </form>
            )}

            <Link to="/compte/connexion" className={styles.back}>
              <ArrowLeft size={15} /> Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
