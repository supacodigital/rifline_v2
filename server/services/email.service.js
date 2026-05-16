const nodemailer = require('nodemailer');

const isConfigured = () =>
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const formatPrice = (amount) =>
  parseFloat(amount).toFixed(2).replace('.', ',') + ' €';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const send = async (options) => {
  if (!isConfigured()) return;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"RifLine" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    ...options,
  });
};

exports.sendOrderConfirmation = async ({ order }) => {
  if (!isConfigured()) return;

  const to = order.shipping_email;
  if (!to) return;

  const itemsHtml = (order.items || []).map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center;">× ${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.unit_price * item.quantity)}</td>
    </tr>`).join('');

  const shippingLine = parseFloat(order.shipping_amount) === 0
    ? 'Gratuit'
    : formatPrice(order.shipping_amount);

  await send({
    to,
    subject: `Commande #${order.id} confirmée — RifLine`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0A0A0F;">
        <div style="background:#7C3AED;padding:32px 40px;">
          <h1 style="color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.04em;margin:0;">
            RifLine
          </h1>
        </div>
        <div style="padding:40px;">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Votre commande est confirmée !</h2>
          <p style="color:#50505F;margin:0 0 24px;">
            Bonjour ${order.shipping_first_name || ''},<br>
            Merci pour votre achat. Voici le récapitulatif de votre commande du ${formatDate(order.created_at)}.
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr>
                <th style="text-align:left;font-size:12px;color:#8C8CA1;font-weight:600;padding-bottom:8px;border-bottom:2px solid #E8E8EF;">Article</th>
                <th style="text-align:center;font-size:12px;color:#8C8CA1;font-weight:600;padding-bottom:8px;border-bottom:2px solid #E8E8EF;">Qté</th>
                <th style="text-align:right;font-size:12px;color:#8C8CA1;font-weight:600;padding-bottom:8px;border-bottom:2px solid #E8E8EF;">Prix</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <div style="text-align:right;border-top:2px solid #0A0A0F;padding-top:12px;margin-bottom:32px;">
            <span style="font-size:13px;color:#50505F;">Livraison : ${shippingLine}</span><br>
            <span style="font-size:18px;font-weight:900;letter-spacing:-0.03em;">Total : ${formatPrice(order.total_amount)}</span>
          </div>

          <div style="background:#F7F7FA;border-radius:10px;padding:20px;margin-bottom:32px;">
            <h3 style="font-size:13px;font-weight:700;margin:0 0 8px;">Adresse de livraison</h3>
            <p style="font-size:13px;color:#50505F;margin:0;line-height:1.6;">
              ${order.shipping_first_name} ${order.shipping_last_name}<br>
              ${order.shipping_address}<br>
              ${order.shipping_postal_code} ${order.shipping_city}<br>
              ${order.shipping_country}
            </p>
          </div>

          <p style="font-size:13px;color:#8C8CA1;text-align:center;margin:0;">
            Numéro de commande : <strong>#${order.id}</strong>
          </p>
        </div>
        <div style="background:#F7F7FA;padding:20px 40px;text-align:center;">
          <p style="font-size:12px;color:#8C8CA1;margin:0;">
            © RifLine — <a href="${process.env.APP_URL}" style="color:#7C3AED;">rif-line.com</a>
          </p>
        </div>
      </div>
    `,
  });
};

exports.sendShippingNotification = async ({ order, trackingNumber }) => {
  if (!isConfigured()) return;

  const to = order.shipping_email;
  if (!to || !trackingNumber) return;

  await send({
    to,
    subject: `Commande #${order.id} expédiée — RifLine`,
    html: `
      <div style="font-family:Inter,system-ui,sans-serif;max-width:600px;margin:0 auto;color:#0A0A0F;">
        <div style="background:#7C3AED;padding:32px 40px;">
          <h1 style="color:#fff;font-size:24px;font-weight:900;letter-spacing:-0.04em;margin:0;">
            RifLine
          </h1>
        </div>
        <div style="padding:40px;">
          <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">Votre commande est en route !</h2>
          <p style="color:#50505F;margin:0 0 24px;">
            Bonjour ${order.shipping_first_name || ''},<br>
            Votre commande <strong>#${order.id}</strong> a été expédiée.
          </p>

          <div style="background:#EDE9FE;border-left:4px solid #7C3AED;border-radius:0 10px 10px 0;padding:20px;margin-bottom:32px;">
            <p style="font-size:12px;font-weight:700;color:#7C3AED;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.04em;">
              Numéro de suivi
            </p>
            <p style="font-size:20px;font-weight:900;letter-spacing:-0.02em;margin:0;color:#0A0A0F;">
              ${trackingNumber}
            </p>
          </div>

          <p style="font-size:13px;color:#8C8CA1;text-align:center;">
            Suivez votre colis avec ce numéro auprès de votre transporteur.
          </p>
        </div>
        <div style="background:#F7F7FA;padding:20px 40px;text-align:center;">
          <p style="font-size:12px;color:#8C8CA1;margin:0;">
            © RifLine — <a href="${process.env.APP_URL}" style="color:#7C3AED;">rif-line.com</a>
          </p>
        </div>
      </div>
    `,
  });
};
