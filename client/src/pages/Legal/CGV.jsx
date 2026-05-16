import styles from './Legal.module.css';

const CGV = () => (
  <div className={styles.page}>
    <div className={styles.header}>
      <p className={styles.eyebrow}>Légal</p>
      <h1 className={styles.title}>Conditions Générales de Vente</h1>
      <p className={styles.updated}>Dernière mise à jour : <span className={styles.placeholder}>À COMPLÉTER</span></p>
    </div>

    <div className={styles.content}>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Objet</h2>
        <p className={styles.text}>
          Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits effectuées
          sur le site rif-line.com, exploité par <span className={styles.placeholder}>À COMPLÉTER</span>.
          Toute commande passée sur le site implique l'acceptation sans réserve des présentes CGV.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>2. Produits</h2>
        <p className={styles.text}>
          Les produits proposés à la vente sont ceux décrits sur le site au moment de la consultation
          par l'acheteur. Les photographies et descriptions sont fournies à titre indicatif et ne sont
          pas contractuelles. Nous nous réservons le droit de modifier notre catalogue à tout moment.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>3. Prix</h2>
        <p className={styles.text}>
          Les prix sont indiqués en euros, toutes taxes comprises (TTC). Nous nous réservons le droit
          de modifier nos prix à tout moment. Les produits sont facturés au prix en vigueur au moment
          de la validation de la commande. Les frais de livraison sont indiqués lors du processus
          de commande et ajoutés au prix des produits.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>4. Commande</h2>
        <p className={styles.text}>
          La commande est validée après confirmation du paiement. Un email de confirmation vous est
          envoyé à l'adresse indiquée lors de la commande. Nous nous réservons le droit d'annuler
          toute commande en cas de problème de stock, d'erreur de prix manifeste ou de suspicion de fraude.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>5. Paiement</h2>
        <p className={styles.text}>
          Le paiement s'effectue en ligne, de manière sécurisée. Les données bancaires sont chiffrées
          et ne transitent pas par nos serveurs. Nous n'avons jamais accès à vos informations de carte.
          La commande est expédiée uniquement après encaissement complet du paiement.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>6. Livraison</h2>
        <p className={styles.text}>
          Les commandes sont expédiées à l'adresse indiquée lors de la commande. Les délais de livraison
          sont donnés à titre indicatif et peuvent varier selon les transporteurs et les zones géographiques.
          Nous ne sommes pas responsables des retards imputables aux transporteurs ou à des circonstances
          indépendantes de notre volonté (grèves, intempéries, etc.).
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>7. Droit de rétractation</h2>
        <p className={styles.text}>
          Conformément à l'article L221-18 du Code de la consommation, vous disposez d'un délai de
          <strong> 14 jours</strong> à compter de la réception de votre commande pour exercer votre
          droit de rétractation, sans avoir à justifier de motif. Pour exercer ce droit, contactez-nous
          à : <strong>rifline.darifi@gmail.com</strong>. Les frais de retour sont à votre charge sauf
          indication contraire mentionnée sur le site.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>8. Retours et remboursements</h2>
        <p className={styles.text}>
          Les produits retournés doivent être dans leur état d'origine, non utilisés et dans leur
          emballage d'origine. Après réception et vérification du retour, le remboursement est effectué
          dans un délai de <strong>14 jours</strong> maximum, par le même moyen de paiement que celui
          utilisé lors de la commande.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>9. Garanties</h2>
        <p className={styles.text}>
          Tous les produits bénéficient de la garantie légale de conformité (articles L217-4 à L217-14
          du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 à 1648
          du Code civil). En cas de défaut, contactez-nous à : <strong>rifline.darifi@gmail.com</strong>
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>10. Droit applicable</h2>
        <p className={styles.text}>
          Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable
          sera recherchée en priorité. À défaut d'accord, les tribunaux français seront seuls compétents.
          Vous pouvez également recourir gratuitement au médiateur de la consommation.
        </p>
      </div>

    </div>
  </div>
);

export default CGV;
