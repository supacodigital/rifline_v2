// Script de diagnostic SMTP.
// Usage sur le serveur (depuis le dossier server/) :
//   node scripts/test-email.js                  → vérifie la connexion SMTP
//   node scripts/test-email.js destinataire@x.fr → envoie un email de test
//
// À lancer dans le même environnement que l'app (variables cPanel chargées).
require('dotenv').config();
const emailService = require('../services/email.service');

const mask = (v) => (v ? `${String(v).slice(0, 2)}***` : '(vide)');

(async () => {
  console.log('--- Configuration SMTP détectée ---');
  console.log('SMTP_HOST  :', process.env.SMTP_HOST || '(vide)');
  console.log('SMTP_PORT  :', process.env.SMTP_PORT || '(587 par défaut)');
  console.log('SMTP_SECURE:', process.env.SMTP_SECURE || '(false par défaut)');
  console.log('SMTP_USER  :', mask(process.env.SMTP_USER));
  console.log('SMTP_PASS  :', mask(process.env.SMTP_PASS));
  console.log('SMTP_FROM  :', process.env.SMTP_FROM || '(SMTP_USER par défaut)');
  console.log('-----------------------------------\n');

  console.log('Test de connexion SMTP en cours…');
  const result = await emailService.verifyConnection();
  console.log(result.ok ? '✅' : '❌', result.message, '\n');

  if (!result.ok) {
    process.exit(1);
  }

  const to = process.argv[2];
  if (!to) {
    console.log('Aucun destinataire fourni : connexion OK, pas d\'email de test envoyé.');
    console.log('Pour envoyer un test : node scripts/test-email.js votre@email.fr');
    process.exit(0);
  }

  console.log(`Envoi d'un email de test à ${to}…`);
  try {
    // On réutilise le template de réinitialisation comme simple email de test
    await emailService.sendPasswordReset({
      email: to,
      resetUrl: `${process.env.APP_URL || 'https://rif-line.com'}/test`,
    });
    console.log('✅ Email de test envoyé. Vérifiez la boîte de réception (et les spams).');
  } catch (err) {
    console.error('❌ Échec de l\'envoi :', err.message);
    process.exit(1);
  }
})();
