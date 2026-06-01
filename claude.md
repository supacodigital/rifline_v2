# CLAUDE.md — Projet E-Commerce Client

> Fichier de référence pour Claude Code. À lire en priorité avant toute génération de code.

---

## 1. Vue d'ensemble du projet

Site e-commerce généraliste (tous types de produits) pour un client particulier.
Déployé sur **O2switch** (forfait cloud mutualisé) avec **Phusion Passenger** pour Node.js.

### Objectifs fonctionnels
- Catalogue produits multi-catégories
- Panier d'achat persistant
- Paiement via **SumUp** (Hosted Checkout)
- Livraison via **Sendcloud** (API REST multi-transporteurs)
- Espace client (inscription, connexion, suivi commandes)
- Back-office admin (gestion produits, commandes, stocks)

---

## 2. Stack technique

| Couche       | Technologie                            |
|--------------|----------------------------------------|
| Frontend     | React 18 + Vite                        |
| Styling      | CSS Modules (`.module.css`) exclusivement |
| Icônes       | `lucide-react` uniquement              |
| Backend      | Node.js + Express                      |
| Base de données | MySQL (raw SQL, pas d'ORM)          |
| Auth         | JWT (access token 15min + refresh token 7j httpOnly cookie) |
| Hash mdp     | `bcrypt`                               |
| Validation   | `express-validator`                    |
| Paiement     | SumUp Hosted Checkout API              |
| Livraison    | Sendcloud REST API                     |
| Hébergement  | O2switch cloud — Phusion Passenger     |
| Process manager | PM2 (développement uniquement)      |
| Reverse proxy | Nginx + Certbot (SSL)                 |

---

## 3. Conventions de code

### Langue
- **Commentaires** : français
- **Variables, fonctions, fichiers, classes** : anglais
- **Messages d'erreur utilisateur** : français
- **Logs console/serveur** : français

### React / Frontend
- Composants fonctionnels uniquement (pas de class components)
- Hooks React natifs (`useState`, `useEffect`, `useContext`, `useReducer`)
- CSS Modules **exclusivement** — jamais de styles inline, jamais de Tailwind, jamais de styled-components
- Toutes les couleurs et valeurs de design via **variables CSS custom properties** dans `:root`
- Jamais de `!important`
- Jamais de valeurs hardcodées (couleurs, espacements, breakpoints)
- `lucide-react` pour toutes les icônes — aucune autre librairie d'icônes

### Node.js / Backend
Architecture en couches stricte :
```
routes → controllers → services → repositories
```
- `routes/` : définition des endpoints Express, validation légère
- `controllers/` : gestion req/res, appel aux services
- `services/` : logique métier, appels APIs externes (SumUp, Sendcloud)
- `repositories/` : requêtes SQL directes, pas d'ORM

### Validation (express-validator)
- Utiliser `express-validator` dans les fichiers `routes/` pour valider les inputs entrants
- Toujours appeler `validationResult(req)` en début de controller et retourner 422 si erreurs
- Ne jamais faire confiance aux données du client dans les services ou repositories

### SQL
- Raw SQL uniquement — pas de Sequelize, pas de Prisma, pas de Knex
- Requêtes dans les fichiers `repositories/`
- Utiliser des requêtes préparées (paramètres `?`) pour prévenir les injections SQL
- Nommer les tables en snake_case au pluriel : `products`, `orders`, `order_items`, `users`
- Toujours sélectionner les colonnes explicitement — jamais de `SELECT *`
- Index à créer : `products.slug`, `products.category_id`, `orders.user_id`, `orders.status`

---

## 4. Structure du projet

```
/
├── client/                        # Frontend React + Vite
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/            # Composants réutilisables
│   │   │   ├── layout/            # Header, Footer, Nav
│   │   │   ├── product/           # ProductCard, ProductGrid, etc.
│   │   │   ├── cart/              # CartDrawer, CartItem, etc.
│   │   │   ├── checkout/          # CheckoutForm, OrderSummary
│   │   │   └── ui/                # Button, Input, Modal, Badge, etc.
│   │   ├── pages/                 # Pages = routes React Router
│   │   │   ├── Home/
│   │   │   ├── Catalog/
│   │   │   ├── ProductDetail/
│   │   │   ├── Cart/
│   │   │   ├── Checkout/
│   │   │   ├── OrderConfirmation/
│   │   │   ├── Account/           # Dashboard client
│   │   │   │   ├── Login/
│   │   │   │   ├── Register/
│   │   │   │   ├── Orders/        # Historique + suivi
│   │   │   │   └── Profile/
│   │   │   └── Admin/             # Back-office
│   │   │       ├── Dashboard/
│   │   │       ├── Products/
│   │   │       ├── Orders/
│   │   │       └── Users/
│   │   ├── context/               # CartContext, AuthContext
│   │   ├── hooks/                 # useCart, useAuth, useProducts, etc.
│   │   ├── services/              # Appels API vers le backend (fetch)
│   │   ├── styles/
│   │   │   └── globals.css        # Variables CSS globales (:root)
│   │   ├── utils/                 # Helpers (formatPrice, formatDate, etc.)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                        # Backend Node.js + Express
│   ├── config/
│   │   └── db.js                  # Connexion MySQL pool
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── products.routes.js
│   │   ├── orders.routes.js
│   │   ├── cart.routes.js
│   │   ├── payment.routes.js      # SumUp webhooks + checkout
│   │   ├── shipping.routes.js     # Sendcloud
│   │   └── admin.routes.js
│   ├── controllers/
│   ├── services/
│   │   ├── sumup.service.js       # Création checkout SumUp
│   │   └── sendcloud.service.js   # Création expédition Sendcloud
│   ├── repositories/
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Vérification JWT
│   │   ├── admin.middleware.js    # Vérification rôle admin
│   │   └── errorHandler.js
│   ├── utils/
│   └── index.js                   # Entry point Express
│
├── .env                           # Variables d'environnement (jamais committé)
├── .env.example                   # Template public
├── CLAUDE.md                      # Ce fichier
└── ecosystem.config.js            # Config PM2 (dev uniquement)
```

---

## 5. Variables d'environnement

```env
# Serveur
PORT=3000
NODE_ENV=production

# Base de données
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
DB_NAME=ecommerce_db

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=

# SumUp
SUMUP_API_KEY=                    # sk_live_XXXX ou sk_test_XXXX
SUMUP_MERCHANT_CODE=              # Code marchand SumUp
SUMUP_WEBHOOK_SECRET=             # Secret pour valider les webhooks

# Sendcloud
SENDCLOUD_PUBLIC_KEY=
SENDCLOUD_SECRET_KEY=

# App
APP_URL=https://rif-line.com   # URL publique du site (utilisée dans les redirects SumUp et le CORS)
```

---

## 6. Panier (localStorage)

Le panier est géré **exclusivement côté client** via `localStorage`. Pas de table `carts` en base de données.

### Comportement
- Stocké dans `localStorage` sous la clé `cart`
- Persistant entre les sessions (jusqu'à vidage manuel ou passage en commande)
- Fonctionne pour les invités et les utilisateurs connectés sans distinction
- À la validation du panier → les données sont envoyées au backend pour créer la commande

### CartContext (`context/CartContext.jsx`)
- Fournit : `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalPrice`, `totalItems`
- Synchronise l'état React avec `localStorage` via `useEffect`
- Vérifie le stock disponible au moment du checkout (appel `GET /api/products/:id` pour confirmer)

---

## 8. Intégration SumUp (Hosted Checkout)

### Flux de paiement
1. Le client valide son panier côté frontend
2. Le frontend envoie `POST /api/payment/create-checkout` avec les données de commande
3. Le backend crée un checkout SumUp via `POST https://api.sumup.com/v0.1/checkouts`
4. SumUp retourne un `hosted_checkout_url`
5. Le backend sauvegarde la commande en base avec statut `pending` + `checkout_id` SumUp
6. Le frontend redirige le client vers `hosted_checkout_url`
7. SumUp gère le paiement et redirige vers `redirect_url` (page de confirmation)
8. SumUp envoie un **webhook** sur `POST /api/payment/webhook`
9. Le backend vérifie le webhook, met à jour le statut de la commande → `paid`

### Création du checkout (sumup.service.js)
```js
const createSumUpCheckout = async ({ orderId, amount, currency, customerEmail }) => {
  const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUMUP_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      checkout_reference: `ORDER-${orderId}`,
      amount,
      currency: currency || 'EUR',
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description: `Commande #${orderId}`,
      return_url: `${process.env.APP_URL}/commande/confirmation?order=${orderId}`,
      hosted_checkout: { enabled: true },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`SumUp checkout échoué (${response.status}): ${error.message || 'erreur inconnue'}`);
  }

  return response.json();
};
```

### Webhook SumUp
- Endpoint : `POST /api/payment/webhook`
- Vérifier la signature du webhook avec `SUMUP_WEBHOOK_SECRET`
- Mettre à jour `orders.status` → `'processing'` (commande à préparer) si `event_type === 'CHECKOUT_COMPLETED'`
- **Pas de création d'expédition automatique** : l'étiquette n'est pas générée via l'API (voir section 9). L'admin expédie et saisit le suivi manuellement.

### Statuts commande
```
pending → paid → processing → shipped → delivered
                            ↘ cancelled / refunded
```

---

## 9. Intégration Sendcloud

> ⚠️ **Le client ne souscrit pas à l'abonnement Sendcloud** permettant la génération automatique des bordereaux/étiquettes via l'API.
> Sendcloud est utilisé **uniquement** pour récupérer et afficher les transporteurs et tarifs de livraison (`GET shipping_methods`, sans abonnement).
> La création de colis (`POST /api/v2/parcels`) et la génération d'étiquette via l'API **ne sont pas utilisées**. L'expédition et la saisie du numéro de suivi sont **manuelles** côté admin.

### Authentification
- Basic Auth : `SENDCLOUD_PUBLIC_KEY:SENDCLOUD_SECRET_KEY`
- Base URL : `https://panel.sendcloud.sc/api/v2/`

### Flux d'expédition (manuel)
1. Au checkout (et côté admin), `GET /api/v2/shipping_methods` sert à afficher les transporteurs/tarifs disponibles
2. Après paiement confirmé (webhook SumUp), la commande passe en statut `processing` (à préparer)
3. L'admin expédie la commande manuellement (étiquette générée hors API : panel Sendcloud, La Poste, etc.)
4. L'admin saisit le numéro de suivi via `PUT /api/admin/orders/:id/tracking` → enregistre `orders.tracking_number`, passe le statut à `shipped` et déclenche l'email de notification au client
5. Les colonnes `orders.label_url` et `orders.sendcloud_parcel_id` restent dans le schéma mais ne sont pas alimentées automatiquement

### Récupération méthodes de livraison (sendcloud.service.js)
```js
const getShippingMethods = async ({ weight, toCountry }) => {
  const auth = Buffer.from(
    `${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`
  ).toString('base64');

  const response = await fetch(
    `https://panel.sendcloud.sc/api/v2/shipping_methods?to_country=${toCountry}&weight=${weight}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  if (!response.ok) {
    throw new Error(`Sendcloud shipping_methods échoué (${response.status})`);
  }

  return response.json();
};
```

> Note : il n'existe **pas** de fonction `createParcel` / appel `POST /parcels` dans le service Sendcloud — la génération d'étiquette via l'API n'est pas utilisée (voir l'encadré en tête de section).

---

## 10. Schéma MySQL

```sql
-- Utilisateurs
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Catégories
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  parent_id INT DEFAULT NULL,
  description TEXT,
  image_url VARCHAR(500),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Produits
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) DEFAULT NULL, -- prix barré
  stock INT DEFAULT 0,
  weight DECIMAL(8, 3) DEFAULT 0, -- en kg pour Sendcloud
  sku VARCHAR(100),
  category_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Images produits
CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Adresses
CREATE TABLE addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'FR',
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Commandes
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL, -- NULL = commande invité
  status ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  -- Adresse de livraison (snapshot)
  shipping_first_name VARCHAR(100),
  shipping_last_name VARCHAR(100),
  shipping_address VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(2) DEFAULT 'FR',
  shipping_phone VARCHAR(20),
  shipping_email VARCHAR(255),
  -- SumUp
  sumup_checkout_id VARCHAR(255),
  sumup_transaction_id VARCHAR(255),
  -- Sendcloud
  tracking_number VARCHAR(255),
  label_url VARCHAR(500),
  sendcloud_parcel_id INT,
  -- Timestamps
  paid_at TIMESTAMP DEFAULT NULL,
  shipped_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Lignes de commande
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT DEFAULT NULL, -- NULL si produit supprimé
  product_name VARCHAR(255) NOT NULL, -- snapshot
  product_sku VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  weight DECIMAL(8, 3) DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 11. Auth JWT

- **Access token** : durée 15 min, envoyé dans le header `Authorization: Bearer <token>`
- **Refresh token** : durée 7 jours, stocké en `httpOnly cookie` sécurisé
- Endpoints :
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
- Middleware `auth.middleware.js` : vérifie le JWT sur les routes protégées
- Middleware `admin.middleware.js` : vérifie `user.role === 'admin'`

---

## 12. Design & UI

### Identité visuelle
Inspirée de Revolut — **light mode épuré, typographie bold, minimalisme précis** :
- Interface blanc pur, espacement généreux, hiérarchie typographique forte
- Accent violet électrique (`#7C3AED`) sur fond blanc
- Typographie : **Inter uniquement**, poids 900 sur les headings, letter-spacing négatif (`-0.04em`)
- Cards avec border subtile + shadow légère au hover
- Pas de couleurs décoratives — chaque couleur a un rôle sémantique

### Variables CSS globales (globals.css)
```css
:root {
  /* Couleurs */
  --color-primary: #7C3AED;
  --color-primary-hover: #6D28D9;
  --color-primary-light: #EDE9FE;

  --color-bg: #FFFFFF;
  --color-bg-subtle: #F7F7FA;
  --color-surface: #FFFFFF;
  --color-surface-raised: #F4F4F8;

  --color-border: #E8E8EF;
  --color-border-strong: #D0D0DC;

  --color-text: #0A0A0F;
  --color-text-secondary: #50505F;
  --color-text-muted: #8C8CA1;

  /* Feedback */
  --color-success: #059669;
  --color-error: #DC2626;
  --color-warning: #D97706;
  --color-info: #2563EB;

  /* Typographie — Inter uniquement */
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Inter', system-ui, -apple-system, sans-serif;

  /* Espacements — base 4pt */
  --spacing-1: 0.25rem;  --spacing-2: 0.5rem;   --spacing-3: 0.75rem;
  --spacing-4: 1rem;     --spacing-5: 1.25rem;  --spacing-6: 1.5rem;
  --spacing-8: 2rem;     --spacing-10: 2.5rem;  --spacing-12: 3rem;
  --spacing-16: 4rem;    --spacing-20: 5rem;

  /* Bordures */
  --radius-sm: 6px;   --radius-md: 10px;  --radius-lg: 14px;
  --radius-xl: 18px;  --radius-2xl: 24px; --radius-full: 9999px;

  /* Ombres légères */
  --shadow-sm: 0 1px 3px rgba(10,10,15,0.06);
  --shadow-md: 0 4px 6px rgba(10,10,15,0.05);
  --shadow-lg: 0 10px 15px rgba(10,10,15,0.06);
  --shadow-xl: 0 20px 25px rgba(10,10,15,0.08);

  /* Layout */
  --container-max: 1200px;
  --header-height: 64px;
}
```

---

## 13. Déploiement O2switch

### Configuration Phusion Passenger (Node.js)
O2switch utilise cPanel + Phusion Passenger. Le backend Express tourne en tant qu'app Node.js.

```
# Dans cPanel > Setup Node.js App :
Application root : /home/user/ecommerce/server
Application URL : api.rif-line.com
Application startup file : index.js
Node.js version : 20.x
```

### PM2 — développement local uniquement
En production, c'est **Phusion Passenger** qui gère le process Node.js. PM2 n'est utilisé qu'en développement local.

```js
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'rifline-api',
      script: './server/index.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
  ],
};
```

### Build frontend
```bash
cd client && npm run build
# Copier dist/ dans le dossier public_html ou un sous-dossier
```

### Variables d'environnement
Configurées dans cPanel > Setup Node.js App > Environment Variables (pas de fichier .env en production).

### Domaine
- Frontend : `https://rif-line.com` → sert le `dist/` React via Apache O2switch
- Backend API : `https://api.rif-line.com` → Phusion Passenger → Express
- **Convention retenue** : sous-domaine `api.rif-line.com` dédié au backend

### CORS (server/index.js)
```js
app.use(cors({
  origin: process.env.APP_URL,
  credentials: true, // obligatoire pour les cookies httpOnly (refresh token)
}));
```

---

## 14. Catalogue — Pagination

Stratégie : **offset / limit classique**.

- Paramètres query : `?page=1&limit=24`
- Valeurs par défaut : `page=1`, `limit=24`
- Réponse à normaliser :
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 120,
    "totalPages": 5
  }
}
```
- Toujours joindre le `COUNT(*)` dans la même requête (ou requête séparée) pour retourner `total`

---

## 15. Règles absolues

- ❌ Jamais de `console.log` en production (utiliser un logger type `winston` ou logs conditionnels)
- ❌ Jamais de secrets dans le code source (tout en `.env`)
- ❌ Jamais de `SELECT *` — sélectionner les colonnes explicitement
- ❌ Jamais de requêtes SQL avec concaténation de chaînes — toujours des requêtes préparées
- ❌ Jamais de `!important` en CSS
- ❌ Jamais de styles inline dans les composants React
- ✅ Toujours valider les inputs avec `express-validator` dans les routes, vérifier avec `validationResult` en début de controller
- ✅ Toujours hacher les mots de passe avec `bcrypt` (jamais stocker en clair)
- ✅ Toujours gérer les erreurs avec try/catch et retourner des messages utilisateur en français
- ✅ Toujours vérifier la réponse HTTP des appels externes (`response.ok`) avant de parser le JSON
- ✅ Toujours snapshot les données produit dans `order_items` (nom, prix, poids) au moment de la commande
- ✅ Toujours vérifier le stock avant de valider une commande
