# Guide de déploiement — RifLine sur O2switch

---

## Tâches avant déploiement

### 🔴 Bloquant — à faire absolument

- [ ] **Tester le paiement SumUp dans le navigateur** — vérifier le flux complet (frontend → backend → redirection SumUp)
- [ ] **Tester le webhook SumUp** — utiliser ngrok pour exposer localhost, configurer l'URL dans le dashboard SumUp
- [ ] **Décider pour Sendcloud** — abonnement payant ou gestion manuelle des étiquettes par le marchand
- [ ] **Changer les secrets JWT** — remplacer `change_me_jwt_secret` et `change_me_refresh_secret` par des chaînes aléatoires de 64+ caractères

### 🟡 À compléter dès que possible

- [ ] **Pages légales** — remplir les champs `À COMPLÉTER` dans `/mentions-legales`, `/cgv`, `/confidentialite` (SIRET, adresse, raison sociale, dates)
- [ ] **Photos produits** — uploader les images depuis l'admin pour les 27 produits en base
- [ ] **Images hero slider** — remplacer `hero1.webp`, `hero2.png`, `hero3.png` par les vraies photos
- [ ] **Liens réseaux sociaux** — remplacer les `href="#"` Instagram et TikTok dans le footer par les vraies URLs

### 🟢 Après déploiement

- [ ] Configurer l'URL du webhook SumUp en production : `https://api.rif-line.com/api/payment/webhook`
- [ ] Vérifier que les emails de confirmation commande arrivent bien (config SMTP)
- [ ] Faire un test de commande réel de bout en bout sur le site en production

---

## Vue d'ensemble de l'architecture en production

```
Internet
  │
  ▼
Apache (O2switch) ─── rif-line.com ──────── sert le build React (dist/)
  │
  └── api.rif-line.com ─── Phusion Passenger ─── Node.js / Express (server/)
                                                        │
                                                    MySQL (O2switch)
                                                        │
                                                 /uploads/products/ (images)
```

---

## 1. Prérequis O2switch

- Accès cPanel O2switch
- Node.js 20.x disponible via "Setup Node.js App"
- MySQL via phpMyAdmin
- Deux (sous-)domaines configurés :
  - `rif-line.com` → frontend React
  - `api.rif-line.com` → backend Express

---

## 2. Base de données MySQL

### 2.1 Créer la base dans cPanel

Dans cPanel → **MySQL Databases** :
1. Créer la base : `rifline_db`
2. Créer un utilisateur MySQL avec un mot de passe fort
3. Attribuer tous les privilèges à cet utilisateur sur la base

### 2.2 Importer le schéma

Ouvrir phpMyAdmin → sélectionner `rifline_db` → onglet SQL → coller et exécuter :

```sql
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

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(512) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  parent_id INT DEFAULT NULL,
  description TEXT,
  image_url VARCHAR(500),
  FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_price DECIMAL(10, 2) DEFAULT NULL,
  stock INT DEFAULT 0,
  weight DECIMAL(8, 3) DEFAULT 0,
  sku VARCHAR(100),
  category_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

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

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  status ENUM('pending','paid','processing','shipped','delivered','cancelled','refunded') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_first_name VARCHAR(100),
  shipping_last_name VARCHAR(100),
  shipping_address VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_postal_code VARCHAR(20),
  shipping_country VARCHAR(2) DEFAULT 'FR',
  shipping_phone VARCHAR(20),
  shipping_email VARCHAR(255),
  sumup_checkout_id VARCHAR(255),
  sumup_transaction_id VARCHAR(255),
  tracking_number VARCHAR(255),
  label_url VARCHAR(500),
  sendcloud_parcel_id INT,
  paid_at TIMESTAMP DEFAULT NULL,
  shipped_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT DEFAULT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  weight DECIMAL(8, 3) DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Index de performance
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### 2.3 Créer le compte admin

Remplacer le hash ci-dessous par celui généré pour votre mot de passe (voir section Outils) :

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@rif-line.com', '$2b$12$HASH_A_GENERER', 'Admin', 'RifLine', 'admin');
```

Pour générer le hash du mot de passe admin :
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('VOTRE_MOT_DE_PASSE', 12).then(console.log);"
```
(Exécuter depuis le dossier `server/` après `npm install`)

---

## 3. Déploiement du backend (server/)

### 3.1 Uploader les fichiers

Via FTP/SFTP, uploader le dossier `server/` sur O2switch dans :
```
/home/VOTRE_USER/rifline-api/
```

**Ne pas uploader** :
- `node_modules/` (sera installé sur le serveur)
- `.env` (sera configuré via cPanel)
- `public/uploads/` (créer le dossier vide sur le serveur)

### 3.2 Configurer Node.js dans cPanel

Dans cPanel → **Setup Node.js App** → Create Application :

| Champ | Valeur |
|-------|--------|
| Node.js version | 20.x |
| Application mode | Production |
| Application root | `/home/VOTRE_USER/rifline-api` |
| Application URL | `api.rif-line.com` |
| Application startup file | `index.js` |

### 3.3 Variables d'environnement

Dans cPanel → Setup Node.js App → **Environment Variables**, ajouter :

```
PORT=3000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=VOTRE_USER_MYSQL
DB_PASSWORD=VOTRE_MOT_DE_PASSE_MYSQL
DB_NAME=rifline_db

JWT_SECRET=CHAINE_ALEATOIRE_64_CHARS_MIN
JWT_REFRESH_SECRET=AUTRE_CHAINE_ALEATOIRE_64_CHARS_MIN

SUMUP_API_KEY=sk_live_XXXX
SUMUP_MERCHANT_CODE=VOTRE_CODE_MARCHAND
SUMUP_WEBHOOK_SECRET=VOTRE_SECRET_WEBHOOK

SENDCLOUD_PUBLIC_KEY=VOTRE_CLE_PUBLIQUE
SENDCLOUD_SECRET_KEY=VOTRE_CLE_SECRETE

APP_URL=https://rif-line.com
SERVER_URL=https://api.rif-line.com
```

> Pour générer des secrets JWT sécurisés :
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 3.4 Installer les dépendances

Dans cPanel → Setup Node.js App → cliquer **Run NPM Install** (ou via terminal SSH) :
```bash
cd ~/rifline-api && npm install --production
```

### 3.5 Créer le dossier uploads

```bash
mkdir -p ~/rifline-api/public/uploads/products
chmod 755 ~/rifline-api/public/uploads/products
```

### 3.6 Démarrer l'application

Dans cPanel → Setup Node.js App → cliquer **Start App** (ou Restart si déjà lancée).

Phusion Passenger gère le process — pas besoin de PM2 en production.

---

## 4. Déploiement du frontend (client/)

### 4.1 Configurer les variables d'environnement du build

Créer/modifier `client/.env.production` :
```env
VITE_API_URL=https://api.rif-line.com/api
```

### 4.2 Builder le frontend

En local, depuis le dossier `client/` :
```bash
npm run build
```

Cela génère un dossier `client/dist/`.

### 4.3 Uploader le build

Via FTP/SFTP, uploader **le contenu** de `client/dist/` dans :
```
/home/VOTRE_USER/public_html/
```

(ou dans un sous-dossier si le domaine pointe ailleurs)

### 4.4 Configurer Apache pour le routing React

Créer un fichier `.htaccess` dans `public_html/` :
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

Ce fichier est essentiel pour que React Router fonctionne — sans lui, un refresh sur `/catalogue` retourne une 404.

---

## 5. Configuration des domaines et SSL

### 5.1 Domaines

Dans cPanel → **Subdomains** ou **Addon Domains** :
- `rif-line.com` → pointe vers `public_html/`
- `api.rif-line.com` → pointe vers le dossier de l'app Node.js (géré par Passenger)

### 5.2 SSL/HTTPS

Dans cPanel → **SSL/TLS** → **Let's Encrypt** :
- Activer SSL pour `rif-line.com`
- Activer SSL pour `api.rif-line.com`

---

## 6. Configuration des services tiers

### 6.1 SumUp

1. Créer un compte sur [sumup.com](https://sumup.com)
2. Dans le dashboard SumUp → API Keys → générer une clé `sk_live_XXXX`
3. Configurer l'URL de webhook : `https://api.rif-line.com/api/payment/webhook`
4. Récupérer le `merchant_code` dans les paramètres du compte
5. Renseigner `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `SUMUP_WEBHOOK_SECRET` dans les variables d'environnement

### 6.2 Sendcloud

1. Créer un compte sur [sendcloud.com](https://sendcloud.com)
2. Dans Settings → API → générer Public Key et Secret Key
3. Dans Settings → Shipping → configurer les transporteurs souhaités (Colissimo, Chronopost, etc.)
4. Renseigner `SENDCLOUD_PUBLIC_KEY` et `SENDCLOUD_SECRET_KEY` dans les variables d'environnement

---

## 7. Checklist de déploiement

### Avant de mettre en ligne

- [ ] Schéma SQL importé et vérifié dans phpMyAdmin
- [ ] Compte admin créé en base avec mot de passe fort
- [ ] Toutes les variables d'environnement renseignées dans cPanel
- [ ] `NODE_ENV=production` bien configuré
- [ ] JWT_SECRET et JWT_REFRESH_SECRET différents et de 64+ caractères
- [ ] Dossier `public/uploads/products/` créé avec permissions 755
- [ ] `npm install --production` exécuté sur le serveur
- [ ] Application Node.js démarrée dans cPanel

### Build frontend

- [ ] `client/.env.production` contient `VITE_API_URL=https://api.rif-line.com/api`
- [ ] `npm run build` exécuté en local sans erreur
- [ ] Contenu de `dist/` uploadé dans `public_html/`
- [ ] Fichier `.htaccess` présent dans `public_html/`

### Tests post-déploiement

- [ ] `https://rif-line.com` charge la page d'accueil
- [ ] `https://api.rif-line.com/api/products` retourne du JSON (pas d'erreur CORS)
- [ ] Inscription d'un compte client fonctionne
- [ ] Connexion admin fonctionne (`/compte/connexion`)
- [ ] Ajout d'un produit avec image fonctionne
- [ ] Checkout → redirection SumUp fonctionne
- [ ] Webhook SumUp reçu et commande passée en `paid`

---

## 8. Mises à jour futures

### Mise à jour du backend

```bash
# 1. Uploader les nouveaux fichiers server/ via FTP (hors node_modules et .env)
# 2. Dans cPanel → Setup Node.js App → Restart App
```

### Mise à jour du frontend

```bash
# En local
cd client && npm run build

# Uploader client/dist/ dans public_html/ via FTP
# (écraser les anciens fichiers)
```

### Migrations de base de données

Il n'y a pas de système de migration automatique. Pour chaque modification de schéma :
1. Écrire le SQL `ALTER TABLE` correspondant
2. L'exécuter dans phpMyAdmin
3. Redéployer le backend si le code a changé

---

## 9. Structure des fichiers sur le serveur

```
/home/VOTRE_USER/
├── public_html/               ← Frontend React (build)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
│
└── rifline-api/               ← Backend Node.js
    ├── index.js
    ├── package.json
    ├── config/
    ├── controllers/
    ├── middlewares/
    ├── repositories/
    ├── routes/
    ├── services/
    ├── utils/
    ├── node_modules/          ← généré par npm install
    └── public/
        └── uploads/
            └── products/      ← images uploadées (à sauvegarder !)
```

> **Important** : le dossier `public/uploads/products/` contient les images produits. Pensez à le sauvegarder régulièrement — il n'est pas versionné dans git.

---

## 10. Variables d'environnement — référence complète

| Variable | Dev (local) | Prod (O2switch) | Description |
|----------|------------|-----------------|-------------|
| `PORT` | `3000` | `3000` | Port Express |
| `NODE_ENV` | `development` | `production` | Mode Node |
| `DB_HOST` | `localhost` | `localhost` | Hôte MySQL |
| `DB_PORT` | `8889` (MAMP) | `3306` | Port MySQL |
| `DB_USER` | `root` | user cPanel | Utilisateur MySQL |
| `DB_PASSWORD` | `root` | mot de passe fort | Mot de passe MySQL |
| `DB_NAME` | `rifline` | `rifline_db` | Nom de la base |
| `JWT_SECRET` | `change_me_...` | 64+ chars random | Secret access token |
| `JWT_REFRESH_SECRET` | `change_me_...` | 64+ chars random | Secret refresh token |
| `SUMUP_API_KEY` | `sk_test_XXXX` | `sk_live_XXXX` | Clé SumUp |
| `SUMUP_MERCHANT_CODE` | — | code marchand | Code marchand SumUp |
| `SUMUP_WEBHOOK_SECRET` | — | secret webhook | Validation webhooks |
| `SENDCLOUD_PUBLIC_KEY` | clé test | clé prod | Clé publique Sendcloud |
| `SENDCLOUD_SECRET_KEY` | clé test | clé prod | Clé secrète Sendcloud |
| `APP_URL` | `http://localhost:5173` | `https://rif-line.com` | URL frontend (CORS + redirects SumUp) |
| `SERVER_URL` | `http://localhost:3000` | `https://api.rif-line.com` | URL API (URLs absolues des images) |
