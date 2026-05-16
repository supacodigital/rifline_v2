import styles from './Legal.module.css';

const MentionsLegales = () => (
  <div className={styles.page}>
    <div className={styles.header}>
      <p className={styles.eyebrow}>Légal</p>
      <h1 className={styles.title}>Mentions légales</h1>
      <p className={styles.updated}>Dernière mise à jour : <span className={styles.placeholder}>À COMPLÉTER</span></p>
    </div>

    <div className={styles.content}>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Éditeur du site</h2>
        <div className={styles.infoBlock}>
          <p><strong>Raison sociale / Nom :</strong> <span className={styles.placeholder}>À COMPLÉTER</span></p>
          <p><strong>Statut juridique :</strong> <span className={styles.placeholder}>À COMPLÉTER</span></p>
          <p><strong>SIRET / RCS :</strong> <span className={styles.placeholder}>À COMPLÉTER</span></p>
          <p><strong>Adresse :</strong> <span className={styles.placeholder}>À COMPLÉTER</span></p>
          <p><strong>Email :</strong> rifline.darifi@gmail.com</p>
          <p><strong>Téléphone :</strong> +33 7 67 74 52 01</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Hébergeur</h2>
        <div className={styles.infoBlock}>
          <p><strong>Société :</strong> O2switch</p>
          <p><strong>Forme juridique :</strong> SARL au capital de 100 000 €</p>
          <p><strong>Adresse :</strong> Chem. des Pardiaux, 63000 Clermont-Ferrand</p>
          <p><strong>Téléphone :</strong> 04 44 44 60 40</p>
          <p><strong>Site :</strong> www.o2switch.fr</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Propriété intellectuelle</h2>
        <p className={styles.text}>
          L'ensemble des contenus présents sur le site rif-line.com (textes, images, logos, icônes, etc.)
          sont la propriété exclusive de <span className={styles.placeholder}>À COMPLÉTER</span>, sauf mentions contraires.
          Toute reproduction, représentation, modification ou exploitation, totale ou partielle, de ces contenus
          est interdite sans autorisation écrite préalable.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Responsabilité</h2>
        <p className={styles.text}>
          <span className={styles.placeholder}>À COMPLÉTER</span> s'efforce de maintenir les informations
          publiées sur le site aussi précises et à jour que possible. Toutefois, nous ne pouvons garantir
          l'exactitude, l'exhaustivité ou l'actualité des informations diffusées. L'utilisateur reconnaît
          utiliser ces informations sous sa propre responsabilité.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Contact</h2>
        <p className={styles.text}>
          Pour toute question relative au site ou à son contenu, vous pouvez nous contacter à l'adresse
          suivante : <strong>rifline.darifi@gmail.com</strong>
        </p>
      </div>

    </div>
  </div>
);

export default MentionsLegales;
