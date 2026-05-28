import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../../services/auth.service';
import Button from '../../../components/ui/Button';
import styles from './ForgotPassword.module.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email requis.'); return; }
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email);
      setSent(true);
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
          <Mail size={24} />
        </div>

        {sent ? (
          <>
            <div className={styles.successIcon}><CheckCircle size={20} /></div>
            <h1 className={styles.title}>Email envoyé</h1>
            <p className={styles.sub}>
              Si un compte existe avec <strong>{email}</strong>, vous recevrez un lien de réinitialisation dans quelques minutes.
              Pensez à vérifier vos spams.
            </p>
            <Link to="/compte/connexion" className={styles.back}>
              <ArrowLeft size={15} /> Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <h1 className={styles.title}>Mot de passe oublié ?</h1>
            <p className={styles.sub}>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            {error && (
              <div className={styles.errorBanner}>
                <AlertCircle size={14} />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" fullWidth size="lg" disabled={loading}>
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
            </form>

            <Link to="/compte/connexion" className={styles.back}>
              <ArrowLeft size={15} /> Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
