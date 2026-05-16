import styles from './Legal.module.css';

const Confidentialite = () => (
  <div className={styles.page}>
    <div className={styles.header}>
      <p className={styles.eyebrow}>Légal</p>
      <h1 className={styles.title}>Politique de confidentialité</h1>
      <p className={styles.updated}>Dernière mise à jour : <span className={styles.placeholder}>À COMPLÉTER</span></p>
    </div>

    <div className={styles.content}>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Responsable du traitement</h2>
        <div className={styles.infoBlock}>
          <p><strong>Identité :</strong> <span className={styles.placeholder}>À COMPLÉTER</span></p>
          <p><strong>Adresse :</strong> <span className={styles.placeholder}>À COMPLÉTER</span></p>
          <p><strong>Email :</strong> rifline.darifi@gmail.com</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Données collectées</h2>
        <p className={styles.text}>Nous collectons uniquement les données nécessaires au traitement de vos commandes :</p>
        <ul className={styles.list}>
          <li>Nom, prénom</li>
          <li>Adresse email</li>
          <li>Adresse postale de livraison</li>
          <li>Numéro de téléphone</li>
          <li>Historique des commandes</li>
        </ul>
        <p className={styles.text}>
          Nous ne collectons aucune donnée bancaire — le paiement est intégralement géré par notre
          prestataire de paiement sécurisé. Nous n'utilisons aucun cookie de tracking ou d'analyse.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Finalités du traitement</h2>
        <p className={styles.text}>Vos données sont utilisées exclusivement pour :</p>
        <ul className={styles.list}>
          <li>Traiter et expédier vos commandes</li>
          <li>Gérer votre compte client</li>
          <li>Vous envoyer les confirmations de commande et de livraison</li>
          <li>Répondre à vos demandes de service après-vente</li>
          <li>Respecter nos obligations légales et comptables</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Base légale</h2>
        <p className={styles.text}>
          Le traitement de vos données est fondé sur l'exécution du contrat de vente (article 6.1.b
          du RGPD) et le respect de nos obligations légales (article 6.1.c du RGPD).
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Durée de conservation</h2>
        <ul className={styles.list}>
          <li><strong>Données de compte :</strong> jusqu'à la suppression du compte ou 3 ans d'inactivité</li>
          <li><strong>Données de commande :</strong> 10 ans (obligation légale comptable)</li>
          <li><strong>Données de facturation :</strong> 10 ans (Code de commerce)</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Destinataires des données</h2>
        <p className={styles.text}>
          Vos données sont transmises uniquement aux tiers nécessaires à l'exécution de votre commande :
        </p>
        <ul className={styles.list}>
          <li><strong>Transporteurs</strong> — pour la livraison (nom, adresse, téléphone)</li>
          <li><strong>Prestataire de paiement</strong> — pour la sécurisation du paiement</li>
          <li><strong>Hébergeur O2switch</strong> — pour le stockage des données sur des serveurs situés en France</li>
        </ul>
        <p className={styles.text}>
          Aucune donnée n'est vendue ou transmise à des tiers à des fins commerciales ou publicitaires.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Vos droits</h2>
        <p className={styles.text}>
          Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :
        </p>
        <ul className={styles.list}>
          <li><strong>Droit d'accès</strong> — obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> — demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> — vous opposer à un traitement</li>
          <li><strong>Droit à la limitation</strong> — restreindre le traitement de vos données</li>
        </ul>
        <p className={styles.text}>
          Pour exercer ces droits, contactez-nous à : <strong>rifline.darifi@gmail.com</strong>.
          Nous nous engageons à répondre dans un délai de 30 jours. En cas de réponse insatisfaisante,
          vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (www.cnil.fr).
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Sécurité</h2>
        <p className={styles.text}>
          Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
          vos données contre tout accès non autorisé, perte ou divulgation : connexion chiffrée (HTTPS/SSL),
          mots de passe hachés, accès restreint aux données.
        </p>
      </div>

    </div>
  </div>
);

export default Confidentialite;
